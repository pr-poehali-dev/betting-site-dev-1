import { useState, useRef } from "react";
import Icon from "@/components/ui/icon";
import { getVerifyStatus, submitVerify, fileToBase64, VerifyStatus } from "@/lib/verify";
import { useAuth } from "@/context/AuthContext";

const DOC_TYPES = [
  { value: "passport", label: "Паспорт РФ" },
  { value: "foreign_passport", label: "Загранпаспорт" },
  { value: "driver_license", label: "Водительское удостоверение" },
  { value: "id_card", label: "ID-карта" },
];

const STEPS = ["Личные данные", "Документ", "Фотографии", "Подтверждение"];

function StatusBadge({ status }: { status: VerifyStatus["status"] }) {
  const map = {
    not_submitted: { label: "Не верифицирован", color: "#666",     bg: "rgba(100,100,100,0.1)",  icon: "ShieldOff" },
    pending:       { label: "На проверке",       color: "#FFD700",  bg: "rgba(255,215,0,0.1)",    icon: "Clock" },
    approved:      { label: "Верифицирован",     color: "#00FF87",  bg: "rgba(0,255,135,0.1)",    icon: "ShieldCheck" },
    rejected:      { label: "Отклонено",         color: "#FF3B3B",  bg: "rgba(255,59,59,0.1)",    icon: "ShieldX" },
  };
  const s = map[status] ?? map.not_submitted;
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-oswald font-bold px-2.5 py-1 rounded-full"
      style={{ background: s.bg, color: s.color, border: `1px solid ${s.color}30` }}>
      <Icon name={s.icon} size={12} fallback="Shield" />
      {s.label}
    </span>
  );
}

function PhotoUpload({ label, value, onChange, hint }: {
  label: string; value: string; onChange: (b64: string) => void; hint?: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div>
      <div className="text-xs text-gray-500 font-roboto mb-1.5">{label}</div>
      <div
        onClick={() => ref.current?.click()}
        className="relative rounded-xl border-2 border-dashed cursor-pointer transition-all overflow-hidden flex items-center justify-center"
        style={{
          height: 140,
          borderColor: value ? "#00FF87" : "#1A2430",
          background: value ? "rgba(0,255,135,0.05)" : "rgba(255,255,255,0.02)",
        }}
      >
        {value ? (
          <>
            <img src={value} alt="" className="absolute inset-0 w-full h-full object-cover opacity-70" />
            <div className="relative z-10 flex flex-col items-center gap-1">
              <Icon name="CheckCircle" size={28} className="text-neon-green" />
              <span className="text-xs text-neon-green font-roboto">Загружено</span>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center gap-2 text-gray-600">
            <Icon name="Upload" size={24} />
            <span className="text-xs font-roboto text-center px-4">{hint || "Нажми чтобы загрузить"}</span>
          </div>
        )}
        <input
          ref={ref} type="file" accept="image/*" className="hidden"
          onChange={async (e) => {
            const f = e.target.files?.[0];
            if (f) onChange(await fileToBase64(f));
          }}
        />
      </div>
    </div>
  );
}

interface Props {
  onStatusChange?: () => void;
}

export default function VerificationForm({ onStatusChange }: Props) {
  const { refreshUser } = useAuth();
  const [status, setStatus] = useState<VerifyStatus | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState({
    full_name: "", birth_date: "", doc_type: "passport", doc_number: "",
    doc_photo_front: "", doc_photo_back: "", selfie_photo: "",
  });

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const loadStatus = async () => {
    setLoadingStatus(true);
    try {
      const s = await getVerifyStatus();
      setStatus(s);
    } catch {
      setStatus({ status: "not_submitted" });
    } finally {
      setLoadingStatus(false);
    }
  };

  // Загружаем статус при первом показе
  if (!status && !loadingStatus) { loadStatus(); return null; }

  const handleSubmit = async () => {
    setError("");
    setSubmitting(true);
    try {
      const res = await submitVerify({
        full_name: form.full_name,
        birth_date: form.birth_date,
        doc_type: form.doc_type,
        doc_number: form.doc_number,
        doc_photo_front: form.doc_photo_front,
        doc_photo_back: form.doc_photo_back,
        selfie_photo: form.selfie_photo,
      });
      setSuccess(res.message);
      setShowForm(false);
      await loadStatus();
      await refreshUser();
      onStatusChange?.();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Ошибка отправки");
    } finally {
      setSubmitting(false);
    }
  };

  const canNext = [
    form.full_name.length >= 3 && form.birth_date,
    form.doc_type && form.doc_number.length >= 4,
    form.doc_photo_front && form.selfie_photo,
    true,
  ][step];

  if (loadingStatus) return (
    <div className="flex items-center gap-2 text-gray-500 text-sm font-roboto">
      <Icon name="Loader" size={14} className="animate-spin" />
      Загрузка...
    </div>
  );

  // Статус уже есть — показываем его
  if (!showForm && status) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ background: status.status === "approved" ? "rgba(0,255,135,0.1)" : "rgba(255,215,0,0.1)", border: "1px solid #1A2430" }}>
              <Icon name="Shield" size={18} className={status.status === "approved" ? "text-neon-green" : "text-gray-500"} />
            </div>
            <div>
              <div className="text-sm font-oswald font-bold text-white">Верификация личности</div>
              <StatusBadge status={status.status} />
            </div>
          </div>
          {(status.status === "not_submitted" || status.status === "rejected") && (
            <button
              onClick={() => { setShowForm(true); setStep(0); setError(""); setSuccess(""); }}
              className="px-4 py-2 bg-neon-green text-sport-dark font-oswald font-bold text-sm rounded-lg uppercase"
              style={{ boxShadow: "0 0 16px rgba(0,255,135,0.25)" }}
            >
              {status.status === "rejected" ? "Подать повторно" : "Пройти верификацию"}
            </button>
          )}
        </div>

        {status.status === "pending" && (
          <div className="rounded-lg px-4 py-3 text-sm font-roboto text-yellow-300"
            style={{ background: "rgba(255,215,0,0.07)", border: "1px solid rgba(255,215,0,0.2)" }}>
            <div className="flex items-center gap-2">
              <Icon name="Clock" size={14} />
              Документы на проверке. Обычно это занимает до 24 часов.
            </div>
            {status.created_at && (
              <div className="text-xs text-yellow-400/60 mt-1">
                Подано: {new Date(status.created_at).toLocaleString("ru-RU")}
              </div>
            )}
          </div>
        )}

        {status.status === "approved" && (
          <div className="rounded-lg px-4 py-3 text-sm font-roboto text-neon-green"
            style={{ background: "rgba(0,255,135,0.07)", border: "1px solid rgba(0,255,135,0.2)" }}>
            <div className="flex items-center gap-2">
              <Icon name="ShieldCheck" size={14} />
              Личность подтверждена. Доступны все функции платформы.
            </div>
          </div>
        )}

        {status.status === "rejected" && (
          <div className="rounded-lg px-4 py-3 text-sm font-roboto text-red-400"
            style={{ background: "rgba(255,59,59,0.07)", border: "1px solid rgba(255,59,59,0.2)" }}>
            <div className="flex items-center gap-2 mb-1">
              <Icon name="ShieldX" size={14} />
              Заявка отклонена
            </div>
            {status.reject_reason && <div className="text-xs text-red-400/80">Причина: {status.reject_reason}</div>}
          </div>
        )}

        {success && (
          <div className="rounded-lg px-4 py-3 text-sm font-roboto text-neon-green"
            style={{ background: "rgba(0,255,135,0.07)", border: "1px solid rgba(0,255,135,0.2)" }}>
            <div className="flex items-center gap-2"><Icon name="CheckCircle" size={14} />{success}</div>
          </div>
        )}
      </div>
    );
  }

  // Форма подачи
  return (
    <div className="glass-card rounded-xl overflow-hidden" style={{ border: "1px solid #1A2430" }}>
      {/* Шапка */}
      <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid #1A2430" }}>
        <div className="flex items-center gap-2">
          <Icon name="Shield" size={18} className="text-neon-green" />
          <span className="font-oswald font-bold text-white">Верификация личности</span>
        </div>
        <button onClick={() => setShowForm(false)} className="text-gray-600 hover:text-white transition-colors">
          <Icon name="X" size={16} />
        </button>
      </div>

      {/* Степпер */}
      <div className="flex px-5 pt-4 gap-1">
        {STEPS.map((s, i) => (
          <div key={s} className="flex-1 flex flex-col items-center gap-1">
            <div className="flex items-center w-full">
              <div className="flex-1 h-0.5" style={{ background: i === 0 ? "transparent" : i <= step ? "#00FF87" : "#1A2430" }} />
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-oswald font-bold flex-shrink-0 transition-all"
                style={{
                  background: i < step ? "#00FF87" : i === step ? "rgba(0,255,135,0.15)" : "#1A2430",
                  border: i === step ? "1.5px solid #00FF87" : i < step ? "1.5px solid #00FF87" : "1.5px solid #1A2430",
                  color: i <= step ? "#00FF87" : "#666",
                }}>
                {i < step ? <Icon name="Check" size={10} /> : i + 1}
              </div>
              <div className="flex-1 h-0.5" style={{ background: i >= step ? "#1A2430" : "#00FF87" }} />
            </div>
            <span className="text-[9px] text-center font-roboto hidden sm:block"
              style={{ color: i === step ? "#00FF87" : "#666" }}>{s}</span>
          </div>
        ))}
      </div>

      <div className="p-5 space-y-4">

        {/* Шаг 0: Личные данные */}
        {step === 0 && (
          <>
            <div>
              <label className="text-xs text-gray-500 font-roboto mb-1.5 block">ФИО полностью *</label>
              <input
                type="text" placeholder="Иванов Иван Иванович"
                value={form.full_name} onChange={e => set("full_name", e.target.value)}
                className="w-full bg-sport-dark border border-sport-border rounded-lg px-4 py-3 text-white font-roboto text-sm focus:outline-none focus:border-neon-green transition-colors"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 font-roboto mb-1.5 block">Дата рождения *</label>
              <input
                type="date" value={form.birth_date} onChange={e => set("birth_date", e.target.value)}
                className="w-full bg-sport-dark border border-sport-border rounded-lg px-4 py-3 text-white font-roboto text-sm focus:outline-none focus:border-neon-green transition-colors"
              />
            </div>
          </>
        )}

        {/* Шаг 1: Документ */}
        {step === 1 && (
          <>
            <div>
              <label className="text-xs text-gray-500 font-roboto mb-1.5 block">Тип документа *</label>
              <select
                value={form.doc_type} onChange={e => set("doc_type", e.target.value)}
                className="w-full bg-sport-dark border border-sport-border rounded-lg px-4 py-3 text-white font-roboto text-sm focus:outline-none focus:border-neon-green transition-colors"
              >
                {DOC_TYPES.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 font-roboto mb-1.5 block">Серия и номер *</label>
              <input
                type="text" placeholder="1234 567890"
                value={form.doc_number} onChange={e => set("doc_number", e.target.value)}
                className="w-full bg-sport-dark border border-sport-border rounded-lg px-4 py-3 text-white font-roboto text-sm focus:outline-none focus:border-neon-green transition-colors"
              />
            </div>
          </>
        )}

        {/* Шаг 2: Фото */}
        {step === 2 && (
          <>
            <PhotoUpload
              label="Лицевая сторона документа *"
              value={form.doc_photo_front}
              onChange={v => set("doc_photo_front", v)}
              hint="Сфотографируй лицевую сторону документа"
            />
            <PhotoUpload
              label="Обратная сторона (если есть)"
              value={form.doc_photo_back}
              onChange={v => set("doc_photo_back", v)}
              hint="Сфотографируй обратную сторону"
            />
            <PhotoUpload
              label="Селфи с документом *"
              value={form.selfie_photo}
              onChange={v => set("selfie_photo", v)}
              hint="Сфотографируйся держа документ рядом с лицом"
            />
          </>
        )}

        {/* Шаг 3: Подтверждение */}
        {step === 3 && (
          <div className="space-y-3">
            <div className="rounded-lg p-4 space-y-2" style={{ background: "rgba(0,255,135,0.05)", border: "1px solid rgba(0,255,135,0.15)" }}>
              <div className="text-xs text-gray-500 font-roboto font-bold uppercase tracking-wider mb-2">Ваши данные</div>
              {[
                { label: "ФИО", value: form.full_name },
                { label: "Дата рождения", value: form.birth_date },
                { label: "Тип документа", value: DOC_TYPES.find(d => d.value === form.doc_type)?.label },
                { label: "Номер", value: form.doc_number },
              ].map(r => (
                <div key={r.label} className="flex justify-between text-sm">
                  <span className="text-gray-500 font-roboto">{r.label}</span>
                  <span className="text-white font-roboto">{r.value}</span>
                </div>
              ))}
            </div>
            <div className="flex items-start gap-2 text-xs text-gray-600 font-roboto p-3 rounded-lg" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid #1A2430" }}>
              <Icon name="Info" size={13} className="flex-shrink-0 mt-0.5 text-gray-700" />
              Отправляя данные, вы подтверждаете их достоверность и соглашаетесь на обработку персональных данных. Проверка занимает до 24 часов.
            </div>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 text-red-400 text-sm font-roboto bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
            <Icon name="AlertCircle" size={14} />{error}
          </div>
        )}

        {/* Навигация */}
        <div className="flex gap-2 pt-1">
          {step > 0 && (
            <button
              onClick={() => setStep(s => s - 1)}
              className="flex-1 py-2.5 border border-sport-border text-gray-400 hover:text-white font-oswald font-bold text-sm rounded-lg transition-colors"
            >
              Назад
            </button>
          )}
          {step < STEPS.length - 1 ? (
            <button
              onClick={() => setStep(s => s + 1)}
              disabled={!canNext}
              className="flex-1 py-2.5 bg-neon-green text-sport-dark font-oswald font-bold text-sm rounded-lg uppercase disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              Далее
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex-1 py-2.5 bg-neon-green text-sport-dark font-oswald font-bold text-sm rounded-lg uppercase disabled:opacity-60 disabled:cursor-not-allowed transition-all"
              style={{ boxShadow: "0 0 16px rgba(0,255,135,0.25)" }}
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <Icon name="Loader" size={14} className="animate-spin" />
                  Отправка...
                </span>
              ) : "Отправить на проверку"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
