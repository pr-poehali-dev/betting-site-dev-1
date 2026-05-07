import { EventMarket } from "@/lib/events";

// Детерминированный псевдо-рандом на основе строки (для стабильных коэффициентов)
function hash(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = (h * 33) ^ s.charCodeAt(i);
  return Math.abs(h);
}

function rnd(seed: string, min: number, max: number, decimals = 2): number {
  const h = hash(seed);
  const val = min + (h % 1000) / 1000 * (max - min);
  return parseFloat(val.toFixed(decimals));
}

function w1x2(seed: string, w1Range: [number, number], xRange: [number, number], w2Range: [number, number]) {
  return [
    { type: "w1", label: "П1",    odds: rnd(seed + "w1", ...w1Range) },
    { type: "x",  label: "Ничья", odds: rnd(seed + "x",  ...xRange)  },
    { type: "w2", label: "П2",    odds: rnd(seed + "w2", ...w2Range) },
  ];
}

function w1w2(seed: string, w1Range: [number, number], w2Range: [number, number]) {
  return [
    { type: "w1", label: "П1", odds: rnd(seed + "w1", ...w1Range) },
    { type: "w2", label: "П2", odds: rnd(seed + "w2", ...w2Range) },
  ];
}

function totals(seed: string, line: string, overRange: [number, number], underRange: [number, number]) {
  return [
    { type: "over",  label: `Больше ${line}`,  odds: rnd(seed + "ov", ...overRange)  },
    { type: "under", label: `Меньше ${line}`, odds: rnd(seed + "un", ...underRange) },
  ];
}

function handicap(seed: string, home: string, away: string, val: string) {
  return [
    { type: "hc_h", label: `${home.split(" ")[0]} (${val})`,     odds: rnd(seed + "hh", 1.70, 2.30) },
    { type: "hc_a", label: `${away.split(" ")[0]} (-${val.replace("-","")})`, odds: rnd(seed + "ha", 1.70, 2.30) },
  ];
}

// Генерирует все рынки для футбольного матча
export function generateFootballMarkets(
  eventId: string,
  home: string,
  away: string,
  baseOdds: { w1: number | null; x: number | null; w2: number | null },
): EventMarket[] {
  const s = eventId;
  const w1 = baseOdds.w1 ?? 2.0;
  const x  = baseOdds.x  ?? 3.4;
  const w2 = baseOdds.w2 ?? 3.0;

  return [
    // ── ОСНОВНОЕ ВРЕМЯ ──────────────────────────────────────────
    {
      key: "h2h", label: "Основное время", type: "h2h",
      outcomes: [
        { type: "w1", label: "П1",    odds: w1 },
        { type: "x",  label: "Ничья", odds: x  },
        { type: "w2", label: "П2",    odds: w2  },
      ],
    },
    {
      key: "h2h_dc", label: "Двойной шанс", type: "h2h",
      outcomes: [
        { type: "dc_1x", label: "1X", odds: rnd(s+"dc1", 1.15, 1.55) },
        { type: "dc_12", label: "12", odds: rnd(s+"dc2", 1.20, 1.60) },
        { type: "dc_x2", label: "X2", odds: rnd(s+"dc3", 1.30, 1.70) },
      ],
    },
    {
      key: "totals", label: "Тотал", type: "totals",
      outcomes: totals(s, "2.5", [1.70, 1.95], [1.85, 2.05]),
    },
    {
      key: "totals_35", label: "Тотал 3.5", type: "totals",
      outcomes: totals(s+"35", "3.5", [2.10, 2.60], [1.45, 1.70]),
    },
    {
      key: "btts", label: "Обе забьют", type: "h2h",
      outcomes: [
        { type: "btts_yes", label: "Да", odds: rnd(s+"by", 1.65, 2.10) },
        { type: "btts_no",  label: "Нет", odds: rnd(s+"bn", 1.70, 2.10) },
      ],
    },
    {
      key: "handicap", label: "Фора", type: "spreads",
      outcomes: handicap(s, home, away, "-1"),
    },

    // ── 1-Й ТАЙМ ────────────────────────────────────────────────
    {
      key: "h1_h2h", label: "1-й тайм", type: "h2h",
      outcomes: w1x2(s+"h1", [2.50, 3.50], [1.90, 2.50], [3.00, 4.50]),
    },
    {
      key: "h1_totals", label: "Тотал 1-й тайм", type: "totals",
      outcomes: totals(s+"h1t", "0.5", [1.55, 1.85], [1.95, 2.30]),
    },
    {
      key: "h1_btts", label: "Обе забьют 1-й тайм", type: "h2h",
      outcomes: [
        { type: "h1_btts_yes", label: "Да",  odds: rnd(s+"h1by", 2.50, 3.50) },
        { type: "h1_btts_no",  label: "Нет", odds: rnd(s+"h1bn", 1.25, 1.50) },
      ],
    },

    // ── 2-Й ТАЙМ ────────────────────────────────────────────────
    {
      key: "h2_h2h", label: "2-й тайм", type: "h2h",
      outcomes: w1x2(s+"h2", [2.40, 3.20], [2.00, 2.60], [2.80, 4.00]),
    },
    {
      key: "h2_totals", label: "Тотал 2-й тайм", type: "totals",
      outcomes: totals(s+"h2t", "0.5", [1.50, 1.80], [1.95, 2.35]),
    },

    // ── УГЛОВЫЕ ─────────────────────────────────────────────────
    {
      key: "corners_main", label: "Угловые", type: "totals",
      outcomes: totals(s+"cm", "9.5", [1.75, 2.00], [1.80, 2.05]),
    },
    {
      key: "corners_h1", label: "Угловые 1-й тайм", type: "totals",
      outcomes: totals(s+"ch1", "4.5", [1.75, 2.00], [1.80, 2.05]),
    },
    {
      key: "corners_h2", label: "Угловые 2-й тайм", type: "totals",
      outcomes: totals(s+"ch2", "4.5", [1.80, 2.05], [1.75, 2.00]),
    },
    {
      key: "corners_hc", label: "Угловые — фора", type: "spreads",
      outcomes: [
        { type: "ch_h", label: `${home.split(" ")[0]} (-1.5)`, odds: rnd(s+"chh", 1.75, 2.20) },
        { type: "ch_a", label: `${away.split(" ")[0]} (+1.5)`, odds: rnd(s+"cha", 1.70, 2.15) },
      ],
    },

    // ── ЖЁЛТЫЕ КАРТОЧКИ ─────────────────────────────────────────
    {
      key: "cards_main", label: "Жёлтые карточки", type: "totals",
      outcomes: totals(s+"ym", "3.5", [1.80, 2.10], [1.75, 2.00]),
    },
    {
      key: "cards_h1", label: "Жёлтые карточки 1-й тайм", type: "totals",
      outcomes: totals(s+"yh1", "1.5", [1.70, 2.00], [1.80, 2.10]),
    },
    {
      key: "cards_h2", label: "Жёлтые карточки 2-й тайм", type: "totals",
      outcomes: totals(s+"yh2", "1.5", [1.75, 2.05], [1.75, 2.05]),
    },

    // ── ЗАМЕНЫ ──────────────────────────────────────────────────
    {
      key: "subs_h1", label: "Замены 1-й тайм", type: "totals",
      outcomes: totals(s+"sh1", "0.5", [2.50, 3.50], [1.25, 1.45]),
    },
    {
      key: "subs_h2", label: "Замены 2-й тайм", type: "totals",
      outcomes: totals(s+"sh2", "4.5", [1.65, 1.95], [1.85, 2.15]),
    },
    {
      key: "subs_total", label: "Всего замен", type: "totals",
      outcomes: totals(s+"st", "5.5", [1.75, 2.00], [1.80, 2.05]),
    },

    // ── СТАТИСТИКА ИГРОКОВ ───────────────────────────────────────
    {
      key: "player_shots", label: "Удары в створ — игрок", type: "h2h",
      outcomes: [
        { type: "ps_2plus", label: "2+ ударов в створ", odds: rnd(s+"ps2", 1.85, 2.50) },
        { type: "ps_3plus", label: "3+ ударов в створ", odds: rnd(s+"ps3", 2.80, 3.80) },
        { type: "ps_0",     label: "0 ударов в створ",  odds: rnd(s+"ps0", 2.40, 3.20) },
      ],
    },
    {
      key: "player_shots_h1", label: "Удары — 1-й тайм", type: "totals",
      outcomes: [
        { type: "psh1_1p", label: "1+ удар",  odds: rnd(s+"psh11", 1.55, 2.00) },
        { type: "psh1_2p", label: "2+ удара", odds: rnd(s+"psh12", 2.50, 3.20) },
      ],
    },
    {
      key: "player_shots_h2", label: "Удары — 2-й тайм", type: "totals",
      outcomes: [
        { type: "psh2_1p", label: "1+ удар",  odds: rnd(s+"psh21", 1.55, 2.00) },
        { type: "psh2_2p", label: "2+ удара", odds: rnd(s+"psh22", 2.50, 3.20) },
      ],
    },

    // ── СПЕЦИАЛЬНЫЕ ─────────────────────────────────────────────
    {
      key: "first_goal", label: "Кто забьёт первым", type: "h2h",
      outcomes: [
        { type: "fg_h",    label: home.split(" ")[0], odds: rnd(s+"fgh", 1.60, 2.20) },
        { type: "fg_none", label: "Никто",             odds: rnd(s+"fgn", 5.50, 8.00) },
        { type: "fg_a",    label: away.split(" ")[0], odds: rnd(s+"fga", 1.80, 2.60) },
      ],
    },
    {
      key: "med", label: "Медицинская бригада", type: "totals",
      outcomes: totals(s+"med", "1.5", [1.80, 2.20], [1.75, 2.10]),
    },
    {
      key: "what_first", label: "Что раньше", type: "h2h",
      outcomes: [
        { type: "wf_goal",   label: "Гол",             odds: rnd(s+"wfg", 1.35, 1.65) },
        { type: "wf_corner", label: "Угловой",         odds: rnd(s+"wfc", 2.40, 3.20) },
        { type: "wf_card",   label: "Карточка",        odds: rnd(s+"wfk", 4.00, 6.00) },
        { type: "wf_sub",    label: "Замена",          odds: rnd(s+"wfs", 6.00, 9.00) },
      ],
    },
  ];
}

// Генерирует рынки для баскетбола
export function generateBasketballMarkets(
  eventId: string,
  home: string,
  away: string,
  baseOdds: { w1: number | null; x: number | null; w2: number | null },
): EventMarket[] {
  const s = eventId;
  const w1 = baseOdds.w1 ?? 1.9;
  const w2 = baseOdds.w2 ?? 1.9;

  return [
    { key: "h2h",    label: "Основное время",  type: "h2h",    outcomes: w1w2(s, [w1*0.95, w1*1.05], [w2*0.95, w2*1.05]) },
    { key: "h2h_ot", label: "Включая овертайм", type: "h2h",   outcomes: w1w2(s+"ot", [1.80, 2.10], [1.80, 2.10]) },
    { key: "totals", label: "Тотал",            type: "totals", outcomes: totals(s, "220.5", [1.85, 2.00], [1.85, 2.00]) },
    { key: "hc",     label: "Фора",             type: "spreads", outcomes: handicap(s, home, away, "-5.5") },
    { key: "q1",     label: "1-я четверть",     type: "h2h",    outcomes: w1w2(s+"q1", [1.85, 2.10], [1.85, 2.10]) },
    { key: "q1t",    label: "Тотал 1-й четв.",  type: "totals", outcomes: totals(s+"q1t", "54.5", [1.85, 2.00], [1.85, 2.00]) },
    { key: "q2",     label: "2-я четверть",     type: "h2h",    outcomes: w1w2(s+"q2", [1.85, 2.10], [1.85, 2.10]) },
    { key: "q3",     label: "3-я четверть",     type: "h2h",    outcomes: w1w2(s+"q3", [1.85, 2.10], [1.85, 2.10]) },
    { key: "q4",     label: "4-я четверть",     type: "h2h",    outcomes: w1w2(s+"q4", [1.85, 2.10], [1.85, 2.10]) },
    { key: "player_pts", label: "Очки игрока",  type: "totals", outcomes: totals(s+"pp", "19.5", [1.85, 2.05], [1.80, 2.00]) },
  ];
}

// Генерирует рынки для хоккея
export function generateHockeyMarkets(
  eventId: string,
  home: string,
  away: string,
  baseOdds: { w1: number | null; x: number | null; w2: number | null },
): EventMarket[] {
  const s = eventId;
  const w1 = baseOdds.w1 ?? 1.9;
  const x  = baseOdds.x  ?? 4.0;
  const w2 = baseOdds.w2 ?? 2.1;

  return [
    { key: "h2h",    label: "Основное время",  type: "h2h",    outcomes: [{ type:"w1",label:"П1",odds:w1},{type:"x",label:"Ничья",odds:x},{type:"w2",label:"П2",odds:w2}] },
    { key: "h2h_ot", label: "Включая ОТ/БУЛ", type: "h2h",    outcomes: w1w2(s+"ot", [1.55, 1.85], [1.90, 2.30]) },
    { key: "totals", label: "Тотал",            type: "totals", outcomes: totals(s, "5.5", [1.85, 2.00], [1.85, 2.00]) },
    { key: "hc",     label: "Фора",             type: "spreads", outcomes: handicap(s, home, away, "-1.5") },
    { key: "p1",     label: "1-й период",       type: "h2h",    outcomes: w1x2(s+"p1", [2.30,3.20],[2.00,2.60],[2.80,4.00]) },
    { key: "p1t",    label: "Тотал 1-й период", type: "totals", outcomes: totals(s+"p1t", "1.5", [1.80, 2.10], [1.75, 2.00]) },
    { key: "p2",     label: "2-й период",       type: "h2h",    outcomes: w1x2(s+"p2", [2.30,3.20],[2.00,2.60],[2.80,4.00]) },
    { key: "p3",     label: "3-й период",       type: "h2h",    outcomes: w1x2(s+"p3", [2.30,3.20],[2.00,2.60],[2.80,4.00]) },
    { key: "first_goal", label: "Кто забьёт первым", type: "h2h", outcomes: [
      { type: "fg_h", label: home.split(" ")[0], odds: rnd(s+"fgh", 1.65, 2.10) },
      { type: "fg_n", label: "Никто",            odds: rnd(s+"fgn", 7.00,10.00) },
      { type: "fg_a", label: away.split(" ")[0], odds: rnd(s+"fga", 1.80, 2.30) },
    ]},
  ];
}

// Генерирует рынки для тенниса
export function generateTennisMarkets(
  eventId: string,
  home: string,
  away: string,
  baseOdds: { w1: number | null; x: number | null; w2: number | null },
): EventMarket[] {
  const s = eventId;
  const w1 = baseOdds.w1 ?? 1.9;
  const w2 = baseOdds.w2 ?? 1.9;

  return [
    { key: "h2h",     label: "Победитель матча", type: "h2h",    outcomes: w1w2(s, [w1*0.97, w1*1.03], [w2*0.97, w2*1.03]) },
    { key: "totals",  label: "Тотал геймов",     type: "totals", outcomes: totals(s, "22.5", [1.80, 2.05], [1.80, 2.05]) },
    { key: "hc",      label: "Фора по сетам",    type: "spreads", outcomes: [
      { type: "hc_h", label: `${home.split(" ")[0]} (-1.5 сета)`, odds: rnd(s+"hh", 2.00, 3.00) },
      { type: "hc_a", label: `${away.split(" ")[0]} (+1.5 сета)`, odds: rnd(s+"ha", 1.40, 1.70) },
    ]},
    { key: "s1",      label: "1-й сет",          type: "h2h",    outcomes: w1w2(s+"s1", [1.80, 2.20], [1.80, 2.20]) },
    { key: "s1t",     label: "Тотал 1-й сет",    type: "totals", outcomes: totals(s+"s1t", "10.5", [1.80, 2.05], [1.80, 2.05]) },
    { key: "s2",      label: "2-й сет",          type: "h2h",    outcomes: w1w2(s+"s2", [1.80, 2.20], [1.80, 2.20]) },
    { key: "s3",      label: "3-й сет",          type: "h2h",    outcomes: w1w2(s+"s3", [1.80, 2.20], [1.80, 2.20]) },
    { key: "ace_tot", label: "Тотал эйсов",      type: "totals", outcomes: totals(s+"ace", "9.5", [1.80, 2.05], [1.80, 2.05]) },
  ];
}

// Генерирует рынки для ММА
export function generateMMAMarkets(
  eventId: string,
  home: string,
  away: string,
  baseOdds: { w1: number | null; x: number | null; w2: number | null },
): EventMarket[] {
  const s = eventId;
  const w1 = baseOdds.w1 ?? 2.0;
  const w2 = baseOdds.w2 ?? 1.8;

  return [
    { key: "h2h",     label: "Победитель",     type: "h2h",    outcomes: w1w2(s, [w1*0.97,w1*1.03],[w2*0.97,w2*1.03]) },
    { key: "method",  label: "Метод победы",   type: "h2h",    outcomes: [
      { type: "ko",  label: "КО/ТКО",    odds: rnd(s+"ko",  1.80, 2.50) },
      { type: "sub", label: "Сабмишн",   odds: rnd(s+"sub", 2.80, 4.00) },
      { type: "dec", label: "Решение",   odds: rnd(s+"dec", 2.00, 3.00) },
    ]},
    { key: "round_tot", label: "Тотал раундов", type: "totals", outcomes: totals(s, "1.5", [1.75, 2.10], [1.75, 2.10]) },
    { key: "r1",      label: "Победа в 1-м раунде", type: "h2h", outcomes: w1w2(s+"r1", [3.50,5.00],[3.50,5.00]) },
    { key: "go_dist", label: "Идти до финала", type: "h2h",    outcomes: [
      { type: "yes", label: "Да",  odds: rnd(s+"gdy", 1.80, 2.50) },
      { type: "no",  label: "Нет", odds: rnd(s+"gdn", 1.55, 2.00) },
    ]},
  ];
}

// Главная функция — выбирает генератор по категории
export function getMarketsForEvent(event: {
  id: string; home: string; away: string; category: string;
  odds: { w1: number | null; x: number | null; w2: number | null };
  markets?: EventMarket[];
}): EventMarket[] {
  // Если API вернул маркеты — дополняем их нашими
  const apiMarkets = event.markets ?? [];

  let generated: EventMarket[] = [];
  switch (event.category) {
    case "Футбол":     generated = generateFootballMarkets(event.id, event.home, event.away, event.odds); break;
    case "Баскетбол":  generated = generateBasketballMarkets(event.id, event.home, event.away, event.odds); break;
    case "Хоккей":     generated = generateHockeyMarkets(event.id, event.home, event.away, event.odds); break;
    case "Теннис":     generated = generateTennisMarkets(event.id, event.home, event.away, event.odds); break;
    case "ММА":        generated = generateMMAMarkets(event.id, event.home, event.away, event.odds); break;
    default:           generated = generateFootballMarkets(event.id, event.home, event.away, event.odds);
  }

  // Если API дал реальные коэффициенты — заменяем первый маркет (основное время)
  if (apiMarkets.length > 0) {
    const apiH2H = apiMarkets.find(m => m.key === "h2h");
    if (apiH2H) {
      const idx = generated.findIndex(m => m.key === "h2h");
      if (idx >= 0) generated[idx] = apiH2H;
    }
    const apiTotals = apiMarkets.find(m => m.key === "totals");
    if (apiTotals) {
      const idx = generated.findIndex(m => m.key === "totals");
      if (idx >= 0) generated[idx] = apiTotals;
    }
  }

  return generated;
}
