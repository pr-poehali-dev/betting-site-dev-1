import { useState } from "react";
import { register, login } from "@/lib/auth";
import { useAuth } from "@/context/AuthContext";
import Icon from "@/components/ui/icon";

interface AuthModalProps {
  onClose: () => void;
  defaultTab?: "login" | "register";
}

export default function AuthModal({ onClose, defaultTab = "login" }: AuthModalProps) {
  const { login: authLogin } = useAuth();
  const [tab, setTab] = useState<"login" | "register">(defaultTab);
  const [form, setForm] = useState({ email: "", username: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    setError("");
    setLoading(true);
    try {
      let result;
      if (tab === "login") {
        result = await login(form.email, form.password);
      } else {
        result = await register(form.email, form.username, form.password);
      }
      authLogin(result.token, result.user);
      onClose();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Произошла ошибка");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ background: "rgba(8,12,16,0.85)", backdropFilter: "blur(8px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-md rounded-2xl p-8 relative animate-fade-in"
        style={{
          background: "#0F1519",
          border: "1px solid #1A2430",
          boxShadow: "0 0 60px rgba(0,255,135,0.08)",
          opacity: 0,
          animationFillMode: "forwards",
        }}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-600 hover:text-white transition-colors"
        >
          <Icon name="X" size={18} />
        </button>

        {/* Logo */}
        <div className="flex items-center gap-2 mb-6">
          <div className="w-8 h-8 rounded bg-neon-green flex items-center justify-center">
            <Icon name="Zap" size={16} className="text-sport-dark" />
          </div>
          <span className="font-oswald text-xl font-bold text-white">
            БЕТ<span className="text-neon-green">СПОРТ</span>
          </span>
        </div>

        {/* Tabs */}
        <div className="flex mb-6 rounded-lg overflow-hidden border border-sport-border">
          {(["login", "register"] as const).map((t) => (
            <button
              key={t}
              onClick={() => { setTab(t); setError(""); }}
              className={`flex-1 py-2.5 font-oswald font-bold text-sm uppercase tracking-wide transition-all ${
                tab === t
                  ? "bg-neon-green text-sport-dark"
                  : "text-gray-500 hover:text-white"
              }`}
            >
              {t === "login" ? "Войти" : "Регистрация"}
            </button>
          ))}
        </div>

        <div className="space-y-4">
          {tab === "register" && (
            <div>
              <label className="text-xs text-gray-500 font-roboto mb-1.5 block">Логин</label>
              <input
                type="text"
                placeholder="sportplayer"
                value={form.username}
                onChange={(e) => set("username", e.target.value)}
                className="w-full bg-sport-dark border border-sport-border rounded-lg px-4 py-3 text-white font-roboto text-sm focus:outline-none focus:border-neon-green transition-colors placeholder:text-gray-700"
              />
            </div>
          )}
          <div>
            <label className="text-xs text-gray-500 font-roboto mb-1.5 block">Email</label>
            <input
              type="email"
              placeholder="email@example.com"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              className="w-full bg-sport-dark border border-sport-border rounded-lg px-4 py-3 text-white font-roboto text-sm focus:outline-none focus:border-neon-green transition-colors placeholder:text-gray-700"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 font-roboto mb-1.5 block">Пароль</label>
            <input
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={(e) => set("password", e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              className="w-full bg-sport-dark border border-sport-border rounded-lg px-4 py-3 text-white font-roboto text-sm focus:outline-none focus:border-neon-green transition-colors placeholder:text-gray-700"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-400 text-sm font-roboto bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              <Icon name="AlertCircle" size={14} />
              {error}
            </div>
          )}

          {tab === "register" && (
            <div className="flex items-start gap-2 text-xs text-gray-600 font-roboto">
              <Icon name="Info" size={13} className="flex-shrink-0 mt-0.5 text-gray-700" />
              Регистрируясь, вы подтверждаете что вам исполнилось 18 лет и соглашаетесь с правилами платформы.
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full py-3.5 bg-neon-green text-sport-dark font-oswald font-bold text-base rounded-lg uppercase tracking-wide transition-all hover:scale-[1.02] disabled:opacity-60 disabled:cursor-not-allowed"
            style={{ boxShadow: "0 0 20px rgba(0,255,135,0.3)" }}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <Icon name="Loader" size={16} className="animate-spin" />
                {tab === "login" ? "Вход..." : "Регистрация..."}
              </span>
            ) : tab === "login" ? "Войти в аккаунт" : "Создать аккаунт"}
          </button>

          {tab === "login" && (
            <button
              onClick={() => { setTab("register"); setError(""); }}
              className="w-full text-center text-sm text-gray-500 hover:text-neon-green transition-colors font-roboto"
            >
              Ещё нет аккаунта? <span className="text-neon-green">Зарегистрироваться</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
