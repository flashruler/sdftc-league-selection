"use client";

import { toLocalTs } from "@/lib/utils";
import { LeagueCapacity, LeagueEvents, LeagueHeader, leagueTheme, type LeagueSlot } from "./LeagueEvents";

type Slot = {
  _id: string;
  venueId: string;
  venueName: string;
  venueLocation?: string;
  venueDate?: string;
  venueAddress?: string;
  meet1?: LeagueSlot["meet1"];
  venueType: string;
  day: string;
  date?: string;
  isAvailable: boolean;
  spotsRemaining: number;
  currentCount: number;
  capacity: number;
};

type Props = {
  timeSlots: Slot[] | undefined;
  selected: string;
  onSelect: (timeSlotId: string) => void;
};

export function ChampionshipSelector({ timeSlots, selected, onSelect }: Props) {
  if (!timeSlots) return null;
  const champSlots = timeSlots.filter((s) => s.venueType === "championship");
  if (champSlots.length === 0) return null;

  // One slot per championship venue (Descartes, Euclid, Gauss, Turing)
  // Sort by earliest date ascending (oldest first)
  const champsSorted = [...champSlots]
    .map((s) => {
      const ts = !isNaN(toLocalTs(s.date))
        ? toLocalTs(s.date)
        : !isNaN(toLocalTs(s.venueDate))
        ? toLocalTs(s.venueDate)
        : Number.MAX_SAFE_INTEGER;
      return { s, ts };
    })
    .sort((a, b) => (a.ts - b.ts) || a.s.venueName.localeCompare(b.s.venueName))
    .map((x) => x.s);
  return (
    <div className="border border-slate-200 rounded-xl p-5">
      <div className="mb-3 font-semibold text-slate-900">Please select a league:</div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {champsSorted.map((slot) => (
            <label
              key={slot._id}
              className={`relative overflow-hidden border-2 rounded-xl bg-white p-4 pt-5 cursor-pointer transition-all ${
                !slot.isAvailable
                  ? "border-slate-200 opacity-60 cursor-not-allowed"
                  : selected === slot._id
                  ? `${leagueTheme(slot.venueName).selected} shadow-md`
                  : "border-slate-200 hover:border-slate-300 hover:shadow-md"
              }`}
            >
              <input
                type="radio"
                name="championship"
                value={slot._id}
                checked={selected === slot._id}
                onChange={() => onSelect(String(slot._id))}
                disabled={!slot.isAvailable}
                aria-label={`${slot.venueName} league`}
                className="sr-only"
              />
              <div className={`absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r ${leagueTheme(slot.venueName).bar}`} />
              {selected === slot._id && slot.isAvailable && (
                <div className="absolute top-4 right-4">
                  <svg className={`w-6 h-6 ${leagueTheme(slot.venueName).label}`} fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              )}
              <div className="space-y-4">
                <LeagueHeader name={slot.venueName} />
                <LeagueEvents name={slot.venueName} slot={slot} />
                <LeagueCapacity {...slot} />
              </div>
            </label>
          ))}
      </div>
    </div>
  );
}
