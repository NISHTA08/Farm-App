"use client";

import { useI18n } from "@/lib/i18n/context";
import { locales, type Locale } from "@/lib/i18n/translations";
import { Globe } from "lucide-react";
import { useState, useRef, useEffect } from "react";

export default function LanguageSwitcher() {
  const { locale, setLocale } = useI18n();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-body-sm
          text-kh-text-muted hover:text-kh-text hover:bg-kh-surface
          transition-all duration-200 touch-manipulation"
        aria-label="Change language"
      >
        <Globe size={16} />
        <span className="uppercase text-body-xs font-medium">{locale}</span>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 py-1 min-w-[140px] rounded-xl glass-strong shadow-2xl z-50 animate-fade-in">
          {locales.map((loc) => (
            <button
              key={loc.code}
              onClick={() => {
                setLocale(loc.code as Locale);
                setOpen(false);
              }}
              className={`
                w-full text-left px-4 py-2.5 text-body-sm transition-colors
                ${locale === loc.code ? "text-kh-accent font-medium" : "text-kh-text-muted hover:text-kh-text hover:bg-kh-surface"}
              `}
            >
              {loc.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
