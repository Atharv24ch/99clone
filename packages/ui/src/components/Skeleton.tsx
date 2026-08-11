import type { HTMLAttributes } from "react";
import React from "react";

interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  width?: string;
  height?: string;
  rounded?: "sm" | "md" | "lg" | "xl" | "full";
  lines?: number;
}

const roundedStyles = {
  sm: "rounded-sm",
  md: "rounded-md",
  lg: "rounded-lg",
  xl: "rounded-xl",
  full: "rounded-full",
};

function SkeletonBlock({
  width = "100%",
  height = "1rem",
  rounded = "md",
  className = "",
  style,
  ...props
}: SkeletonProps) {
  return (
    <div
      {...props}
      className={[
        "relative overflow-hidden bg-slate-200",
        "before:absolute before:inset-0",
        "before:bg-gradient-to-r before:from-slate-200 before:via-slate-100 before:to-slate-200",
        "before:animate-shimmer before:bg-[length:200%_100%]",
        roundedStyles[rounded],
        className,
      ].join(" ")}
      style={{ width, height, ...style }}
      aria-hidden="true"
    />
  );
}

export function Skeleton({
  lines = 1,
  width,
  height,
  rounded,
  className,
}: SkeletonProps & { lines?: number }) {
  if (lines === 1) {
    return (
      <SkeletonBlock
        width={width}
        height={height}
        rounded={rounded}
        className={className}
      />
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {Array.from({ length: lines }).map((_, i) => (
        <SkeletonBlock
          key={i}
          width={i === lines - 1 ? "60%" : "100%"}
          height={height ?? "1rem"}
          rounded={rounded}
        />
      ))}
    </div>
  );
}

// ─── Property card skeleton ───────────────────────────────────────────────────

export function PropertyCardSkeleton() {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white shadow-card overflow-hidden">
      <SkeletonBlock height="200px" rounded="sm" />
      <div className="p-4 space-y-3">
        <SkeletonBlock height="1.25rem" width="70%" />
        <SkeletonBlock height="1rem" width="50%" />
        <div className="flex gap-2 pt-1">
          <SkeletonBlock height="1.5rem" width="60px" rounded="lg" />
          <SkeletonBlock height="1.5rem" width="60px" rounded="lg" />
          <SkeletonBlock height="1.5rem" width="60px" rounded="lg" />
        </div>
        <SkeletonBlock height="1px" className="!bg-slate-100" />
        <div className="flex justify-between">
          <SkeletonBlock height="1rem" width="40%" />
          <SkeletonBlock height="1.75rem" width="80px" rounded="xl" />
        </div>
      </div>
    </div>
  );
}
