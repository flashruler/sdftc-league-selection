# FTC League Selection System

## Overview
A registration system for FIRST Tech Challenge teams to choose a **Saturday** or **Sunday** schedule. A team's choice applies to every league event, from Meet 1 through the League Tournament. Leagues are assigned outside this app after registration closes.

## Features
- **One choice**: team number, Saturday or Sunday, and a confirmation email
- **Confirmation**: teams see (and are emailed) every event's venue and date for their day
- **Capacity Management**: each event day has a team limit; a day is unavailable if any event's day is full or closed
- **Unique Team Enforcement**: Each team can only register once
- **Registration Deadlines**: Configurable registration windows

## Event Structure
- Each league event (Meet 1, Meet 2, Meet 3, League Tournament) is a `regular` venue with a **Saturday** and a **Sunday** time slot, each with its own date and team limit.
- Add events in the admin **Events** tab; the setup checklist flags any event missing an open, dated Saturday or Sunday.
- `championship` / `meet1` venues are from the old league-picking flow. Teams don't see them; delete them in the admin.

## Usage

### For Teams
1. Go to the registration website
2. Enter your team number
3. Pick the Saturday or Sunday schedule and enter an email
4. Submit; you're signed up for that day at every event

### Admin Functions
- **Admin page** (`/admin`): add events, edit venues/dates/limits, view Saturday/Sunday counts, export the registrations CSV (Team, Day, Email)
- **Set registration deadline**: `settings:set` with key "registration_deadline"
- **Open/close registration**: `settings:set` with key "registration_open"
- **New season**: `npx convex run seasonReset:clearSeason '{"includeEvents": false}'` (add `--prod` for production; export a backup first)

## Technical Details

### Database Schema
- `venues`: League events (`regular`), plus legacy `championship` / `meet1`
- `timeSlots`: The Saturday and Sunday slot for each event, with date and capacity
- `registrations`: One row per team per event day (team number, venue, time slot, email)
- `settings`: System configuration (deadlines, open/closed status)
- `capacityTracking`: Deprecated; capacity is computed from registrations

### Key Functions
- `timeSlots:getSchedules`: The Saturday and Sunday schedules shown to teams (logic in `convex/lib/schedule.ts`)
- `registrations:registerDay`: Register a team for a full Saturday or Sunday schedule
- `registrations:checkTeamAvailability`: Check if team number is available
- `registrations:isRegistrationOpen`: Check registration status

## Development

### Start Development Servers
```bash
# Start Convex backend
npx convex dev

# Start Next.js frontend (in another terminal)
pnpm dev
```

### Environment
- Frontend: Next.js with TypeScript and Tailwind CSS
- Backend: Convex (real-time database and functions)
- Deployment: Vercel (frontend) + Convex Cloud (backend)

## Configuration

### Registration Deadline
```javascript
// Set deadline to 30 days from now
await convex.mutation(api.settings.set)({
  key: "registration_deadline",
  value: Date.now() + (30 * 24 * 60 * 60 * 1000),
  description: "Registration deadline timestamp"
});
```

### Close Registration
```javascript
await convex.mutation(api.settings.set)({
  key: "registration_open", 
  value: false,
  description: "Whether registration is currently open"
});
```
