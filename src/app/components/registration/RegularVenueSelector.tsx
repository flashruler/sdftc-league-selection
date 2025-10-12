"use client";

type Slot = {
  _id: string;
  venueId: string;
  venueName: string;
  venueLocation?: string;
  venueDate?: string;
  venueAddress?: string;
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
  selectedRegular: Record<string, string>;
  onSelect: (venueId: string, timeSlotId: string) => void;
};

export function RegularVenueSelector({ timeSlots, selectedRegular, onSelect }: Props) {
  if (!timeSlots) return null;
  const regular = timeSlots.filter((s) => s.venueType === "regular");
  const byVenue = regular.reduce<Record<string, Slot[]>>((acc, s) => {
    const key = String(s.venueId);
    acc[key] = acc[key] || [];
    acc[key].push(s);
    return acc;
  }, {});
  const venueOrder = Object.keys(byVenue);

  return (
    <div className="space-y-6">
      {venueOrder.map((venueId) => {
        const slots = byVenue[venueId].sort((a, b) => a.day.localeCompare(b.day));
        const venueName = slots[0]?.venueName ?? "Venue";
        const location = slots[0]?.venueLocation ?? "Unknown Location";
        const address = slots[0]?.venueAddress ?? "";
        // Compute a base weekend start date for fallback formatting on cards
        const parseDate = (s: string | undefined) => {
          if (!s) return null;
          const d = new Date(s);
          return isNaN(d.getTime()) ? null : d;
        };
        const slotDates = slots
          .map((s) => parseDate(s.date))
          .filter((d): d is Date => d !== null)
          .sort((a, b) => a.getTime() - b.getTime());
        const startDate = slotDates[0] || parseDate(slots[0]?.venueDate);
        const formatMD = (d: Date) => `${d.getMonth() + 1}/${d.getDate()}`;
        const normalizeDay = (day: string) => {
          const d = (day || "").toLowerCase();
          if (d.startsWith("sun")) return "sunday";
          if (d.startsWith("sat")) return "saturday";
          if (d === "day 2" || d === "2") return "sunday";
          if (d === "day 1" || d === "1") return "saturday";
          return d;
        };
        const selected = selectedRegular[venueId];
        return (
          <div key={venueId} className="border border-slate-200 rounded-xl p-5">
            <div className="font-semibold text-slate-900 text-xl">{venueName}</div>
            <div className="">{location}</div>
            <span className="text-sm text-slate-600">{address}</span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {slots.map((slot) => (
                <label
                  key={slot._id}
                  className={`relative border-2 rounded-xl p-4 cursor-pointer transition-all ${
                    !slot.isAvailable
                      ? "border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed"
                      : selected === slot._id
                      ? "border-blue-500 bg-blue-50 shadow"
                      : "border-slate-200 hover:border-blue-300 hover:shadow-sm"
                  }`}
                >
                  <input
                    type="radio"
                    name={`regular-${venueId}`}
                    value={slot._id}
                    checked={selected === slot._id}
                    onChange={() => onSelect(venueId, String(slot._id))}
                    disabled={!slot.isAvailable}
                    className="sr-only"
                  />
                  {selected === slot._id && slot.isAvailable && (
                    <div className="absolute top-3 right-3">
                      <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                  )}
                  <div className="space-y-2">
                    <div className="text-slate-700">
                      {(() => {
                        // Prefer per-slot date; fall back to startDate + offset by day
                        let labelDate: string | null = null;
                        if (slot.date) {
                          const d = new Date(slot.date);
                          if (!isNaN(d.getTime())) labelDate = formatMD(d);
                        }
                        if (!labelDate && startDate) {
                          const d = new Date(startDate);
                          const dayNorm = normalizeDay(slot.day);
                          if (dayNorm === "sunday") d.setDate(d.getDate() + 1);
                          labelDate = formatMD(d);
                        }
                        return labelDate ? `${slot.day} - ${labelDate}` : slot.day;
                      })()}
                    </div>
                    <div className="flex items-center justify-between">
                      <div className={`text-xs font-medium ${slot.isAvailable ? "text-green-600" : "text-red-600"}`}>
                        {slot.isAvailable ? `${slot.spotsRemaining} spots left` : "FULL"}
                      </div>
                      <div className="text-xs text-slate-500">
                        {slot.currentCount}/{slot.capacity}
                      </div>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-1.5">
                      <div
                        className={`h-1.5 rounded-full ${slot.isAvailable ? "bg-green-500" : "bg-red-500"}`}
                        style={{ width: `${(slot.currentCount / slot.capacity) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
