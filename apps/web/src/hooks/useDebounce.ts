"use client";

import { useEffect, useState } from "react";

/**
 * useDebounce — debounces a value by `delay` milliseconds.
 * Used in search inputs to prevent over-fetching.
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}
