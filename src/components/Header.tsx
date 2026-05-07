import { useState } from "react";
import Icon from "@/components/ui/icon";
import { useAuth } from "@/context/AuthContext";
import AuthModal from "@/components/AuthModal";

interface HeaderProps {
  activeSection: string;
  onNav: (section: string) => void;
}

const navItems = [
  { id: "home", label: "Главная", icon: "Home" },
  { id: "bets", label: "Ставки", icon: "TrendingUp" },
  { id: "live", label: "Live", icon: "Radio" },
  { id: "line", label: "Линия", icon: "BarChart2" },
  { id: "promo", label: "Акции", icon: "Gift" },
  { id: "support", label: "Поддержка", icon: "Headphones" },
];

export default function Header({ activeSection, onNav }: HeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [authModal, setAuthModal] = useState<"login" | "register" | null>(null);
  const { user, pendingCount } = useAuth();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass-card border-b border-sport-border">
      <div className="gradient-line" />
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-14">
        {/* Logo */}
        <button
          onClick={() => onNav("home")}
          className="flex items-center gap-2 group"
        >
          <div className="w-8 h-8 rounded flex items-center justify-center bg-neon-green">
            <Icon name="Zap" size={18} className="text-sport-dark" />
          </div>
          <span className="font-oswald text-xl font-bold text-white tracking-widest">
            БЕТ<span className="text-neon-green">СПОРТ</span>
          </span>
        </button>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onNav(item.id)}
              className={`nav-item flex items-center gap-1.5 relative ${activeSection === item.id ? "active" : ""}`}
            >
              {item.id === "live" && (
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              )}
              {item.label}
              {item.id === "bets" && pendingCount > 0 && (
                <span
                  className="min-w-[16px] h-4 rounded-full flex items-center justify-center text-[10px] font-oswald font-bold text-sport-dark px-1"
                  style={{ background: "#00FF87", boxShadow: "0 0 6px rgba(0,255,135,0.6)" }}
                >
                  {pendingCount > 9 ? "9+" : pendingCount}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          {user ? (
            <button
              onClick={() => onNav("profile")}
              className="hidden md:flex items-center gap-2 px-4 py-1.5 bg-neon-green text-sport-dark font-oswald font-bold text-sm rounded transition-all hover:shadow-lg"
              style={{ boxShadow: "0 0 12px rgba(0,255,135,0.3)" }}
            >
              <Icon name="User" size={14} />
              {user.username}
            </button>
          ) : (
            <>
              <button
                onClick={() => setAuthModal("login")}
                className="hidden md:flex items-center gap-2 odds-btn"
              >
                <Icon name="User" size={14} />
                Войти
              </button>
              <button
                onClick={() => setAuthModal("register")}
                className="hidden md:flex items-center gap-2 px-4 py-1.5 bg-neon-green text-sport-dark font-oswald font-bold text-sm rounded transition-all hover:shadow-lg"
                style={{ boxShadow: "0 0 12px rgba(0,255,135,0.3)" }}
              >
                Регистрация
              </button>
            </>
          )}
          <button
            className="md:hidden text-gray-400 hover:text-neon-green transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            <Icon name={mobileOpen ? "X" : "Menu"} size={22} />
          </button>
        </div>
      </div>

      {authModal && (
        <AuthModal defaultTab={authModal} onClose={() => setAuthModal(null)} />
      )}

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-sport-border bg-sport-card">
          <nav className="flex flex-col p-2">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => { onNav(item.id); setMobileOpen(false); }}
                className={`nav-item flex items-center gap-2 text-left ${activeSection === item.id ? "active" : ""}`}
              >
                <Icon name={item.icon} size={15} fallback="Circle" />
                {item.id === "live" && (
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                )}
                {item.label}
              </button>
            ))}
          {!user && (
            <div className="flex gap-2 mt-2 px-3">
              <button onClick={() => { setAuthModal("login"); setMobileOpen(false); }} className="flex-1 odds-btn text-center">Войти</button>
              <button onClick={() => { setAuthModal("register"); setMobileOpen(false); }} className="flex-1 py-1.5 bg-neon-green text-sport-dark font-oswald font-bold text-sm rounded">Регистрация</button>
            </div>
          )}
          </nav>
        </div>
      )}
    </header>
  );
}