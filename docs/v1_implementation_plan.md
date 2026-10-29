# Attend V1: Architecture Audit & Accelerated 5-Week Implementation Plan

> **Based on**: *Discover - Event - Campaign Flow & Architecture Development Brief*  
> **Cadence**: 4 hours/day · 4 days/week per person (16 hours/week per person · 48 person-hours/week)  
> **Team Structure**: 3 People
> - **Sanaullah**: Tech Lead & Project Supervisor (Architecture, PR Reviews, Security/RLS, Integration Testing & Release Orchestration)
> - **Uzair**: Software Engineer (Core UI Primitives, Public Event Destination, Connected Campaigns & Organizer Dashboard)
> - **Hardik**: Software Engineer (Attendance Engine, Dynamic CTAs, Discover Hub Query Engine, Saved System & Lifecycle Engine)  
> **Timeline**: Compressed from 8 Weeks to **5 Weeks** (Weeks 1 to 4 Completed; Week 5 Active)  
> **Status**: Weeks 1 to 4 **DONE** · Week 5 **ACTIVE**

---

## 1. Executive Summary & Where Attend Currently Stands

Attend is an event discovery and participation platform where **the Event is the central destination** and **Campaigns form a connected promotional & participation layer**. 

```
                          ┌──────────────────────────┐
                          │         DISCOVER         │
                          │   Search / Near Me / City│
                          └─────────────┬────────────┘
                                        │
                         ┌──────────────┴──────────────┐
                         ▼                             ▼
             ┌───────────────────────┐     ┌───────────────────────┐
             │      EVENT PAGE       │     │     CAMPAIGN PAGE     │
             │   (Central Entity)    │◄────┤ (Connected Sub-layer) │
             └───────────┬───────────┘     └───────────┬───────────┘
                         │                             │
                         ▼                             ▼
             ┌───────────────────────┐     ┌───────────────────────┐
             │   EVENT ATTENDANCE    │     │ CAMPAIGN PARTICIPATION│
             │ Attend/Register/Ticket│     │  Personalize / Share  │
             └───────────────────────┘     └───────────────────────┘
                     (Separate DB & Business Logic Relationships)
```

### Current Status Matrix

| Domain Area | Current Codebase State | Alignment with Brief | Verdict |
| :--- | :--- | :--- | :--- |
| **Campaign Graphic Engine** | Fabric.js canvas builder (`campaign-builder.tsx`, `generate.ts`, `image.ts`) is fully functional. | High alignment with participation concept. | **KEEP & PRESERVE** |
| **Campaign Analytics** | Rich analytics tracking views, generations, downloads, social shares, referrers, and activity log. | Matches brief Section 31 & 45. | **KEEP & REFACTOR** |
| **Notification Engine** | Working database-backed notifications, preferences, unread counts, and UI dropdown. | Matches brief Section 27. | **KEEP & EXTEND** |
| **Database Schema Foundation** | Added `participation_model`, `participation_config`, `allow_participant_campaigns`, `place_id`, `saved_campaigns`, `event_organizers`. | Matches brief Section 4 & Phase 0. | **DONE (Week 1)** |
| **Event Attendance Schema** | Separated attendance records (`participation_type`, `status`, `registration_data`) from campaign generation. | Matches brief Section 3 & 55. | **DONE (Week 1)** |
| **Location Abstraction** | Pluggable provider with OpenStreetMap geocoding, 8 Nigerian tech hub presets, Haversine proximity, native directions. | Matches brief Section 18-20. | **DONE (Week 2)** |
| **Location UI Components** | `LocationPicker.tsx` (hub presets, coordinate inputs, online toggle) and `MapPreview.tsx`. | Matches brief Section 19. | **DONE (Week 2)** |
| **Event Creation Engine** | Rebuilt `/create` with 4 participation models, creator campaign toggle, draft/publish controls. | Matches brief Section 14 & 21. | **DONE (Week 2)** |
| **Public Event Detail** | Dedicated public destination at `/events/[id]` with hero banner, host info, map preview, calendar export, and OpenGraph metadata. | Brief Section 13 public page. | **DONE (Week 3 - Days 1-2)** |
| **Social Proof & Action UI** | `AvatarStack`, `SaveButton`, `ShareButton`, `ExpandableEventCover` primitives with optimistic updates and fallbacks. | Matches brief Section 10 & 11. | **DONE (Week 3 - Days 1-2)** |
| **Event Participation CTAs**| Dynamic `EventPrimaryAction`, validated `RegistrationModal`, `CancelRsvpModal`, `MobileEventActionBar`, guest sign-in intent retention, and Milestone 2 test suite. | Matches brief Section 14 & 37. | **DONE (Week 3 - Days 1-4)** |
| **Connected Campaign Detail** | `/campaign/[slug]` has parent event banner, verified creator badge, updated participation copy, and RSVP funnel CTA. | Matches brief Section 4 & 15. | **DONE (Week 4 - Days 1-2)** |
| **Discover Experience** | Redesign `/discover` with search input, Nigerian city selector, date chips, and dual grid. | Matches brief Section 8-9 & 35. | **SCHEDULED (Week 4)** |
| **Organizer Dashboard** | Relocate organizer view to `/dashboard/events/[id]` with Overview, People, Campaigns, Settings tabs. | Matches brief Section 24-26. | **SCHEDULED (Week 5)** |
| **Saved System** | Implement `/saved` hub with tabs for Saved Events and Saved Campaigns. | Matches brief Section 17 & 33. | **SCHEDULED (Week 5)** |
| **Lifecycle Notifications** | Automated notifications for event date/venue updates, cancellations, and new campaigns. | Matches brief Section 27-29. | **SCHEDULED (Week 5)** |

---

## 2. Codebase Classification (Brief Section 60 Mandate)

Per Section 60 of the Development Brief, every existing asset is classified into: **KEEP**, **MODIFY**, **MOVE**, **DEPRECATE**, or **ADD**.

```
                  CODEBASE CLASSIFICATION (SECTION 60)
  ┌─────────────────────────────────────────────────────────────────┐
  │  KEEP      │ Fabric canvas engine, Campaign analytics, Base UI   │
  ├────────────┼─────────────────────────────────────────────────────┤
  │  MODIFY    │ campaigns, events schema, /discover, /campaign/[slug]│
  ├────────────┼─────────────────────────────────────────────────────┤
  │  MOVE      │ /events/[id] organizer view ──> /dashboard/events/[id]│
  ├────────────┼─────────────────────────────────────────────────────┤
  │  DEPRECATE │ Monolithic inline queries inside page files        │
  ├────────────┼─────────────────────────────────────────────────────┤
  │  ADD       │ /saved, AvatarStack, EventCard, RegistrationModal   │
  └─────────────────────────────────────────────────────────────────┘
```

### Classification Details

#### KEEP (Preserve without breaking)
1. **Fabric.js Graphic Generation** (`src/components/campaigns/campaign-builder.tsx`, `src/lib/campaigns/generate.ts`, `src/lib/campaigns/image.ts`): The core canvas-based image customization, drag/zoom adjustment, and generation work cleanly.
2. **Campaign Analytics Tracking** (`src/lib/campaigns/analytics.ts`, `src/app/events/[id]/campaigns/[campaignId]/analytics/page.tsx`, RPC functions `track_campaign_event`, `get_campaign_analytics`): Deep traffic attribution and generation stats are solid.
3. **Notification System Infrastructure** (`src/lib/notifications/*`, `src/components/notifications/*`, `src/app/notifications/page.tsx`): Preference center and bell notification feed function cleanly.
4. **Profile & Auth Management** (`src/app/login`, `src/app/signup`, `src/app/profile/edit`, `src/services/profile.service.ts`).

#### MODIFY (Refactor to align with product model)
1. **`src/app/campaign/[slug]/page.tsx`**: Add prominent parent event link (`For: [Event Title]`), creator info, participant counts, and replace hardcoded "Create your DP" with contextual action language (`Create from campaign` / `Create your version`).
2. **`src/app/discover/page.tsx`**: Break down the monolithic page into domain services. Add debounced search, location selection (Current location vs Nigerian cities vs Online), date quick-filters (`Today`, `This Weekend`, `This Week`), and separate sections for Recommended, Upcoming, and Campaigns.
3. **`src/components/home/EventCard.tsx` & `CampaignCard.tsx`**: Standardize data contracts to match Brief Sec 10 & 12 (including `SaveButton`, `AvatarStack`, parent event deep link, and dynamic primary action).

#### MOVE (Reposition for correct UX hierarchy)
1. **Organizer View from `/events/[id]` to `/dashboard/events/[id]`**: Current `/events/[id]` acts as an organizer campaign manager. Move this entire organizer experience to `/dashboard/events/[id]`.
2. **Reposition `/events/[id]` as Public Event Destination**: Turn `/events/[id]` into the **Public Event Detail Destination** (Brief Sec 13) displaying event cover, organizer info, date/time, venue with map preview, description, attendees avatar stack, campaigns list, and primary CTA.

#### DEPRECATE (Eliminate anti-patterns)
1. **Direct inline Supabase queries inside page components**: Move database calls out of large client pages into domain services (`src/services/events.service.ts`, `src/services/campaigns.service.ts`, `src/services/attendance.service.ts`, `src/services/discover.service.ts`).
2. **Generic "Participants" counting**: Stop incrementing or treating event attendance and campaign generation as the same metric.

#### ADD (Net new requirements)
1. **`/saved` Route (`src/app/saved/page.tsx`)**: User saved items page with tabs for `Events` and `Campaigns`.
2. **Reusable UI Components**:
   - `AvatarStack` (Social proof indicator with privacy compliance)
   - `SaveButton` (Optimistic event/campaign bookmarking)
   - `ShareButton` & Share Modal (Differentiated event vs campaign tracking)
   - `EventPrimaryAction` (Handling multi-tier primary CTAs)
   - `RegistrationModal` (Handling custom form registration and validation)
3. **Dedicated Organizer Views (`/dashboard/events/[id]`)**:
   - `OrganizerPeopleTab` (Strict distinction: Attendees vs Registrants vs Ticket Holders vs DP users)
   - `OrganizerCampaignsTab` (Manage linked campaigns)
   - `OrganizerSettingsTab` (Edit details, campaign toggles, safe cancellation flow)

---

## 3. Team Roles & Operating Model

### The 3-Person Team
1. **Sanaullah (Tech Lead & Project Supervisor)**:
   - Architecture enforcement, domain contract design, and Supabase RLS policy oversight.
   - Reviewing and merging daily pull requests from Uzair and Hardik.
   - Authoring and maintaining automated milestone verification suites (`scripts/verify-milestone*.ts`).
   - Integration testing, build validation (`npm run build`), and production release management.
2. **Uzair (Software Engineer - Core UI & Public Experiences)**:
   - Reusable UI primitives (`AvatarStack`, `SaveButton`, `ShareButton`, `EventCard`, `CampaignCard`).
   - Public Event Detail destination (`/events/[id]`).
   - Connected Campaign detail view and parent event banner (`/campaign/[slug]`).
   - Organizer Event Dashboard shell, Overview tab, and People tab (`/dashboard/events/[id]`).
3. **Hardik (Software Engineer - Services, State & Logic Engines)**:
   - Attendance service, state machine (`none`, `attending`, `registered`, `ticketed`), and `EventPrimaryAction`.
   - `RegistrationModal` form validation with dynamic custom questions (Zod schema).
   - Discover filter bar (`DiscoverFilterBar`), Nigerian tech hub selector, and `discover.service.ts` query engine.
   - Saved Hub (`/saved`), lifecycle notifications (date changes, cancellations), and visual polish.

### Daily 4-Hour Session Structure (4 Days / Week)
- **Hour 0:00 - 0:30 (Daily Sync & Interface Handshake)**:
  - 10-minute standup led by Sanaullah: review API contracts and shared TypeScript types in [src/types/](file:///home/sanaullah/Office-Work/Attend/src/types).
- **Hour 0:30 - 3:15 (Focused Feature Coding)**:
  - Uzair and Hardik work on their independent feature branches (`feat/w*-d*-feature-name`).
  - Sanaullah conducts continuous code reviews, writes verification scripts, and prepares test harnesses.
- **Hour 3:15 - 3:45 (Review, Merge & Test)**:
  - Uzair and Hardik open PRs to `main`.
  - Sanaullah reviews code, verifies tests, and merges to `main`.
- **Hour 3:45 - 4:00 (Checkpoint & Git Status)**:
  - Pull latest `main`, run `npm test` and `npm run build`, log daily checkpoint.

---

## 4. The Accelerated 5-Week Implementation Plan

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                 ACCELERATED 5-WEEK PROGRESSION ROADMAP                      │
├─────────┬─────────────────────────────────────────────────────────┬─────────┤
│ Week 1  │ Phase 0: Schema Evolution & Domain Foundation           │ DONE    │
├─────────┼─────────────────────────────────────────────────────────┼─────────┤
│ Week 2  │ Phase 1: Location Abstraction & Event Creation Engine   │ DONE    │
├─────────┼─────────────────────────────────────────────────────────┼─────────┤
│ Week 3  │ Phase 2: Public Event Destination & Attendance CTAs     │ 48 hrs  │
│         │ Uzair: Public Event Page & Primitives                   │         │
│         │ Hardik: Attendance Service, Dynamic CTAs & Modals       │         │
│         │ Sanaullah: Supervise, Integration Tests, Milestone 2 PRs│         │
├─────────┼─────────────────────────────────────────────────────────┼─────────┤
│ Week 4  │ Phase 3: Connected Campaigns & Discover Hub Redesign    │ 48 hrs  │
│         │ Uzair: Connected Campaign Detail & Parent Conversion    │         │
│         │ Hardik: Discover Filters, Multi-Location & Query Service│         │
│         │ Sanaullah: Supervise, Cross-linking, Milestone 3 PRs    │         │
├─────────┼─────────────────────────────────────────────────────────┼─────────┤
│ Week 5  │ Phase 4: Organizer Dashboard, Saved Hub & V1 Launch     │ 48 hrs  │
│         │ Uzair: /dashboard/events/[id] (Overview, People, Admin) │         │
│         │ Hardik: /saved Hub, Lifecycle Notifications, Polish     │         │
│         │ Sanaullah: Supervise, End-to-End Acceptance, V1 Release │         │
└─────────┴─────────────────────────────────────────────────────────┴─────────┘
```

---

### Week 1 - Phase 0: Schema Evolution & Domain Foundation
> **Status**: **COMPLETED (DONE)**  
> **Volume**: 16 hours · 1 person · Verified  
> **Deliverables Summary**:
> - Migration `20261005195800_v1_phase0_tables.sql`: Added `participation_model`, `participation_config`, `allow_participant_campaigns`, `place_id`, `saved_campaigns`, and `event_organizers`.
> - Migration `20261006171600_v1_phase0_attendance_schema.sql`: Separated event attendance from campaign participation with `participation_type`, `status`, and `registration_data`.
> - Migration `20261006171700_v1_phase0_indexes.sql`: High-performance indexes across foreign keys.
> - Migration `20261008154000_v1_phase0_data_integrity.sql`: Data backfill, orphaned campaign safeguards, and creator backfill into `event_organizers`.
> - Domain Services: Created `src/services/events.service.ts`, `src/services/campaigns.service.ts`, `src/services/attendance.service.ts`, and `src/services/saved.service.ts`.
> - Verification: `scripts/verify-milestone0.ts` passing 24/24 tests.

---

### Week 2 - Phase 1: Location Abstraction & Event Creation Engine
> **Status**: **COMPLETED (DONE)**  
> **Volume**: 16 hours · 1 person · Verified  
> **Deliverables Summary**:
> - Location Abstraction: Created `src/lib/location/types.ts` and `src/lib/location/provider.ts` with OpenStreetMap geocoding, 8 Nigerian tech hub presets (Lagos, Abuja, Port Harcourt, Ibadan, Enugu, Kano, Kaduna, Benin City), Haversine proximity calculations, and native directions URLs.
> - Components: Built `LocationPicker.tsx` (preset hub selector, manual coordinate override, online toggle) and `MapPreview.tsx` (OpenStreetMap embed and directions links).
> - Event Creation Upgrade: Rebuilt `src/app/create/page.tsx` with `ParticipationModelSelector` supporting all 4 models (Free, Registration, Paid, External), participant campaign toggle, and draft/publish states.
> - Documentation: Added complete project directory structure to `README.md` and added standard barrel exports across `src/types/`, `src/stores/`, `src/hooks/`, `src/components/`, and `src/lib/`.
> - Verification: 5 automated test suites (`scripts/verify-milestone1.ts`, etc.) passing 163/163 checks. Zero build or TypeScript errors.

---

### Week 3 - Phase 2: Public Event Destination & Attendance CTAs
**Focus**: Construct the public Event Detail page (`/events/[id]`), build shared UI primitives (`AvatarStack`, `SaveButton`, `ShareButton`), and wire up the dynamic 4-tier attendance state machine with registration dialogs.

> **Status Update**: Days 1 and 2 completed and verified. Days 3 and 4 reallocated below.

#### Days 1 & 2 (8 hrs) - Completed Core UI Primitives, Public Layout & RSVP Controller [DONE]
- **Completed Deliverables**:
  - `AvatarStack.tsx`: Overlapping avatar circles with fallback initials, verified attendee counts, and server-side preloading support.
  - `SaveButton.tsx` and `ShareButton.tsx`: Reusable optimistic bookmarking and native web sharing with `?src=event_share` tracking.
  - `ExpandableEventCover.tsx`: Clickable full-bleed event cover with keyboard Escape dismissal, body scroll lock, and high-contrast trigger positioning.
  - `src/app/actions/saved.ts`: Server action for saving events and campaigns with cache revalidation on `/saved` and `/profile`.
  - `src/components/home/EventCard.tsx`: Upgraded card design respecting real event participant counts.
  - `src/app/events/[id]/page.tsx`: Full public destination layout including organizer profile, `MapPreview` integration, Google Calendar and `.ics` download, connected campaigns gallery, and dynamic OpenGraph metadata via `generateMetadata`.
  - `src/app/actions/attendance.ts` and `EventPrimaryAction.tsx`: Server actions and dynamic primary CTA supporting one-click Free RSVP, cancelled state, external tickets, and paid links.

#### Day 3 (4 hrs) - Custom Question Registration Modal & Responsive Mobile Action Bar [DONE]
- **Completed Deliverables**:
  - `src/components/events/EventAttendanceProvider.tsx`: Shared React Context provider (`useEventAttendance`) synchronizing RSVP status, loading transitions, error handling, and modal triggers across desktop and mobile.
  - `src/components/events/CancelRsvpModal.tsx`: Accessible dialog (`role="alertdialog"`, `aria-modal="true"`) with keyboard focus trapping, Escape listener, body scroll locking, and focus restoration to trigger element.
  - `src/components/events/MobileEventActionBar.tsx`: Fixed mobile sticky action bar docked at `bottom-[calc(4rem+env(safe-area-inset-bottom))] md:bottom-0 lg:hidden` above `MobileNav`, with Save, Share, date snippet, and synchronized primary CTA.
  - `src/components/events/RegistrationModal.tsx`: Accessible dialog with responsive scrolling, real-time Zod validation, error indicators, submission loading spinners, and registration confirmation.
  - `src/lib/validations/registration.ts`: Dynamic Zod validation schemas for attendee details (`name`, `email`, `phone`, `organization`, `job_title`) and customizable questions.
  - `src/app/events/[id]/page.tsx`: Integrated `EventAttendanceProvider`, `CancelRsvpModal`, `RegistrationModal`, `MobileEventActionBar`, and scroll clearance (`pb-40 md:pb-24 lg:pb-12`).
  - `scripts/verify-day3.ts`: Unified automated verification suite passing 50/50 checks (`npm run verify:day3`).

#### Day 4 (4 hrs) - Guest Sign-In Retention Flow & Milestone 2 Automated Verification [DONE]
- **Completed Deliverables**:
  - **Uzair (Software Engineer)**:
    - `src/app/events/[id]/page.tsx`: Enhanced connected campaign cards with smooth lift, backdrop blur badges, hover scaling, and added creator empty states aligned with event organizer settings.
    - `scripts/verify-day4.ts`: Automated test suite for visual polish and creator states passing 14/14 checks (`npm run verify:day4`).
  - **Sanaullah (Tech Lead / Supervisor)**:
    - `src/lib/utils/guest-intent.ts`: Client-safe guest intent persistence and post-login URL construction helpers (`setGuestIntent`, `getGuestIntent`, `clearGuestIntent`, `buildLoginUrlWithIntent`, `parseGuestIntentFromSearch`).
    - `src/app/login/page.tsx`: Upgraded authentication form with safe `next` parameter resolution (preventing open redirect vulnerabilities) wrapped in a `Suspense` boundary.
    - `src/components/events/EventPrimaryAction.tsx` and `MobileEventActionBar.tsx`: Preserves intended attendee action (`attend` or `register`) across both desktop and mobile viewports when guest clicks attendance CTAs.
    - `src/components/events/EventAttendanceProvider.tsx`: Automatically resumes intended attendance or opens registration modal on return from `/login`, and cleans up intent query parameters via history replacement.
    - `scripts/verify-milestone2.ts`: Comprehensive Milestone 2 automated test suite covering all 4 participation tiers, `AvatarStack` calculations and privacy masking, `saved_events` persistence, dynamic OpenGraph metadata, guest intent retention, and zero em dashes passing 73/73 checks (`npm run verify:m2`).
    - `package.json`: Registered `verify:m2` and `verify:milestone2` npm scripts and added to unified `npm test`.
    - Merged `feat/w3-phase2-public-event-attendance` into `main` and verified production build passing 100%.

> **Week 3 Deliverables Checkpoint**:
> - Reusable `AvatarStack`, `SaveButton`, `ShareButton`, and `ExpandableEventCover` [DONE].
> - Rebuilt `EventCard` and dedicated Public Event Detail page at `/events/[id]` [DONE].
> - Dynamic `EventPrimaryAction` and attendance server actions [DONE].
> - Shared `EventAttendanceProvider` and synchronized real-time state [DONE].
> - Non-destructive `CancelRsvpModal` with focus trap and restoration [DONE].
> - Mobile sticky action bar `MobileEventActionBar` docked above mobile navigation [DONE].
> - Fully validated `RegistrationModal` with custom question support [DONE].
> - Day 3 automated test suite `verify-day3.ts` passing 50/50 checks [DONE].
> - Guest intent preservation [DONE].
> - Automated test suite `verify-milestone2.ts` passing 100% (73/73 checks) [DONE].

---

### Week 4 - Phase 3: Connected Campaigns & Discover Hub Redesign
**Focus**: Connect campaigns directly to parent events on `/campaign/[slug]`, build the conversion funnel (Campaign -> Event RSVP), overhaul `/discover` with search, city selection, date chips, and parallel query architecture.

#### Day 5 (4 hrs) - CampaignCard Upgrade & Discover Filter Bar
- **Sanaullah (Tech Lead / Supervisor)**:
  - Review data contracts for `CampaignCardProps` and `DiscoverFilters` [DONE].
  - Created centralized types in `src/types/campaigns.ts` and `src/types/discover.ts` with barrel exports [DONE].
  - Ensure campaign participation logic remains strictly isolated from event attendance (generating a DP does not make a user an event attendee) [DONE].
  - Added `checkCampaignAttendanceIsolation` domain guard to `src/services/campaigns.service.ts` [DONE].
  - Set up weekly parent branch `feat/w4-phase3-campaigns-discover` and feature branch `feat/sanaullah-w4-d1-contracts-isolation` [DONE].
  - Authored automated verification suite `scripts/verify-w4-d1.ts` (43/43 checks passing) [DONE].
- **Uzair (Software Engineer)**:
  - Rebuild `src/components/campaigns/CampaignCard.tsx` [DONE]:
    - Campaign template asset preview with high-definition rendering [DONE].
    - Campaign title and participant badge (`👥 18 participating`) [DONE].
    - **Explicit Parent Event Link**: `For: [Event Title]` with deep-link directly to `/events/[id]` [DONE].
    - Integrated `SaveButton` configured for `targetType: "campaign"` [DONE].
    - Primary CTA: `[ Create Version ]` or `[ Participate ]` [DONE].
- **Hardik (Software Engineer)**:
  - Build `src/components/discover/DiscoverFilterBar.tsx` [DONE]:
    - **Search Input**: Debounced search targeting event titles, descriptions, and organizers [DONE].
    - **Date Quick-Chips**: Horizontal pills for `[ All ]`, `[ Today ]`, `[ This Weekend ]`, `[ This Week ]`, `[ This Month ]` [DONE].
    - **Category Pills**: Dynamic category selector fetched from `event_categories` [DONE].

#### Day 6 (4 hrs) - Campaign Detail Parent Context & Location Dropdown
- **Sanaullah (Tech Lead / Supervisor)**:
  - Inspect query efficiency for location-based filtering (avoid PostGIS bloat; use bounding box and city matching per Brief Sec 19) [DONE].
  - Authored PostGIS-free spatial pruning and canonical city matching in `src/lib/location/bounding-box.ts` and integrated into `discover.service.ts` [DONE].
  - Review Fabric.js canvas builder integrity on `/campaign/[slug]` to ensure no regressions occur while adding the parent event header [DONE].
  - Authored canvas integrity guard assertions and layer schema validators in `src/lib/campaigns/canvas-integrity.ts` and integrated into `generate.ts` [DONE].
  - Authored automated verification suite `scripts/verify-w4-d2.ts` (44/44 checks passing) [DONE].
- **Uzair (Software Engineer)**:
  - Overhaul `src/app/campaign/[slug]/page.tsx` header [DONE]:
    - Display prominent parent event banner: *"Official Campaign for [Event Title] · [View Event Page]"* [DONE].
    - Display creator profile info and verified badge [DONE].
    - Update user-facing copy from legacy "Create your DP" to [DONE]:
      - *"Create from campaign"* [DONE]
      - *"Create your version"* [DONE]
      - *"Participate with this campaign"* [DONE]
- **Hardik (Software Engineer)**:
  - Build Location Filter Selector in `DiscoverFilterBar` [DONE]:
    - Option 1: *"Near Me"* (uses browser Geolocation API with graceful fallback) [DONE].
    - Option 2: Pre-selected Nigerian tech hubs (*Lagos*, *Abuja*, *Port Harcourt*, *Ibadan*, *Enugu*, *Kano*) [DONE].
    - Option 3: *"Online Events"* [DONE].
    - Option 4: *"All Locations"* [DONE].
  - Sync filter state cleanly with Next.js URL query parameters (`?q=...&city=...&date=...`) [DONE].

#### Day 7 (4 hrs) - Conversion Funnel CTA & Discover Query Engine
- **Sanaullah (Tech Lead / Supervisor)**:
  - Review the conversion funnel flow: Campaign Shared -> Viewed -> Participated -> Event RSVP (Brief Sec 16 & 20) [DONE].
  - Implemented conversion funnel routing helpers and share link builders in `src/lib/campaigns/funnel.ts` [DONE].
  - Wired `?src=campaign_funnel` one-click conversion routing from `CampaignResultActions` to `/events/[id]` and integrated arrival banner [DONE].
  - Updated `analytics.ts` and `campaign/[slug]/page.tsx` with `?src=campaign_share` tracking and modernized participation copy [DONE].
  - Review Supabase query performance and indexing in `discover.service.ts` [DONE].
  - Authored database migration `20261028140000_discover_query_performance_indexes.sql` establishing composite and secondary indexes across events, campaigns, and templates [DONE].
  - Optimized `discover.service.ts` with SQL query pushdowns and O(1) Map indexing for categories, profiles, and templates [DONE].
  - Authored automated verification suite `scripts/verify-w4-d3.ts` (49/49 checks passing) [DONE].
- **Uzair (Software Engineer)**:
  - Build post-generation funnel in `CampaignResultActions` [DONE]:
    - Download generated banner graphic ("Download Graphic") [DONE].
    - Social share buttons with source tracking (`?src=campaign_share`) [DONE].
    - **Conversion Funnel Banner**: *"Attending the event? [Go to Event Page to RSVP / Get Tickets]"* with one-click navigation to parent `/events/[id]` [DONE].
- **Hardik (Software Engineer)**:
  - Build `src/services/discover.service.ts` [DONE]:
    - Unified query builder taking `{ search, city, isOnline, dateRange, categoryId }` [DONE].
    - Implements deterministic ranking: Location match -> Category match -> Upcoming dates first (Brief Sec 35) [DONE].
    - Parallel fetching: Returns both matching events and active connected campaigns [DONE].

#### Day 8 (4 hrs) - Modular Discover Page & Milestone 3 Checkpoint
- **Sanaullah (Tech Lead / Supervisor)**:
  - Author and run automated verification suite `scripts/verify-milestone3.ts` (62/62 passing) [DONE]:
    - Tests Discover query filtering by city, date chip, and search keyword [DONE].
    - Tests Campaign page parent event linking and copy alignment [DONE].
    - Tests campaign generation analytics isolation from event attendance [DONE].
  - Author Milestone 3 verification suite, reconcile production notification changes, and verify clean production build [DONE].
- **Uzair (Software Engineer)**:
  - Refactor `src/app/discover/page.tsx` into modular dual-grid layout [DONE]:
    - Section 1: **Upcoming Events** (responsive grid of standard `EventCard` components) [DONE].
    - Section 2: **Featured Campaigns** (responsive grid of standard `CampaignCard` components) [DONE].
    - Section 3: Clean empty states with "Clear Filters" action [DONE].
- **Hardik (Software Engineer)**:
  - Build loading skeleton components (`EventCardSkeleton`, `CampaignCardSkeleton`) for smooth SSR streaming [DONE].
  - Implement browser geolocation distance sorting helper in `discover.service.ts` [DONE].

> **Week 4 Deliverables Checkpoint**:
> - Rebuilt `CampaignCard` with parent event deep-links.
> - Refactored `/campaign/[slug]` with parent event banner and conversion funnel.
> - High-performance `/discover` page with search, city selector, date chips, and dual grids.
> - Automated test suite `verify-milestone3.ts` passing 100% (62/62 checks).

---

### Week 5 - Phase 4: Organizer Event Dashboard, Saved Hub & V1 Launch
**Focus**: Move the organizer experience to `/dashboard/events/[id]`, build the dedicated `/saved` hub, connect lifecycle notifications, execute end-to-end acceptance verification (Section 58), and prepare production release.

#### Day 9 (4 hrs) - Dedicated Organizer Shell & Saved Hub Foundation
- **Sanaullah (Tech Lead / Supervisor)**:
  - Set up weekly parent branch `feat/w5-phase4-organizer-saved-launch` and remote tracking [DONE].
  - Resolve Supabase quota exhaustion via AvatarStack attendee caching, deduplication, and browser client singleton [DONE].
  - Implement automated Supabase database migration CI/CD workflows (`db-migration-ci.yml`, `db-migration-deploy.yml`) with zero-downtime view recreation [DONE].
  - Enforce access control for organizer routes: Verify viewer is event creator or present in `event_organizers` table.
  - Review RLS security policies for organizer dashboard queries.
- **Uzair (Software Engineer)**:
  - Build `src/app/dashboard/events/[id]/page.tsx` layout and shell:
    - Event Header: Title, status badge (`Draft`, `Published`, `Cancelled`), and quick-link to public `/events/[id]`.
    - 4-Tab Navigation: `[ Overview ]`, `[ People ]`, `[ Campaigns ]`, `[ Settings ]`.
    - Overview Tab: Quick stats cards (Total Attendees, Registrations, Connected Campaigns, Total DP Generations).
- **Hardik (Software Engineer)**:
  - Build `src/app/saved/page.tsx`:
    - Dual Tabs: `[ Saved Events ]` and `[ Saved Campaigns ]`.
    - Fetches data from `saved_events` and `saved_campaigns` via `saved.service.ts`.
    - Renders grids of standard `EventCard` and `CampaignCard` with active bookmark state.
    - Helpful empty state with CTA to `/discover`.

#### Day 10 (4 hrs) - Organizer "People" Tab & Lifecycle Notifications
- **Sanaullah (Tech Lead / Supervisor)**:
  - Review data separation in the People tab to ensure Attendee records never conflate with Campaign generation counts.
  - Verify notification payload structures and delivery in the database.
- **Uzair (Software Engineer)**:
  - Build `OrganizerPeopleTab.tsx`:
    - Sub-tabs: `Attendees` | `Registrants` | `Ticket Holders` | `Campaign Participants`.
    - Responsive table showing Name, Avatar, Registration Date, Status, and Custom Question responses.
    - One-click CSV export helper for event rosters.
- **Hardik (Software Engineer)**:
  - Connect Event Lifecycle changes to Notification Engine:
    - Event update trigger: When organizer changes date, time, or location, dispatch in-app notifications to all confirmed attendees.
    - Campaign creation trigger: When a participant creates a campaign under the event, notify the organizer.
    - Registration confirmation: Emits in-app receipt when user completes registration.

#### Day 11 (4 hrs) - Organizer "Campaigns", "Settings" & Safe Cancellation
- **Sanaullah (Tech Lead / Supervisor)**:
  - Review the Event Cancellation safeguards (Brief Sec 29):
    - Sets `event.status = 'cancelled'`.
    - Attaches parent-cancelled banner to connected campaigns without deleting user assets.
    - Dispatches urgent in-app notification to all confirmed attendees.
- **Uzair (Software Engineer)**:
  - Build `OrganizerCampaignsTab.tsx`:
    - List all campaigns attached to this event.
    - Actions: *Create New Campaign*, *Edit Template*, *Pause/Publish*, and *View Analytics* deep link.
  - Build `OrganizerSettingsTab.tsx`:
    - Edit event details (title, dates, location).
    - Toggle participant campaign permissions (`allow_participant_campaigns`).
    - Cancel Event flow with confirmation modal and attendee warning.
- **Hardik (Software Engineer)**:
  - Polish visual design, micro-animations, and theme harmony:
    - Smooth card hover lift transitions and glassmorphism headers.
    - Dark/light mode contrast checks.
    - Mobile bottom navigation dock and touch-friendly button targets.

#### Day 12 (4 hrs) - End-to-End Acceptance Verification & V1 Sign-Off
- **Sanaullah (Tech Lead / Supervisor)**:
  - Run comprehensive verification suite against Section 58 Acceptance Criteria:
    - `npm test`: Runs `verify:m0`, `verify:m1`, `verify:m2`, `verify:m3`, and `verify:m4`.
    - TypeScript compilation (`npx tsc --noEmit`): 0 errors.
    - Production build (`npm run build`): All routes prerender cleanly.
  - Conduct final PR review, merge to `main`, tag `v1.0.0-release`, and deploy to production environment.
- **Uzair (Software Engineer)**:
  - Cross-device QA audit: Test full flows on iPhone, Android, tablet, and desktop viewports.
  - Validate image upload constraints and canvas generation exports.
- **Hardik (Software Engineer)**:
  - Cross-browser QA audit: Test Chrome, Safari, Firefox, and Edge.
  - SEO validation: Verify dynamic OpenGraph meta tags, Twitter cards, and structured JSON-LD data for events.

> **Week 5 Deliverables Checkpoint**:
> - Fully operational Organizer Dashboard at `/dashboard/events/[id]`.
> - Working `/saved` Hub for independent event and campaign bookmarks.
> - Automated lifecycle notifications for event changes and cancellations.
> - Full compliance with Section 58 Acceptance Criteria.
> - Production-ready Attend V1 platform signed off and launched.

---

## 5. Acceptance Criteria Verification Matrix (Brief Section 58)

Every item in Section 58 of the specification is mapped to its implementing milestone, responsible owner, and automated verification check:

| Section | Acceptance Requirement | Accelerated Milestone | Responsible Owner | Verification Check |
| :--- | :--- | :--- | :--- | :--- |
| **Discovery** | Open Discover | Week 4 (Day 8) | Hardik & Uzair | `/discover` loads instantly with SSR skeletons. |
| | Search events | Week 4 (Day 5) | Hardik | Debounced input filters titles and descriptions. |
| | Select location | Week 4 (Day 6) | Hardik | Switching to "Lagos" or "Online" filters grid. |
| | Filter basic events | Week 4 (Day 5) | Hardik | Date chips ("This Weekend") constrain date ranges. |
| | See event cards | Week 3 (Day 2) | Uzair | Cards render image, category, date, venue, AvatarStack. |
| | See social indicators | Week 3 (Day 1) | Uzair | `AvatarStack` renders verified attendee count/avatars. |
| | Open an event | Week 3 (Day 3) | Uzair | Clicking card navigates to public `/events/[id]`. |
| **Event** | Understand event | Week 3 (Day 3) | Uzair | Header, host profile, description, details grid rendered. |
| | See date/time/location | Week 3 (Day 3) | Uzair | Formatted date/time with calendar export link. |
| | View map / location | Week 2 & 3 | Uzair & Sanaullah | `MapPreview` shows venue and opens native directions. |
| | Save event | Week 3 (Day 1) | Uzair & Hardik | Bookmark toggles save in `saved_events`. |
| | Share event | Week 3 (Day 1) | Uzair | Native share with `?src=event_share` tracking. |
| | Attend / Register / Ticket | Week 3 (Day 2 & 3) | Hardik | Dynamic CTA triggers correct flow per config. |
| **Campaign** | Discover campaign | Week 4 (Day 8) | Uzair & Hardik | Campaigns grid displayed on `/discover`. |
| | Open campaign | Week 4 (Day 6) | Uzair | `/campaign/[slug]` loads template and settings [DONE]. |
| | Connected parent event | Week 4 (Day 6) | Uzair | Prominent banner links directly to parent event [DONE]. |
| | Participate where allowed | Week 4 (Day 7) | Uzair | Photo adjustment, canvas generation, and download [DONE]. |
| | Share campaign | Week 4 (Day 7) | Uzair | Share modal tracks campaign source platform [DONE]. |
| | Navigate to event | Week 4 (Day 7) | Uzair | Conversion banner routes user to event RSVP [DONE]. |
| **Organizer** | Create event & location | Week 2 (Day 7) | Completed (W2) | Structured coordinates and Nigerian hub presets saved. |
| | Configure participation | Week 2 (Day 7) | Completed (W2) | Sets Free, Registration, Paid, or External. |
| | Configure campaign toggle | Week 2 (Day 7) | Completed (W2) | Sets `allow_participant_campaigns` ON/OFF. |
| | Create campaign | Week 5 (Day 11) | Uzair | Launches campaign builder attached to event. |
| | View people distinction | Week 5 (Day 10) | Uzair & Hardik | Separates Attendees vs Registrants vs DP users. |
| | View analytics | Week 5 (Day 11) | Uzair | Direct deep-link to campaign analytics dashboard. |
| **Notifications** | Event updates | Week 5 (Day 10) | Hardik | Venue/time updates notify confirmed attendees. |
| | Campaign updates | Week 5 (Day 10) | Hardik | New campaign creation alerts organizer. |
| | Registration receipt | Week 3 & 5 | Hardik | Confirmation appears in notification bell feed. |

---

## 6. Architectural Guardrails & What NOT to Build in V1 (Brief Sec 36)

To protect the accelerated 5-week timeline, the following remain strictly out of scope for V1:
- ❌ **No full social network or follower graphs** (Use `AvatarStack` social proof only).
- ❌ **No complex recommendation AI engine** (Use deterministic ranking: location + category + upcoming dates).
- ❌ **No integrated credit card processing gateway** (Use external ticket links or ticket tier displays for V1).
- ❌ **No complex moderation dashboard** (Simple report action and organizer toggle suffice).
- ❌ **No geospatial PostGIS extensions** (Use simple bounding box and city presets).
- ❌ **No recurring events or multi-session engine** (Keep single start and end dates).
- ❌ **No waitlists or QR code check-in scanners** (V2 roadmap items).

---

## 7. Daily Git & Collaboration Workflow

1. **Branch Naming Convention**:
   - Uzair: `feat/uzair-w[week]-d[day]-[feature-name]` (e.g. `feat/uzair-w3-d1-avatar-stack`)
   - Hardik: `feat/hardik-w[week]-d[day]-[feature-name]` (e.g. `feat/hardik-w3-d1-attendance-service`)
2. **Commit Messages**: Clean conventional commits (`feat:`, `fix:`, `refactor:`, `test:`).
3. **Daily Pull Requests**:
   - Uzair and Hardik push daily branches and open PRs targeting `main`.
   - Sanaullah conducts code reviews, tests locally, runs verification scripts, and merges to `main`.
   - All 3 developers pull `main` at the start of every session to maintain clean synchronization.
