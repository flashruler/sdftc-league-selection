"use client";

import { useMutation } from "convex/react";
import { useState, type ReactNode } from "react";
import { api } from "../../../../convex/_generated/api";
import type { Doc, Id } from "../../../../convex/_generated/dataModel";
import { formatDayDate } from "@/lib/utils";
import { DAYS, dayKey } from "../../../../convex/lib/schedule";

type Venue = Doc<"venues">;
export type AdminSlot = Doc<"timeSlots"> & { currentCount: number; isAvailable: boolean };

// ---------- Shared data helpers ----------

// Events = Meet 1 … League Tournament, each with a Saturday and a Sunday slot. Championship/meet1
// venues are from the old league-picking flow; teams no longer see them.
function group(venues: Venue[]) {
  return { events: venues.filter((v) => v.type === "regular"), legacy: venues.filter((v) => v.type !== "regular") };
}

const isWeekend = (v: Venue) => v.type === "regular";
const slotsFor = (slots: AdminSlot[], venueId: Id<"venues">) =>
  slots.filter((s) => s.venueId === venueId).sort((a, b) => dayKey(a.day).localeCompare(dayKey(b.day))); // saturday before sunday
// Weekend days carry their own date; single-day events fall back to the venue date (same rule the registration page uses).
const dateOf = (venue: Venue, slot?: AdminSlot) => slot?.date || (isWeekend(venue) ? undefined : venue.date);
const label = (day: string) => day[0].toUpperCase() + day.slice(1);

// Mirrors loadSchedules in convex/lib/schedule.ts: a missing or closed slot at any event blocks that whole day.
function setupIssues(venues: Venue[], slots: AdminSlot[]) {
  const { events, legacy } = group(venues);
  const issues: string[] = [];
  if (events.length === 0) issues.push("No events yet. Add Meet 1 through the League Tournament below.");
  for (const e of events) {
    const own = slotsFor(slots, e._id);
    for (const day of DAYS) {
      const s = own.find((x) => dayKey(x.day) === day);
      if (!s) issues.push(`${e.name}: no ${label(day)} slot, so no team can pick ${label(day)}.`);
      else if (!s.isActive) issues.push(`${e.name}: ${label(day)} signups are closed, so no team can pick ${label(day)}.`);
      else if (!s.date) issues.push(`${e.name}: ${label(day)} has no date.`);
    }
  }
  if (legacy.length > 0) issues.push(`${legacy.length} old league event(s) from the previous setup are still here. Delete them below.`);
  return issues;
}

// ---------- Layout pieces ----------

function TabHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mb-6">
      <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
      <p className="text-slate-600">{subtitle}</p>
    </div>
  );
}

function HowItWorks() {
  return (
    <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-slate-700">
      <div className="font-semibold text-slate-900 mb-2">How team registration works</div>
      <ol className="list-decimal pl-5 space-y-1">
        <li>
          Each team picks a <b>Saturday</b> or <b>Sunday</b> schedule.
        </li>
        <li>That signs them up for that day at <b>every</b> event below, from Meet 1 through the League Tournament.</li>
        <li>If any event&apos;s day is closed or full, teams can&apos;t pick that day.</li>
        <li>Leagues are assigned outside this app after registration closes.</li>
      </ol>
    </div>
  );
}

function Checklist({ issues }: { issues: string[] }) {
  if (issues.length === 0)
    return (
      <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800">
        Setup looks complete. Every event has an open, dated Saturday and Sunday.
      </div>
    );
  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
      <div className="font-semibold mb-2">Still to do ({issues.length})</div>
      <ul className="list-disc pl-5 space-y-1">
        {issues.map((i) => (
          <li key={i}>{i}</li>
        ))}
      </ul>
    </div>
  );
}

function Section({ step, title, description, children }: { step?: number; title: string; description: string; children: ReactNode }) {
  return (
    <section className="mt-8">
      <div className="flex items-baseline gap-2">
        {step && <span className="text-xs font-semibold uppercase tracking-wide text-blue-600">Step {step}</span>}
        <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
      </div>
      <p className="text-sm text-slate-600 mb-4">{description}</p>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function AddPanel({ label, children }: { label: string; children: ReactNode }) {
  return (
    <details className="rounded-xl border border-dashed border-slate-300 bg-white">
      <summary className="cursor-pointer px-4 py-3 text-sm font-medium text-blue-700 hover:bg-blue-50 rounded-xl">+ {label}</summary>
      <div className="border-t border-slate-200 p-4">{children}</div>
    </details>
  );
}

function Empty({ children }: { children: ReactNode }) {
  return <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-500">{children}</div>;
}

const inputClass = "w-full border border-slate-300 rounded-md px-3 py-2 text-sm";

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="text-sm block">
      <span className="block text-slate-700 font-medium mb-1">{label}</span>
      {children}
      {hint && <span className="block text-xs text-slate-500 mt-1">{hint}</span>}
    </label>
  );
}

const errorMessage = (e: unknown) => (e instanceof Error ? e.message.replace(/^.*Uncaught Error: /, "").split("\n")[0] : "Something went wrong");

// ---------- Create form ----------

type NewEvent = { name: string; location: string; address: string; dates: string[]; capacity: number };

function NewEventForm({
  nameLabel,
  namePlaceholder,
  dateLabels,
  defaultCapacity,
  capacityHint,
  submitLabel,
  onSubmit,
}: {
  nameLabel: string;
  namePlaceholder?: string;
  dateLabels: string[];
  defaultCapacity: number;
  capacityHint: string;
  submitLabel: string;
  onSubmit: (e: NewEvent) => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  return (
    <form
      className="grid grid-cols-1 sm:grid-cols-2 gap-3"
      onSubmit={async (e) => {
        e.preventDefault();
        const form = e.currentTarget;
        const data = new FormData(form);
        const get = (k: string) => String(data.get(k) ?? "").trim();
        setBusy(true);
        setError(null);
        try {
          await onSubmit({
            name: get("name"),
            location: get("location"),
            address: get("address"),
            dates: dateLabels.map((_, i) => get(`date${i}`)),
            capacity: Number(get("capacity")),
          });
          form.reset();
        } catch (err) {
          setError(errorMessage(err));
        } finally {
          setBusy(false);
        }
      }}
    >
      <Field label={nameLabel}>
        <input name="name" required placeholder={namePlaceholder} className={inputClass} />
      </Field>
      <Field label="Venue" hint="Where it's held, e.g. the school name.">
        <input name="location" placeholder="Central High School" className={inputClass} />
      </Field>
      <Field label="Address">
        <input name="address" placeholder="123 Main St, San Diego, CA" className={inputClass} />
      </Field>
      {dateLabels.map((label, i) => (
        <Field key={label} label={label} hint="You can leave this blank and set it later in Venue Details.">
          <input name={`date${i}`} type="date" className={inputClass} />
        </Field>
      ))}
      <Field label="Team limit" hint={capacityHint}>
        <input name="capacity" type="number" min={1} required defaultValue={defaultCapacity} className={inputClass} />
      </Field>
      <div className="sm:col-span-2 flex items-center gap-3">
        <button disabled={busy} className={`px-3 py-2 rounded-md text-sm text-white ${busy ? "bg-blue-300" : "bg-blue-600 hover:bg-blue-700"}`}>
          {busy ? "Saving…" : submitLabel}
        </button>
        {error && <span className="text-sm text-red-600">{error}</span>}
      </div>
    </form>
  );
}

// ---------- Events tab ----------

export function EventsTab({ venues, slots, onEditDetails }: { venues: Venue[]; slots: AdminSlot[]; onEditDetails: () => void }) {
  const createVenue = useMutation(api.venues.createSimple);
  const createSlot = useMutation(api.timeSlots.create);
  const { events, legacy } = group(venues);

  const assertNewName = (name: string) => {
    if (venues.some((v) => v.name.trim().toLowerCase() === name.toLowerCase())) throw new Error(`An event named "${name}" already exists.`);
  };

  const addMeet = async ({ name, location, address, dates: [sat, sun], capacity }: NewEvent) => {
    assertNewName(name);
    const { _id } = await createVenue({ name, type: "regular", location, address });
    await createSlot({ venueId: _id, day: "Saturday", date: sat || undefined, capacity });
    await createSlot({ venueId: _id, day: "Sunday", date: sun || undefined, capacity });
  };

  return (
    <div>
      <TabHeader
        title="Events"
        subtitle="Add events and open or close signups. Change names, venues, dates and team limits in Venue Details."
      />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <HowItWorks />
        <Checklist issues={setupIssues(venues, slots)} />
      </div>

      <Section title="Events" description="Meet 1 through the League Tournament. Teams are signed up for their chosen day at every event here.">
        {events.length === 0 && <Empty>No events yet.</Empty>}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {events.map((m) => (
            <EventCard key={m._id} title={m.name} venue={m} slots={slots} onEditDetails={onEditDetails} />
          ))}
        </div>
        <AddPanel label="Add an event">
          <NewEventForm
            nameLabel="Event name"
            namePlaceholder="League Meet 1"
            dateLabels={["Saturday date", "Sunday date"]}
            defaultCapacity={36}
            capacityHint="Max teams per day."
            submitLabel="Add event"
            onSubmit={addMeet}
          />
        </AddPanel>
      </Section>

      {legacy.length > 0 && (
        <Section title="Old league events" description="From the previous league-picking setup. Teams don't see these and aren't signed up for them. Delete them once their registrations are cleared.">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {legacy.map((u) => (
              <EventCard key={u._id} title={u.name} venue={u} slots={slots} onEditDetails={onEditDetails} />
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}

function EventCard({
  title,
  venue,
  slots,
  onEditDetails,
  closedNote,
}: {
  title: string;
  venue: Venue;
  slots: AdminSlot[];
  onEditDetails: () => void;
  closedNote?: string;
}) {
  const removeVenue = useMutation(api.venues.remove);
  const createSlot = useMutation(api.timeSlots.create);
  const own = slotsFor(slots, venue._id);
  const days = isWeekend(venue)
    ? (["Saturday", "Sunday"] as const).map((label) => ({ label, slot: own.find((s) => dayKey(s.day) === label.toLowerCase()) }))
    : [{ label: "Signups", slot: own[0] }];
  const place = [venue.location, venue.address].filter(Boolean).join(" · ");

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-slate-900">{title}</div>
          <div className={`text-sm ${place ? "text-slate-600" : "text-amber-700"}`}>{place || "No venue or address yet"}</div>
        </div>
        <button onClick={onEditDetails} className="text-xs text-blue-700 hover:underline">
          Edit details
        </button>
        <button
          onClick={async () => {
            if (!window.confirm(`Delete "${venue.name}"? This can't be undone.`)) return;
            try {
              await removeVenue({ id: venue._id });
            } catch (e) {
              alert(errorMessage(e));
            }
          }}
          className="text-xs text-red-700 hover:underline"
        >
          Delete
        </button>
      </div>
      <div className="mt-3 divide-y divide-slate-100">
        {days.map(({ label, slot }) =>
          slot ? (
            <SlotRow key={label} label={label} date={dateOf(venue, slot)} slot={slot} closedNote={closedNote} />
          ) : (
            <div key={label} className="py-2 flex items-center justify-between text-sm">
              <span className="text-slate-500">No {label === "Signups" ? "signup slot" : label}</span>
              <button
                onClick={() => createSlot({ venueId: venue._id, day: label === "Signups" ? "Day 1" : label, capacity: own[0]?.capacity ?? 36 })}
                className="px-2 py-1 rounded-md border text-xs border-blue-300 text-blue-700 hover:bg-blue-50"
              >
                Add {label === "Signups" ? "signup slot" : label}
              </button>
            </div>
          )
        )}
      </div>
    </div>
  );
}

function SlotRow({ label, date, slot, closedNote }: { label: string; date?: string; slot: AdminSlot; closedNote?: string }) {
  const setActive = useMutation(api.timeSlots.setActive);
  const removeSlot = useMutation(api.timeSlots.remove);
  const status = !slot.isActive
    ? { text: "Closed", cls: "bg-slate-100 text-slate-700" }
    : !slot.isAvailable
      ? { text: "Full", cls: "bg-red-100 text-red-800" }
      : { text: "Open", cls: "bg-green-100 text-green-800" };
  const pct = slot.capacity ? Math.min(100, (slot.currentCount / slot.capacity) * 100) : 0;

  return (
    <div className="py-2 text-sm">
      <div className="flex items-center gap-3">
        <div className="w-36 shrink-0">
          {label !== "Signups" && <div className="font-medium text-slate-800">{label}</div>}
          <div className={date ? "text-slate-600" : "text-amber-700"}>{formatDayDate(date) ?? "No date yet"}</div>
        </div>
        <div className="flex-1">
          <div className="text-slate-700">
            {slot.currentCount} / {slot.capacity} teams
          </div>
          <div className="w-full bg-slate-200 rounded-full h-1.5 mt-1">
            <div className={`h-1.5 rounded-full ${slot.isAvailable ? "bg-green-500" : "bg-red-500"}`} style={{ width: `${pct}%` }} />
          </div>
        </div>
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${status.cls}`}>{status.text}</span>
        <button
          onClick={() => setActive({ id: slot._id, isActive: !slot.isActive })}
          className={`px-2 py-1 rounded-md border text-xs ${slot.isActive ? "border-slate-300 text-slate-700 hover:bg-slate-50" : "border-green-300 text-green-700 hover:bg-green-50"}`}
        >
          {slot.isActive ? "Close signups" : "Reopen"}
        </button>
        {!slot.isActive && slot.currentCount === 0 && (
          <button
            onClick={() => removeSlot({ id: slot._id }).catch((e) => alert(errorMessage(e)))}
            className="px-2 py-1 rounded-md border text-xs border-red-300 text-red-700 hover:bg-red-50"
          >
            Remove
          </button>
        )}
      </div>
      {!slot.isActive && <div className="text-xs text-slate-500 mt-1">{closedNote ?? "Teams can't pick this while it's closed. Existing signups are kept."}</div>}
    </div>
  );
}

// ---------- Venue Details tab ----------

export function VenueDetailsTab({ venues, slots }: { venues: Venue[]; slots: AdminSlot[] }) {
  const { events } = group(venues);
  return (
    <div>
      <TabHeader
        title="Venue Details"
        subtitle="What teams see on the registration page and in their confirmation email. Add or remove events in the Events tab."
      />

      <Section title="Events" description="Each day keeps its own date. Teams see the event name, venue and address on their schedule.">
        {events.length === 0 && <Empty>No events yet. Add them in the Events tab.</Empty>}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {events.map((m) => (
            <DetailsForm key={m._id} title={m.name} venue={m} slots={slots} />
          ))}
        </div>
      </Section>
    </div>
  );
}

const NAME_HINT: Record<Venue["type"], { label: string; hint: string }> = {
  championship: { label: "League name", hint: "The league's title. Descartes, Euclid, Gauss and Turing get their own color and icon." },
  meet1: { label: "Internal name", hint: "Only admins see this. Teams see \"League Meet 1\"." },
  regular: { label: "Event name", hint: "Shown to teams, e.g. \"League Meet 1\" or \"League Tournament\"." },
};

function DetailsForm({ title, venue, slots }: { title: string; venue: Venue; slots: AdminSlot[] }) {
  const setDetails = useMutation(api.venues.setDetails);
  const updateSlot = useMutation(api.timeSlots.update);
  const setCapacity = useMutation(api.timeSlots.setCapacityForVenue);
  const [state, setState] = useState<{ busy?: boolean; saved?: boolean; error?: string }>({});
  const own = slotsFor(slots, venue._id);
  const weekend = isWeekend(venue);
  const capacity = own[0]?.capacity;

  return (
    <form
      // Remount when the stored values change so the inputs show fresh data.
      key={JSON.stringify([venue, own.map((s) => [s.date, s.capacity])])}
      className="rounded-lg border border-slate-200 bg-white p-4 space-y-3"
      onSubmit={async (e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        const get = (k: string) => String(data.get(k) ?? "").trim();
        setState({ busy: true });
        try {
          const singleDate = get("date");
          await setDetails({
            venueId: venue._id,
            name: get("name") || venue.name,
            location: get("location"),
            address: get("address"),
            ...(weekend ? {} : { date: singleDate }),
          });
          // Slot dates win over the venue date, so keep them in sync.
          for (const s of own) {
            const date = weekend ? get(`date-${s._id}`) : singleDate;
            if ((s.date ?? "") !== date) await updateSlot({ id: s._id, date });
          }
          const newCapacity = Number(get("capacity"));
          if (newCapacity && newCapacity !== capacity) await setCapacity({ venueId: venue._id, capacity: newCapacity });
          setState({ saved: true });
          setTimeout(() => setState({}), 2500);
        } catch (err) {
          setState({ error: errorMessage(err) });
        }
      }}
    >
      <div className="font-semibold text-slate-900">{title}</div>
      <Field label={NAME_HINT[venue.type].label} hint={NAME_HINT[venue.type].hint}>
        <input name="name" required defaultValue={venue.name} className={inputClass} />
      </Field>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Venue">
          <input name="location" defaultValue={venue.location ?? ""} placeholder="Central High School" className={inputClass} />
        </Field>
        <Field label="Address">
          <input name="address" defaultValue={venue.address ?? ""} placeholder="123 Main St, San Diego, CA" className={inputClass} />
        </Field>
        {weekend ? (
          own.map((s) => (
            <Field key={s._id} label={`${s.day} date`}>
              <input name={`date-${s._id}`} type="date" defaultValue={s.date ?? ""} className={inputClass} />
            </Field>
          ))
        ) : (
          <Field label="Date">
            <input name="date" type="date" defaultValue={dateOf(venue, own[0]) ?? ""} className={inputClass} />
          </Field>
        )}
        {capacity !== undefined && (
          <Field label="Team limit" hint={weekend ? "Max teams per day." : "Max teams for this event."}>
            <input name="capacity" type="number" min={1} defaultValue={capacity} className={inputClass} />
          </Field>
        )}
      </div>
      <div className="flex items-center gap-3" aria-live="polite">
        <button disabled={state.busy} className={`px-3 py-2 rounded-md text-sm text-white ${state.busy ? "bg-amber-400" : "bg-amber-600 hover:bg-amber-700"}`}>
          {state.busy ? "Saving…" : "Save"}
        </button>
        {state.saved && <span className="text-sm text-green-700">Saved</span>}
        {state.error && <span className="text-sm text-red-600">{state.error}</span>}
      </div>
    </form>
  );
}
