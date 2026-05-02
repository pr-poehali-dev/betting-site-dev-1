import { useState } from "react";
import Icon from "@/components/ui/icon";

const faqs = [
  { q: "Как пополнить счёт?", a: "Пополнение доступно через банковские карты (Visa/MC/МИР), СБП, ЮMoney, QIWI и криптовалюту. Минимальный депозит — 200 ₽. Зачисление мгновенное." },
  { q: "Сколько ждать вывода средств?", a: "Вывод на карту обрабатывается в течение 15 минут. Максимальный срок — 24 часа для прохождения верификации. На крипто-кошелёк — до 30 минут." },
  { q: "Как пройти верификацию аккаунта?", a: "Загрузите фото паспорта (разворот с фото и регистрацией) в личном кабинете. Верификация проходит в течение 1 рабочего дня." },
  { q: "Что такое Live ставки?", a: "Live ставки — это ставки на события, которые происходят прямо сейчас. Коэффициенты меняются в реальном времени в зависимости от хода матча." },
  { q: "Как получить бонус на первый депозит?", a: "После регистрации пополните счёт на сумму от 1 000 ₽ — бонус начислится автоматически. Для отыгрыша нужно сделать ставки с суммарным коэффициентом от 1.8." },
];

export default function SupportSection() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [sent, setSent] = useState(false);

  const handleSend = () => {
    if (form.name && form.email && form.message) {
      setSent(true);
    }
  };

  return (
    <div className="space-y-8">
      <h2 className="section-title">Поддержка</h2>

      {/* Channels */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { icon: "MessageCircle", title: "Онлайн-чат", desc: "Отвечаем мгновенно 24/7", badge: "Онлайн", color: "#00FF87" },
          { icon: "Phone", title: "Телефон", desc: "8-800-XXX-XX-XX\nБесплатно по России", badge: "09:00–21:00", color: "#00B4FF" },
          { icon: "Mail", title: "Email", desc: "support@betsport.ru\nОтвет в течение 2 часов", badge: "Email", color: "#FFD700" },
        ].map((ch) => (
          <button
            key={ch.title}
            className="glass-card rounded-xl p-5 text-left neon-border group transition-all"
          >
            <div
              className="w-12 h-12 rounded-lg flex items-center justify-center mb-4 transition-all"
              style={{ background: `${ch.color}10`, border: `1px solid ${ch.color}30` }}
            >
              <Icon name={ch.icon} size={24} fallback="Circle" style={{ color: ch.color }} />
            </div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-oswald text-base font-bold text-white">{ch.title}</h3>
              <span
                className="text-xs px-2 py-0.5 rounded-full font-oswald"
                style={{ background: `${ch.color}15`, color: ch.color }}
              >
                {ch.badge}
              </span>
            </div>
            <p className="text-gray-500 text-sm font-roboto whitespace-pre-line">{ch.desc}</p>
          </button>
        ))}
      </div>

      {/* Contact form */}
      <div className="glass-card rounded-xl p-6" style={{ border: "1px solid #1A2430" }}>
        <h3 className="font-oswald text-xl font-bold text-white mb-5">Написать в поддержку</h3>
        {sent ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-full bg-neon-green/10 border border-neon-green/30 flex items-center justify-center mx-auto mb-4">
              <Icon name="CheckCircle" size={32} className="text-neon-green" />
            </div>
            <div className="font-oswald text-xl font-bold text-white mb-2">Заявка отправлена!</div>
            <p className="text-gray-500 font-roboto text-sm">Мы ответим на ваш email в течение 2 часов.</p>
            <button
              onClick={() => { setSent(false); setForm({ name: "", email: "", message: "" }); }}
              className="mt-4 text-neon-green text-sm font-roboto hover:underline"
            >
              Отправить ещё одно сообщение
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-500 font-roboto mb-1.5 block">Ваше имя</label>
                <input
                  type="text"
                  placeholder="Иван Иванов"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full bg-sport-dark border border-sport-border rounded px-3 py-2.5 text-white font-roboto text-sm focus:outline-none focus:border-neon-green transition-colors placeholder:text-gray-700"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 font-roboto mb-1.5 block">Email</label>
                <input
                  type="email"
                  placeholder="email@example.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full bg-sport-dark border border-sport-border rounded px-3 py-2.5 text-white font-roboto text-sm focus:outline-none focus:border-neon-green transition-colors placeholder:text-gray-700"
                />
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-500 font-roboto mb-1.5 block">Сообщение</label>
              <textarea
                placeholder="Опишите ваш вопрос..."
                rows={4}
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                className="w-full bg-sport-dark border border-sport-border rounded px-3 py-2.5 text-white font-roboto text-sm focus:outline-none focus:border-neon-green transition-colors resize-none placeholder:text-gray-700"
              />
            </div>
            <button
              onClick={handleSend}
              className="px-8 py-3 bg-neon-green text-sport-dark font-oswald font-bold rounded uppercase tracking-wide transition-all hover:scale-105"
              style={{ boxShadow: "0 0 16px rgba(0,255,135,0.3)" }}
            >
              Отправить
            </button>
          </div>
        )}
      </div>

      {/* FAQ */}
      <div>
        <h3 className="section-title mb-4">Частые вопросы</h3>
        <div className="space-y-2">
          {faqs.map((faq, i) => (
            <div key={i} className="glass-card rounded-lg overflow-hidden" style={{ border: "1px solid #1A2430" }}>
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-sport-surface transition-colors"
              >
                <span className="font-oswald text-sm font-medium text-white">{faq.q}</span>
                <Icon
                  name={openFaq === i ? "ChevronUp" : "ChevronDown"}
                  size={16}
                  className={`flex-shrink-0 ml-4 transition-colors ${openFaq === i ? "text-neon-green" : "text-gray-600"}`}
                />
              </button>
              {openFaq === i && (
                <div className="px-5 pb-4 text-gray-400 font-roboto text-sm leading-relaxed border-t border-sport-border">
                  <p className="pt-3">{faq.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
