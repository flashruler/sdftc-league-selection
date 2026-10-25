"use client";

import { useMemo } from "react";
import { dayKey } from "../../../../convex/lib/schedule";

export type RegistrationRow = {
  _id: string;
  teamNumber: string;
  venueName?: string;
  venueType?: string;
  day?: string;
  email?: string;
  registrationDate: number;
};

export function CsvTable({ registrations, onDeleteTeam }: { registrations: RegistrationRow[] | undefined; onDeleteTeam?: (teamNumber: string) => void }) {
  const rows = useMemo(() => buildCsvRows(registrations), [registrations]);
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-slate-200">
            <th className="text-left py-4 px-4 font-semibold text-slate-700">Submitted</th>
            <th className="text-left py-4 px-4 font-semibold text-slate-700">Team Number</th>
            <th className="text-left py-4 px-4 font-semibold text-slate-700">Day</th>
            <th className="text-left py-4 px-4 font-semibold text-slate-700">Email</th>
            {onDeleteTeam && <th className="text-left py-4 px-4 font-semibold text-slate-700">Actions</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.teamNumber} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
              <td className="py-4 px-4 text-slate-600 whitespace-nowrap">{r.submitted}</td>
              <td className="py-4 px-4 font-medium text-slate-900">{r.teamNumber}</td>
              <td className="py-4 px-4 text-slate-700">{r.day}</td>
              <td className="py-4 px-4 text-slate-700">{r.email}</td>
              {onDeleteTeam && (
                <td className="py-4 px-4 text-slate-700">
                  <button
                    onClick={() => onDeleteTeam(r.teamNumber)}
                    className="px-2 py-1 rounded-md border text-xs border-red-300 text-red-700 hover:bg-red-50"
                  >
                    Delete
                  </button>
                </td>
              )}
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={onDeleteTeam ? 5 : 4} className="py-8 px-4 text-center text-slate-500">
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
    const header = ["Submitted", "Team Number", "Day", "Email"];
    const lines = [header.join(",")];
    for (const r of rows) {
      const row = [r.submitted, r.teamNumber, r.day, r.email].map((v) => csvSafe(v));
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

type CsvRow = { submitted: string; teamNumber: string; day: string; email: string };

// One row per team. A team's day comes from its league-event (regular venue) registrations.
export function buildCsvRows(registrations: RegistrationRow[] | undefined): CsvRow[] {
  if (!registrations || registrations.length === 0) return [];

  const byTeam = new Map<string, { day: string; email: string; submittedAt: number | null }>();

  // Pacific time formatter (no seconds). Removed zone signifier.
  const pacificFmt = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Los_Angeles",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  for (const r of registrations) {
    const entry = byTeam.get(r.teamNumber) || { day: "", email: "", submittedAt: null };
    // Track earliest registrationDate for this team
    if (typeof r.registrationDate === "number") {
      entry.submittedAt = entry.submittedAt === null ? r.registrationDate : Math.min(entry.submittedAt, r.registrationDate);
    }
    const key = dayKey(r.day);
    if (r.venueType === "regular" && (key === "saturday" || key === "sunday")) entry.day = key === "saturday" ? "Saturday" : "Sunday";
    if (r.email) entry.email = r.email;
    byTeam.set(r.teamNumber, entry);
  }

  const rows: CsvRow[] = [];
  for (const [teamNumber, { day, email, submittedAt }] of byTeam.entries()) {
    const submitted = submittedAt ? pacificFmt.format(new Date(submittedAt)) : "";
    rows.push({ submitted, teamNumber, day, email });
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
