# Attend: Smart Notification & Engagement System - Architecture Audit & 2-Week Implementation Plan

> **Based on**: *Attend - Smart Notification & Engagement System (Updated Product & Technical Brief)*  
> **Reference Plan**: [docs/v1_implementation_plan.md](docs/v1_implementation_plan.md)  
> **Contribution Guide**: [CONTRIBUTING.md](CONTRIBUTING.md)  
> **Cadence**: 4 hours/day · 4 days/week per developer (16 hours/week per person · 48 person-hours/week · 96 person-hours total)  
> **Team Structure**: 3 People  
> - **Sanaullah (Tech Lead & Project Supervisor)**: Owns weekly parent branches, Supabase schema migrations, SQL RPCs, RLS security policies, shared TypeScript contracts in `src/types/`, automated verification test suites (`scripts/verify-sn-*.ts`), daily PR reviews/merges, and production release sign-off.  
> - **Uzair (Software Engineer - Frontend, Visual UX, Admin & Privacy Interfaces)**: Owns notification state/UI fixes, Pinterest-style visual event popups, popup queue & interruption guards, abandoned-action recovery UI, Admin Promotions & Controls console, Home/Discover banner & featured placements, and Contact Discovery/Privacy interfaces.  
> - **Hardik (Software Engineer - Smart Engine, Domain Services, Push & Matching)**: Owns unified notification engine dispatch, scheduled & timezone quiet-hours processor, abandoned-action tracking & reminder dispatcher, rich Web Push service worker, Featured Events & Banner services, and HMAC server-side contact matching.  
> **Timeline**: 2 Weeks · 8 Working Days (Week 1: Days 1-4 · Week 2: Days 5-8)

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

## 3. Team Operating Model, Branching Strategy & 4-Hour Daily Routine

All work strictly follows the workflow defined in [CONTRIBUTING.md](CONTRIBUTING.md):

```
main (Production Ready - Protected)
  ▲
  │ (Weekly Milestone PR merged by Sanaullah at end of Week 1 & Week 2)
  │
feat/w1-smart-notifications-foundation (Weekly Parent Branch created by Sanaullah)
  ├── Sanaullah commits DB migrations, SQL RPCs, RLS policies & shared src/types/* directly here
  ├── feat/uzair-w1-d1-notification-state-types     ──► PR -> Reviewed & Merged by Sanaullah
  ├── feat/hardik-w1-d1-unified-smart-engine        ──► PR -> Reviewed & Merged by Sanaullah
  ├── feat/uzair-w1-d2-quiet-hours-settings-ui      ──► PR -> Reviewed & Merged by Sanaullah
  ├── feat/hardik-w1-d2-scheduled-delivery-worker   ──► PR -> Reviewed & Merged by Sanaullah
  ├── feat/uzair-w1-d3-abandoned-recovery-ui        ──► PR -> Reviewed & Merged by Sanaullah
  ├── feat/hardik-w1-d3-abandoned-action-service    ──► PR -> Reviewed & Merged by Sanaullah
  ├── feat/uzair-w1-d4-pinterest-visual-popups      ──► PR -> Reviewed & Merged by Sanaullah
  └── feat/hardik-w1-d4-rich-push-service-worker    ──► PR -> Reviewed & Merged by Sanaullah
```

### Why This Eliminates Dependency Bottlenecks
- **Sanaullah (Tech Lead)** lands the database migrations, SQL RPC signatures, and shared TypeScript contracts (`src/types/notifications.ts`, `src/types/promotions.ts`, `src/types/social.ts`) directly on the active weekly parent branch at the start of each milestone/day.
- **Uzair (Frontend/UI)** and **Hardik (Backend/Services)** pull the weekly parent branch at Hour `0:00` and build in parallel against identical, pre-verified TypeScript interfaces without blocking each other or creating competing data structures.

### Daily 4-Hour Session Schedule (4 Days/Week · 16 Hours/Week per Person)

| Time | Duration | Activity | Participants |
| :--- | :--- | :--- | :--- |
| **0:00 - 0:20** | 20 mins | **Daily Sync & Deliverable Review**: Review previous day's merged state and pull latest weekly parent branch. | Sanaullah, Uzair, Hardik |
| **0:20 - 0:40** | 20 mins | **Contract Handshake & Branch Creation**: Confirm shared types in `src/types/` and DB RPC contracts; Uzair and Hardik create their daily feature branches (`feat/<engineer>-w<week>-d<day>-<slug>`). | Sanaullah, Uzair, Hardik |
| **0:40 - 3:15** | 2 hrs 35m | **Focused Implementation**: Uzair builds UI/UX deliverables; Hardik builds services/engine deliverables; Sanaullah implements SQL RPCs, RLS policies, security guards, and the daily verification script (`scripts/verify-sn-w*-d*.ts`). | Sanaullah, Uzair, Hardik |
| **3:15 - 3:45** | 30 mins | **Verification, PR & Code Review**: Uzair and Hardik run `npm test`, `npx tsc --noEmit`, and `npm run build`, push atomic commits, and open PRs targeting the weekly parent branch with **Sanaullah** as reviewer. Sanaullah reviews and merges. | Uzair & Hardik (PRs) · Sanaullah (Review/Merge) |
| **3:45 - 4:00** | 15 mins | **End-of-Day Checkpoint**: Sanaullah runs the daily verification suite on the updated weekly parent branch and logs completion. | Sanaullah |

---

## 4. Week 1 Roadmap: Notification Foundation, Abandoned Recovery & Visual Popups

> **Weekly Parent Branch**: `feat/w1-smart-notifications-foundation` (Created by **Sanaullah** from `main`)  
> **Weekly Capacity**: 48 person-hours (4 days × 4 hours × 3 developers)  
> **Week 1 Goal**: Unify and harden the central smart notification engine (relationship-based eligibility, deduplication, frequency caps, timezone-aware quiet hours, and scheduled notification promotion), ship non-invasive abandoned-action recovery (organizer drafts + incomplete attendee registrations), and launch Pinterest-style visual event popups across in-app and Web Push.

---

### Day 1 (4 Hours/Dev) - Schema Foundation, Shared Contracts & Unified Smart Engine

#### Sanaullah (Tech Lead) - 4 Hours (On `feat/w1-smart-notifications-foundation`)
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
4. **Author Day 1 Verification Suite** [DONE]: Create `scripts/smart-notifications/verify-sn-w1-d1.ts` verifying schema additions, shared contracts, status filtering, and removal of the unsafe raw-insert fallback.
5. **Review & Merge**: Review and merge Uzair's and Hardik's Day 1 PRs into `feat/w1-smart-notifications-foundation`.

#### Uzair (Software Engineer) - 4 Hours
- **Branch**: `feat/uzair-w1-d1-notification-state-types`
- **Target Base**: `feat/w1-smart-notifications-foundation`
- **PR Title**: `feat(w1-d1): align notification store and UI with full lifecycle statuses`
- **Deliverables**:
  1. Update [src/stores/useNotificationsStore.ts](src/stores/useNotificationsStore.ts):
     - Fix Realtime `INSERT` handler: Only prepend to `notifications`, increment `unreadCount`, or queue `latestNotification` when `payload.new.status === "unread" || payload.new.status === "sent"`. Ignore rows inserted with `status = "scheduled"`, `"suppressed"`, `"expired"`, or `"dismissed"`.
     - Update Realtime `UPDATE` handler: When a row transitions from `status = "scheduled"` to `status = "unread"` (promoted when due), prepend it to `notifications`, increment `unreadCount`, and enqueue it for toast display.
     - Add client-side deduplication by `id` and `dedupe_key` so rapid realtime updates never trigger duplicate toasts.
  2. Update [src/lib/notifications/client.ts](src/lib/notifications/client.ts), [src/components/notifications/NotificationDropdown.tsx](src/components/notifications/NotificationDropdown.tsx), and [src/app/notifications/page.tsx](src/app/notifications/page.tsx):
     - Add `dismissNotification(notificationId)` and `recordNotificationInteraction(notificationId, eventType)` client helpers.
     - Add category filter pills (`All`, `Events`, `Campaigns`, `Reminders`, `Social`) on `/notifications` and priority indicator badges (`urgent`, `high`).
     - Preserve `Mark all read` functionality intact (do not add any `Clear notifications` button).

#### Hardik (Software Engineer) - 4 Hours
- **Branch**: `feat/hardik-w1-d1-unified-smart-engine`
- **Target Base**: `feat/w1-smart-notifications-foundation`
- **PR Title**: `feat(w1-d1): unify notification dispatch through central smart engine`
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

#### Sanaullah (Tech Lead) - 4 Hours (On `feat/w1-smart-notifications-foundation`) [DONE]
1. **Upgrade Notification Engine SQL RPCs** (`supabase/migrations/20261110110000_smart_notifications_day2.sql`) [DONE]:
   - Upgrade `public.process_smart_notification()` and `public.create_notification_for_user()` [DONE]:
     - **Preference Check**: Map `p_category` to `notification_preferences` columns (`event_reminders`, `new_events`, `trending_events`, `campaign_activity`, `campaign_milestones`, `recommendations`, `campaign_insights`, `abandoned_reminders_enabled`, `social_notifications_enabled`). Allow `p_priority = 'urgent'` transactional notifications (`event_cancelled`, `registration_receipt`) to deliver in-app regardless of marketing toggles [DONE].
     - **Idempotent Deduplication**: Check `notifications.dedupe_key` and `notification_events.dedupe_key`. If already present, return the existing notification JSON idempotently without inserting a duplicate [DONE].
     - **Daily Frequency Cap**: When `smart_notifications = true` and `p_priority IN ('low', 'normal')`, count non-urgent notifications sent to `p_user_id` in the past 24 hours; if `>= max_daily_notifications`, record `status = 'suppressed'` in `notification_events` and skip delivery [DONE].
     - **Timezone-Aware Quiet Hours**: Evaluate `(now() AT TIME ZONE COALESCE(pref.timezone, 'Africa/Lagos'))::time` against `[quiet_hours_start, quiet_hours_end]` (handling overnight spans such as `22:00` to `07:00`). If `quiet_hours_enabled = true` and `p_priority != 'urgent'`, set `status = 'scheduled'` and compute `scheduled_for` as the exact UTC timestamp when `quiet_hours_end` finishes in the user's local timezone [DONE].
   - Create `public.promote_scheduled_notifications()` (`SECURITY DEFINER` RPC) [DONE]:
     - Atomically transitions rows with `status = 'scheduled'` and `scheduled_for <= now()` (where `expires_at IS NULL OR expires_at > now()`) to `status = 'unread'` and `sent_at = now()`, returning the promoted records for push dispatch [DONE].
   - Update `public.get_my_notifications()` and `public.get_unread_notification_count()` so only `status IN ('unread', 'read', 'sent')` rows are returned to the client [DONE].
2. **Author Day 2 Verification Suite** [DONE]: Create `scripts/smart-notifications/verify-sn-w1-d2.ts` testing preference toggles, deduplication idempotency, daily frequency caps, overnight timezone quiet hours (`Africa/Lagos`), and scheduled notification promotion [DONE].
3. **Review & Merge**: Review and merge Uzair's and Hardik's Day 2 PRs.

#### Uzair (Software Engineer) - 4 Hours
- **Branch**: `feat/uzair-w1-d2-quiet-hours-settings-ui`
- **Target Base**: `feat/w1-smart-notifications-foundation`
- **PR Title**: `feat(w1-d2): add timezone detection and smart frequency controls to notification settings`
- **Deliverables**:
  1. Upgrade [src/app/settings/notifications/page.tsx](src/app/settings/notifications/page.tsx):
     - Auto-detect user's IANA timezone via `Intl.DateTimeFormat().resolvedOptions().timeZone || "Africa/Lagos"` and add a **Time zone** selector inside the **Quiet hours** card (`Africa/Lagos (WAT)`, `Africa/Accra`, `Africa/Nairobi`, `Europe/London`, `America/New_York`, `UTC`, plus detected local timezone).
     - Add toggle for **Saved draft & registration reminders** (`abandoned_reminders_enabled`) with clear, reassuring product copy: *"Receive a helpful reminder when you have an unfinished event draft or registration so you can pick up where you left off."*
     - Add toggle for **Friends & social activity** (`social_notifications_enabled`).
     - Add **Daily smart notification limit** selector (`3 per day`, `5 per day (Recommended)`, `10 per day`) under **Delivery**.
     - Replace blocking `window.alert()` calls with accessible `toast.error()` and `toast.success()` notifications.

#### Hardik (Software Engineer) - 4 Hours
- **Branch**: `feat/hardik-w1-d2-scheduled-delivery-worker`
- **Target Base**: `feat/w1-smart-notifications-foundation`
- **PR Title**: `feat(w1-d2): implement scheduled notification promotion and event reminder dispatcher`
- **Deliverables**:
  1. Create `src/lib/notifications/scheduler.ts` and `src/app/api/notifications/cron/route.ts`:
     - `processDueScheduledNotifications()`: Calls `promote_scheduled_notifications()`, iterates promoted notifications, and invokes `sendPushNotification()` for users with `push_enabled = true`. Also runs `expire_old_notifications()`.
     - `dispatchUpcomingEventReminders()`: Queries published events starting within `[23h, 25h]` (`event_reminder_24h`) and `[1.5h, 2.5h]` (`event_reminder_2h`), resolves confirmed participants (`status IN ('attending', 'registered', 'ticketed')`), and dispatches reminders with idempotent `dedupeKey: "event-${eventId}-reminder-24h-${userId}"` and `"event-${eventId}-reminder-2h-${userId}"`.
     - `dispatchOrganizerProgressInsights()`: Dispatches helpful milestone insights (`organizer_insight`) to event creators/organizers when an event crosses 10, 50, or 100 confirmed attendees/registrations (`dedupeKey: "event-${eventId}-attendee-milestone-${milestone}"`).
     - Protect `/api/notifications/cron` with `Authorization: Bearer ${process.env.CRON_SECRET}` and expose a server helper that can also be triggered safely on dashboard load.

---

### Day 3 (4 Hours/Dev) - Intelligent Abandoned-Action Recovery

#### Sanaullah (Tech Lead) - 4 Hours (On `feat/w1-smart-notifications-foundation`)
1. **Build Abandoned-Action Eligibility & Anti-Surveillance Guard** (`src/lib/notifications/recovery-rules.ts`):
   - **Anti-Surveillance Copy Validator** (`validateRecoveryCopy(title, message)`): Programmatically blocks any message containing surveillance phrasing (*"noticed you left"*, *"stopped halfway"*, *"saw you browsing"*, *"inactive for"*, *"watching"*). Enforces product-oriented copy:
     - Event Draft: *"Your event draft is saved"* / *"You started creating an event but haven't finished. Pick up where you left off."* (`CTA: Continue editing`)
     - Campaign Draft: *"Your campaign is ready when you are"* / *"You have an unpublished campaign draft. Complete it whenever you're ready."* (`CTA: Continue campaign`)
     - Incomplete Registration: *"Your registration isn't complete"* / *"You started registering for [Event Title]. Continue where you left off."* (`CTA: Complete registration`)
   - **Timing & Suppression Policy**:
     - Stage 1 reminder eligible only after `24 hours` since `last_progressed_at` (configurable via admin settings).
     - Optional Stage 2 final reminder eligible after `72 hours` (`max_reminders = 2`).
     - Active-editing guard: Never send a reminder if `last_progressed_at` is within the last `30 minutes`.
   - **Registration & Payment Verification Rule**:
     - Before sending an `incomplete_registration` reminder, verify against live tables: (a) user does NOT have an active row in `event_participants` (`attending`, `registered`, `ticketed`), (b) event `status === 'published'` and `start_at > now()`, (c) registration capacity is not full, and (d) if `participation_model === 'paid'`, verify `draft_payload.payment_status` is explicitly `'failed'` or `'expired'` (never prompt a user with a `'pending'` or `'completed'` payment to pay again).
2. **Author Day 3 Verification Suite**: Create `scripts/smart-notifications/verify-sn-w1-d3.ts` testing empty-form rejection, 24h delay enforcement, payment status verification, completion auto-suppression, and anti-surveillance copy validation.
3. **Review & Merge**: Review and merge Uzair's and Hardik's Day 3 PRs.

#### Uzair (Software Engineer) - 4 Hours
- **Branch**: `feat/uzair-w1-d3-abandoned-recovery-ui`
- **Target Base**: `feat/w1-smart-notifications-foundation`
- **PR Title**: `feat(w1-d3): add draft recovery banners and resume state for event creation and registration`
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

#### Hardik (Software Engineer) - 4 Hours
- **Branch**: `feat/hardik-w1-d3-abandoned-action-service`
- **Target Base**: `feat/w1-smart-notifications-foundation`
- **PR Title**: `feat(w1-d3): build abandoned-action state tracking and 24h recovery dispatcher`
- **Deliverables**:
  1. Build `src/services/abandoned-actions.service.ts` and `src/app/actions/abandoned-actions.ts`:
     - `upsertAbandonedAction()`: Validates meaningful progress (rejects empty forms), upserts into `abandoned_actions`, and resets `status = 'active'` and `last_progressed_at = now()`.
     - `completeAbandonedAction()` & `dismissAbandonedAction()`: Marks record `'completed'` or `'dismissed'`, and updates any scheduled notification in `notifications` with matching `dedupe_key` to `status = 'suppressed'`.
     - `syncDatabaseDraftsToAbandonedActions()`: Detects unpublished `events` (`status = 'draft'`) and `campaigns` (`status = 'draft'`) older than 24 hours so saved DB drafts also benefit from recovery reminders.
     - `processAbandonedActionReminders()`: Evaluates active records against `recovery-rules.ts`, checks live event/registration/payment state, dispatches recovery notifications via `dispatchSmartNotification()` with `presentationFormat: "reminder"`, and increments `reminder_stage`.

---

### Day 4 (4 Hours/Dev) - Pinterest-Style Visual Event Popups, Rich Push & Week 1 Milestone Merge

#### Sanaullah (Tech Lead) - 4 Hours (On `feat/w1-smart-notifications-foundation`)
1. **Audit Visual Notification Security, Accessibility & Queue Precedence**:
   - Verify image URL sanitization (allow HTTPS URLs and local `/images/` or Supabase storage paths; fallback cleanly on load error).
   - Verify priority ordering in the popup queue (`urgent` and `high` transactional notifications take precedence over `normal`/`low` visual recommendations).
2. **Author & Execute Week 1 Milestone Verification Suite**:
   - Create `scripts/verify-sn-milestone1.ts` (and register `verify:sn-m1` in [package.json](package.json)).
   - Verify all Week 1 checkpoints: bell, dropdown, notification center, preferences, quiet hours, scheduled promotion, event lifecycle notifications, campaign analytics preservation (`track_campaign_event`), abandoned-action recovery, Pinterest visual popups, and rich Web Push.
3. **Merge Week 1 Milestone to `main`**:
   - Review and merge Uzair's and Hardik's Day 4 PRs into `feat/w1-smart-notifications-foundation`.
   - Run `npm test && npx tsc --noEmit && npm run build`.
   - Merge `feat/w1-smart-notifications-foundation` into `main`.

#### Uzair (Software Engineer) - 4 Hours
- **Branch**: `feat/uzair-w1-d4-pinterest-visual-popups`
- **Target Base**: `feat/w1-smart-notifications-foundation`
- **PR Title**: `feat(w1-d4): build Pinterest-style visual event popup with queue and interruption guards`
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

#### Hardik (Software Engineer) - 4 Hours
- **Branch**: `feat/hardik-w1-d4-rich-push-service-worker`
- **Target Base**: `feat/w1-smart-notifications-foundation`
- **PR Title**: `feat(w1-d4): extend push payload and service worker for rich image notifications`
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

## 5. Week 2 Roadmap: Featured Events, Promotional Banners, Social Discovery & Admin Controls

> **Weekly Parent Branch**: `feat/w2-promotions-social-engagement` (Created by **Sanaullah** from updated `main`)  
> **Weekly Capacity**: 48 person-hours (4 days × 4 hours × 3 developers)  
> **Week 2 Goal**: Deliver platform-admin Featured Events and Home/Discover Promotional Banners (with decoupled impression/click analytics), launch explicit opt-in Contact Discovery with HMAC-SHA256 matching and granular attendance privacy controls (`Public`, `Connections`, `Private`), add Admin Social/Recovery/Broadcast controls, and complete full acceptance QA and release sign-off.

---

### Day 5 (4 Hours/Dev) - Platform-Admin Auth & Featured Events Promotion System

#### Sanaullah (Tech Lead) - 4 Hours (On `feat/w2-promotions-social-engagement`)
1. **Create Week 2 Parent Branch**:
   ```bash
   git checkout main && git pull origin main
   git checkout -b feat/w2-promotions-social-engagement
   git push -u origin feat/w2-promotions-social-engagement
   ```
2. **Author Week 2 Database Migration** (`supabase/migrations/20261117100000_promotions_and_social_discovery.sql`):
   - **Platform-Admin Authorization & Audit Trail**:
     - Add `is_platform_admin BOOLEAN NOT NULL DEFAULT false` to `public.profiles`.
     - Create `public.is_platform_admin()` (`SECURITY DEFINER` SQL function returning `true` only if `profiles.is_platform_admin = true` for `auth.uid()`).
     - Create `public.admin_audit_logs` (`id`, `admin_id`, `action`, `target_type`, `target_id`, `metadata`, `created_at`) and `public.admin_notification_settings` (`key TEXT PRIMARY KEY`, `value JSONB`, `updated_by`, `updated_at`) seeded with default config for social triggers, abandoned-action delays (`24h`, `72h`), and broadcast approval rules.
   - **Featured Events Table (`public.featured_events`)**:
     - Columns: `id UUID PRIMARY KEY`, `event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE`, `priority TEXT NOT NULL DEFAULT 'standard'` (`'standard' | 'high_priority' | 'campaign_level'`), `promotional_message TEXT`, `promotional_image_url TEXT`, `target_audience JSONB NOT NULL DEFAULT '{}'::jsonb` (`cities`, `category_ids`, `audience_groups`: `['interest_match', 'location_match', 'category_followers', 'organizer_followers', 'similar_event_attendees', 'organizers']`), `notification_channels TEXT[] DEFAULT ARRAY['in_app', 'push']`, `notification_mode TEXT NOT NULL DEFAULT 'platform_only'` (`'platform_only' | 'selected_audience' | 'broad_announcement' | 'scheduled_campaign'`), `scheduled_notification_at TIMESTAMPTZ`, `start_at TIMESTAMPTZ NOT NULL`, `end_at TIMESTAMPTZ NOT NULL`, `status TEXT NOT NULL DEFAULT 'active'` (`'scheduled' | 'active' | 'paused' | 'expired' | 'removed'`), `views_count INT NOT NULL DEFAULT 0`, `clicks_count INT NOT NULL DEFAULT 0`, `saves_count INT NOT NULL DEFAULT 0`, `registrations_count INT NOT NULL DEFAULT 0`, `created_by UUID REFERENCES profiles(id)`, `created_at TIMESTAMPTZ`, `updated_at TIMESTAMPTZ`.
     - RLS: Public `SELECT` for active featured rows (`status = 'active' AND start_at <= now() AND end_at > now()`); `ALL` write/admin read operations restricted to `public.is_platform_admin()`.
   - **Promotional Banners Table (`public.promotional_banners`) & `public.banner_analytics`** (created in Week 2 migration so Day 6 has zero DB wait):
     - Matches brief Section 4 schema (`id`, `title`, `description`, `image_url`, `mobile_image_url`, `desktop_image_url`, `cta_label`, `destination_url`, `placement` [`'home' | 'discover' | 'both'`], `slot_type` [`'featured_event_banner' | 'attend_announcement' | 'major_campaign' | 'category_promotion' | 'location_campaign' | 'platform_promotion'`], `priority INT DEFAULT 1`, `targeting_rules JSONB`, `start_at`, `end_at`, `status` [`'draft' | 'published' | 'paused' | 'archived'`], `impressions_count INT DEFAULT 0`, `clicks_count INT DEFAULT 0`, `created_by`, `created_at`, `updated_at`).
   - **Social Discovery & Privacy Schema** (created in Week 2 migration for Day 7):
     - Extend `public.profiles`: `attendance_visibility TEXT NOT NULL DEFAULT 'public'` (`'public' | 'connections' | 'private'`), `allow_social_notifications BOOLEAN NOT NULL DEFAULT true`, `allow_social_recommendations BOOLEAN NOT NULL DEFAULT true`, `allow_contact_discovery BOOLEAN NOT NULL DEFAULT false`, `contact_discovery_consented_at TIMESTAMPTZ`.
     - Create `public.user_contact_identifiers` (`id`, `user_id`, `identifier_type` [`'phone' | 'email'`], `hmac_hash TEXT UNIQUE`, `created_at`) and `public.user_connections` (`id`, `user_id`, `connected_user_id`, `relationship_type` [`'contact' | 'following'`], `is_blocked BOOLEAN DEFAULT false`, `created_at`, UNIQUE `(user_id, connected_user_id)`).
     - Update `public.public_event_attendees` view so only users with `COALESCE(p.attendance_visibility, 'public') = 'public'` appear in public attendee stacks!
3. **Publish Shared TypeScript Contracts & Admin Server Guard**:
   - Create `src/types/promotions.ts`, `src/types/social.ts`, and `src/lib/auth/admin.ts` (`requirePlatformAdmin()`, `isPlatformAdmin()`).
4. **Author Day 5 Verification Suite**: Create `scripts/verify-sn-w2-d5.ts` and review/merge Day 5 PRs.

#### Uzair (Software Engineer) - 4 Hours
- **Branch**: `feat/uzair-w2-d5-featured-events-admin-ui`
- **Target Base**: `feat/w2-promotions-social-engagement`
- **PR Title**: `feat(w2-d5): build admin featured events console and Home/Discover featured showcase`
- **Deliverables**:
  1. Build Platform-Admin Console shell at `src/app/admin/promotions/page.tsx` and `src/components/admin/FeaturedEventsManager.tsx`:
     - 4-Tab Admin Navigation: `[ Featured Events ]`, `[ Promotional Banners ]`, `[ Recovery & Social Controls ]`, `[ Broadcasts & Analytics ]`.
     - **Featured Events Manager**:
       - Select published event, set start and end dates, choose priority (`Standard Featured`, `High-Priority Featured`, `Campaign-Level Promotion`), choose channels (`In-App`, `Web Push`, `Both`), add custom promotional message, and upload/select promotional image.
       - Select recipient audience groups (`Interest match`, `Relevant locations`, `Category followers`, `Organizer followers`, `Similar event attendees`, `Relevant organizers`).
       - Choose delivery behaviour: `Feature on platform only` (zero notifications sent), `Feature and notify selected audience`, `Feature and send broader announcement`, or `Feature and schedule promotional campaign`.
       - Interactive **Notification Preview Card** before publishing + active featured table showing `Views`, `Saves`, `Registrations`, `CTR`, and `[ Remove Featured Status ]`.
  2. Build `src/components/home/FeaturedEventsSection.tsx` and integrate into [src/app/page.tsx](src/app/page.tsx) and [src/components/discover/DiscoverHub.tsx](src/components/discover/DiscoverHub.tsx):
     - Displays active featured events ordered by promotional priority (`campaign_level` -> `high_priority` -> `standard`) with a `"Featured on Attend"` badge, independent of whether the viewer received a notification.

#### Hardik (Software Engineer) - 4 Hours
- **Branch**: `feat/hardik-w2-d5-featured-events-service`
- **Target Base**: `feat/w2-promotions-social-engagement`
- **PR Title**: `feat(w2-d5): implement featured events service, audience targeting, and notification dispatch`
- **Deliverables**:
  1. Build `src/services/promotions.service.ts` and `src/app/actions/promotions.ts`:
     - Enforce `requirePlatformAdmin()` on all admin mutations and record every action in `admin_audit_logs`.
     - Implement `featureEvent()`, `removeFeaturedEvent()`, and `getActiveFeaturedEvents(placement, viewerContext)` (evaluating event relevance, viewer city, category interest, and active `[start_at, end_at]` schedule).
     - Implement `dispatchFeaturedEventCampaign(featuredEventId)`:
       - When `notification_mode === 'platform_only'`, skip notification dispatch completely.
       - When notifying an audience, resolve matching recipients in batches of 100 (`recipient_batches`), exclude users who already registered or were already exposed to the same event recently, and dispatch `"Featured on Attend"` visual notifications via `dispatchVisualEventNotification()` (with `scheduledFor` if `notification_mode === 'scheduled_campaign'`).
     - Implement `recordFeaturedEventMetric(featuredEventId, metric: 'view' | 'click' | 'save' | 'registration')` for conversion tracking by placement and audience.

---

### Day 6 (4 Hours/Dev) - Admin Promotional Banners & Broadcast/Trigger Controls

#### Sanaullah (Tech Lead) - 4 Hours (On `feat/w2-promotions-social-engagement`)
1. **Implement Decoupled Banner Analytics RPC & URL/Media Validation**:
   - Create `public.record_banner_interaction(p_banner_id UUID, p_interaction_type TEXT, p_placement TEXT, p_audience_segment TEXT)` SQL RPC that increments `promotional_banners.impressions_count` or `clicks_count` and logs to `banner_analytics` (strictly separate from `notifications` and `campaign_analytics`).
   - Create `src/lib/validations/promotions.ts` validating responsive image URLs, schedule ranges (`end_at > start_at`), and safe destination URLs.
2. **Author Day 6 Verification Suite**: Create `scripts/verify-sn-w2-d6.ts` testing banner creation, schedule expiry filtering, priority ordering, decoupled impression/click tracking, and admin trigger/broadcast configuration.
3. **Review & Merge**: Review and merge Uzair's and Hardik's Day 6 PRs.

#### Uzair (Software Engineer) - 4 Hours
- **Branch**: `feat/uzair-w2-d6-promotional-banners-ui`
- **Target Base**: `feat/w2-promotions-social-engagement`
- **PR Title**: `feat(w2-d6): build admin banner manager, trigger controls, and Home/Discover banner slots`
- **Deliverables**:
  1. Build `src/components/admin/BannerManagementTab.tsx` and `src/components/admin/AdminControlsAndBroadcastTab.tsx` in `/admin/promotions`:
     - **Banner Manager**: Create/edit banner with headline (`title`), short description, CTA label, destination URL, desktop & mobile image uploads/URLs, placement (`Home`, `Discover`, `Both`), slot category (`Featured Event Banner`, `Attend Announcement`, `Major Event Campaign`, `Category Promotion`, `Location Campaign`, `Platform Promotion`), display priority, target audience (cities/categories), and start/expiry dates.
     - Responsive preview toggle (`Desktop` vs `Mobile`), status actions (`Publish`, `Pause`, `Archive`), and `Impressions` / `Clicks` / `Conversion` metrics.
     - **Recovery, Social & Broadcast Controls Tab** (Brief Section 10):
       - Enable/disable abandoned-action recovery triggers, configure reminder delays (`24h`, `72h`) and max reminders, and edit message templates in `notification_templates`.
       - Enable/disable social notification triggers and inspect reported/blocked social triggers.
       - Send or schedule platform announcements / featured broadcasts with test preview and approval confirmation.
  2. Build `src/components/promotions/PromotionalBannerSlot.tsx` and integrate into predefined slots on [src/app/page.tsx](src/app/page.tsx) and [src/components/discover/DiscoverHub.tsx](src/components/discover/DiscoverHub.tsx):
     - Renders responsive `<picture>` (`desktop_image_url` on `md+`, `mobile_image_url` on mobile, with graceful fallback), priority carousel/stack when multiple banners are active, session frequency cap so the same banner is not shown excessively, and non-obstructive dismiss button.

#### Hardik (Software Engineer) - 4 Hours
- **Branch**: `feat/hardik-w2-d6-banner-service-analytics`
- **Target Base**: `feat/w2-promotions-social-engagement`
- **PR Title**: `feat(w2-d6): implement promotional banner CRUD, targeting filter, and admin broadcast services`
- **Deliverables**:
  1. Extend `src/services/promotions.service.ts` and `src/app/actions/promotions.ts`:
     - Implement `createPromotionalBanner()`, `updatePromotionalBanner()`, `updateBannerStatus()`, and `getActiveBannersForPlacement(placement: "home" | "discover", viewerContext)`:
       - Filters `status = 'published'`, `start_at <= now()`, `end_at IS NULL OR end_at > now()`, matches `placement IN (slot, 'both')`, evaluates city/category `targeting_rules`, and orders by `priority DESC, created_at DESC`.
     - Implement `trackBannerImpressionAction()` and `trackBannerClickAction()` invoking `record_banner_interaction` RPC.
     - Implement `updateAdminNotificationSettings()`, `updateNotificationTemplate()`, and idempotent chunked `dispatchAdminBroadcast()` (processing recipients in safe batches and checking `email_enabled` provider availability before marking email delivery complete).

---

### Day 7 (4 Hours/Dev) - Privacy-Conscious Social Discovery & Friend-Attending Notifications

#### Sanaullah (Tech Lead) - 4 Hours (On `feat/w2-promotions-social-engagement`)
1. **Build Protected Server-Side Contact Matching & Privacy Enforcement**:
   - Create `src/lib/security/contact-hmac.ts`:
     - Phone normalization (`normalizePhoneToE164(phone, defaultCountryCode = '+234')`): strips formatting, converts local Nigerian numbers (`080...`, `081...`, `070...`, `090...`, `091...`) to `+234...`, and validates international E.164 format.
     - Email normalization (`normalizeEmail(email)`): trims and lowercases.
     - Protected Identifier Hashing (`computeContactHmac(normalizedIdentifier)`): computes `HMAC-SHA256(normalizedIdentifier, process.env.CONTACT_MATCH_PEPPER)` strictly on the server so predictable phone numbers cannot be reversed via rainbow tables.
   - Create `public.match_user_contacts(p_hmac_hashes TEXT[])` (`SECURITY DEFINER` RPC):
     - Enforces rate limiting (max 5 sync calls/hour per user) and batch size cap (max 500 hashes per call).
     - Matches input HMAC hashes only against users where `profiles.allow_contact_discovery = true` and `user_id != auth.uid()`.
     - Upserts matched connections into `public.user_connections` and returns only safe public profile fields (`id`, `display_name`, `username`, `avatar_url`). Raw contact lists are never persisted.
2. **Author Day 7 Verification Suite**: Create `scripts/verify-sn-w2-d7.ts` testing E.164 normalization, HMAC pepper hashing, opt-in consent gating, `Public`/`Connections`/`Private` attendance visibility rules, and friend-attending notifications.
3. **Review & Merge**: Review and merge Uzair's and Hardik's Day 7 PRs.

#### Uzair (Software Engineer) - 4 Hours
- **Branch**: `feat/uzair-w2-d7-social-discovery-privacy-ui`
- **Target Base**: `feat/w2-promotions-social-engagement`
- **PR Title**: `feat(w2-d7): build opt-in contact discovery flow, privacy controls, and friend-attending badges`
- **Deliverables**:
  1. Upgrade [src/app/settings/notifications/page.tsx](src/app/settings/notifications/page.tsx) with a comprehensive **Privacy & Social Discovery** section (Brief Section 5.4):
     - **Attendance Visibility Selector**:
       - `Public attendance` (`public`): Visible on event pages and to connections.
       - `Visible to connections` (`connections`): Hidden from public strangers; visible only to your matched contacts/followed users.
       - `Private attendance` (`private`): Completely private; never shown in attendee stacks or social recommendations.
     - **4 Granular Privacy Controls**:
       1. Who can see your attended events (`attendance_visibility`).
       2. Whether your attendance can generate notifications to contacts (`allow_social_notifications`).
       3. Whether you appear in social event recommendations (`allow_social_recommendations`).
       4. Whether you can be discovered through contact matching (`allow_contact_discovery`).
     - **Revoke & Disconnect Control**: `[ Disconnect Contact Discovery & Remove Synced Matches ]` button with instant confirmation.
  2. Build `src/components/social/ContactDiscoveryModal.tsx` and `src/components/social/FriendsAttendingBadge.tsx`:
     - **Explicit Opt-In Consent Flow**: Explains clearly what contact access does, how identifiers are protected, and how to disconnect at any time before requesting permission. Never requests permission silently.
     - Supports native mobile `navigator.contacts.select(['tel', 'email'], { multiple: true })` when available, plus a clean phone/email input & CSV/vCard import option on desktop browsers.
     - **In-App Social Discovery Placements** (Brief Section 5.5): Render `FriendsAttendingBadge` (*"Your friend [Name] is attending"* or *"3 people in your network are attending"*) on [src/app/events/[id]/page.tsx](src/app/events/[id]/page.tsx), [src/components/discover/DiscoverHub.tsx](src/components/discover/DiscoverHub.tsx), and [src/components/HomeDiscover.tsx](src/components/HomeDiscover.tsx).

#### Hardik (Software Engineer) - 4 Hours
- **Branch**: `feat/hardik-w2-d7-contact-matching-service`
- **Target Base**: `feat/w2-promotions-social-engagement`
- **PR Title**: `feat(w2-d7): implement HMAC contact matching service and friend-attending notifications`
- **Deliverables**:
  1. Build `src/services/social-discovery.service.ts` and `src/app/actions/social.ts`:
     - `optInAndRegisterOwnContactIdentifiers()`: Records explicit user consent (`allow_contact_discovery = true`, `contact_discovery_consented_at = now()`) and stores HMAC-SHA256 hashes of the user's own verified email and optional phone number in `user_contact_identifiers`.
     - `syncUserContactsAction(rawContacts)`: Verifies active consent, normalizes phones/emails and computes HMACs in server memory, calls `match_user_contacts`, immediately discards raw contacts, and returns matched connections.
     - `disconnectContactDiscoveryAction()`: Sets `allow_contact_discovery = false` and deletes the user's rows from `user_contact_identifiers` and `user_connections`.
     - `getSocialAttendanceForEvents(viewerId, eventIds)`: Queries `event_participants` joined with `user_connections` and `profiles`, strictly filtering `ep.status IN ('attending', 'registered', 'ticketed')`, `p.attendance_visibility IN ('public', 'connections')`, `p.allow_social_recommendations = true`, and `uc.is_blocked = false`.
  2. Connect Social Attendance Notifications in [src/services/attendance.service.ts](src/services/attendance.service.ts) (`rsvpEvent`):
     - When a user RSVPs or registers for a published event, if their profile has `attendance_visibility IN ('public', 'connections')` and `allow_social_notifications = true` (and the admin social trigger is enabled), notify connected users via `dispatchVisualEventNotification()`:
       - Single contact: *"Your friend [Name] is attending [Event Title]."*
       - Multiple contacts (when >= 3 contacts are attending): *"3 people in your network are attending [Event Title]."*

---

### Day 8 (4 Hours/Dev) - End-to-End Integration, Acceptance QA & Final Release

#### Sanaullah (Tech Lead) - 4 Hours (On `feat/w2-promotions-social-engagement`)
1. **Author Comprehensive Milestone 2 Verification Suite**:
   - Create `scripts/verify-sn-milestone2.ts` covering all 10 mandatory verification areas from the brief and register `verify:sn-m1` and `verify:sn-m2` in [package.json](package.json) `npm test`.
2. **Execute Non-Negotiable Security & Regression Audit**:
   - Verify both `track_campaign_event` overloads and `campaign_analytics` are 100% untouched.
   - Verify `Mark all read` is intact and no `Clear notifications` button exists.
   - Verify all new database tables have RLS enabled and unauthorized access is blocked.
   - Verify zero em dashes (`U+2014`) across the entire repository.
3. **Final Release Merge to `main`**:
   - Review and merge Uzair's and Hardik's Day 8 PRs into `feat/w2-promotions-social-engagement`.
   - Run full verification: `npm test && npx tsc --noEmit && npm run build`.
   - Open and merge the final Weekly Milestone PR from `feat/w2-promotions-social-engagement` into `main`.

#### Uzair (Software Engineer) - 4 Hours
- **Branch**: `test/uzair-w2-d8-frontend-accessibility-qa`
- **Target Base**: `feat/w2-promotions-social-engagement`
- **PR Title**: `test(w2-d8): complete frontend QA, responsive polish, and accessibility verification`
- **Deliverables**:
  1. End-to-end Frontend & Accessibility QA:
     - Verify `NotificationToast` Pinterest visual popups on desktop and mobile viewports, image fallback rendering, keyboard `Escape` dismissal, and `aria-live="polite"`.
     - Verify Home and Discover `PromotionalBannerSlot`, `FeaturedEventsSection`, and `FriendsAttendingBadge` placements do not obstruct navigation or `MobileEventActionBar`.
     - Verify `/admin/promotions` tabs (`Featured Events`, `Promotional Banners`, `Recovery & Social Controls`, `Broadcasts & Analytics`) and non-admin redirect protection.
     - Author automated UI verification suite `scripts/verify-sn-w2-d8-ui.ts`.

#### Hardik (Software Engineer) - 4 Hours
- **Branch**: `test/hardik-w2-d8-backend-delivery-qa`
- **Target Base**: `feat/w2-promotions-social-engagement`
- **PR Title**: `test(w2-d8): complete backend engine, idempotency, and privacy boundary verification`
- **Deliverables**:
  1. End-to-end Backend, Idempotency & Privacy QA:
     - Verify idempotency across scheduled notifications, event reminders, abandoned-action recovery, and featured/broadcast campaigns (re-running dispatchers creates zero duplicates).
     - Verify that users with `attendance_visibility = 'private'` never appear in `public_event_attendees`, `FriendsAttendingBadge`, or friend-attending notifications.
     - Verify conversion and engagement metrics (impressions, clicks, dismissals, draft resumptions, recovery completions, contact matches) are accurately recorded.
     - Author automated backend verification suite `scripts/verify-sn-w2-d8-services.ts`.

---

## 6. Complete Branching & Pull Request Matrix

| Week | Day | Developer | Branch Name | Target Base Branch | Pull Request Title |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **W1** | **Parent** | **Sanaullah** | `feat/w1-smart-notifications-foundation` | `main` | `feat(w1): smart notification foundation, recovery & visual popups` |
| **W1** | **Day 1** | **Uzair** | `feat/uzair-w1-d1-notification-state-types` | `feat/w1-smart-notifications-foundation` | `feat(w1-d1): align notification store and UI with full lifecycle statuses` |
| **W1** | **Day 1** | **Hardik** | `feat/hardik-w1-d1-unified-smart-engine` | `feat/w1-smart-notifications-foundation` | `feat(w1-d1): unify notification dispatch through central smart engine` |
| **W1** | **Day 2** | **Uzair** | `feat/uzair-w1-d2-quiet-hours-settings-ui` | `feat/w1-smart-notifications-foundation` | `feat(w1-d2): add timezone detection and smart frequency controls to notification settings` |
| **W1** | **Day 2** | **Hardik** | `feat/hardik-w1-d2-scheduled-delivery-worker` | `feat/w1-smart-notifications-foundation` | `feat(w1-d2): implement scheduled notification promotion and event reminder dispatcher` |
| **W1** | **Day 3** | **Uzair** | `feat/uzair-w1-d3-abandoned-recovery-ui` | `feat/w1-smart-notifications-foundation` | `feat(w1-d3): add draft recovery banners and resume state for event creation and registration` |
| **W1** | **Day 3** | **Hardik** | `feat/hardik-w1-d3-abandoned-action-service` | `feat/w1-smart-notifications-foundation` | `feat(w1-d3): build abandoned-action state tracking and 24h recovery dispatcher` |
| **W1** | **Day 4** | **Uzair** | `feat/uzair-w1-d4-pinterest-visual-popups` | `feat/w1-smart-notifications-foundation` | `feat(w1-d4): build Pinterest-style visual event popup with queue and interruption guards` |
| **W1** | **Day 4** | **Hardik** | `feat/hardik-w1-d4-rich-push-service-worker` | `feat/w1-smart-notifications-foundation` | `feat(w1-d4): extend push payload and service worker for rich image notifications` |
| **W2** | **Parent** | **Sanaullah** | `feat/w2-promotions-social-engagement` | `main` | `feat(w2): featured events, promotional banners & social discovery` |
| **W2** | **Day 5** | **Uzair** | `feat/uzair-w2-d5-featured-events-admin-ui` | `feat/w2-promotions-social-engagement` | `feat(w2-d5): build admin featured events console and Home/Discover featured showcase` |
| **W2** | **Day 5** | **Hardik** | `feat/hardik-w2-d5-featured-events-service` | `feat/w2-promotions-social-engagement` | `feat(w2-d5): implement featured events service, audience targeting, and notification dispatch` |
| **W2** | **Day 6** | **Uzair** | `feat/uzair-w2-d6-promotional-banners-ui` | `feat/w2-promotions-social-engagement` | `feat(w2-d6): build admin banner manager, trigger controls, and Home/Discover banner slots` |
| **W2** | **Day 6** | **Hardik** | `feat/hardik-w2-d6-banner-service-analytics` | `feat/w2-promotions-social-engagement` | `feat(w2-d6): implement promotional banner CRUD, targeting filter, and admin broadcast services` |
| **W2** | **Day 7** | **Uzair** | `feat/uzair-w2-d7-social-discovery-privacy-ui` | `feat/w2-promotions-social-engagement` | `feat(w2-d7): build opt-in contact discovery flow, privacy controls, and friend-attending badges` |
| **W2** | **Day 7** | **Hardik** | `feat/hardik-w2-d7-contact-matching-service` | `feat/w2-promotions-social-engagement` | `feat(w2-d7): implement HMAC contact matching service and friend-attending notifications` |
| **W2** | **Day 8** | **Uzair** | `test/uzair-w2-d8-frontend-accessibility-qa` | `feat/w2-promotions-social-engagement` | `test(w2-d8): complete frontend QA, responsive polish, and accessibility verification` |
| **W2** | **Day 8** | **Hardik** | `test/hardik-w2-d8-backend-delivery-qa` | `feat/w2-promotions-social-engagement` | `test(w2-d8): complete backend engine, idempotency, and privacy boundary verification` |

---

## 7. Mandatory Verification & Final Acceptance Matrix

Before any daily PR or weekly milestone branch is merged, all 3 standard checks plus the 10 focused verification areas must pass:

```bash
npm test
npx tsc --noEmit
npm run build
```

### Mapping of All 10 Mandatory Verification Areas & Final Acceptance Criteria

| # | Verification Area | Acceptance Requirement | Implementing Day | Responsible Owner(s) | Automated Verification Script |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **1** | **Smart Notification Preferences** | Category toggles, daily frequency caps, and unified account relationship eligibility (attendee vs organizer vs campaign owner) work accurately without raw-insert bypass. | Week 1 · Days 1-2 | Sanaullah, Uzair & Hardik | `scripts/smart-notifications/verify-sn-w1-d1.ts` & `scripts/smart-notifications/verify-sn-w1-d2.ts` |
| **2** | **Notification Deduplication** | Duplicate triggers with identical `dedupe_key` in `notifications` or `notification_events` are suppressed idempotently on both server and client. | Week 1 · Days 1-2 | Sanaullah & Hardik | `scripts/smart-notifications/verify-sn-w1-d2.ts` |
| **3** | **Quiet Hours & Scheduled Delivery** | Non-urgent notifications during user's local timezone quiet hours (`Africa/Lagos` default) are held as `status = 'scheduled'`, hidden from realtime unread UI, and promoted when due. | Week 1 · Day 2 | Sanaullah, Uzair & Hardik | `scripts/smart-notifications/verify-sn-w1-d2.ts` |
| **4** | **Event Lifecycle Notifications** | Registration receipts, event date/venue updates, 24h/2h event reminders, campaign creations, and urgent event cancellations dispatch through the central engine. | Week 1 · Days 1-2 | Hardik & Sanaullah | `scripts/smart-notifications/verify-sn-w1-d1.ts` & `scripts/smart-notifications/verify-sn-w1-d2.ts` |
| **5** | **Abandoned-Action Suppression** | Meaningful unfinished event/campaign drafts and registrations trigger product-oriented 24h reminders, verify payment/registration state, and auto-suppress on resume/completion/delete. | Week 1 · Day 3 | Sanaullah, Uzair & Hardik | `scripts/smart-notifications/verify-sn-w1-d3.ts` |
| **6** | **Image Notification Rendering** | Pinterest-style visual popups render cover image, graceful fallback when image is missing, `Date · City`, recommendation reason, CTA, single-popup FIFO queue, and active-flow interruption guard. | Week 1 · Day 4 | Uzair & Sanaullah | `scripts/verify-sn-milestone1.ts` |
| **7** | **Push Delivery & Click Navigation** | Existing `send-push` pipeline and `worker/index.ts` render event cover images in browser push notifications and enforce same-origin click navigation. | Week 1 · Day 4 | Hardik | `scripts/verify-sn-milestone1.ts` |
| **8** | **Featured-Event Scheduling & Audience Rules** | Platform admin can feature/unfeature events, set priority & schedule, and choose `platform_only` placement independently of targeted audience notifications. | Week 2 · Day 5 | Sanaullah, Uzair & Hardik | `scripts/verify-sn-w2-d5.ts` |
| **9** | **Banner Visibility & Analytics** | Admin can publish responsive banners to Home, Discover, or both; expired/paused banners hide automatically; banner impressions and clicks are tracked separately from notifications. | Week 2 · Day 6 | Sanaullah, Uzair & Hardik | `scripts/verify-sn-w2-d6.ts` |
| **10** | **Contact Matching & Attendance Privacy** | Explicit user opt-in before contact matching; server-side HMAC-SHA256 matching without storing raw address books; `Public`, `Connections`, and `Private` attendance visibility strictly enforced. | Week 2 · Day 7 | Sanaullah, Uzair & Hardik | `scripts/verify-sn-w2-d7.ts` |
| **11** | **Non-Negotiable Regression Guard** | Existing bell, dropdown, `Mark all read`, event/campaign flows, and both `track_campaign_event` overloads in `campaign_analytics` pass with zero regressions. | Week 2 · Day 8 | All (Sign-off by Sanaullah) | `scripts/verify-sn-milestone2.ts` & `npm test` |

---

## 8. Non-Negotiable Engineering Guardrails & Scope Control

1. **Preserve Campaign Analytics**: Never modify `campaign_analytics` or either `track_campaign_event` overload.
2. **Preserve Notification Controls**: Keep `Mark all read` functional; never add a `Clear notifications` action.
3. **Unified Account Context**: Never split attendee and organizer accounts; resolve eligibility per event/activity relationship.
4. **Server-Side Privileged Operations**: All cross-user notification creation, scheduled promotion, admin broadcasts, and contact matching must execute server-side with RLS enabled on every exposed table.
5. **No Surveillance Copy or Tracking**: Only track explicit saved drafts and form progress; never send immediate abandonment messages or creepy precision timing copy.
6. **Decoupled Banners vs Featured Events vs Notifications**: A featured event is an event-level promotional status; a banner is a frontend content slot with its own impression/click lifecycle; neither is tightly coupled to notification center rows.
7. **Zero Em Dashes (`U+2014`)**: Maintain strict compliance with [CONTRIBUTING.md](CONTRIBUTING.md) across all TypeScript, SQL, JSX, and Markdown files.
