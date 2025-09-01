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

// Create initial venue setup
export const setup = mutation({
  args: {},
  handler: async (ctx) => {
    // Check if venues already exist
    const existingVenues = await ctx.db.query("venues").collect();
    if (existingVenues.length > 0) {
      throw new Error("Venues already set up");
    }

    // Initialize settings first
    const settings = [
      {
        key: "registration_open",
        value: true,
        description: "Whether registration is currently open",
      },
      {
        key: "registration_deadline",
        value: Date.now() + (30 * 24 * 60 * 60 * 1000), // 30 days from now
        description: "Registration deadline timestamp",
      },
    ];

    for (const setting of settings) {
      const existing = await ctx.db
        .query("settings")
        .withIndex("by_key", (q) => q.eq("key", setting.key))
        .first();

      if (!existing) {
        await ctx.db.insert("settings", setting);
      }
    }

    // Create venues
    const venue1 = await ctx.db.insert("venues", {
      name: "Venue 1",
      type: "regular",
      isActive: true,
    });

    const venue2 = await ctx.db.insert("venues", {
      name: "Venue 2", 
      type: "regular",
      isActive: true,
    });

    const venue3 = await ctx.db.insert("venues", {
      name: "Venue 3",
      type: "regular",
      isActive: true,
    });

    // Create four separate championship venues
    const championshipNames = ["Descartes", "Euclid", "Gauss", "Turing"] as const;
    const championshipVenueIds: string[] = [];
    for (const name of championshipNames) {
      const id = await ctx.db.insert("venues", {
        name,
        type: "championship",
        isActive: true,
      });
      championshipVenueIds.push(id as unknown as string);
    }

    // Create time slots for regular venues (36 capacity each day)
    for (const venueId of [venue1, venue2, venue3]) {
      for (let day = 1; day <= 2; day++) {
        const timeSlotId = await ctx.db.insert("timeSlots", {
          venueId,
          day: `Day ${day}`,
          capacity: 36,
          isActive: true,
        });

        // Initialize capacity tracking
        await ctx.db.insert("capacityTracking", {
          timeSlotId,
          currentCount: 0,
          lastUpdated: Date.now(),
        });
      }
    }

    // Create one time slot for each championship venue (represents the 4 options)
    for (const venueId of championshipVenueIds) {
      const timeSlotId = await ctx.db.insert("timeSlots", {
        venueId: venueId as unknown as any,
        day: `Day 1`,
        capacity: 18,
        isActive: true,
      });

      await ctx.db.insert("capacityTracking", {
        timeSlotId,
        currentCount: 0,
        lastUpdated: Date.now(),
      });
    }

    return { message: "Venues, time slots, and settings set up successfully" };
  },
});

// Migration-style helper to split a single championship venue into four named ones
export const splitChampionshipVenues = mutation({
  args: {},
  handler: async (ctx) => {
    const champVenues = await ctx.db
      .query("venues")
      .filter((q) => q.and(q.eq(q.field("type"), "championship"), q.eq(q.field("isActive"), true)))
      .collect();

    if (champVenues.length === 0) {
      throw new Error("No championship venue found to split");
    }
    if (champVenues.length >= 4) {
      return { message: "Championship venues already split", count: champVenues.length };
    }

    const original = champVenues[0];
    const slots = await ctx.db
      .query("timeSlots")
      .withIndex("by_venue", (q) => q.eq("venueId", original._id))
      .collect();

    // Create target venues
    const names = ["Descartes", "Euclid", "Gauss", "Turing"];
    const newVenueIds: any[] = [];
    for (const name of names) {
      const existing = champVenues.find((v) => v.name === name);
      if (existing) {
        newVenueIds.push(existing._id);
        continue;
      }
      const id = await ctx.db.insert("venues", { name, type: "championship", isActive: true });
      newVenueIds.push(id);
    }

    // Map the first 4 slots (ordered by day) to the new venues; if fewer exist, create new ones
    const ordered = slots.sort((a, b) => a.day.localeCompare(b.day));
    for (let i = 0; i < newVenueIds.length; i++) {
      const targetVenueId = newVenueIds[i];
      const slot = ordered[i];
      if (slot) {
        await ctx.db.patch(slot._id, { venueId: targetVenueId });
      } else {
        const timeSlotId = await ctx.db.insert("timeSlots", {
          venueId: targetVenueId,
          day: `Day 1`,
          capacity: 18,
          isActive: true,
        });
        await ctx.db.insert("capacityTracking", {
          timeSlotId,
          currentCount: 0,
          lastUpdated: Date.now(),
        });
      }
    }

    // Deactivate the original if it still has no remaining active slots
    const remainingForOriginal = await ctx.db
      .query("timeSlots")
      .withIndex("by_venue", (q) => q.eq("venueId", original._id))
      .collect();
    if (remainingForOriginal.length === 0) {
      await ctx.db.patch(original._id, { isActive: false });
    }

    return { message: "Split completed", newVenues: names };
  },
});

// Update a venue's location
export const setLocation = mutation({
  args: {
    venueId: v.id("venues"),
    location: v.string(),
  },
  handler: async (ctx, { venueId, location }) => {
    const venue = await ctx.db.get(venueId);
    if (!venue) throw new Error("Venue not found");
    await ctx.db.patch(venueId, { location });
    return { message: "Location updated" };
  },
});

// Update venue details: location and/or date
export const setDetails = mutation({
  args: {
    venueId: v.id("venues"),
    location: v.optional(v.string()),
    date: v.optional(v.string()),
    address: v.optional(v.string()),
  },
  handler: async (ctx, { venueId, location, date, address }) => {
    const venue = await ctx.db.get(venueId);
    if (!venue) throw new Error("Venue not found");
    const patch: any = {};
    if (typeof location !== "undefined") patch.location = location;
    if (typeof date !== "undefined") patch.date = date;
    if (typeof address !== "undefined") patch.address = address;
    await ctx.db.patch(venueId, patch);
    return { message: "Venue updated" };
  },
});
