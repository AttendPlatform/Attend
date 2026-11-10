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

async function runSmartNotificationsDay2Verification() {
  console.log("\n=============================================================");
  console.log("Starting Smart Notifications Week 1 Day 2 Verification");
  console.log("Scope: Timezone Quiet Hours, Frequency Caps & Scheduled Delivery");
  console.log("=============================================================\n");

  const cwd = process.cwd();

  // 1. Target Files & Schemas
  console.log("--- 1. Target Files & Schemas ---");
  const migrationPath = resolve(cwd, "supabase/migrations/20261110110000_smart_notifications_day2.sql");
  const dbTypesPath = resolve(cwd, "src/lib/supabase/database.types.ts");
  const planDocPath = resolve(cwd, "docs/smart_notification_implementation_plan.md");

  check("Day 2 migration file exists: 20261110110000_smart_notifications_day2.sql", existsSync(migrationPath));
  check("Database types file exists: src/lib/supabase/database.types.ts", existsSync(dbTypesPath));
  check("Implementation plan document exists: docs/smart_notification_implementation_plan.md", existsSync(planDocPath));

  const migrationContent = readFileSync(migrationPath, "utf8");
  const dbTypesContent = readFileSync(dbTypesPath, "utf8");

  // 2. SQL RPC Definitions
  console.log("\n--- 2. SQL RPC Definitions ---");
  check(
    "Migration defines create_notification_for_user function",
    migrationContent.includes("CREATE OR REPLACE FUNCTION public.create_notification_for_user")
  );
  check(
    "Migration defines process_smart_notification compatibility alias",
    migrationContent.includes("CREATE OR REPLACE FUNCTION public.process_smart_notification")
  );
  check(
    "Migration defines promote_scheduled_notifications SECURITY DEFINER function",
    migrationContent.includes("CREATE OR REPLACE FUNCTION public.promote_scheduled_notifications") &&
      migrationContent.includes("SECURITY DEFINER")
  );
  check(
    "Migration upgrades get_my_notifications with active status filtering",
    migrationContent.includes("CREATE OR REPLACE FUNCTION public.get_my_notifications") &&
      migrationContent.includes("n.status IN ('unread', 'read', 'sent')")
  );
  check(
    "Migration upgrades get_unread_notification_count with active status filtering",
    migrationContent.includes("CREATE OR REPLACE FUNCTION public.get_unread_notification_count") &&
      migrationContent.includes("status IN ('unread', 'sent')")
  );

  // 3. Idempotent Deduplication
  console.log("\n--- 3. Idempotent Deduplication ---");
  check(
    "RPC checks notifications.dedupe_key for existing records",
    migrationContent.includes("WHERE dedupe_key = p_dedupe_key")
  );
  check(
    "RPC checks notification_events.dedupe_key for prior suppression",
    migrationContent.includes("FROM public.notification_events") &&
      migrationContent.includes("event_type = 'suppressed'")
  );
  check(
    "RPC returns existing row idempotently without duplicate insert",
    migrationContent.includes("IF FOUND THEN") &&
      migrationContent.includes("RETURN row_to_json(v_existing_notif)::text;")
  );

  // 4. User Preferences & Transactional Bypass
  console.log("\n--- 4. User Preferences & Transactional Bypass ---");
  check(
    "RPC queries notification_preferences for recipient user",
    migrationContent.includes("FROM public.notification_preferences") &&
      migrationContent.includes("WHERE user_id = p_user_id")
  );
  check(
    "RPC allows urgent notifications to bypass preference toggles",
    migrationContent.includes("p_priority = 'urgent'")
  );
  check(
    "RPC allows transactional event_cancelled and registration_receipt types to deliver",
    migrationContent.includes("p_type IN ('event_cancelled', 'registration_receipt')")
  );
  check(
    "RPC maps event_reminders, new_events, and trending_events toggles",
    migrationContent.includes("v_pref.event_reminders") &&
      migrationContent.includes("v_pref.new_events") &&
      migrationContent.includes("v_pref.trending_events")
  );
  check(
    "RPC maps campaign_activity and campaign_milestones toggles",
    migrationContent.includes("v_pref.campaign_activity") &&
      migrationContent.includes("v_pref.campaign_milestones")
  );
  check(
    "RPC maps recommendations, recovery, and social toggles",
    migrationContent.includes("v_pref.recommendations") &&
      migrationContent.includes("v_pref.abandoned_reminders_enabled") &&
      migrationContent.includes("v_pref.social_notifications_enabled")
  );
  check(
    "RPC logs suppressed notification events on preference suppression",
    migrationContent.includes("INSERT INTO public.notification_events") &&
      migrationContent.includes("'preference_disabled'")
  );

  // 5. Sliding 24-Hour Daily Frequency Caps
  console.log("\n--- 5. Sliding 24-Hour Daily Frequency Caps ---");
  check(
    "RPC checks smart_notifications flag and low/normal priority for frequency capping",
    migrationContent.includes("COALESCE(v_pref.smart_notifications, true)") &&
      migrationContent.includes("p_priority IN ('low', 'normal')")
  );
  check(
    "RPC counts notifications delivered in sliding 24-hour window",
    migrationContent.includes("created_at >= (now() - interval '24 hours')") &&
      migrationContent.includes("priority IN ('low', 'normal')")
  );
  check(
    "RPC evaluates against user max_daily_notifications limit",
    migrationContent.includes("COALESCE(v_pref.max_daily_notifications, 5)")
  );
  check(
    "RPC logs frequency_cap_exceeded event to notification_events",
    migrationContent.includes("'frequency_cap_exceeded'")
  );

  // 6. Timezone-Aware Quiet Hours & Overnight Calculation
  console.log("\n--- 6. Timezone-Aware Quiet Hours & Overnight Calculation ---");
  check(
    "RPC defaults user timezone to Africa/Lagos",
    migrationContent.includes("COALESCE(v_pref.timezone, 'Africa/Lagos')")
  );
  check(
    "RPC evaluates user local time at timezone",
    migrationContent.includes("(now() AT TIME ZONE v_tz)::time")
  );
  check(
    "RPC supports same-day quiet hours span",
    migrationContent.includes("v_start_time < v_end_time") &&
      migrationContent.includes("v_current_local_time >= v_start_time AND v_current_local_time < v_end_time")
  );
  check(
    "RPC supports overnight quiet hours span (e.g. 22:00 to 07:00)",
    migrationContent.includes("Overnight quiet hours") &&
      migrationContent.includes("(v_current_local_date + interval '1 day')::date + v_end_time")
  );
  check(
    "RPC converts user local quiet hours end time back to UTC timestamptz",
    migrationContent.includes("v_target_local_ts AT TIME ZONE v_tz")
  );
  check(
    "RPC marks quiet-hours notifications as scheduled status with scheduled_for",
    migrationContent.includes("v_status := 'scheduled'") &&
      migrationContent.includes("v_scheduled_for := v_target_local_ts AT TIME ZONE v_tz")
  );

  // 7. Atomic Scheduled Notification Promotion
  console.log("\n--- 7. Atomic Scheduled Notification Promotion ---");
  check(
    "promote_scheduled_notifications updates status to unread and sets sent_at",
    migrationContent.includes("status = 'unread'") &&
      migrationContent.includes("sent_at = now()")
  );
  check(
    "promote_scheduled_notifications filters due rows where scheduled_for <= now()",
    migrationContent.includes("status = 'scheduled'") &&
      migrationContent.includes("scheduled_for <= now()")
  );
  check(
    "promote_scheduled_notifications guards against expired rows",
    migrationContent.includes("expires_at IS NULL OR expires_at > now()")
  );
  check(
    "promote_scheduled_notifications returns promoted notifications",
    migrationContent.includes("RETURNS SETOF public.notifications") &&
      migrationContent.includes("RETURNING *")
  );

  // 8. Database TypeScript Mirroring
  console.log("\n--- 8. Database TypeScript Mirroring ---");
  check(
    "database.types.ts contains promote_scheduled_notifications RPC",
    dbTypesContent.includes("promote_scheduled_notifications: {")
  );
  check(
    "database.types.ts get_my_notifications includes image_url, presentation_format, why_recommended",
    dbTypesContent.includes("image_url: string | null") &&
      dbTypesContent.includes("presentation_format: string") &&
      dbTypesContent.includes("why_recommended: string | null")
  );

  // 9. Zero Em Dashes Policy
  console.log("\n--- 9. Zero Em Dashes Policy ---");
  const filesToCheck = [
    migrationPath,
    dbTypesPath,
    planDocPath,
    resolve(cwd, "scripts/smart-notifications/verify-sn-w1-d2.ts"),
  ];

  for (const f of filesToCheck) {
    if (existsSync(f)) {
      const content = readFileSync(f, "utf8");
      check(`Zero em dashes in ${f.replace(cwd + "/", "")}`, !content.includes("\u2014"));
    }
  }

  // Summary
  console.log("\n=============================================================");
  const passedCount = results.filter((r) => r.passed).length;
  const failedCount = results.filter((r) => !r.passed).length;
  console.log(`Smart Notifications Day 2 Summary: ${passedCount} passed, ${failedCount} failed`);
  console.log("=============================================================\n");

  if (failedCount > 0) {
    process.exit(1);
  }
}

runSmartNotificationsDay2Verification().catch((err) => {
  console.error("Verification suite failed:", err);
  process.exit(1);
});
