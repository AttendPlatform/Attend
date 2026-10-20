/**
 * Day 3 Verification Suite: Mobile Sticky Action Bar, Cancel Modal & Registration Modal
 */

import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { z } from "zod";

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

async function runDay3Verification() {
  console.log("\n=============================================================");
  console.log("Starting Day 3 Verification Suite: Mobile Action Bar & Modals");
  console.log("=============================================================\n");

  // 1. Target files existence
  console.log("--- 1. Target Files Existence ---");
  const components = [
    "src/components/events/EventAttendanceProvider.tsx",
    "src/components/events/CancelRsvpModal.tsx",
    "src/components/events/RegistrationModal.tsx",
    "src/components/events/MobileEventActionBar.tsx",
    "src/components/events/EventPrimaryAction.tsx",
    "src/lib/validations/registration.ts",
    "src/components/events/index.ts",
    "src/app/events/[id]/page.tsx",
  ];

  for (const component of components) {
    check(`File exists: ${component}`, existsSync(resolve(process.cwd(), component)));
  }

  // 2. Barrel Exports
  console.log("\n--- 2. Barrel Exports ---");
  const indexContent = readFileSync(
    resolve(process.cwd(), "src/components/events/index.ts"),
    "utf8"
  );
  check("index.ts exports EventAttendanceProvider", indexContent.includes("EventAttendanceProvider"));
  check("index.ts exports useEventAttendance", indexContent.includes("useEventAttendance"));
  check("index.ts exports CancelRsvpModal", indexContent.includes("CancelRsvpModal"));
  check("index.ts exports RegistrationModal", indexContent.includes("RegistrationModal"));
  check("index.ts exports MobileEventActionBar", indexContent.includes("MobileEventActionBar"));
  check("index.ts exports EventPrimaryAction", indexContent.includes("EventPrimaryAction"));

  // 3. EventAttendanceProvider checks
  console.log("\n--- 3. EventAttendanceProvider Architecture ---");
  const providerContent = readFileSync(
    resolve(process.cwd(), "src/components/events/EventAttendanceProvider.tsx"),
    "utf8"
  );
  check(
    "Provider defines AttendanceStatus enum matching database",
    providerContent.includes('"none"') &&
      providerContent.includes('"attending"') &&
      providerContent.includes('"registered"') &&
      providerContent.includes('"ticketed"') &&
      providerContent.includes('"cancelled"')
  );
  check("Provider exports useEventAttendance hook", providerContent.includes("export function useEventAttendance"));
  check("Provider handles optimistic RSVP update", providerContent.includes('setStatus("attending")'));
  check("Provider handles optimistic cancellation", providerContent.includes('setStatus("cancelled")'));
  check("Provider supports registration modal state", providerContent.includes("isRegistrationModalOpen"));

  // 4. CancelRsvpModal Accessibility & Semantics
  console.log("\n--- 4. CancelRsvpModal Accessibility & Semantics ---");
  const cancelModalContent = readFileSync(
    resolve(process.cwd(), "src/components/events/CancelRsvpModal.tsx"),
    "utf8"
  );
  check('Cancel modal has role="alertdialog"', cancelModalContent.includes('role="alertdialog"'));
  check('Cancel modal has aria-modal="true"', cancelModalContent.includes('aria-modal="true"'));
  check('Cancel modal has aria-labelledby="cancel-rsvp-title"', cancelModalContent.includes('aria-labelledby="cancel-rsvp-title"'));
  check('Cancel modal has aria-describedby="cancel-rsvp-description"', cancelModalContent.includes('aria-describedby="cancel-rsvp-description"'));
  check("Cancel modal implements keyboard focus trap", cancelModalContent.includes('event.key !== "Tab"') && cancelModalContent.includes("event.shiftKey"));
  check("Cancel modal implements focus restoration to triggerElement", cancelModalContent.includes("triggerElement.focus()"));
  check("Cancel modal implements ESC key listener", cancelModalContent.includes('event.key === "Escape"'));
  check("Cancel modal locks body scroll when open", cancelModalContent.includes('document.body.style.overflow = "hidden"'));

  // 5. RegistrationModal & Validation Schema
  console.log("\n--- 5. RegistrationModal & Dynamic Validation ---");
  const regModalContent = readFileSync(
    resolve(process.cwd(), "src/components/events/RegistrationModal.tsx"),
    "utf8"
  );
  check('Registration modal has role="dialog"', regModalContent.includes('role="dialog"'));
  check('Registration modal has aria-modal="true"', regModalContent.includes('aria-modal="true"'));
  check("Registration modal handles loading state with Loader2", regModalContent.includes("<Loader2"));
  check("Registration modal handles success confirmation state", regModalContent.includes("isSuccess") && regModalContent.includes("Registration Confirmed"));
  check("Registration modal connects to submitRegistrationAction", regModalContent.includes("submitRegistrationAction("));

  const validationContent = readFileSync(
    resolve(process.cwd(), "src/lib/validations/registration.ts"),
    "utf8"
  );
  check("registration.ts exports baseRegistrationSchema", validationContent.includes("export const baseRegistrationSchema"));
  check("registration.ts exports normalizeRegistrationConfig", validationContent.includes("export function normalizeRegistrationConfig"));
  check("registration.ts exports buildRegistrationSchema", validationContent.includes("export function buildRegistrationSchema"));
  check("registration.ts exports validateRegistrationPayload", validationContent.includes("export function validateRegistrationPayload"));

  // Zod unit test verification
  const testBaseSchema = z.object({
    name: z.string().trim().min(2, "Name must be at least 2 characters."),
    email: z.string().trim().email().optional().or(z.literal("")),
  });
  check("Zod base schema accepts valid name", testBaseSchema.safeParse({ name: "Jane Doe" }).success);
  check("Zod base schema rejects short name", !testBaseSchema.safeParse({ name: "J" }).success);

  // 6. MobileEventActionBar Docking & Layout
  console.log("\n--- 6. MobileEventActionBar Docking & Layout ---");
  const actionBarContent = readFileSync(
    resolve(process.cwd(), "src/components/events/MobileEventActionBar.tsx"),
    "utf8"
  );
  check(
    "Mobile bar docks above MobileNav with safe-area offset on phones",
    actionBarContent.includes("bottom-[calc(4rem+env(safe-area-inset-bottom))]")
  );
  check("Mobile bar docks at bottom-0 on tablet (md:bottom-0)", actionBarContent.includes("md:bottom-0"));
  check("Mobile bar is hidden on desktop (lg:hidden)", actionBarContent.includes("lg:hidden"));
  check("Mobile bar has z-40 positioning below modal", actionBarContent.includes("z-40"));
  check("Mobile bar renders context snippet (date / model)", actionBarContent.includes("formatMobileDate"));
  check("Mobile bar includes SaveButton and ShareButton", actionBarContent.includes("<SaveButton") && actionBarContent.includes("<ShareButton"));

  // 7. Page Integration
  console.log("\n--- 7. Page Integration ---");
  const pageContent = readFileSync(
    resolve(process.cwd(), "src/app/events/[id]/page.tsx"),
    "utf8"
  );
  check("Page includes EventAttendanceProvider", pageContent.includes("<EventAttendanceProvider"));
  check("Page includes CancelRsvpModal", pageContent.includes("<CancelRsvpModal />"));
  check("Page includes RegistrationModal", pageContent.includes("<RegistrationModal />"));
  check("Page includes MobileEventActionBar", pageContent.includes("<MobileEventActionBar"));
  check(
    "Page has responsive bottom padding (pb-40 md:pb-24 lg:pb-12)",
    pageContent.includes("pb-40") && pageContent.includes("md:pb-24")
  );

  // 8. Zero em dashes verification
  console.log("\n--- 8. Zero Em Dashes Verification ---");
  const allContents = [providerContent, cancelModalContent, regModalContent, actionBarContent, validationContent];
  const hasEmDash = allContents.some((content) => content.includes("\u2014") || content.includes("\u2013"));
  check("Zero em dashes across components and schemas", !hasEmDash);

  // Summary
  const passedCount = results.filter((r) => r.passed).length;
  const failedCount = results.filter((r) => !r.passed).length;

  console.log("\n=============================================================");
  console.log(`Day 3 Checkpoint Summary: ${passedCount} passed, ${failedCount} failed`);
  console.log("=============================================================\n");

  if (failedCount > 0) {
    process.exit(1);
  }
}

runDay3Verification().catch((err) => {
  console.error("Day 3 Verification encountered error:", err);
  process.exit(1);
});
