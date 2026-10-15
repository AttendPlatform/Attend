# Attend

Attend is an event discovery, participation, and campaign platform. It establishes the Event as the primary destination while providing a connected promotional campaign layer for organizers and community advocates.

## Architecture & Core Technologies

- Framework: Next.js 16 (App Router) with React 19
- Styling: Tailwind CSS
- Database & Backend: Supabase (PostgreSQL with Row Level Security, Auth, Storage)
- Location Architecture: Pluggable provider abstraction with OpenStreetMap geocoding, Nigerian tech hubs, Haversine proximity algorithms, and navigation deep links
- State & Services: Server Actions and domain service layers for events, attendance, campaigns, and saved items

## Key System Modules

### 1. Location Abstraction Layer (`src/lib/location`)
- Pluggable provider interface supporting OpenStreetMap (Nominatim) and Google Places API compatibility
- Preset hubs for key Nigerian tech centers: Lagos, Abuja, Port Harcourt, Ibadan, Enugu, Kano, Kaduna, and Benin City
- Haversine distance calculation and proximity sorting
- Native navigation URLs for Google Maps, Apple Maps, and Waze
- Responsive MapPreview component with embedded OpenStreetMap views and directions links

### 2. Multi-Tier Event Participation Engine (`src/components/events`, `src/services/events.service.ts`)
- Free (Direct Attend): Instant RSVP for open events
- Free with Registration: Form configuration with custom questions, phone requirements, and attendee capacity limits
- Paid Tickets: Tiered pricing, multi-currency support (NGN, USD, GBP, EUR), capacity caps, and refund policies
- External Provider: Direct deep linking to third-party ticketing platforms (e.g. Tix, Eventbrite, Luma)
- Participant Campaign Permissions: Creator control allowing or restricting participant-led promotional campaigns

### 3. Campaign & Promotion Layer (`src/services/campaigns.service.ts`, `src/app/campaign`)
- Connected participant campaigns linked to parent events via database referential constraints
- Canvas-based visual banner builder for personalized promotional assets
- Analytics tracking for impressions, clicks, RSVPs, and referral conversions

### 4. Attendance & Bookmark Systems (`src/services/attendance.service.ts`, `src/services/saved.service.ts`)
- Granular attendance records protecting private registration data through Row Level Security
- Independent bookmarks for both events (`saved_events`) and campaigns (`saved_campaigns`)
- Automated notification dispatch for event organizers and participants

## Getting Started

### Prerequisites
- Node.js 20 or higher
- npm, pnpm, or yarn

### Installation
1. Clone the repository:
```bash
git clone https://github.com/AttendPlatform/Attend.git
cd Attend
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables in `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-key
```

4. Start the local development server:
```bash
npm run dev
```

The application will be accessible at `http://localhost:3000`.

## Testing and Quality Assurance

Run the automated verification suite across all domain services, database integrity, and UI components:

```bash
npm test
```

### Verification Checkpoints

| Command | Scope | Coverage |
| :--- | :--- | :--- |
| `npm test` | Complete Test Suite | Runs all active milestone verification suites |
| `npm run verify:m1` | Milestone 1 (Phase 1) | Location abstraction, event creation flow, and participation models |
| `npm run verify:m0` | Milestone 0 (Phase 0) | Database schema migrations, referential integrity, and domain services |


## Production Build

To run the TypeScript compiler check and produce the optimized production build:

```bash
# Typecheck
npx tsc --noEmit

# Production build
npm run build
```
