/**
 * Day 4 Verification Suite: Visual Polish, Connected Campaign Cards & Creator Empty State
 */

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

async function runDay4Verification() {
  console.log("\n=============================================================");
  console.log("Starting Day 4 Verification Suite: Visual Polish & Empty State");
  console.log("=============================================================\n");

  const pagePath = resolve(process.cwd(), "src/app/events/[id]/page.tsx");
  check("File exists: src/app/events/[id]/page.tsx", existsSync(pagePath));

  const pageContent = readFileSync(pagePath, "utf8");

  // 1. Creator state resolution
  console.log("\n--- 1. Creator State Resolution ---");
  check(
    "Defines isCreator based on user.id and event.creator_id",
    pageContent.includes("const isCreator = Boolean(user && user.id === event.creator_id);")
  );
  check(
    "Organizer profile displays indicator when viewer is creator",
    pageContent.includes("{isCreator && (") && pageContent.includes("You")
  );

  // 2. Connected campaign card polish & hover transitions
  console.log("\n--- 2. Connected Campaign Card Polish ---");
  check(
    "Card implements smooth lift and shadow hover transition",
    pageContent.includes("hover:-translate-y-1.5") &&
      pageContent.includes("hover:border-violet-300") &&
      pageContent.includes("hover:shadow-xl")
  );
  check(
    "Image preview implements smooth scale on hover",
    pageContent.includes("group-hover:scale-105")
  );
  check(
    "Card title has hover color transition",
    pageContent.includes("group-hover:text-violet-700")
  );
  check(
    "Explore button has animated translation",
    pageContent.includes("group-hover:translate-x-0.5")
  );
  check(
    "Card has focus-within keyboard accessibility",
    pageContent.includes("focus-within:ring-2") && pageContent.includes("focus-within:ring-violet-500")
  );

  // 3. Creator empty state alignment with event toggles
  console.log("\n--- 3. Creator Empty State Alignment ---");
  check(
    "Empty state separates isCreator view from attendee view",
    pageContent.includes(": isCreator ? (")
  );
  check(
    "Creator view displays Organizer Controls badge",
    pageContent.includes("Organizer Controls")
  );
  check(
    "Creator view aligns with allow_participant_campaigns enabled state",
    pageContent.includes("Participant Campaigns: Enabled") &&
      pageContent.includes("Launch Official Campaign")
  );
  check(
    "Creator view aligns with allow_participant_campaigns disabled state",
    pageContent.includes("Participant Campaigns: Disabled") &&
      pageContent.includes("Create Official Campaign")
  );
  check(
    "Section header allows creator to launch campaign even if participant campaigns disabled",
    pageContent.includes("(event.allow_participant_campaigns || isCreator)")
  );

  // 4. Zero em dashes verification
  console.log("\n--- 4. Zero Em Dashes Verification ---");
  check("Zero em dashes in page.tsx", !pageContent.includes("\u2014"));

  // Summary
  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;

  console.log("\n=============================================================");
  console.log(`Day 4 Checkpoint Summary: ${passed} passed, ${failed} failed`);
  console.log("=============================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runDay4Verification().catch((err) => {
  console.error("Verification suite encountered an error:", err);
  process.exit(1);
});
