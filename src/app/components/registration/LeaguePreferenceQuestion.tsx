"use client";

export type LeaguePreference = "na" | "same" | "different";

const OPTIONS: { value: LeaguePreference; label: string }[] = [
  { value: "na", label: "N/A" },
  { value: "same", label: "Same league" },
  { value: "different", label: "Different leagues" },
];

export function LeaguePreferenceQuestion({
  value,
  onChange,
  partnerTeams,
  onPartnerTeamsChange,
}: {
  value: LeaguePreference | null;
  onChange: (value: LeaguePreference) => void;
  partnerTeams: string;
  onPartnerTeamsChange: (value: string) => void;
}) {
  return (
    <fieldset className="space-y-3">
      <legend className="font-medium text-slate-700">Other teams from your organization</legend>
      <p className="text-sm text-slate-600">
        If applicable: if your organization has more than one team competing on the same selected day, do you want them to
        compete within the same league or in different leagues?
      </p>
      <div className="flex flex-wrap gap-2">
        {OPTIONS.map((o) => (
          <label
            key={o.value}
            className={`flex items-center gap-2 rounded-lg border px-4 py-2 cursor-pointer text-sm transition-colors ${
              value === o.value ? "border-blue-600 bg-blue-50 text-slate-900" : "border-slate-300 text-slate-700 hover:border-blue-300"
            }`}
          >
            <input
              type="radio"
              name="league-preference"
              value={o.value}
              checked={value === o.value}
              onChange={() => onChange(o.value)}
              className="accent-blue-600"
            />
            {o.label}
          </label>
        ))}
      </div>
      {value && value !== "na" && (
        <div className="space-y-1">
          <label htmlFor="partner-teams" className="block text-sm font-medium text-slate-700">
            Other team numbers in your organization
          </label>
          <input
            id="partner-teams"
            type="text"
            inputMode="numeric"
            placeholder="e.g. 12345, 23456"
            value={partnerTeams}
            onChange={(e) => onPartnerTeamsChange(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-xs text-slate-500">Separate team numbers with commas.</p>
        </div>
      )}
    </fieldset>
  );
}
