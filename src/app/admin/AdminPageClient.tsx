"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useState } from "react";
import type { Id, Doc } from "../../../convex/_generated/dataModel";
import { useRouter } from "next/navigation";
import { VenueDetailsCard } from "./components/VenueDetailsCard";
import { CsvTable, ExportCsvButton } from "./components/CsvExports";
import { Tabs } from "./components/Tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminSidebar, type AdminSection } from "./components/AdminSidebar";

export default function AdminPageClient() {
  const router = useRouter();
  const registrations = useQuery(api.registrations.getAll);
  const timeSlots = useQuery(api.timeSlots.getAllForAdmin);
  const venues = useQuery(api.venues.get);
  const setVenueDetails = useMutation(api.venues.setDetails);
  const createTimeSlot = useMutation(api.timeSlots.create);
  const setTimeSlotActive = useMutation(api.timeSlots.setActive);
  const deleteTimeSlot = useMutation(api.timeSlots.remove);
  const createVenueSimple = useMutation(api.venues.createSimple);
  const deleteVenue = useMutation(api.venues.remove);
  const removeRegistrationsByTeam = useMutation(api.registrations.removeByTeam);
  const setVenueCapacityAll = useMutation(api.timeSlots.setCapacityForVenue);

  // Per-venue UX state
  const [savingByVenue, setSavingByVenue] = useState<Record<string, boolean>>({});
  const [savedAtByVenue, setSavedAtByVenue] = useState<Record<string, number>>({});
  const [errorByVenue, setErrorByVenue] = useState<Record<string, string | null>>({});

  // (Initial setup handled elsewhere; no-op here)

  const [section, setSection] = useState<AdminSection>("capacity");

  // KPI metrics
  const uniqueTeams = new Set((registrations ?? []).map((r) => r.teamNumber)).size;
  const activeSlots = (timeSlots ?? []).filter((s) => s.isActive);
  const totalCapacity = activeSlots.reduce((sum, s) => sum + s.capacity, 0);
  const totalRegistered = activeSlots.reduce((sum, s) => sum + s.currentCount, 0);
  const utilization = totalCapacity > 0 ? Math.round((totalRegistered / totalCapacity) * 100) : 0;

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-[1400px]">
        <div className="flex min-h-screen">
          <AdminSidebar active={section} onChange={setSection} />
          <div className="flex-1 px-4 md:px-8 py-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground">FTC League Selection</h1>
                <p className="text-muted-foreground text-sm">Administrative controls and registration management</p>
              </div>
              <div className="flex items-center gap-2">
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
            </div>

            {/* KPI cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardHeader>
                  <CardTitle>Total Teams</CardTitle>
                  <CardDescription>Registered teams</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{uniqueTeams}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Active Events</CardTitle>
                  <CardDescription>Events with open slots</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{activeSlots.length}</div>
                </CardContent>
              </Card>
              {/* <Card>
                <CardHeader>
                  <CardTitle>Total Registered vs Total Capacity</CardTitle>
                  <CardDescription>
                    {totalRegistered}/{totalCapacity}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{utilization}%</div>
                </CardContent>
              </Card> */}
              {/* <Card>
                <CardHeader>
                  <CardTitle>Championships</CardTitle>
                  <CardDescription>Unique championship venues</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{new Set((timeSlots ?? []).filter(s=>s.venueType==="championship").map(s=>String(s.venueId))).size}</div>
                </CardContent>
              </Card> */}
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
                          className={`border-2 rounded-xl p-5 transition-all ${slot.isAvailable ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"
                            } ${slot.isActive ? "opacity-100" : "opacity-60"}`}
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
                                className={`h-3 rounded-full transition-all ${slot.isAvailable ? "bg-green-500" : "bg-red-500"
                                  }`}
                                style={{ width: `${(slot.currentCount / slot.capacity) * 100}%` }}
                              ></div>
                            </div>
                            {!slot.isActive && (
                              <div className="text-xs text-slate-500">Inactive</div>
                            )}
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
                            onSave={async ({ name, location, date, address, capacityAllSlots }) => {
                              setErrorByVenue((prev) => ({ ...prev, [id]: null }));
                              setSavingByVenue((prev) => ({ ...prev, [id]: true }));
                              try {
                                await setVenueDetails({ venueId: venue._id, name, location, date, address });
                                if (typeof capacityAllSlots === "number") {
                                  await setVenueCapacityAll({ venueId: venue._id as Id<"venues">, capacity: capacityAllSlots });
                                }
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
                      onCreate={async ({ venueName, address, location, satDate, sunDate, capacity }) => {
                        const existing = (venues ?? []).find((v) => v.name.trim() === venueName.trim());
                        let venueId: Id<"venues">;
                        if (existing) {
                          venueId = existing._id as Id<"venues">;
                          const patch: { address?: string; location?: string } = {};
                          if (address && (existing as { address?: string }).address !== address) patch.address = address;
                          if (location && (existing as { location?: string }).location !== location) patch.location = location;
                          if (Object.keys(patch).length) await setVenueDetails({ venueId, ...patch });
                        } else {
                          const created = await createVenueSimple({ name: venueName, address, type: "regular" });
                          venueId = created._id as Id<"venues">;
                          if (address || location) {
                            await setVenueDetails({ venueId, ...(address ? { address } : {}), ...(location ? { location } : {}) });
                          }
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
                        onCreate={async ({ venueName, address, location, day, date, capacity }) => {
                          const existing = (venues ?? []).find((v) => v.name.trim() === venueName.trim());
                          let venueId: Id<"venues">;
                          if (existing) {
                            venueId = existing._id as Id<"venues">;
                            const patch: { address?: string; location?: string } = {};
                            if (address && (existing as { address?: string }).address !== address) patch.address = address;
                            if (location && (existing as { location?: string }).location !== location) patch.location = location;
                            if (Object.keys(patch).length) await setVenueDetails({ venueId, ...patch });
                          } else {
                            const created = await createVenueSimple({ name: venueName, address, type: "championship" });
                            venueId = created._id as Id<"venues">;
                            if (address || location) {
                              await setVenueDetails({ venueId, ...(address ? { address } : {}), ...(location ? { location } : {}) });
                            }
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
                              <span className="flex-1" />
                              <button
                                onClick={async () => {
                                  const ok = window.confirm(`Delete the event "${v.name}" and all of its empty time slots? This cannot be undone.`);
                                  if (!ok) return;
                                  try {
                                    await deleteVenue({ id: v._id as Id<"venues"> });
                                    router.refresh();
                                  } catch (e: unknown) {
                                    alert(e instanceof Error ? e.message : "Failed to delete event");
                                  }
                                }}
                                className="px-2 py-1 rounded-md border text-xs border-red-300 text-red-700 hover:bg-red-50"
                              >
                                Delete Event
                              </button>
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
                                  onDelete={async (id) => {
                                    await deleteTimeSlot({ id });
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
                                  onDelete={async (id) => {
                                    await deleteTimeSlot({ id });
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
                                      <div className="flex items-center gap-2">
                                        <button
                                          onClick={async () => {
                                            await setTimeSlotActive({ id: s._id, isActive: !s.isActive });
                                            router.refresh();
                                          }}
                                          className={`px-2 py-1 rounded-md border text-xs ${s.isActive ? "border-amber-300 text-amber-700 hover:bg-amber-50" : "border-green-300 text-green-700 hover:bg-green-50"}`}
                                        >
                                          {s.isActive ? "Deactivate" : "Activate"}
                                        </button>
                                        {!s.isActive && (
                                          <button
                                            onClick={async () => {
                                              await deleteTimeSlot({ id: s._id });
                                              router.refresh();
                                            }}
                                            className="px-2 py-1 rounded-md border text-xs border-red-300 text-red-700 hover:bg-red-50"
                                          >
                                            Delete
                                          </button>
                                        )}
                                      </div>
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
                    <CsvTable
                      registrations={registrations}
                      onDeleteTeam={async (teamNumber) => {
                        const ok = window.confirm(`Delete all registrations for team ${teamNumber}?`);
                        if (!ok) return;
                        try {
                          await removeRegistrationsByTeam({ teamNumber });
                          router.refresh();
                        } catch (e: unknown) {
                          alert(e instanceof Error ? e.message : "Failed to delete registrations");
                        }
                      }}
                    />
                  </div>
                ),
              },
            ]}
            initialId="capacity"
            activeId={section}
            onChange={(id) => setSection(id as AdminSection)}
            hideHeader
          />
          </div>
        </div>
      </div>
    </main>
  );
}

function AddEventForm({
  onCreate,
}: {
  onCreate: (payload: { venueName: string; address?: string; location?: string; day: string; date?: string; capacity: number }) => Promise<void>;
}) {
  const [venueName, setVenueName] = useState("");
  const [address, setAddress] = useState("");
  const [location, setLocation] = useState("");
  const [day, setDay] = useState("Day 1");
  const [date, setDate] = useState("");
  const [capacity, setCapacity] = useState<number>(36);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4">
      <div className="font-semibold text-slate-900 mb-3">Add New Championship Event</div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
        <label className="text-sm">
          <span className="block text-slate-700 mb-1">Event name</span>
          <input
            value={venueName}
            onChange={(e) => setVenueName(e.target.value)}
            placeholder="Central High School"
            className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm"
          />
        </label>

        <label className="text-sm">
          <span className="block text-slate-700 mb-1">Address</span>
          <input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="123 Main St, City, ST"
            className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm"
          />
        </label>

        <label className="text-sm">
          <span className="block text-slate-700 mb-1">Event Location</span>
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Central High School, San Diego, CA"
            className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm"
          />
        </label>

        {/* <label className="text-sm">
          <span className="block text-slate-700 mb-1">Day label</span>
          <input
            value={day}
            onChange={(e) => setDay(e.target.value)}
            placeholder="Day 1"
            className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm"
          />
        </label> */}

        <label className="text-sm">
          <span className="block text-slate-700 mb-1">Date</span>
          <input
            value={date}
            onChange={(e) => setDate(e.target.value)}
            type="date"
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
                await onCreate({ venueName: venueName.trim(), address: address.trim() || undefined, location: location.trim() || undefined, day, date: date || undefined, capacity });
                setVenueName("");
                setAddress("");
                setLocation("");
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
  onCreate: (payload: { venueName: string; address?: string; location?: string; satDate?: string; sunDate?: string; capacity: number }) => Promise<void>;
}) {
  const [venueName, setVenueName] = useState("");
  const [address, setAddress] = useState("");
  const [location, setLocation] = useState("");
  const [satDate, setSatDate] = useState("");
  const [sunDate, setSunDate] = useState("");
  const [capacity, setCapacity] = useState<number>(36);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4">
      <div className="font-semibold text-slate-900 mb-3">Add New League Meet</div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
        <label className="text-sm">
          <span className="block text-slate-700 mb-1">Event Name</span>
          <input
            value={venueName}
            onChange={(e) => setVenueName(e.target.value)}
            placeholder="Central High School"
            className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm"
          />
        </label>
        <label className="text-sm">
          <span className="block text-slate-700 mb-1">Address</span>
          <input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="123 Main St, City, ST"
            className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm"
          />
        </label>
        <label className="text-sm">
          <span className="block text-slate-700 mb-1">Event Location</span>
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Central High School, San Diego, CA"
            className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm"
          />
        </label>
        <label className="text-sm">
          <span className="block text-slate-700 mb-1">Saturday Date</span>
          <input
            value={satDate}
            onChange={(e) => setSatDate(e.target.value)}
            type="date"
            className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm"
          />
        </label>
        <label className="text-sm">
          <span className="block text-slate-700 mb-1">Sunday Date</span>
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
                await onCreate({ venueName: venueName.trim(), address: address.trim() || undefined, location: location.trim() || undefined, satDate: satDate || undefined, sunDate: sunDate || undefined, capacity });
                setVenueName("");
                setAddress("");
                setLocation("");
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
  onDelete,
}: {
  label: string;
  slot: AvailableSlot | null;
  onToggle: (id: Id<"timeSlots">, currentActive: boolean) => Promise<void>;
  onCreate: (payload: { date?: string; capacity: number }) => Promise<void>;
  onDelete: (id: Id<"timeSlots">) => Promise<void>;
}) {
  const [date, setDate] = useState("");
  const [capacity, setCapacity] = useState<number>(36);
  const [expanded, setExpanded] = useState(false);
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
          <div className="flex items-center gap-2">
            <button
              onClick={() => onToggle(slot._id, slot.isActive)}
              className={`px-2 py-1 rounded-md border text-xs ${slot.isActive ? "border-amber-300 text-amber-700 hover:bg-amber-50" : "border-green-300 text-green-700 hover:bg-green-50"}`}
            >
              {slot.isActive ? "Deactivate" : "Activate"}
            </button>
            {!slot.isActive && (
              <button
                onClick={() => onDelete(slot._id)}
                className="px-2 py-1 rounded-md border text-xs border-red-300 text-red-700 hover:bg-red-50"
              >
                Delete
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {!expanded ? (
            <div className="flex items-center justify-between text-sm text-slate-500">
              <span>No {label} slot</span>
              <button
                onClick={() => setExpanded(true)}
                className="px-2 py-1 rounded-md border text-xs border-blue-300 text-blue-700 hover:bg-blue-50"
              >
                Create {label}
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-2 items-end">
              <div className="flex flex-row"><input
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
                /></div>
              <div className="flex flex-row">
                <button
                  onClick={async () => {
                    await onCreate({ date: date || undefined, capacity });
                    setExpanded(false);
                    setDate("");
                    setCapacity(36);
                  }}
                  className="px-2 py-1 rounded-md border text-xs border-blue-300 text-blue-700 hover:bg-blue-50"
                >
                  Create
                </button>
                <button
                  onClick={() => {
                    setExpanded(false);
                    setDate("");
                    setCapacity(36);
                  }}
                  className="px-2 py-1 rounded-md border text-xs border-slate-300 text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
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
