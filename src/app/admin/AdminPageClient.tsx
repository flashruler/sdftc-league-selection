"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useState } from "react";
import type { Id, Doc } from "../../../convex/_generated/dataModel";
import { useRouter } from "next/navigation";
import { VenueDetailsCard } from "./components/VenueDetailsCard";
import { CsvTable, ExportCsvButton } from "./components/CsvExports";
import { Tabs } from "./components/Tabs";

export default function AdminPageClient() {
  const router = useRouter();
  const registrations = useQuery(api.registrations.getAll);
  const timeSlots = useQuery(api.timeSlots.getAvailable);
  const venues = useQuery(api.venues.get);
  const setVenueDetails = useMutation(api.venues.setDetails);
  const createTimeSlot = useMutation(api.timeSlots.create);
  const setTimeSlotActive = useMutation(api.timeSlots.setActive);
  const createVenueSimple = useMutation(api.venues.createSimple);

  // Per-venue UX state
  const [savingByVenue, setSavingByVenue] = useState<Record<string, boolean>>({});
  const [savedAtByVenue, setSavedAtByVenue] = useState<Record<string, number>>({});
  const [errorByVenue, setErrorByVenue] = useState<Record<string, string | null>>({});

  // (Initial setup handled elsewhere; no-op here)

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-end mb-4">
            <button
              onClick={async () => {
                await fetch("/api/admin/logout", { method: "POST" });
                router.replace("/admin/login");
                router.refresh();
              }}
              className="px-3 py-2 text-sm rounded-md border border-slate-300 text-slate-700 hover:bg-slate-50"
            >
              Sign out
            </button>
          </div>
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4 leading-tight">
              FTC League Selection
            </h1>
            <p className="text-lg text-slate-600 max-w-lg mx-auto">
              Administrative controls and registration management
            </p>
          </div>

          <Tabs
            items={[
              {
                id: "capacity",
                label: "Capacity Overview",
                content: (
                  <div>
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      </div>
                      <div>
                        <h2 className="text-xl font-semibold text-slate-900">Capacity Overview</h2>
                        <p className="text-slate-600">Current registration status across all venues</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                {timeSlots?.map((slot) => (
                        <div
                          key={slot._id}
                          className={`border-2 rounded-xl p-5 transition-all ${
                            slot.isAvailable ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"
                          }`}
                        >
                          <div className="space-y-3">
                            <div className="font-semibold text-slate-900">{slot.venueName}</div>
                            <div className="text-sm text-slate-600">{slot.day}</div>
                            <div className="flex items-center justify-between">
                              <span className="text-2xl font-bold text-slate-900">
                                {slot.currentCount}/{slot.capacity}
                              </span>
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  slot.isAvailable ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                                }`}
                              >
                                {slot.isAvailable ? "Available" : "Full"}
                              </span>
                            </div>
                            <div className="w-full bg-slate-200 rounded-full h-3">
                              <div
                                className={`h-3 rounded-full transition-all ${
                                  slot.isAvailable ? "bg-green-500" : "bg-red-500"
                                }`}
                                style={{ width: `${(slot.currentCount / slot.capacity) * 100}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ),
              },
              {
                id: "venues",
                label: "Venue Details",
                content: (
                  <div>
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c1.657 0 3-1.343 3-3S13.657 5 12 5 9 6.343 9 8s1.343 3 3 3z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.5 8c0 7.5-7.5 12-7.5 12S4.5 15.5 4.5 8a7.5 7.5 0 1115 0z" />
                        </svg>
                      </div>
                      <div>
                        <h2 className="text-xl font-semibold text-slate-900">Venue Details</h2>
                        <p className="text-slate-600">Set location, date, and address for each venue</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {venues?.map((venue) => {
                        const id = venue._id as string;
                        return (
                          <VenueDetailsCard
                            key={id}
                            venue={{
                              _id: id,
                              name: venue.name as string,
                              type: venue.type as string,
                              location: (venue as { location?: string }).location,
                              date: (venue as { date?: string }).date,
                              address: (venue as { address?: string }).address,
                            }}
                            saving={!!savingByVenue[id]}
                            saved={!!savedAtByVenue[id] && !savingByVenue[id] && !errorByVenue[id]}
                            error={errorByVenue[id]}
                            onSave={async ({ location, date, address }) => {
                              setErrorByVenue((prev) => ({ ...prev, [id]: null }));
                              setSavingByVenue((prev) => ({ ...prev, [id]: true }));
                              try {
                                await setVenueDetails({ venueId: venue._id, location, date, address });
                                setSavedAtByVenue((prev) => ({ ...prev, [id]: Date.now() }));
                                setTimeout(() => {
                                  setSavedAtByVenue((prev) => {
                                    const rest = { ...prev };
                                    delete rest[id];
                                    return rest;
                                  });
                                }, 2500);
                              } catch (err: unknown) {
                                const message = err instanceof Error ? err.message : "Failed to save";
                                setErrorByVenue((prev) => ({ ...prev, [id]: message }));
                              } finally {
                                setSavingByVenue((prev) => ({ ...prev, [id]: false }));
                              }
                            }}
                          />
                        );
                      })}
                    </div>
                  </div>
                ),
              },
              {
                id: "events",
                label: "Events",
                content: (
                  <div>
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                      </div>
                      <div>
                        <h2 className="text-xl font-semibold text-slate-900">Manage Events</h2>
                        <p className="text-slate-600">Add new time slots and toggle availability</p>
                      </div>
                    </div>

                    {/* Quick add: create a regular venue with Saturday/Sunday pair */}
                    <AddRegularPairForm
                      onCreate={async ({ venueName, address, satDate, sunDate, capacity }) => {
                        const existing = (venues ?? []).find((v) => v.name.trim() === venueName.trim());
                        let venueId: Id<"venues">;
                        if (existing) {
                          venueId = existing._id as Id<"venues">;
                          if (address && (existing as { address?: string }).address !== address) {
                            await setVenueDetails({ venueId, address });
                          }
                        } else {
                          const created = await createVenueSimple({ name: venueName, address, type: "regular" });
                          venueId = created._id as Id<"venues">;
                        }
                        // Create Saturday and Sunday slots
                        await createTimeSlot({ venueId, day: "Saturday", date: satDate || undefined, capacity });
                        await createTimeSlot({ venueId, day: "Sunday", date: sunDate || undefined, capacity });
                        router.refresh();
                      }}
                    />

                    {/* Single add remains available */}
                    <div className="mt-6">
                      <AddEventForm
                        onCreate={async ({ venueName, address, day, date, capacity }) => {
                          const existing = (venues ?? []).find((v) => v.name.trim() === venueName.trim());
                          let venueId: Id<"venues">;
                          if (existing) {
                            venueId = existing._id as Id<"venues">;
                            if (address && (existing as { address?: string }).address !== address) {
                              await setVenueDetails({ venueId, address });
                            }
                          } else {
                            const created = await createVenueSimple({ name: venueName, address });
                            venueId = created._id as Id<"venues">;
                          }
                          await createTimeSlot({ venueId, day, date, capacity });
                          router.refresh();
                        }}
                      />
                    </div>

                    {/* Per-venue paired view */}
                    <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {venues?.map((v) => {
                        const slotsForVenue = ((timeSlots as AvailableSlot[] | undefined) ?? []).filter((s) => s.venueId === v._id);
                        const pairs = groupIntoWeekendPair(slotsForVenue);
                        const isRegular = v.type === "regular";
                        return (
                          <div key={String(v._id)} className="bg-white border border-slate-200 rounded-xl p-4">
                            <div className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                              {v.name}
                              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">{v.type}</span>
                            </div>
                            {isRegular ? (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {/* Saturday */}
                                <DayCard
                                  label="Saturday"
                                  slot={pairs.saturday}
                                  onToggle={async (id, current) => {
                                    await setTimeSlotActive({ id, isActive: !current });
                                    router.refresh();
                                  }}
                                  onCreate={async ({ date, capacity }) => {
                                    await createTimeSlot({ venueId: v._id as Id<"venues">, day: "Saturday", date: date || undefined, capacity });
                                    router.refresh();
                                  }}
                                />
                                {/* Sunday */}
                                <DayCard
                                  label="Sunday"
                                  slot={pairs.sunday}
                                  onToggle={async (id, current) => {
                                    await setTimeSlotActive({ id, isActive: !current });
                                    router.refresh();
                                  }}
                                  onCreate={async ({ date, capacity }) => {
                                    await createTimeSlot({ venueId: v._id as Id<"venues">, day: "Sunday", date: date || undefined, capacity });
                                    router.refresh();
                                  }}
                                />
                              </div>
                            ) : (
                              // Championship: list all slots as before
                              <ul className="space-y-2">
                                {slotsForVenue.length === 0 ? (
                                  <li className="text-sm text-slate-500">No active time slots.</li>
                                ) : (
                                  slotsForVenue.map((s) => (
                                    <li key={String(s._id)} className="flex items-center justify-between text-sm">
                                      <div className="text-slate-700">
                                        <span className="font-medium">{s.day}</span>
                                        {s.date ? <span className="text-slate-500"> · {s.date}</span> : null}
                                        <span className="text-slate-500"> · cap {s.capacity}</span>
                                      </div>
                                      <button
                                        onClick={async () => {
                                          await setTimeSlotActive({ id: s._id, isActive: !s.isActive });
                                          router.refresh();
                                        }}
                                        className={`px-2 py-1 rounded-md border text-xs ${s.isActive ? "border-red-300 text-red-700 hover:bg-red-50" : "border-green-300 text-green-700 hover:bg-green-50"}`}
                                      >
                                        {s.isActive ? "Deactivate" : "Activate"}
                                      </button>
                                    </li>
                                  ))
                                )}
                              </ul>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ),
              },
              {
                id: "registrations",
                label: "Registrations",
                content: (
                  <div>
                    <div className="flex items-center justify-between gap-3 mb-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                          <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                        </div>
                        <div>
                          <h2 className="text-xl font-semibold text-slate-900">Registrations (CSV-ready)</h2>
                          <p className="text-slate-600">Team Number, League, Venue 1 Day, Venue 2 Day, Venue 3 Day</p>
                        </div>
                      </div>
                      <ExportCsvButton registrations={registrations} />
                    </div>
                    <CsvTable registrations={registrations} />
                  </div>
                ),
              },
            ]}
            initialId="capacity"
          />
        </div>
      </div>
    </main>
  );
}

function AddEventForm({
  onCreate,
}: {
  onCreate: (payload: { venueName: string; address?: string; day: string; date?: string; capacity: number }) => Promise<void>;
}) {
  const [venueName, setVenueName] = useState("");
  const [address, setAddress] = useState("");
  const [day, setDay] = useState("Day 1");
  const [date, setDate] = useState("");
  const [capacity, setCapacity] = useState<number>(36);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4">
      <div className="font-semibold text-slate-900 mb-3">Add New Event</div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
        <label className="text-sm">
          <span className="block text-slate-700 mb-1">Venue Name</span>
          <input
            value={venueName}
            onChange={(e) => setVenueName(e.target.value)}
            placeholder="Central High School"
            className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm"
          />
        </label>

        <label className="text-sm">
          <span className="block text-slate-700 mb-1">Address (optional)</span>
          <input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="123 Main St, City, ST"
            className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm"
          />
        </label>

        <label className="text-sm">
          <span className="block text-slate-700 mb-1">Day label</span>
          <input
            value={day}
            onChange={(e) => setDay(e.target.value)}
            placeholder="Day 1"
            className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm"
          />
        </label>

        <label className="text-sm">
          <span className="block text-slate-700 mb-1">Date (optional)</span>
          <input
            value={date}
            onChange={(e) => setDate(e.target.value)}
            placeholder="YYYY-MM-DD"
            className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm"
          />
        </label>

        <label className="text-sm">
          <span className="block text-slate-700 mb-1">Capacity</span>
          <input
            type="number"
            min={1}
            value={capacity}
            onChange={(e) => setCapacity(Number(e.target.value))}
            className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm"
          />
        </label>

        <div className="sm:col-span-2 flex items-center gap-3">
      <button
      disabled={!venueName.trim() || !day || creating}
            onClick={async () => {
              setError(null);
              setCreating(true);
              try {
        await onCreate({ venueName: venueName.trim(), address: address.trim() || undefined, day, date: date || undefined, capacity });
        setVenueName("");
        setAddress("");
                setDay("Day 1");
                setDate("");
                setCapacity(36);
              } catch (e: unknown) {
                const message = e instanceof Error ? e.message : "Failed to create";
                setError(message);
              } finally {
                setCreating(false);
              }
            }}
            className={`px-3 py-2 rounded-md text-sm text-white ${creating ? "bg-blue-300" : "bg-blue-600 hover:bg-blue-700"}`}
          >
            {creating ? "Creating…" : "Add Event"}
          </button>
          {error && <span className="text-sm text-red-600">{error}</span>}
        </div>
      </div>
    </div>
  );
}

// Quick form to create a regular venue with both Saturday/Sunday in one go
function AddRegularPairForm({
  onCreate,
}: {
  onCreate: (payload: { venueName: string; address?: string; satDate?: string; sunDate?: string; capacity: number }) => Promise<void>;
}) {
  const [venueName, setVenueName] = useState("");
  const [address, setAddress] = useState("");
  const [satDate, setSatDate] = useState("");
  const [sunDate, setSunDate] = useState("");
  const [capacity, setCapacity] = useState<number>(36);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4">
      <div className="font-semibold text-slate-900 mb-3">Add Regular Venue (Saturday + Sunday)</div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
        <label className="text-sm">
          <span className="block text-slate-700 mb-1">Venue Name</span>
          <input
            value={venueName}
            onChange={(e) => setVenueName(e.target.value)}
            placeholder="Central High School"
            className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm"
          />
        </label>
        <label className="text-sm">
          <span className="block text-slate-700 mb-1">Address (optional)</span>
          <input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="123 Main St, City, ST"
            className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm"
          />
        </label>
        <label className="text-sm">
          <span className="block text-slate-700 mb-1">Saturday Date (optional)</span>
          <input
            value={satDate}
            onChange={(e) => setSatDate(e.target.value)}
            type="date"
            className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm"
          />
        </label>
        <label className="text-sm">
          <span className="block text-slate-700 mb-1">Sunday Date (optional)</span>
          <input
            value={sunDate}
            onChange={(e) => setSunDate(e.target.value)}
            type="date"
            className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm"
          />
        </label>
        <label className="text-sm">
          <span className="block text-slate-700 mb-1">Capacity</span>
          <input
            type="number"
            min={1}
            value={capacity}
            onChange={(e) => setCapacity(Number(e.target.value))}
            className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm"
          />
        </label>
        <div className="sm:col-span-2 flex items-center gap-3">
          <button
            disabled={!venueName.trim() || creating}
            onClick={async () => {
              setError(null);
              setCreating(true);
              try {
                await onCreate({ venueName: venueName.trim(), address: address.trim() || undefined, satDate: satDate || undefined, sunDate: sunDate || undefined, capacity });
                setVenueName("");
                setAddress("");
                setSatDate("");
                setSunDate("");
                setCapacity(36);
              } catch (e: unknown) {
                const message = e instanceof Error ? e.message : "Failed to create";
                setError(message);
              } finally {
                setCreating(false);
              }
            }}
            className={`px-3 py-2 rounded-md text-sm text-white ${creating ? "bg-blue-300" : "bg-blue-600 hover:bg-blue-700"}`}
          >
            {creating ? "Creating…" : "Add Pair"}
          </button>
          {error && <span className="text-sm text-red-600">{error}</span>}
        </div>
      </div>
    </div>
  );
}

// Tiny card for a day in the pair with create/toggle
function DayCard({
  label,
  slot,
  onToggle,
  onCreate,
}: {
  label: string;
  slot: AvailableSlot | null;
  onToggle: (id: Id<"timeSlots">, currentActive: boolean) => Promise<void>;
  onCreate: (payload: { date?: string; capacity: number }) => Promise<void>;
}) {
  const [date, setDate] = useState("");
  const [capacity, setCapacity] = useState<number>(36);
  return (
    <div className="border rounded-lg p-3">
      <div className="text-sm font-medium text-slate-800 mb-2">{label}</div>
  {slot ? (
        <div className="flex items-center justify-between text-sm">
          <div className="text-slate-700">
            <span className="font-medium">{slot.day}</span>
            {slot.date ? <span className="text-slate-500"> · {slot.date}</span> : null}
            <span className="text-slate-500"> · cap {slot.capacity}</span>
          </div>
          <button
            onClick={() => onToggle(slot._id, slot.isActive)}
            className={`px-2 py-1 rounded-md border text-xs ${slot.isActive ? "border-red-300 text-red-700 hover:bg-red-50" : "border-green-300 text-green-700 hover:bg-green-50"}`}
          >
            {slot.isActive ? "Deactivate" : "Activate"}
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex gap-2 items-end">
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="border border-slate-300 rounded-md px-3 py-2 text-sm"
            />
            <input
              type="number"
              min={1}
              value={capacity}
              onChange={(e) => setCapacity(Number(e.target.value))}
              className="w-28 border border-slate-300 rounded-md px-3 py-2 text-sm"
            />
            <button
              onClick={() => onCreate({ date: date || undefined, capacity })}
              className="px-2 py-1 rounded-md border text-xs border-blue-300 text-blue-700 hover:bg-blue-50"
            >
              Create
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Utility: group a venue's slots into a weekend pair based on day labels
function groupIntoWeekendPair(slots: Array<{ day: string }> | undefined) {
  const sats = (slots || []) as AvailableSlot[];
  const sat = sats.find((s) => normalizeDay(s.day) === "saturday") || null;
  const sun = sats.find((s) => normalizeDay(s.day) === "sunday") || null;
  return { saturday: sat, sunday: sun } as { saturday: AvailableSlot | null; sunday: AvailableSlot | null };
}

function normalizeDay(day: string) {
  const d = (day || "").toLowerCase().trim();
  if (d.startsWith("sat")) return "saturday";
  if (d.startsWith("sun")) return "sunday";
  // Back-compat with "Day 1"/"Day 2": map 1->Sat, 2->Sun
  if (d === "day 1" || d === "1") return "saturday";
  if (d === "day 2" || d === "2") return "sunday";
  return d;
}

// Types
type TimeSlotDoc = Doc<"timeSlots">;
type AvailableSlot = TimeSlotDoc & {
  venueName: string;
  venueType: "regular" | "championship";
  currentCount: number;
  spotsRemaining: number;
  isAvailable: boolean;
};
