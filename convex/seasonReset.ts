import { internalMutation } from "./_generated/server";
import { v } from "convex/values";

// Start a new season: wipe registrations, and optionally all events (venues + time slots).
// Settings are kept. Internal only, so it can only be run from the CLI or dashboard:
//   npx convex run --prod seasonReset:clearSeason '{"includeEvents": false}'
// ponytail: deletes everything in one transaction; fine for a few thousand rows, batch it if a season ever gets bigger.
export const clearSeason = internalMutation({
  args: { includeEvents: v.boolean() },
  handler: async (ctx, { includeEvents }) => {
    const tables = includeEvents
      ? (["registrations", "capacityTracking", "timeSlots", "venues"] as const)
      : (["registrations", "capacityTracking"] as const);
    const deleted: Record<string, number> = {};
    for (const table of tables) {
      const docs = await ctx.db.query(table).collect();
      for (const doc of docs) await ctx.db.delete(doc._id);
      deleted[table] = docs.length;
    }
    return deleted;
  },
});
