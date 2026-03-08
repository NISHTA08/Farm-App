"use client";

import { useI18n } from "@/lib/i18n/context";
import { locales, type Locale } from "@/lib/i18n/translations";
import { Globe } from "lucide-react";
import { useState, useRef, useEffect } from "react";

export default function LanguageSwitcher() {
  const { locale, setLocale } = useI18n();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const ignoreNextOutside = useRef(false);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent | TouchEvent) {
      if (ignoreNextOutside.current) {
        ignoreNextOutside.current = false;
        return;
      }
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    const t = setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside, { passive: true });
    }, 0);
    return () => {
      clearTimeout(t);
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [open]);

  const handleToggle = () => {
    const next = !open;
    if (next) ignoreNextOutside.current = true;
    setOpen(next);
  };

  return (
    <div className="relative z-[100]" ref={ref}>
      <button
        type="button"
        onClick={handleToggle}
        className="flex items-center gap-1.5 min-h-[48px] min-w-[48px] px-3 py-2 rounded-xl text-body-sm
          text-kh-text hover:text-kh-text hover:bg-kh-surface
          transition-all duration-200 touch-manipulation active:bg-kh-surface"
        aria-label="Change language"
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <Globe size={16} className="shrink-0" />
        <span className="uppercase text-body-xs font-medium">{locale}</span>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 py-1 min-w-[160px] rounded-xl glass-strong shadow-2xl z-[110] animate-fade-in border border-white/10">
          {locales.map((loc) => (
            <button
              key={loc.code}
              type="button"
              onClick={() => {
                setLocale(loc.code as Locale);
                setOpen(false);
              }}
              className={`
                w-full text-left px-4 min-h-[48px] py-2.5 text-body-sm transition-colors touch-manipulation
                ${locale === loc.code ? "text-kh-accent font-medium bg-kh-accent/10" : "text-kh-text hover:text-kh-text hover:bg-kh-surface active:bg-kh-surface"}
              `}
              role="option"
              aria-selected={locale === loc.code}
            >
              {loc.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
