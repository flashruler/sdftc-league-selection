"use client";

import { Binary, ChartScatter, DraftingCompass, Sigma, type LucideProps } from "lucide-react";
import { formatDayDate } from "@/lib/utils";

type EventInfo = {
  date?: string;
  venueDate?: string;
  venueLocation?: string;
  venueAddress?: string;
};

export type LeagueSlot = EventInfo & { meet1?: EventInfo };

// Gauss's normal distribution; lucide has no bell curve.
function BellCurve(props: LucideProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M2 20h20" />
      <path d="M2 18C7 18 7 6 12 6s5 12 10 12" />
    </svg>
  );
}

// Full class strings so Tailwind picks them up.
const THEMES = {
  Descartes: { Icon: ChartScatter, tile: "bg-indigo-600", bar: "from-indigo-500 to-violet-500", label: "text-indigo-600", selected: "border-indigo-500 ring-4 ring-indigo-100" },
  Euclid: { Icon: DraftingCompass, tile: "bg-amber-500", bar: "from-amber-400 to-orange-500", label: "text-amber-600", selected: "border-amber-500 ring-4 ring-amber-100" },
  Gauss: { Icon: BellCurve, tile: "bg-emerald-600", bar: "from-emerald-500 to-teal-500", label: "text-emerald-600", selected: "border-emerald-500 ring-4 ring-emerald-100" },
  Turing: { Icon: Binary, tile: "bg-sky-600", bar: "from-sky-500 to-blue-600", label: "text-sky-600", selected: "border-sky-500 ring-4 ring-sky-100" },
} as const;
const FALLBACK = { Icon: Sigma, tile: "bg-slate-700", bar: "from-slate-500 to-slate-700", label: "text-slate-600", selected: "border-slate-500 ring-4 ring-slate-100" };

export function leagueTheme(name: string) {
  return THEMES[name.trim() as keyof typeof THEMES] ?? FALLBACK;
}

export function LeagueHeader({ name }: { name: string }) {
  const { Icon, tile } = leagueTheme(name);
  return (
    <div className="flex items-center gap-3">
      <div className={`w-12 h-12 shrink-0 rounded-xl ${tile} text-white flex items-center justify-center shadow-sm`}>
        <Icon className="w-6 h-6" aria-hidden="true" />
      </div>
      <div className="text-xl font-semibold text-slate-900">{name}</div>
    </div>
  );
}

// A league is two events: its Meet 1 and its Championship.
export function LeagueEvents({ name, slot }: { name: string; slot: LeagueSlot }) {
  const { label } = leagueTheme(name);
  return (
    <div className="divide-y divide-slate-100 rounded-lg border border-slate-100 bg-slate-50/60">
      <EventLine label="League Meet 1" labelClass={label} event={slot.meet1} />
      <EventLine label="Championship" labelClass={label} event={slot} />
    </div>
  );
}

function EventLine({ label, labelClass, event }: { label: string; labelClass: string; event?: EventInfo }) {
  const when = event && (formatDayDate(event.date) || formatDayDate(event.venueDate));
  return (
    <div className="px-3 py-2">
      <div className={`text-[11px] font-semibold uppercase tracking-wide ${labelClass}`}>{label}</div>
      <div className="text-slate-900 font-medium">{when || "TBD"}</div>
      {event?.venueLocation && <div className="text-slate-700 text-sm">{event.venueLocation}</div>}
      {event?.venueAddress && <div className="text-slate-500 text-sm">{event.venueAddress}</div>}
    </div>
  );
}

export function LeagueCapacity({ currentCount, capacity, isAvailable }: { currentCount: number; capacity: number; isAvailable: boolean }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-sm text-slate-600">
          {currentCount}/{capacity} teams
        </span>
        <span
          className={`px-2 py-0.5 rounded-full text-xs font-medium ${
            isAvailable ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
          }`}
        >
          {isAvailable ? `${capacity - currentCount} spots left` : "Full"}
        </span>
      </div>
      <div className="w-full bg-slate-200 rounded-full h-1.5">
        <div
          className={`h-1.5 rounded-full transition-all ${isAvailable ? "bg-green-500" : "bg-red-500"}`}
          style={{ width: `${capacity ? Math.min(100, (currentCount / capacity) * 100) : 0}%` }}
        />
      </div>
    </div>
  );
}
