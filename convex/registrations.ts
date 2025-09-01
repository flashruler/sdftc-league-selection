import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Check if registration is currently open
export const isRegistrationOpen = query({
  args: {},
  handler: async (ctx) => {
    const openSetting = await ctx.db
      .query("settings")
      .withIndex("by_key", (q) => q.eq("key", "registration_open"))
      .first();
      
    const deadlineSetting = await ctx.db
      .query("settings")
      .withIndex("by_key", (q) => q.eq("key", "registration_deadline"))
      .first();
    
    const isOpen = openSetting?.value !== false; // Default to open if not set
    const now = Date.now();
    const deadline = deadlineSetting?.value as number | undefined;
    
    const isBeforeDeadline = !deadline || now < deadline;
    
    return {
      isOpen: isOpen && isBeforeDeadline,
      deadline: deadline,
      deadlineFormatted: deadline ? new Date(deadline).toLocaleString() : null,
    };
  },
});

// Check if a team number is already registered
export const checkTeamAvailability = query({
  args: {
    teamNumber: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("registrations")
      .withIndex("by_team_number", (q) => q.eq("teamNumber", args.teamNumber))
      .first();
    
    return {
      isAvailable: !existing,
      existingRegistration: existing,
    };
  },
});

// Get all registrations (simplified)
export const getAll = query({
  args: {},
  handler: async (ctx) => {
    const registrations = await ctx.db
      .query("registrations")
      .order("desc")
      .collect();

    const result = [];
    
  for (const registration of registrations) {
      const venue = await ctx.db.get(registration.venueId);
      const timeSlot = await ctx.db.get(registration.timeSlotId);
      
      result.push({
        ...registration,
        venueName: venue?.name,
    venueType: venue?.type,
        day: timeSlot?.day,
        registrationDateFormatted: new Date(registration.registrationDate).toLocaleString(),
      });
    }
    
    return result;
  },
});

// Get registrations for a specific time slot
export const getByTimeSlot = query({
  args: {
    timeSlotId: v.id("timeSlots"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("registrations")
      .withIndex("by_time_slot", (q) => q.eq("timeSlotId", args.timeSlotId))
      .collect();
  },
});

// Register a team - simplified to only require team number
export const register = mutation({
  args: {
    teamNumber: v.string(),
    timeSlotId: v.id("timeSlots"),
  },
  handler: async (ctx, args) => {
    // Check if registration is open
    const registrationStatus = await ctx.db
      .query("settings")
      .withIndex("by_key", (q) => q.eq("key", "registration_open"))
      .first();
      
    const deadlineSetting = await ctx.db
      .query("settings")
      .withIndex("by_key", (q) => q.eq("key", "registration_deadline"))
      .first();
    
    const isOpen = registrationStatus?.value !== false;
    const now = Date.now();
    const deadline = deadlineSetting?.value as number | undefined;
    
    if (!isOpen || (deadline && now > deadline)) {
      throw new Error("Registration is currently closed");
    }

    // Check if team number is already registered
    const existingRegistration = await ctx.db
      .query("registrations")
      .withIndex("by_team_number", (q) => q.eq("teamNumber", args.teamNumber))
      .first();
    
    if (existingRegistration) {
      throw new Error(`Team ${args.teamNumber} is already registered`);
    }

    // Get time slot and venue info
    const timeSlot = await ctx.db.get(args.timeSlotId);
    if (!timeSlot || !timeSlot.isActive) {
      throw new Error("Invalid or inactive time slot");
    }

    const venue = await ctx.db.get(timeSlot.venueId);
    if (!venue || !venue.isActive) {
      throw new Error("Invalid or inactive venue");
    }

    // Check capacity (computed from registrations for real-time accuracy)
    const regs = await ctx.db
      .query("registrations")
      .withIndex("by_time_slot", (q) => q.eq("timeSlotId", args.timeSlotId))
      .collect();
    if (regs.length >= timeSlot.capacity) {
      throw new Error(`This time slot is full (${timeSlot.capacity}/${timeSlot.capacity} teams)`);
    }

    // Create registration
    const registrationId = await ctx.db.insert("registrations", {
      teamNumber: args.teamNumber,
      venueId: venue._id,
      timeSlotId: args.timeSlotId,
      registrationDate: Date.now(),
    });

  // No separate capacity tracking updates needed; counts derive from registrations

    return {
      registrationId,
      message: `Team ${args.teamNumber} successfully registered for ${venue.name} - ${timeSlot.day}`,
    };
  },
});

// Register a team for all required selections:
// - One day for each regular venue (Venue 1, 2, 3)
// - One day for the League Championship (one of four)
export const registerSelections = mutation({
  args: {
    teamNumber: v.string(),
    selections: v.object({
      regular: v.array(v.id("timeSlots")), // expected length: number of active regular venues (typically 3)
      championship: v.id("timeSlots"),
    }),
  },
  handler: async (ctx, args) => {
    // Registration window checks
    const registrationStatus = await ctx.db
      .query("settings")
      .withIndex("by_key", (q) => q.eq("key", "registration_open"))
      .first();

    const deadlineSetting = await ctx.db
      .query("settings")
      .withIndex("by_key", (q) => q.eq("key", "registration_deadline"))
      .first();

    const isOpen = registrationStatus?.value !== false;
    const now = Date.now();
    const deadline = deadlineSetting?.value as number | undefined;

    if (!isOpen || (deadline && now > deadline)) {
      throw new Error("Registration is currently closed");
    }

    // Ensure this team hasn't already registered anything (one-shot registration flow)
    const existingAny = await ctx.db
      .query("registrations")
      .withIndex("by_team_number", (q) => q.eq("teamNumber", args.teamNumber))
      .first();
    if (existingAny) {
      throw new Error(`Team ${args.teamNumber} has already submitted selections`);
    }

    // Fetch all active venues to validate selections
    const venues = await ctx.db
      .query("venues")
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    const regularVenues = venues.filter((v) => v.type === "regular");
    const championshipVenue = venues.find((v) => v.type === "championship");

    if (!championshipVenue) {
      throw new Error("Championship venue is not configured");
    }

    // Validate we have exactly one selection per regular venue (by venue, not by day)
    if (args.selections.regular.length !== regularVenues.length) {
      throw new Error(
        `You must select one day for each regular venue (${regularVenues.length} total)`
      );
    }

    // Load the selected time slots
    const selectedRegularSlots = await Promise.all(
      args.selections.regular.map((id) => ctx.db.get(id))
    );
    const selectedChampionshipSlot = await ctx.db.get(args.selections.championship);

    if (selectedRegularSlots.some((s) => !s || !s.isActive)) {
      throw new Error("One or more selected regular venue time slots are invalid or inactive");
    }
    if (!selectedChampionshipSlot || !selectedChampionshipSlot.isActive) {
      throw new Error("Selected championship time slot is invalid or inactive");
    }

    // Validate slot venue types and uniqueness by venue for regular selections
    const regularVenueIdsFromSlots: string[] = [];
    for (const slot of selectedRegularSlots) {
      // slot! is safe due to earlier check
      const venue = await ctx.db.get(slot!.venueId);
      if (!venue || venue.type !== "regular" || !venue.isActive) {
        throw new Error("Selected regular slot is not from an active regular venue");
      }
      regularVenueIdsFromSlots.push(venue._id as unknown as string);
    }

    // Ensure we have exactly one slot per distinct regular venue
    const distinctRegularVenueIds = Array.from(new Set(regularVenueIdsFromSlots));
    if (distinctRegularVenueIds.length !== regularVenues.length) {
      throw new Error("Please select exactly one day for each regular venue (no duplicates)");
    }

    // Validate championship slot belongs to championship venue
    const champVenue = await ctx.db.get(selectedChampionshipSlot.venueId);
    if (!champVenue || champVenue.type !== "championship" || !champVenue.isActive) {
      throw new Error("Selected championship slot must belong to an active championship venue");
    }

    // Capacity checks for all selected slots (computed from registrations)
    const allSlots = [...selectedRegularSlots, selectedChampionshipSlot];
    for (const slot of allSlots) {
      const regs = await ctx.db
        .query("registrations")
        .withIndex("by_time_slot", (q) => q.eq("timeSlotId", slot!._id))
        .collect();
      if (regs.length >= slot!.capacity) {
        const v = await ctx.db.get(slot!.venueId);
        throw new Error(
          `${v?.name ?? "Venue"} - ${slot!.day} is full (${slot!.capacity}/${slot!.capacity} teams)`
        );
      }
    }

    // At this point, attempt to create registrations and update capacity
    const createdIds: string[] = [];
    try {
      for (const slot of selectedRegularSlots) {
        const regId = await ctx.db.insert("registrations", {
          teamNumber: args.teamNumber,
          venueId: slot!.venueId,
          timeSlotId: slot!._id,
          registrationDate: Date.now(),
        });
        createdIds.push(regId as unknown as string);

  // No capacityTracking updates; counts derive from registrations
      }

      // Championship registration
      const champRegId = await ctx.db.insert("registrations", {
        teamNumber: args.teamNumber,
        venueId: selectedChampionshipSlot.venueId,
        timeSlotId: selectedChampionshipSlot._id,
        registrationDate: Date.now(),
      });
      createdIds.push(champRegId as unknown as string);

  // No capacityTracking updates; counts derive from registrations
    } catch (e) {
      // Best effort note: Convex doesn't support multi-op rollback here.
      // If needed, admins can clean up partial state.
      throw e;
    }

    // Build a friendly summary
    const summaryParts: string[] = [];
    for (const slot of selectedRegularSlots) {
      const v = await ctx.db.get(slot!.venueId);
      summaryParts.push(`${v?.name} - ${slot!.day}`);
    }
  const champVenueName = (await ctx.db.get(selectedChampionshipSlot.venueId))?.name;
  summaryParts.push(`${champVenueName} - ${selectedChampionshipSlot.day}`);

    return {
      registrationIds: createdIds,
      message: `Team ${args.teamNumber} successfully registered for: ${summaryParts.join(", ")}`,
    };
  },
});
