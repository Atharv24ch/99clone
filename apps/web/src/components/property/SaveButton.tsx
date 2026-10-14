"use client";

import { Bookmark } from "lucide-react";

import { useSavedProperties } from "@/hooks/useSavedProperties";

export function SaveButton({ propertyId }: { propertyId: string }) {
  const { isSaved, toggle } = useSavedProperties();
  const saved = isSaved(propertyId);
  return (
    <button
      type="button"
      onClick={() => toggle(propertyId)}
      aria-pressed={saved}
      className={`btn-quiet shrink-0 border ${saved ? "border-seal/40 text-seal" : "border-rule"}`}
    >
      <Bookmark className="h-4 w-4" strokeWidth={1.75} fill={saved ? "currentColor" : "none"} aria-hidden="true" />
      {saved ? "Saved" : "Save"}
    </button>
  );
}
