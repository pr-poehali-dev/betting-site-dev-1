"""
Ставки БетСпорт.
POST {action: "place"}   — сделать ставку (списать баланс)
GET  {action: "history"} — история ставок пользователя
"""
import json
import os
import jwt
import psycopg2
from datetime import datetime, timezone

SCHEMA = os.environ["MAIN_DB_SCHEMA"]
JWT_SECRET = os.environ["JWT_SECRET"]
JWT_ALGO = "HS256"

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


def bet_to_dict(row) -> dict:
    return {
        "id": row[0],
        "event_id": row[1],
        "event_name": row[2],
        "league": row[3],
        "sport": row[4],
        "outcome_type": row[5],
        "outcome_label": row[6],
        "odds": float(row[7]),
        "amount": float(row[8]),
        "potential_win": float(row[9]),
        "status": row[10],
        "placed_at": row[11].isoformat() if row[11] else None,
    }


def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    # --- AUTH ---
    try:
        user_id = get_user_id(event)
    except PermissionError as e:
        return {"statusCode": 401, "headers": CORS, "body": json.dumps({"error": str(e)})}
    except Exception:
        return {"statusCode": 401, "headers": CORS, "body": json.dumps({"error": "Токен недействителен"})}

    method = event.get("httpMethod", "GET")
    body = json.loads(event.get("body") or "{}") if method == "POST" else {}
    action = body.get("action") or event.get("queryStringParameters", {}).get("action", "history")

    # ── PLACE BET ──────────────────────────────────────────────────────────────
    if action == "place":
        bets_data = body.get("bets", [])
        amount = float(body.get("amount", 0))

        if not bets_data:
            return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "Нет исходов в купоне"})}
        if amount < 10:
            return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "Минимальная ставка 10 ₽"})}

        # Считаем итоговый коэффициент (экспресс)
        total_odds = 1.0
        for b in bets_data:
            total_odds *= float(b.get("odds", 1))

        potential_win = round(amount * total_odds, 2)

        conn = get_conn()
        cur = conn.cursor()

        # Проверяем баланс
        cur.execute(f"SELECT balance FROM {SCHEMA}.users WHERE id = %s FOR UPDATE", (user_id,))
        row = cur.fetchone()
        if not row:
            cur.close(); conn.close()
            return {"statusCode": 404, "headers": CORS, "body": json.dumps({"error": "Пользователь не найден"})}

        balance = float(row[0])
        if balance < amount:
            cur.close(); conn.close()
            return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": f"Недостаточно средств. Баланс: {balance:.0f} ₽"})}

        # Списываем баланс
        cur.execute(
            f"UPDATE {SCHEMA}.users SET balance = balance - %s, total_bets = total_bets + 1, updated_at = NOW() WHERE id = %s",
            (amount, user_id)
        )

        # Записываем каждый исход как отдельную ставку (или один экспресс)
        is_express = len(bets_data) > 1
        inserted_ids = []

        if is_express:
            # Экспресс — одна запись со всеми матчами
            names = " + ".join(b.get("event_name", "") for b in bets_data)
            cur.execute(
                f"INSERT INTO {SCHEMA}.bets "
                "(user_id, event_id, event_name, league, sport, outcome_type, outcome_label, odds, amount, potential_win) "
                "VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s) RETURNING id",
                (
                    user_id,
                    0,
                    names[:255],
                    "Экспресс",
                    "multi",
                    "express",
                    f"Экспресс x{len(bets_data)}",
                    round(total_odds, 2),
                    amount,
                    potential_win,
                )
            )
            inserted_ids.append(cur.fetchone()[0])
        else:
            b = bets_data[0]
            cur.execute(
                f"INSERT INTO {SCHEMA}.bets "
                "(user_id, event_id, event_name, league, sport, outcome_type, outcome_label, odds, amount, potential_win) "
                "VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s) RETURNING id",
                (
                    user_id,
                    int(b.get("event_id", 0)),
                    str(b.get("event_name", ""))[:255],
                    str(b.get("league", ""))[:100],
                    str(b.get("sport", ""))[:50],
                    str(b.get("outcome_type", ""))[:10],
                    str(b.get("outcome_label", ""))[:20],
                    float(b.get("odds", 1)),
                    amount,
                    potential_win,
                )
            )
            inserted_ids.append(cur.fetchone()[0])

        conn.commit()

        # Возвращаем новый баланс
        cur.execute(f"SELECT balance FROM {SCHEMA}.users WHERE id = %s", (user_id,))
        new_balance = float(cur.fetchone()[0])
        cur.close()
        conn.close()

        return {
            "statusCode": 200,
            "headers": CORS,
            "body": json.dumps({
                "success": True,
                "message": "Ставка принята!",
                "new_balance": new_balance,
                "potential_win": potential_win,
                "total_odds": round(total_odds, 2),
            }),
        }

    # ── HISTORY ────────────────────────────────────────────────────────────────
    params = event.get("queryStringParameters") or {}
    limit = int(params.get("limit", 20))
    offset = int(params.get("offset", 0))

    conn = get_conn()
    cur = conn.cursor()
    cur.execute(
        f"SELECT id, event_id, event_name, league, sport, outcome_type, outcome_label, "
        f"odds, amount, potential_win, status, placed_at "
        f"FROM {SCHEMA}.bets WHERE user_id = %s ORDER BY placed_at DESC LIMIT %s OFFSET %s",
        (user_id, limit, offset)
    )
    rows = cur.fetchall()

    cur.execute(f"SELECT COUNT(*) FROM {SCHEMA}.bets WHERE user_id = %s", (user_id,))
    total = cur.fetchone()[0]

    cur.close()
    conn.close()

    return {
        "statusCode": 200,
        "headers": CORS,
        "body": json.dumps({
            "bets": [bet_to_dict(r) for r in rows],
            "total": total,
        }),
    }
