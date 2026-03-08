import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        kh: {
          bg: "#050505",
          surface: "#0f0f0f",
          card: "#161616",
          elevated: "#1e1e1e",
          border: "rgba(255,255,255,0.06)",
          "border-strong": "rgba(255,255,255,0.12)",
          text: "#F5F5F5",
          "text-secondary": "#BBBBBB",
          "text-muted": "#888888",
          "text-dim": "#555555",
          accent: "#22C55E",
          "accent-muted": "rgba(34,197,94,0.12)",
          "accent-strong": "#16A34A",
          danger: "#EF4444",
          warning: "#F59E0B",
          info: "#3B82F6",
        },
      },
      fontFamily: {
        display: [
          "Georgia",
          "Cambria",
          '"Times New Roman"',
          "Times",
          "serif",
        ],
        body: [
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          '"Segoe UI"',
          "Roboto",
          "sans-serif",
        ],
      },
      fontSize: {
        "hero": ["3.5rem", { lineHeight: "1.05", letterSpacing: "-0.03em" }],
        "display-xl": ["2.75rem", { lineHeight: "1.08", letterSpacing: "-0.03em" }],
        "display-lg": ["2rem", { lineHeight: "1.15", letterSpacing: "-0.02em" }],
        "display-md": ["1.5rem", { lineHeight: "1.2", letterSpacing: "-0.01em" }],
        "display-sm": ["1.25rem", { lineHeight: "1.3" }],
        "body-lg": ["1.0625rem", { lineHeight: "1.6" }],
        "body-md": ["0.9375rem", { lineHeight: "1.55" }],
        "body-sm": ["0.8125rem", { lineHeight: "1.5" }],
        "body-xs": ["0.6875rem", { lineHeight: "1.4", letterSpacing: "0.02em" }],
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.25rem",
        "4xl": "1.5rem",
      },
      animation: {
        "fade-in": "fadeIn 0.6s ease-out forwards",
        "slide-up": "slideUp 0.6s ease-out forwards",
        "scale-in": "scaleIn 0.5s ease-out forwards",
        "pulse-soft": "pulseSoft 3s ease-in-out infinite",
        "glow": "glowPulse 3s ease-in-out infinite",
        "float": "float 6s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(24px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        scaleIn: {
          "0%": { opacity: "0", transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        pulseSoft: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.5" },
        },
        glowPulse: {
          "0%, 100%": { opacity: "0.4" },
          "50%": { opacity: "0.7" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
