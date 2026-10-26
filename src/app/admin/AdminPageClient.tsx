"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { EventsTab, VenueDetailsTab } from "./components/LeagueSetup";
import { CsvTable, ExportCsvButton, buildCsvRows } from "./components/CsvExports";
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

  const [section, setSection] = useState<AdminSection>("registrations");

  // KPI metrics
  const uniqueTeams = new Set((registrations ?? []).map((r) => r.teamNumber)).size;
  const activeSlots = (timeSlots ?? []).filter((s) => s.isActive);
  const teamRows = buildCsvRows(registrations);
  const dayCount = (day: string) => teamRows.filter((r) => r.day === day).length;

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-[1400px]">
        <div className="flex min-h-screen">
          <AdminSidebar active={section} onChange={setSection} />
          <div className="flex-1 px-4 md:px-8 py-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground">FTC Event Selection</h1>
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
              <Card>
                <CardHeader>
                  <CardTitle>Saturday Teams</CardTitle>
                  <CardDescription>Teams on the Saturday schedule</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{dayCount("Saturday")}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Sunday Teams</CardTitle>
                  <CardDescription>Teams on the Sunday schedule</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{dayCount("Sunday")}</div>
                </CardContent>
              </Card>
            </div>
            <Tabs
            items={[
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
                          <p className="text-slate-600">Team Number, Day (Saturday or Sunday), Email</p>
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
              {
                id: "venues",
                label: "Venue Details",
                content: <VenueDetailsTab venues={venues ?? []} slots={timeSlots ?? []} />,
              },
              {
                id: "events",
                label: "Events",
                content: <EventsTab venues={venues ?? []} slots={timeSlots ?? []} onEditDetails={() => setSection("venues")} />,
              },
            ]}
            initialId="registrations"
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
