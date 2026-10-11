"use client";

import { CheckCircle2, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { parseLocalDate } from "@/lib/utils";
import { leagueTheme } from "./LeagueEvents";

export type RegistrationSummary = {
  teamNumber: string;
  league: string;
  email: string;
  events: { title: string; location?: string; date?: string; day?: string }[];
};

export function ConfirmationDialog({ summary, onClose }: { summary: RegistrationSummary | null; onClose: () => void }) {
  return (
    <Dialog open={summary !== null} onOpenChange={(open) => !open && onClose()}>
      {summary && (
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="items-center text-center sm:text-center">
            <CheckCircle2 className="size-12 text-green-600" aria-hidden="true" />
            <DialogTitle className="text-2xl">You&apos;re registered!</DialogTitle>
            <DialogDescription>
              Team {summary.teamNumber}&apos;s selections are saved. A copy was sent to{" "}
              <span className="font-medium text-slate-700">{summary.email}</span>.
            </DialogDescription>
          </DialogHeader>

          <LeagueRow name={summary.league} />

          <ol className="divide-y divide-slate-100 rounded-lg border border-slate-200">
            {summary.events.map((e) => (
              <EventRow key={e.title} {...e} />
            ))}
          </ol>

          <DialogFooter>
            <Button className="w-full" onClick={onClose}>
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      )}
    </Dialog>
  );
}

function LeagueRow({ name }: { name: string }) {
  const { Icon, tile } = leagueTheme(name);
  return (
    <div className="flex items-center gap-3 rounded-lg bg-slate-50 p-3">
      <div className={`size-10 shrink-0 rounded-lg ${tile} text-white flex items-center justify-center`}>
        <Icon className="size-5" aria-hidden="true" />
      </div>
      <div>
        <div className="text-xs text-slate-500">League</div>
        <div className="font-semibold text-slate-900">{name}</div>
      </div>
    </div>
  );
}

function EventRow({ title, location, date, day }: RegistrationSummary["events"][number]) {
  const d = parseLocalDate(date);
  return (
    <li className="flex items-center gap-4 p-3">
      <div className="w-12 shrink-0 text-center">
        {d ? (
          <>
            <div className="text-[11px] font-semibold uppercase text-slate-500">
              {d.toLocaleDateString(undefined, { month: "short" })}
            </div>
            <div className="text-xl font-bold leading-none text-slate-900">{d.getDate()}</div>
          </>
        ) : (
          <div className="text-xs text-slate-500">TBD</div>
        )}
      </div>
      <div className="min-w-0">
        <div className="font-medium text-slate-900">{title}</div>
        <div className="text-sm text-slate-500">{d ? d.toLocaleDateString(undefined, { weekday: "long" }) : day ?? "Date to be announced"}</div>
        {location && (
          <div className="flex items-center gap-1 text-sm text-slate-500">
            <MapPin className="size-3.5 shrink-0" aria-hidden="true" />
            <span className="truncate">{location}</span>
          </div>
        )}
      </div>
    </li>
  );
}
