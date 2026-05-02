import Icon from "@/components/ui/icon";

const history = [
  { id: 1, match: "Реал Мадрид — Барселона", league: "Ла Лига", bet: "П1", odds: 2.1, amount: 1000, result: 2100, status: "win", date: "01.05.2026" },
  { id: 2, match: "Лейкерс — Бостон Селтикс", league: "НБА", bet: "П2", odds: 1.95, amount: 500, result: 0, status: "loss", date: "30.04.2026" },
  { id: 3, match: "Джокович — Надаль", league: "ATP Мадрид", bet: "П1", odds: 1.6, amount: 750, result: 1200, status: "win", date: "29.04.2026" },
  { id: 4, match: "ЦСКА — Динамо Москва", league: "КХЛ", bet: "П1", odds: 1.7, amount: 300, result: 0, status: "pending", date: "02.05.2026" },
  { id: 5, match: "Манчестер Сити — Арсенал", league: "АПЛ", bet: "Тотал больше 2.5", odds: 1.85, amount: 600, result: 1110, status: "win", date: "28.04.2026" },
  { id: 6, match: "Синнер — Алькарас", league: "Уимблдон", bet: "П2", odds: 1.95, amount: 400, result: 0, status: "loss", date: "27.04.2026" },
];

const summary = {
  total: 3550,
  won: 2200,
  profit: "+760 ₽",
  roi: "+21.4%",
};

export default function HistorySection() {
  return (
    <div className="space-y-6">
      <h2 className="section-title">История ставок</h2>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Сумма ставок", value: `${summary.total.toLocaleString()} ₽`, color: "#fff" },
          { label: "Выиграно", value: `${summary.won.toLocaleString()} ₽`, color: "#00FF87" },
          { label: "Прибыль", value: summary.profit, color: "#00FF87" },
          { label: "ROI", value: summary.roi, color: "#FFD700" },
        ].map((s) => (
          <div key={s.label} className="glass-card rounded-lg p-4 text-center" style={{ border: "1px solid #1A2430" }}>
            <div className="font-oswald text-xl font-bold" style={{ color: s.color }}>{s.value}</div>
            <div className="text-gray-500 text-xs font-roboto mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap items-center">
        <span className="text-gray-500 text-sm font-roboto">Фильтр:</span>
        {["Все", "Выигрыши", "Проигрыши", "В игре"].map((f) => (
          <button key={f} className="text-sm px-3 py-1 rounded-full glass-card border border-sport-border text-gray-400 hover:text-neon-green hover:border-neon-green transition-all font-roboto">
            {f}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-xs text-gray-600 font-oswald uppercase tracking-wider border-b border-sport-border">
              <th className="text-left py-3 px-2">Событие</th>
              <th className="text-left py-3 px-2 hidden md:table-cell">Ставка</th>
              <th className="text-right py-3 px-2">Коэф.</th>
              <th className="text-right py-3 px-2">Сумма</th>
              <th className="text-right py-3 px-2">Результат</th>
              <th className="text-right py-3 px-2 hidden md:table-cell">Дата</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-sport-border">
            {history.map((h) => (
              <tr key={h.id} className="hover:bg-sport-surface transition-colors">
                <td className="py-3 px-2">
                  <div className="font-oswald text-sm font-medium text-white">{h.match}</div>
                  <div className="text-gray-600 text-xs font-roboto">{h.league}</div>
                </td>
                <td className="py-3 px-2 hidden md:table-cell">
                  <span className="text-gray-300 text-sm font-roboto">{h.bet}</span>
                </td>
                <td className="py-3 px-2 text-right">
                  <span className="font-oswald text-neon-green font-bold">{h.odds}</span>
                </td>
                <td className="py-3 px-2 text-right">
                  <span className="text-gray-300 font-roboto text-sm">{h.amount.toLocaleString()} ₽</span>
                </td>
                <td className="py-3 px-2 text-right">
                  {h.status === "win" && (
                    <div>
                      <span className="text-neon-green font-oswald font-bold">+{(h.result - h.amount).toLocaleString()} ₽</span>
                      <span className="ml-2 text-xs bg-green-500/15 text-green-400 px-1.5 py-0.5 rounded font-oswald">WIN</span>
                    </div>
                  )}
                  {h.status === "loss" && (
                    <div>
                      <span className="text-red-400 font-oswald font-bold">−{h.amount.toLocaleString()} ₽</span>
                      <span className="ml-2 text-xs bg-red-500/15 text-red-400 px-1.5 py-0.5 rounded font-oswald">LOSS</span>
                    </div>
                  )}
                  {h.status === "pending" && (
                    <div className="flex items-center justify-end gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />
                      <span className="text-yellow-400 font-oswald text-xs bg-yellow-500/15 px-1.5 py-0.5 rounded">В ИГРЕ</span>
                    </div>
                  )}
                </td>
                <td className="py-3 px-2 text-right hidden md:table-cell">
                  <span className="text-gray-600 text-xs font-roboto">{h.date}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
