"""
Авторизация и регистрация пользователей БетСпорт. v2
POST {action: "register"} — создать аккаунт
POST {action: "login"}    — войти, получить токен
GET  /                    — данные текущего пользователя (Bearer токен)
"""
import json
import os
import jwt
import bcrypt
import psycopg2
from datetime import datetime, timedelta, timezone

SCHEMA = os.environ["MAIN_DB_SCHEMA"]
JWT_SECRET = os.environ["JWT_SECRET"]
JWT_ALGO = "HS256"
TOKEN_TTL_DAYS = 30

CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Content-Type": "application/json",
}


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def make_token(user_id: int) -> str:
    payload = {
        "sub": user_id,
        "exp": datetime.now(timezone.utc) + timedelta(days=TOKEN_TTL_DAYS),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGO)


def decode_token(token: str) -> int:
    payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGO])
    return payload["sub"]


def user_to_dict(row) -> dict:
    return {
        "id": row[0],
        "email": row[1],
        "username": row[2],
        "balance": float(row[3]),
        "bonus_balance": float(row[4]),
        "status": row[5],
        "rating_points": row[6],
        "total_bets": row[7],
        "won_bets": row[8],
        "lost_bets": row[9],
        "is_verified": row[10],
        "created_at": row[11].isoformat() if row[11] else None,
    }


def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS_HEADERS, "body": ""}

    method = event.get("httpMethod", "GET")

    # ── GET /  →  /me  ─────────────────────────────────────────────────────────
    if method == "GET":
        auth = event.get("headers", {}).get("X-Authorization", "")
        if not auth.startswith("Bearer "):
            return {
                "statusCode": 401,
                "headers": CORS_HEADERS,
                "body": json.dumps({"error": "Токен не передан"}),
            }
        try:
            user_id = decode_token(auth[7:])
        except Exception:
            return {
                "statusCode": 401,
                "headers": CORS_HEADERS,
                "body": json.dumps({"error": "Токен недействителен"}),
            }

        conn = get_conn()
        cur = conn.cursor()
        cur.execute(
            "SELECT id, email, username, balance, bonus_balance, status, "
            "rating_points, total_bets, won_bets, lost_bets, is_verified, "
            f"created_at FROM {SCHEMA}.users WHERE id = %s",
            (user_id,),
        )
        row = cur.fetchone()
        cur.close()
        conn.close()

        if not row:
            return {
                "statusCode": 404,
                "headers": CORS_HEADERS,
                "body": json.dumps({"error": "Пользователь не найден"}),
            }

        return {
            "statusCode": 200,
            "headers": CORS_HEADERS,
            "body": json.dumps({"user": user_to_dict(row)}),
        }

    # ── POST  ──────────────────────────────────────────────────────────────────
    if method == "POST":
        body = json.loads(event.get("body") or "{}")
        action = body.get("action", "")

        # ── REGISTER ──────────────────────────────────────────────────────────
        if action == "register":
            email = (body.get("email") or "").strip().lower()
            username = (body.get("username") or "").strip()
            password = body.get("password") or ""

            if not email or not username or not password:
                return {
                    "statusCode": 400,
                    "headers": CORS_HEADERS,
                    "body": json.dumps({"error": "Заполни все поля"}),
                }
            if len(password) < 6:
                return {
                    "statusCode": 400,
                    "headers": CORS_HEADERS,
                    "body": json.dumps({"error": "Пароль минимум 6 символов"}),
                }

            pw_hash = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

            conn = get_conn()
            cur = conn.cursor()
            try:
                cur.execute(
                    f"INSERT INTO {SCHEMA}.users (email, username, password_hash) "
                    "VALUES (%s, %s, %s) RETURNING id, email, username, balance, "
                    "bonus_balance, status, rating_points, total_bets, won_bets, "
                    "lost_bets, is_verified, created_at",
                    (email, username, pw_hash),
                )
                row = cur.fetchone()
                conn.commit()
            except psycopg2.Error as e:
                conn.rollback()
                err_str = str(e).lower()
                if "unique" not in err_str and getattr(e, "pgcode", "") != "23505":
                    raise
                return {
                    "statusCode": 409,
                    "headers": CORS_HEADERS,
                    "body": json.dumps({"error": "Email или логин уже занят"}),
                }
            finally:
                cur.close()
                conn.close()

            user = user_to_dict(row)
            token = make_token(user["id"])
            return {
                "statusCode": 201,
                "headers": CORS_HEADERS,
                "body": json.dumps({"token": token, "user": user}),
            }

        # ── LOGIN ──────────────────────────────────────────────────────────────
        if action == "login":
            email = (body.get("email") or "").strip().lower()
            password = body.get("password") or ""

            if not email or not password:
                return {
                    "statusCode": 400,
                    "headers": CORS_HEADERS,
                    "body": json.dumps({"error": "Введи email и пароль"}),
                }

            conn = get_conn()
            cur = conn.cursor()
            cur.execute(
                "SELECT id, email, username, balance, bonus_balance, status, "
                "rating_points, total_bets, won_bets, lost_bets, is_verified, "
                f"created_at, password_hash FROM {SCHEMA}.users WHERE email = %s",
                (email,),
            )
            row = cur.fetchone()
            cur.close()
            conn.close()

            if not row or not bcrypt.checkpw(password.encode(), row[12].encode()):
                return {
                    "statusCode": 401,
                    "headers": CORS_HEADERS,
                    "body": json.dumps({"error": "Неверный email или пароль"}),
                }

            user = user_to_dict(row[:12])
            token = make_token(user["id"])
            return {
                "statusCode": 200,
                "headers": CORS_HEADERS,
                "body": json.dumps({"token": token, "user": user}),
            }

    return {
        "statusCode": 404,
        "headers": CORS_HEADERS,
        "body": json.dumps({"error": "Not found"}),
    }