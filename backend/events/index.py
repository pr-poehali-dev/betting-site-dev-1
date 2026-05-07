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

# Словарь перевода команд на русский язык
TEAMS_RU = {
    # АПЛ
    "Arsenal": "Арсенал",
    "Aston Villa": "Астон Вилла",
    "Brentford": "Брентфорд",
    "Brighton and Hove Albion": "Брайтон",
    "Burnley": "Бернли",
    "Chelsea": "Челси",
    "Crystal Palace": "Кристал Пэлас",
    "Everton": "Эвертон",
    "Fulham": "Фулхэм",
    "Ipswich Town": "Ипсвич",
    "Leicester City": "Лестер",
    "Liverpool": "Ливерпуль",
    "Luton Town": "Лутон",
    "Manchester City": "Манчестер Сити",
    "Manchester United": "Манчестер Юнайтед",
    "Newcastle United": "Ньюкасл",
    "Nottingham Forest": "Ноттингем Форест",
    "Sheffield United": "Шеффилд Юнайтед",
    "Sunderland": "Сандерленд",
    "Tottenham Hotspur": "Тоттенхэм",
    "West Ham United": "Вест Хэм",
    "Wolverhampton Wanderers": "Вулверхэмптон",
    "Bournemouth": "Борнмут",
    "Southampton": "Саутгемптон",
    # Ла Лига
    "Atletico Madrid": "Атлетико Мадрид",
    "Athletic Club": "Атлетик Бильбао",
    "Barcelona": "Барселона",
    "Celta Vigo": "Сельта",
    "Getafe": "Хетафе",
    "Girona": "Жирона",
    "Mallorca": "Мальорка",
    "Osasuna": "Осасуна",
    "Rayo Vallecano": "Райо Вальекано",
    "Real Betis": "Реал Бетис",
    "Real Madrid": "Реал Мадрид",
    "Real Sociedad": "Реал Сосьедад",
    "Sevilla": "Севилья",
    "Valencia": "Валенсия",
    "Villarreal": "Вильярреал",
    "Alaves": "Алавес",
    "Cadiz": "Кадис",
    "Las Palmas": "Лас-Пальмас",
    "Leganes": "Леганес",
    "Espanyol": "Эспаньол",
    # Бундеслига
    "Bayer Leverkusen": "Байер Леверкузен",
    "Bayern Munich": "Бавария",
    "Borussia Dortmund": "Боруссия Дортмунд",
    "Borussia Monchengladbach": "Боруссия М",
    "Eintracht Frankfurt": "Айнтрахт Франкфурт",
    "Freiburg": "Фрайбург",
    "Hamburger SV": "Гамбург",
    "Hoffenheim": "Хоффенхайм",
    "Mainz 05": "Майнц",
    "RB Leipzig": "РБ Лейпциг",
    "Schalke 04": "Шальке",
    "Stuttgart": "Штутгарт",
    "Union Berlin": "Унион Берлин",
    "VfB Stuttgart": "Штутгарт",
    "Werder Bremen": "Вердер",
    "Wolfsburg": "Вольфсбург",
    "Augsburg": "Аугсбург",
    "Darmstadt 98": "Дармштадт",
    "FC Heidenheim 1846": "Хайденхайм",
    "Kiel": "Киль",
    "St. Pauli": "Санкт-Паули",
    # Серия А
    "AC Milan": "Милан",
    "AS Roma": "Рома",
    "Atalanta": "Аталанта",
    "Bologna": "Болонья",
    "Cagliari": "Кальяри",
    "Empoli": "Эмполи",
    "Fiorentina": "Фиорентина",
    "Frosinone": "Фрозиноне",
    "Genoa": "Дженоа",
    "Hellas Verona": "Верона",
    "Inter Milan": "Интер",
    "Juventus": "Ювентус",
    "Lazio": "Лацио",
    "Lecce": "Лечче",
    "Monza": "Монца",
    "Napoli": "Наполи",
    "Salernitana": "Салернитана",
    "Sassuolo": "Сассуоло",
    "Torino": "Торино",
    "Udinese": "Удинезе",
    "Como": "Комо",
    "Venezia": "Венеция",
    "Parma": "Парма",
    # Лига 1
    "Brest": "Брест",
    "Lens": "Ланс",
    "Lille": "Лилль",
    "Lorient": "Лорьян",
    "Lyon": "Лион",
    "Marseille": "Марсель",
    "Metz": "Мец",
    "Monaco": "Монако",
    "Montpellier": "Монпелье",
    "Nantes": "Нант",
    "Nice": "Ницца",
    "Paris Saint-Germain": "ПСЖ",
    "Paris Saint Germain": "ПСЖ",
    "PSG": "ПСЖ",
    "Reims": "Реймс",
    "Rennes": "Ренн",
    "Strasbourg": "Страсбур",
    "Toulouse": "Тулуза",
    "Clermont Foot": "Клермон",
    "Le Havre": "Гавр",
    "Saint-Etienne": "Сент-Этьен",
    # Лига чемпионов / Лига Европы
    "Real Madrid": "Реал Мадрид",
    "Manchester City": "Манчестер Сити",
    "Bayern Munich": "Бавария",
    "Paris Saint-Germain": "ПСЖ",
    "Liverpool": "Ливерпуль",
    "Chelsea": "Челси",
    "Arsenal": "Арсенал",
    "Atletico Madrid": "Атлетико Мадрид",
    "Porto": "Порту",
    "Benfica": "Бенфика",
    "Sporting CP": "Спортинг",
    "Ajax": "Аякс",
    "PSV Eindhoven": "ПСВ",
    "Celtic": "Селтик",
    "Rangers": "Рейнджерс",
    "Shakhtar Donetsk": "Шахтёр",
    "Red Bull Salzburg": "Зальцбург",
    "Club Brugge": "Брюгге",
    "Galatasaray": "Галатасарай",
    "Fenerbahce": "Фенербахче",
    "Besiktas": "Бешикташ",
    "Trabzonspor": "Трабзонспор",
    "Inter Milan": "Интер",
    "Juventus": "Ювентус",
    "AC Milan": "Милан",
    "Napoli": "Наполи",
    "Atalanta": "Аталанта",
    "Lazio": "Лацио",
    "Roma": "Рома",
    "Fiorentina": "Фиорентина",
    "Barcelona": "Барселона",
    "Bayer Leverkusen": "Байер Леверкузен",
    "Borussia Dortmund": "Боруссия Дортмунд",
    "RB Leipzig": "РБ Лейпциг",
    "Eintracht Frankfurt": "Айнтрахт",
    "Villarreal": "Вильярреал",
    "Sevilla": "Севилья",
    "Real Betis": "Реал Бетис",
    "Real Sociedad": "Реал Сосьедад",
    # НБА
    "Atlanta Hawks": "Атланта Хокс",
    "Boston Celtics": "Бостон Селтикс",
    "Brooklyn Nets": "Бруклин Нетс",
    "Charlotte Hornets": "Шарлотт Хорнетс",
    "Chicago Bulls": "Чикаго Буллз",
    "Cleveland Cavaliers": "Кливленд Кавальерс",
    "Dallas Mavericks": "Даллас Маверикс",
    "Denver Nuggets": "Денвер Наггетс",
    "Detroit Pistons": "Детройт Пистонс",
    "Golden State Warriors": "Голден Стейт",
    "Houston Rockets": "Хьюстон Рокетс",
    "Indiana Pacers": "Индиана Пэйсерс",
    "LA Clippers": "Клипперс",
    "Los Angeles Clippers": "Клипперс",
    "Los Angeles Lakers": "Лейкерс",
    "Memphis Grizzlies": "Мемфис Гриззлис",
    "Miami Heat": "Майами Хит",
    "Milwaukee Bucks": "Милуоки Бакс",
    "Minnesota Timberwolves": "Миннесота",
    "New Orleans Pelicans": "Нью-Орлеан",
    "New York Knicks": "Нью-Йорк Никс",
    "Oklahoma City Thunder": "Оклахома Сити",
    "Orlando Magic": "Орландо Мэджик",
    "Philadelphia 76ers": "Филадельфия",
    "Phoenix Suns": "Финикс Санс",
    "Portland Trail Blazers": "Портленд",
    "Sacramento Kings": "Сакраменто Кингс",
    "San Antonio Spurs": "Сан-Антонио",
    "Toronto Raptors": "Торонто Рэпторс",
    "Utah Jazz": "Юта Джаз",
    "Washington Wizards": "Вашингтон",
    # НХЛ
    "Anaheim Ducks": "Анахайм Дакс",
    "Arizona Coyotes": "Аризона Койотис",
    "Boston Bruins": "Бостон Брюинс",
    "Buffalo Sabres": "Баффало Сейбрс",
    "Calgary Flames": "Калгари Флэймс",
    "Carolina Hurricanes": "Каролина Харрикейнс",
    "Chicago Blackhawks": "Чикаго Блэкхокс",
    "Colorado Avalanche": "Колорадо Эвеланш",
    "Columbus Blue Jackets": "Коламбус Блю Джекетс",
    "Dallas Stars": "Даллас Старз",
    "Detroit Red Wings": "Детройт Ред Уингз",
    "Edmonton Oilers": "Эдмонтон Ойлерз",
    "Florida Panthers": "Флорида Пантерз",
    "Los Angeles Kings": "Лос-Анджелес Кингз",
    "Minnesota Wild": "Миннесота Уайлд",
    "Montreal Canadiens": "Монреаль Канадьенс",
    "Nashville Predators": "Нэшвилл Предаторз",
    "New Jersey Devils": "Нью-Джерси Девилз",
    "New York Islanders": "Айлендерс",
    "New York Rangers": "Нью-Йорк Рейнджерс",
    "Ottawa Senators": "Оттава Сенаторз",
    "Philadelphia Flyers": "Филадельфия Флайерз",
    "Pittsburgh Penguins": "Питтсбург Пингвинз",
    "San Jose Sharks": "Сан-Хосе Шаркс",
    "Seattle Kraken": "Сиэтл Кракен",
    "St. Louis Blues": "Сент-Луис Блюз",
    "Tampa Bay Lightning": "Тампа-Бэй Лайтнинг",
    "Toronto Maple Leafs": "Торонто Мэйпл Лифс",
    "Utah Hockey Club": "Юта Хоккей Клуб",
    "Vancouver Canucks": "Ванкувер Кэнакс",
    "Vegas Golden Knights": "Вегас Голден Найтс",
    "Washington Capitals": "Вашингтон Кэпиталз",
    "Winnipeg Jets": "Виннипег Джетс",
    # Теннис — берём первую часть фамилии
    "Novak Djokovic": "Джокович",
    "Carlos Alcaraz": "Алькарас",
    "Jannik Sinner": "Синнер",
    "Alexander Zverev": "Зверев",
    "Daniil Medvedev": "Медведев",
    "Rafael Nadal": "Надаль",
    "Andrey Rublev": "Рублёв",
    "Holger Rune": "Руне",
    "Stefanos Tsitsipas": "Циципас",
    "Casper Ruud": "Руд",
    "Taylor Fritz": "Фритц",
    "Ben Shelton": "Шелтон",
    "Tommy Paul": "Пол",
    "Frances Tiafoe": "Тиафо",
    "Alex de Minaur": "де Минор",
    "Grigor Dimitrov": "Димитров",
    "Karen Khachanov": "Хачанов",
    "Nicolas Jarry": "Харри",
    "Aryna Sabalenka": "Сабаленка",
    "Iga Swiatek": "Свёнтек",
    "Coco Gauff": "Гауфф",
    "Elena Rybakina": "Рыбакина",
    "Jessica Pegula": "Пегула",
    "Marketa Vondrousova": "Вондроушова",
    "Ons Jabeur": "Жабер",
    "Karolina Muchova": "Мухова",
    "Qinwen Zheng": "Чжэн Циньвэнь",
    "Madison Keys": "Кейс",
    # UFC/MMA
    "Israel Adesanya": "Адесанья",
    "Dricus Du Plessis": "Дю Плесси",
    "Jon Jones": "Джон Джонс",
    "Islam Makhachev": "Махачев",
    "Alexander Volkanovski": "Волкановски",
    "Sean O'Malley": "О'Мэлли",
    "Leon Edwards": "Эдвардс",
    "Kamaru Usman": "Усман",
    "Charles Oliveira": "Оливейра",
    "Dustin Poirier": "Порье",
    "Conor McGregor": "МакГрегор",
    "Khabib Nurmagomedov": "Хабиб",
    "Max Holloway": "Холлоуэй",
    "Alex Pereira": "Перейра",
    "Jiri Prochazka": "Прохазка",
    "Tom Aspinall": "Аспиналл",
    "Ciryl Gane": "Ган",
    "Stipe Miocic": "Миочич",
    "Valentina Shevchenko": "Шевченко",
    "Zhang Weili": "Чжан Вэйли",
}


def translate_team(name: str) -> str:
    """Переводит название команды/игрока на русский язык."""
    if name in TEAMS_RU:
        return TEAMS_RU[name]
    # Попробуем частичное совпадение по первому слову (для теннисистов)
    for en, ru in TEAMS_RU.items():
        if name.lower() == en.lower():
            return ru
    # Возвращаем оригинал если перевод не найден
    return name


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
    home_en = raw.get("home_team", "")
    away_en = raw.get("away_team", "")

    w1 = outcomes.get(home_en)
    w2 = outcomes.get(away_en)
    draw_teams = [k for k in outcomes if k not in (home_en, away_en)]
    x = outcomes.get(draw_teams[0]) if draw_teams else None

    if not w1 or not w2:
        return None

    home = translate_team(home_en)
    away = translate_team(away_en)

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