"use client";

type Venue = {
  _id: string;
  name: string;
  type: string;
  location?: string;
  date?: string;
  address?: string;
};

export function VenueDetailsCard({
  venue,
  saving,
  saved,
  error,
  onSave,
}: {
  venue: Venue;
  saving: boolean;
  saved: boolean;
  error?: string | null;
  onSave: (values: { location?: string; date?: string; address?: string }) => Promise<void> | void;
}) {
  return (
    <form
      className="border rounded-lg p-4 flex flex-col gap-2"
      onSubmit={async (e) => {
        e.preventDefault();
        const form = e.target as HTMLFormElement;
        const location = (form.elements.namedItem("location") as HTMLInputElement)?.value.trim();
        const date = (form.elements.namedItem("date") as HTMLInputElement)?.value.trim();
        const address = (form.elements.namedItem("address") as HTMLInputElement)?.value.trim();
        if (!location && !date && !address) return;
        await onSave({ location: location || undefined, date: date || undefined, address: address || undefined });
      }}
    >
      <div className="text-sm font-medium text-slate-700">
        {venue.name}
        <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">{venue.type}</span>
      </div>
      <div className="flex flex-col gap-2">
        <input
          name="location"
          defaultValue={venue.location || ""}
          placeholder="e.g., Central High School, City, ST"
          className="flex-1 border border-slate-300 rounded-md px-3 py-2 text-sm"
        />
        <div className="flex flex-col md:flex-row gap-2">
          <input
            name="date"
            type="date"
            defaultValue={venue.date || ""}
            className="border border-slate-300 rounded-md px-3 py-2 text-sm"
          />
          <input
            name="address"
            defaultValue={venue.address || ""}
            placeholder="Address (street, city, state, postal)"
            className="flex-1 border border-slate-300 rounded-md px-3 py-2 text-sm"
          />
        </div>
        <div>
          <button
            type="submit"
            disabled={saving}
            className={`px-3 py-2 rounded-md text-sm text-white ${saving ? "bg-amber-400 cursor-not-allowed" : "bg-amber-600 hover:bg-amber-700"}`}
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
      <div className="min-h-[20px] flex items-center gap-2" aria-live="polite" role="status">
        {saved && !saving && !error && (
          <span className="inline-flex items-center text-green-700 text-sm">
            <svg className="w-4 h-4 mr-1" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Saved
          </span>
        )}
        {error && <span className="text-red-600 text-sm">{error}</span>}
      </div>
    </form>
  );
}
