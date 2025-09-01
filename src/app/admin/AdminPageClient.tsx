"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useMemo, useState } from "react";
import type { Id } from "../../../convex/_generated/dataModel";
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

                    <AddEventForm venues={venues} onCreate={async (payload) => {
                      await createTimeSlot(payload);
                      router.refresh();
                    }} />

                    <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {venues?.map((v) => {
                        const slotsForVenue = (timeSlots ?? []).filter((s) => s.venueId === v._id);
                        return (
                          <div key={String(v._id)} className="bg-white border border-slate-200 rounded-xl p-4">
                            <div className="font-semibold text-slate-900 mb-3">{v.name}</div>
                            {slotsForVenue.length === 0 ? (
                              <div className="text-sm text-slate-500">No active time slots.</div>
                            ) : (
                              <ul className="space-y-2">
                                {slotsForVenue.map((s) => (
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
                                ))}
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

type VenueOption = { _id: string; name: string; type: string };

function AddEventForm({
  venues,
  onCreate,
}: {
  venues: Array<VenueOption> | undefined;
  onCreate: (payload: { venueId: Id<"venues">; day: string; date?: string; capacity: number }) => Promise<void>;
}) {
  const [venueId, setVenueId] = useState<string>("");
  const [day, setDay] = useState("Day 1");
  const [date, setDate] = useState("");
  const [capacity, setCapacity] = useState<number>(36);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const orderedVenues = useMemo(() => {
    return (venues ?? []).slice().sort((a, b) => {
      if (a.type !== b.type) return a.type === "regular" ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
  }, [venues]);

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4">
      <div className="font-semibold text-slate-900 mb-3">Add New Event</div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
        <label className="text-sm">
          <span className="block text-slate-700 mb-1">Venue</span>
          <select
            value={venueId}
            onChange={(e) => setVenueId(e.target.value)}
            className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm bg-white"
          >
            <option value="">Select a venue…</option>
            {orderedVenues.map((v) => (
              <option key={v._id} value={v._id}>
                {v.name} {v.type === "championship" ? "(Championship)" : ""}
              </option>
            ))}
          </select>
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
            disabled={!venueId || !day || creating}
            onClick={async () => {
              setError(null);
              setCreating(true);
              try {
        await onCreate({ venueId: venueId as unknown as Id<"venues">, day, date: date || undefined, capacity });
                setVenueId("");
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
