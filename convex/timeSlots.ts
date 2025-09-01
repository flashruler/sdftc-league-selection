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
      // Compute currentCount from registrations for real-time accuracy
      const regs = await ctx.db
        .query("registrations")
        .withIndex("by_time_slot", (q) => q.eq("timeSlotId", slot._id))
        .collect();

    if (venue) {
        result.push({
          ...slot,
          venueName: venue.name,
      venueLocation: (venue as any).location,
      venueDate: (venue as any).date,
          venueAddress: (venue as any).address,
          venueType: venue.type,
          currentCount: regs.length,
          spotsRemaining: slot.capacity - regs.length,
          isAvailable: regs.length < slot.capacity,
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

// Admin: Get all time slots (active and inactive) with availability info
export const getAllForAdmin = query({
  args: {},
  handler: async (ctx) => {
    const timeSlots = await ctx.db.query("timeSlots").collect();

    const result: any[] = [];
    for (const slot of timeSlots) {
      const venue = await ctx.db.get(slot.venueId);
      if (!venue) continue;
      const regs = await ctx.db
        .query("registrations")
        .withIndex("by_time_slot", (q) => q.eq("timeSlotId", slot._id))
        .collect();
      result.push({
        ...slot,
        venueName: venue.name,
        venueType: venue.type,
        currentCount: regs.length,
        spotsRemaining: slot.capacity - regs.length,
        isAvailable: regs.length < slot.capacity,
      });
    }
    return result.sort((a, b) => {
      if (a.venueType !== b.venueType) return a.venueType === "regular" ? -1 : 1;
      if (a.venueName !== b.venueName) return a.venueName.localeCompare(b.venueName);
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
    const regs = await ctx.db
      .query("registrations")
      .withIndex("by_time_slot", (q) => q.eq("timeSlotId", args.id))
      .collect();

    return {
      ...timeSlot,
      venueName: venue?.name,
  venueLocation: (venue as any)?.location,
  venueDate: (venue as any)?.date,
  venueAddress: (venue as any)?.address,
      venueType: venue?.type,
      currentCount: regs.length,
      spotsRemaining: timeSlot.capacity - regs.length,
      isAvailable: regs.length < timeSlot.capacity,
    };
  },
});

// Create a new time slot (admin)
export const create = mutation({
  args: {
    venueId: v.id("venues"),
    day: v.string(),
    date: v.optional(v.string()),
    capacity: v.number(),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, { venueId, day, date, capacity, isActive }) => {
    const venue = await ctx.db.get(venueId);
    if (!venue) throw new Error("Venue not found");
    if (capacity <= 0) throw new Error("Capacity must be greater than 0");
    const timeSlotId = await ctx.db.insert("timeSlots", {
      venueId,
      day,
      date,
      capacity,
      isActive: typeof isActive === "boolean" ? isActive : true,
    });
    return { _id: timeSlotId };
  },
});

// Update a time slot (admin)
export const update = mutation({
  args: {
    id: v.id("timeSlots"),
    day: v.optional(v.string()),
    date: v.optional(v.string()),
    capacity: v.optional(v.number()),
  },
  handler: async (ctx, { id, day, date, capacity }) => {
    const existing = await ctx.db.get(id);
    if (!existing) throw new Error("Time slot not found");
    const patch: any = {};
    if (typeof day !== "undefined") patch.day = day;
    if (typeof date !== "undefined") patch.date = date;
    if (typeof capacity !== "undefined") {
      if (capacity <= 0) throw new Error("Capacity must be greater than 0");
      patch.capacity = capacity;
    }
    await ctx.db.patch(id, patch);
    return { message: "Updated" };
  },
});

// Toggle active status (admin)
export const setActive = mutation({
  args: {
    id: v.id("timeSlots"),
    isActive: v.boolean(),
  },
  handler: async (ctx, { id, isActive }) => {
    const existing = await ctx.db.get(id);
    if (!existing) throw new Error("Time slot not found");
    await ctx.db.patch(id, { isActive });
    return { message: isActive ? "Activated" : "Deactivated" };
  },
});

// Permanently delete a time slot (admin)
export const remove = mutation({
  args: {
    id: v.id("timeSlots"),
  },
  handler: async (ctx, { id }) => {
    const existing = await ctx.db.get(id);
    if (!existing) throw new Error("Time slot not found");

    // Block deletion if there are registrations
    const regs = await ctx.db
      .query("registrations")
      .withIndex("by_time_slot", (q) => q.eq("timeSlotId", id))
      .collect();
    if (regs.length > 0) {
      throw new Error("Cannot delete a time slot that has registrations. Deactivate instead.");
    }

    // Remove capacity tracking rows if present
    const caps = await ctx.db
      .query("capacityTracking")
      .withIndex("by_time_slot", (q) => q.eq("timeSlotId", id))
      .collect();
    for (const c of caps) {
      await ctx.db.delete(c._id);
    }

    await ctx.db.delete(id);
    return { message: "Deleted" };
  },
});
