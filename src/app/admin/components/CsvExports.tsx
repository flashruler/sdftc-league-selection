"use client";

import { useMemo } from "react";

export type RegistrationRow = {
  _id: string;
  teamNumber: string;
  venueName?: string;
  venueType?: string;
  day?: string;
  registrationDate: number;
};

export function CsvTable({ registrations }: { registrations: RegistrationRow[] | undefined }) {
  const rows = useMemo(() => buildCsvRows(registrations), [registrations]);
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-slate-200">
            <th className="text-left py-4 px-4 font-semibold text-slate-700">Team Number</th>
            <th className="text-left py-4 px-4 font-semibold text-slate-700">League</th>
            <th className="text-left py-4 px-4 font-semibold text-slate-700">Venue 1 Day</th>
            <th className="text-left py-4 px-4 font-semibold text-slate-700">Venue 2 Day</th>
            <th className="text-left py-4 px-4 font-semibold text-slate-700">Venue 3 Day</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.teamNumber} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
              <td className="py-4 px-4 font-medium text-slate-900">{r.teamNumber}</td>
              <td className="py-4 px-4 text-slate-700">{r.league}</td>
              <td className="py-4 px-4 text-slate-700">{r.venue1}</td>
              <td className="py-4 px-4 text-slate-700">{r.venue2}</td>
              <td className="py-4 px-4 text-slate-700">{r.venue3}</td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={5} className="py-8 px-4 text-center text-slate-500">
                No registrations found
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export function ExportCsvButton({ registrations }: { registrations: RegistrationRow[] | undefined }) {
  const rows = useMemo(() => buildCsvRows(registrations), [registrations]);
  const onExport = () => {
    const header = ["Team Number", "League", "Venue 1 Day", "Venue 2 Day", "Venue 3 Day"];
    const lines = [header.join(",")];
    for (const r of rows) {
      const row = [r.teamNumber, r.league, r.venue1, r.venue2, r.venue3].map((v) => csvSafe(v));
      lines.push(row.join(","));
    }
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const date = new Date();
    const ts = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    a.download = `registrations-${ts}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  return (
    <button
      onClick={onExport}
      className="px-4 py-2 bg-purple-600 text-white rounded-md text-sm hover:bg-purple-700 disabled:opacity-50"
      disabled={!registrations || registrations.length === 0}
    >
      Export CSV
    </button>
  );
}

function buildCsvRows(registrations: RegistrationRow[] | undefined) {
  if (!registrations || registrations.length === 0) return [] as Array<{ teamNumber: string; league: string; venue1: string; venue2: string; venue3: string }>;

  // Determine the three regular venues sorted by name to map into columns 1-3
  const regularVenueNames = Array.from(
    new Set(
      registrations.filter((r) => r.venueType === "regular").map((r) => r.venueName || "")
    )
  )
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b));

  const byTeam = new Map<
    string,
    { league: string; regular: Record<string, string> }
  >();

  for (const r of registrations) {
    const t = r.teamNumber;
    const entry = byTeam.get(t) || { league: "", regular: {} };
    if (r.venueType === "championship") {
      entry.league = r.venueName || "";
    } else if (r.venueType === "regular") {
      const venue = r.venueName || "";
      if (venue && r.day) entry.regular[venue] = r.day;
    }
    byTeam.set(t, entry);
  }

  // Guarantee three columns: map by the first three discovered venue names or blanks
  const firstThree = [regularVenueNames[0], regularVenueNames[1], regularVenueNames[2]];

  const rows: Array<{ teamNumber: string; league: string; venue1: string; venue2: string; venue3: string }> = [];
  for (const [teamNumber, { league, regular }] of byTeam.entries()) {
    const venue1 = (firstThree[0] && regular[firstThree[0]]) || "";
    const venue2 = (firstThree[1] && regular[firstThree[1]]) || "";
    const venue3 = (firstThree[2] && regular[firstThree[2]]) || "";
    rows.push({ teamNumber, league, venue1, venue2, venue3 });
  }

  // Sort rows by team number ascending numeric-ish
  rows.sort((a, b) => (parseInt(a.teamNumber) || 0) - (parseInt(b.teamNumber) || 0));
  return rows;
}

function csvSafe(v: string) {
  const s = v ?? "";
  if (s.includes(",") || s.includes("\n") || s.includes('"')) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}
