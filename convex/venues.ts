import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Get all venues
export const get = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("venues")
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();
  },
});

// Get venue by ID
export const getById = query({
  args: {
    id: v.id("venues"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Update venue details: location and/or date
export const setDetails = mutation({
  args: {
    venueId: v.id("venues"),
    name: v.optional(v.string()),
    location: v.optional(v.string()),
    date: v.optional(v.string()),
    address: v.optional(v.string()),
  },
  handler: async (ctx, { venueId, name, location, date, address }) => {
    const venue = await ctx.db.get(venueId);
    if (!venue) throw new Error("Venue not found");
    const patch: any = {};
    if (typeof name !== "undefined") patch.name = name;
    if (typeof location !== "undefined") patch.location = location;
    if (typeof date !== "undefined") patch.date = date;
    if (typeof address !== "undefined") patch.address = address;
    await ctx.db.patch(venueId, patch);
    return { message: "Venue updated" };
  },
});

// Create a new venue with minimal fields (admin helper)
export const createSimple = mutation({
  args: {
    name: v.string(),
    address: v.optional(v.string()),
    location: v.optional(v.string()),
    date: v.optional(v.string()),
    type: v.optional(v.union(v.literal("regular"), v.literal("championship"), v.literal("meet1"))),
    leagueId: v.optional(v.id("venues")),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, { name, address, location, date, type, leagueId, isActive }) => {
    // Naive check for existing by name to avoid accidental dupes
    const existing = await ctx.db
      .query("venues")
      .filter((q) => q.eq(q.field("name"), name))
      .first();
    if (existing) {
      return { _id: existing._id };
    }
    const id = await ctx.db.insert("venues", {
      name,
      type: type ?? "regular",
      isActive: typeof isActive === "boolean" ? isActive : true,
      address,
      location,
      date,
      leagueId,
    } as any);
    return { _id: id };
  },
});

// Permanently delete a venue and its empty time slots (admin)
export const remove = mutation({
  args: {
    id: v.id("venues"),
  },
  handler: async (ctx, { id }) => {
    const venue = await ctx.db.get(id);
    if (!venue) throw new Error("Venue not found");

    const linkedMeet1 = await ctx.db
      .query("venues")
      .filter((q) => q.eq(q.field("leagueId"), id))
      .first();
    if (linkedMeet1) throw new Error(`Delete "${linkedMeet1.name}" first; it is this league's Meet 1.`);

    // Collect all time slots for this venue
    const slots = await ctx.db
      .query("timeSlots")
      .withIndex("by_venue", (q) => q.eq("venueId", id))
      .collect();

    // If any slot has registrations, block deletion
    for (const slot of slots) {
      const regs = await ctx.db
        .query("registrations")
        .withIndex("by_time_slot", (q) => q.eq("timeSlotId", slot._id))
        .first();
      if (regs) {
        throw new Error("Cannot delete an event with existing registrations. Deactivate slots or clear registrations first.");
      }
    }

    // Delete capacity tracking and slots
    for (const slot of slots) {
      const caps = await ctx.db
        .query("capacityTracking")
        .withIndex("by_time_slot", (q) => q.eq("timeSlotId", slot._id))
        .collect();
      for (const c of caps) {
        await ctx.db.delete(c._id);
      }
      await ctx.db.delete(slot._id);
    }

    // Finally delete the venue
    await ctx.db.delete(id);
    return { message: "Venue deleted" };
  },
});
