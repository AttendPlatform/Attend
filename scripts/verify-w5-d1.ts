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

async function runWeek5Day1Verification() {
  console.log("\n=============================================================");
  console.log("Starting Week 5 Day 1 Verification: Organizer Shell & Access Control");
  console.log("=============================================================\n");

  const cwd = process.cwd();

  // 1. Target files and barrel exports
  console.log("--- 1. Target Files & Barrel Exports ---");
  const dashboardTypePath = resolve(cwd, "src/types/dashboard.ts");
  const indexTypePath = resolve(cwd, "src/types/index.ts");
  const eventsServicePath = resolve(cwd, "src/services/events.service.ts");
  const migrationsTablesPath = resolve(cwd, "supabase/migrations/20261005195800_v1_phase0_tables.sql");

  check("File exists: src/types/dashboard.ts", existsSync(dashboardTypePath));
  check("File exists: src/types/index.ts", existsSync(indexTypePath));
  check("File exists: src/services/events.service.ts", existsSync(eventsServicePath));
  check("File exists: initial schema migration", existsSync(migrationsTablesPath));

  const indexContent = readFileSync(indexTypePath, "utf8");
  check(
    "src/types/index.ts exports dashboard contracts",
    indexContent.includes('export * from "./dashboard";')
  );

  // 2. Organizer Dashboard and Saved Hub Types
  console.log("\n--- 2. Phase 4 Data Contracts & Types ---");
  const dashboardContent = readFileSync(dashboardTypePath, "utf8");

  check(
    "dashboard.ts exports OrganizerRole type union",
    dashboardContent.includes('export type OrganizerRole = "owner" | "admin" | "member";')
  );
  check(
    "dashboard.ts exports OrganizerAccessResult interface",
    dashboardContent.includes("export interface OrganizerAccessResult")
  );
  check(
    "OrganizerAccessResult defines isOrganizer, role, and isCreator fields",
    dashboardContent.includes("isOrganizer: boolean;") &&
      dashboardContent.includes("role: OrganizerRole | null;") &&
      dashboardContent.includes("isCreator: boolean;")
  );
  check(
    "dashboard.ts exports DashboardTab union with 4 tabs",
    dashboardContent.includes('export type DashboardTab = "overview" | "people" | "campaigns" | "settings";')
  );
  check(
    "dashboard.ts exports SavedHubTab union with events and campaigns tabs",
    dashboardContent.includes('export type SavedHubTab = "events" | "campaigns";')
  );
  check(
    "dashboard.ts exports DashboardOverviewStats interface",
    dashboardContent.includes("export interface DashboardOverviewStats")
  );
  check(
    "DashboardOverviewStats defines metrics for attendees, registrations, campaigns, and generations",
    dashboardContent.includes("totalAttendees: number;") &&
      dashboardContent.includes("totalRegistrations: number;") &&
      dashboardContent.includes("totalCampaigns: number;") &&
      dashboardContent.includes("totalGenerations: number;")
  );
  check(
    "dashboard.ts exports OrganizerEventHeaderData interface",
    dashboardContent.includes("export interface OrganizerEventHeaderData")
  );

  // 3. Organizer Access Control Domain Services
  console.log("\n--- 3. Organizer Access Control Domain Services ---");
  const eventsServiceContent = readFileSync(eventsServicePath, "utf8");

  check(
    "events.service has use server directive",
    eventsServiceContent.startsWith('"use server";') || eventsServiceContent.startsWith("'use server';")
  );
  check(
    "events.service exports getOrganizerAccess function",
    eventsServiceContent.includes("export async function getOrganizerAccess")
  );
  check(
    "events.service exports isEventOrganizer function",
    eventsServiceContent.includes("export async function isEventOrganizer")
  );
  check(
    "events.service exports getEventForOrganizer function",
    eventsServiceContent.includes("export async function getEventForOrganizer")
  );
  check(
    "events.service exports getOrganizerEventStats function",
    eventsServiceContent.includes("export async function getOrganizerEventStats")
  );
  check(
    "events.service exports requireOrganizerAccess server guard",
    eventsServiceContent.includes("export async function requireOrganizerAccess")
  );

  // 4. Dual-Factor Access Control & Security Logic
  console.log("\n--- 4. Dual-Factor Verification & Security Logic ---");
  check(
    "getOrganizerAccess checks event creator_id in events table",
    eventsServiceContent.includes('from("events")') &&
      eventsServiceContent.includes('select("creator_id")')
  );
  check(
    "getOrganizerAccess checks membership role in event_organizers table",
    eventsServiceContent.includes('from("event_organizers")') &&
      eventsServiceContent.includes('select("role")')
  );
  check(
    "getOrganizerAccess defaults creator role to owner",
    eventsServiceContent.includes('isCreator ? "owner" : null')
  );
  check(
    "getEventForOrganizer throws error if viewer is unauthorized",
    eventsServiceContent.includes("!access.isOrganizer") &&
      eventsServiceContent.includes("Unauthorized")
  );
  check(
    "requireOrganizerAccess guards against unauthenticated requests",
    eventsServiceContent.includes("!user") &&
      eventsServiceContent.includes("Authentication required")
  );

  // 5. Dashboard Statistics & Query Isolation
  console.log("\n--- 5. Dashboard Statistics & Query Isolation ---");
  check(
    "getOrganizerEventStats queries confirmed attendee counts from event_participants",
    eventsServiceContent.includes('from("event_participants")') &&
      eventsServiceContent.includes('"attending", "registered", "ticketed"')
  );
  check(
    "getOrganizerEventStats isolates registration status count",
    eventsServiceContent.includes('eq("status", "registered")')
  );
  check(
    "getOrganizerEventStats aggregates campaign generation totals from campaigns",
    eventsServiceContent.includes('from("campaigns")') &&
      eventsServiceContent.includes("generations")
  );

  // 6. Database RLS Policies Verification
  console.log("\n--- 6. Database RLS Policies for event_organizers ---");
  const migrationContent = readFileSync(migrationsTablesPath, "utf8");

  check(
    "Migration creates event_organizers table",
    migrationContent.includes("CREATE TABLE IF NOT EXISTS event_organizers")
  );
  check(
    "Migration enforces unique constraint on (event_id, user_id)",
    migrationContent.includes("CONSTRAINT event_organizers_event_user_unique UNIQUE (event_id, user_id)")
  );
  check(
    "Migration creates index on event_organizers.event_id",
    migrationContent.includes("CREATE INDEX IF NOT EXISTS idx_event_organizers_event_id")
  );
  check(
    "Migration creates index on event_organizers.user_id",
    migrationContent.includes("CREATE INDEX IF NOT EXISTS idx_event_organizers_user_id")
  );
  check(
    "Migration enables Row Level Security on event_organizers",
    migrationContent.includes("ALTER TABLE event_organizers ENABLE ROW LEVEL SECURITY;")
  );
  check(
    "Migration defines RLS policy for owners managing organizers",
    migrationContent.includes('CREATE POLICY "Event owners can manage event organizers"')
  );

  // 7. Zero Em Dashes Policy across Week 5 Day 1 files
  console.log("\n--- 7. Zero Em Dashes Policy ---");
  const filesToCheck = [
    dashboardTypePath,
    indexTypePath,
    eventsServicePath,
    resolve(cwd, "scripts/verify-w5-d1.ts"),
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

  check("Zero em dashes found across all Week 5 Day 1 code", !emDashFound);

  // Summary
  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;

  console.log("\n=============================================================");
  console.log(`Week 5 Day 1 Checkpoint Summary: ${passed} passed, ${failed} failed`);
  console.log("=============================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runWeek5Day1Verification().catch((err) => {
  console.error("Verification suite failed:", err);
  process.exit(1);
});
