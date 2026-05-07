"""
Получение реальных спортивных событий и коэффициентов через The Odds API.
GET /          — список событий по видам спорта (с кэшем 10 мин)
GET ?sport=... — конкретный вид спорта
GET ?live=1    — только live-события
"""
import json
import os
import time
import urllib.request
import urllib.parse
import psycopg2

SCHEMA = os.environ["MAIN_DB_SCHEMA"]

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
}

# Виды спорта: ключ The Odds API → русское название + эмодзи
SPORTS_MAP = {
    "soccer_uefa_champs_league":    {"name": "Лига чемпионов",   "category": "Футбол",     "emoji": "⚽"},
    "soccer_epl":                   {"name": "АПЛ",              "category": "Футбол",     "emoji": "⚽"},
    "soccer_spain_la_liga":         {"name": "Ла Лига",          "category": "Футбол",     "emoji": "⚽"},
    "soccer_germany_bundesliga":    {"name": "Бундеслига",       "category": "Футбол",     "emoji": "⚽"},
    "soccer_italy_serie_a":         {"name": "Серия А",          "category": "Футбол",     "emoji": "⚽"},
    "soccer_france_ligue_one":      {"name": "Лига 1",           "category": "Футбол",     "emoji": "⚽"},
    "basketball_nba":               {"name": "НБА",              "category": "Баскетбол",  "emoji": "🏀"},
    "basketball_euroleague":        {"name": "Евролига",         "category": "Баскетбол",  "emoji": "🏀"},
    "tennis_atp_french_open":       {"name": "Ролан Гаррос",     "category": "Теннис",     "emoji": "🎾"},
    "tennis_atp_wimbledon":         {"name": "Уимблдон",         "category": "Теннис",     "emoji": "🎾"},
    "tennis_atp_us_open":           {"name": "US Open",          "category": "Теннис",     "emoji": "🎾"},
    "icehockey_nhl":                {"name": "НХЛ",              "category": "Хоккей",     "emoji": "🏒"},
    "mma_mixed_martial_arts":       {"name": "UFC/MMA",          "category": "ММА",        "emoji": "🥊"},
    "americanfootball_nfl":         {"name": "НФЛ",              "category": "Американский футбол", "emoji": "🏈"},
}

# Резервные события на случай если нет API ключа или лимит исчерпан
FALLBACK_EVENTS = [
    {"id": "fb1", "sport": "⚽", "category": "Футбол", "league": "Лига чемпионов", "home": "Реал Мадрид", "away": "Бавария", "date": "Сег. 21:00", "commence_time": "", "odds": {"w1": 2.10, "x": 3.50, "w2": 3.40}, "is_live": False},
    {"id": "fb2", "sport": "⚽", "category": "Футбол", "league": "АПЛ", "home": "Манчестер Сити", "away": "Арсенал", "date": "Завт. 18:30", "commence_time": "", "odds": {"w1": 1.85, "x": 3.60, "w2": 4.20}, "is_live": False},
    {"id": "fb3", "sport": "⚽", "category": "Футбол", "league": "Ла Лига", "home": "Барселона", "away": "Атлетико", "date": "Завт. 22:00", "commence_time": "", "odds": {"w1": 2.05, "x": 3.40, "w2": 3.60}, "is_live": False},
    {"id": "fb4", "sport": "🏀", "category": "Баскетбол", "league": "НБА", "home": "Голден Стейт", "away": "Бостон", "date": "Сег. 02:30", "commence_time": "", "odds": {"w1": 1.90, "x": None, "w2": 1.95}, "is_live": False},
    {"id": "fb5", "sport": "🏀", "category": "Баскетбол", "league": "НБА", "home": "Лейкерс", "away": "Клипперс", "date": "Завт. 04:00", "commence_time": "", "odds": {"w1": 2.15, "x": None, "w2": 1.75}, "is_live": False},
    {"id": "fb6", "sport": "🎾", "category": "Теннис", "league": "Ролан Гаррос", "home": "Синнер", "away": "Алькарас", "date": "Сег. 14:00", "commence_time": "", "odds": {"w1": 1.85, "x": None, "w2": 2.00}, "is_live": False},
    {"id": "fb7", "sport": "🏒", "category": "Хоккей", "league": "НХЛ Плей-офф", "home": "Авалэнш", "away": "Ойлерз", "date": "Завт. 03:00", "commence_time": "", "odds": {"w1": 1.80, "x": 3.80, "w2": 2.10}, "is_live": False},
    {"id": "fb8", "sport": "🥊", "category": "ММА", "league": "UFC", "home": "Адесанья", "away": "Дю Плесси", "date": "Суб. 04:00", "commence_time": "", "odds": {"w1": 2.20, "x": None, "w2": 1.70}, "is_live": False},
    {"id": "fb9", "sport": "⚽", "category": "Футбол", "league": "Серия А", "home": "Интер", "away": "Ювентус", "date": "Сег. 20:45", "commence_time": "", "odds": {"w1": 2.40, "x": 3.20, "w2": 3.00}, "is_live": False},
    {"id": "fb10", "sport": "⚽", "category": "Футбол", "league": "Бундеслига", "home": "Бавария", "away": "Боруссия Д", "date": "Завт. 17:30", "commence_time": "", "odds": {"w1": 1.70, "x": 3.80, "w2": 5.00}, "is_live": False},
]


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def ensure_cache_table(cur):
    cur.execute(f"""
        CREATE TABLE IF NOT EXISTS {SCHEMA}.events_cache (
            id SERIAL PRIMARY KEY,
            cache_key VARCHAR(100) UNIQUE NOT NULL,
            data TEXT NOT NULL,
            updated_at TIMESTAMP DEFAULT NOW()
        )
    """)


def get_cache(cur, cache_key: str, ttl_seconds: int = 600):
    cur.execute(
        f"SELECT data, updated_at FROM {SCHEMA}.events_cache WHERE cache_key = %s",
        (cache_key,)
    )
    row = cur.fetchone()
    if not row:
        return None
    data, updated_at = row
    age = time.time() - updated_at.timestamp()
    if age > ttl_seconds:
        return None
    return json.loads(data)


def set_cache(cur, cache_key: str, data):
    payload = json.dumps(data, ensure_ascii=False)
    cur.execute(f"""
        INSERT INTO {SCHEMA}.events_cache (cache_key, data, updated_at)
        VALUES (%s, %s, NOW())
        ON CONFLICT (cache_key) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()
    """, (cache_key, payload))


def format_date(commence_time: str) -> str:
    if not commence_time:
        return ""
    try:
        from datetime import datetime, timezone, timedelta
        dt = datetime.fromisoformat(commence_time.replace("Z", "+00:00"))
        msk = dt + timedelta(hours=3)
        now = datetime.now(timezone.utc) + timedelta(hours=3)
        if msk.date() == now.date():
            return f"Сег. {msk.strftime('%H:%M')}"
        elif msk.date() == (now + timedelta(days=1)).date():
            return f"Завт. {msk.strftime('%H:%M')}"
        else:
            return msk.strftime("%d.%m %H:%M")
    except Exception:
        return commence_time[:10]


def fetch_odds_api(sport_key: str, api_key: str, live: bool = False) -> list:
    in_play = "true" if live else "false"
    params = urllib.parse.urlencode({
        "apiKey": api_key,
        "regions": "eu",
        "markets": "h2h",
        "oddsFormat": "decimal",
        "dateFormat": "iso",
        "commenceTimeFrom": "",
    })
    # Убираем пустые параметры
    params = f"apiKey={api_key}&regions=eu&markets=h2h&oddsFormat=decimal&dateFormat=iso"
    if live:
        params += "&inplay=true"

    url = f"https://api.the-odds-api.com/v4/sports/{sport_key}/odds/?{params}"
    req = urllib.request.Request(url, headers={"User-Agent": "BetSport/1.0"})
    with urllib.request.urlopen(req, timeout=8) as resp:
        return json.loads(resp.read().decode())


def parse_event(raw: dict, sport_meta: dict) -> dict | None:
    bookmakers = raw.get("bookmakers", [])
    if not bookmakers:
        return None

    # Берём первый букмекер с рынком h2h
    h2h = None
    for bm in bookmakers:
        for market in bm.get("markets", []):
            if market.get("key") == "h2h":
                h2h = market
                break
        if h2h:
            break

    if not h2h:
        return None

    outcomes = {o["name"]: o["price"] for o in h2h.get("outcomes", [])}
    home = raw.get("home_team", "")
    away = raw.get("away_team", "")

    w1 = outcomes.get(home)
    w2 = outcomes.get(away)
    draw_teams = [k for k in outcomes if k not in (home, away)]
    x = outcomes.get(draw_teams[0]) if draw_teams else None

    if not w1 or not w2:
        return None

    return {
        "id": raw.get("id", ""),
        "sport": sport_meta["emoji"],
        "category": sport_meta["category"],
        "league": sport_meta["name"],
        "home": home,
        "away": away,
        "date": format_date(raw.get("commence_time", "")),
        "commence_time": raw.get("commence_time", ""),
        "odds": {
            "w1": round(float(w1), 2),
            "x": round(float(x), 2) if x else None,
            "w2": round(float(w2), 2),
        },
        "is_live": raw.get("is_live", False),
    }


def fetch_all_events(api_key: str, live: bool = False) -> list:
    import sys
    events = []
    for sport_key, meta in SPORTS_MAP.items():
        try:
            raw_events = fetch_odds_api(sport_key, api_key, live=live)
            print(f"[events] {sport_key}: got {len(raw_events)} events", file=sys.stderr)
            for raw in raw_events[:6]:
                parsed = parse_event(raw, meta)
                if parsed:
                    events.append(parsed)
        except Exception as e:
            print(f"[events] {sport_key} error: {e}", file=sys.stderr)
            continue
        if len(events) >= 50:
            break
    print(f"[events] total parsed: {len(events)}", file=sys.stderr)
    return events


def handler(event: dict, context) -> dict:
    """Получить реальные спортивные события с коэффициентами."""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    import sys
    params = event.get("queryStringParameters") or {}
    sport_filter = params.get("sport", "")
    live_only = params.get("live", "0") == "1"
    force_refresh = params.get("refresh", "0") == "1"

    api_key = os.environ.get("THE_ODDS_API_KEY", "")
    print(f"[events] api_key present: {bool(api_key)}, live={live_only}, refresh={force_refresh}", file=sys.stderr)

    conn = get_conn()
    cur = conn.cursor()
    ensure_cache_table(cur)
    conn.commit()

    # Кэш: разные ключи для live и обычных событий
    cache_key = f"events_{'live' if live_only else 'line'}_{sport_filter or 'all'}"
    ttl = 120 if live_only else 600  # live кэш 2 мин, обычный 10 мин

    cached = get_cache(cur, cache_key, ttl) if not force_refresh else None
    if cached:
        cur.close()
        conn.close()
        return {"statusCode": 200, "headers": CORS, "body": json.dumps(cached)}

    # Запрашиваем реальные данные
    events_list = []
    if api_key:
        try:
            events_list = fetch_all_events(api_key, live=live_only)
        except Exception:
            pass

    # Если API не дал результатов — используем fallback
    if not events_list:
        events_list = [] if live_only else FALLBACK_EVENTS

    # Фильтр по виду спорта
    if sport_filter:
        events_list = [e for e in events_list if e["category"] == sport_filter]

    is_real = bool(api_key and events_list and not events_list[0].get("id", "").startswith("fb"))
    result = {
        "events": events_list,
        "total": len(events_list),
        "is_real": is_real,
        "updated_at": time.time(),
    }

    set_cache(cur, cache_key, result)
    conn.commit()
    cur.close()
    conn.close()

    return {"statusCode": 200, "headers": CORS, "body": json.dumps(result)}