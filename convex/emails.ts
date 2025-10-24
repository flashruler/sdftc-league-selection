import { internalAction } from "./_generated/server";
import { v } from "convex/values";
import { Resend } from "resend";

function buildFrom(raw: string): string {
  const s = (raw || "").trim();
  // Case 1: "Name <email>"
  const mAngle = s.match(/^([^<]+)<\s*([^>]+)\s*>$/);
  if (mAngle) return `${mAngle[1].trim()} <${mAngle[2].trim()}>`;
  // Case 2: plain email
  const emailOnly = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
  if (emailOnly.test(s)) return s;
  // Case 3: "Name email" -> split last token as email
  const mSpace = s.match(/^(.*)\s+([^@\s]+@[^@\s]+\.[^@\s]+)$/);
  if (mSpace) return `${mSpace[1].trim()} <${mSpace[2].trim()}>`;
  // Fallback
  return "SDFTC <no-reply@example.com>";
}

export const sendConfirmation = internalAction({
  args: {
    to: v.string(),
    subject: v.string(),
    text: v.string(),
    html: v.optional(v.string()),
  },
  handler: async (_ctx, args) => {
    const apiKey = process.env.RESEND_API_KEY;
    const fromRaw = process.env.EMAIL_FROM || "SDFTC <no-reply@example.com>";
    if (!apiKey) {
      console.warn("RESEND_API_KEY is not set in Convex env; skipping email send.");
      return;
    }

    const resend = new Resend(apiKey);
    const { data, error } = await resend.emails.send({
      from: buildFrom(fromRaw),
      to: args.to,
      subject: args.subject,
      text: args.text,
      html: args.html ?? undefined,
    });
    if (error) {
      console.error("Resend email error", error);
      throw new Error(`Email send failed: ${error.message ?? JSON.stringify(error)}`);
    }
    console.log("Resend queued email id:", data?.id);
  },
});
