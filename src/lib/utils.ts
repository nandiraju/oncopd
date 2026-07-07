import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(d: string | null | undefined) {
  if (!d) return "—";
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export function formatDateTime(d: string) {
  const date = new Date(d);
  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function relativeTime(d: string) {
  const date = new Date(d).getTime();
  const now = new Date("2026-07-06T09:00:00").getTime();
  const diff = now - date;
  const day = 86400000;
  const hr = 3600000;
  if (diff < hr) return `${Math.max(1, Math.round(diff / 60000))}m ago`;
  if (diff < day) return `${Math.round(diff / hr)}h ago`;
  const days = Math.round(diff / day);
  if (days < 0) return `in ${Math.abs(days)}d`;
  if (days < 30) return `${days}d ago`;
  return `${Math.round(days / 30)}mo ago`;
}

export function daysUntil(d: string | null) {
  if (!d) return null;
  const date = new Date(d).getTime();
  const now = new Date("2026-07-06T00:00:00").getTime();
  return Math.round((date - now) / 86400000);
}

export const RISK_RANK: Record<string, number> = { Low: 0, Moderate: 1, High: 2, Critical: 3 };
export const PRIORITY_RANK: Record<string, number> = { Routine: 0, Urgent: 1, STAT: 2 };

export function initials(name: string) {
  return name
    .replace(/^Dr\.?\s+/, "")
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}
