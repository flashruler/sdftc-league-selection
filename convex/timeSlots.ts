import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Get all time slots with availability info
export const getAvailable = query({
  args: {},
  handler: async (ctx) => {
    const timeSlots = await ctx.db
      .query("timeSlots")
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    const result = [];
    
    for (const slot of timeSlots) {
      const venue = await ctx.db.get(slot.venueId);
      const capacity = await ctx.db
        .query("capacityTracking")
        .withIndex("by_time_slot", (q) => q.eq("timeSlotId", slot._id))
        .first();

      if (venue) {
        result.push({
          ...slot,
          venueName: venue.name,
          venueType: venue.type,
          currentCount: capacity?.currentCount || 0,
          spotsRemaining: slot.capacity - (capacity?.currentCount || 0),
          isAvailable: (capacity?.currentCount || 0) < slot.capacity,
        });
      }
    }

    // Sort by venue type (regular venues first, then championship)
    // and then by venue name and day
    return result.sort((a, b) => {
      if (a.venueType !== b.venueType) {
        return a.venueType === "regular" ? -1 : 1;
      }
      if (a.venueName !== b.venueName) {
        return a.venueName.localeCompare(b.venueName);
      }
      return a.day.localeCompare(b.day);
    });
  },
});

// Get time slots for a specific venue
export const getByVenue = query({
  args: {
    venueId: v.id("venues"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("timeSlots")
      .withIndex("by_venue", (q) => q.eq("venueId", args.venueId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();
  },
});

// Get specific time slot with capacity info
export const getById = query({
  args: {
    id: v.id("timeSlots"),
  },
  handler: async (ctx, args) => {
    const timeSlot = await ctx.db.get(args.id);
    if (!timeSlot) return null;

    const venue = await ctx.db.get(timeSlot.venueId);
    const capacity = await ctx.db
      .query("capacityTracking")
      .withIndex("by_time_slot", (q) => q.eq("timeSlotId", args.id))
      .first();

    return {
      ...timeSlot,
      venueName: venue?.name,
      venueType: venue?.type,
      currentCount: capacity?.currentCount || 0,
      spotsRemaining: timeSlot.capacity - (capacity?.currentCount || 0),
      isAvailable: (capacity?.currentCount || 0) < timeSlot.capacity,
    };
  },
});
