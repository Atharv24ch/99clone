import type { HTMLAttributes, ReactNode } from "react";
import React from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  hover?: boolean;
  glass?: boolean;
  padding?: "none" | "sm" | "md" | "lg";
}

const paddingStyles = {
  none: "",
  sm: "p-3",
  md: "p-5",
  lg: "p-7",
};

export function Card({
  children,
  hover = false,
  glass = false,
  padding = "md",
  className = "",
  ...props
}: CardProps) {
  return (
    <div
      {...props}
      className={[
        "rounded-2xl border",
        glass
          ? "bg-white/10 backdrop-blur-md border-white/20 shadow-glass"
          : "bg-white border-slate-100 shadow-card",
        hover
          ? "transition-all duration-250 ease-out hover:-translate-y-0.5 hover:shadow-card-hover cursor-pointer"
          : "",
        paddingStyles[padding],
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </div>
  );
}

// ─── Card sub-components ──────────────────────────────────────────────────────

export function CardHeader({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`mb-4 flex items-center justify-between ${className}`}>
      {children}
    </div>
  );
}

export function CardBody({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={className}>{children}</div>;
}

export function CardFooter({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`mt-4 flex items-center justify-between border-t border-slate-100 pt-4 ${className}`}
    >
      {children}
    </div>
  );
}
