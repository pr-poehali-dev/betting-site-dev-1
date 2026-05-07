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


def _fb(id, sport, cat, league, home, away, date, w1, x, w2, extra_markets=None):
    """Формирует fallback-событие со всеми маркетами."""
    markets = [
        {"key": "h2h", "label": "Основное время", "type": "h2h", "outcomes": [
            {"type": "w1", "label": "П1", "odds": w1},
            *([] if x is None else [{"type": "x", "label": "X", "odds": x}]),
            {"type": "w2", "label": "П2", "odds": w2},
        ]},
    ]
    if extra_markets:
        markets.extend(extra_markets)
    return {"id": id, "sport": sport, "category": cat, "league": league,
            "home": home, "away": away, "date": date, "commence_time": "",
            "odds": {"w1": w1, "x": x, "w2": w2}, "markets": markets, "is_live": False}

FOOTBALL_EXTRA = [
    {"key": "h2h_h1", "label": "1-й тайм", "type": "h2h", "outcomes": [
        {"type": "w1", "label": "П1", "odds": 2.80},
        {"type": "x",  "label": "X",  "odds": 2.10},
        {"type": "w2", "label": "П2", "odds": 3.50},
    ]},
    {"key": "h2h_h2", "label": "2-й тайм", "type": "h2h", "outcomes": [
        {"type": "w1", "label": "П1", "odds": 2.60},
        {"type": "x",  "label": "X",  "odds": 2.20},
        {"type": "w2", "label": "П2", "odds": 3.20},
    ]},
    {"key": "totals", "label": "Тотал", "type": "totals", "outcomes": [
        {"type": "total_over",  "label": "Больше 2.5", "odds": 1.85},
        {"type": "total_under", "label": "Меньше 2.5", "odds": 1.95},
    ]},
]
NBA_EXTRA = [
    {"key": "h2h_q1", "label": "1-я четверть", "type": "h2h", "outcomes": [
        {"type": "w1", "label": "П1", "odds": 1.90},
        {"type": "w2", "label": "П2", "odds": 1.90},
    ]},
    {"key": "h2h_q2", "label": "2-я четверть", "type": "h2h", "outcomes": [
        {"type": "w1", "label": "П1", "odds": 1.88},
        {"type": "w2", "label": "П2", "odds": 1.92},
    ]},
    {"key": "totals", "label": "Тотал", "type": "totals", "outcomes": [
        {"type": "total_over",  "label": "Больше 220.5", "odds": 1.90},
        {"type": "total_under", "label": "Меньше 220.5", "odds": 1.90},
    ]},
]
HOCKEY_EXTRA = [
    {"key": "h2h_p1", "label": "1-й период", "type": "h2h", "outcomes": [
        {"type": "w1", "label": "П1", "odds": 2.20},
        {"type": "x",  "label": "X",  "odds": 1.80},
        {"type": "w2", "label": "П2", "odds": 3.10},
    ]},
    {"key": "h2h_p2", "label": "2-й период", "type": "h2h", "outcomes": [
        {"type": "w1", "label": "П1", "odds": 2.10},
        {"type": "x",  "label": "X",  "odds": 1.85},
        {"type": "w2", "label": "П2", "odds": 3.00},
    ]},
    {"key": "h2h_p3", "label": "3-й период", "type": "h2h", "outcomes": [
        {"type": "w1", "label": "П1", "odds": 2.30},
        {"type": "x",  "label": "X",  "odds": 1.90},
        {"type": "w2", "label": "П2", "odds": 2.80},
    ]},
]

# Резервные события на случай если нет API ключа или лимит исчерпан
FALLBACK_EVENTS = [
    _fb("fb1",  "⚽", "Футбол",    "Лига чемпионов", "Реал Мадрид",    "Бавария",      "Сег. 21:00", 2.10, 3.50, 3.40, FOOTBALL_EXTRA),
    _fb("fb2",  "⚽", "Футбол",    "АПЛ",            "Манчестер Сити", "Арсенал",      "Завт. 18:30",1.85, 3.60, 4.20, FOOTBALL_EXTRA),
    _fb("fb3",  "⚽", "Футбол",    "Ла Лига",        "Барселона",      "Атлетико",     "Завт. 22:00",2.05, 3.40, 3.60, FOOTBALL_EXTRA),
    _fb("fb4",  "🏀", "Баскетбол", "НБА",            "Голден Стейт",  "Бостон",       "Сег. 02:30", 1.90, None, 1.95, NBA_EXTRA),
    _fb("fb5",  "🏀", "Баскетбол", "НБА",            "Лейкерс",       "Клипперс",     "Завт. 04:00",2.15, None, 1.75, NBA_EXTRA),
    _fb("fb6",  "🎾", "Теннис",    "Ролан Гаррос",   "Синнер",        "Алькарас",     "Сег. 14:00", 1.85, None, 2.00),
    _fb("fb7",  "🏒", "Хоккей",    "НХЛ Плей-офф",  "Авалэнш",       "Ойлерз",       "Завт. 03:00",1.80, 3.80, 2.10, HOCKEY_EXTRA),
    _fb("fb8",  "🥊", "ММА",       "UFC",            "Адесанья",      "Дю Плесси",    "Суб. 04:00", 2.20, None, 1.70),
    _fb("fb9",  "⚽", "Футбол",    "Серия А",        "Интер",         "Ювентус",      "Сег. 20:45", 2.40, 3.20, 3.00, FOOTBALL_EXTRA),
    _fb("fb10", "⚽", "Футбол",    "Бундеслига",     "Бавария",       "Боруссия Д",   "Завт. 17:30",1.70, 3.80, 5.00, FOOTBALL_EXTRA),
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


# Маркеты запрашиваем по одному (free plan ограничивает один market за раз)
EXTRA_MARKETS = ["h2h_h1", "h2h_h2", "totals", "spreads"]

# Названия маркетов на русском
MARKET_LABELS = {
    "h2h":       "Основное время",
    "h2h_h1":    "1-й тайм",
    "h2h_h2":    "2-й тайм",
    "totals":    "Тотал",
    "spreads":   "Фора",
    "h2h_q1":   "1-я четверть",
    "h2h_q2":   "2-я четверть",
    "h2h_q3":   "3-я четверть",
    "h2h_q4":   "4-я четверть",
    "h2h_p1":   "1-й период",
    "h2h_p2":   "2-й период",
    "h2h_p3":   "3-й период",
}


def fetch_odds_api(sport_key: str, api_key: str, market: str = "h2h", live: bool = False) -> list:
    params = f"apiKey={api_key}&regions=eu&markets={market}&oddsFormat=decimal&dateFormat=iso"
    if live:
        params += "&inplay=true"

    url = f"https://api.the-odds-api.com/v4/sports/{sport_key}/odds/?{params}"
    req = urllib.request.Request(url, headers={"User-Agent": "BetSport/1.0"})
    with urllib.request.urlopen(req, timeout=8) as resp:
        return json.loads(resp.read().decode())


def parse_market(market: dict, home_en: str, away_en: str) -> dict | None:
    """Парсит один рынок и возвращает структуру с исходами."""
    key = market.get("key", "")
    outcomes_raw = market.get("outcomes", [])
    if not outcomes_raw:
        return None

    if key in ("h2h", "h2h_h1", "h2h_h2", "h2h_q1", "h2h_q2", "h2h_q3", "h2h_q4", "h2h_p1", "h2h_p2", "h2h_p3"):
        # Победа/ничья/победа
        prices = {o["name"]: o["price"] for o in outcomes_raw}
        w1 = prices.get(home_en)
        w2 = prices.get(away_en)
        if not w1 or not w2:
            return None
        draw_keys = [k for k in prices if k not in (home_en, away_en)]
        x = prices.get(draw_keys[0]) if draw_keys else None
        return {
            "key": key,
            "label": MARKET_LABELS.get(key, key),
            "type": "h2h",
            "outcomes": [
                {"type": "w1", "label": "П1", "odds": round(float(w1), 2)},
                *([] if not x else [{"type": "x", "label": "X", "odds": round(float(x), 2)}]),
                {"type": "w2", "label": "П2", "odds": round(float(w2), 2)},
            ],
        }

    elif key == "totals":
        # Тотал: Over/Under
        result = {"key": key, "label": MARKET_LABELS.get(key, key), "type": "totals", "outcomes": []}
        for o in outcomes_raw[:2]:
            point = o.get("point", "")
            name = "Больше" if o["name"] == "Over" else "Меньше"
            result["outcomes"].append({
                "type": f"total_{o['name'].lower()}",
                "label": f"{name} {point}",
                "odds": round(float(o["price"]), 2),
            })
        return result if result["outcomes"] else None

    elif key == "spreads":
        # Фора
        result = {"key": key, "label": MARKET_LABELS.get(key, key), "type": "spreads", "outcomes": []}
        for o in outcomes_raw[:2]:
            point = o.get("point", 0)
            sign = "+" if float(point) > 0 else ""
            team = translate_team(o["name"])
            result["outcomes"].append({
                "type": f"spread_{o['name'].lower().replace(' ', '_')}",
                "label": f"{team} ({sign}{point})",
                "odds": round(float(o["price"]), 2),
            })
        return result if result["outcomes"] else None

    return None


def parse_event(raw: dict, sport_meta: dict) -> dict | None:
    bookmakers = raw.get("bookmakers", [])
    if not bookmakers:
        return None

    home_en = raw.get("home_team", "")
    away_en = raw.get("away_team", "")

    # Собираем все маркеты из всех букмекеров (берём первый попавшийся для каждого market key)
    markets_by_key: dict[str, dict] = {}
    for bm in bookmakers:
        for market in bm.get("markets", []):
            mk = market.get("key", "")
            if mk not in markets_by_key:
                markets_by_key[mk] = market

    if "h2h" not in markets_by_key:
        return None

    # Парсим основной h2h для получения базовых коэффициентов
    main = parse_market(markets_by_key["h2h"], home_en, away_en)
    if not main:
        return None

    home = translate_team(home_en)
    away = translate_team(away_en)

    # Основные коэффициенты (для обратной совместимости)
    w1 = next((o["odds"] for o in main["outcomes"] if o["type"] == "w1"), None)
    x  = next((o["odds"] for o in main["outcomes"] if o["type"] == "x"), None)
    w2 = next((o["odds"] for o in main["outcomes"] if o["type"] == "w2"), None)

    # Парсим все доступные маркеты
    all_markets = []
    for mk_key in ["h2h", "h2h_h1", "h2h_h2", "h2h_p1", "h2h_p2", "h2h_p3",
                   "h2h_q1", "h2h_q2", "h2h_q3", "h2h_q4", "totals", "spreads"]:
        if mk_key in markets_by_key:
            parsed = parse_market(markets_by_key[mk_key], home_en, away_en)
            if parsed:
                all_markets.append(parsed)

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
            "w1": w1,
            "x": x,
            "w2": w2,
        },
        "markets": all_markets,
        "is_live": raw.get("is_live", False),
    }


def fetch_live_scores(sport_key: str, api_key: str) -> list:
    """Получает текущие live-счета через /scores/ endpoint."""
    url = f"https://api.the-odds-api.com/v4/sports/{sport_key}/scores/?apiKey={api_key}&daysFrom=1"
    req = urllib.request.Request(url, headers={"User-Agent": "BetSport/1.0"})
    with urllib.request.urlopen(req, timeout=8) as resp:
        return json.loads(resp.read().decode())


def fetch_live_events(api_key: str) -> list:
    """Получает реальные live события с текущим счётом."""
    import sys
    live_events = []

    for sport_key, meta in SPORTS_MAP.items():
        try:
            scores_data = fetch_live_scores(sport_key, api_key)
            in_play = [s for s in scores_data if s.get("completed") is False and s.get("scores")]
            if not in_play:
                continue

            print(f"[live] {sport_key}: {len(in_play)} in-play events", file=sys.stderr)

            # Получаем коэффициенты для этих матчей
            try:
                odds_data = fetch_odds_api(sport_key, api_key, market="h2h", live=True)
                odds_by_id = {o["id"]: o for o in odds_data}
            except Exception:
                odds_by_id = {}

            for score_event in in_play[:5]:
                eid = score_event.get("id", "")
                home_en = score_event.get("home_team", "")
                away_en = score_event.get("away_team", "")

                # Парсим текущий счёт
                scores = score_event.get("scores") or []
                score_map = {s["name"]: s["score"] for s in scores if s.get("name") and s.get("score")}
                home_score = score_map.get(home_en, "0")
                away_score = score_map.get(away_en, "0")

                # Время матча
                last_update = score_event.get("last_update", "")
                period = score_event.get("period", "")

                # Коэффициенты из live odds (если есть)
                odds = {"w1": None, "x": None, "w2": None}
                api_markets = []
                if eid in odds_by_id:
                    parsed_event = parse_event(odds_by_id[eid], meta)
                    if parsed_event:
                        odds = parsed_event["odds"]
                        api_markets = parsed_event.get("markets", [])

                live_events.append({
                    "id": eid,
                    "sport": meta["emoji"],
                    "category": meta["category"],
                    "league": meta["name"],
                    "home": translate_team(home_en),
                    "away": translate_team(away_en),
                    "date": "Live",
                    "commence_time": score_event.get("commence_time", ""),
                    "odds": odds,
                    "markets": api_markets,
                    "is_live": True,
                    "live_data": {
                        "home_score": home_score,
                        "away_score": away_score,
                        "period": period,
                        "last_update": last_update,
                    },
                })

        except Exception as e:
            print(f"[live] {sport_key} error: {e}", file=sys.stderr)
            continue

    print(f"[live] total: {len(live_events)}", file=sys.stderr)
    return live_events


def fetch_all_events(api_key: str, live: bool = False) -> list:
    import sys
    events = []

    for sport_key, meta in SPORTS_MAP.items():
        try:
            # Шаг 1: получаем основной h2h
            raw_events = fetch_odds_api(sport_key, api_key, market="h2h", live=live)
            print(f"[events] {sport_key}: got {len(raw_events)} events", file=sys.stderr)

            # Индексируем по event_id для быстрого поиска
            raw_by_id = {r["id"]: r for r in raw_events[:6]}
            if not raw_by_id:
                continue

            # Шаг 2: пробуем дополнить каждый вид спорта дополнительными маркетами
            for extra_market in EXTRA_MARKETS:
                try:
                    extra_events = fetch_odds_api(sport_key, api_key, market=extra_market, live=live)
                    for er in extra_events:
                        eid = er.get("id", "")
                        if eid in raw_by_id:
                            # Мёржим букмекеров
                            existing_bm_keys = {
                                mk.get("key") for bm in raw_by_id[eid].get("bookmakers", [])
                                for mk in bm.get("markets", [])
                            }
                            for bm in er.get("bookmakers", []):
                                for mk in bm.get("markets", []):
                                    if mk.get("key") not in existing_bm_keys:
                                        if raw_by_id[eid].get("bookmakers"):
                                            raw_by_id[eid]["bookmakers"][0].setdefault("markets", []).append(mk)
                except Exception as e2:
                    print(f"[events] {sport_key}/{extra_market} error: {e2}", file=sys.stderr)
                    continue

            # Шаг 3: парсим обогащённые события
            for raw in raw_by_id.values():
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
            if live_only:
                events_list = fetch_live_events(api_key)
            else:
                events_list = fetch_all_events(api_key, live=False)
        except Exception as e:
            import sys
            print(f"[events] fetch error: {e}", file=sys.stderr)

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