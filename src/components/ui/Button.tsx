"use client";

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: ReactNode;
  loading?: boolean;
  fullWidth?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "gradient-accent text-black font-semibold shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 active:shadow-none",
  secondary:
    "bg-white/[0.06] text-kh-text hover:bg-white/[0.1] active:bg-white/[0.04]",
  outline:
    "border border-kh-border-strong text-kh-text-secondary hover:bg-white/[0.04] active:bg-white/[0.02]",
  ghost:
    "text-kh-text-muted hover:text-kh-text hover:bg-white/[0.04] active:bg-white/[0.02]",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "min-h-[40px] px-4 py-2 text-body-sm rounded-xl gap-1.5",
  md: "min-h-[44px] px-5 py-2.5 text-body-md rounded-xl gap-2",
  lg: "min-h-[52px] px-6 py-3.5 text-body-md rounded-2xl gap-2",
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", icon, loading = false, fullWidth = false, disabled, children, className = "", ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={`
          inline-flex items-center justify-center
          font-medium transition-all duration-200
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kh-accent focus-visible:ring-offset-2 focus-visible:ring-offset-kh-bg
          disabled:opacity-30 disabled:cursor-not-allowed disabled:shadow-none
          select-none touch-manipulation active:scale-[0.97]
          ${variantStyles[variant]}
          ${sizeStyles[size]}
          ${fullWidth ? "w-full" : ""}
          ${className}
        `}
        {...props}
      >
        {loading ? (
          <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        ) : icon ? (
          <span className="shrink-0 flex items-center justify-center">{icon}</span>
        ) : null}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
export default Button;
