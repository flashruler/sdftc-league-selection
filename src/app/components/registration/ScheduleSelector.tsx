"use client";

import type { FunctionReturnType } from "convex/server";
import { MapPin } from "lucide-react";
import type { api } from "../../../../convex/_generated/api";
import type { Day } from "../../../../convex/lib/schedule";
import { parseLocalDate } from "@/lib/utils";

type Schedules = FunctionReturnType<typeof api.timeSlots.getSchedules>;

export const DAY_LABEL: Record<Day, string> = { saturday: "Saturday", sunday: "Sunday" };

export function ScheduleSelector({
  schedules,
  selected,
  onSelect,
  readOnly = false,
}: {
  schedules: Schedules | undefined;
  selected: Day | null;
  onSelect: (day: Day) => void;
  // Show schedules and open spots without letting anyone pick (no team number entered yet)
  readOnly?: boolean;
}) {
  if (!schedules) return <div className="text-slate-500">Loading schedules…</div>;
  return (
    <fieldset>
      <legend className="font-semibold text-slate-900">{readOnly ? "Saturday and Sunday schedules" : "Pick your schedule"}</legend>
      <p className="text-sm text-slate-600 mb-3">
        {readOnly
          ? "A team on a day goes to all of that day's events, from Meet 1 through the League Tournament."
          : "All of your team's events, from Meet 1 through the League Tournament, will be on this day."}
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {(["saturday", "sunday"] as const).map((day) => {
          const { events, unavailable } = schedules[day];
          const isSelected = selected === day;
          // A day's teams attend every event, so the tightest event limit caps the day.
          const capacity = events.length ? Math.min(...events.map((e) => e.capacity)) : 0;
          const filled = Math.max(0, ...events.map((e) => e.capacity - e.spotsRemaining));
          return (
            <button
              key={day}
              type="button"
              aria-pressed={isSelected}
              disabled={Boolean(unavailable) || readOnly}
              onClick={() => onSelect(day)}
              className={`text-left rounded-xl border-2 p-4 transition-all ${
                unavailable
                  ? "border-slate-200 bg-slate-50 opacity-60 cursor-not-allowed"
                  : isSelected
                    ? "border-blue-600 bg-blue-50 ring-4 ring-blue-600/15"
                    : readOnly
                      ? "border-slate-200 bg-white cursor-default"
                      : "border-slate-200 bg-white hover:border-blue-300"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span>
                  <span className="block text-lg font-bold text-slate-900">{DAY_LABEL[day]} schedule</span>
                  {events.length > 0 && (
                    <span className="block text-sm text-slate-600">
                      {Math.min(filled, capacity)}/{capacity} teams
                    </span>
                  )}
                </span>
                {unavailable ? (
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">Unavailable</span>
                ) : readOnly ? null : (
                  <span
                    aria-hidden="true"
                    className={`size-5 rounded-full border-2 flex items-center justify-center ${isSelected ? "border-blue-600" : "border-slate-300"}`}
                  >
                    {isSelected && <span className="size-2.5 rounded-full bg-blue-600" />}
                  </span>
                )}
              </div>
              {unavailable && <p className="text-sm text-red-700 mb-2">{unavailable}</p>}
              <ol className="divide-y divide-slate-100">
                {events.map((e) => (
                  <EventLine key={e.slotId} {...e} />
                ))}
              </ol>
            </button>
          );
        })}
      </div>
      <p className="text-xs text-slate-500 mt-3">Leagues are assigned after registration closes.</p>
    </fieldset>
  );
}

function EventLine({ title, location, date }: { title: string; location?: string; date?: string }) {
  const d = parseLocalDate(date);
  return (
    <li className="flex items-center gap-3 py-2">
      <div className="w-10 shrink-0 text-center">
        {d ? (
          <>
            <div className="text-[10px] font-semibold uppercase text-slate-500">{d.toLocaleDateString(undefined, { month: "short" })}</div>
            <div className="text-lg font-bold leading-none text-slate-900">{d.getDate()}</div>
          </>
        ) : (
          <div className="text-xs text-slate-500">TBD</div>
        )}
      </div>
      <div className="min-w-0 text-sm">
        <div className="font-medium text-slate-900">{title}</div>
        {location && (
          <div className="flex items-center gap-1 text-slate-500">
            <MapPin className="size-3.5 shrink-0" aria-hidden="true" />
            <span className="truncate">{location}</span>
          </div>
        )}
      </div>
    </li>
  );
}
