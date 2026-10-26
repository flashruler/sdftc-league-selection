import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { loadSchedules } from "./lib/schedule";
import { renderConfirmationEmail } from "./lib/confirmationEmail";

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
        date: (timeSlot as unknown as { date?: string })?.date,
        venueDate: (venue as unknown as { date?: string })?.date,
        registrationDateFormatted: new Date(registration.registrationDate).toLocaleString(),
      });
    }
    
    return result;
  },
});

// Register a team for a full Saturday or Sunday schedule: that day's slot at every league event.
export const registerDay = mutation({
  args: {
    teamNumber: v.string(),
    day: v.union(v.literal("saturday"), v.literal("sunday")),
    email: v.string(),
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

    if (!/^\d{1,5}$/.test(args.teamNumber)) {
      throw new Error("A valid team number is required");
    }

    const email = args.email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error("A valid email address is required");
    }

    // Ensure this team hasn't already registered anything (one-shot registration flow)
    const existingAny = await ctx.db
      .query("registrations")
      .withIndex("by_team_number", (q) => q.eq("teamNumber", args.teamNumber))
      .first();
    if (existingAny) {
      throw new Error(`Team ${args.teamNumber} has already registered`);
    }

    // All-or-nothing: a closed or full slot at any event blocks the whole day. Mutations are
    // transactional, so a concurrent signup that fills a slot makes this one retry and fail here.
    const schedule = (await loadSchedules(ctx))[args.day];
    const dayLabel = args.day === "saturday" ? "Saturday" : "Sunday";
    if (schedule.unavailable) {
      throw new Error(`${dayLabel} can't be selected: ${schedule.unavailable}`);
    }

    const createdIds: string[] = [];
    for (const e of schedule.events) {
      const slot = (await ctx.db.get(e.slotId))!;
      const regId = await ctx.db.insert("registrations", {
        teamNumber: args.teamNumber,
        venueId: slot.venueId,
        timeSlotId: slot._id,
        registrationDate: now,
        email,
      });
      createdIds.push(regId as unknown as string);
    }

    // Structured summary for the confirmation dialog; the email shows the same events
    const events = schedule.events.map(({ title, location, date }) => ({ title, location, date, day: dayLabel }));
    const { subject, text, html } = renderConfirmationEmail(args.teamNumber, dayLabel, events);
    await ctx.scheduler.runAfter(0, internal.emails.sendConfirmation, { to: email, subject, text, html });

    return {
      registrationIds: createdIds,
      message: text,
      summary: { teamNumber: args.teamNumber, day: dayLabel, email, events },
    };
  },
});

// Admin: remove all registrations for a team number
export const removeByTeam = mutation({
  args: {
    teamNumber: v.string(),
  },
  handler: async (ctx, { teamNumber }) => {
    const regs = await ctx.db
      .query("registrations")
      .withIndex("by_team_number", (q) => q.eq("teamNumber", teamNumber))
      .collect();

    let removed = 0;
    for (const r of regs) {
      await ctx.db.delete(r._id);
      removed++;
    }
    return { removed };
  },
});
