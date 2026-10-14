import type { LeadStatus } from "@/types/user";

export const LEAD_STATUS_LABEL: Record<LeadStatus, string> = {
  new: "New",
  contacted: "Contacted",
  visited: "Site visit done",
  negotiating: "Negotiating",
  converted: "Closed",
  lost: "Lost",
  spam: "Spam",
};

const TONE: Record<LeadStatus, string> = {
  new: "border-seal text-seal",
  contacted: "border-stamp text-stamp-dark",
  visited: "border-stamp text-stamp-dark",
  negotiating: "border-stamp text-stamp-dark",
  converted: "border-ink text-ink",
  lost: "border-ink-faint text-ink-faint",
  spam: "border-ink-faint text-ink-faint",
};

export function LeadStatusPill({ status }: { status: LeadStatus }) {
  return (
    <span className={`inline-block whitespace-nowrap rounded-sheet border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.08em] ${TONE[status]}`}>
      {LEAD_STATUS_LABEL[status]}
    </span>
  );
}
