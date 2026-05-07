"""
Push-уведомления БетСпорт. v2
POST {action: "subscribe"}   — сохранить подписку браузера
POST {action: "unsubscribe"} — удалить подписку
POST {action: "send_settle"} — расчитать ставки и отправить push-уведомление
"""
import json
import os
import jwt
import psycopg2
from pywebpush import webpush, WebPushException

SCHEMA = os.environ["MAIN_DB_SCHEMA"]
JWT_SECRET = os.environ["JWT_SECRET"]
JWT_ALGO = "HS256"
VAPID_PRIVATE_KEY = os.environ.get("VAPID_PRIVATE_KEY", "")
VAPID_PUBLIC_KEY = os.environ.get("VAPID_PUBLIC_KEY", "")
VAPID_CLAIMS = {"sub": "mailto:support@betsport.ru"}

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Content-Type": "application/json",
}


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def get_user_id(event: dict) -> int:
    auth = event.get("headers", {}).get("X-Authorization", "")
    if not auth.startswith("Bearer "):
        raise PermissionError("Токен не передан")
    payload = jwt.decode(auth[7:], JWT_SECRET, algorithms=[JWT_ALGO])
    return payload["sub"]


def send_push(endpoint: str, p256dh: str, auth: str, payload: dict) -> bool:
    try:
        webpush(
            subscription_info={"endpoint": endpoint, "keys": {"p256dh": p256dh, "auth": auth}},
            data=json.dumps(payload, ensure_ascii=False),
            vapid_private_key=VAPID_PRIVATE_KEY,
            vapid_claims=VAPID_CLAIMS,
        )
        return True
    except WebPushException:
        return False


def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    try:
        user_id = get_user_id(event)
    except PermissionError as e:
        return {"statusCode": 401, "headers": CORS, "body": json.dumps({"error": str(e)})}
    except Exception:
        return {"statusCode": 401, "headers": CORS, "body": json.dumps({"error": "Токен недействителен"})}

    body = json.loads(event.get("body") or "{}")
    action = body.get("action", "")

    # ── SUBSCRIBE ──────────────────────────────────────────────────────────────
    if action == "subscribe":
        endpoint = body.get("endpoint", "")
        p256dh = body.get("p256dh", "")
        auth = body.get("auth", "")

        if not endpoint or not p256dh or not auth:
            return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "Неверные данные подписки"})}

        conn = get_conn()
        cur = conn.cursor()
        cur.execute(
            f"INSERT INTO {SCHEMA}.push_subscriptions (user_id, endpoint, p256dh, auth) "
            "VALUES (%s, %s, %s, %s) ON CONFLICT (endpoint) DO UPDATE SET user_id = EXCLUDED.user_id",
            (user_id, endpoint, p256dh, auth)
        )
        conn.commit()
        cur.close()
        conn.close()

        return {"statusCode": 200, "headers": CORS, "body": json.dumps({"ok": True})}

    # ── UNSUBSCRIBE ─────────────────────────────────────────────────────────────
    if action == "unsubscribe":
        endpoint = body.get("endpoint", "")
        conn = get_conn()
        cur = conn.cursor()
        cur.execute(
            f"UPDATE {SCHEMA}.push_subscriptions SET user_id = user_id "
            f"WHERE endpoint = %s AND user_id = %s",
            (endpoint, user_id)
        )
        # Помечаем удалённой через временную таблицу нет — просто удаляем запись
        cur.execute(
            f"DELETE FROM {SCHEMA}.push_subscriptions WHERE endpoint = %s AND user_id = %s",
            (endpoint, user_id)
        )
        conn.commit()
        cur.close()
        conn.close()
        return {"statusCode": 200, "headers": CORS, "body": json.dumps({"ok": True})}

    # ── SEND_SETTLE: расчёт ставок + push ─────────────────────────────────────
    if action == "send_settle":
        import random
        from datetime import datetime, timezone, timedelta

        SETTLE_AFTER_SECONDS = 60
        WIN_PROBABILITY = 0.45
        cutoff = datetime.now(timezone.utc) - timedelta(seconds=SETTLE_AFTER_SECONDS)

        conn = get_conn()
        cur = conn.cursor()

        cur.execute(
            f"SELECT id, amount, potential_win, odds, event_name FROM {SCHEMA}.bets "
            f"WHERE user_id = %s AND status = 'pending' AND placed_at < %s FOR UPDATE",
            (user_id, cutoff)
        )
        pending = cur.fetchall()

        if not pending:
            cur.close()
            conn.close()
            return {"statusCode": 200, "headers": CORS, "body": json.dumps({"settled": 0})}

        wins = 0
        losses = 0
        total_payout = 0.0
        win_names = []
        loss_names = []

        for bet_id, amount, potential_win, odds, event_name in pending:
            amount = float(amount)
            potential_win = float(potential_win)
            win_chance = WIN_PROBABILITY / max(float(odds) / 2.0, 1.0)
            win_chance = max(0.15, min(win_chance, 0.65))
            is_win = random.random() < win_chance

            if is_win:
                wins += 1
                total_payout += potential_win
                win_names.append(event_name)
                cur.execute(
                    f"UPDATE {SCHEMA}.users SET balance = balance + %s, "
                    "won_bets = won_bets + 1, updated_at = NOW() WHERE id = %s",
                    (potential_win, user_id)
                )
                cur.execute(f"UPDATE {SCHEMA}.bets SET status = 'win' WHERE id = %s", (bet_id,))
            else:
                losses += 1
                loss_names.append(event_name)
                cur.execute(
                    f"UPDATE {SCHEMA}.users SET lost_bets = lost_bets + 1, updated_at = NOW() WHERE id = %s",
                    (user_id,)
                )
                cur.execute(f"UPDATE {SCHEMA}.bets SET status = 'loss' WHERE id = %s", (bet_id,))

        conn.commit()

        cur.execute(f"SELECT balance FROM {SCHEMA}.users WHERE id = %s", (user_id,))
        new_balance = float(cur.fetchone()[0])

        # Отправляем push-уведомления всем подпискам пользователя
        cur.execute(
            f"SELECT endpoint, p256dh, auth FROM {SCHEMA}.push_subscriptions WHERE user_id = %s",
            (user_id,)
        )
        subscriptions = cur.fetchall()
        cur.close()
        conn.close()

        if subscriptions and VAPID_PRIVATE_KEY:
            if wins > 0:
                push_payload = {
                    "title": f"🏆 Выигрыш! +{total_payout:,.0f} ₽".replace(",", " "),
                    "body": f"{win_names[0][:50]} — ставка сыграла! Баланс: {new_balance:,.0f} ₽".replace(",", " "),
                    "win": True,
                    "tag": "bet-result-win",
                    "url": "/?section=profile",
                }
            else:
                first_loss = loss_names[0] if loss_names else "Ставка"
                push_payload = {
                    "title": "❌ Ставка не сыграла",
                    "body": f"{first_loss[:50]} — не повезло. Попробуй ещё!",
                    "win": False,
                    "tag": "bet-result-loss",
                    "url": "/?section=bets",
                }

            for endpoint, p256dh, auth in subscriptions:
                send_push(endpoint, p256dh, auth, push_payload)

        return {
            "statusCode": 200,
            "headers": CORS,
            "body": json.dumps({
                "settled": len(pending),
                "wins": wins,
                "losses": losses,
                "payout": round(total_payout, 2),
                "new_balance": new_balance,
            }),
        }

    # ── VAPID PUBLIC KEY ────────────────────────────────────────────────────────
    if action == "vapid_key":
        return {
            "statusCode": 200,
            "headers": CORS,
            "body": json.dumps({"public_key": VAPID_PUBLIC_KEY}),
        }

    return {"statusCode": 404, "headers": CORS, "body": json.dumps({"error": "Not found"})}