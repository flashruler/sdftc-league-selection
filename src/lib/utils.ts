import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Parse a date string like YYYY-MM-DD as a local date (midnight local time),
// falling back to the native Date parser for other formats. Returns null if invalid.
export function parseLocalDate(dateStr?: string): Date | null {
  if (!dateStr) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr);
  if (m) {
    const [, y, mo, d] = m;
    const dt = new Date(Number(y), Number(mo) - 1, Number(d));
    return isNaN(dt.getTime()) ? null : dt;
  }
  const dt = new Date(dateStr);
  return isNaN(dt.getTime()) ? null : dt;
}

// Timestamp helper that respects local parsing for YYYY-MM-DD strings.
export function toLocalTs(dateStr?: string): number {
  const d = parseLocalDate(dateStr);
  return d ? d.getTime() : Number.NaN;
}

// "Saturday · Feb 21" for a date string, or null if unparseable.
export function formatDayDate(dateStr?: string): string | null {
  const d = parseLocalDate(dateStr);
  if (!d) return null;
  return `${d.toLocaleDateString(undefined, { weekday: "long" })} · ${d.toLocaleDateString(undefined, { month: "short" })} ${d.getDate()}`;
}
