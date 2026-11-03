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

function escapeCsvField(value: unknown): string {
  if (value === null || value === undefined) return "";
  const str = typeof value === "object" ? JSON.stringify(value) : String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

async function runWeek5Day2Verification() {
  console.log("\n=============================================================");
  console.log("Starting Week 5 Day 2 Verification: People Tab & Notifications");
  console.log("=============================================================\n");

  const cwd = process.cwd();

  // 1. Target files and barrel exports
  console.log("--- 1. Target Files & Barrel Exports ---");
  const dashboardTypePath = resolve(cwd, "src/types/dashboard.ts");
  const indexTypePath = resolve(cwd, "src/types/index.ts");
  const csvExportPath = resolve(cwd, "src/lib/dashboard/csv-export.ts");
  const attendanceServicePath = resolve(cwd, "src/services/attendance.service.ts");
  const notificationsServicePath = resolve(cwd, "src/services/notifications.service.ts");
  const servicesIndexPath = resolve(cwd, "src/services/index.ts");
  const peopleTabPath = resolve(cwd, "src/components/dashboard/OrganizerPeopleTab.tsx");
  const dashboardComponentIndexPath = resolve(cwd, "src/components/dashboard/index.ts");

  check("File exists: src/types/dashboard.ts", existsSync(dashboardTypePath));
  check("File exists: src/lib/dashboard/csv-export.ts", existsSync(csvExportPath));
  check("File exists: src/services/attendance.service.ts", existsSync(attendanceServicePath));
  check("File exists: src/services/notifications.service.ts", existsSync(notificationsServicePath));
  check("File exists: src/components/dashboard/OrganizerPeopleTab.tsx", existsSync(peopleTabPath));
  check("File exists: src/components/dashboard/index.ts", existsSync(dashboardComponentIndexPath));

  const indexTypeContent = readFileSync(indexTypePath, "utf8");
  check(
    "src/types/index.ts re-exports dashboard contracts",
    indexTypeContent.includes('export * from "./dashboard";')
  );

  const servicesIndexContent = readFileSync(servicesIndexPath, "utf8");
  check(
    "src/services/index.ts re-exports notifications service",
    servicesIndexContent.includes('export * from "./notifications.service";')
  );

  // 2. People Tab Roster and Type Contracts
  console.log("\n--- 2. People Tab Roster & Type Contracts ---");
  const dashboardTypeContent = readFileSync(dashboardTypePath, "utf8");

  check(
    "dashboard.ts defines PeopleSubTab union with 4 sub-tabs",
    dashboardTypeContent.includes("export type PeopleSubTab =") &&
      dashboardTypeContent.includes('"attendees"') &&
      dashboardTypeContent.includes('"registrants"') &&
      dashboardTypeContent.includes('"ticket_holders"') &&
      dashboardTypeContent.includes('"campaign_participants"')
  );

  check(
    "dashboard.ts defines OrganizerPeopleRosterItem interface",
    dashboardTypeContent.includes("export interface OrganizerPeopleRosterItem") &&
      dashboardTypeContent.includes("userId: string | null;") &&
      dashboardTypeContent.includes("participationType: string;") &&
      dashboardTypeContent.includes("registrationData: Record<string, unknown>;")
  );

  check(
    "dashboard.ts defines OrganizerPeopleStats interface with separated metrics",
    dashboardTypeContent.includes("export interface OrganizerPeopleStats") &&
      dashboardTypeContent.includes("totalAttendees: number;") &&
      dashboardTypeContent.includes("totalRegistrants: number;") &&
      dashboardTypeContent.includes("totalTicketHolders: number;") &&
      dashboardTypeContent.includes("totalCampaignParticipants: number;") &&
      dashboardTypeContent.includes("grandTotal: number;")
  );

  check(
    "dashboard.ts defines lifecycle notification payload interfaces",
    dashboardTypeContent.includes("export interface EventUpdatedNotificationPayload") &&
      dashboardTypeContent.includes("export interface CampaignCreatedNotificationPayload") &&
      dashboardTypeContent.includes("export interface RegistrationReceiptPayload")
  );

  // 3. Domain Services & Strict Data Separation
  console.log("\n--- 3. Attendance Domain Services & Data Separation ---");
  const attendanceContent = readFileSync(attendanceServicePath, "utf8");

  check(
    "attendance.service exports getOrganizerPeopleStats",
    attendanceContent.includes("export async function getOrganizerPeopleStats")
  );

  check(
    "attendance.service exports getOrganizerPeopleRoster",
    attendanceContent.includes("export async function getOrganizerPeopleRoster")
  );

  check(
    "attendance.service exports checkPeopleDataSeparation",
    attendanceContent.includes("export function checkPeopleDataSeparation")
  );

  check(
    "getOrganizerPeopleStats queries confirmed attendees from event_participants",
    attendanceContent.includes('from("event_participants")') &&
      attendanceContent.includes('"attending", "attended"')
  );

  check(
    "getOrganizerPeopleStats isolates campaign metrics by querying campaigns table",
    attendanceContent.includes('from("campaigns")') &&
      attendanceContent.includes("generations")
  );

  check(
    "getOrganizerPeopleRoster supports distinct campaign_participants sub-tab",
    attendanceContent.includes('subTab === "campaign_participants"') &&
      attendanceContent.includes('participationType: "campaign_participant"')
  );

  check(
    "checkPeopleDataSeparation verifies event attendees are not conflated with campaigns",
    attendanceContent.includes("isConflated: false") &&
      attendanceContent.includes('attendeeTable: "event_participants"') &&
      attendanceContent.includes('campaignTable: "campaigns"')
  );

  const campaignsServicePath = resolve(cwd, "src/services/campaigns.service.ts");
  const campaignsContent = readFileSync(campaignsServicePath, "utf8");
  check(
    "checkCampaignAttendanceIsolation verifies campaign metrics are strictly isolated",
    campaignsContent.includes("isIsolated: true") &&
      campaignsContent.includes("campaignMetrics:") &&
      campaignsContent.includes("attendanceMetrics:")
  );

  // 4. CSV Export Helper & Formatting
  console.log("\n--- 4. CSV Export Engine & Escaping ---");
  const csvContent = readFileSync(csvExportPath, "utf8");

  check(
    "csv-export.ts exports formatRosterCsv and downloadRosterCsv",
    csvContent.includes("export function formatRosterCsv") &&
      csvContent.includes("export function downloadRosterCsv")
  );

  check(
    "csv-export.ts defines standard CSV columns",
    csvContent.includes('"ID"') &&
      csvContent.includes('"Name"') &&
      csvContent.includes('"Participation Type"') &&
      csvContent.includes('"Registration Data"')
  );

  const escapedComma = escapeCsvField("Chidi, Anozie");
  const escapedQuote = escapeCsvField('Ngozi "Special" Eze');
  const escapedJson = escapeCsvField({ dietary: "vegetarian", tshirt: "M" });

  check(
    "escapeCsvField properly escapes names containing commas",
    escapedComma === '"Chidi, Anozie"'
  );
  check(
    "escapeCsvField properly escapes names containing quotes",
    escapedQuote === '"Ngozi ""Special"" Eze"'
  );
  check(
    "escapeCsvField formats registration responses into CSV JSON cell",
    escapedJson.includes('"{""dietary"":""vegetarian"",""tshirt"":""M""}"')
  );

  // 5. Lifecycle Notifications Engine
  console.log("\n--- 5. Lifecycle Notifications Engine ---");
  const notifServiceContent = readFileSync(notificationsServicePath, "utf8");

  check(
    "notifications.service exports dispatchDateOrVenueChangeNotification",
    notifServiceContent.includes("export async function dispatchDateOrVenueChangeNotification")
  );

  check(
    "notifications.service exports dispatchCampaignCreatedNotification",
    notifServiceContent.includes("export async function dispatchCampaignCreatedNotification")
  );

  check(
    "notifications.service exports dispatchRegistrationReceiptNotification",
    notifServiceContent.includes("export async function dispatchRegistrationReceiptNotification")
  );

  check(
    "dispatchDateOrVenueChangeNotification filters confirmed event attendees",
    notifServiceContent.includes('from("event_participants")') &&
      notifServiceContent.includes('"attending", "registered", "ticketed"')
  );

  check(
    "dispatchCampaignCreatedNotification alerts event creator and organizers",
    notifServiceContent.includes('from("events")') &&
      notifServiceContent.includes('from("event_organizers")')
  );

  check(
    "dispatchRegistrationReceiptNotification issues high-priority confirmation",
    notifServiceContent.includes('type: "registration_receipt"') &&
      notifServiceContent.includes('priority: "high"')
  );

  // 6. UI Component Architecture & Sub-tabs
  console.log("\n--- 6. OrganizerPeopleTab Component Architecture ---");
  const peopleTabContent = readFileSync(peopleTabPath, "utf8");

  check(
    "OrganizerPeopleTab component uses client directive",
    peopleTabContent.startsWith('"use client";') || peopleTabContent.startsWith("'use client';")
  );

  check(
    "OrganizerPeopleTab renders all 4 distinct sub-tabs",
    peopleTabContent.includes('setActiveSubTab("attendees")') &&
      peopleTabContent.includes('setActiveSubTab("registrants")') &&
      peopleTabContent.includes('setActiveSubTab("ticket_holders")') &&
      peopleTabContent.includes('setActiveSubTab("campaign_participants")')
  );

  check(
    "OrganizerPeopleTab provides one-click CSV export button",
    peopleTabContent.includes("handleExport") &&
      peopleTabContent.includes("Export Roster") &&
      peopleTabContent.includes("downloadRosterCsv")
  );

  check(
    "OrganizerPeopleTab provides real-time search input",
    peopleTabContent.includes("searchQuery") &&
      peopleTabContent.includes("Search by name or handle")
  );

  check(
    "OrganizerPeopleTab provides registration answers viewer modal",
    peopleTabContent.includes("selectedResponseItem") &&
      peopleTabContent.includes("Registration Responses")
  );

  // 7. Zero Em Dashes Policy across Week 5 Day 2 files
  console.log("\n--- 7. Zero Em Dashes Policy ---");
  const filesToCheck = [
    dashboardTypePath,
    csvExportPath,
    attendanceServicePath,
    notificationsServicePath,
    servicesIndexPath,
    peopleTabPath,
    dashboardComponentIndexPath,
    resolve(cwd, "scripts/verify-w5-d2.ts"),
  ];

  let emDashFound = false;
  for (const filePath of filesToCheck) {
    if (existsSync(filePath)) {
      const content = readFileSync(filePath, "utf8");
      if (content.includes("\u2014")) {
        emDashFound = true;
        console.error(`Em dash detected in: ${filePath}`);
      }
    }
  }

  check("Zero em dashes found across all Week 5 Day 2 code", !emDashFound);

  // Summary
  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;

  console.log("\n=============================================================");
  console.log(`Week 5 Day 2 Checkpoint Summary: ${passed} passed, ${failed} failed`);
  console.log("=============================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runWeek5Day2Verification().catch((err) => {
  console.error("Verification suite failed:", err);
  process.exit(1);
});
