import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Get a setting by key
export const get = query({
  args: {
    key: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("settings")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .first();
  },
});

// Get all settings
export const getAll = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("settings").collect();
  },
});

// Set a setting value
export const set = mutation({
  args: {
    key: v.string(),
    value: v.union(v.string(), v.number(), v.boolean()),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("settings")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        value: args.value,
        description: args.description,
      });
      return existing._id;
    } else {
      return await ctx.db.insert("settings", {
        key: args.key,
        value: args.value,
        description: args.description,
      });
    }
  },
});

// Initialize default settings
export const initializeDefaults = mutation({
  args: {},
  handler: async (ctx) => {
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

    return { message: "Default settings initialized" };
  },
});
