"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n/context";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import BottomNav from "@/components/BottomNav";
import {
  ScanLine,
  CloudSun,
  TrendingUp,
  Sprout,
  LogOut,
  Leaf,
  ArrowUpRight,
  Sparkles,
  Landmark,
  Mic,
  MessageSquare,
} from "lucide-react";

function getFeatures(t: ReturnType<typeof useI18n>["t"]) {
  return [
    { id: "chat", title: "AI Chat", desc: t.dashboard.chatDesc, icon: MessageSquare, href: "/chat", gradient: "from-cyan-500/20 via-cyan-500/5 to-transparent", iconBg: "bg-cyan-500/15", iconColor: "text-cyan-400", glowClass: "glow-blue" as const },
    { id: "crop-doctor", title: t.dashboard.cropDoctor, desc: t.dashboard.cropDoctorDesc, icon: ScanLine, href: "/crop-doctor", gradient: "from-emerald-500/20 via-emerald-500/5 to-transparent", iconBg: "bg-emerald-500/15", iconColor: "text-emerald-400", glowClass: "glow-green" as const },
    { id: "weather", title: t.dashboard.weather, desc: t.dashboard.weatherDesc, icon: CloudSun, href: "/weather", gradient: "from-blue-500/20 via-blue-500/5 to-transparent", iconBg: "bg-blue-500/15", iconColor: "text-blue-400", glowClass: "glow-blue" as const },
    { id: "mandi", title: t.dashboard.mandiPrices, desc: t.dashboard.mandiPricesDesc, icon: TrendingUp, href: "/mandi", gradient: "from-amber-500/20 via-amber-500/5 to-transparent", iconBg: "bg-amber-500/15", iconColor: "text-amber-400", glowClass: "glow-amber" as const },
    { id: "farm", title: t.dashboard.myFarm, desc: t.dashboard.myFarmDesc, icon: Sprout, href: "/farm", gradient: "from-violet-500/20 via-violet-500/5 to-transparent", iconBg: "bg-violet-500/15", iconColor: "text-violet-400", glowClass: "glow-violet" as const },
  ];
}

export default function DashboardPage() {
  const { t } = useI18n();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("khethai-auth-token");
    if (!token) { router.replace("/login"); return; }
    setMounted(true);
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("khethai-auth-token");
    localStorage.removeItem("khethai-user-phone");
    router.replace("/login");
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-kh-bg pb-28 relative overflow-hidden">
      <div className="orb w-[400px] h-[400px] bg-emerald-600/25 -top-48 -right-32 animate-float" />
      <div className="orb w-[300px] h-[300px] bg-blue-600/15 top-[600px] -left-40 animate-float" style={{ animationDelay: "2s" }} />

      {/* Header - z-20 so language/logout stay tappable above orbs */}
      <header className="relative z-20 px-6 pt-5 pb-2">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg gradient-accent flex items-center justify-center">
              <Leaf className="w-4 h-4 text-black" />
            </div>
            <span className="text-body-md font-semibold tracking-tight">{t.common.appName}</span>
          </div>
          <div className="flex items-center gap-1 relative z-20">
            <LanguageSwitcher />
            <button onClick={handleLogout}
              className="p-2 rounded-lg text-kh-text-dim hover:text-kh-text-muted hover:bg-white/5 transition-all"
              aria-label="Logout">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative z-10 px-6 pt-8 pb-8">
        <div className="max-w-lg mx-auto">
          <p className="text-body-xs text-kh-text-dim tracking-[0.15em] uppercase mb-2">{t.common.welcomeBack}</p>
          <h1 className="font-display text-hero text-kh-text leading-[1.05] mb-4">
            <span className="text-gradient">{t.common.taglineLine1.split(" ")[0]}</span> {t.common.taglineLine1.split(" ").slice(1).join(" ")}
            <br />{t.common.taglineLine2}
          </h1>
        </div>
      </section>

      {/* AI Assistant CTA */}
      <section className="relative z-10 px-6 mb-5">
        <div className="max-w-lg mx-auto">
          <button
            onClick={() => router.push("/chat")}
            className="w-full glow-card glow-green bg-kh-card p-5 text-left active:scale-[0.98] transition-all touch-manipulation group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl gradient-accent flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:shadow-emerald-500/40 transition-shadow">
                <Sparkles size={22} className="text-black" />
              </div>
              <div className="flex-1">
                <h2 className="text-body-lg font-semibold text-kh-text">{t.dashboard.aiAssistantTitle}</h2>
                <p className="text-body-xs text-kh-text-dim mt-0.5 flex items-center gap-1.5">
                  {t.dashboard.aiAssistantDesc}
                  <Mic size={10} className="text-kh-accent" />
                  {t.dashboard.voiceEnabled}
                </p>
              </div>
              <ArrowUpRight size={16} className="text-kh-text-dim group-hover:text-kh-accent transition-colors" />
            </div>
          </button>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="relative z-10 px-6">
        <div className="max-w-lg mx-auto">
          <h2 className="text-body-sm font-semibold text-kh-text-muted mb-3">{t.dashboard.title}</h2>
          <div className="grid grid-cols-2 gap-3">
          {getFeatures(t).map((feature, index) => {
            const Icon = feature.icon;
            return (
              <button
                key={feature.id}
                onClick={() => router.push(feature.href)}
                className={`glow-card ${feature.glowClass} group relative bg-kh-card p-5 text-left active:scale-[0.97] transition-all duration-300 touch-manipulation animate-scale-in`}
                style={{ animationDelay: `${index * 80}ms` }}
              >
                <div className={`absolute inset-0 rounded-[inherit] bg-gradient-to-br ${feature.gradient} opacity-60 group-hover:opacity-100 transition-opacity duration-500`} />
                <div className="relative z-10">
                  <div className={`w-10 h-10 rounded-xl ${feature.iconBg} flex items-center justify-center mb-6`}>
                    <Icon size={18} className={feature.iconColor} strokeWidth={1.8} />
                  </div>
                  <h3 className="text-body-md font-semibold text-kh-text mb-0.5">{feature.title}</h3>
                  <p className="text-body-xs text-kh-text-dim">{feature.desc}</p>
                </div>
              </button>
            );
          })}
          </div>
        </div>
      </section>

      {/* Govt Schemes CTA */}
      <section className="relative z-10 px-6 mt-4">
        <div className="max-w-lg mx-auto">
          <button
            onClick={() => router.push("/schemes")}
            className="w-full glow-card bg-kh-card p-4 text-left active:scale-[0.98] transition-all touch-manipulation group flex items-center gap-4"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-500/15 flex items-center justify-center shrink-0">
              <Landmark size={18} className="text-blue-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-body-sm font-semibold text-kh-text">{t.dashboard.govtSchemes}</h3>
              <p className="text-body-xs text-kh-text-dim">{t.dashboard.govtSchemesDesc}</p>
            </div>
            <ArrowUpRight size={14} className="text-kh-text-dim group-hover:text-blue-400 transition-colors shrink-0" />
          </button>
        </div>
      </section>

      {/* Status bar */}
      <section className="relative z-10 px-6 mt-4">
        <div className="max-w-lg mx-auto glow-card bg-kh-card p-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-2 h-2 rounded-full bg-kh-accent animate-pulse-soft" />
            <span className="text-body-xs text-kh-text-dim">System Online</span>
          </div>
          <div className="flex items-center gap-3 text-body-xs text-kh-text-dim">
            <span><span className="text-kh-text-muted">AI</span> Ready</span>
            <div className="w-px h-3 bg-kh-border" />
            <span><span className="text-kh-text-muted">7</span> Schemes</span>
            <div className="w-px h-3 bg-kh-border" />
            <span><span className="text-kh-text-muted">18</span> Crops</span>
          </div>
        </div>
      </section>

      <BottomNav />
    </div>
  );
}
