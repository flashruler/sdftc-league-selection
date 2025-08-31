# FTC League Selection System

## Overview
A simple registration system for FIRST Tech Challenge teams to select their competition venues and days.

## Features
- **Simple Registration**: Teams only need to provide their team number
- **Capacity Management**: Real-time tracking of available spots
- **Unique Team Enforcement**: Each team can only register once
- **Registration Deadlines**: Configurable registration windows
- **Visual Feedback**: Clear display of available spots and capacity

## Venue Structure
- **Venue 1, 2, 3**: Each has 2 days (Day 1, Day 2) with 36 slots each
- **League Championship**: Has 4 days (Day 1, 2, 3, 4) with 18 slots each

## Registration Rules
- Teams can select **ONE** venue/day combination total
- Team numbers must be unique (no duplicate registrations)
- Registration is subject to capacity limits and deadlines

## Usage

### For Teams
1. Go to the registration website
2. Enter your team number
3. If available, select your preferred venue and day
4. Complete registration

### Initial Setup
The system needs to be initialized once with venues and time slots:

```javascript
// Run this once to set up the system
await convex.mutation(api.venues.setup)({});
```

### Admin Functions (via Convex Dashboard)
- **View registrations**: `registrations:getAll`
- **Check capacity**: `timeSlots:getAvailable`
- **Set registration deadline**: `settings:set` with key "registration_deadline"
- **Open/close registration**: `settings:set` with key "registration_open"

## Technical Details

### Database Schema
- `venues`: Competition venues (Venue 1, 2, 3, League Championship)
- `timeSlots`: Available days for each venue with capacity limits
- `registrations`: Team registrations (team number, venue, time slot)
- `capacityTracking`: Real-time capacity monitoring
- `settings`: System configuration (deadlines, open/closed status)

### Key Functions
- `registrations:register`: Register a team
- `registrations:checkTeamAvailability`: Check if team number is available
- `registrations:isRegistrationOpen`: Check registration status
- `timeSlots:getAvailable`: Get all available time slots with capacity info
- `venues:setup`: Initialize the system

## Development

### Start Development Servers
```bash
# Start Convex backend
npx convex dev

# Start Next.js frontend (in another terminal)
npm run dev
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
