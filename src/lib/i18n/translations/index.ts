import en from "./en";
import hi from "./hi";
import te from "./te";
import type { TranslationKeys } from "./en";

export type Locale = "en" | "hi" | "te";

export const locales = [
  { code: "en", label: "English" },
  { code: "hi", label: "हिन्दी" },
  { code: "te", label: "తెలుగు" },
];

export const translations: Record<Locale, TranslationKeys> = { en, hi, te };
export type { TranslationKeys };
