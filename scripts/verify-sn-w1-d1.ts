import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

interface CheckResult {
  name: string;
  passed: boolean;
  details?: string;
}

const results: CheckResult[] = [];

function check(name: string, condition: boolean, details?: string) {
  results.push({ name, passed: condition, details });
  const symbol = condition ? "PASS" : "FAIL";
  console.log(`[${symbol}] ${name}${details ? ` (${details})` : ""}`);
}

async function runSmartNotificationsDay1Verification() {
  console.log("\n=============================================================");
  console.log("Starting Smart Notifications Week 1 Day 1 Verification");
  console.log("Scope: Schema Foundation, Shared Contracts & Unified Engine Types");
  console.log("=============================================================\n");

  const cwd = process.cwd();

  // 1. Target files and barrel exports
  console.log("--- 1. Target Files & Barrel Exports ---");
  const migrationPath = resolve(cwd, "supabase/migrations/20261110100000_smart_notifications_foundation.sql");
  const notificationsTypePath = resolve(cwd, "src/types/notifications.ts");
  const indexTypePath = resolve(cwd, "src/types/index.ts");
  const libNotificationsTypePath = resolve(cwd, "src/lib/notifications/types.ts");
  const dbTypesPath = resolve(cwd, "src/lib/supabase/database.types.ts");
  const planDocPath = resolve(cwd, "docs/smart_notification_implementation_plan.md");

  check("Migration file exists: 20261110100000_smart_notifications_foundation.sql", existsSync(migrationPath));
  check("Shared types file exists: src/types/notifications.ts", existsSync(notificationsTypePath));
  check("Barrel index exists: src/types/index.ts", existsSync(indexTypePath));
  check("Lib notification types exist: src/lib/notifications/types.ts", existsSync(libNotificationsTypePath));
  check("Database types file exists: src/lib/supabase/database.types.ts", existsSync(dbTypesPath));
  check("Implementation plan document exists: docs/smart_notification_implementation_plan.md", existsSync(planDocPath));

  const indexContent = readFileSync(indexTypePath, "utf8");
  check(
    "src/types/index.ts exports notifications contracts",
    indexContent.includes('export * from "./notifications";')
  );

  const libTypesContent = readFileSync(libNotificationsTypePath, "utf8");
  check(
    "src/lib/notifications/types.ts re-exports from src/types/notifications",
    libTypesContent.includes('@/types/notifications')
  );

  // 2. Database Migration Integrity
  console.log("\n--- 2. Database Migration Integrity ---");
  const migrationContent = readFileSync(migrationPath, "utf8");

  check(
    "Migration extends notifications with image_url and image_alt",
    migrationContent.includes("ADD COLUMN IF NOT EXISTS image_url TEXT") &&
      migrationContent.includes("ADD COLUMN IF NOT EXISTS image_alt TEXT")
  );

  check(
    "Migration extends notifications with presentation_format and check constraint",
    migrationContent.includes("ADD COLUMN IF NOT EXISTS presentation_format TEXT") &&
      migrationContent.includes("chk_notifications_presentation_format")
  );

  const formats = [
    "text",
    "image_popup",
    "featured_event",
    "banner",
    "social",
    "reminder",
    "organizer_insight",
    "system_announcement",
  ];
  const allFormatsInConstraint = formats.every((f) => migrationContent.includes(`'${f}'`));
  check("Migration presentation_format check constraint defines all 8 formats", allFormatsInConstraint);

  check(
    "Migration extends notifications with why_recommended, dismissed_at, and retry_count",
    migrationContent.includes("ADD COLUMN IF NOT EXISTS why_recommended TEXT") &&
      migrationContent.includes("ADD COLUMN IF NOT EXISTS dismissed_at TIMESTAMPTZ") &&
      migrationContent.includes("ADD COLUMN IF NOT EXISTS retry_count INT")
  );

  check(
    "Migration creates performance indexes on notifications",
    migrationContent.includes("idx_notifications_user_status") &&
      migrationContent.includes("idx_notifications_scheduled")
  );

  check(
    "Migration extends notification_preferences with timezone, recovery, and frequency limits",
    migrationContent.includes("ADD COLUMN IF NOT EXISTS timezone TEXT NOT NULL DEFAULT 'Africa/Lagos'") &&
      migrationContent.includes("ADD COLUMN IF NOT EXISTS abandoned_reminders_enabled BOOLEAN NOT NULL DEFAULT true") &&
      migrationContent.includes("ADD COLUMN IF NOT EXISTS social_notifications_enabled BOOLEAN NOT NULL DEFAULT true") &&
      migrationContent.includes("ADD COLUMN IF NOT EXISTS max_daily_notifications INT NOT NULL DEFAULT 5")
  );

  check(
    "Migration creates notification_templates table if not exists with unique type",
    migrationContent.includes("CREATE TABLE IF NOT EXISTS public.notification_templates") &&
      migrationContent.includes("idx_notification_templates_type")
  );

  const templates = [
    "event_reminder_24h",
    "event_reminder_2h",
    "event_update",
    "event_cancelled",
    "registration_receipt",
    "campaign_created",
    "campaign_milestone",
    "abandoned_event_draft",
    "abandoned_campaign_draft",
    "abandoned_registration",
    "featured_event_visual",
    "friend_attending",
  ];
  const allTemplatesSeeded = templates.every((t) => migrationContent.includes(`'${t}'`));
  check("Migration seeds all 12 canonical notification templates", allTemplatesSeeded);

  check(
    "Migration creates abandoned_actions table with required columns",
    migrationContent.includes("CREATE TABLE IF NOT EXISTS public.abandoned_actions") &&
      migrationContent.includes("action_type TEXT NOT NULL CHECK") &&
      migrationContent.includes("draft_payload JSONB") &&
      migrationContent.includes("resume_url TEXT NOT NULL") &&
      migrationContent.includes("reminder_stage INT NOT NULL DEFAULT 0") &&
      migrationContent.includes("status TEXT NOT NULL DEFAULT 'active'")
  );

  check(
    "Migration creates unique index for abandoned action progress upserts",
    migrationContent.includes("idx_abandoned_actions_unique_progress")
  );

  check(
    "Migration enables RLS on abandoned_actions with authenticated policies",
    migrationContent.includes("ALTER TABLE public.abandoned_actions ENABLE ROW LEVEL SECURITY;") &&
      migrationContent.includes("CREATE POLICY \"Users can view their own abandoned actions\"") &&
      migrationContent.includes("CREATE POLICY \"Users can insert their own abandoned actions\"") &&
      migrationContent.includes("CREATE POLICY \"Users can update their own abandoned actions\"") &&
      migrationContent.includes("CREATE POLICY \"Users can delete their own abandoned actions\"")
  );

  // 3. Shared TypeScript Contracts & Domain Models
  console.log("\n--- 3. Shared TypeScript Contracts & Domain Models ---");
  const notificationsTypeContent = readFileSync(notificationsTypePath, "utf8");

  check(
    "NotificationStatus includes all 7 lifecycle states",
    notificationsTypeContent.includes('"unread"') &&
      notificationsTypeContent.includes('"read"') &&
      notificationsTypeContent.includes('"scheduled"') &&
      notificationsTypeContent.includes('"sent"') &&
      notificationsTypeContent.includes('"suppressed"') &&
      notificationsTypeContent.includes('"expired"') &&
      notificationsTypeContent.includes('"dismissed"')
  );

  check(
    "NotificationPriority defines low, normal, high, and urgent",
    notificationsTypeContent.includes('"low"') &&
      notificationsTypeContent.includes('"normal"') &&
      notificationsTypeContent.includes('"high"') &&
      notificationsTypeContent.includes('"urgent"')
  );

  check(
    "NotificationPresentationFormat defines all 8 presentation formats",
    formats.every((f) => notificationsTypeContent.includes(`"${f}"`))
  );

  check(
    "Notification interface includes presentation_format, image_url, and why_recommended",
    notificationsTypeContent.includes("presentation_format?: NotificationPresentationFormat;") &&
      notificationsTypeContent.includes("image_url?: string | null;") &&
      notificationsTypeContent.includes("why_recommended?: string | null;")
  );

  check(
    "SmartNotificationInput contract supports rich metadata and dedupeKey",
    notificationsTypeContent.includes("export interface SmartNotificationInput") &&
      notificationsTypeContent.includes("presentationFormat?: NotificationPresentationFormat;") &&
      notificationsTypeContent.includes("imageUrl?: string | null;") &&
      notificationsTypeContent.includes("dedupeKey?: string | null;")
  );

  check(
    "VisualNotificationPayload contract supports event cover and recipient list",
    notificationsTypeContent.includes("export interface VisualNotificationPayload") &&
      notificationsTypeContent.includes("coverImage?: string | null;") &&
      notificationsTypeContent.includes("recipientUserIds: string[];")
  );

  check(
    "AbandonedActionType union defines event_draft, campaign_draft, incomplete_registration",
    notificationsTypeContent.includes('"event_draft"') &&
      notificationsTypeContent.includes('"campaign_draft"') &&
      notificationsTypeContent.includes('"incomplete_registration"')
  );

  check(
    "AbandonedActionRecord interface defined",
    notificationsTypeContent.includes("export interface AbandonedActionRecord") &&
      notificationsTypeContent.includes("action_type: AbandonedActionType;") &&
      notificationsTypeContent.includes("draft_payload: Record<string, unknown>;") &&
      notificationsTypeContent.includes("status: AbandonedActionStatus;")
  );

  check(
    "NotificationPreferences includes timezone, abandoned_reminders_enabled, and max_daily_notifications",
    notificationsTypeContent.includes("timezone: string;") &&
      notificationsTypeContent.includes("abandoned_reminders_enabled: boolean;") &&
      notificationsTypeContent.includes("max_daily_notifications: number;")
  );

  check(
    "RecipientEligibilityContext interface defined for relationship checks",
    notificationsTypeContent.includes("export interface RecipientEligibilityContext") &&
      notificationsTypeContent.includes("roleRequired?:")
  );

  // 4. Database Type Mirroring
  console.log("\n--- 4. Database Type Mirroring ---");
  const dbTypesContent = readFileSync(dbTypesPath, "utf8");

  check(
    "database.types.ts contains abandoned_actions table",
    dbTypesContent.includes("abandoned_actions: {") &&
      dbTypesContent.includes("action_type: string") &&
      dbTypesContent.includes("draft_payload: Json") &&
      dbTypesContent.includes("resume_url: string")
  );

  check(
    "database.types.ts notifications contains image_url and presentation_format",
    dbTypesContent.includes("image_url: string | null") &&
      dbTypesContent.includes("presentation_format: string")
  );

  check(
    "database.types.ts notification_preferences contains timezone and abandoned_reminders_enabled",
    dbTypesContent.includes("timezone: string") &&
      dbTypesContent.includes("abandoned_reminders_enabled: boolean")
  );

  // 5. Store & Client Lifecycle State Verification (Uzair Day 1)
  console.log("\n--- 5. Store & Client Lifecycle State Verification ---");
  const clientPath = resolve(cwd, "src/lib/notifications/client.ts");
  const storePath = resolve(cwd, "src/stores/useNotificationsStore.ts");
  const dropdownPath = resolve(cwd, "src/components/notifications/NotificationDropdown.tsx");
  const notificationsPagePath = resolve(cwd, "src/app/notifications/page.tsx");
  const hookPath = resolve(cwd, "src/hooks/useNotifications.ts");

  check("Client helpers file exists: src/lib/notifications/client.ts", existsSync(clientPath));
  check("Notification store exists: src/stores/useNotificationsStore.ts", existsSync(storePath));
  check("Notification dropdown exists: src/components/notifications/NotificationDropdown.tsx", existsSync(dropdownPath));
  check("Notifications page exists: src/app/notifications/page.tsx", existsSync(notificationsPagePath));
  check("Notification hook exists: src/hooks/useNotifications.ts", existsSync(hookPath));

  const clientContent = readFileSync(clientPath, "utf8");
  check(
    "client.ts exports dismissNotification helper",
    clientContent.includes("export async function dismissNotification")
  );
  check(
    "client.ts exports recordNotificationInteraction helper",
    clientContent.includes("export async function recordNotificationInteraction")
  );

  const storeContent = readFileSync(storePath, "utf8");
  check(
    "useNotificationsStore filters non-active status rows on Realtime INSERT",
    storeContent.includes("notification.status !== 'unread' && notification.status !== 'sent'")
  );
  check(
    "useNotificationsStore promotes scheduled notifications on Realtime UPDATE",
    storeContent.includes("wasScheduled && isNowUnread")
  );
  check(
    "useNotificationsStore deduplicates incoming notifications by id and dedupe_key",
    storeContent.includes("isDuplicateId || isDuplicateDedupe")
  );
  check(
    "useNotificationsStore provides dismissNotification action",
    storeContent.includes("dismissNotification: async (id: string)")
  );

  const dropdownContent = readFileSync(dropdownPath, "utf8");
  check(
    "NotificationDropdown filters dismissed, suppressed, and expired rows",
    dropdownContent.includes('item.status === "dismissed"')
  );
  check(
    "NotificationDropdown displays priority indicator badges and thumbnails",
    dropdownContent.includes('item.priority === "urgent"') &&
      dropdownContent.includes("item.image_url")
  );
  check(
    "NotificationDropdown records click interaction on notification selection",
    dropdownContent.includes("recordNotificationInteraction")
  );

  const pageContent = readFileSync(notificationsPagePath, "utf8");
  check(
    "Notifications page provides category filter pills (all, events, campaigns, reminders, social)",
    pageContent.includes("setCategoryFilter") &&
      pageContent.includes('"events"') &&
      pageContent.includes('"campaigns"') &&
      pageContent.includes('"reminders"') &&
      pageContent.includes('"social"')
  );
  check(
    "Notifications page displays priority badges and event cover thumbnails",
    pageContent.includes('notification.priority === "urgent"') &&
      pageContent.includes("notification.image_url")
  );
  check(
    "Notifications page supports notification dismissal action",
    pageContent.includes("dismissNotification") &&
      (pageContent.includes("handleDismiss") || pageContent.includes("dismissNotification("))
  );

  // 6. Zero Em Dashes Policy
  console.log("\n--- 6. Zero Em Dashes Policy ---");
  const filesToCheck = [
    migrationPath,
    notificationsTypePath,
    libNotificationsTypePath,
    indexTypePath,
    planDocPath,
    clientPath,
    storePath,
    dropdownPath,
    notificationsPagePath,
    hookPath,
  ];

  for (const f of filesToCheck) {
    const content = readFileSync(f, "utf8");
    check(`Zero em dashes in ${f.replace(cwd + "/", "")}`, !content.includes("\u2014"));
  }

  // Summary
  console.log("\n=============================================================");
  const passedCount = results.filter((r) => r.passed).length;
  const failedCount = results.filter((r) => !r.passed).length;
  console.log(`Smart Notifications Day 1 Summary: ${passedCount} passed, ${failedCount} failed`);
  console.log("=============================================================\n");

  if (failedCount > 0) {
    process.exit(1);
  }
}

runSmartNotificationsDay1Verification().catch((err) => {
  console.error("Verification error:", err);
  process.exit(1);
});

