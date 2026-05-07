import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import Header from "@/components/Header";
import TickerBar from "@/components/TickerBar";
import HomeSection from "@/components/sections/HomeSection";
import BetsSection from "@/components/sections/BetsSection";
import LiveSection from "@/components/sections/LiveSection";
import LineSection from "@/components/sections/LineSection";
import ProfileSection from "@/components/sections/ProfileSection";
import HistorySection from "@/components/sections/HistorySection";
import PromoSection from "@/components/sections/PromoSection";
import SupportSection from "@/components/sections/SupportSection";
import Icon from "@/components/ui/icon";

const mobileNav = [
  { id: "home", icon: "Home", label: "Главная" },
  { id: "bets", icon: "TrendingUp", label: "Ставки" },
  { id: "live", icon: "Radio", label: "Live" },
  { id: "profile", icon: "User", label: "Кабинет" },
];

export default function Index() {
  const [section, setSection] = useState("home");
  const { pendingCount } = useAuth();

  const renderSection = () => {
    switch (section) {
      case "home": return <HomeSection onNav={setSection} />;
      case "bets": return <BetsSection />;
      case "live": return <LiveSection />;
      case "line": return <LineSection />;
      case "profile": return <ProfileSection />;
      case "history": return <HistorySection />;
      case "promo": return <PromoSection />;
      case "support": return <SupportSection />;
      default: return <HomeSection onNav={setSection} />;
    }
  };

  return (
    <div className="min-h-screen bg-sport-dark flex flex-col">
      <Header activeSection={section} onNav={setSection} />
      <TickerBar />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-6 pb-20 md:pb-6 mt-14">
        <div key={section} className="animate-fade-in" style={{ opacity: 0, animationFillMode: "forwards" }}>
          {renderSection()}
        </div>
      </main>

      <footer className="hidden md:block bg-sport-card border-t border-sport-border py-6 mt-auto">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-neon-green flex items-center justify-center">
              <Icon name="Zap" size={14} className="text-sport-dark" />
            </div>
            <span className="font-oswald text-white font-bold">
              БЕТ<span className="text-neon-green">СПОРТ</span>
            </span>
          </div>
          <div className="flex gap-5">
            {[
              { id: "promo", label: "Акции" },
              { id: "history", label: "История" },
              { id: "support", label: "Поддержка" },
            ].map((l) => (
              <button
                key={l.id}
                onClick={() => setSection(l.id)}
                className="text-gray-500 hover:text-neon-green text-sm font-roboto transition-colors"
              >
                {l.label}
              </button>
            ))}
          </div>
          <div className="text-gray-700 text-xs font-roboto">
            18+ · Лицензия ФНС России
          </div>
        </div>
      </footer>

      <nav className="fixed bottom-0 left-0 right-0 md:hidden glass-card border-t border-sport-border z-50">
        <div className="flex">
          {mobileNav.map((item) => (
            <button
              key={item.id}
              onClick={() => setSection(item.id)}
              className={`flex-1 flex flex-col items-center justify-center py-2.5 gap-1 transition-colors ${
                section === item.id ? "text-neon-green" : "text-gray-600"
              }`}
            >
              <div className="relative">
                <Icon name={item.icon} size={20} fallback="Circle" />
                {item.id === "live" && (
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                )}
                {item.id === "bets" && pendingCount > 0 && (
                  <span
                    className="absolute -top-1.5 -right-2 min-w-[16px] h-4 rounded-full flex items-center justify-center text-[10px] font-oswald font-bold text-sport-dark px-1"
                    style={{ background: "#00FF87", boxShadow: "0 0 6px rgba(0,255,135,0.6)" }}
                  >
                    {pendingCount > 9 ? "9+" : pendingCount}
                  </span>
                )}
              </div>
              <span className="text-xs font-oswald">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}