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

export function SlotsOverview({ timeSlots }: { timeSlots: Slot[] | undefined }) {
  if (!timeSlots) return null;
  return (
    <div className="bg-white rounded-2xl shadow-xl border border-slate-200/50 p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
          <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Available Slots Overview</h2>
          <p className="text-slate-600">Current availability across all venues and days</p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2  gap-4">
        {timeSlots.map((slot) => (
          <div
            key={slot._id}
            className={`border-2 rounded-xl p-5 transition-all ${
              slot.isAvailable ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"
            }`}
          >
            <div className="space-y-3">
              <div className="font-semibold text-slate-900 text-xl">{slot.venueName}</div>
              <div className="font-semibold text-slate-900 text-sm">{slot.venueLocation}</div>
              <div className="text-sm text-slate-800">
                {(() => {
                  const formatMDY = (s: string) => {
                    const d = new Date(s);
                    if (isNaN(d.getTime())) return null;
                    return d.toLocaleDateString(undefined, { month: "short", day: "2-digit" });
                  };
                  const md = slot.date ? formatMDY(slot.date) : slot.venueDate ? formatMDY(slot.venueDate) : null;
                  return md ? `${slot.day} - ${md}` : slot.day;
                })()}
              </div>
              <div className="flex items-center justify-between">
                <span className={`text-sm font-medium ${slot.isAvailable ? "text-green-700" : "text-red-700"}`}>
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
                  style={{ width: `${(slot.currentCount / slot.capacity) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
