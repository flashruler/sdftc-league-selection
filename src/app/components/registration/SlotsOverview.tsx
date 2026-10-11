"use client";

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

export function SlotsOverview({ timeSlots }: { timeSlots: Slot[] | undefined }) {
  if (!timeSlots) return null;

  const champs = timeSlots.filter((s) => s.venueType === "championship");
  const regular = timeSlots.filter((s) => s.venueType === "regular");

  // Group regular slots by venue
  const byVenue = regular.reduce<Record<string, Slot[]>>((acc, s) => {
    const key = String(s.venueId);
    acc[key] = acc[key] || [];
    acc[key].push(s);
    return acc;
  }, {});

  // Sort venues by earliest date (oldest first)
  const venueEntries = Object.entries(byVenue)
    .map(([venueId, slots]) => {
      const toTs = (s?: string) => {
        if (!s) return Number.NaN;
        // Use local parsing for YYYY-MM-DD to avoid UTC shift
        const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
        const t = m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])).getTime() : Date.parse(s);
        return isNaN(t) ? Number.NaN : t;
      };
      const slotTimestamps = slots.map((s) => toTs(s.date)).filter((t) => !isNaN(t));
      const venueTs = toTs(slots[0]?.venueDate);
      const candidate = slotTimestamps.length ? Math.min(...slotTimestamps) : venueTs;
      const ts = isNaN(candidate) ? Number.MAX_SAFE_INTEGER : candidate;
      const name = slots[0]?.venueName || "";
      return { venueId, slots, ts, name };
    })
    .sort((a, b) => (a.ts - b.ts) || a.name.localeCompare(b.name));

  const formatMD = (dateStr: string | undefined) => {
    if (!dateStr) return null;
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr);
    const d = m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : new Date(dateStr);
    if (isNaN(d.getTime())) return null;
    return `${d.toLocaleString(undefined, { month: "short" })} ${d.getDate()}`;
  };

  const normalizeDay = (day: string) => {
    const d = (day || "").toLowerCase();
    if (d.startsWith("sun")) return "sunday";
    if (d.startsWith("sat")) return "saturday";
    if (d === "day 2" || d === "2") return "sunday";
    if (d === "day 1" || d === "1") return "saturday";
    return d;
  };

  // Championships sorted by earliest date (oldest first), then by name
  const toTs = (s?: string) => {
    if (!s) return Number.NaN;
    const t = Date.parse(s);
    return isNaN(t) ? Number.NaN : t;
  };
  const champsSorted = [...champs]
    .map((s) => {
      const tsCandidate = !isNaN(toTs(s.date))
        ? toTs(s.date)
        : !isNaN(toTs(s.venueDate))
        ? toTs(s.venueDate)
        : Number.MAX_SAFE_INTEGER;
      return { s, tsCandidate };
    })
    .sort((a, b) => (a.tsCandidate - b.tsCandidate) || a.s.venueName.localeCompare(b.s.venueName))
    .map((x) => x.s);

  return (
    <div className="space-y-8">
      {/* Championships */}
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200/50 p-8">
        <h2 className="text-xl font-semibold text-slate-900 mb-6">Select a League to Compete In:</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {champsSorted.map((slot) => (
            <div
              key={slot._id}
              className={`relative overflow-hidden rounded-xl border border-slate-200 bg-white p-5 pt-6 shadow-sm transition-shadow hover:shadow-md ${
                slot.isAvailable ? "" : "opacity-60"
              }`}
            >
              <div className={`absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r ${leagueTheme(slot.venueName).bar}`} />
              <div className="space-y-4">
                <LeagueHeader name={slot.venueName} />
                <LeagueEvents name={slot.venueName} slot={slot} />
                <LeagueCapacity {...slot} />
              </div>
            </div>
          ))}
          {champs.length === 0 && (
            <div className="text-sm text-slate-500">No championship events available.</div>
          )}
        </div>
      </div>

      {/* League Meets */}
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200/50 p-8">
        <h2 className="text-xl font-semibold text-slate-900 mb-6">Select Your Dates for Meets 2 and 3:</h2>

        <div className="space-y-4">
          {venueEntries.map(({ venueId, slots }) => {
            const venueName = slots[0]?.venueName ?? "Venue";
            const location = slots[0]?.venueLocation ?? "";
            const address = slots[0]?.venueAddress ?? "";

            // Compute weekend start for fallback day labels
            const parseDate = (s?: string) => {
              if (!s) return null;
              const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
              const d = m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : new Date(s);
              return isNaN(d.getTime()) ? null : d;
            };
            const slotDates = slots
              .map((s) => parseDate(s.date))
              .filter((d): d is Date => d !== null)
              .sort((a, b) => a.getTime() - b.getTime());
            const weekendStart = slotDates[0] || parseDate(slots[0]?.venueDate);

            const labelFor = (slot: Slot) => {
              const own = formatMD(slot.date ?? undefined);
              if (own) return `${slot.day} - ${own}`;
              if (weekendStart) {
                const d = new Date(weekendStart);
                if (normalizeDay(slot.day) === "sunday") d.setDate(d.getDate() + 1);
                return `${slot.day} - ${d.getMonth() + 1}/${d.getDate()}`;
              }
              return slot.day;
            };

            // Ensure Sat first then Sun
            const ordered = [...slots].sort((a, b) => normalizeDay(a.day).localeCompare(normalizeDay(b.day)));

            return (
              <div key={venueId} className="border border-slate-200 rounded-xl p-5">
                <div className="mb-2">
                  <div className="text-xl font-semibold text-slate-900">{venueName}</div>
                  <div className="text-slate-700">{location}</div>
                  {address ? <div className="text-slate-500 text-sm">{address}</div> : null}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {ordered.map((slot) => (
                    <div
                      key={slot._id}
                      className={`border-2 rounded-xl p-4 transition-all ${
                        slot.isAvailable ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="text-slate-800">{labelFor(slot)}</div>
                        <div className="flex items-center justify-between">
                          <span className={`text-xs font-medium ${slot.isAvailable ? "text-green-700" : "text-red-700"}`}>
                            {slot.currentCount}/{slot.capacity} teams
                          </span>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              slot.isAvailable ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                            }`}
                          >
                            {slot.isAvailable ? "Available" : "Full"}
                          </span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all ${slot.isAvailable ? "bg-green-500" : "bg-red-500"}`}
                            style={{ width: `${slot.capacity ? (slot.currentCount / slot.capacity) * 100 : 0}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
          {venueEntries.length === 0 && (
            <div className="text-sm text-slate-500">No league meets available.</div>
          )}
        </div>
      </div>
    </div>
  );
}
