"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Leaf } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";

export default function Home() {
  const router = useRouter();
  const { t } = useI18n();

  useEffect(() => {
    const timer = setTimeout(() => {
      const token = localStorage.getItem("khethai-auth-token");
      router.replace(token ? "/dashboard" : "/login");
    }, 2200);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-kh-bg relative overflow-hidden">
      {/* Background gradient orbs */}
      <div className="orb w-[500px] h-[500px] bg-emerald-600/40 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-glow" />
      <div className="orb w-[300px] h-[300px] bg-blue-600/20 -bottom-20 -left-20" />

      <div className="relative z-10 text-center animate-fade-in">
        <div className="w-16 h-16 mx-auto mb-10 rounded-2xl gradient-accent flex items-center justify-center shadow-lg shadow-emerald-500/20">
          <Leaf className="w-8 h-8 text-black" />
        </div>

        <h1 className="font-display text-display-xl text-kh-text mb-2 tracking-tight">
          {t.common.appName}
        </h1>
        <p className="text-body-sm text-kh-text-dim tracking-[0.2em] uppercase max-w-[200px] mx-auto">
          {t.common.tagline}
        </p>

        <div className="mt-16">
          <div className="w-6 h-6 mx-auto border border-kh-text-dim/30 border-t-kh-accent rounded-full animate-spin" />
        </div>
      </div>
    </div>
  );
}
