"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n/context";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { Leaf, Phone, Lock, ArrowLeft } from "lucide-react";

type AuthStep = "phone" | "otp";

export default function LoginPage() {
  const { t } = useI18n();
  const router = useRouter();

  const [step, setStep] = useState<AuthStep>("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resendTimer, setResendTimer] = useState(0);
  const [demoOtp, setDemoOtp] = useState<string | null>(null);
  const otpInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (resendTimer <= 0) return;
    const interval = setInterval(() => setResendTimer((p) => p - 1), 1000);
    return () => clearInterval(interval);
  }, [resendTimer]);

  useEffect(() => {
    if (step === "otp") otpInputRef.current?.focus();
  }, [step]);

  const handleSendOtp = useCallback(async () => {
    setError("");
    if (!/^[6-9]\d{9}$/.test(phone)) {
      setError(t.auth.invalidPhone);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || t.auth.otpFailed);
        return;
      }
      if (data.demo && data.hint) {
        setDemoOtp(data.hint);
      }
      setStep("otp");
      setResendTimer(30);
    } catch {
      setError(t.auth.otpFailed);
    } finally {
      setLoading(false);
    }
  }, [phone, t]);

  const handleVerifyOtp = useCallback(async () => {
    setError("");
    if (!/^\d{6}$/.test(otp)) {
      setError(t.auth.invalidOtp);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, otp }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || t.auth.verifyFailed);
        return;
      }
      localStorage.setItem("khethai-auth-token", data.token);
      localStorage.setItem("khethai-user-phone", phone);
      router.replace("/dashboard");
    } catch {
      setError(t.auth.verifyFailed);
    } finally {
      setLoading(false);
    }
  }, [otp, phone, router, t]);

  const handleResendOtp = useCallback(async () => {
    if (resendTimer > 0) return;
    setLoading(true);
    setDemoOtp(null);
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (data.demo && data.hint) setDemoOtp(data.hint);
      setResendTimer(30);
      setOtp("");
    } catch {
      setError(t.auth.otpFailed);
    } finally {
      setLoading(false);
    }
  }, [resendTimer, phone, t]);

  return (
    <div className="min-h-screen flex flex-col bg-kh-bg relative overflow-hidden">
      <div className="orb w-[500px] h-[500px] bg-emerald-600/25 -top-60 left-1/2 -translate-x-1/2 animate-glow" />
      <div className="orb w-[250px] h-[250px] bg-blue-600/15 bottom-20 -right-20" />

      <div className="relative z-10 flex justify-between items-center px-6 pt-5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg gradient-accent flex items-center justify-center">
            <Leaf className="w-3.5 h-3.5 text-black" />
          </div>
          <span className="text-body-sm font-medium text-kh-text-muted">KhethAi</span>
        </div>
        <LanguageSwitcher />
      </div>

      <div className="relative z-10 flex-1 flex flex-col justify-center px-6 pb-12 max-w-md mx-auto w-full">
        {step === "phone" ? (
          <div className="animate-fade-in">
            <p className="text-body-xs text-kh-text-dim tracking-[0.2em] uppercase mb-4">Get Started</p>
            <h1 className="font-display text-display-xl text-kh-text mb-3 tracking-tight">
              welcome to
              <br />
              <span className="text-gradient">KhethAi</span>
            </h1>
            <p className="text-body-md text-kh-text-dim mb-12 max-w-[280px]">
              {t.auth.subtitle}
            </p>

            <div className="glow-card bg-kh-card p-6 glow-green">
              <Input
                label={t.auth.phoneLabel}
                type="tel"
                inputMode="numeric"
                maxLength={10}
                placeholder={t.auth.phonePlaceholder}
                value={phone}
                onChange={(e) => { setPhone(e.target.value.replace(/\D/g, "")); setError(""); }}
                error={error}
                icon={<Phone size={16} />}
                autoComplete="tel"
              />
              <div className="mt-6">
                <Button fullWidth size="lg" loading={loading} onClick={handleSendOtp}>
                  {t.auth.sendOtp}
                </Button>
              </div>
            </div>

            <p className="text-body-xs text-kh-text-dim text-center mt-8 max-w-[260px] mx-auto leading-relaxed">
              We&apos;ll send a 6-digit OTP to verify your number via SMS
            </p>
          </div>
        ) : (
          <div className="animate-fade-in">
            <button
              onClick={() => { setStep("phone"); setOtp(""); setError(""); setDemoOtp(null); }}
              className="flex items-center gap-1.5 text-kh-text-dim hover:text-kh-text-muted text-body-sm mb-10 min-h-[44px] touch-manipulation transition-colors"
            >
              <ArrowLeft size={16} /> {t.common.back}
            </button>

            <h1 className="font-display text-display-lg text-kh-text mb-3">{t.auth.otpTitle}</h1>
            <p className="text-body-md text-kh-text-dim mb-8">
              {t.auth.otpSubtitle}{" "}
              <span className="text-kh-text font-medium">+91 {phone}</span>
            </p>

            {demoOtp && (
              <div className="mb-5 p-4 rounded-2xl bg-gradient-to-br from-kh-accent/15 to-emerald-500/5 border border-kh-accent/25 backdrop-blur-sm">
                <div className="flex items-center gap-2 mb-2.5">
                  <div className="w-5 h-5 rounded-full bg-kh-accent/20 flex items-center justify-center">
                    <Lock size={10} className="text-kh-accent" />
                  </div>
                  <span className="text-body-xs text-kh-accent font-semibold tracking-wide">Your Verification Code</span>
                </div>
                <div className="flex items-center justify-center py-2">
                  <span className="font-mono text-[28px] text-kh-text font-bold tracking-[0.4em] leading-none">{demoOtp}</span>
                </div>
                <p className="text-[10px] text-kh-text-dim text-center mt-2">Enter this code above to continue</p>
              </div>
            )}

            <div className="glow-card bg-kh-card p-6 glow-green">
              <Input
                ref={otpInputRef}
                label="OTP Code"
                type="tel"
                inputMode="numeric"
                maxLength={6}
                placeholder={t.auth.otpPlaceholder}
                value={otp}
                onChange={(e) => { setOtp(e.target.value.replace(/\D/g, "")); setError(""); }}
                error={error}
                icon={<Lock size={16} />}
                autoComplete="one-time-code"
              />
              <div className="mt-6">
                <Button fullWidth size="lg" loading={loading} onClick={handleVerifyOtp}>
                  {t.auth.verifyOtp}
                </Button>
              </div>
            </div>

            <div className="text-center mt-8">
              {resendTimer > 0 ? (
                <p className="text-body-sm text-kh-text-dim">
                  Resend in <span className="text-kh-text-muted font-medium">{resendTimer}s</span>
                </p>
              ) : (
                <button onClick={handleResendOtp} disabled={loading}
                  className="text-body-sm font-medium text-kh-accent hover:text-kh-accent-strong min-h-[44px] touch-manipulation disabled:opacity-40 transition-colors">
                  {t.auth.resendOtp}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
