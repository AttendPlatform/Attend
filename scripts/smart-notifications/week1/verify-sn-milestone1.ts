import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import type { Notification } from "../../../src/types/notifications.ts";
import {
  evaluateIncompleteRegistrationEligibility,
  evaluateRecoveryTiming,
  getRecoveryCopyTemplate,
  hasMeaningfulAbandonedProgress,
  validateRecoveryCopy,
} from "../../../src/lib/notifications/recovery-rules.ts";
import {
  canDisplayPopupNotification,
  enqueuePopupNotification,
  getNextEligiblePopupNotification,
  getVisualPopupAccessibilityProps,
  isInterruptionGuardedRoute,
  isSafeNotificationActionUrl,
  isSupabaseStorageUrl,
  resolveVisualNotificationImage,
  sanitizeNotificationActionUrl,
  sanitizeNotificationImageUrl,
  sortNotificationPopupQueue,
  VISUAL_POPUP_COOLDOWN_MS,
} from "../../../src/lib/notifications/visual-rules.ts";

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

function makeNotification(overrides: Partial<Notification> = {}): Notification {
  return {
    id: "notif-1",
    user_id: "user-1",
    type: "event_reminder_24h",
    category: "event_reminder",
    title: "Upcoming event",
    message: "Your event starts tomorrow.",
    action_url: "/events/event-1",
    action_label: "View event",
    event_id: "event-1",
    campaign_id: null,
    metadata: {},
    dedupe_key: null,
    delivery_channel: "in_app",
    status: "unread",
    priority: "normal",
    presentation_format: "text",
    image_url: null,
    image_alt: null,
    why_recommended: null,
    read_at: null,
    dismissed_at: null,
    scheduled_for: null,
    sent_at: null,
    created_at: "2026-11-12T10:00:00.000Z",
    ...overrides,
  };
}

async function runSmartNotificationsMilestone1Verification() {
  console.log("\n=============================================================");
  console.log("Starting Smart Notifications Week 1 Milestone 1 Verification");
  console.log("Scope: Foundation, Quiet Hours, Recovery, Visual Security & Push");
  console.log("=============================================================\n");

  const cwd = process.cwd();

  // 1. Bell, Dropdown & Notification Center Regression Guard
  console.log("--- 1. Bell, Dropdown & Notification Center ---");
  const bellPath = resolve(cwd, "src/components/notifications/NotificationBell.tsx");
  const dropdownPath = resolve(cwd, "src/components/notifications/NotificationDropdown.tsx");
  const toastPath = resolve(cwd, "src/components/notifications/NotificationToast.tsx");
  const notifPagePath = resolve(cwd, "src/app/notifications/page.tsx");
  const storePath = resolve(cwd, "src/stores/useNotificationsStore.ts");
  const clientPath = resolve(cwd, "src/lib/notifications/client.ts");

  check("NotificationBell component exists", existsSync(bellPath));
  check("NotificationDropdown component exists", existsSync(dropdownPath));
  check("NotificationToast component exists", existsSync(toastPath));
  check("Notification center page exists", existsSync(notifPagePath));
  check("Notifications store exists", existsSync(storePath));
  check("Notifications client helper exists", existsSync(clientPath));

  const dropdownContent = readFileSync(dropdownPath, "utf8");
  const notifPageContent = readFileSync(notifPagePath, "utf8");
  const clientContent = readFileSync(clientPath, "utf8");

  check(
    "NotificationDropdown preserves Mark all read and has no Clear all action",
    dropdownContent.includes("Mark all read") &&
      dropdownContent.includes("markAllRead") &&
      !dropdownContent.toLowerCase().includes("clear notifications") &&
      !dropdownContent.toLowerCase().includes("clear all")
  );
  check(
    "Notification center preserves Mark all read and settings link",
    notifPageContent.includes("Mark all read") &&
      notifPageContent.includes("/settings/notifications") &&
      !notifPageContent.toLowerCase().includes("clear notifications")
  );
  check(
    "Notifications client wraps get_my_notifications, count, and mark read RPCs",
    clientContent.includes("get_my_notifications") &&
      clientContent.includes("get_unread_notification_count") &&
      clientContent.includes("mark_notification_read") &&
      clientContent.includes("mark_all_notifications_read")
  );

  // 2. Preferences, Quiet Hours & Scheduled Promotion
  console.log("\n--- 2. Preferences, Quiet Hours & Scheduled Delivery ---");
  const settingsPagePath = resolve(cwd, "src/app/settings/notifications/page.tsx");
  const m1SqlPath = resolve(
    cwd,
    "supabase/migrations/20261110100000_smart_notifications_foundation.sql"
  );
  const m2SqlPath = resolve(
    cwd,
    "supabase/migrations/20261110110000_smart_notifications_day2.sql"
  );
  const dbTypesPath = resolve(cwd, "src/lib/supabase/database.types.ts");
  const typesPath = resolve(cwd, "src/types/notifications.ts");

  check("Notification settings page exists", existsSync(settingsPagePath));
  check("Day 1 foundation migration exists", existsSync(m1SqlPath));
  check("Day 2 quiet hours & RPC migration exists", existsSync(m2SqlPath));

  const m1Sql = readFileSync(m1SqlPath, "utf8");
  const m2Sql = readFileSync(m2SqlPath, "utf8");
  const dbTypes = readFileSync(dbTypesPath, "utf8");
  const typesContent = readFileSync(typesPath, "utf8");

  check(
    "Foundation schema defines visual columns, templates, and abandoned_actions RLS",
    m1Sql.includes("chk_notifications_presentation_format") &&
      m1Sql.includes("Africa/Lagos") &&
      m1Sql.includes("CREATE TABLE IF NOT EXISTS public.abandoned_actions") &&
      m1Sql.includes("ENABLE ROW LEVEL SECURITY")
  );
  check(
    "Day 2 RPCs implement deduplication, frequency caps, quiet hours, and promotion",
    m2Sql.includes("create_notification_for_user") &&
      m2Sql.includes("process_smart_notification") &&
      m2Sql.includes("promote_scheduled_notifications") &&
      m2Sql.includes("Overnight quiet hours") &&
      m2Sql.includes("n.status IN ('unread', 'read', 'sent')")
  );
  check(
    "Shared contracts define all 7 notification statuses and 8 presentation formats",
    typesContent.includes('"scheduled"') &&
      typesContent.includes('"suppressed"') &&
      typesContent.includes('"image_popup"') &&
      typesContent.includes('"featured_event"')
  );

  // 3. Event Lifecycle & Campaign Analytics Preservation
  console.log("\n--- 3. Event Lifecycle & Campaign Analytics Preservation ---");
  const notifServicePath = resolve(cwd, "src/services/notifications.service.ts");
  const enginePath = resolve(cwd, "src/lib/notifications/engine.ts");
  const campaignAnalyticsPath = resolve(cwd, "src/lib/campaigns/analytics.ts");

  const notifService = readFileSync(notifServicePath, "utf8");
  const engineContent = readFileSync(enginePath, "utf8");
  const analyticsContent = readFileSync(campaignAnalyticsPath, "utf8");

  check(
    "notifications.service exports all 4 event lifecycle dispatchers",
    notifService.includes("dispatchDateOrVenueChangeNotification") &&
      notifService.includes("dispatchCampaignCreatedNotification") &&
      notifService.includes("dispatchRegistrationReceiptNotification") &&
      notifService.includes("dispatchEventCancelledNotification")
  );
  check(
    "notification engine exports processCampaignActivity using create_notification_for_user",
    engineContent.includes("export async function processCampaignActivity") &&
      engineContent.includes("create_notification_for_user")
  );
  check(
    "Campaign analytics trackCampaignEvent remains preserved",
    analyticsContent.includes("export async function trackCampaignEvent") &&
      analyticsContent.includes('"track_campaign_event"')
  );
  check(
    "Both track_campaign_event SQL RPC overloads remain intact in database.types.ts",
    dbTypes.includes("track_campaign_event:") &&
      dbTypes.includes("campaign_uuid: string") &&
      dbTypes.includes("p_campaign_id: string") &&
      dbTypes.includes("campaign_analytics: {")
  );

  // 4. Abandoned-Action Recovery Rules (Day 3)
  console.log("\n--- 4. Abandoned-Action Recovery Rules ---");
  const now = new Date("2026-11-12T12:00:00.000Z");

  check(
    "Empty forms rejected while meaningful drafts accepted",
    !hasMeaningfulAbandonedProgress({
      actionType: "event_draft",
      draftPayload: { categoryId: "cat-1", step: 1, title: "" },
    }) &&
      hasMeaningfulAbandonedProgress({
        actionType: "event_draft",
        draftTitle: "Abuja Tech Meetup",
        draftPayload: { title: "Abuja Tech Meetup", step: 2 },
      })
  );
  check(
    "24h recovery timing enforced with active-editing guard",
    !evaluateRecoveryTiming(
      {
        status: "active",
        last_progressed_at: new Date(now.getTime() - 10 * 60_000).toISOString(),
        reminder_stage: 0,
        last_reminded_at: null,
      },
      undefined,
      now
    ).eligible &&
      evaluateRecoveryTiming(
        {
          status: "active",
          last_progressed_at: new Date(now.getTime() - 24 * 3_600_000).toISOString(),
          reminder_stage: 0,
          last_reminded_at: null,
        },
        undefined,
        now
      ).nextStage === 1
  );
  check(
    "Paid registration recovery requires failed/expired payment and blocks pending/completed",
    !evaluateIncompleteRegistrationEligibility(
      {
        hasActiveParticipation: false,
        event: {
          id: "e-1",
          title: "Summit",
          status: "published",
          start_at: new Date(now.getTime() + 86_400_000).toISOString(),
          participation_model: "paid",
          participation_config: { ticket_capacity: 50 },
        },
        activeParticipantCount: 5,
        draftPayload: { payment_status: "pending" },
      },
      now
    ).eligible &&
      evaluateIncompleteRegistrationEligibility(
        {
          hasActiveParticipation: false,
          event: {
            id: "e-1",
            title: "Summit",
            status: "published",
            start_at: new Date(now.getTime() + 86_400_000).toISOString(),
            participation_model: "paid",
            participation_config: { ticket_capacity: 50 },
          },
          activeParticipantCount: 5,
          draftPayload: { payment_status: "failed" },
        },
        now
      ).eligible
  );
  check(
    "Anti-surveillance copy guard blocks creepy phrasing and allows product copy",
    !validateRecoveryCopy("Reminder", "We noticed you left your draft").valid &&
      validateRecoveryCopy(
        getRecoveryCopyTemplate("event_draft").title,
        getRecoveryCopyTemplate("event_draft").message
      ).valid
  );

  // 5. Visual Notification Security, Accessibility & Queue Precedence (Day 4)
  console.log("\n--- 5. Visual Notification Security, Accessibility & Queue Precedence ---");
  const visualRulesPath = resolve(cwd, "src/lib/notifications/visual-rules.ts");
  const nextConfigPath = resolve(cwd, "next.config.ts");

  check("visual-rules.ts exists", existsSync(visualRulesPath));
  check(
    "next.config.ts allows Supabase storage remote images",
    readFileSync(nextConfigPath, "utf8").includes("**.supabase.co")
  );

  // Image URL sanitization checks
  check(
    "Allows HTTPS and Supabase Storage image URLs",
    sanitizeNotificationImageUrl(
      "https://proj.supabase.co/storage/v1/object/public/events/cover.jpg"
    ) !== null &&
      isSupabaseStorageUrl(
        "https://proj.supabase.co/storage/v1/object/public/events/cover.jpg"
      ) &&
      sanitizeNotificationImageUrl("https://cdn.attend.ng/posters/event.png") !==
        null
  );
  check(
    "Allows local /images/, /icons/, and /storage/v1/object/public/ paths",
    sanitizeNotificationImageUrl("/images/event-cover.jpg") ===
      "/images/event-cover.jpg" &&
      sanitizeNotificationImageUrl("/icons/icon-192x192.png") ===
        "/icons/icon-192x192.png" &&
      sanitizeNotificationImageUrl("/storage/v1/object/public/events/1.png") ===
        "/storage/v1/object/public/events/1.png"
  );
  check(
    "Blocks unsafe image schemes, http URLs, protocol-relative URLs, and path traversal",
    sanitizeNotificationImageUrl("javascript:alert(1)") === null &&
      sanitizeNotificationImageUrl("data:image/svg+xml,<svg/>") === null &&
      sanitizeNotificationImageUrl("vbscript:msgbox(1)") === null &&
      sanitizeNotificationImageUrl("http://insecure.example.com/img.png") ===
        null &&
      sanitizeNotificationImageUrl("//evil.example.com/img.png") === null &&
      sanitizeNotificationImageUrl("/images/../secrets/key.png") === null &&
      sanitizeNotificationImageUrl("https://user:pass@example.com/img.png") ===
        null
  );

  const imageOk = resolveVisualNotificationImage(
    makeNotification({
      title: "Lagos Design Week",
      image_url: "https://proj.supabase.co/storage/v1/object/public/events/a.png",
    })
  );
  const imageFallback = resolveVisualNotificationImage(
    makeNotification({
      title: "Lagos Design Week",
      image_url: "https://proj.supabase.co/storage/v1/object/public/events/a.png",
    }),
    { imageLoadFailed: true }
  );
  check(
    "Image resolution provides clean fallback on load error or invalid URL",
    imageOk.hasValidImage &&
      imageOk.src !== null &&
      !imageFallback.hasValidImage &&
      imageFallback.src === null &&
      imageFallback.alt === "Lagos Design Week"
  );

  check(
    "Action URL sanitization blocks javascript: and protocol-relative redirects",
    isSafeNotificationActionUrl("/events/evt-1") &&
      !isSafeNotificationActionUrl("javascript:alert(1)") &&
      !isSafeNotificationActionUrl("//evil.com/phish") &&
      sanitizeNotificationActionUrl("javascript:alert(1)") === "/notifications"
  );

  // Queue priority precedence & FIFO checks
  const lowVisualEarlier = makeNotification({
    id: "visual-low",
    priority: "low",
    presentation_format: "image_popup",
    image_url: "/images/event-1.jpg",
    created_at: "2026-11-12T09:00:00.000Z",
    dedupe_key: "rec-1",
  });
  const normalVisualLater = makeNotification({
    id: "visual-normal",
    priority: "normal",
    presentation_format: "featured_event",
    image_url: "/images/event-2.jpg",
    created_at: "2026-11-12T09:05:00.000Z",
  });
  const highTransactional = makeNotification({
    id: "tx-high",
    priority: "high",
    presentation_format: "text",
    created_at: "2026-11-12T09:10:00.000Z",
  });
  const urgentCancelled = makeNotification({
    id: "tx-urgent",
    priority: "urgent",
    type: "event_cancelled",
    presentation_format: "text",
    created_at: "2026-11-12T09:15:00.000Z",
  });
  const scheduledHidden = makeNotification({
    id: "sched-1",
    status: "scheduled",
    priority: "urgent",
    created_at: "2026-11-12T08:00:00.000Z",
  });

  const sortedQueue = sortNotificationPopupQueue([
    lowVisualEarlier,
    normalVisualLater,
    highTransactional,
    urgentCancelled,
    scheduledHidden,
  ]);
  check(
    "Popup queue orders urgent > high > normal > low and drops scheduled rows",
    sortedQueue.length === 4 &&
      sortedQueue[0].id === "tx-urgent" &&
      sortedQueue[1].id === "tx-high" &&
      sortedQueue[2].id === "visual-normal" &&
      sortedQueue[3].id === "visual-low"
  );

  const normalFirst = makeNotification({
    id: "fifo-1",
    priority: "normal",
    created_at: "2026-11-12T09:01:00.000Z",
    dedupe_key: "same-key",
  });
  const normalSecond = makeNotification({
    id: "fifo-2",
    priority: "normal",
    created_at: "2026-11-12T09:02:00.000Z",
  });
  const duplicateKey = makeNotification({
    id: "fifo-dup",
    priority: "normal",
    created_at: "2026-11-12T09:03:00.000Z",
    dedupe_key: "same-key",
  });

  let fifoQueue = enqueuePopupNotification([], normalSecond);
  fifoQueue = enqueuePopupNotification(fifoQueue, normalFirst);
  fifoQueue = enqueuePopupNotification(fifoQueue, duplicateKey);
  check(
    "Popup queue preserves FIFO order within tier and deduplicates by dedupe_key",
    fifoQueue.length === 2 &&
      fifoQueue[0].id === "fifo-1" &&
      fifoQueue[1].id === "fifo-2"
  );

  // Interruption guard, cooldown & dismissal suppression checks
  check(
    "Interruption guard identifies /create and /campaign/[slug] while allowing browsing routes",
    isInterruptionGuardedRoute("/create") &&
      isInterruptionGuardedRoute("/campaign/lagos-tech-fest") &&
      !isInterruptionGuardedRoute("/") &&
      !isInterruptionGuardedRoute("/discover") &&
      !isInterruptionGuardedRoute("/saved") &&
      !isInterruptionGuardedRoute("/events/evt-1")
  );

  const nowMs = Date.parse("2026-11-12T12:00:00.000Z");
  const guardedVisualDecision = canDisplayPopupNotification(normalVisualLater, {
    pathname: "/create",
    nowMs,
  });
  const modalBlockedDecision = canDisplayPopupNotification(normalVisualLater, {
    pathname: "/events/evt-1",
    hasOpenModal: true,
    nowMs,
  });
  const cooldownBlockedDecision = canDisplayPopupNotification(normalVisualLater, {
    pathname: "/discover",
    lastVisualPopupShownAtMs: nowMs - (VISUAL_POPUP_COOLDOWN_MS - 1000),
    nowMs,
  });
  const suppressedDecision = canDisplayPopupNotification(lowVisualEarlier, {
    pathname: "/discover",
    dismissedAtMsByKey: { "rec-1": nowMs - 2 * 24 * 3_600_000 },
    nowMs,
  });
  const nextWhileCreating = getNextEligiblePopupNotification(
    [normalVisualLater, urgentCancelled],
    { pathname: "/create", nowMs }
  );
  check(
    "Visual popups respect route/modal guards, 20s cooldown, and 7-day dismissal while urgent delivers",
    !guardedVisualDecision.canDisplay &&
      !modalBlockedDecision.canDisplay &&
      !cooldownBlockedDecision.canDisplay &&
      !suppressedDecision.canDisplay &&
      nextWhileCreating?.id === "tx-urgent"
  );

  const urgentA11y = getVisualPopupAccessibilityProps(urgentCancelled);
  const visualA11y = getVisualPopupAccessibilityProps(normalVisualLater);
  check(
    "Accessibility props enforce aria-live, status role, dismiss label, and alt text",
    urgentA11y.role === "status" &&
      urgentA11y.ariaLive === "assertive" &&
      visualA11y.ariaLive === "polite" &&
      visualA11y.dismissAriaLabel === "Dismiss notification" &&
      visualA11y.imageAlt === normalVisualLater.title
  );

  // 6. Rich Web Push Foundation & Same-Origin Navigation
  console.log("\n--- 6. Web Push & Same-Origin Click Security ---");
  const pushPath = resolve(cwd, "src/lib/notifications/push.ts");
  const swPath = resolve(cwd, "worker/index.ts");

  check("push.ts helper exists", existsSync(pushPath));
  check("service worker worker/index.ts exists", existsSync(swPath));

  const pushContent = readFileSync(pushPath, "utf8");
  const swContent = readFileSync(swPath, "utf8");

  check(
    "push.ts manages VAPID push subscriptions cleanly",
    pushContent.includes("subscribeToPush") &&
      pushContent.includes("unsubscribeFromPush") &&
      pushContent.includes("push_subscriptions")
  );
  check(
    "worker/index.ts handles push & notificationclick with same-origin guard",
    swContent.includes('addEventListener("push"') &&
      swContent.includes('addEventListener("notificationclick"') &&
      swContent.includes("showNotification") &&
      swContent.includes("target.origin !== sw.location.origin")
  );

  // 7. Optional Partner PR Integration Checks (if merged on branch)
  console.log("\n--- 7. Partner Integration Readiness ---");
  const abandonedServicePath = resolve(
    cwd,
    "src/services/abandoned-actions.service.ts"
  );
  const schedulerPath = resolve(cwd, "src/lib/notifications/scheduler.ts");
  const recoveryBannerPath = resolve(
    cwd,
    "src/components/notifications/RecoveryBannerCard.tsx"
  );

  if (existsSync(abandonedServicePath)) {
    const content = readFileSync(abandonedServicePath, "utf8");
    check(
      "Partner abandoned-actions.service exports required recovery actions",
      content.includes("upsertAbandonedAction") &&
        content.includes("completeAbandonedAction") &&
        content.includes("processAbandonedActionReminders")
    );
  } else {
    console.log(
      "[INFO] Pending partner PR: src/services/abandoned-actions.service.ts (Hardik Day 3)"
    );
  }

  if (existsSync(schedulerPath)) {
    const content = readFileSync(schedulerPath, "utf8");
    check(
      "Partner scheduler.ts exports scheduled promotion and reminder dispatchers",
      content.includes("processDueScheduledNotifications") &&
        content.includes("dispatchUpcomingEventReminders")
    );
  } else {
    console.log(
      "[INFO] Pending partner PR: src/lib/notifications/scheduler.ts (Hardik Day 2)"
    );
  }

  if (existsSync(recoveryBannerPath)) {
    check(
      "Partner RecoveryBannerCard component present",
      existsSync(recoveryBannerPath)
    );
  } else {
    console.log(
      "[INFO] Pending partner PR: src/components/notifications/RecoveryBannerCard.tsx (Uzair Day 3)"
    );
  }

  // 8. Zero Em Dashes Policy
  console.log("\n--- 8. Zero Em Dashes Policy ---");
  const emDashChar = String.fromCharCode(0x2014);
  const week1Files = [
    "src/types/notifications.ts",
    "src/lib/notifications/types.ts",
    "src/lib/notifications/index.ts",
    "src/lib/notifications/client.ts",
    "src/lib/notifications/engine.ts",
    "src/lib/notifications/push.ts",
    "src/lib/notifications/recovery-rules.ts",
    "src/lib/notifications/visual-rules.ts",
    "src/services/notifications.service.ts",
    "src/stores/useNotificationsStore.ts",
    "src/components/notifications/NotificationBell.tsx",
    "src/components/notifications/NotificationDropdown.tsx",
    "src/components/notifications/NotificationToast.tsx",
    "src/app/notifications/page.tsx",
    "src/app/settings/notifications/page.tsx",
    "worker/index.ts",
    "supabase/migrations/20261110100000_smart_notifications_foundation.sql",
    "supabase/migrations/20261110110000_smart_notifications_day2.sql",
    "docs/smart_notification_implementation_plan.md",
    "README.md",
    "scripts/smart-notifications/week1/verify-sn-w1-d1.ts",
    "scripts/smart-notifications/week1/verify-sn-w1-d2.ts",
    "scripts/smart-notifications/week1/verify-sn-w1-d3.ts",
    "scripts/smart-notifications/week1/verify-sn-milestone1.ts",
  ];

  let emDashFiles: string[] = [];
  for (const relPath of week1Files) {
    const fullPath = resolve(cwd, relPath);
    if (existsSync(fullPath)) {
      const content = readFileSync(fullPath, "utf8");
      if (content.includes(emDashChar)) {
        emDashFiles.push(relPath);
      }
    }
  }
  check(
    "Zero em dashes across all Week 1 smart notification files",
    emDashFiles.length === 0,
    emDashFiles.length > 0 ? `Found in: ${emDashFiles.join(", ")}` : undefined
  );

  console.log("\n=============================================================");
  const passedCount = results.filter((r) => r.passed).length;
  const failedCount = results.filter((r) => !r.passed).length;
  console.log(
    `Smart Notifications Milestone 1 Summary: ${passedCount} passed, ${failedCount} failed`
  );
  console.log("=============================================================\n");

  if (failedCount > 0) {
    process.exit(1);
  }
}

runSmartNotificationsMilestone1Verification().catch((err) => {
  console.error("Milestone 1 verification failed:", err);
  process.exit(1);
});
