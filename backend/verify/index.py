"""
Верификация пользователей БетСпорт.
POST {action: "submit"}  — подать заявку (данные + фото в base64)
GET  /                   — получить статус верификации текущего пользователя
"""
import json
import os
import base64
import uuid
import jwt
import psycopg2
import boto3
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


def get_s3():
    return boto3.client(
        "s3",
        endpoint_url="https://bucket.poehali.dev",
        aws_access_key_id=os.environ["AWS_ACCESS_KEY_ID"],
        aws_secret_access_key=os.environ["AWS_SECRET_ACCESS_KEY"],
    )


def upload_photo(b64data: str, user_id: int, label: str) -> str:
    """Загружает base64-фото в S3, возвращает CDN URL."""
    if not b64data or not b64data.strip():
        return ""
    # Убираем data URI prefix если есть
    if "," in b64data:
        b64data = b64data.split(",", 1)[1]
    raw = base64.b64decode(b64data)
    key = f"verification/{user_id}/{label}_{uuid.uuid4().hex[:8]}.jpg"
    s3 = get_s3()
    s3.put_object(Bucket="files", Key=key, Body=raw, ContentType="image/jpeg")
    cdn = f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{key}"
    return cdn


def handler(event: dict, context) -> dict:
    """Верификация личности пользователя — подача и проверка статуса заявки."""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    try:
        user_id = get_user_id(event)
    except Exception:
        return {"statusCode": 401, "headers": CORS, "body": json.dumps({"error": "Необходима авторизация"})}

    method = event.get("httpMethod", "GET")
    conn = get_conn()
    cur = conn.cursor()

    # ── GET: статус верификации ──────────────────────────────────
    if method == "GET":
        cur.execute(
            f"SELECT id, status, full_name, birth_date, doc_type, reject_reason, created_at, updated_at "
            f"FROM {SCHEMA}.verification_requests WHERE user_id = %s ORDER BY created_at DESC LIMIT 1",
            (user_id,)
        )
        row = cur.fetchone()
        cur.close()
        conn.close()

        if not row:
            return {"statusCode": 200, "headers": CORS, "body": json.dumps({"status": "not_submitted"})}

        return {
            "statusCode": 200,
            "headers": CORS,
            "body": json.dumps({
                "id": row[0],
                "status": row[1],
                "full_name": row[2],
                "birth_date": str(row[3]) if row[3] else None,
                "doc_type": row[4],
                "reject_reason": row[5],
                "created_at": row[6].isoformat() if row[6] else None,
                "updated_at": row[7].isoformat() if row[7] else None,
            }),
        }

    # ── POST: подача заявки ──────────────────────────────────────
    body = json.loads(event.get("body") or "{}")
    action = body.get("action", "")

    if action == "submit":
        full_name  = str(body.get("full_name", "")).strip()
        birth_date = str(body.get("birth_date", "")).strip()
        doc_type   = str(body.get("doc_type", "")).strip()
        doc_number = str(body.get("doc_number", "")).strip()
        photo_front = body.get("doc_photo_front", "")
        photo_back  = body.get("doc_photo_back", "")
        selfie      = body.get("selfie_photo", "")

        if not full_name:
            cur.close(); conn.close()
            return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "Укажите ФИО"})}
        if not birth_date:
            cur.close(); conn.close()
            return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "Укажите дату рождения"})}
        if not doc_type:
            cur.close(); conn.close()
            return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "Укажите тип документа"})}
        if not doc_number:
            cur.close(); conn.close()
            return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "Укажите номер документа"})}
        if not photo_front:
            cur.close(); conn.close()
            return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "Загрузите фото документа (лицевая сторона)"})}
        if not selfie:
            cur.close(); conn.close()
            return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "Загрузите селфи с документом"})}

        # Проверяем: нет ли уже одобренной или ожидающей заявки
        cur.execute(
            f"SELECT status FROM {SCHEMA}.verification_requests WHERE user_id = %s ORDER BY created_at DESC LIMIT 1",
            (user_id,)
        )
        existing = cur.fetchone()
        if existing and existing[0] in ("pending", "approved"):
            cur.close(); conn.close()
            status_label = "На рассмотрении" if existing[0] == "pending" else "Уже одобрена"
            return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": f"Заявка уже существует: {status_label}"})}

        # Загружаем фото в S3
        url_front = upload_photo(photo_front, user_id, "front")
        url_back  = upload_photo(photo_back,  user_id, "back") if photo_back else ""
        url_selfie = upload_photo(selfie, user_id, "selfie")

        # Сохраняем заявку
        cur.execute(
            f"INSERT INTO {SCHEMA}.verification_requests "
            "(user_id, status, full_name, birth_date, doc_type, doc_number, doc_photo_front, doc_photo_back, selfie_photo) "
            "VALUES (%s, 'pending', %s, %s, %s, %s, %s, %s, %s) RETURNING id",
            (user_id, full_name, birth_date, doc_type, doc_number, url_front, url_back, url_selfie)
        )
        new_id = cur.fetchone()[0]
        conn.commit()
        cur.close()
        conn.close()

        return {
            "statusCode": 200,
            "headers": CORS,
            "body": json.dumps({
                "success": True,
                "id": new_id,
                "message": "Заявка принята! Проверка занимает до 24 часов.",
            }),
        }

    cur.close()
    conn.close()
    return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "Неизвестное действие"})}
