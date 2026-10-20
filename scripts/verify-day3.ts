/**
 * Day 3 Verification Suite: Mobile Sticky Action Bar & Cancel RSVP Modal
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

async function runDay3Verification() {
  console.log("\n=============================================================");
  console.log("Starting Day 3 Verification Suite: Mobile Sticky Action Bar");
  console.log("=============================================================\n");

  // 1. Component existence
  const components = [
    "src/components/events/EventAttendanceProvider.tsx",
    "src/components/events/CancelRsvpModal.tsx",
    "src/components/events/MobileEventActionBar.tsx",
    "src/components/events/EventPrimaryAction.tsx",
    "src/components/events/index.ts",
  ];

  for (const component of components) {
    check(`Component exists: ${component}`, existsSync(resolve(process.cwd(), component)));
  }

  // 2. EventAttendanceProvider checks
  const providerContent = readFileSync(
    resolve(process.cwd(), "src/components/events/EventAttendanceProvider.tsx"),
    "utf8"
  );
  check("Provider defines AttendanceStatus enum matching database", 
    providerContent.includes('"none"') &&
    providerContent.includes('"attending"') &&
    providerContent.includes('"registered"') &&
    providerContent.includes('"ticketed"') &&
    providerContent.includes('"cancelled"')
  );
  check("Provider exports useEventAttendance hook", providerContent.includes("export function useEventAttendance"));
  check("Provider handles optimistic RSVP update", providerContent.includes('setStatus("attending")'));
  check("Provider handles optimistic cancellation", providerContent.includes('setStatus("cancelled")'));

  // 3. CancelRsvpModal Accessibility & Semantics
  const modalContent = readFileSync(
    resolve(process.cwd(), "src/components/events/CancelRsvpModal.tsx"),
    "utf8"
  );
  check('Modal has role="alertdialog"', modalContent.includes('role="alertdialog"'));
  check('Modal has aria-modal="true"', modalContent.includes('aria-modal="true"'));
  check('Modal has aria-labelledby="cancel-rsvp-title"', modalContent.includes('aria-labelledby="cancel-rsvp-title"'));
  check('Modal has aria-describedby="cancel-rsvp-description"', modalContent.includes('aria-describedby="cancel-rsvp-description"'));
  check("Modal implements keyboard focus trap", modalContent.includes("event.key !== \"Tab\"") && modalContent.includes("event.shiftKey"));
  check("Modal implements focus restoration to triggerElement", modalContent.includes("triggerElement.focus()"));
  check("Modal implements ESC key listener", modalContent.includes('event.key === "Escape"'));
  check("Modal locks body scroll when open", modalContent.includes('document.body.style.overflow = "hidden"'));

  // 4. MobileEventActionBar Docking & Layout
  const actionBarContent = readFileSync(
    resolve(process.cwd(), "src/components/events/MobileEventActionBar.tsx"),
    "utf8"
  );
  check("Mobile bar docks above MobileNav with safe-area offset on phones", 
    actionBarContent.includes("bottom-[calc(4rem+env(safe-area-inset-bottom))]")
  );
  check("Mobile bar docks at bottom-0 on tablet (md:bottom-0)", actionBarContent.includes("md:bottom-0"));
  check("Mobile bar is hidden on desktop (lg:hidden)", actionBarContent.includes("lg:hidden"));
  check("Mobile bar has z-40 positioning below modal", actionBarContent.includes("z-40"));
  check("Mobile bar renders context snippet (date / model)", actionBarContent.includes("formatMobileDate"));

  // 5. Page Integration
  const pageContent = readFileSync(
    resolve(process.cwd(), "src/app/events/[id]/page.tsx"),
    "utf8"
  );
  check("Page includes EventAttendanceProvider", pageContent.includes("<EventAttendanceProvider"));
  check("Page includes CancelRsvpModal", pageContent.includes("<CancelRsvpModal />"));
  check("Page includes MobileEventActionBar", pageContent.includes("<MobileEventActionBar"));
  check("Page has responsive bottom padding (pb-40 md:pb-24 lg:pb-12)", 
    pageContent.includes("pb-40") && pageContent.includes("md:pb-24")
  );

  // 6. Zero em dashes verification
  const allContents = [providerContent, modalContent, actionBarContent];
  const hasEmDash = allContents.some((content) => content.includes("\u2014"));
  check("Zero em dashes in new components", !hasEmDash);

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
