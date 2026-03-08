"use client";

import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: ReactNode;
  helpText?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, helpText, id, className = "", ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-body-sm font-medium text-kh-text-muted mb-2"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <span
              className="absolute left-4 top-1/2 -translate-y-1/2 text-kh-text-dim w-5 h-5 flex items-center justify-center"
              aria-hidden="true"
            >
              {icon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            aria-invalid={!!error}
            aria-describedby={
              error
                ? `${inputId}-error`
                : helpText
                  ? `${inputId}-help`
                  : undefined
            }
            className={`
              w-full min-h-[52px] px-4 py-3.5
              text-body-md text-kh-text placeholder-kh-text-dim
              bg-kh-surface border border-kh-border rounded-xl
              transition-all duration-200
              focus:outline-none focus:border-kh-accent focus:ring-1 focus:ring-kh-accent
              disabled:opacity-40 disabled:cursor-not-allowed
              touch-manipulation
              ${icon ? "pl-12" : ""}
              ${error ? "border-kh-danger focus:ring-kh-danger focus:border-kh-danger" : ""}
              ${className}
            `}
            {...props}
          />
        </div>
        {error && (
          <p
            id={`${inputId}-error`}
            className="mt-2 text-body-sm text-kh-danger font-medium"
            role="alert"
          >
            {error}
          </p>
        )}
        {helpText && !error && (
          <p id={`${inputId}-help`} className="mt-2 text-body-sm text-kh-text-dim">
            {helpText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export default Input;
