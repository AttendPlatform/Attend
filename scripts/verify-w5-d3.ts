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

async function runWeek5Day3Verification() {
  console.log("\n=============================================================");
  console.log("Starting Week 5 Day 3 Verification: Cancellation Safeguards & Lifecycle Notifications");
  console.log("=============================================================\n");

  const cwd = process.cwd();

  // 1. Target files and barrel exports
  console.log("--- 1. Target Files & Barrel Exports ---");
  const dashboardTypePath = resolve(cwd, "src/types/dashboard.ts");
  const indexTypePath = resolve(cwd, "src/types/index.ts");
  const notificationsServicePath = resolve(cwd, "src/services/notifications.service.ts");
  const eventsServicePath = resolve(cwd, "src/services/events.service.ts");
  const servicesIndexPath = resolve(cwd, "src/services/index.ts");
  const campaignHeaderPath = resolve(cwd, "src/components/campaigns/CampaignHeader.tsx");
  const campaignResultActionsPath = resolve(cwd, "src/components/campaigns/CampaignResultActions.tsx");

  check("File exists: src/types/dashboard.ts", existsSync(dashboardTypePath));
  check("File exists: src/services/notifications.service.ts", existsSync(notificationsServicePath));
  check("File exists: src/services/events.service.ts", existsSync(eventsServicePath));
  check("File exists: src/components/campaigns/CampaignHeader.tsx", existsSync(campaignHeaderPath));
  check("File exists: src/components/campaigns/CampaignResultActions.tsx", existsSync(campaignResultActionsPath));

  const indexTypeContent = readFileSync(indexTypePath, "utf8");
  check(
    "src/types/index.ts re-exports dashboard contracts",
    indexTypeContent.includes('"./dashboard"') || indexTypeContent.includes("'./dashboard'")
  );

  const servicesIndexContent = readFileSync(servicesIndexPath, "utf8");
  check(
    "src/services/index.ts re-exports notifications service",
    servicesIndexContent.includes('"./notifications.service"') || servicesIndexContent.includes("'./notifications.service'")
  );
  check(
    "src/services/index.ts re-exports events service",
    servicesIndexContent.includes('"./events.service"') || servicesIndexContent.includes("'./events.service'")
  );

  // 2. Cancellation Payload Contracts
  console.log("\n--- 2. Cancellation Notification Contracts ---");
  const dashboardTypeContent = readFileSync(dashboardTypePath, "utf8");
  check(
    "dashboard.ts defines EventCancelledNotificationPayload interface",
    dashboardTypeContent.includes("export interface EventCancelledNotificationPayload")
  );
  check(
    "EventCancelledNotificationPayload defines eventId and eventTitle",
    dashboardTypeContent.includes("eventId: string") &&
      dashboardTypeContent.includes("eventTitle: string")
  );
  check(
    "EventCancelledNotificationPayload supports optional reason and actorId",
    dashboardTypeContent.includes("reason?: string | null") &&
      dashboardTypeContent.includes("actorId?: string")
  );

  // 3. Urgent Lifecycle Notification Dispatch
  console.log("\n--- 3. Urgent Lifecycle Notification Engine ---");
  const notifServiceContent = readFileSync(notificationsServicePath, "utf8");
  check(
    "notifications.service exports dispatchEventCancelledNotification",
    notifServiceContent.includes("export async function dispatchEventCancelledNotification")
  );
  check(
    "dispatchEventCancelledNotification sets urgent priority",
    notifServiceContent.includes('priority: "urgent"')
  );
  check(
    "dispatchEventCancelledNotification categorizes as event_lifecycle and type event_cancelled",
    notifServiceContent.includes('category: "event_lifecycle"') &&
      notifServiceContent.includes('type: "event_cancelled"')
  );
  check(
    "dispatchEventCancelledNotification filters confirmed attendees",
    notifServiceContent.includes('"attending"') &&
      notifServiceContent.includes('"registered"') &&
      notifServiceContent.includes('"ticketed"')
  );
  check(
    "dispatchEventCancelledNotification excludes actorId and deduplicates recipients",
    notifServiceContent.includes("id !== payload.actorId") &&
      notifServiceContent.includes("new Set")
  );
  check(
    "dispatchEventCancelledNotification generates idempotent dedupeKey",
    notifServiceContent.includes("dedupeKey: `event-${payload.eventId}-cancelled-${userId}`")
  );

  // 4. Safe Event Cancellation Domain Safeguards
  console.log("\n--- 4. Safe Event Cancellation Domain Safeguards ---");
  const eventsServiceContent = readFileSync(eventsServicePath, "utf8");
  check(
    "events.service exports cancelEvent",
    eventsServiceContent.includes("export async function cancelEvent")
  );
  check(
    "cancelEvent verifies organizer access via getOrganizerAccess",
    eventsServiceContent.includes("getOrganizerAccess(eventId, userId, supabase)") &&
      eventsServiceContent.includes("!access.isOrganizer")
  );
  check(
    "cancelEvent updates status to cancelled",
    eventsServiceContent.includes('status: "cancelled"')
  );
  check(
    "cancelEvent dispatches urgent cancellation notifications",
    eventsServiceContent.includes("dispatchEventCancelledNotification")
  );

  // 5. Campaign Parent-Cancelled Banner & Asset Preservation
  console.log("\n--- 5. Connected Campaign Parent-Cancelled Banner & Asset Preservation ---");
  const campaignHeaderContent = readFileSync(campaignHeaderPath, "utf8");
  check(
    "CampaignHeader checks for cancelled parent event status",
    campaignHeaderContent.includes('parentEvent?.status === "cancelled"') ||
      campaignHeaderContent.includes("isParentCancelled")
  );
  check(
    "CampaignHeader renders Event Cancelled banner badge",
    campaignHeaderContent.includes("Event Cancelled")
  );
  check(
    "CampaignHeader reassures user that graphics remain preserved",
    campaignHeaderContent.includes("remain preserved")
  );
  check(
    "CampaignHeader links to cancelled event notice",
    campaignHeaderContent.includes("View Event Notice")
  );

  const campaignResultActionsContent = readFileSync(campaignResultActionsPath, "utf8");
  check(
    "CampaignResultActions checks for cancelled parent event status",
    campaignResultActionsContent.includes('parentEvent?.status === "cancelled"') ||
      campaignResultActionsContent.includes("isParentCancelled")
  );
  check(
    "CampaignResultActions alerts attendee that registrations are closed when event is cancelled",
    campaignResultActionsContent.includes("Registrations are closed")
  );
  check(
    "CampaignResultActions preserves download graphic CTA",
    campaignResultActionsContent.includes("Download Graphic") ||
      campaignResultActionsContent.includes("Downloaded")
  );
  check(
    "CampaignResultActions preserves share graphic CTA",
    campaignResultActionsContent.includes("Share Graphic") ||
      campaignResultActionsContent.includes("Shared")
  );

  // 6. Zero Em Dashes Policy
  console.log("\n--- 6. Zero Em Dashes Policy ---");
  const filesToCheck = [
    "src/types/dashboard.ts",
    "src/services/notifications.service.ts",
    "src/services/events.service.ts",
    "src/components/campaigns/CampaignHeader.tsx",
    "src/components/campaigns/CampaignResultActions.tsx",
    "scripts/verify-w5-d3.ts",
  ];

  let emDashFound = false;
  for (const relPath of filesToCheck) {
    const fullPath = resolve(cwd, relPath);
    if (existsSync(fullPath)) {
      const content = readFileSync(fullPath, "utf8");
      const emDashChar = String.fromCharCode(0x2014);
      if (content.includes(emDashChar)) {
        if (relPath === "scripts/verify-w5-d3.ts") {
          const linesWithoutValidator = content
            .split("\n")
            .filter((line) => !line.includes("fromCharCode(0x2014)"))
            .join("\n");
          if (linesWithoutValidator.includes(emDashChar)) {
            emDashFound = true;
            console.error(`Em dash found in ${relPath}`);
          }
        } else {
          emDashFound = true;
          console.error(`Em dash found in ${relPath}`);
        }
      }
    }
  }
  check("Zero em dashes found across all Day 11 code", !emDashFound);

  // Summary
  const failed = results.filter((r) => !r.passed);
  console.log("\n=============================================================");
  console.log(
    `Week 5 Day 3 Checkpoint Summary: ${results.length - failed.length} passed, ${failed.length} failed`
  );
  console.log("=============================================================\n");

  if (failed.length > 0) {
    process.exit(1);
  }
}

runWeek5Day3Verification().catch((error) => {
  console.error("Verification execution error:", error);
  process.exit(1);
});
