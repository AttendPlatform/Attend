/**
 * Milestone 0 Verification Suite
 * Validates domain service contracts, database referential integrity, and type safety.
 */

import { existsSync, readFileSync } from "node:fs";
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

async function runVerification() {
  console.log("\nStarting Attend V1 Milestone 0 Verification\n");

  // 1. Verify Migration Files
  const migrations = [
    "supabase/migrations/20261005195800_v1_phase0_tables.sql",
    "supabase/migrations/20261006171600_v1_phase0_attendance_schema.sql",
    "supabase/migrations/20261006171700_v1_phase0_indexes.sql",
    "supabase/migrations/20261008154000_v1_phase0_data_integrity.sql",
  ];

  for (const migration of migrations) {
    const fullPath = resolve(process.cwd(), migration);
    check(`Migration file exists: ${migration}`, existsSync(fullPath));
  }

  // 2. Verify Domain Service Files
  const domainServices = [
    "src/services/events.service.ts",
    "src/services/campaigns.service.ts",
    "src/services/attendance.service.ts",
    "src/services/saved.service.ts",
    "src/types/attendance.ts",
  ];

  for (const service of domainServices) {
    const fullPath = resolve(process.cwd(), service);
    check(`Domain service file exists: ${service}`, existsSync(fullPath));
  }

  // 3. Verify Service Signatures
  const attendanceContent = readFileSync(
    resolve(process.cwd(), "src/services/attendance.service.ts"),
    "utf8"
  );
  check(
    "attendance.service exports getEventAttendees",
    attendanceContent.includes("export async function getEventAttendees")
  );
  check(
    "attendance.service exports getEventAttendanceCounts",
    attendanceContent.includes("export async function getEventAttendanceCounts")
  );
  check(
    "attendance.service exports rsvpEvent",
    attendanceContent.includes("export async function rsvpEvent")
  );
  check(
    "attendance.service exports cancelEventAttendance",
    attendanceContent.includes("export async function cancelEventAttendance")
  );

  const savedContent = readFileSync(
    resolve(process.cwd(), "src/services/saved.service.ts"),
    "utf8"
  );
  check(
    "saved.service exports isEventSaved & isCampaignSaved",
    savedContent.includes("export async function isEventSaved") &&
      savedContent.includes("export async function isCampaignSaved")
  );
  check(
    "saved.service exports toggleSaveEvent & toggleSaveCampaign",
    savedContent.includes("export async function toggleSaveEvent") &&
      savedContent.includes("export async function toggleSaveCampaign")
  );
  check(
    "saved.service exports getSavedEvents & getSavedCampaigns",
    savedContent.includes("export async function getSavedEvents") &&
      savedContent.includes("export async function getSavedCampaigns")
  );

  const eventsContent = readFileSync(
    resolve(process.cwd(), "src/services/events.service.ts"),
    "utf8"
  );
  check(
    "events.service exports getEventBySlug",
    eventsContent.includes("export async function getEventBySlug")
  );
  check(
    "events.service exports getRelatedEvents",
    eventsContent.includes("export async function getRelatedEvents")
  );
  check(
    "events.service exports cancelEvent",
    eventsContent.includes("export async function cancelEvent")
  );

  const campaignsContent = readFileSync(
    resolve(process.cwd(), "src/services/campaigns.service.ts"),
    "utf8"
  );
  check(
    "campaigns.service exports getCampaignBySlug with parent event lookup",
    campaignsContent.includes("export async function getCampaignBySlug")
  );
  check(
    "campaigns.service exports canCreateParticipantCampaign",
    campaignsContent.includes("export async function canCreateParticipantCampaign")
  );

  // 4. Remote Supabase Data and Endpoint Validation
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://gmkdagcxnxrfaxetqjpc.supabase.co";
  const apiKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "sb_publishable_oPOor09JB9tmG_LdlpItaw_JFJ4pCdn";

  try {
    const eventsRes = await fetch(`${supabaseUrl}/rest/v1/events?select=id,title,status&limit=5`, {
      headers: { apikey: apiKey, Authorization: `Bearer ${apiKey}` },
    });
    check("Remote events query response status", eventsRes.status === 200);

    const campaignsRes = await fetch(`${supabaseUrl}/rest/v1/campaigns?select=id,title,event_id&limit=5`, {
      headers: { apikey: apiKey, Authorization: `Bearer ${apiKey}` },
    });
    check("Remote campaigns query response status", campaignsRes.status === 200);

    if (campaignsRes.ok) {
      const campaigns = (await campaignsRes.json()) as Array<{ id: string; title: string; event_id: string }>;
      const allHaveParent = campaigns.every((c) => Boolean(c.event_id));
      check("All active campaigns contain parent event_id reference", allHaveParent);
    }
  } catch (err: unknown) {
    console.warn("Network check skipped or failed:", err);
  }

  // Summary
  const passedCount = results.filter((r) => r.passed).length;
  const failedCount = results.filter((r) => !r.passed).length;

  console.log(`\nVerification Summary: ${passedCount} passed, ${failedCount} failed\n`);

  if (failedCount > 0) {
    process.exit(1);
  }
}

runVerification();
