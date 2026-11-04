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
  console.log("Starting Week 5 Day 3 Verification: Campaigns, Settings & Safe Cancellation");
  console.log("=============================================================\n");

  const cwd = process.cwd();

  // 1. Target Files and Barrel Exports
  console.log("--- 1. Target Files & Barrel Exports ---");
  const targetFiles = [
    "src/types/dashboard.ts",
    "src/services/notifications.service.ts",
    "src/services/events.service.ts",
    "src/components/campaigns/CampaignHeader.tsx",
    "src/components/campaigns/CampaignResultActions.tsx",
    "src/components/dashboard/OrganizerCampaignsTab.tsx",
    "src/components/dashboard/OrganizerSettingsTab.tsx",
    "src/components/dashboard/index.ts",
    "src/app/actions/organizer.ts",
    "src/app/dashboard/events/[id]/page.tsx",
  ];

  for (const relPath of targetFiles) {
    const fullPath = resolve(cwd, relPath);
    check(`Target file exists: ${relPath}`, existsSync(fullPath));
  }

  const indexTypeContent = readFileSync(resolve(cwd, "src/types/index.ts"), "utf8");
  check(
    "src/types/index.ts re-exports dashboard contracts",
    indexTypeContent.includes('"./dashboard"') || indexTypeContent.includes("'./dashboard'")
  );

  const servicesIndexContent = readFileSync(resolve(cwd, "src/services/index.ts"), "utf8");
  check(
    "src/services/index.ts re-exports notifications service",
    servicesIndexContent.includes('"./notifications.service"') || servicesIndexContent.includes("'./notifications.service'")
  );
  check(
    "src/services/index.ts re-exports events service",
    servicesIndexContent.includes('"./events.service"') || servicesIndexContent.includes("'./events.service'")
  );

  const dashboardIndexContent = readFileSync(
    resolve(cwd, "src/components/dashboard/index.ts"),
    "utf8"
  );
  check(
    "dashboard barrel exports OrganizerCampaignsTab",
    dashboardIndexContent.includes("./OrganizerCampaignsTab")
  );
  check(
    "dashboard barrel exports OrganizerSettingsTab",
    dashboardIndexContent.includes("./OrganizerSettingsTab")
  );

  // 2. Cancellation Payload Contracts
  console.log("\n--- 2. Cancellation Notification Contracts ---");
  const dashboardTypeContent = readFileSync(resolve(cwd, "src/types/dashboard.ts"), "utf8");
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

  // 3. Urgent Lifecycle Notification Engine
  console.log("\n--- 3. Urgent Lifecycle Notification Engine ---");
  const notifServiceContent = readFileSync(resolve(cwd, "src/services/notifications.service.ts"), "utf8");
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
  const eventsServiceContent = readFileSync(resolve(cwd, "src/services/events.service.ts"), "utf8");
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
  const campaignHeaderContent = readFileSync(resolve(cwd, "src/components/campaigns/CampaignHeader.tsx"), "utf8");
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

  const campaignResultActionsContent = readFileSync(resolve(cwd, "src/components/campaigns/CampaignResultActions.tsx"), "utf8");
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

  // 6. Organizer Campaigns Tab Architecture
  console.log("\n--- 6. Organizer Campaigns Tab Architecture ---");
  const campaignsTabContent = readFileSync(
    resolve(cwd, "src/components/dashboard/OrganizerCampaignsTab.tsx"),
    "utf8"
  );
  check(
    "OrganizerCampaignsTab uses client directive",
    campaignsTabContent.includes('"use client"') || campaignsTabContent.includes("'use client'")
  );
  check(
    "OrganizerCampaignsTab exports OrganizerCampaignsTab component",
    campaignsTabContent.includes("export function OrganizerCampaignsTab")
  );
  check(
    "OrganizerCampaignsTab provides Create New Campaign action",
    campaignsTabContent.includes("/campaigns/create") &&
      campaignsTabContent.includes("Create New Campaign")
  );
  check(
    "OrganizerCampaignsTab provides Edit template link",
    campaignsTabContent.includes("/edit")
  );
  check(
    "OrganizerCampaignsTab provides public preview link",
    campaignsTabContent.includes("/campaign/")
  );
  check(
    "OrganizerCampaignsTab provides View Analytics link",
    campaignsTabContent.includes("/analytics")
  );
  check(
    "OrganizerCampaignsTab supports Pause/Publish toggle action",
    campaignsTabContent.includes("toggleCampaignStatusAction") &&
      campaignsTabContent.includes("Pause") &&
      campaignsTabContent.includes("Publish")
  );
  check(
    "OrganizerCampaignsTab displays generations count",
    campaignsTabContent.includes("generations")
  );
  check(
    "OrganizerCampaignsTab provides clean empty state",
    campaignsTabContent.includes("No campaigns created yet")
  );

  // 7. Organizer Settings Tab Architecture & Safe Cancellation Modal
  console.log("\n--- 7. Organizer Settings Tab & Safe Cancellation ---");
  const settingsTabContent = readFileSync(
    resolve(cwd, "src/components/dashboard/OrganizerSettingsTab.tsx"),
    "utf8"
  );
  check(
    "OrganizerSettingsTab uses client directive",
    settingsTabContent.includes('"use client"') || settingsTabContent.includes("'use client'")
  );
  check(
    "OrganizerSettingsTab exports OrganizerSettingsTab component",
    settingsTabContent.includes("export function OrganizerSettingsTab")
  );
  check(
    "OrganizerSettingsTab allows editing title and description",
    settingsTabContent.includes("Event Title") &&
      settingsTabContent.includes("Event Description")
  );
  check(
    "OrganizerSettingsTab allows editing dates and times",
    settingsTabContent.includes("Start Date and Time") &&
      settingsTabContent.includes("End Date and Time")
  );
  check(
    "OrganizerSettingsTab supports online format and venue fields",
    settingsTabContent.includes("virtual / online") &&
      settingsTabContent.includes("Venue Name")
  );
  check(
    "OrganizerSettingsTab provides participant campaign permissions toggle",
    settingsTabContent.includes("allow_participant_campaigns") ||
      settingsTabContent.includes("Allow participants to create campaigns")
  );
  check(
    "OrganizerSettingsTab provides safe cancellation trigger",
    settingsTabContent.includes("cancelEventAction") &&
      settingsTabContent.includes("Cancel Event")
  );
  check(
    "OrganizerSettingsTab provides cancellation confirmation modal",
    settingsTabContent.includes('role="dialog"') &&
      settingsTabContent.includes("Cancel Event Confirmation")
  );
  check(
    "OrganizerSettingsTab warns user that action cannot be undone and graphics remain preserved",
    settingsTabContent.includes("cannot be undone") &&
      settingsTabContent.includes("not be deleted")
  );

  // 8. Server Actions Architecture
  console.log("\n--- 8. Server Actions Architecture ---");
  const actionsContent = readFileSync(
    resolve(cwd, "src/app/actions/organizer.ts"),
    "utf8"
  );
  check(
    "organizer.ts uses server directive",
    actionsContent.includes('"use server"') || actionsContent.includes("'use server'")
  );
  check(
    "organizer.ts exports updateEventDetailsAction",
    actionsContent.includes("export async function updateEventDetailsAction")
  );
  check(
    "organizer.ts exports toggleCampaignStatusAction",
    actionsContent.includes("export async function toggleCampaignStatusAction")
  );
  check(
    "organizer.ts exports cancelEventAction",
    actionsContent.includes("export async function cancelEventAction")
  );
  check(
    "server actions verify user authentication and organizer authorization",
    actionsContent.includes("auth.getUser") &&
      actionsContent.includes("getOrganizerAccess")
  );

  // 9. Event Dashboard Page Integration
  console.log("\n--- 9. Event Dashboard Page Integration ---");
  const pageContent = readFileSync(
    resolve(cwd, "src/app/dashboard/events/[id]/page.tsx"),
    "utf8"
  );
  check(
    "dashboard page imports OrganizerCampaignsTab",
    pageContent.includes("OrganizerCampaignsTab")
  );
  check(
    "dashboard page imports OrganizerSettingsTab",
    pageContent.includes("OrganizerSettingsTab")
  );
  check(
    "dashboard page renders OrganizerCampaignsTab under campaigns tab",
    pageContent.includes('<OrganizerCampaignsTab')
  );
  check(
    "dashboard page renders OrganizerSettingsTab under settings tab",
    pageContent.includes('<OrganizerSettingsTab')
  );
  check(
    "dashboard page fetches campaigns for activeTab === 'campaigns'",
    pageContent.includes("getOrganizerEventCampaigns")
  );

  // 10. Zero Em Dashes Policy
  console.log("\n--- 10. Zero Em Dashes Policy ---");
  const filesToCheck = [
    "src/types/dashboard.ts",
    "src/services/notifications.service.ts",
    "src/services/events.service.ts",
    "src/components/campaigns/CampaignHeader.tsx",
    "src/components/campaigns/CampaignResultActions.tsx",
    "src/components/dashboard/OrganizerCampaignsTab.tsx",
    "src/components/dashboard/OrganizerSettingsTab.tsx",
    "src/app/actions/organizer.ts",
    "src/app/dashboard/events/[id]/page.tsx",
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
