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

console.log("\n=============================================================");
console.log("Starting Day 9 Verification: Organizer Shell & Saved Hub");
console.log("=============================================================\n");

// --- 1. Target Files & Component Architecture ---
console.log("--- 1. Target Files & Component Architecture ---");
const targetFiles = [
  "src/services/organizer.service.ts",
  "src/services/index.ts",
  "src/components/dashboard/OrganizerHeader.tsx",
  "src/components/dashboard/OrganizerTabs.tsx",
  "src/components/dashboard/OrganizerOverviewTab.tsx",
  "src/components/dashboard/OrganizerTabPlaceholder.tsx",
  "src/components/dashboard/index.ts",
  "src/app/dashboard/events/[id]/page.tsx",
  "src/app/saved/page.tsx",
];

for (const relPath of targetFiles) {
  const fullPath = resolve(process.cwd(), relPath);
  check(`Target file exists: ${relPath}`, existsSync(fullPath));
}

// --- 2. Organizer Service & Data Contracts ---
console.log("\n--- 2. Organizer Service & Data Contracts ---");
const organizerServiceContent = readFileSync(
  resolve(process.cwd(), "src/services/organizer.service.ts"),
  "utf8"
);
check(
  "organizer.service exports isUserEventOrganizer",
  organizerServiceContent.includes("export async function isUserEventOrganizer")
);
check(
  "organizer.service exports getOrganizerEvent",
  organizerServiceContent.includes("export async function getOrganizerEvent")
);
check(
  "organizer.service exports getOrganizerEventStats",
  organizerServiceContent.includes("export async function getOrganizerEventStats")
);
check(
  "organizer.service exports getOrganizerEventCampaigns",
  organizerServiceContent.includes("export async function getOrganizerEventCampaigns")
);
check(
  "organizer.service checks both events.creator_id and event_organizers table",
  organizerServiceContent.includes("creator_id") &&
    organizerServiceContent.includes("event_organizers")
);

const servicesIndexContent = readFileSync(
  resolve(process.cwd(), "src/services/index.ts"),
  "utf8"
);
check(
  "services barrel exports organizer.service",
  servicesIndexContent.includes("./organizer.service")
);

// --- 3. Organizer Shell & Navigation Components ---
console.log("\n--- 3. Organizer Shell & Navigation Components ---");
const headerContent = readFileSync(
  resolve(process.cwd(), "src/components/dashboard/OrganizerHeader.tsx"),
  "utf8"
);
check(
  "OrganizerHeader renders event title and status badge",
  headerContent.includes("title") && headerContent.includes("status")
);
check(
  "OrganizerHeader supports Draft, Published, and Cancelled status badges",
  headerContent.includes("published") &&
    headerContent.includes("draft") &&
    headerContent.includes("cancelled")
);
check(
  "OrganizerHeader contains public event link",
  headerContent.includes("/events/")
);

const tabsContent = readFileSync(
  resolve(process.cwd(), "src/components/dashboard/OrganizerTabs.tsx"),
  "utf8"
);
check(
  "OrganizerTabs supports 4 tabs: Overview, People, Campaigns, Settings",
  tabsContent.includes("overview") &&
    tabsContent.includes("people") &&
    tabsContent.includes("campaigns") &&
    tabsContent.includes("settings")
);

const overviewContent = readFileSync(
  resolve(process.cwd(), "src/components/dashboard/OrganizerOverviewTab.tsx"),
  "utf8"
);
check(
  "OrganizerOverviewTab renders Total Attendees stat",
  overviewContent.includes("Total Attendees")
);
check(
  "OrganizerOverviewTab renders Total Registrations stat",
  overviewContent.includes("Total Registrations")
);
check(
  "OrganizerOverviewTab renders Connected Campaigns stat",
  overviewContent.includes("Connected Campaigns")
);
check(
  "OrganizerOverviewTab renders Total DP Generations stat",
  overviewContent.includes("Total DP Generations")
);
check(
  "OrganizerOverviewTab provides quick action links",
  overviewContent.includes("Quick Actions") &&
    overviewContent.includes("Manage Campaigns") &&
    overviewContent.includes("View Attendees")
);

const dashboardIndexContent = readFileSync(
  resolve(process.cwd(), "src/components/dashboard/index.ts"),
  "utf8"
);
check(
  "dashboard barrel re-exports organizer components",
  dashboardIndexContent.includes("OrganizerHeader") &&
    dashboardIndexContent.includes("OrganizerTabs") &&
    dashboardIndexContent.includes("OrganizerOverviewTab")
);

// --- 4. Event Organizer Page Authorization & Tab Resolution ---
console.log("\n--- 4. Event Organizer Page Authorization & Tab Resolution ---");
const dashboardPageContent = readFileSync(
  resolve(process.cwd(), "src/app/dashboard/events/[id]/page.tsx"),
  "utf8"
);
check(
  "dashboard/events/[id] checks user authentication",
  dashboardPageContent.includes("auth.getUser") &&
    dashboardPageContent.includes("redirect(`/login")
);
check(
  "dashboard/events/[id] enforces organizer authorization check",
  dashboardPageContent.includes("isUserEventOrganizer")
);
check(
  "dashboard/events/[id] redirects unauthorized users",
  dashboardPageContent.includes("redirect(`/events/${id}`)")
);
check(
  "dashboard/events/[id] reads active tab from searchParams",
  dashboardPageContent.includes("searchParams") &&
    dashboardPageContent.includes("activeTab")
);

// --- 5. Saved Hub Dual Tabs & Empty States ---
console.log("\n--- 5. Saved Hub Dual Tabs & Empty States ---");
const savedPageContent = readFileSync(
  resolve(process.cwd(), "src/app/saved/page.tsx"),
  "utf8"
);
check(
  "saved/page.tsx enforces user authentication",
  savedPageContent.includes("auth.getUser") &&
    savedPageContent.includes("redirect(`/login")
);
check(
  "saved/page.tsx fetches saved events and campaigns",
  savedPageContent.includes("getSavedEvents") &&
    savedPageContent.includes("getSavedCampaigns")
);
check(
  "saved/page.tsx renders dual tabs switcher",
  savedPageContent.includes("/saved?tab=events") &&
    savedPageContent.includes("/saved?tab=campaigns")
);
check(
  "saved/page.tsx renders EventCard for saved events",
  savedPageContent.includes("EventCard")
);
check(
  "saved/page.tsx renders CampaignCard for saved campaigns",
  savedPageContent.includes("CampaignCard")
);
check(
  "saved/page.tsx provides explore link in empty states",
  savedPageContent.includes('href="/discover"')
);

// --- 6. Zero Em Dashes Policy ---
console.log("\n--- 6. Zero Em Dashes Policy ---");
const filesToCheck = [
  "src/services/organizer.service.ts",
  "src/components/dashboard/OrganizerHeader.tsx",
  "src/components/dashboard/OrganizerTabs.tsx",
  "src/components/dashboard/OrganizerOverviewTab.tsx",
  "src/components/dashboard/OrganizerTabPlaceholder.tsx",
  "src/app/dashboard/events/[id]/page.tsx",
  "src/app/saved/page.tsx",
];

let emDashFound = false;
for (const relPath of filesToCheck) {
  const content = readFileSync(resolve(process.cwd(), relPath), "utf8");
  if (content.includes("—") || content.includes("\u2014")) {
    emDashFound = true;
    console.error(`Em dash found in ${relPath}`);
  }
}
check("Zero em dashes found across all Day 9 code", !emDashFound);

// --- Summary ---
const failed = results.filter((r) => !r.passed);
console.log("\n=============================================================");
console.log(
  `Day 9 Checkpoint Summary: ${results.length - failed.length} passed, ${failed.length} failed`
);
console.log("=============================================================\n");

if (failed.length > 0) {
  process.exit(1);
}
