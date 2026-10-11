"use client";

import { useMutation } from "convex/react";
import { useState, type ReactNode } from "react";
import { api } from "../../../../convex/_generated/api";
import type { Doc, Id } from "../../../../convex/_generated/dataModel";
import { formatDayDate } from "@/lib/utils";

type Venue = Doc<"venues">;
export type AdminSlot = Doc<"timeSlots"> & { currentCount: number; isAvailable: boolean };

// ---------- Shared data helpers ----------

// A league = championship venue + the meet1 venue linked to it. Regular venues are the Sat/Sun league meets.
function group(venues: Venue[]) {
  const leagues = venues.filter((v) => v.type === "championship");
  const meet1For = (leagueId: Id<"venues">) => venues.find((m) => m.type === "meet1" && m.leagueId === leagueId);
  const meets = venues.filter((v) => v.type === "regular");
  const unlinked = venues.filter((v) => v.type === "meet1" && !leagues.some((l) => l._id === v.leagueId));
  return { leagues, meet1For, meets, unlinked };
}

const isWeekend = (v: Venue) => v.type === "regular";
const dayKey = (day: string) => {
  const d = day.toLowerCase().trim();
  return d.startsWith("sun") || d === "day 2" ? "sunday" : d.startsWith("sat") || d === "day 1" ? "saturday" : d;
};
const slotsFor = (slots: AdminSlot[], venueId: Id<"venues">) =>
  slots.filter((s) => s.venueId === venueId).sort((a, b) => dayKey(a.day).localeCompare(dayKey(b.day))); // saturday before sunday
// Weekend days carry their own date; single-day events fall back to the venue date (same rule the registration page uses).
const dateOf = (venue: Venue, slot?: AdminSlot) => slot?.date || (isWeekend(venue) ? undefined : venue.date);

function setupIssues(venues: Venue[], slots: AdminSlot[]) {
  const { leagues, meet1For, meets, unlinked } = group(venues);
  const issues: string[] = [];
  if (leagues.length === 0) issues.push("No leagues yet. Add one in Step 1.");
  if (meets.length === 0) issues.push("No league meets yet. Add them in Step 2.");
  for (const l of leagues) {
    const champ = slotsFor(slots, l._id)[0];
    const meet1 = meet1For(l._id);
    if (!dateOf(l, champ)) issues.push(`${l.name}: championship has no date.`);
    if (!meet1) {
      issues.push(`${l.name}: no Meet 1 yet. Teams will see "TBD" and won't be signed up for one.`);
      continue;
    }
    const m1 = slotsFor(slots, meet1._id)[0];
    if (!dateOf(meet1, m1)) issues.push(`${l.name}: Meet 1 has no date.`);
    if (champ && m1 && m1.capacity < champ.capacity)
      issues.push(`${l.name}: Meet 1 limit (${m1.capacity}) is lower than the championship (${champ.capacity}), so the league fills at ${m1.capacity} teams.`);
  }
  for (const m of meets) {
    for (const s of slotsFor(slots, m._id)) if (!s.date) issues.push(`${m.name}: ${s.day} has no date.`);
  }
  for (const u of unlinked) issues.push(`${u.name} isn't linked to a league, so no team will be signed up for it. Delete it and add Meet 1 from the league.`);
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
          Each team picks <b>one league</b>. That signs them up for the league&apos;s <b>Meet 1</b> and <b>Championship</b> automatically.
        </li>
        <li>
          They also pick <b>Saturday or Sunday</b> at every open <b>league meet</b>.
        </li>
        <li>They get a confirmation email listing every event, ordered by date.</li>
      </ol>
    </div>
  );
}

function Checklist({ issues }: { issues: string[] }) {
  if (issues.length === 0)
    return (
      <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800">
        Setup looks complete. Every league has a Meet 1 and every event has a date.
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

// ---------- Create form (league, league meet, Meet 1) ----------

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
  nameLabel?: string; // omit for Meet 1, which is named after its league
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
      {nameLabel && (
        <Field label={nameLabel}>
          <input name="name" required placeholder={namePlaceholder} className={inputClass} />
        </Field>
      )}
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
  const { leagues, meet1For, meets, unlinked } = group(venues);

  const assertNewName = (name: string) => {
    if (venues.some((v) => v.name.trim().toLowerCase() === name.toLowerCase())) throw new Error(`An event named "${name}" already exists.`);
  };

  const addLeague = async ({ name, location, address, dates: [date], capacity }: NewEvent) => {
    assertNewName(name);
    const { _id } = await createVenue({ name, type: "championship", location, address, date: date || undefined });
    await createSlot({ venueId: _id, day: "Day 1", capacity });
  };
  const addMeet1 = (league: Venue) => async ({ location, address, dates: [date], capacity }: NewEvent) => {
    const name = `${league.name} League Meet 1`;
    assertNewName(name);
    const { _id } = await createVenue({ name, type: "meet1", leagueId: league._id, location, address, date: date || undefined });
    await createSlot({ venueId: _id, day: "Day 1", capacity });
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

      <Section step={1} title="Leagues" description="Teams choose exactly one league. Each league is two events: a Meet 1 and a Championship.">
        {leagues.length === 0 && <Empty>No leagues yet.</Empty>}
        {leagues.map((league) => {
          const meet1 = meet1For(league._id);
          const champCapacity = slotsFor(slots, league._id)[0]?.capacity ?? 20;
          return (
            <div key={league._id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="font-semibold text-slate-900 text-lg mb-3">{league.name} League</div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {meet1 ? (
                  <EventCard title="Meet 1" venue={meet1} slots={slots} onEditDetails={onEditDetails} />
                ) : (
                  <div className="rounded-lg border border-amber-300 bg-white p-4">
                    <div className="font-semibold text-slate-900">Meet 1</div>
                    <p className="text-sm text-amber-800 mb-3">Not set up yet. Teams see &quot;TBD&quot; and won&apos;t be signed up for a Meet 1.</p>
                    <NewEventForm
                      dateLabels={["Meet 1 date"]}
                      defaultCapacity={champCapacity}
                      capacityHint="Keep this at least the championship's limit, or the league fills early."
                      submitLabel="Add Meet 1"
                      onSubmit={addMeet1(league)}
                    />
                  </div>
                )}
                <EventCard
                  title="Championship"
                  venue={league}
                  slots={slots}
                  onEditDetails={onEditDetails}
                  closedNote="The whole league is hidden from teams while this is closed."
                />
              </div>
            </div>
          );
        })}
        <AddPanel label="Add a league">
          <NewEventForm
            nameLabel="League name"
            namePlaceholder="Descartes"
            dateLabels={["Championship date"]}
            defaultCapacity={20}
            capacityHint="Max teams in this league."
            submitLabel="Add league"
            onSubmit={addLeague}
          />
          <p className="text-xs text-slate-500 mt-3">After adding the league, add its Meet 1 from the league&apos;s card.</p>
        </AddPanel>
      </Section>

      <Section step={2} title="League meets" description="Teams pick Saturday or Sunday at every open league meet. Close a day to stop new signups for it.">
        {meets.length === 0 && <Empty>No league meets yet.</Empty>}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {meets.map((m) => (
            <EventCard key={m._id} title={m.name} venue={m} slots={slots} onEditDetails={onEditDetails} />
          ))}
        </div>
        <AddPanel label="Add a league meet">
          <NewEventForm
            nameLabel="Meet name"
            namePlaceholder="League Meet 2"
            dateLabels={["Saturday date", "Sunday date"]}
            defaultCapacity={36}
            capacityHint="Max teams per day."
            submitLabel="Add league meet"
            onSubmit={addMeet}
          />
        </AddPanel>
      </Section>

      {unlinked.length > 0 && (
        <Section title="Meet 1s without a league" description="No team is signed up for these. Delete them, then add Meet 1 from the league's card.">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {unlinked.map((u) => (
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

export function VenueDetailsTab({ venues, slots, onGoToEvents }: { venues: Venue[]; slots: AdminSlot[]; onGoToEvents: () => void }) {
  const { leagues, meet1For, meets, unlinked } = group(venues);
  return (
    <div>
      <TabHeader
        title="Venue Details"
        subtitle="What teams see on the registration page and in their confirmation email. Add or remove events in the Events tab."
      />

      <Section step={1} title="Leagues" description="Each league's Meet 1 and Championship are shown to teams together on the league's card.">
        {leagues.length === 0 && <Empty>No leagues yet. Add them in the Events tab.</Empty>}
        {leagues.map((league) => {
          const meet1 = meet1For(league._id);
          return (
            <div key={league._id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="font-semibold text-slate-900 text-lg mb-3">{league.name} League</div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {meet1 ? (
                  <DetailsForm title="Meet 1" venue={meet1} slots={slots} />
                ) : (
                  <div className="rounded-lg border border-amber-300 bg-white p-4 text-sm">
                    <div className="font-semibold text-slate-900">Meet 1</div>
                    <p className="text-amber-800 mb-3">Not set up yet. Teams see &quot;TBD&quot;.</p>
                    <button onClick={onGoToEvents} className="px-3 py-2 rounded-md text-sm text-white bg-blue-600 hover:bg-blue-700">
                      Set up Meet 1 in Events
                    </button>
                  </div>
                )}
                <DetailsForm title="Championship" venue={league} slots={slots} />
              </div>
            </div>
          );
        })}
      </Section>

      <Section step={2} title="League meets" description="Each day keeps its own date. Teams see the venue and address on the meet's card.">
        {meets.length === 0 && <Empty>No league meets yet. Add them in the Events tab.</Empty>}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {meets.map((m) => (
            <DetailsForm key={m._id} title={m.name} venue={m} slots={slots} />
          ))}
        </div>
      </Section>

      {unlinked.length > 0 && (
        <Section title="Meet 1s without a league" description="No team is signed up for these. Remove them in the Events tab.">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {unlinked.map((u) => (
              <DetailsForm key={u._id} title={u.name} venue={u} slots={slots} />
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}

const NAME_HINT: Record<Venue["type"], { label: string; hint: string }> = {
  championship: { label: "League name", hint: "The league's title. Descartes, Euclid, Gauss and Turing get their own color and icon." },
  meet1: { label: "Internal name", hint: "Only admins see this. Teams see \"League Meet 1\"." },
  regular: { label: "Meet name", hint: "Shown as the title of the meet's card." },
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
