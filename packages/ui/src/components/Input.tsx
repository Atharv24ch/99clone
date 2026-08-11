import type { InputHTMLAttributes, ReactNode } from "react";
import React, { forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftElement?: ReactNode;
  rightElement?: ReactNode;
  inputSize?: "sm" | "md" | "lg";
}

const sizeStyles = {
  sm: "h-8 text-sm px-3",
  md: "h-10 text-sm px-4",
  lg: "h-12 text-base px-4",
};

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      hint,
      leftElement,
      rightElement,
      inputSize = "md",
      className = "",
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-slate-700"
          >
            {label}
            {props.required && (
              <span className="ml-1 text-red-500" aria-hidden="true">
                *
              </span>
            )}
          </label>
        )}

        <div className="relative flex items-center">
          {leftElement && (
            <div className="pointer-events-none absolute left-3 flex items-center text-slate-400">
              {leftElement}
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            {...props}
            className={[
              "w-full rounded-xl border bg-white outline-none transition-all duration-150",
              "placeholder:text-slate-400 text-slate-900",
              "focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20",
              "disabled:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60",
              error
                ? "border-red-400 focus:border-red-500 focus:ring-red-500/20"
                : "border-slate-200 hover:border-slate-300",
              sizeStyles[inputSize],
              leftElement ? "pl-10" : "",
              rightElement ? "pr-10" : "",
              className,
            ]
              .filter(Boolean)
              .join(" ")}
          />

          {rightElement && (
            <div className="absolute right-3 flex items-center text-slate-400">
              {rightElement}
            </div>
          )}
        </div>

        {error && (
          <p className="flex items-center gap-1 text-xs text-red-500" role="alert">
            <svg className="h-3.5 w-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {error}
          </p>
        )}
        {hint && !error && (
          <p className="text-xs text-slate-500">{hint}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
