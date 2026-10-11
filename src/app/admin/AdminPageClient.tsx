"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { EventsTab, VenueDetailsTab } from "./components/LeagueSetup";
import { CsvTable, ExportCsvButton } from "./components/CsvExports";
import { Tabs } from "./components/Tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminSidebar, type AdminSection } from "./components/AdminSidebar";

export default function AdminPageClient() {
  const router = useRouter();
  const registrations = useQuery(api.registrations.getAll);
  const timeSlots = useQuery(api.timeSlots.getAllForAdmin);
  const venues = useQuery(api.venues.get);
  const removeRegistrationsByTeam = useMutation(api.registrations.removeByTeam);

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
                content: <VenueDetailsTab venues={venues ?? []} slots={timeSlots ?? []} onGoToEvents={() => setSection("events")} />,
              },
              {
                id: "events",
                label: "Events",
                content: <EventsTab venues={venues ?? []} slots={timeSlots ?? []} onEditDetails={() => setSection("venues")} />,
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
