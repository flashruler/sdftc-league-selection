import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { loadSchedules } from "./lib/schedule";

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

    // Structured summary (for the confirmation dialog) + text lines (for the email)
    const events = schedule.events.map(({ title, location, date }) => ({ title, location, date, day: dayLabel }));
    const formatMD = (s?: string) => {
      const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s ?? "");
      return m ? `${Number(m[2])}/${Number(m[3])}` : "date TBD";
    };
    const lines: string[] = [`Team ${args.teamNumber}`, `Schedule: ${dayLabel} team`];
    for (const e of events) {
      lines.push(`${e.title} - ${dayLabel} ${formatMD(e.date)}` + (e.location ? ` @ ${e.location}` : ""));
    }

    const message = lines.join("\n");
    // Build HTML body
    const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const itemsHtml = lines.map((l) => `<li>${esc(l)}</li>`).join("");
    const html = `<!doctype html>
      <html>
        <body style="font-family: system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; background:#f6f7f9; padding:24px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px; margin:auto; background:#ffffff; border-radius:12px; box-shadow:0 1px 3px rgba(0,0,0,0.06);">
            <tr>
              <td style="padding:24px;">
                <h2 style="margin:0 0 12px; color:#0f172a;">Registration Confirmation</h2>
                <p style="margin:0 0 16px; color:#334155;">Thank you for registering. Your team is a <b>${dayLabel} team</b>: all of your league events are on ${dayLabel}s.</p>
                <ul style="margin:0; padding-left:18px; color:#0f172a; line-height:1.5;">${itemsHtml}</ul>
                <p style="margin:16px 0 0; color:#64748b; font-size:12px;">This is an automated message. Please keep for your records.</p>
              </td>
            </tr>
          </table>
        </body>
      </html>`;
    await ctx.scheduler.runAfter(0, internal.emails.sendConfirmation, {
      to: email,
      subject: `Registration Confirmation - Team ${args.teamNumber} (${dayLabel} team)`,
      text: message,
      html,
    });

    return {
      registrationIds: createdIds,
      message,
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
