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
  selected: string;
  onSelect: (timeSlotId: string) => void;
};

export function ChampionshipSelector({ timeSlots, selected, onSelect }: Props) {
  if (!timeSlots) return null;
  const champSlots = timeSlots.filter((s) => s.venueType === "championship");
  if (champSlots.length === 0) return null;

  // One slot per championship venue (Descartes, Euclid, Gauss, Turing)
  return (
    <div className="border border-slate-200 rounded-xl p-5">
      <div className="mb-3 font-semibold text-slate-900">Please select a league:</div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {champSlots
          .sort((a, b) => a.venueName.localeCompare(b.venueName))
          .map((slot) => (
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
                name="championship"
                value={slot._id}
                checked={selected === slot._id}
                onChange={() => onSelect(String(slot._id))}
                disabled={!slot.isAvailable}
                aria-label={`${slot.venueLocation || slot.venueName} - ${slot.day}`}
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
                <div className="text-xl font-semibold">{slot.venueName}</div>
                {(() => {
                  const formatShortDate = (s: string) => {
                    const d = new Date(s);
                    if (isNaN(d.getTime())) return s; // fallback to raw if not parseable
                    return `${d.getMonth() + 1}/${d.getDate()}`;
                  };
                  const chosenDate = slot.date || slot.venueDate;
                  const dateLabel = chosenDate ? formatShortDate(chosenDate) : slot.day;
                  const locationOrName = slot.venueLocation || slot.venueName;
                  return (
                    <div className="text-slate-900 font-normal">
                      {locationOrName} - {dateLabel}
                    </div>
                  );
                })()}
                <div className="text-slate-500 text-sm">{slot.venueAddress}</div>
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
}
