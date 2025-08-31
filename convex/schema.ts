import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Venue definitions with capacity limits
  venues: defineTable({
    name: v.string(), // "Venue 1", "Venue 2", "Venue 3", "League Championship"
    type: v.union(v.literal("regular"), v.literal("championship")),
    isActive: v.boolean(),
  }),

  // Available time slots for each venue
  timeSlots: defineTable({
    venueId: v.id("venues"),
    day: v.string(), // "Day 1", "Day 2", etc.
    date: v.optional(v.string()), // Actual date if needed
    capacity: v.number(), // 36 for regular venues, 18 for championship
    isActive: v.boolean(),
  })
    .index("by_venue", ["venueId"])
    .index("by_venue_and_day", ["venueId", "day"]),

  // Team registrations - simplified to only team number
  registrations: defineTable({
    teamNumber: v.string(), // FTC team number (only required field)
    venueId: v.id("venues"),
    timeSlotId: v.id("timeSlots"),
    registrationDate: v.number(), // timestamp
  })
    .index("by_team_number", ["teamNumber"])
    .index("by_venue", ["venueId"])
    .index("by_time_slot", ["timeSlotId"])
    .index("by_registration_date", ["registrationDate"]),

  // System settings for registration windows
  settings: defineTable({
    key: v.string(), // "registration_open", "registration_deadline", etc.
    value: v.union(v.string(), v.number(), v.boolean()),
    description: v.optional(v.string()),
  })
    .index("by_key", ["key"]),

  // Track capacity usage
  capacityTracking: defineTable({
    timeSlotId: v.id("timeSlots"),
    currentCount: v.number(),
    lastUpdated: v.number(), // timestamp
  })
    .index("by_time_slot", ["timeSlotId"]),
});