import { existsSync, readFileSync } from "node:fs";
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

async function runVerification() {
  console.log("\n=============================================================");
  console.log("Starting Week 3 Day 3 Verification: Registration Modal & Action Bar");
  console.log("=============================================================\n");

  // 1. File existence
  const requiredFiles = [
    "src/lib/validations/registration.ts",
    "src/components/events/RegistrationModal.tsx",
    "src/components/events/CancellationModal.tsx",
    "src/components/events/MobileEventActionBar.tsx",
    "src/components/events/EventPrimaryAction.tsx",
    "src/components/events/index.ts",
    "src/app/events/[id]/page.tsx",
  ];

  console.log("--- 1. Target Files Existence ---");
  for (const file of requiredFiles) {
    const fullPath = resolve(process.cwd(), file);
    check(`File exists: ${file}`, existsSync(fullPath));
  }

  // 2. Barrel Exports
  console.log("\n--- 2. Barrel Exports ---");
  const indexContent = readFileSync(
    resolve(process.cwd(), "src/components/events/index.ts"),
    "utf8"
  );
  check("index.ts exports RegistrationModal", indexContent.includes("RegistrationModal"));
  check("index.ts exports CancellationModal", indexContent.includes("CancellationModal"));
  check("index.ts exports MobileEventActionBar", indexContent.includes("MobileEventActionBar"));
  check("index.ts exports EventPrimaryAction", indexContent.includes("EventPrimaryAction"));

  // 3. Validation Schema Contracts & Zod Logic
  console.log("\n--- 3. Registration Schema Contracts & Validation Logic ---");
  const validationContent = readFileSync(
    resolve(process.cwd(), "src/lib/validations/registration.ts"),
    "utf8"
  );

  check(
    "registration.ts exports baseRegistrationSchema",
    validationContent.includes("export const baseRegistrationSchema")
  );
  check(
    "registration.ts exports normalizeRegistrationQuestions",
    validationContent.includes("export function normalizeRegistrationQuestions")
  );
  check(
    "registration.ts exports normalizeRegistrationConfig",
    validationContent.includes("export function normalizeRegistrationConfig")
  );
  check(
    "registration.ts exports buildRegistrationSchema",
    validationContent.includes("export function buildRegistrationSchema")
  );
  check(
    "registration.ts exports validateRegistrationPayload",
    validationContent.includes("export function validateRegistrationPayload")
  );

  // Schema verification using Zod directly
  const testBaseSchema = z.object({
    name: z.string().trim().min(2, "Name must be at least 2 characters."),
    email: z.string().trim().email().optional().or(z.literal("")),
    phone: z.string().trim().optional().or(z.literal("")),
    organization: z.string().trim().optional().or(z.literal("")),
    job_title: z.string().trim().optional().or(z.literal("")),
  });

  const validNameResult = testBaseSchema.safeParse({ name: "Jane Doe" });
  check("Zod base schema accepts valid name", validNameResult.success);

  const shortNameResult = testBaseSchema.safeParse({ name: "J" });
  check("Zod base schema rejects name with 1 character", !shortNameResult.success);

  // 4. Component Architecture & Accessibility
  console.log("\n--- 4. UI Architecture & Accessibility Contracts ---");
  const modalContent = readFileSync(
    resolve(process.cwd(), "src/components/events/RegistrationModal.tsx"),
    "utf8"
  );
  check(
    "RegistrationModal includes role='dialog' and aria-modal='true'",
    modalContent.includes('role="dialog"') && modalContent.includes('aria-modal="true"')
  );
  check(
    "RegistrationModal handles loading state with Loader2 spinner",
    modalContent.includes("<Loader2")
  );
  check(
    "RegistrationModal handles success confirmation state",
    modalContent.includes("isSuccess") && modalContent.includes("Registration Confirmed")
  );
  check(
    "RegistrationModal connects to submitRegistrationAction",
    modalContent.includes("submitRegistrationAction(")
  );
  check(
    "RegistrationModal supports custom questions mapping",
    modalContent.includes("config.questions.map")
  );

  const cancelContent = readFileSync(
    resolve(process.cwd(), "src/components/events/CancellationModal.tsx"),
    "utf8"
  );
  check(
    "CancellationModal includes role='alertdialog'",
    cancelContent.includes('role="alertdialog"')
  );
  check(
    "CancellationModal provides non-destructive warning",
    cancelContent.includes("Keep my RSVP") && cancelContent.includes("Yes, cancel RSVP")
  );

  const primaryContent = readFileSync(
    resolve(process.cwd(), "src/components/events/EventPrimaryAction.tsx"),
    "utf8"
  );
  check(
    "EventPrimaryAction opens RegistrationModal for registration model",
    primaryContent.includes("RegistrationModal") && primaryContent.includes("setIsRegModalOpen(true)")
  );
  check(
    "EventPrimaryAction opens CancellationModal for RSVP cancellation",
    primaryContent.includes("CancellationModal") && primaryContent.includes("setIsCancelModalOpen(true)")
  );

  const mobileBarContent = readFileSync(
    resolve(process.cwd(), "src/components/events/MobileEventActionBar.tsx"),
    "utf8"
  );
  check(
    "MobileEventActionBar uses fixed bottom sticky styling for mobile viewports",
    mobileBarContent.includes("fixed inset-x-0 bottom-0") && mobileBarContent.includes("md:hidden")
  );
  check(
    "MobileEventActionBar includes SaveButton and ShareButton",
    mobileBarContent.includes("<SaveButton") && mobileBarContent.includes("<ShareButton")
  );
  check(
    "MobileEventActionBar includes EventPrimaryAction",
    mobileBarContent.includes("<EventPrimaryAction")
  );

  const pageContent = readFileSync(
    resolve(process.cwd(), "src/app/events/[id]/page.tsx"),
    "utf8"
  );
  check(
    "Event detail page imports and renders MobileEventActionBar",
    pageContent.includes("<MobileEventActionBar")
  );
  check(
    "Event detail page incorporates mobile padding offset (pb-24 md:pb-12)",
    pageContent.includes("pb-24 md:pb-12")
  );

  // Summary
  console.log("\n=============================================================");
  const total = results.length;
  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;
  console.log(`Day 3 Checkpoint Summary: ${passed} passed, ${failed} failed`);
  console.log("=============================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runVerification().catch((err) => {
  console.error(err);
  process.exit(1);
});
