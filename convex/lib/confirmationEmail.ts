type EmailEvent = { title: string; location?: string; address?: string; date?: string };

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function parseDate(s?: string) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s ?? "");
  if (!m) return null;
  const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  return { month: MONTHS[d.getUTCMonth()], day: d.getUTCDate(), weekday: WEEKDAYS[d.getUTCDay()], year: d.getUTCFullYear() };
}

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// Inline styles + tables only: email clients ignore <style> blocks and flexbox.
export function renderConfirmationEmail(teamNumber: string, dayLabel: string, events: EmailEvent[], leagueRequest?: string) {
  const subject = `Registration Confirmation - Team ${teamNumber} (${dayLabel} team)`;

  const text = [
    `Team ${teamNumber} is registered as a ${dayLabel} team.`,
    `All of your league events, from Meet 1 through the League Tournament, are on ${dayLabel}s.`,
    ...(leagueRequest ? [`League request: ${leagueRequest}`] : []),
    "",
    "Your schedule:",
    ...events.map((e) => {
      const d = parseDate(e.date);
      const when = d ? `${d.weekday}, ${d.month} ${d.day}, ${d.year}` : "Date TBD";
      return [`- ${e.title}: ${when}`, e.location, e.address].filter(Boolean).join("\n  ");
    }),
    "",
    "Leagues are assigned after registration closes.",
  ].join("\n");

  const rows = events
    .map((e, i) => {
      const d = parseDate(e.date);
      const border = i === 0 ? "" : "border-top:1px solid #e2e8f0;";
      const dateCell = d
        ? `<div style="font-size:11px; font-weight:600; letter-spacing:0.05em; text-transform:uppercase; color:#ea580c;">${d.month}</div>
           <div style="font-size:22px; font-weight:700; line-height:1; color:#0f172a;">${d.day}</div>`
        : `<div style="font-size:12px; color:#64748b;">TBD</div>`;
      const when = d ? `${d.weekday}, ${d.month} ${d.day}, ${d.year}` : "Date to be announced";
      return `<tr>
          <td width="56" valign="top" align="center" style="${border} padding:14px 0;">${dateCell}</td>
          <td valign="top" style="${border} padding:14px 0 14px 12px;">
            <div style="font-size:15px; font-weight:600; color:#0f172a;">${esc(e.title)}</div>
            <div style="font-size:13px; color:#475569; margin-top:2px;">${when}</div>
            ${[e.location, e.address].filter(Boolean).map((l) => `<div style="font-size:13px; color:#64748b; margin-top:2px;">${esc(l!)}</div>`).join("")}
          </td>
        </tr>`;
    })
    .join("");

  const html = `<!doctype html>
<html>
  <body style="margin:0; padding:24px; background:#f1f5f9; font-family:system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px; margin:0 auto; background:#ffffff; border-radius:12px; overflow:hidden;">
      <tr>
        <td style="background:#f97316; padding:24px;">
          <div style="font-size:12px; font-weight:600; letter-spacing:0.08em; text-transform:uppercase; color:#ffedd5;">SDFTC Event Selection</div>
          <div style="font-size:22px; font-weight:700; color:#ffffff; margin-top:6px;">You're registered!</div>
        </td>
      </tr>
      <tr>
        <td style="padding:24px 24px 8px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#fff7ed; border:1px solid #fed7aa; border-radius:8px;">
            <tr>
              <td style="padding:14px 16px;">
                <div style="font-size:13px; color:#475569;">Team</div>
                <div style="font-size:20px; font-weight:700; color:#0f172a;">${esc(teamNumber)}</div>
              </td>
              <td align="right" style="padding:14px 16px;">
                <span style="display:inline-block; background:#ea580c; color:#ffffff; font-size:14px; font-weight:600; padding:6px 12px; border-radius:999px;">${dayLabel} team</span>
              </td>
            </tr>
          </table>
          <p style="margin:16px 0 0; font-size:14px; line-height:1.5; color:#334155;">
            All of your league events, from Meet 1 through the League Tournament, are on <b>${dayLabel}s</b>.
          </p>
          ${leagueRequest ? `<p style="margin:8px 0 0; font-size:14px; line-height:1.5; color:#334155;"><b>League request:</b> ${esc(leagueRequest)}</p>` : ""}
        </td>
      </tr>
      <tr>
        <td style="padding:8px 24px 0;">
          <div style="font-size:12px; font-weight:600; letter-spacing:0.05em; text-transform:uppercase; color:#64748b; margin:8px 0 4px;">Your schedule</div>
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0">${rows}</table>
        </td>
      </tr>
      <tr>
        <td style="padding:16px 24px 24px;">
          <p style="margin:0; padding:12px 14px; background:#f8fafc; border-radius:8px; font-size:13px; line-height:1.5; color:#475569;">
            Leagues are assigned after registration closes. Keep this email for your records.
          </p>
        </td>
      </tr>
    </table>
    <p style="max-width:560px; margin:12px auto 0; text-align:center; font-size:12px; color:#94a3b8;">This is an automated message. Replies are not monitored.</p>
  </body>
</html>`;

  return { subject, text, html };
}
