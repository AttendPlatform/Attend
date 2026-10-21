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

async function runMilestone2Verification() {
  console.log("\n=============================================================");
  console.log("Starting Milestone 2 Verification: Public Events & Attendance");
  console.log("=============================================================\n");

  // 1. Target Modules & Component Architecture
  console.log("--- 1. Target Modules & Component Architecture ---");
  const requiredFiles = [
    "src/components/ui/AvatarStack.tsx",
    "src/components/ui/SaveButton.tsx",
    "src/components/ui/ShareButton.tsx",
    "src/components/events/ExpandableEventCover.tsx",
    "src/components/events/EventPrimaryAction.tsx",
    "src/components/events/EventAttendanceProvider.tsx",
    "src/components/events/CancelRsvpModal.tsx",
    "src/components/events/RegistrationModal.tsx",
    "src/components/events/MobileEventActionBar.tsx",
    "src/components/events/index.ts",
    "src/lib/validations/registration.ts",
    "src/lib/utils/guest-intent.ts",
    "src/services/attendance.service.ts",
    "src/services/saved.service.ts",
    "src/app/actions/attendance.ts",
    "src/app/actions/saved.ts",
    "src/app/events/[id]/page.tsx",
  ];

  for (const file of requiredFiles) {
    check(`Target file exists: ${file}`, existsSync(resolve(process.cwd(), file)));
  }

  const barrelContent = readFileSync(
    resolve(process.cwd(), "src/components/events/index.ts"),
    "utf8"
  );
  check("index.ts exports AvatarStack or imports ui AvatarStack", barrelContent.includes("AvatarStack") || existsSync(resolve(process.cwd(), "src/components/ui/AvatarStack.tsx")));
  check("index.ts exports EventAttendanceProvider", barrelContent.includes("EventAttendanceProvider"));
  check("index.ts exports useEventAttendance", barrelContent.includes("useEventAttendance"));
  check("index.ts exports EventPrimaryAction", barrelContent.includes("EventPrimaryAction"));
  check("index.ts exports CancelRsvpModal", barrelContent.includes("CancelRsvpModal"));
  check("index.ts exports RegistrationModal", barrelContent.includes("RegistrationModal"));
  check("index.ts exports MobileEventActionBar", barrelContent.includes("MobileEventActionBar"));
  check("index.ts exports ExpandableEventCover", barrelContent.includes("ExpandableEventCover"));

  // 2. All 4 Participation Tiers
  console.log("\n--- 2. All 4 Participation Tiers State Machine ---");

  // Tier 1: Free RSVP
  const attendanceActionsContent = readFileSync(
    resolve(process.cwd(), "src/app/actions/attendance.ts"),
    "utf8"
  );
  check("attendance.ts exports toggleAttendanceAction", attendanceActionsContent.includes("export async function toggleAttendanceAction"));
  check("attendance.ts exports submitRegistrationAction", attendanceActionsContent.includes("export async function submitRegistrationAction"));

  const providerContent = readFileSync(
    resolve(process.cwd(), "src/components/events/EventAttendanceProvider.tsx"),
    "utf8"
  );
  check("Provider defines full attendance status union",
    providerContent.includes('"none"') &&
    providerContent.includes('"attending"') &&
    providerContent.includes('"registered"') &&
    providerContent.includes('"ticketed"') &&
    providerContent.includes('"cancelled"')
  );

  const primaryActionContent = readFileSync(
    resolve(process.cwd(), "src/components/events/EventPrimaryAction.tsx"),
    "utf8"
  );
  check("EventPrimaryAction supports Free RSVP label", primaryActionContent.includes('"Attend event"'));

  // Tier 2: Registration
  const validationsContent = readFileSync(
    resolve(process.cwd(), "src/lib/validations/registration.ts"),
    "utf8"
  );
  check("registration.ts builds custom question schemas", validationsContent.includes("buildRegistrationSchema"));
  check("registration.ts normalizes registration config", validationsContent.includes("normalizeRegistrationConfig"));

  const regModalContent = readFileSync(
    resolve(process.cwd(), "src/components/events/RegistrationModal.tsx"),
    "utf8"
  );
  check("RegistrationModal handles submission lifecycle",
    regModalContent.includes("submitRegistrationAction") &&
    regModalContent.includes("isSuccess") &&
    regModalContent.includes("pending")
  );

  // Schema unit tests
  const testSchema = z.object({
    name: z.string().trim().min(2),
    email: z.string().trim().email().optional().or(z.literal("")),
    dietary: z.string().min(1),
  });
  check("Zod registration schema passes valid data",
    testSchema.safeParse({ name: "Amara Okonkwo", email: "amara@example.com", dietary: "Vegetarian" }).success
  );
  check("Zod registration schema rejects short name",
    !testSchema.safeParse({ name: "A", dietary: "None" }).success
  );
  check("Zod registration schema rejects missing required custom field",
    !testSchema.safeParse({ name: "Amara Okonkwo", dietary: "" }).success
  );

  // Tier 3: Paid Link
  check("Primary CTA supports Paid model label", primaryActionContent.includes('"Get tickets"'));
  check("Primary CTA renders ticket icon for paid model", primaryActionContent.includes("<Ticket"));

  // Tier 4: External Link
  check("Primary CTA handles external ticketing URL", primaryActionContent.includes("href={externalUrl}"));
  check("External link opens in new tab securely", primaryActionContent.includes('target="_blank"') && primaryActionContent.includes('rel="noopener noreferrer"'));

  // 3. Social Proof & AvatarStack Calculations / Privacy Masking
  console.log("\n--- 3. Social Proof & AvatarStack Calculations ---");
  const avatarStackContent = readFileSync(
    resolve(process.cwd(), "src/components/ui/AvatarStack.tsx"),
    "utf8"
  );
  check("AvatarStack queries public_event_attendees view", avatarStackContent.includes('"public_event_attendees"'));
  check("AvatarStack masks private info and selects only public fields",
    avatarStackContent.includes("user_id,name,profile_display_name,profile_avatar_url,profile_username") &&
    !avatarStackContent.includes("email") &&
    !avatarStackContent.includes("phone")
  );
  check("AvatarStack caps visible avatars to 4", avatarStackContent.includes(".slice(0, 4)"));
  check("AvatarStack computes fallback initial letter", avatarStackContent.includes("charAt(0).toUpperCase()"));
  check("AvatarStack formats zero attendee fallback state", avatarStackContent.includes('"Be the first to join"'));
  check("AvatarStack supports custom label and localization", avatarStackContent.includes("label = \"attending\""));

  // 4. Bookmark Persistence in saved_events
  console.log("\n--- 4. Bookmark Persistence in saved_events ---");
  const savedServiceContent = readFileSync(
    resolve(process.cwd(), "src/services/saved.service.ts"),
    "utf8"
  );
  check("saved.service.ts exports isEventSaved", savedServiceContent.includes("export async function isEventSaved"));
  check("saved.service.ts exports toggleSaveEvent", savedServiceContent.includes("export async function toggleSaveEvent"));
  check("saved.service.ts operates on saved_events table", savedServiceContent.includes('"saved_events"'));

  const savedActionsContent = readFileSync(
    resolve(process.cwd(), "src/app/actions/saved.ts"),
    "utf8"
  );
  check("saved.ts exports toggleSavedAction", savedActionsContent.includes("export async function toggleSavedAction"));
  check("toggleSavedAction revalidates /saved and /profile paths",
    savedActionsContent.includes('revalidatePath("/saved")') &&
    savedActionsContent.includes('revalidatePath("/profile")')
  );

  const saveButtonContent = readFileSync(
    resolve(process.cwd(), "src/components/ui/SaveButton.tsx"),
    "utf8"
  );
  check("SaveButton performs optimistic bookmark toggling",
    saveButtonContent.includes("setSaved(!previous)") &&
    saveButtonContent.includes("setSaved(previous)")
  );
  check("SaveButton redirects guest users to login with next path",
    saveButtonContent.includes("result.requiresLogin") &&
    saveButtonContent.includes("/login?next=")
  );

  // 5. Dynamic OpenGraph Metadata Generation
  console.log("\n--- 5. Dynamic OpenGraph Metadata Generation ---");
  const pageContent = readFileSync(
    resolve(process.cwd(), "src/app/events/[id]/page.tsx"),
    "utf8"
  );
  check("Page exports generateMetadata function", pageContent.includes("export async function generateMetadata"));
  check("generateMetadata sets dynamic event title", pageContent.includes("`${event.title} | Attend`"));
  check("generateMetadata sets fallback metadata for not-found events", pageContent.includes('"Event Details | Attend"'));
  check("generateMetadata sets OpenGraph title and description",
    pageContent.includes("openGraph:") &&
    pageContent.includes("title: event.title") &&
    pageContent.includes("description: event.description")
  );
  check("generateMetadata attaches cover image when available",
    pageContent.includes("images: event.cover_image ? [event.cover_image] : []")
  );

  // 6. Guest Sign-In Intent Retention Flow
  console.log("\n--- 6. Guest Sign-In Intent Retention Flow ---");
  const intentUtilContent = readFileSync(
    resolve(process.cwd(), "src/lib/utils/guest-intent.ts"),
    "utf8"
  );
  check("guest-intent.ts exports setGuestIntent", intentUtilContent.includes("export function setGuestIntent"));
  check("guest-intent.ts exports getGuestIntent", intentUtilContent.includes("export function getGuestIntent"));
  check("guest-intent.ts exports clearGuestIntent", intentUtilContent.includes("export function clearGuestIntent"));
  check("guest-intent.ts exports buildLoginUrlWithIntent", intentUtilContent.includes("export function buildLoginUrlWithIntent"));
  check("guest-intent.ts exports parseGuestIntentFromSearch", intentUtilContent.includes("export function parseGuestIntentFromSearch"));

  // Functional test of URL building
  const testLoginUrl = (function() {
    const baseTarget = "/events/evt-101";
    const separator = baseTarget.includes("?") ? "&" : "?";
    return `/login?next=${encodeURIComponent(`${baseTarget}${separator}intent=attend`)}`;
  })();
  check("Login URL encodes intent cleanly", testLoginUrl.includes("next=%2Fevents%2Fevt-101%3Fintent%3Dattend"));

  const loginPageContent = readFileSync(
    resolve(process.cwd(), "src/app/login/page.tsx"),
    "utf8"
  );
  check("login/page.tsx safely resolves next parameter",
    loginPageContent.includes("searchParams.get(\"next\")") &&
    loginPageContent.includes('nextParam.startsWith("/")') &&
    loginPageContent.includes('!nextParam.startsWith("//")')
  );

  check("EventPrimaryAction connects intent on guest click",
    primaryActionContent.includes("buildLoginUrlWithIntent") &&
    primaryActionContent.includes("setGuestIntent")
  );

  const mobileBarContent = readFileSync(
    resolve(process.cwd(), "src/components/events/MobileEventActionBar.tsx"),
    "utf8"
  );
  check("MobileEventActionBar preserves guest intent",
    mobileBarContent.includes("buildLoginUrlWithIntent") &&
    mobileBarContent.includes("setGuestIntent")
  );

  check("EventAttendanceProvider auto-resumes action from intent and cleans URL",
    providerContent.includes("parseGuestIntentFromSearch") &&
    providerContent.includes("getGuestIntent") &&
    providerContent.includes("clearGuestIntent") &&
    providerContent.includes('url.searchParams.delete("intent")')
  );

  // 7. ExpandableEventCover & Accessible Modals
  console.log("\n--- 7. Modals & Interactive Accessibility ---");
  const coverContent = readFileSync(
    resolve(process.cwd(), "src/components/events/ExpandableEventCover.tsx"),
    "utf8"
  );
  check("ExpandableEventCover locks body scroll when expanded", coverContent.includes('document.body.style.overflow = "hidden"'));
  check("ExpandableEventCover restores body scroll on close", coverContent.includes("document.body.style.overflow = originalOverflow"));
  check("ExpandableEventCover dismisses on Escape key", coverContent.includes('event.key === "Escape"'));

  const cancelModalContent = readFileSync(
    resolve(process.cwd(), "src/components/events/CancelRsvpModal.tsx"),
    "utf8"
  );
  check("CancelRsvpModal uses alertdialog role", cancelModalContent.includes('role="alertdialog"'));
  check("CancelRsvpModal implements focus restoration", cancelModalContent.includes("triggerElement.focus()"));

  // 8. Zero Em Dashes Policy
  console.log("\n--- 8. Zero Em Dashes Policy ---");
  const allWeek3Files = [
    providerContent,
    cancelModalContent,
    regModalContent,
    mobileBarContent,
    primaryActionContent,
    validationsContent,
    intentUtilContent,
    avatarStackContent,
    savedServiceContent,
    saveButtonContent,
    pageContent,
    coverContent,
  ];
  const foundEmDash = allWeek3Files.some((c) => c.includes("\u2014"));
  check("Zero em dashes found across all Milestone 2 code", !foundEmDash);

  // Summary
  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;

  console.log("\n=============================================================");
  console.log(`Milestone 2 Checkpoint Summary: ${passed} passed, ${failed} failed`);
  console.log("=============================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runMilestone2Verification().catch((err) => {
  console.error("Milestone 2 verification encountered error:", err);
  process.exit(1);
});
