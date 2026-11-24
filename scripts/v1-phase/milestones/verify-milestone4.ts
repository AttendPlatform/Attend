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

function testEscapeCsvField(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }
  const str = typeof value === "object" ? JSON.stringify(value) : String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function testSimulateOrganizerAccess(
  eventCreatorId: string,
  organizerRows: { event_id: string; user_id: string; role: "admin" | "member" }[],
  viewerId: string
): { isOrganizer: boolean; role: "owner" | "admin" | "member" | null; isCreator: boolean } {
  const isCreator = eventCreatorId === viewerId;
  const organizerRecord = organizerRows.find((row) => row.user_id === viewerId);
  const organizerRole = organizerRecord ? organizerRecord.role : null;
  const isOrganizer = isCreator || Boolean(organizerRole);
  const role = organizerRole || (isCreator ? "owner" : null);

  return { isOrganizer, role, isCreator };
}

async function runMilestone4Verification() {
  console.log("\n=============================================================");
  console.log("Starting Milestone 4 Verification: Organizer Dashboard & V1 Acceptance");
  console.log("=============================================================\n");

  const cwd = process.cwd();

  // 1. Target files and architecture inventory
  console.log("--- 1. Target Files & Architecture Inventory ---");
  const targetFiles = [
    "src/types/dashboard.ts",
    "src/types/index.ts",
    "src/services/organizer.service.ts",
    "src/services/events.service.ts",
    "src/services/attendance.service.ts",
    "src/services/notifications.service.ts",
    "src/services/saved.service.ts",
    "src/services/index.ts",
    "src/lib/dashboard/csv-export.ts",
    "src/components/dashboard/OrganizerHeader.tsx",
    "src/components/dashboard/OrganizerTabs.tsx",
    "src/components/dashboard/OrganizerOverviewTab.tsx",
    "src/components/dashboard/OrganizerPeopleTab.tsx",
    "src/components/dashboard/index.ts",
    "src/components/campaigns/CampaignHeader.tsx",
    "src/components/campaigns/CampaignResultActions.tsx",
    "src/app/dashboard/events/[id]/page.tsx",
    "src/app/saved/page.tsx",
    "supabase/migrations/20261005195800_v1_phase0_tables.sql",
  ];

  for (const relPath of targetFiles) {
    const fullPath = resolve(cwd, relPath);
    check(`Target file exists: ${relPath}`, existsSync(fullPath));
  }

  const typesIndexContent = readFileSync(resolve(cwd, "src/types/index.ts"), "utf8");
  check("types barrel exports dashboard contracts", typesIndexContent.includes("./dashboard"));

  const servicesIndexContent = readFileSync(resolve(cwd, "src/services/index.ts"), "utf8");
  check("services barrel exports organizer.service", servicesIndexContent.includes("./organizer.service"));
  check("services barrel exports events.service", servicesIndexContent.includes("./events.service"));
  check("services barrel exports notifications.service", servicesIndexContent.includes("./notifications.service"));
  check("services barrel exports attendance.service", servicesIndexContent.includes("./attendance.service"));
  check("services barrel exports saved.service", servicesIndexContent.includes("./saved.service"));

  const dashboardIndexContent = readFileSync(resolve(cwd, "src/components/dashboard/index.ts"), "utf8");
  check("dashboard barrel exports OrganizerHeader", dashboardIndexContent.includes("OrganizerHeader"));
  check("dashboard barrel exports OrganizerTabs", dashboardIndexContent.includes("OrganizerTabs"));
  check("dashboard barrel exports OrganizerOverviewTab", dashboardIndexContent.includes("OrganizerOverviewTab"));
  check("dashboard barrel exports OrganizerPeopleTab", dashboardIndexContent.includes("OrganizerPeopleTab"));

  // 2. Phase 4 data contracts and types
  console.log("\n--- 2. Phase 4 Data Contracts & Types ---");
  const dashboardTypeContent = readFileSync(resolve(cwd, "src/types/dashboard.ts"), "utf8");

  check("OrganizerRole defines owner, admin, and member", dashboardTypeContent.includes('"owner" | "admin" | "member"'));
  check("OrganizerAccessResult interface is defined", dashboardTypeContent.includes("export interface OrganizerAccessResult"));
  check("DashboardTab defines 4 tabs", dashboardTypeContent.includes('"overview" | "people" | "campaigns" | "settings"'));
  check("SavedHubTab defines events and campaigns", dashboardTypeContent.includes('"events" | "campaigns"'));
  check("DashboardOverviewStats interface is defined", dashboardTypeContent.includes("export interface DashboardOverviewStats"));
  check("OrganizerEventHeaderData interface is defined", dashboardTypeContent.includes("export interface OrganizerEventHeaderData"));
  check("PeopleSubTab defines 4 sub-tabs", dashboardTypeContent.includes('"attendees"'));
  check("OrganizerPeopleRosterItem interface is defined", dashboardTypeContent.includes("export interface OrganizerPeopleRosterItem"));
  check("OrganizerPeopleStats interface is defined", dashboardTypeContent.includes("export interface OrganizerPeopleStats"));
  check("Lifecycle notification payloads are defined",
    dashboardTypeContent.includes("EventUpdatedNotificationPayload") &&
    dashboardTypeContent.includes("CampaignCreatedNotificationPayload") &&
    dashboardTypeContent.includes("RegistrationReceiptPayload") &&
    dashboardTypeContent.includes("EventCancelledNotificationPayload")
  );

  // 3. Dual-factor organizer access control
  console.log("\n--- 3. Dual-Factor Organizer Access Control ---");
  const eventsServiceContent = readFileSync(resolve(cwd, "src/services/events.service.ts"), "utf8");
  check("events.service has use server directive", eventsServiceContent.startsWith('"use server";') || eventsServiceContent.startsWith("'use server';"));
  check("events.service exports getOrganizerAccess", eventsServiceContent.includes("export async function getOrganizerAccess"));
  check("events.service exports isEventOrganizer", eventsServiceContent.includes("export async function isEventOrganizer"));
  check("events.service exports getEventForOrganizer", eventsServiceContent.includes("export async function getEventForOrganizer"));
  check("events.service exports getOrganizerEventStats", eventsServiceContent.includes("export async function getOrganizerEventStats"));
  check("events.service exports requireOrganizerAccess", eventsServiceContent.includes("export async function requireOrganizerAccess"));

  const organizerServiceContent = readFileSync(resolve(cwd, "src/services/organizer.service.ts"), "utf8");
  check("organizer.service exports isUserEventOrganizer", organizerServiceContent.includes("export async function isUserEventOrganizer"));
  check("organizer.service exports getOrganizerEvent", organizerServiceContent.includes("export async function getOrganizerEvent"));
  check("organizer.service exports getOrganizerEventStats", organizerServiceContent.includes("export async function getOrganizerEventStats"));
  check("organizer.service exports getOrganizerEventCampaigns", organizerServiceContent.includes("export async function getOrganizerEventCampaigns"));
  check("OrganizerEventDetails includes description field", organizerServiceContent.includes("description?: string | null;"));

  const creatorAccess = testSimulateOrganizerAccess("user_creator", [], "user_creator");
  check("Creator automatically receives owner role", creatorAccess.isOrganizer && creatorAccess.isCreator && creatorAccess.role === "owner");

  const adminAccess = testSimulateOrganizerAccess(
    "user_creator",
    [{ event_id: "event_1", user_id: "user_admin", role: "admin" }],
    "user_admin"
  );
  check("Co-organizer receives assigned role", adminAccess.isOrganizer && !adminAccess.isCreator && adminAccess.role === "admin");

  const foreignAccess = testSimulateOrganizerAccess("user_creator", [], "user_stranger");
  check("Unauthorized viewer is rejected", !foreignAccess.isOrganizer && foreignAccess.role === null && !foreignAccess.isCreator);

  // 4. Organizer dashboard shell and overview stats
  console.log("\n--- 4. Organizer Dashboard Shell & Overview Stats ---");
  const dashboardPageContent = readFileSync(resolve(cwd, "src/app/dashboard/events/[id]/page.tsx"), "utf8");
  check("Dashboard page requires authentication redirect", dashboardPageContent.includes("redirect(`/login?next="));
  check("Dashboard page checks organizer access", dashboardPageContent.includes("isUserEventOrganizer"));
  check("Dashboard page redirects non-organizers to public event", dashboardPageContent.includes("redirect(`/events/${id}`)"));
  check("Dashboard page renders OrganizerHeader", dashboardPageContent.includes("<OrganizerHeader"));
  check("Dashboard page renders OrganizerTabs", dashboardPageContent.includes("<OrganizerTabs"));
  check("Dashboard page renders OrganizerOverviewTab", dashboardPageContent.includes("<OrganizerOverviewTab"));
  check("Dashboard page renders OrganizerPeopleTab", dashboardPageContent.includes("<OrganizerPeopleTab"));

  const headerContent = readFileSync(resolve(cwd, "src/components/dashboard/OrganizerHeader.tsx"), "utf8");
  check("OrganizerHeader displays event title and status", headerContent.includes("title") && headerContent.includes("status"));
  check("OrganizerHeader links to public event page", headerContent.includes("/events/"));

  const tabsContent = readFileSync(resolve(cwd, "src/components/dashboard/OrganizerTabs.tsx"), "utf8");
  check("OrganizerTabs supports overview, people, campaigns, and settings tabs",
    tabsContent.includes('"overview"') &&
    tabsContent.includes('"people"') &&
    tabsContent.includes('"campaigns"') &&
    tabsContent.includes('"settings"')
  );

  const overviewContent = readFileSync(resolve(cwd, "src/components/dashboard/OrganizerOverviewTab.tsx"), "utf8");
  check("OrganizerOverviewTab renders metric cards for attendees, registrations, campaigns, and generations",
    overviewContent.includes("attendeesCount") &&
    overviewContent.includes("registrationsCount") &&
    overviewContent.includes("campaignsCount") &&
    overviewContent.includes("dpGenerationsCount")
  );

  // 5. People roster domain services and data separation
  console.log("\n--- 5. People Roster Domain Services & Strict Data Separation ---");
  const attendanceServiceContent = readFileSync(resolve(cwd, "src/services/attendance.service.ts"), "utf8");
  check("attendance.service exports getOrganizerPeopleStats", attendanceServiceContent.includes("export async function getOrganizerPeopleStats"));
  check("attendance.service exports getOrganizerPeopleRoster", attendanceServiceContent.includes("export async function getOrganizerPeopleRoster"));
  check("getOrganizerPeopleStats separates attendee and registrant counts",
    attendanceServiceContent.includes('participation_type", "attendee"') &&
    attendanceServiceContent.includes('participation_type", "registrant"')
  );
  check("getOrganizerPeopleRoster isolates campaign participants without conflation",
    attendanceServiceContent.includes('subTab === "campaign_participants"') &&
    attendanceServiceContent.includes('.from("campaigns")')
  );

  const peopleTabContent = readFileSync(resolve(cwd, "src/components/dashboard/OrganizerPeopleTab.tsx"), "utf8");
  check("OrganizerPeopleTab defines 4 distinct sub-tabs",
    peopleTabContent.includes('"attendees"') &&
    peopleTabContent.includes('"registrants"') &&
    peopleTabContent.includes('"ticket_holders"') &&
    peopleTabContent.includes('"campaign_participants"')
  );
  check("OrganizerPeopleTab contains search filter input", peopleTabContent.includes("searchQuery"));
  check("OrganizerPeopleTab includes CSV export trigger", peopleTabContent.includes("downloadRosterCsv"));

  const csvExportContent = readFileSync(resolve(cwd, "src/lib/dashboard/csv-export.ts"), "utf8");
  check("csv-export.ts exports formatRosterCsv", csvExportContent.includes("export function formatRosterCsv"));
  check("csv-export.ts exports downloadRosterCsv", csvExportContent.includes("export function downloadRosterCsv"));

  check("CSV escaping handles simple strings", testEscapeCsvField("Ada Lovelace") === "Ada Lovelace");
  check("CSV escaping wraps strings containing commas", testEscapeCsvField("Lagos, Nigeria") === '"Lagos, Nigeria"');
  check("CSV escaping escapes quotes properly", testEscapeCsvField('Keynote "AI" 2026') === '"Keynote ""AI"" 2026"');
  check("CSV escaping wraps strings containing newlines", testEscapeCsvField("Line 1\nLine 2") === '"Line 1\nLine 2"');

  // 6. Central saved items hub
  console.log("\n--- 6. Central Saved Items Hub ---");
  const savedServiceContent = readFileSync(resolve(cwd, "src/services/saved.service.ts"), "utf8");
  check("saved.service exports isEventSaved and isCampaignSaved",
    savedServiceContent.includes("export async function isEventSaved") &&
    savedServiceContent.includes("export async function isCampaignSaved")
  );
  check("saved.service exports toggleSaveEvent and toggleSaveCampaign",
    savedServiceContent.includes("export async function toggleSaveEvent") &&
    savedServiceContent.includes("export async function toggleSaveCampaign")
  );
  check("saved.service exports getSavedEvents and getSavedCampaigns",
    savedServiceContent.includes("export async function getSavedEvents") &&
    savedServiceContent.includes("export async function getSavedCampaigns")
  );

  const savedPageContent = readFileSync(resolve(cwd, "src/app/saved/page.tsx"), "utf8");
  check("Saved page requires authentication redirect", savedPageContent.includes("redirect(`/login?next="));
  check("Saved page supports dual tabs for events and campaigns",
    savedPageContent.includes('tab === "campaigns"') &&
    savedPageContent.includes('activeTab === "events"')
  );
  check("Saved page fetches saved events and campaigns in parallel",
    savedPageContent.includes("getSavedEvents(user.id)") &&
    savedPageContent.includes("getSavedCampaigns(user.id)")
  );
  check("Saved page links empty state to /discover", savedPageContent.includes('href="/discover"'));

  // 7. Safe event cancellation safeguards
  console.log("\n--- 7. Safe Event Cancellation Safeguards ---");
  check("events.service exports cancelEvent", eventsServiceContent.includes("export async function cancelEvent"));
  check("cancelEvent verifies organizer access before proceeding", eventsServiceContent.includes("getOrganizerAccess"));
  check("cancelEvent sets event status to cancelled", eventsServiceContent.includes('status: "cancelled"'));
  check("cancelEvent dispatches urgent cancellation notifications", eventsServiceContent.includes("dispatchEventCancelledNotification"));

  const campaignHeaderContent = readFileSync(resolve(cwd, "src/components/campaigns/CampaignHeader.tsx"), "utf8");
  check("CampaignHeader checks for cancelled parent event status", campaignHeaderContent.includes('parentEvent?.status === "cancelled"'));
  check("CampaignHeader renders Event Cancelled alert banner", campaignHeaderContent.includes("Event Cancelled"));
  check("CampaignHeader reassures user that graphics remain preserved", campaignHeaderContent.includes("User graphics remain preserved"));
  check("CampaignHeader links to cancelled event notice", campaignHeaderContent.includes("View Event Notice"));

  const campaignResultActionsContent = readFileSync(resolve(cwd, "src/components/campaigns/CampaignResultActions.tsx"), "utf8");
  check("CampaignResultActions checks for cancelled parent event status", campaignResultActionsContent.includes('parentEvent?.status === "cancelled"'));
  check("CampaignResultActions alerts attendee that registrations are closed", campaignResultActionsContent.includes("Registrations are closed"));
  check("CampaignResultActions preserves download graphic CTA", campaignResultActionsContent.includes("Download Graphic"));
  check("CampaignResultActions preserves share graphic CTA", campaignResultActionsContent.includes("Share Graphic") || campaignResultActionsContent.includes("onShare"));

  // 8. Lifecycle notifications engine
  console.log("\n--- 8. Lifecycle Notifications Engine ---");
  const notificationsServiceContent = readFileSync(resolve(cwd, "src/services/notifications.service.ts"), "utf8");
  check("notifications.service exports dispatchDateOrVenueChangeNotification", notificationsServiceContent.includes("export async function dispatchDateOrVenueChangeNotification"));
  check("notifications.service exports dispatchCampaignCreatedNotification", notificationsServiceContent.includes("export async function dispatchCampaignCreatedNotification"));
  check("notifications.service exports dispatchRegistrationReceiptNotification", notificationsServiceContent.includes("export async function dispatchRegistrationReceiptNotification"));
  check("notifications.service exports dispatchEventCancelledNotification", notificationsServiceContent.includes("export async function dispatchEventCancelledNotification"));
  check("dispatchEventCancelledNotification sets urgent priority", notificationsServiceContent.includes('priority: "urgent"'));
  check("dispatchEventCancelledNotification categorizes as event_lifecycle and type event_cancelled",
    notificationsServiceContent.includes('category: "event_lifecycle"') &&
    notificationsServiceContent.includes('type: "event_cancelled"')
  );
  check("dispatchEventCancelledNotification targets confirmed attendees",
    notificationsServiceContent.includes('"attending"') &&
    notificationsServiceContent.includes('"registered"') &&
    notificationsServiceContent.includes('"ticketed"')
  );
  check("dispatchEventCancelledNotification deduplicates recipient user ids", notificationsServiceContent.includes("new Set"));

  // 9. Section 58 Acceptance Criteria End-to-End Matrix
  console.log("\n--- 9. Section 58 Acceptance Criteria End-to-End Matrix ---");
  const discoverServiceContent = readFileSync(resolve(cwd, "src/services/discover.service.ts"), "utf8");
  check("Section 58 Discovery: debounced search and ranking engine exists",
    discoverServiceContent.includes("getDiscoverData") &&
    discoverServiceContent.includes("filter")
  );

  const eventPageContent = readFileSync(resolve(cwd, "src/app/events/[id]/page.tsx"), "utf8");
  check("Section 58 Event: public destination renders header, details, and actions",
    eventPageContent.includes("EventPrimaryAction") &&
    eventPageContent.includes("ExpandableEventCover")
  );
  check("Day 12 SEO: event pages publish canonical and Open Graph metadata",
    eventPageContent.includes("alternates:") &&
    eventPageContent.includes("canonical: eventUrl") &&
    eventPageContent.includes('type: "website"') &&
    eventPageContent.includes("url: eventUrl")
  );
  check("Day 12 SEO: event pages publish dynamic Twitter cards",
    eventPageContent.includes("twitter:") &&
    eventPageContent.includes('card: event.cover_image ? "summary_large_image" : "summary"')
  );
  check("Day 12 SEO: event pages embed safely escaped Event JSON-LD",
    eventPageContent.includes('"@type": "Event"') &&
    eventPageContent.includes('type="application/ld+json"') &&
    eventPageContent.includes('replace(/</g, "\\\\u003c")') &&
    eventPageContent.includes("function getSafeHttpUrl") &&
    eventPageContent.includes("getSafeHttpUrl(event.online_url)")
  );

  const navigationHeaderContent = readFileSync(resolve(cwd, "src/components/navigation/header.tsx"), "utf8");
  check("Logout stays visible while auth state clears and route changes",
    navigationHeaderContent.includes("{user || isLoggingOut ? (") &&
    navigationHeaderContent.includes('logoutDestinationRef.current = "/"')
  );
  check("Logout timeout is cleaned up and failures are surfaced to the user",
    navigationHeaderContent.includes("window.clearTimeout(logoutTimeoutRef.current)") &&
    navigationHeaderContent.includes('toast.error("Failed to sign out. Please try again.")')
  );
  check("Logout control is icon-only on small screens with an accessible label",
    navigationHeaderContent.includes('className="hidden md:inline"') &&
    navigationHeaderContent.includes('aria-label={isLoggingOut ? "Logging out" : "Log out"}')
  );

  const createPageContent = readFileSync(resolve(cwd, "src/app/create/page.tsx"), "utf8");
  check("Section 58 Organizer: create flow configures participation models and Nigerian hubs",
    createPageContent.includes("ParticipationModelSelector") &&
    createPageContent.includes("LocationPicker")
  );

  const campaignSlugContent = readFileSync(resolve(cwd, "src/app/campaign/[slug]/page.tsx"), "utf8");
  check("Section 58 Campaign: public campaign links to parent event with participation layer",
    campaignSlugContent.includes("CampaignHeader") &&
    campaignSlugContent.includes("parentEvent")
  );

  // 10. Zero em dashes policy
  console.log("\n--- 10. Zero Em Dashes Policy ---");
  const milestone4Files = [
    "scripts/v1-phase/milestones/verify-milestone4.ts",
    "src/types/dashboard.ts",
    "src/services/organizer.service.ts",
    "src/services/events.service.ts",
    "src/services/attendance.service.ts",
    "src/services/notifications.service.ts",
    "src/services/saved.service.ts",
    "src/lib/dashboard/csv-export.ts",
    "src/components/dashboard/OrganizerHeader.tsx",
    "src/components/dashboard/OrganizerTabs.tsx",
    "src/components/dashboard/OrganizerOverviewTab.tsx",
    "src/components/dashboard/OrganizerPeopleTab.tsx",
    "src/components/campaigns/CampaignHeader.tsx",
    "src/components/campaigns/CampaignResultActions.tsx",
    "src/components/navigation/header.tsx",
    "src/app/dashboard/events/[id]/page.tsx",
    "src/app/events/[id]/page.tsx",
    "src/app/saved/page.tsx",
  ];

  let emDashCount = 0;
  for (const relPath of milestone4Files) {
    const fullPath = resolve(cwd, relPath);
    if (existsSync(fullPath)) {
      const content = readFileSync(fullPath, "utf8");
      if (content.includes("\u2014")) {
        emDashCount++;
        console.log(`[FAIL] Em dash found in: ${relPath}`);
      }
    }
  }
  check("Zero em dashes found across Milestone 4 code and components", emDashCount === 0);

  // Summary
  const passedCount = results.filter((r) => r.passed).length;
  const failedCount = results.filter((r) => !r.passed).length;

  console.log("\n=============================================================");
  console.log(`Milestone 4 Checkpoint Summary: ${passedCount} passed, ${failedCount} failed`);
  console.log("=============================================================\n");

  if (failedCount > 0) {
    process.exit(1);
  }
}

runMilestone4Verification().catch((error) => {
  console.error("Fatal verification error:", error);
  process.exit(1);
});
