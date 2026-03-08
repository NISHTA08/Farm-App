"use client";

import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  ScanLine,
  Sparkles,
  TrendingUp,
  Sprout,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Home" },
  { href: "/crop-doctor", icon: ScanLine, label: "Scan" },
  { href: "/chat", icon: Sparkles, label: "AI Chat", center: true },
  { href: "/mandi", icon: TrendingUp, label: "Market" },
  { href: "/farm", icon: Sprout, label: "Farm" },
];

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 safe-bottom">
      <div className="glass-strong">
        <div className="max-w-lg mx-auto flex items-center justify-around px-2 py-1.5">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            if (item.center) {
              return (
                <button
                  key={item.href}
                  onClick={() => router.push(item.href)}
                  className={`
                    relative -mt-5 flex flex-col items-center gap-0.5 touch-manipulation
                  `}
                  aria-label={item.label}
                >
                  <div className={`
                    w-12 h-12 rounded-2xl flex items-center justify-center
                    shadow-lg transition-all duration-300
                    ${isActive
                      ? "gradient-accent shadow-emerald-500/40 scale-105"
                      : "bg-kh-elevated border border-kh-border-strong shadow-black/30 hover:border-kh-accent/30"
                    }
                  `}>
                    <Icon size={20} className={isActive ? "text-black" : "text-kh-text"} strokeWidth={isActive ? 2.2 : 1.5} />
                  </div>
                  <span className={`text-[10px] leading-none mt-0.5 ${isActive ? "text-kh-accent font-semibold" : "text-kh-text-dim font-medium"}`}>
                    {item.label}
                  </span>
                </button>
              );
            }

            return (
              <button
                key={item.href}
                onClick={() => router.push(item.href)}
                className={`
                  relative flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl
                  transition-all duration-300 touch-manipulation min-w-[48px]
                  ${isActive ? "text-kh-accent" : "text-kh-text-dim hover:text-kh-text-muted"}
                `}
                aria-label={item.label}
                aria-current={isActive ? "page" : undefined}
              >
                {isActive && (
                  <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-kh-accent shadow-[0_0_8px_2px_rgba(34,197,94,0.5)]" />
                )}
                <Icon size={20} strokeWidth={isActive ? 2.2 : 1.5} />
                <span className={`text-[10px] leading-none ${isActive ? "font-semibold" : "font-medium"}`}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
