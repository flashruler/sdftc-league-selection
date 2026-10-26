import type { QueryCtx } from "../_generated/server";
import type { Id } from "../_generated/dataModel";

export const DAYS = ["saturday", "sunday"] as const;
export type Day = (typeof DAYS)[number];

// Slot day labels vary ("Saturday", "Sat", older "Day 1"/"Day 2"); map them to a Day key.
export function dayKey(day?: string): string {
  const d = (day || "").toLowerCase().trim();
  if (d.startsWith("sun") || d === "day 2" || d === "2") return "sunday";
  if (d.startsWith("sat") || d === "day 1" || d === "1") return "saturday";
  return d;
}

export type ScheduleEvent = {
  title: string;
  location?: string;
  address?: string;
  date?: string;
  slotId: Id<"timeSlots">;
  spotsRemaining: number;
  capacity: number;
};

// unavailable: why a team can't pick this day right now (closed, full, or not set up)
export type DaySchedule = { events: ScheduleEvent[]; unavailable?: string };

// A day's schedule = that day's slot at every active league event (Meet 1 … League Tournament).
export async function loadSchedules(ctx: QueryCtx): Promise<Record<Day, DaySchedule>> {
  const venues = (await ctx.db.query("venues").collect()).filter((v) => v.isActive && v.type === "regular");
  const result: Record<Day, DaySchedule> = { saturday: { events: [] }, sunday: { events: [] } };
  if (venues.length === 0) {
    for (const day of DAYS) result[day].unavailable = "No events have been set up yet.";
    return result;
  }

  for (const venue of venues) {
    const slots = await ctx.db
      .query("timeSlots")
      .withIndex("by_venue", (q) => q.eq("venueId", venue._id))
      .collect();
    for (const day of DAYS) {
      const slot = slots.find((s) => s.isActive && dayKey(s.day) === day);
      if (!slot) {
        result[day].unavailable ??= "Signups for this day are closed.";
        continue;
      }
      const count = (
        await ctx.db
          .query("registrations")
          .withIndex("by_time_slot", (q) => q.eq("timeSlotId", slot._id))
          .collect()
      ).length;
      if (count >= slot.capacity) result[day].unavailable ??= "This day is full.";
      result[day].events.push({
        title: venue.name,
        location: venue.location || undefined,
        address: venue.address || undefined,
        date: slot.date || venue.date,
        slotId: slot._id,
        spotsRemaining: slot.capacity - count,
        capacity: slot.capacity,
      });
    }
  }
  for (const day of DAYS) result[day].events.sort((a, b) => (a.date ?? "").localeCompare(b.date ?? ""));
  return result;
}
