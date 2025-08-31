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

    const championship = await ctx.db.insert("venues", {
      name: "League Championship",
      type: "championship",
      isActive: true,
    });

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

    // Create time slots for championship (18 capacity each day)
    for (let day = 1; day <= 4; day++) {
      const timeSlotId = await ctx.db.insert("timeSlots", {
        venueId: championship,
        day: `Day ${day}`,
        capacity: 18,
        isActive: true,
      });

      // Initialize capacity tracking
      await ctx.db.insert("capacityTracking", {
        timeSlotId,
        currentCount: 0,
        lastUpdated: Date.now(),
      });
    }

    return { message: "Venues, time slots, and settings set up successfully" };
  },
});
