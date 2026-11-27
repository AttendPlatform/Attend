# Attend: Smart Notification & Engagement System - Architecture Audit & Implementation Plan

> **Based on**: *Attend - Smart Notification & Engagement System (Updated Product & Technical Brief)*  
> **Reference Plan**: [docs/v1_implementation_plan.md](docs/v1_implementation_plan.md)  
> **Contribution Guide**: [CONTRIBUTING.md](CONTRIBUTING.md)  
> **Cadence**: 4 hours/day · 4 days/week (16 hours/week · Solo Engineering Execution)  
> **Ownership**: Single-engineer full-stack execution across weekly parent branches (`feat/w1-*`, `feat/w2-*`, `feat/w3-*`), Supabase schema migrations, SQL RPCs, RLS policies, domain services, UI/UX components, and automated verification suites (`scripts/smart-notifications/week*/verify-sn-*.ts`).  
> **Timeline**: Week 1 (Days 1-4, Completed) · Week 2 (Days 5-8, Completed) · Week 3 (Days 9-12, 16 hours)

---

## 1. Executive Summary & Architectural Vision

Attend's Smart Notification & Engagement System transforms the existing notification infrastructure into a unified retention, discovery, and conversion engine while strictly respecting user privacy and preventing notification fatigue.

### Core Architectural Principles
1. **Single Unified Account Model (Relationship-Based Eligibility)**:
   - Attend uses one account for both event attendees and organizers.
   - Notification eligibility is determined dynamically by the user's **relationship to an event or activity** (`event_participants` for attendees/registrants/ticket holders, `events.creator_id` and `event_organizers` for organizers, `campaigns.creator_id` for campaign owners, and `user_connections` for social discovery), never by static account-type classification.
2. **Three Connected, Strictly Decoupled Engines**:
   - **Smart Notification Engine** (`src/lib/notifications/engine.ts` + Supabase RPCs): Decides *who* receives a notification, *what* format they receive, *when* they receive it (respecting timezone quiet hours and schedules), and *through which channel* (`in_app`, `push`, or `email`).
   - **Promotion Engine** (`src/services/promotions.service.ts`): Manages platform-admin Featured Events and Home/Discover Promotional Banners with independent scheduling, audience targeting, and impression/click lifecycles.
   - **Social Discovery Engine** (`src/services/social-discovery.service.ts`): Manages explicit opt-in contact discovery, server-side HMAC-protected identifier matching, granular attendance visibility (`public`, `connections`, `private`), and friend-attending indicators/notifications.

```
┌───────────────────────────────────────────────────────────────────────────────────┐
│                     UNIFIED ACCOUNT & RELATIONSHIP CONTEXT                        │
│   Attendee / Registrant  ·  Event Organizer  ·  Campaign Creator  ·  Admin        │
└─────────────────┬─────────────────────────┬─────────────────────────┬─────────────┘
                  │                         │                         │
                  ▼                         ▼                         ▼
┌─────────────────────────────┐ ┌───────────────────────┐ ┌─────────────────────────┐
│  1. SMART NOTIFICATION      │ │  2. PROMOTION         │ │  3. SOCIAL DISCOVERY    │
│     ENGINE                  │ │     ENGINE            │ │     ENGINE              │
│  (engine.ts + SQL RPCs)     │ │  (promotions.service) │ │  (social.service)       │
├─────────────────────────────┤ ├───────────────────────┤ ├─────────────────────────┤
│ · Relationship Resolution   │ │ · Featured Events     │ │ · Explicit Opt-In Modal │
│ · Preference & Privacy Gate │ │ · Priority Tiers      │ │ · E.164 Normalization   │
│ · Deduplication & Freq Cap  │ │ · Audience Targeting  │ │ · HMAC-SHA256 Matching  │
│ · Timezone Quiet Hours      │ │ · Home/Discover Slots │ │ · Attendance Visibility │
│ · Scheduled Promotion       │ │ · Responsive Banners  │ │   (Public/Conn/Private) │
│ · Visual Popup Queue        │ │ · Impression & Click  │ │ · Friend-Attending      │
│ · Abandoned-Action Recovery │ │   Tracking (Separate) │ │   Badges & Triggers     │
└─────────────────────────────┘ └───────────────────────┘ └─────────────────────────┘
```

### The 12-Step Central Smart Notification Pipeline
Every notification across all 8 presentation formats (`text`, `image_popup`, `featured_event`, `banner` [via its own lifecycle], `social`, `reminder`, `organizer_insight`, `system_announcement`) flows through:

```
[1. Business Event / Scheduled Trigger] ──► [2. Recipient Resolution] ──► [3. Eligibility Checks]
                                                                                   │
[6. Deduplication (dedupe_key)] ◄── [5. Relevance Evaluation] ◄── [4. Preference & Privacy Checks]
         │
         ▼
[7. Daily Frequency Caps] ──► [8. Priority Evaluation] ──► [9. Timezone Quiet-Hour Handling]
                                                                           │
[12. Analytics & Feedback] ◄── [11. Multi-Channel Delivery] ◄── [10. Channel Selection]
```

---

## 2. Existing Codebase Audit & Classification Matrix

Every existing file, table, and database function in the repository has been audited and classified into **KEEP**, **MODIFY**, or **ADD**:

### 2.1 Frontend & Backend Files

| Existing / Target File | Current Implementation | Classification | Planned Engineering Action |
| :--- | :--- | :--- | :--- |
| [src/lib/campaigns/analytics.ts](src/lib/campaigns/analytics.ts) | Campaign analytics & `track_campaign_event` RPC calls | **KEEP (LOCKED)** | **Non-negotiable**: Preserve 100% untouched. Never modify either `track_campaign_event` overload. |
| [src/components/notifications/NotificationBell.tsx](src/components/notifications/NotificationBell.tsx) | Bell icon, unread badge, and single toast mount | **KEEP & EXTEND** | Connect to FIFO visual `toastQueue`, add active-flow interruption guard (`/create`, `/campaign/[slug]`, open modals), and track popup impressions/dismissals. |
| [src/components/notifications/NotificationDropdown.tsx](src/components/notifications/NotificationDropdown.tsx) | Recent notifications dropdown with `Mark all read` | **KEEP & EXTEND** | Preserve `Mark all read` (never add `Clear all`). Add thumbnail preview for visual notifications and recovery CTA badges. |
| [src/components/notifications/NotificationToast.tsx](src/components/notifications/NotificationToast.tsx) | Basic text-only in-app toast | **MODIFY** | Upgrade to render both standard text toasts and **Pinterest-style visual event popups** (cover image, gradient fallback, `why_recommended` badge, `Date · City`, CTA, and dismiss). |
| [src/lib/notifications/types.ts](src/lib/notifications/types.ts) | Basic `Notification` type (`"read" \| "unread"`) | **MODIFY** | Expand `NotificationStatus` to cover all DB states (`unread`, `read`, `scheduled`, `sent`, `suppressed`, `expired`, `dismissed`) and add presentation format, visual, and recovery contracts. |
| [src/lib/notifications/client.ts](src/lib/notifications/client.ts) | Client RPC wrappers (`getNotifications`, `markRead`) | **KEEP & EXTEND** | Add `dismissNotification()`, `recordNotificationInteraction()` (`impression`, `click`, `dismiss`), and category filtering. |
| [src/lib/notifications/engine.ts](src/lib/notifications/engine.ts) | Campaign milestone dispatch & `sendPushNotification` | **MODIFY (CENTRALIZE)** | Make `dispatchSmartNotification()` the single server-side entry point for all notifications; gate Web Push so `status = 'scheduled'` or `'suppressed'` rows do not fire premature pushes; add rich image push payloads. |
| [src/services/notifications.service.ts](src/services/notifications.service.ts) | Event lifecycle dispatches with raw `.insert()` fallback | **MODIFY** | **Remove unsafe direct `.from("notifications").insert()` fallback** (lines 61-73) that bypasses preferences, deduplication, and quiet hours; route all lifecycle dispatches through `engine.ts`. |
| [src/stores/useNotificationsStore.ts](src/stores/useNotificationsStore.ts) | Zustand store + Realtime `postgres_changes` listener | **MODIFY** | Fix bug where Realtime `INSERT` of `status = 'scheduled'` rows immediately pops a toast and increments `unreadCount`; handle `'scheduled' -> 'unread'` transitions on `UPDATE`; manage FIFO `toastQueue` and 7-day dismissal suppression. |
| [src/hooks/useNotifications.ts](src/hooks/useNotifications.ts) | React hook wrapping `useNotificationsStore` | **KEEP & EXTEND** | Expose queue controls, dismissal handlers, and category filter state. |
| [src/app/notifications/page.tsx](src/app/notifications/page.tsx) | Notification center page | **KEEP & EXTEND** | Add category filter tabs (`All`, `Events`, `Campaigns`, `Reminders`, `Social`), render event cover thumbnails, and display active draft recovery cards. |
| [src/app/settings/notifications/page.tsx](src/app/settings/notifications/page.tsx) | Notification preferences & quiet hours UI | **KEEP & EXTEND** | Add auto-detected `timezone` selector, `abandoned_reminders_enabled` toggle, daily frequency cap selector, and **Social & Attendance Privacy Controls** (`Public`, `Connections`, `Private`). |
| [worker/index.ts](worker/index.ts) | Service worker `push` and `notificationclick` | **MODIFY** | Render `image` in `showNotification()`, support action buttons, append `?src=push_notification` attribution, and preserve same-origin navigation security. |
| [src/app/create/page.tsx](src/app/create/page.tsx) | 3-step event creation form | **KEEP & EXTEND** | Persist meaningful unfinished drafts (`abandoned_actions`), support `?resumeDraft=<id>` state restoration, and auto-suppress reminders on publish/delete. |
| [src/components/events/RegistrationModal.tsx](src/components/events/RegistrationModal.tsx) | Event registration dialog | **KEEP & EXTEND** | Save incomplete registration progress if closed after meaningful input, and support `?resumeRegistration=1` auto-resume on `/events/[id]`. |
| [src/app/page.tsx](src/app/page.tsx) & [src/components/HomeDiscover.tsx](src/components/HomeDiscover.tsx) | Home page & discovery sections | **MODIFY** | Add predefined `PromotionalBannerSlot`, `FeaturedEventsSection`, and `FriendsAttendingBadge` social indicators. |
| [src/app/discover/page.tsx](src/app/discover/page.tsx) & [src/components/discover/DiscoverHub.tsx](src/components/discover/DiscoverHub.tsx) | Discover hub | **MODIFY** | Add predefined Discover `PromotionalBannerSlot`, `FeaturedEventsSection`, and social discovery indicators. |
| `src/services/abandoned-actions.service.ts` | *New Domain Service* | **ADD** | Track unfinished event drafts, campaign drafts, and incomplete registrations; verify live eligibility/payment state; dispatch 24h/72h helpful reminders. |
| `src/services/promotions.service.ts` | *New Domain Service* | **ADD** | Manage Featured Events, Home/Discover Promotional Banners, audience targeting, and decoupled banner impression/click analytics. |
| `src/services/social-discovery.service.ts` | *New Domain Service* | **ADD** | Manage opt-in contact consent, E.164 normalization, server-side HMAC-SHA256 matching, connection graph, and friend-attending queries/notifications. |
| `src/app/admin/promotions/page.tsx` | *New Admin Dashboard* | **ADD** | Platform-admin console with 4 tabs: `Featured Events`, `Promotional Banners`, `Recovery & Social Rules`, and `Broadcasts & Analytics`. |

### 2.2 Database Tables & RPC Functions

| Database Structure | Status | Planned Engineering Action |
| :--- | :--- | :--- |
| `notifications` | **REUSE & EXTEND** | Add `image_url`, `image_alt`, `presentation_format`, `why_recommended`, `dismissed_at`, and delivery retry metadata. |
| `notification_preferences` | **REUSE & EXTEND** | Add `timezone` (`DEFAULT 'Africa/Lagos'`), `abandoned_reminders_enabled` (`DEFAULT true`), `social_notifications_enabled` (`DEFAULT true`), and `max_daily_notifications` (`DEFAULT 5`). |
| `notification_events` | **REUSE** | Record `impression`, `click`, `dismiss`, `Suppressed`, and deduplication audit trail via `record_notification_event`. |
| `notification_templates` | **REUSE & SEED** | Populate canonical templates for lifecycle, visual recommendations, featured events, abandoned recovery, and social attendance; allow admin template editing. |
| `push_subscriptions` & `send-push` | **REUSE** | Preserve existing VAPID flow and Edge Function; pass optional `image` and `actionLabel` in payload. |
| `campaign_analytics` & `track_campaign_event` | **PRESERVE** | Keep both `track_campaign_event` overloads and `get_campaign_analytics` 100% untouched. |
| `abandoned_actions` | **ADD (Migration W1)** | Tracks `user_id`, `action_type` (`event_draft`, `campaign_draft`, `incomplete_registration`, `incomplete_profile`), `event_id`, `campaign_id`, `draft_payload`, `resume_url`, `last_progressed_at`, `reminder_stage`, and `status` (`active`, `recovered`, `completed`, `dismissed`, `suppressed`). |
| `featured_events` | **ADD (Migration W2)** | Tracks platform-promoted events (`event_id`, `priority`, `promotional_message`, `promotional_image_url`, `target_audience`, `notification_mode`, `placement`, `start_at`, `end_at`, `status`, `views_count`, `clicks_count`, `created_by`). |
| `promotional_banners` & `banner_analytics` | **ADD (Migration W2)** | Tracks frontend banners (`title`, `description`, `image_url`, `mobile_image_url`, `desktop_image_url`, `cta_label`, `destination_url`, `placement`, `priority`, `targeting_rules`, `start_at`, `end_at`, `status`) and separate impression/click records. |
| `user_contact_identifiers` & `user_connections` | **ADD (Migration W2)** | Stores HMAC-SHA256 protected phone/email identifiers for opted-in users and matched connection pairs (`user_id`, `connected_user_id`, `source`). |
| `admin_notification_settings` & `admin_audit_logs` | **ADD (Migration W2)** | Stores admin trigger toggles (enable/disable social or recovery triggers, configure reminder delays/caps) and full audit logs for all admin actions and broadcasts. |

---

## 3. Operating Model, Branching Strategy & 4-Hour Daily Routine

All work strictly follows the workflow defined in [CONTRIBUTING.md](CONTRIBUTING.md):

```
main (Production Ready - Protected)
  ▲
  │ (Weekly Milestone PR merged at end of each week)
  │
feat/w1-smart-notifications-foundation (Week 1 Parent Branch - Completed)
feat/w2-promotions-banners-admin       (Week 2 Parent Branch - Completed, Days 5-8)
feat/w3-social-discovery-release       (Week 3 Parent Branch - 16 hours, Days 9-12)
```

### Solo 4-Hour Daily Execution Model
- Each weekly parent branch is cut from `main` at the start of the week.
- Each working day is scoped to **4 hours** of focused, end-to-end work (schema/contracts, service logic, UI integration, and verification) with atomic commits pushed directly to the active weekly parent branch (or short-lived daily sub-branches merged into it).
- At the end of Day 4 of each week, the weekly parent branch is verified with `npm test`, `npx tsc --noEmit`, and `npm run build` before merging into `main`.

### Daily 4-Hour Session Schedule (4 Days/Week · 16 Hours/Week)

| Time | Duration | Activity |
| :--- | :--- | :--- |
| **0:00 - 0:20** | 20 mins | **Checkpoint & Contract Review**: Review previous day's commits, verify DB/type contracts, and confirm the day's 4-hour scope. |
| **0:20 - 3:20** | 3 hrs | **Focused Implementation**: Build schema/RPCs, domain services, and UI deliverables in atomic, single-purpose commits. |
| **3:20 - 3:45** | 25 mins | **Verification & Build Check**: Run `npm test`, `npx tsc --noEmit`, `npm run build`, and daily verification scripts (`scripts/smart-notifications/week*/verify-sn-*.ts`). |
| **3:45 - 4:00** | 15 mins | **End-of-Day Checkpoint**: Push verified commits to the weekly parent branch and update plan checkboxes. |

---

## 4. Week 1 Roadmap: Notification Foundation, Abandoned Recovery & Visual Popups

> **Weekly Parent Branch**: `feat/w1-smart-notifications-foundation` (Cut from `main`) [DONE]  
> **Status**: Completed  
> **Week 1 Goal**: Unify and harden the central smart notification engine (relationship-based eligibility, deduplication, frequency caps, timezone-aware quiet hours, and scheduled notification promotion), ship non-invasive abandoned-action recovery (organizer drafts + incomplete attendee registrations), and launch Pinterest-style visual event popups across in-app and Web Push.

---

### Day 1 (4 Hours/Dev) - Schema Foundation, Shared Contracts & Unified Smart Engine

#### Schema & Shared Contracts [DONE]
1. **Create Weekly Parent Branch** [DONE]:
   ```bash
   git checkout main && git pull origin main
   git checkout -b feat/w1-smart-notifications-foundation
   git push -u origin feat/w1-smart-notifications-foundation
   ```
2. **Author Week 1 Database Migration** (`supabase/migrations/20261110100000_smart_notifications_foundation.sql`) [DONE]:
   - Extend `public.notifications` table:
     - `image_url TEXT`, `image_alt TEXT`
     - `presentation_format TEXT NOT NULL DEFAULT 'text'` (`CHECK (presentation_format IN ('text', 'image_popup', 'featured_event', 'banner', 'social', 'reminder', 'organizer_insight', 'system_announcement'))`)
     - `why_recommended TEXT`
     - `dismissed_at TIMESTAMPTZ`
     - `retry_count INT NOT NULL DEFAULT 0`, `delivery_error TEXT`
   - Extend `public.notification_preferences` table:
     - `timezone TEXT NOT NULL DEFAULT 'Africa/Lagos'`
     - `abandoned_reminders_enabled BOOLEAN NOT NULL DEFAULT true`
     - `social_notifications_enabled BOOLEAN NOT NULL DEFAULT true`
     - `max_daily_notifications INT NOT NULL DEFAULT 5`
   - Seed `public.notification_templates` with canonical templates (`event_reminder_24h`, `event_reminder_2h`, `event_update`, `event_cancelled`, `registration_receipt`, `campaign_created`, `campaign_milestone`, `abandoned_event_draft`, `abandoned_campaign_draft`, `abandoned_registration`, `featured_event_visual`, `friend_attending`).
   - Create `public.abandoned_actions` table:
     - Columns: `id UUID PRIMARY KEY`, `user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE`, `action_type TEXT NOT NULL` (`'event_draft' | 'campaign_draft' | 'incomplete_registration' | 'incomplete_profile' | 'unfinished_event_edit'`), `event_id UUID REFERENCES events(id) ON DELETE CASCADE`, `campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE`, `draft_title TEXT`, `draft_payload JSONB NOT NULL DEFAULT '{}'::jsonb`, `resume_url TEXT NOT NULL`, `last_progressed_at TIMESTAMPTZ NOT NULL DEFAULT now()`, `reminder_stage INT NOT NULL DEFAULT 0`, `last_reminded_at TIMESTAMPTZ`, `recovered_at TIMESTAMPTZ`, `status TEXT NOT NULL DEFAULT 'active'` (`'active' | 'recovered' | 'completed' | 'dismissed' | 'suppressed'`), `created_at TIMESTAMPTZ`, `updated_at TIMESTAMPTZ`.
     - Unique constraint on `(user_id, action_type, COALESCE(event_id, '00000000-0000-0000-0000-000000000000'::uuid), COALESCE(campaign_id, '00000000-0000-0000-0000-000000000000'::uuid))` so progress updates upsert cleanly.
     - Enable RLS with strict `user_id = (SELECT auth.uid())` policies for `SELECT`, `INSERT`, `UPDATE`, `DELETE`.
3. **Publish Shared TypeScript Contracts** (`src/types/notifications.ts`, update [src/lib/notifications/types.ts](src/lib/notifications/types.ts), [src/types/index.ts](src/types/index.ts), and [src/lib/supabase/database.types.ts](src/lib/supabase/database.types.ts)) [DONE]:
   - Define `NotificationStatus = "unread" | "read" | "scheduled" | "sent" | "suppressed" | "expired" | "dismissed"`.
   - Define `NotificationPresentationFormat`, `NotificationPriority`, `SmartNotificationInput`, `VisualNotificationPayload`, and `AbandonedActionRecord`.
4. **Author Day 1 Verification Suite** [DONE]: Create `scripts/smart-notifications/week1/verify-sn-w1-d1.ts` verifying schema additions, shared contracts, status filtering, and removal of the unsafe raw-insert fallback.
5. **Day 1 Integration** [DONE]: Integrate Day 1 state, UI, and smart engine deliverables into `feat/w1-smart-notifications-foundation`.

#### Notification State & UI Alignment [DONE]
- **Deliverables**:
  1. Update [src/stores/useNotificationsStore.ts](src/stores/useNotificationsStore.ts):
     - Fix Realtime `INSERT` handler: Only prepend to `notifications`, increment `unreadCount`, or queue `latestNotification` when `payload.new.status === "unread" || payload.new.status === "sent"`. Ignore rows inserted with `status = "scheduled"`, `"suppressed"`, `"expired"`, or `"dismissed"`.
     - Update Realtime `UPDATE` handler: When a row transitions from `status = "scheduled"` to `status = "unread"` (promoted when due), prepend it to `notifications`, increment `unreadCount`, and enqueue it for toast display.
     - Add client-side deduplication by `id` and `dedupe_key` so rapid realtime updates never trigger duplicate toasts.
  2. Update [src/lib/notifications/client.ts](src/lib/notifications/client.ts), [src/components/notifications/NotificationDropdown.tsx](src/components/notifications/NotificationDropdown.tsx), and [src/app/notifications/page.tsx](src/app/notifications/page.tsx):
     - Add `dismissNotification(notificationId)` and `recordNotificationInteraction(notificationId, eventType)` client helpers.
     - Add category filter pills (`All`, `Events`, `Campaigns`, `Reminders`, `Social`) on `/notifications` and priority indicator badges (`urgent`, `high`).
     - Preserve `Mark all read` functionality intact (do not add any `Clear notifications` button).

#### Unified Smart Engine Dispatch [DONE]
- **Deliverables**:
  1. Centralize [src/lib/notifications/engine.ts](src/lib/notifications/engine.ts):
     - Export `dispatchSmartNotification(params: SmartNotificationInput)` as the single unified server-side dispatch pipeline.
     - Implement relationship-based recipient eligibility verification (`verifyRecipientEligibility(supabase, userId, context)`): verifies attendee relationship (`event_participants`), organizer relationship (`events.creator_id` or `event_organizers`), or campaign creator relationship (`campaigns.creator_id`) under the unified account model.
     - Gate `sendPushNotification()` so Web Push is only invoked when the database returns an active immediate delivery status (`status === "unread" || status === "sent"`), preventing push leaks during quiet hours or scheduled holds.
  2. Refactor [src/services/notifications.service.ts](src/services/notifications.service.ts):
     - **Remove the unsafe direct `.from("notifications").insert(...)` fallback** (lines 61-73) so failed RPC calls can never bypass user preferences, deduplication, or quiet hours.
     - Route `dispatchDateOrVenueChangeNotification`, `dispatchCampaignCreatedNotification`, `dispatchRegistrationReceiptNotification`, and `dispatchEventCancelledNotification` through `dispatchSmartNotification()` in `engine.ts` so event lifecycle notifications also trigger Web Push when enabled.

---

### Day 2 (4 Hours/Dev) - Timezone Quiet Hours, Frequency Caps & Scheduled Delivery

#### Schema & Shared Contracts [DONE] [DONE]
1. **Upgrade Notification Engine SQL RPCs** (`supabase/migrations/20261110110000_smart_notifications_day2.sql`) [DONE]:
   - Upgrade `public.process_smart_notification()` and `public.create_notification_for_user()` [DONE]:
     - **Preference Check**: Map `p_category` to `notification_preferences` columns (`event_reminders`, `new_events`, `trending_events`, `campaign_activity`, `campaign_milestones`, `recommendations`, `campaign_insights`, `abandoned_reminders_enabled`, `social_notifications_enabled`). Allow `p_priority = 'urgent'` transactional notifications (`event_cancelled`, `registration_receipt`) to deliver in-app regardless of marketing toggles [DONE].
     - **Idempotent Deduplication**: Check `notifications.dedupe_key` and `notification_events.dedupe_key`. If already present, return the existing notification JSON idempotently without inserting a duplicate [DONE].
     - **Daily Frequency Cap**: When `smart_notifications = true` and `p_priority IN ('low', 'normal')`, count non-urgent notifications sent to `p_user_id` in the past 24 hours; if `>= max_daily_notifications`, record `status = 'suppressed'` in `notification_events` and skip delivery [DONE].
     - **Timezone-Aware Quiet Hours**: Evaluate `(now() AT TIME ZONE COALESCE(pref.timezone, 'Africa/Lagos'))::time` against `[quiet_hours_start, quiet_hours_end]` (handling overnight spans such as `22:00` to `07:00`). If `quiet_hours_enabled = true` and `p_priority != 'urgent'`, set `status = 'scheduled'` and compute `scheduled_for` as the exact UTC timestamp when `quiet_hours_end` finishes in the user's local timezone [DONE].
   - Create `public.promote_scheduled_notifications()` (`SECURITY DEFINER` RPC) [DONE]:
     - Atomically transitions rows with `status = 'scheduled'` and `scheduled_for <= now()` (where `expires_at IS NULL OR expires_at > now()`) to `status = 'unread'` and `sent_at = now()`, returning the promoted records for push dispatch [DONE].
   - Update `public.get_my_notifications()` and `public.get_unread_notification_count()` so only `status IN ('unread', 'read', 'sent')` rows are returned to the client [DONE].
2. **Author Day 2 Verification Suite** [DONE]: Create `scripts/smart-notifications/week1/verify-sn-w1-d2.ts` testing preference toggles, deduplication idempotency, daily frequency caps, overnight timezone quiet hours (`Africa/Lagos`), and scheduled notification promotion [DONE].
3. **Day 2 Integration** [DONE]: Integrate Day 2 settings UI and scheduled delivery worker into `feat/w1-smart-notifications-foundation`.

#### Quiet Hours & Frequency Settings UI [DONE]
- **Deliverables**:
  1. Upgrade [src/app/settings/notifications/page.tsx](src/app/settings/notifications/page.tsx):
     - Auto-detect user's IANA timezone via `Intl.DateTimeFormat().resolvedOptions().timeZone || "Africa/Lagos"` and add a **Time zone** selector inside the **Quiet hours** card (`Africa/Lagos (WAT)`, `Africa/Accra`, `Africa/Nairobi`, `Europe/London`, `America/New_York`, `UTC`, plus detected local timezone).
     - Add toggle for **Saved draft & registration reminders** (`abandoned_reminders_enabled`) with clear, reassuring product copy: *"Receive a helpful reminder when you have an unfinished event draft or registration so you can pick up where you left off."*
     - Add toggle for **Friends & social activity** (`social_notifications_enabled`).
     - Add **Daily smart notification limit** selector (`3 per day`, `5 per day (Recommended)`, `10 per day`) under **Delivery**.
     - Replace blocking `window.alert()` calls with accessible `toast.error()` and `toast.success()` notifications.

#### Scheduled Delivery & Event Reminder Worker [DONE]
- **Deliverables**:
  1. Create `src/lib/notifications/scheduler.ts` and `src/app/api/notifications/cron/route.ts`:
     - `processDueScheduledNotifications()`: Calls `promote_scheduled_notifications()`, iterates promoted notifications, and invokes `sendPushNotification()` for users with `push_enabled = true`. Also runs `expire_old_notifications()`.
     - `dispatchUpcomingEventReminders()`: Queries published events starting within `[23h, 25h]` (`event_reminder_24h`) and `[1.5h, 2.5h]` (`event_reminder_2h`), resolves confirmed participants (`status IN ('attending', 'registered', 'ticketed')`), and dispatches reminders with idempotent `dedupeKey: "event-${eventId}-reminder-24h-${userId}"` and `"event-${eventId}-reminder-2h-${userId}"`.
     - `dispatchOrganizerProgressInsights()`: Dispatches helpful milestone insights (`organizer_insight`) to event creators/organizers when an event crosses 10, 50, or 100 confirmed attendees/registrations (`dedupeKey: "event-${eventId}-attendee-milestone-${milestone}"`).
     - Protect `/api/notifications/cron` with `Authorization: Bearer ${process.env.CRON_SECRET}` and expose a server helper that can also be triggered safely on dashboard load.

---

### Day 3 (4 Hours/Dev) - Intelligent Abandoned-Action Recovery

#### Schema & Shared Contracts [DONE] [DONE]
1. **Build Abandoned-Action Eligibility & Anti-Surveillance Guard** (`src/lib/notifications/recovery-rules.ts`) [DONE]:
   - **Anti-Surveillance Copy Validator** (`validateRecoveryCopy(title, message)`): Programmatically blocks any message containing surveillance phrasing (*"noticed you left"*, *"stopped halfway"*, *"saw you browsing"*, *"inactive for"*, *"watching"*). Enforces product-oriented copy [DONE]:
     - Event Draft: *"Your event draft is saved"* / *"You started creating an event but haven't finished. Pick up where you left off."* (`CTA: Continue editing`) [DONE]
     - Campaign Draft: *"Your campaign is ready when you are"* / *"You have an unpublished campaign draft. Complete it whenever you're ready."* (`CTA: Continue campaign`) [DONE]
     - Incomplete Registration: *"Your registration isn't complete"* / *"You started registering for [Event Title]. Continue where you left off."* (`CTA: Complete registration`) [DONE]
   - **Timing & Suppression Policy** [DONE]:
     - Stage 1 reminder eligible only after `24 hours` since `last_progressed_at` (configurable via admin settings) [DONE].
     - Optional Stage 2 final reminder eligible after `72 hours` (`max_reminders = 2`) [DONE].
     - Active-editing guard: Never send a reminder if `last_progressed_at` is within the last `30 minutes` [DONE].
   - **Registration & Payment Verification Rule** [DONE]:
     - Before sending an `incomplete_registration` reminder, verify against live tables: (a) user does NOT have an active row in `event_participants` (`attending`, `registered`, `ticketed`), (b) event `status === 'published'` and `start_at > now()`, (c) registration capacity is not full, and (d) if `participation_model === 'paid'`, verify `draft_payload.payment_status` is explicitly `'failed'` or `'expired'` (never prompt a user with a `'pending'` or `'completed'` payment to pay again) [DONE].
2. **Author Day 3 Verification Suite** [DONE]: Create `scripts/smart-notifications/week1/verify-sn-w1-d3.ts` testing empty-form rejection, 24h delay enforcement, payment status verification, completion auto-suppression, and anti-surveillance copy validation [DONE].
3. **Day 3 Integration** [DONE]: Integrate Day 3 recovery UI and abandoned-action service into `feat/w1-smart-notifications-foundation`.

#### Abandoned-Action Recovery UI [DONE]
- **Deliverables**:
  1. Upgrade [src/app/create/page.tsx](src/app/create/page.tsx):
     - When an organizer enters a meaningful draft (non-empty `title` + `categoryId` on Step 1 and advances to Step 2, or clicks `"Save draft"`), call `saveAbandonedActionAction({ actionType: "event_draft", ... })`. Do NOT trigger for an empty or untouched form.
     - Support `?resumeDraft=<actionId>` on `/create` to hydrate saved `title`, `description`, `categoryId`, `startAt`, `endAt`, `location`, `participationModel`, and `step` so the organizer resumes from their exact saved state.
     - On final event creation/publication, call `completeAbandonedActionAction()` to immediately suppress any pending reminders.
  2. Upgrade [src/components/events/RegistrationModal.tsx](src/components/events/RegistrationModal.tsx) and [src/app/events/[id]/page.tsx](src/app/events/[id]/page.tsx):
     - If an authenticated user modifies registration fields (e.g., phone, organization, job title, or custom question answers) and closes `RegistrationModal` without submitting, save an `incomplete_registration` state (storing only safe form state, never exposing sensitive details in notification text).
     - Support `?resumeRegistration=1` on `/events/[id]` to automatically open `RegistrationModal` pre-filled with their saved progress.
     - When registration completes, call `completeAbandonedActionAction()`.
  3. Build `src/components/notifications/RecoveryBannerCard.tsx`:
     - Reusable card displayed on `/notifications` and `/dashboard/events/[id]` showing saved drafts/incomplete actions with `[ Continue editing ]` / `[ Complete registration ]` and a `[ Dismiss ]` control that silences reminders without deleting the underlying draft.

#### Abandoned-Action Service & 24h Dispatcher [DONE]
- **Deliverables**:
  1. Build `src/services/abandoned-actions.service.ts` and `src/app/actions/abandoned-actions.ts`:
     - `upsertAbandonedAction()`: Validates meaningful progress (rejects empty forms), upserts into `abandoned_actions`, and resets `status = 'active'` and `last_progressed_at = now()`.
     - `completeAbandonedAction()` & `dismissAbandonedAction()`: Marks record `'completed'` or `'dismissed'`, and updates any scheduled notification in `notifications` with matching `dedupe_key` to `status = 'suppressed'`.
     - `syncDatabaseDraftsToAbandonedActions()`: Detects unpublished `events` (`status = 'draft'`) and `campaigns` (`status = 'draft'`) older than 24 hours so saved DB drafts also benefit from recovery reminders.
     - `processAbandonedActionReminders()`: Evaluates active records against `recovery-rules.ts`, checks live event/registration/payment state, dispatches recovery notifications via `dispatchSmartNotification()` with `presentationFormat: "reminder"`, and increments `reminder_stage`.

---

### Day 4 (4 Hours/Dev) - Pinterest-Style Visual Event Popups, Rich Push & Week 1 Milestone Merge

#### Schema & Shared Contracts [DONE]
1. **Audit Visual Notification Security, Accessibility & Queue Precedence** (`src/lib/notifications/visual-rules.ts`) [DONE]:
   - Verify image URL sanitization (allow HTTPS URLs and local `/images/` or Supabase storage paths; fallback cleanly on load error) [DONE].
   - Verify priority ordering in the popup queue (`urgent` and `high` transactional notifications take precedence over `normal`/`low` visual recommendations) [DONE].
2. **Author & Execute Week 1 Milestone Verification Suite** [DONE]:
   - Create `scripts/smart-notifications/week1/verify-sn-milestone1.ts` (and register `verify:sn-m1` in [package.json](package.json)) [DONE].
   - Verify all Week 1 checkpoints: bell, dropdown, notification center, preferences, quiet hours, scheduled promotion, event lifecycle notifications, campaign analytics preservation (`track_campaign_event`), abandoned-action recovery, Pinterest visual popups, and rich Web Push [DONE].
3. **Merge Week 1 Milestone to `main`**:
   - Integrate Day 4 visual popup UI and rich push service worker into `feat/w1-smart-notifications-foundation` [DONE].
   - Run `npm test && npx tsc --noEmit && npm run build`.
   - Merge `feat/w1-smart-notifications-foundation` into `main`.

#### Pinterest-Style Visual Popups & Queue Guards [DONE]
- **Deliverables**:
  1. Upgrade [src/components/notifications/NotificationToast.tsx](src/components/notifications/NotificationToast.tsx) to support Pinterest-Style Visual Popups:
     - Render visual layout when `notification.presentation_format === "image_popup" || notification.presentation_format === "featured_event" || Boolean(notification.metadata?.image_url)`:
       - **Recommendation Context Pill**: e.g., *"You might be interested in this event"*, *"Featured on Attend"*, *"A friend is attending an event"*, *"An event you saved is approaching"*.
       - **Event Cover Image**: Optimized 16:10 image container with `onError` state fallback to a branded violet gradient card with calendar/category icon when an image is unavailable.
       - **Event Details**: Title, 2-line short description, and formatted `Date · Location` line (e.g., `Saturday, 14 November · Lagos`).
       - **Actions**: Prominent primary CTA button (`View event` / `Explore event`) navigating to `action_url` (recording a click event) and `Dismiss` button (`aria-label="Dismiss notification"`).
       - **Responsive Layout**: Floating card at top-right on desktop (`sm:right-5 sm:top-20 sm:max-w-sm`) and safe bottom card on mobile positioned above navigation/action bars.
  2. Upgrade [src/components/notifications/NotificationBell.tsx](src/components/notifications/NotificationBell.tsx) and [src/stores/useNotificationsStore.ts](src/stores/useNotificationsStore.ts):
     - **Single-Popup Priority Queue (`toastQueue`)**: Never show multiple popups simultaneously. Sort queue so `urgent`/`high` transactional notifications display ahead of `normal`/`low` visual recommendations, with a 20-second cooldown between visual popups.
     - **Context-Aware Interruption Guard**: Do NOT display low/normal-priority visual popups while the user is on `/create`, editing a campaign on `/campaign/[slug]`, or while any modal (`[role="dialog"]`, `[role="alertdialog"]` such as `RegistrationModal`) is open. Hold queued visual popups until the user returns to a browsing route (`/`, `/discover`, `/saved`, `/events/[id]`).
     - **Dismissal Suppression**: When a user dismisses a visual popup, record `dismiss` via `recordNotificationInteraction()` and suppress the same recommendation for 7 days.

#### Rich Web Push & Service Worker [DONE]
- **Deliverables**:
  1. Upgrade [src/lib/notifications/engine.ts](src/lib/notifications/engine.ts) and [src/services/notifications.service.ts](src/services/notifications.service.ts):
     - Build `dispatchVisualEventNotification(params)` that enriches notifications with event metadata (`image_url: event.cover_image`, `short_description`, `start_at`, `city`, `venue_name`, `why_recommended`, `presentation_format: "image_popup"`).
     - Add triggers for visual recommendations:
       - Saved event approaching (`"An event you saved is approaching"`).
       - New event published by an organizer the user previously attended (`"An organizer you follow published a new event"`).
       - New event matching user's city and saved/attended category (`"An event matching your interests is now available"`).
     - Extend `sendPushNotification()` payload passed to `send-push` Edge Function with `image`, `actionLabel`, and `eventId`.
  2. Upgrade [worker/index.ts](worker/index.ts):
     - Support `image?: string` and `actionLabel?: string` in the push event listener.
     - Pass `image: data.image` (when present) into `sw.registration.showNotification()` options along with `icon`, `badge`, `tag`, and `data: { url, notificationId }`.
     - Preserve same-origin navigation security in `notificationclick` and append `?src=push_notification` for conversion tracking.

> **Week 1 End-of-Week Checkpoint**:
> - Existing notification bell, dropdown, `Mark all read`, and `/notifications` page work without regression.
> - `notifications.service.ts` uses the central smart engine with zero raw-insert bypasses.
> - Scheduled notifications and quiet-hour holds (`Africa/Lagos` timezone-aware) do not pop up prematurely.
> - Abandoned event drafts and incomplete registrations save state and send helpful 24h reminders with payment/registration checks.
> - Pinterest-style visual event popups render with cover images, fallbacks, single-popup queue, and active-flow interruption protection.
> - Rich Web Push renders event images across supported browsers.
> - Campaign analytics (`track_campaign_event`) remains 100% untouched and passing.

---

## 5. Week 2 Roadmap: Featured Events, Promotional Banners & Admin Console

> **Weekly Parent Branch**: `feat/w2-promotions-banners-admin` (Cut from updated `main`) [DONE]  
> **Status**: Completed (Days 5-8)  
> **Week 2 Goal**: Deliver platform-admin authorization, Featured Events (service, audience targeting, admin console, and Home/Discover showcase), and Promotional Banners (decoupled impression/click analytics, responsive Home/Discover slots, admin banner manager, and trigger/broadcast controls).

---

### Day 5 (4 Hours) - Platform-Admin Auth, Promotions Schema & Contracts [DONE]

1. **Create Week 2 Parent Branch** (15 mins) [DONE]:
   ```bash
   git checkout main && git pull origin main
   git checkout -b feat/w2-promotions-banners-admin
   git push -u origin feat/w2-promotions-banners-admin
   ```
2. **Author Week 2 Database Migration** (`supabase/migrations/20261117100000_promotions_and_social_discovery.sql`) (1.5 hrs) [DONE]:
   - **Platform-Admin Authorization & Audit Trail**:
     - Add `is_platform_admin BOOLEAN NOT NULL DEFAULT false` to `public.profiles`.
     - Create `public.is_platform_admin()` (`SECURITY DEFINER` SQL function returning `true` only if `profiles.is_platform_admin = true` for `auth.uid()`).
     - Create `public.admin_audit_logs` (`id`, `admin_id`, `action`, `target_type`, `target_id`, `metadata`, `created_at`) and `public.admin_notification_settings` (`key TEXT PRIMARY KEY`, `value JSONB`, `updated_by`, `updated_at`) seeded with default config for social triggers, abandoned-action delays (`24h`, `72h`), and broadcast approval rules.
   - **Featured Events Table (`public.featured_events`)**:
     - Columns: `id UUID PRIMARY KEY`, `event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE`, `priority TEXT NOT NULL DEFAULT 'standard'` (`'standard' | 'high_priority' | 'campaign_level'`), `promotional_message TEXT`, `promotional_image_url TEXT`, `target_audience JSONB NOT NULL DEFAULT '{}'::jsonb`, `notification_channels TEXT[] DEFAULT ARRAY['in_app', 'push']`, `notification_mode TEXT NOT NULL DEFAULT 'platform_only'` (`'platform_only' | 'selected_audience' | 'broad_announcement' | 'scheduled_campaign'`), `scheduled_notification_at TIMESTAMPTZ`, `start_at TIMESTAMPTZ NOT NULL`, `end_at TIMESTAMPTZ NOT NULL`, `status TEXT NOT NULL DEFAULT 'active'`, `views_count INT NOT NULL DEFAULT 0`, `clicks_count INT NOT NULL DEFAULT 0`, `saves_count INT NOT NULL DEFAULT 0`, `registrations_count INT NOT NULL DEFAULT 0`, `created_by UUID REFERENCES profiles(id)`, `created_at TIMESTAMPTZ`, `updated_at TIMESTAMPTZ`.
     - RLS: Public `SELECT` for active featured rows (`status = 'active' AND start_at <= now() AND end_at > now()`); write/admin read operations restricted to `public.is_platform_admin()`.
   - **Promotional Banners Table (`public.promotional_banners`) & `public.banner_analytics`**:
     - Columns: `id`, `title`, `description`, `image_url`, `mobile_image_url`, `desktop_image_url`, `cta_label`, `destination_url`, `placement` (`'home' | 'discover' | 'both'`), `slot_type`, `priority INT DEFAULT 1`, `targeting_rules JSONB`, `start_at`, `end_at`, `status` (`'draft' | 'published' | 'paused' | 'archived'`), `impressions_count INT DEFAULT 0`, `clicks_count INT DEFAULT 0`, `created_by`, `created_at`, `updated_at`.
   - **Social Discovery & Privacy Schema** (provisioned cleanly for Week 3):
     - Extend `public.profiles`: `attendance_visibility TEXT NOT NULL DEFAULT 'public'` (`'public' | 'connections' | 'private'`), `allow_social_notifications BOOLEAN NOT NULL DEFAULT true`, `allow_social_recommendations BOOLEAN NOT NULL DEFAULT true`, `allow_contact_discovery BOOLEAN NOT NULL DEFAULT false`, `contact_discovery_consented_at TIMESTAMPTZ`.
     - Create `public.user_contact_identifiers` and `public.user_connections`, and update `public.public_event_attendees` view so only `COALESCE(p.attendance_visibility, 'public') = 'public'` users appear in public attendee stacks.
3. **Publish Shared Contracts, Admin Guard & Day 5 Verification** (2 hrs 15m) [DONE]:
   - Create `src/types/promotions.ts`, `src/types/social.ts`, and `src/lib/auth/admin.ts` (`requirePlatformAdmin()`, `isPlatformAdmin()`).
   - Create `scripts/smart-notifications/week2/verify-sn-w2-d5.ts` verifying admin guard, RLS boundaries, and promotions schema.

---

### Day 6 (4 Hours) - Featured Events Service, Admin Console & Public Showcase [DONE]

1. **Build Featured Events Domain Service & Server Actions** (`src/services/promotions.service.ts`, `src/app/actions/promotions.ts`) (2 hrs) [DONE]:
   - Enforce `requirePlatformAdmin()` on all admin mutations and record every action in `admin_audit_logs`.
   - Implement `featureEvent()`, `removeFeaturedEvent()`, and `getActiveFeaturedEvents(placement, viewerContext)` (backed by `unstable_cache` with explicit column selects and `updateTag` invalidation to protect Supabase egress quota).
   - Implement `dispatchFeaturedEventCampaign(featuredEventId)`:
     - Skip notification dispatch when `notification_mode === 'platform_only'` or outside the active schedule window.
     - Push city filters to Postgres, exclude opted-out (`recommendations = false`), already-registered, and recently exposed users, batch matching recipients in chunks of 100 with bounded concurrency, and dispatch `"Featured on Attend"` visual notifications via `dispatchVisualEventNotification()`.
   - Implement `recordFeaturedEventMetric(featuredEventId, metric: 'view' | 'click' | 'save' | 'registration')` via `public.record_featured_event_metric` RPC, deduplicating views per browser session and wiring `save` / `registration` hooks via `recordFeaturedMetricForEventIfActive()`.
2. **Build Admin Featured Events Console & Home/Discover Showcase** (2 hrs) [DONE]:
   - Build `src/app/admin/promotions/page.tsx` shell (4 tabs: `Featured Events`, `Promotional Banners`, `Recovery & Social Controls`, `Broadcasts & Analytics`) and `src/components/admin/FeaturedEventsManager.tsx`.
   - Build `src/components/home/FeaturedEventsSection.tsx` and integrate into [src/app/page.tsx](src/app/page.tsx) and [src/components/discover/DiscoverHub.tsx](src/components/discover/DiscoverHub.tsx) ordered by priority (`campaign_level` -> `high_priority` -> `standard`).

---

### Day 7 (4 Hours) - Promotional Banners, Decoupled Analytics & Slots [DONE]

1. **Decoupled Banner Analytics RPC & Validation** (1 hr) [DONE]:
   - Create `public.record_banner_interaction(p_banner_id UUID, p_interaction_type TEXT, p_placement TEXT, p_audience_segment TEXT)` SQL RPC (increments `impressions_count` / `clicks_count` and logs to `banner_analytics`, strictly separate from `notifications` and `campaign_analytics`).
   - Create `src/lib/validations/promotions.ts` validating responsive image URLs, schedule ranges (`end_at > start_at`), and safe destination URLs.
2. **Promotional Banner CRUD & Targeting Service** (1.5 hrs) [DONE]:
   - Extend `src/services/promotions.service.ts` and `src/app/actions/promotions.ts` with `createPromotionalBanner()`, `updatePromotionalBanner()`, `updateBannerStatus()`, `getActiveBannersForPlacement(placement, viewerContext)`, `trackBannerImpressionAction()`, and `trackBannerClickAction()`.
3. **Build `PromotionalBannerSlot.tsx` & Integrate** (1.5 hrs) [DONE]:
   - Render responsive `<picture>` (`desktop_image_url` on `md+`, `mobile_image_url` on mobile) with `onError` gradient fallback, priority ordering, session frequency cap with per-session impression deduplication (`src/lib/utils/promotion-session.ts`), and non-obstructive dismiss button on [src/app/page.tsx](src/app/page.tsx) and [src/components/discover/DiscoverHub.tsx](src/components/discover/DiscoverHub.tsx).

---

### Day 8 (4 Hours) - Admin Banner/Broadcast Controls & Week 2 Milestone Merge [DONE]

1. **Build Admin Banner & Broadcast/Trigger Tabs** (2 hrs) [DONE]:
   - Build `src/components/admin/BannerManagementTab.tsx` (create/edit banners, desktop/mobile preview toggle, status actions, impressions/clicks/conversion metrics).
   - Build `src/components/admin/AdminControlsAndBroadcastTab.tsx` (recovery trigger toggles and delays, template editor, social trigger toggles, and chunked `dispatchAdminBroadcast()` with test preview and approval confirmation).
2. **Day 6-8 Verification & Week 2 Milestone Merge** (2 hrs) [DONE]:
   - Author `scripts/smart-notifications/week2/verify-sn-w2-d6.ts` testing banner scheduling, priority ordering, decoupled analytics, and admin broadcast/trigger controls.
   - Run `npm test && npx tsc --noEmit && npm run build` and merge `feat/w2-promotions-banners-admin` into `main`.

---

## 6. Week 3 Roadmap: Privacy-Conscious Social Discovery & Final Release

> **Weekly Parent Branch**: `feat/w3-social-discovery-release` (Cut from updated `main`)  
> **Weekly Capacity**: 16 hours (4 days × 4 hours/day)  
> **Week 3 Goal**: Launch explicit opt-in Contact Discovery with server-side HMAC-SHA256 matching, granular attendance privacy controls (`Public`, `Connections`, `Private`), friend-attending badges and notifications, and complete full acceptance QA and release sign-off.

---

### Day 9 (4 Hours) - HMAC Contact Matching, RPC & Social Discovery Service

1. **Create Week 3 Parent Branch & Protected Contact Matching** (2 hrs):
   - Cut `feat/w3-social-discovery-release` from `main`.
   - Create `src/lib/security/contact-hmac.ts`: `normalizePhoneToE164(phone, defaultCountryCode = '+234')`, `normalizeEmail(email)`, and `computeContactHmac(normalizedIdentifier)` using `HMAC-SHA256` with server-only `CONTACT_MATCH_PEPPER`.
   - Create `public.match_user_contacts(p_hmac_hashes TEXT[])` (`SECURITY DEFINER` RPC) enforcing rate limiting (max 5 sync calls/hour), batch cap (500 hashes), and `profiles.allow_contact_discovery = true` consent gating without storing raw contact lists.
2. **Build Social Discovery Service & Server Actions** (2 hrs):
   - Create `src/services/social-discovery.service.ts` and `src/app/actions/social.ts`:
     - `optInAndRegisterOwnContactIdentifiers()`
     - `syncUserContactsAction(rawContacts)`
     - `disconnectContactDiscoveryAction()`
     - `getSocialAttendanceForEvents(viewerId, eventIds)`

---

### Day 10 (4 Hours) - Privacy Controls UI, Contact Discovery & Friend Badges

1. **Upgrade Privacy & Social Discovery Settings UI** (1.5 hrs):
   - Upgrade [src/app/settings/notifications/page.tsx](src/app/settings/notifications/page.tsx) with the **Privacy & Social Discovery** section: `attendance_visibility` (`public`, `connections`, `private`), `allow_social_notifications`, `allow_social_recommendations`, `allow_contact_discovery`, and `[ Disconnect Contact Discovery & Remove Synced Matches ]`.
2. **Build Contact Discovery Modal, Friend Badges & RSVP Triggers** (2.5 hrs):
   - Build `src/components/social/ContactDiscoveryModal.tsx` (explicit consent explanation, native Contact Picker API with desktop input/CSV fallback) and `src/components/social/FriendsAttendingBadge.tsx` on [src/app/events/[id]/page.tsx](src/app/events/[id]/page.tsx), [src/components/discover/DiscoverHub.tsx](src/components/discover/DiscoverHub.tsx), and [src/components/HomeDiscover.tsx](src/components/HomeDiscover.tsx).
   - Connect friend-attending notifications in [src/services/attendance.service.ts](src/services/attendance.service.ts) (`rsvpEvent`) respecting `attendance_visibility` and `allow_social_notifications`.

---

### Day 11 (4 Hours) - End-to-End Integration, Privacy & Accessibility QA

1. **Day 9-10 Verification & Privacy Boundary QA** (2 hrs):
   - Author `scripts/smart-notifications/week3/verify-sn-w3-d9.ts` testing E.164 normalization, HMAC pepper hashing, opt-in consent gating, `Public`/`Connections`/`Private` visibility isolation, and friend-attending notifications.
   - Verify `attendance_visibility = 'private'` never leaks into `public_event_attendees`, `FriendsAttendingBadge`, or social notifications.
2. **Frontend Accessibility, Responsive & Idempotency QA** (2 hrs):
   - Verify `NotificationToast` desktop/mobile positioning, image fallbacks, keyboard `Escape` dismissal, `PromotionalBannerSlot`, `FeaturedEventsSection`, `FriendsAttendingBadge`, and `/admin/promotions` non-admin protection.
   - Verify idempotency across scheduled notifications, reminders, abandoned recovery, and featured/broadcast dispatches.

---

### Day 12 (4 Hours) - Milestone 2 Verification, Regression Audit & Final Release

1. **Author Milestone 2 Verification Suite** (2 hrs):
   - Create `scripts/smart-notifications/week3/verify-sn-milestone2.ts` covering all 10 mandatory verification areas and register `verify:sn-m1` and `verify:sn-m2` in [package.json](package.json).
2. **Security, Regression Audit & Final Merge to `main`** (2 hrs):
   - Verify both `track_campaign_event` overloads and `campaign_analytics` remain 100% untouched.
   - Verify `Mark all read` is intact, all new tables enforce RLS, and zero em dashes (`U+2014`) exist in the repository.
   - Run `npm test && npx tsc --noEmit && npm run build` and merge `feat/w3-social-discovery-release` into `main`.

---

## 7. Complete Branching & Pull Request Matrix

| Week | Day | Branch Name | Target Base Branch | Pull Request Title |
| :--- | :--- | :--- | :--- | :--- |
| **W1** | **Days 1-4** | `feat/w1-smart-notifications-foundation` | `main` | `feat(w1): smart notification foundation, recovery & visual popups` |
| **W2** | **Days 5-8** | `feat/w2-promotions-banners-admin` | `main` | `feat(w2): featured events, promotional banners & admin console` |
| **W3** | **Days 9-12** | `feat/w3-social-discovery-release` | `main` | `feat(w3): privacy-conscious social discovery & final release` |

---

## 8. Mandatory Verification & Final Acceptance Matrix

Before any weekly milestone branch is merged, all 3 standard checks plus the focused verification areas must pass:

```bash
npm test
npx tsc --noEmit
npm run build
```

### Mapping of All Mandatory Verification Areas & Final Acceptance Criteria

| # | Verification Area | Acceptance Requirement | Implementing Day | Automated Verification Script |
| :--- | :--- | :--- | :--- | :--- |
| **1** | **Smart Notification Preferences** | Category toggles, daily frequency caps, and unified account relationship eligibility work accurately without raw-insert bypass. | Week 1 · Days 1-2 | `scripts/smart-notifications/week1/verify-sn-w1-d1.ts` & `scripts/smart-notifications/week1/verify-sn-w1-d2.ts` |
| **2** | **Notification Deduplication** | Duplicate triggers with identical `dedupe_key` in `notifications` or `notification_events` are suppressed idempotently on both server and client. | Week 1 · Days 1-2 | `scripts/smart-notifications/week1/verify-sn-w1-d2.ts` |
| **3** | **Quiet Hours & Scheduled Delivery** | Non-urgent notifications during user's local timezone quiet hours (`Africa/Lagos` default) are held as `status = 'scheduled'`, hidden from realtime unread UI, and promoted when due. | Week 1 · Day 2 | `scripts/smart-notifications/week1/verify-sn-w1-d2.ts` |
| **4** | **Event Lifecycle Notifications** | Registration receipts, event date/venue updates, 24h/2h event reminders, campaign creations, and urgent event cancellations dispatch through the central engine. | Week 1 · Days 1-2 | `scripts/smart-notifications/week1/verify-sn-w1-d1.ts` & `scripts/smart-notifications/week1/verify-sn-w1-d2-worker.ts` |
| **5** | **Abandoned-Action Suppression** | Meaningful unfinished event/campaign drafts and registrations trigger product-oriented 24h reminders, verify payment/registration state, and auto-suppress on resume/completion/delete. | Week 1 · Day 3 | `scripts/smart-notifications/week1/verify-sn-w1-d3.ts` |
| **6** | **Image Notification Rendering** | Pinterest-style visual popups render cover image, graceful fallback when image is missing, `Date · City`, recommendation reason, CTA, single-popup FIFO queue, and active-flow interruption guard. | Week 1 · Day 4 | `scripts/smart-notifications/week1/verify-sn-milestone1.ts` |
| **7** | **Push Delivery & Click Navigation** | Existing `send-push` pipeline and `worker/index.ts` render event cover images in browser push notifications and enforce same-origin click navigation. | Week 1 · Day 4 | `scripts/smart-notifications/week1/verify-sn-milestone1.ts` |
| **8** | **Featured-Event Scheduling & Audience Rules** | Platform admin can feature/unfeature events, set priority & schedule, and choose `platform_only` placement independently of targeted audience notifications. | Week 2 · Days 5-6 | `scripts/smart-notifications/week2/verify-sn-w2-d5.ts` |
| **9** | **Banner Visibility & Analytics** | Admin can publish responsive banners to Home, Discover, or both; expired/paused banners hide automatically; banner impressions and clicks are tracked separately from notifications. | Week 2 · Days 7-8 | `scripts/smart-notifications/week2/verify-sn-w2-d6.ts` |
| **10** | **Contact Matching & Attendance Privacy** | Explicit user opt-in before contact matching; server-side HMAC-SHA256 matching without storing raw address books; `Public`, `Connections`, and `Private` attendance visibility strictly enforced. | Week 3 · Days 9-10 | `scripts/smart-notifications/week3/verify-sn-w3-d9.ts` |
| **11** | **Non-Negotiable Regression Guard** | Existing bell, dropdown, `Mark all read`, event/campaign flows, and both `track_campaign_event` overloads in `campaign_analytics` pass with zero regressions. | Week 3 · Days 11-12 | `scripts/smart-notifications/week3/verify-sn-milestone2.ts` & `npm test` |

---

## 9. Non-Negotiable Engineering Guardrails & Scope Control

1. **Preserve Campaign Analytics**: Never modify `campaign_analytics` or either `track_campaign_event` overload.
2. **Preserve Notification Controls**: Keep `Mark all read` functional; never add a `Clear notifications` action.
3. **Unified Account Context**: Never split attendee and organizer accounts; resolve eligibility per event/activity relationship.
4. **Server-Side Privileged Operations**: All cross-user notification creation, scheduled promotion, admin broadcasts, and contact matching must execute server-side with RLS enabled on every exposed table.
5. **No Surveillance Copy or Tracking**: Only track explicit saved drafts and form progress; never send immediate abandonment messages or creepy precision timing copy.
6. **Decoupled Banners vs Featured Events vs Notifications**: A featured event is an event-level promotional status; a banner is a frontend content slot with its own impression/click lifecycle; neither is tightly coupled to notification center rows.
7. **Zero Em Dashes (`U+2014`)**: Maintain strict compliance with [CONTRIBUTING.md](CONTRIBUTING.md) across all TypeScript, SQL, JSX, and Markdown files.
