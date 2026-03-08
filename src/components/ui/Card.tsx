"use client";

import { type ReactNode } from "react";

type CardVariant = "default" | "glass" | "accent";

const variantStyles: Record<CardVariant, string> = {
  default:
    "bg-kh-card border border-kh-border hover:border-kh-border-strong",
  glass:
    "glass hover:border-kh-border-strong",
  accent:
    "bg-kh-accent-muted border border-kh-accent/20 hover:border-kh-accent/40",
};

interface CardProps {
  variant?: CardVariant;
  icon?: ReactNode;
  title?: string;
  description?: string;
  children?: ReactNode;
  className?: string;
  as?: "div" | "button";
  onClick?: () => void;
  noPadding?: boolean;
}

export default function Card({
  variant = "default",
  icon,
  title,
  description,
  children,
  className = "",
  as = "div",
  onClick,
  noPadding = false,
}: CardProps) {
  const isInteractive = as === "button" || !!onClick;

  const combinedClassName = [
    "rounded-2xl transition-all duration-300",
    noPadding ? "" : "p-5",
    variantStyles[variant],
    isInteractive
      ? "cursor-pointer active:scale-[0.98] touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kh-accent focus-visible:ring-offset-2 focus-visible:ring-offset-kh-bg"
      : "",
    className,
  ].join(" ");

  const content =
    icon || title || description ? (
      <div className="flex items-start gap-4">
        {icon && (
          <span
            className="shrink-0 w-12 h-12 rounded-xl bg-kh-accent-muted text-kh-accent flex items-center justify-center"
            aria-hidden="true"
          >
            {icon}
          </span>
        )}
        <div className="flex-1 min-w-0">
          {title && (
            <h3 className="text-body-lg font-semibold text-kh-text leading-tight">
              {title}
            </h3>
          )}
          {description && (
            <p className="text-body-sm text-kh-text-muted mt-1">
              {description}
            </p>
          )}
        </div>
      </div>
    ) : (
      children
    );

  if (as === "button") {
    return (
      <button type="button" className={combinedClassName} onClick={onClick}>
        {content}
      </button>
    );
  }

  return (
    <div
      className={combinedClassName}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {content}
    </div>
  );
}
