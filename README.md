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
- Canonical CampaignCard component (`src/components/campaigns/CampaignCard.tsx`) with explicit parent event deep-links (`For: [Event Title]`), participant social proof badges, dynamic CTA variants, and integrated optimistic SaveButton
- Connected public campaign destination (`/campaign/[slug]`) with official parent event conversion banner, verified creator profile card, and modernized participation copy
- Post-generation conversion funnel in `CampaignResultActions` routing participants directly back to the parent event for registration and ticketing
- Canvas integrity guards (`src/lib/campaigns/canvas-integrity.ts`) ensuring dimension validation and Fabric.js layer processing stability
- Analytics tracking for impressions, clicks, RSVPs, and referral conversions

### 4. Attendance & Bookmark Systems (`src/services/attendance.service.ts`, `src/services/saved.service.ts`)
- Granular attendance records protecting private registration data through Row Level Security
- Independent bookmarks for both events (`saved_events`) and campaigns (`saved_campaigns`)
- Automated notification dispatch for event organizers and participants

### 5. Client Caching & Quota Optimization (`src/components/ui/AvatarStack.tsx`, `src/lib/supabase/client.ts`)
- In-memory client cache (`attendeeCache`) and in-flight request deduplication (`pendingRequests`) for public event attendees, preventing query storms and Supabase quota exhaustion
- Referentially stable browser client singleton preventing duplicate Supabase connection pools and auth listener leaks
- Reactive unmount cancellation guards and state updater stabilization across all discovery filters and forms

### 6. Automated CI/CD Database Migration Pipeline (`.github/workflows`)
- `db-migration-ci.yml`: Pull request validation workflow that enforces migration timestamp naming conventions, verifies SQL file integrity, and executes dry-run validation against the linked project
- `db-migration-deploy.yml`: Production deployment pipeline triggered on merges to `main` with concurrency locks (`cancel-in-progress: false`) to push pending migrations atomically to the production database

### 7. Dedicated Organizer Dashboard (`src/app/dashboard/events/[id]`, `src/components/dashboard`, `src/app/actions/organizer.ts`)
- Dual-factor access control enforcing event creator and co-organizer roles via the `event_organizers` table
- Real-time overview metrics: total attendees, registrations, connected campaigns, and flyer generations
- People roster management with dedicated sub-tabs for Attendees, Registrants, Ticket Holders, and Campaign Participants
- Fast client-side CSV export engine for participant and attendee rosters
- Connected campaigns management tab with status toggle (Published/Paused), generation metrics, and analytics links
- Event settings editor with timezone-safe datetime-local handling, date order validation, participant campaign toggle, and safe event cancellation safeguards

### 8. Central Saved Items Hub (`src/app/saved`, `src/services/saved.service.ts`)
- Dedicated hub with dual-tab interface for Saved Events and Saved Campaigns
- Independent optimistic bookmark state with real-time persistence across sessions and active discovery links

### 9. Smart Notification & Engagement Engine (`src/lib/notifications`, `src/services/notifications.service.ts`)
- Centralized smart notification engine supporting 8 presentation formats (text, Pinterest-style visual popups, featured events, promotional banners, social notifications, reminders, organizer insights, and announcements)
- Timezone-aware quiet hours, idempotent deduplication keys, daily frequency caps, and single-popup priority queue
- Automated triggers for lifecycle updates, 24h event reminders, abandoned draft recovery, and friend attendance

### 10. Event SEO, Structured Data & Navigation UX (`src/app/events/[id]/page.tsx`, `src/components/navigation/header.tsx`)
- Dynamic metadata generation providing canonical URLs, Open Graph website cards, and responsive Twitter cards
- Schema.org Event JSON-LD structured data with protocol validation and script tag escaping for search engine rich snippets
- Authenticated header sign-out state with responsive icon-only mobile layout, loading indicators, and unmount safety guards

### 11. Authentication, Redirect Security & Legal Pages (`src/lib/auth`, `src/app/auth`, `src/components/legal`)
- Google OAuth, email/password sign-in, passwordless email-code (OTP) login, and email confirmation flows (`/login`, `/signup`, `/verify-email`)
- PKCE OAuth callback (`/auth/callback`) and email confirmation/recovery handler (`/auth/confirm`) supporting both `code` and `token_hash` links
- Password recovery flow (`/forgot-password`, `/reset-password`) with `supabase.auth.getUser()` session verification and post-reset local sign-out
- Centralized `safeAuthRedirect` helper (`src/lib/auth/redirect.ts`) enforcing internal relative paths and blocking backslash, control-character, and dot-segment protocol-relative bypasses
- Public About, Privacy Policy, and Terms of Service pages (`/about`, `/privacy`, `/terms`) with shared `LegalPage` and `Footer` components

### 12. Platform Promotions, Banners & Admin Console (`src/app/admin/promotions`, `src/services/promotions.service.ts`)
- Role-gated platform admin console (`/admin/promotions`) backed by `requirePlatformAdmin()` and `admin_audit_logs`
- Featured Events engine with priority tiers (`campaign_level`, `high_priority`, `standard`), audience-targeted visual campaign dispatches, and atomic metric tracking (`view`, `click`, `save`, `registration`)
- Responsive Home and Discover `PromotionalBannerSlot` components with `<picture>` desktop/mobile assets, session-capped visibility, per-session impression deduplication, image error fallback, and decoupled `banner_analytics` RPC tracking
- Next.js `unstable_cache` data caching with `updateTag` invalidation, explicit column projections, and SQL-level audience filters to minimize Supabase egress quota usage
- Admin controls for recovery delays, social triggers, notification templates, and chunked platform broadcasts with preview and approval safeguards

## Project Directory Structure

```text
Attend/
├── .github/                # GitHub templates and CI/CD workflows
│   ├── workflows/          # Automated GitHub Actions pipelines
│   │   ├── db-migration-ci.yml      # PR migration validation and dry-run
│   │   └── db-migration-deploy.yml  # Production migration deployment
│   └── pull_request_template.md
├── docs/                   # Implementation roadmaps and architectural plans
│   ├── smart_notification_implementation_plan.md # Smart notification and engagement roadmap
│   └── v1_implementation_plan.md
├── public/                 # Static assets and PWA service worker
│   ├── favicon.png
│   ├── icon-192.png
│   ├── icon-512.png
│   └── sw.js
├── scripts/                # Automated verification suites and CI runners
│   ├── smart-notifications/ # Smart notifications and engagement verification suites
│   │   ├── week1/          # Week 1 Smart notification foundation, recovery, and milestone 1 suites
│   │   └── week2/          # Week 2 Promotions, banners, and admin verification suites
│   └── v1-phase/           # Attend V1 milestone and weekly verification suites
│       ├── milestones/     # Core milestone suites (milestones 0 through 4)
│       ├── week1/          # Week 1 Location abstraction and event creation suites
│       ├── week3/          # Week 3 Public event and mobile action bar suites
│       ├── week4/          # Week 4 Discover and connected campaign suites
│       └── week5/          # Week 5 Organizer dashboard and saved items suites
├── src/
│   ├── app/                # Next.js App Router pages and route handlers
│   │   ├── about/          # Public About page
│   │   ├── actions/        # Server Actions (attendance, organizer, promotions, saved)
│   │   ├── admin/          # Platform admin promotions console (/admin/promotions)
│   │   ├── auth/           # OAuth callback and email confirmation route handlers
│   │   ├── campaign/       # Public campaign view and share route
│   │   ├── create/         # Event creation flow with LocationPicker
│   │   ├── dashboard/      # Organizer event dashboard (/dashboard/events/[id])
│   │   ├── discover/       # Public event discovery feed
│   │   ├── events/         # Event detail and campaign management routes
│   │   ├── forgot-password/# Password reset request flow
│   │   ├── login/          # User authentication login (OAuth, password, OTP)
│   │   ├── notifications/  # User in-app notifications hub
│   │   ├── privacy/        # Privacy Policy page
│   │   ├── profile/        # User and organizer profile management
│   │   ├── reset-password/ # Password reset completion flow
│   │   ├── saved/          # Saved events and campaigns hub
│   │   ├── settings/       # Account and notification preferences
│   │   ├── signup/         # User registration and onboarding reasons
│   │   ├── terms/          # Terms of Service page
│   │   ├── verify-email/   # Email OTP verification and resend flow
│   │   ├── globals.css     # Global styles and Tailwind configuration
│   │   ├── layout.tsx      # Root application layout with providers
│   │   ├── manifest.ts     # PWA Web App Manifest
│   │   └── page.tsx        # Home landing page with discover feed
│   ├── components/         # Reusable modular UI components
│   │   ├── admin/          # FeaturedEventsManager, BannerManagementTab, AdminControlsAndBroadcastTab
│   │   ├── analytics/      # Tracking and telemetry components
│   │   ├── campaigns/      # Promotional campaign cards, headers, and builder
│   │   ├── dashboard/      # OrganizerHeader, OrganizerTabs, Overview, People, Campaigns, Settings
│   │   ├── discover/       # DiscoverFilterBar, DiscoverHub, and card skeletons
│   │   ├── events/         # Event cards and participation model selector
│   │   ├── home/           # Landing page sections and filter controls
│   │   ├── legal/          # Shared LegalPage layout for Privacy and Terms
│   │   ├── location/       # LocationPicker and MapPreview components
│   │   ├── navigation/     # AppShell, Footer, Header, and MobileNav
│   │   ├── notifications/  # Toast, bell, and dropdown notifications
│   │   ├── providers/      # Context providers (Auth, Theme)
│   │   └── ui/             # Primitives and shared UI controls
│   ├── hooks/              # Custom React hooks (useNotifications, useToast)
│   ├── lib/                # Core libraries and utility abstractions
│   │   ├── auth/           # Safe redirect validation helper (safeAuthRedirect)
│   │   ├── campaigns/      # Canvas renderer, integrity guards, funnel routing, and templates
│   │   ├── dashboard/      # Roster CSV formatting and export engine
│   │   ├── location/       # Pluggable location layer and bounding box filters
│   │   ├── notifications/  # Smart notification engine, recovery rules, visual guards, push, and client
│   │   ├── supabase/       # Supabase browser, server, and proxy clients
│   │   ├── utils/          # Formatting helpers, promotion session storage, and error handlers
│   │   └── validations/    # Registration and promotions Zod schemas and rules
│   ├── services/           # Domain services and Server Actions
│   │   ├── abandoned-actions.service.ts
│   │   ├── attendance.service.ts
│   │   ├── campaigns.service.ts
│   │   ├── discover.service.ts
│   │   ├── events.service.ts
│   │   ├── notifications.service.ts
│   │   ├── organizer.service.ts
│   │   ├── profile.service.ts
│   │   ├── promotions.service.ts
│   │   └── saved.service.ts
│   ├── stores/             # Client-side Zustand state stores
│   │   ├── useAuthStore.ts
│   │   ├── useCampaignBuilderStore.ts
│   │   └── useNotificationsStore.ts
│   └── types/              # TypeScript domain types and contracts
│       ├── attendance.ts
│       ├── campaign-builder.ts
│       ├── campaigns.ts
│       ├── dashboard.ts
│       ├── discover.ts
│       ├── events.ts
│       ├── home.ts
│       ├── index.ts
│       └── notifications.ts
├── supabase/
│   ├── migrations/         # PostgreSQL schema migrations and RLS policies
│   │   ├── 20260922202204_remote_schema.sql
│   │   ├── 20260927020724_remote_schema.sql
│   │   ├── 20261005195800_v1_phase0_tables.sql
│   │   ├── 20261006171600_v1_phase0_attendance_schema.sql
│   │   ├── 20261006171700_v1_phase0_indexes.sql
│   │   ├── 20261008154000_v1_phase0_data_integrity.sql
│   │   ├── 20261014020000_attendee_privacy_reconciliation.sql
│   │   ├── 20261021195000_v1_phase0_public_attendees_view.sql
│   │   ├── 20261028120000_secure_event_participants.sql
│   │   ├── 20261028140000_discover_query_performance_indexes.sql
│   │   ├── 20261028162857_remote.sql
│   │   ├── 20261110100000_smart_notifications_foundation.sql
│   │   ├── 20261110110000_smart_notifications_day2.sql
│   │   ├── 20261117100000_promotions_and_social_discovery.sql
│   │   ├── 20261127100000_promotions_featured_metric_rpc.sql
│   │   ├── 20261127110000_banner_interaction_rpc.sql
│   │   └── 20261127120000_notification_templates_admin_rls.sql
│   ├── .gitignore          # Supabase CLI local ignore rules
│   └── config.toml         # Local development configuration and CLI settings
├── worker/                 # Custom PWA service worker
│   └── index.ts            # Push payload and same-origin click navigation handler
├── CONTRIBUTING.md         # Engineering contribution guide and daily PR workflow
├── package.json            # Scripts, dependencies, and project metadata
├── tsconfig.json           # TypeScript configuration and path aliases
└── README.md               # Project documentation and architecture guide
```

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
| `npm test` | Complete Test Suite | Runs all active milestone verification suites (M0, M1, M2, M3, M4: 325 automated checks) |
| `npm run verify:sn-w2-d6` | Smart Notifications Week 2 Days 6-8 | Featured events service/showcase, responsive promotional banners, decoupled banner analytics RPC, admin 4-tab console, trigger/template/broadcast controls, and zero em dashes |
| `npm run verify:sn-w2-d5` | Smart Notifications Week 2 Day 5 | Platform-admin auth guard, promotions & banners schema, RLS boundaries, social privacy view, and TypeScript contracts |
| `npm run verify:sn-m1` | Smart Notifications Week 1 Milestone 1 | End-to-end Week 1 audit: bell/dropdown/center, quiet hours, scheduled promotion, lifecycle & campaign analytics preservation, abandoned recovery rules, visual popup security/queue precedence, and Web Push |
| `npm run verify:sn-w1-d3` | Smart Notifications Week 1 Day 3 | Abandoned-action eligibility rules, empty-form rejection, 24h/72h delay enforcement, payment status verification, completion auto-suppression, and anti-surveillance copy guard |
| `npm run verify:sn-w1-d2` | Smart Notifications Week 1 Day 2 | Timezone-aware quiet hours (Africa/Lagos overnight spans), sliding 24h frequency caps, scheduled promotion RPC, deduplication idempotency, and zero em dashes |
| `npm run verify:sn-w1-d1` | Smart Notifications Week 1 Day 1 | Schema foundation (notifications, preferences, templates, abandoned_actions), shared contracts, status filtering, and zero em dashes |
| `npm run verify:m4` | Milestone 4 (Phase 4) | Dual-factor organizer authorization, overview metrics, people roster, central saved hub, safe cancellation, lifecycle notifications, Event SEO, JSON-LD, and Section 58 matrix |
| `npm run verify:w5-d3` | Week 5 Day 3 (Phase 4) | Organizer campaigns tab, settings tab, local timezone offset handling, date order validation, safe cancellation safeguards, and lifecycle notifications |
| `npm run verify:w5-d2` | Week 5 Day 2 (Phase 4) | Organizer people roster tab, 4 distinct sub-tabs, data separation between event attendance and campaign participation, and CSV export |
| `npm run verify:w5-d1` | Week 5 Day 1 (Phase 4) | Organizer dashboard shell, header, overview stats cards, access control redirect, and saved items hub |
| `npm run verify:m3` | Milestone 3 (Phase 3) | Discover query engine, Nigerian city presets, modular dual-grid layout, connected campaigns layer, conversion funnel, and domain isolation |
| `npm run verify:w4-d3` | Week 4 Day 3 (Phase 3) | Conversion funnel routing, campaign share tracking, discover query index optimizations, and Map-based lookups |
| `npm run verify:w4-d2` | Week 4 Day 2 (Phase 3) | Location query efficiency, PostGIS-free bounding box calculations, Nigerian city matching, Fabric.js canvas builder integrity guards |
| `npm run verify:w4-d1` | Week 4 Day 1 (Phase 3) | Data contracts (CampaignCardProps, DiscoverFilters), date quick-chips range engine, domain isolation between campaign participation and event attendance |
| `npm run verify:m2` | Milestone 2 (Phase 2) | Public event destination, 4 participation tiers, AvatarStack, bookmark persistence, guest sign-in retention, OpenGraph metadata |
| `npm run verify:day4` | Week 3 Day 4 | Connected campaign cards polish and creator empty states |
| `npm run verify:day3` | Week 3 Day 3 | Mobile action bar, cancel confirmation modal, registration modal, and Zod schemas |
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

## Contributing and Daily Development Workflow

Development follows a focused solo engineering cadence of **4 hours per day, 4 days per week** (16 hours per week) across weekly parent branches.

Detailed workflows, branch naming conventions, quality requirements, and daily operating procedures are documented in:
- [CONTRIBUTING.md](CONTRIBUTING.md): Daily development protocol, branching strategy, and PR instructions
- [docs/smart_notification_implementation_plan.md](docs/smart_notification_implementation_plan.md): Smart notification and engagement implementation plan (Week 1 completed; Weeks 2-3 scheduled at 4 hours/day, 4 days/week)
- [docs/v1_implementation_plan.md](docs/v1_implementation_plan.md): Complete phase-by-phase architectural roadmap and day-by-day objectives
- [.github/pull_request_template.md](.github/pull_request_template.md): Standard Pull Request description template

### Daily Workflow Summary
1. Work from the active weekly parent branch cut from `main` (e.g. `feat/w1-smart-notifications-foundation`, `feat/w2-promotions-banners-admin`).
2. Implement the day's 4-hour deliverables with clean, atomic commits following Conventional Commits.
3. Pass all verification checks (`npm test`, `npx tsc --noEmit`, `npm run build`, and relevant `verify:sn-*` suites).
4. At the end of each week, open a Pull Request targeting `main` using the PR template and merge once all checks pass.

## License

This project is licensed under the **Business Source License 1.1 (BUSL-1.1)**. See the [LICENSE](LICENSE) file for terms and parameters.


