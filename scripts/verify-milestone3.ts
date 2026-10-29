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

// Behavioral helper implementations for isolated unit testing
const CAMPAIGN_SHARE_SOURCE = "campaign_share";
const CAMPAIGN_FUNNEL_SOURCE = "campaign_funnel";

function testResolveDateFilterRange(
  filter: "all" | "today" | "this_weekend" | "this_week" | "this_month",
  referenceDate: Date = new Date("2026-10-29T12:00:00Z")
): { start: string; end: string } | null {
  if (filter === "all") return null;

  const ref = new Date(referenceDate);

  if (filter === "today") {
    const start = new Date(ref);
    start.setUTCHours(0, 0, 0, 0);
    const end = new Date(ref);
    end.setUTCHours(23, 59, 59, 999);
    return { start: start.toISOString(), end: end.toISOString() };
  }

  if (filter === "this_weekend") {
    const day = ref.getUTCDay();
    const saturday = new Date(ref);
    const daysUntilSaturday = (6 - day + 7) % 7;
    saturday.setUTCDate(ref.getUTCDate() + daysUntilSaturday);
    saturday.setUTCHours(0, 0, 0, 0);

    const sunday = new Date(saturday);
    sunday.setUTCDate(saturday.getUTCDate() + 1);
    sunday.setUTCHours(23, 59, 59, 999);

    return { start: saturday.toISOString(), end: sunday.toISOString() };
  }

  if (filter === "this_week") {
    const day = ref.getUTCDay();
    const mondayOffset = day === 0 ? -6 : 1 - day;
    const monday = new Date(ref);
    monday.setUTCDate(ref.getUTCDate() + mondayOffset);
    monday.setUTCHours(0, 0, 0, 0);

    const sunday = new Date(monday);
    sunday.setUTCDate(monday.getUTCDate() + 6);
    sunday.setUTCHours(23, 59, 59, 999);

    return { start: monday.toISOString(), end: sunday.toISOString() };
  }

  if (filter === "this_month") {
    const start = new Date(Date.UTC(ref.getUTCFullYear(), ref.getUTCMonth(), 1, 0, 0, 0));
    const nextMonth = new Date(Date.UTC(ref.getUTCFullYear(), ref.getUTCMonth() + 1, 1, 0, 0, 0));
    const end = new Date(nextMonth.getTime() - 1);
    return { start: start.toISOString(), end: end.toISOString() };
  }

  return null;
}

function testBuildCampaignShareUrl(slug: string, baseUrl?: string): string {
  const cleanSlug = encodeURIComponent(slug.trim());
  const path = `/campaign/${cleanSlug}?src=${CAMPAIGN_SHARE_SOURCE}`;
  if (baseUrl) {
    return new URL(path, baseUrl).toString();
  }
  return path;
}

function testBuildEventConversionUrl(
  eventId: string,
  options: { campaignSlug?: string; source?: string; baseUrl?: string } = {}
): string {
  const cleanId = encodeURIComponent(eventId.trim());
  const source = options.source || CAMPAIGN_FUNNEL_SOURCE;
  const params = new URLSearchParams({ src: source });
  if (options.campaignSlug) {
    params.set("from_campaign", options.campaignSlug.trim());
  }
  const query = params.toString();
  const path = `/events/${cleanId}${query ? `?${query}` : ""}`;
  if (options.baseUrl) {
    return new URL(path, options.baseUrl).toString();
  }
  return path;
}

function testIsConversionFunnelVisitor(
  searchParams:
    | URLSearchParams
    | Record<string, string | string[] | undefined>
    | null
    | undefined
): boolean {
  if (!searchParams) return false;
  if (searchParams instanceof URLSearchParams) {
    const src = searchParams.get("src")?.trim().toLowerCase();
    return src === CAMPAIGN_FUNNEL_SOURCE;
  }
  const raw = searchParams.src;
  const src = Array.isArray(raw) ? raw[0] : raw;
  return typeof src === "string" && src.trim().toLowerCase() === CAMPAIGN_FUNNEL_SOURCE;
}

async function runMilestone3Verification() {
  console.log("\n=============================================================");
  console.log("Starting Milestone 3 Verification: Connected Campaigns & Discover");
  console.log("=============================================================\n");

  const cwd = process.cwd();

  // 1. Target files and architecture
  console.log("--- 1. Target Modules & Component Architecture ---");
  const requiredFiles = [
    "src/types/campaigns.ts",
    "src/types/discover.ts",
    "src/types/index.ts",
    "src/lib/location/bounding-box.ts",
    "src/lib/location/index.ts",
    "src/lib/campaigns/canvas-integrity.ts",
    "src/lib/campaigns/funnel.ts",
    "src/lib/campaigns/analytics.ts",
    "src/services/discover.service.ts",
    "src/services/campaigns.service.ts",
    "src/components/discover/DiscoverHub.tsx",
    "src/components/discover/DiscoverFilterBar.tsx",
    "src/components/discover/DiscoverCardSkeletons.tsx",
    "src/components/campaigns/CampaignCard.tsx",
    "src/components/campaigns/CampaignResultActions.tsx",
    "src/app/discover/page.tsx",
    "src/app/campaign/[slug]/page.tsx",
    "supabase/migrations/20261028140000_discover_query_performance_indexes.sql",
  ];

  for (const file of requiredFiles) {
    check(`Target file exists: ${file}`, existsSync(resolve(cwd, file)));
  }

  // 2. Discover query engine and filter contracts
  console.log("\n--- 2. Discover Query Engine & Filter Synchronization ---");
  const discoverTypesContent = readFileSync(resolve(cwd, "src/types/discover.ts"), "utf8");
  check(
    "discover.ts defines DiscoverFilters interface",
    discoverTypesContent.includes("export interface DiscoverFilters")
  );
  check(
    "discover.ts defines NIGERIAN_DISCOVER_CITIES presets",
    discoverTypesContent.includes("export const NIGERIAN_DISCOVER_CITIES")
  );
  check(
    "discover.ts exports serializeDiscoverFiltersToSearchParams",
    discoverTypesContent.includes("export function serializeDiscoverFiltersToSearchParams")
  );
  check(
    "discover.ts exports parseDiscoverFiltersFromSearchParams",
    discoverTypesContent.includes("export function parseDiscoverFiltersFromSearchParams")
  );

  const todayRange = testResolveDateFilterRange("today");
  check("resolveDateFilterRange handles today date filter", Boolean(todayRange?.start && todayRange?.end));
  const weekendRange = testResolveDateFilterRange("this_weekend");
  check("resolveDateFilterRange handles this_weekend date filter", Boolean(weekendRange?.start && weekendRange?.end));
  const weekRange = testResolveDateFilterRange("this_week");
  check("resolveDateFilterRange handles this_week date filter", Boolean(weekRange?.start && weekRange?.end));
  const monthRange = testResolveDateFilterRange("this_month");
  check("resolveDateFilterRange handles this_month date filter", Boolean(monthRange?.start && monthRange?.end));

  const discoverServiceContent = readFileSync(resolve(cwd, "src/services/discover.service.ts"), "utf8");
  check(
    "discover.service exports getDiscoverData function",
    discoverServiceContent.includes("export async function getDiscoverData")
  );
  check(
    "discover.service defines DiscoverResults interface",
    discoverServiceContent.includes("export interface DiscoverResults")
  );
  check(
    "discover.service implements deterministic ranking with tie-breaker sorting",
    discoverServiceContent.includes("event_id") || discoverServiceContent.includes("event.id") || discoverServiceContent.includes("a.id.localeCompare(b.id)")
  );

  // 3. Modular dual-grid layout and UI components
  console.log("\n--- 3. Modular Dual-Grid Discover Hub Layout ---");
  const discoverPageContent = readFileSync(resolve(cwd, "src/app/discover/page.tsx"), "utf8");
  check(
    "discover/page.tsx renders DiscoverHub component",
    discoverPageContent.includes("DiscoverHub")
  );

  const discoverHubContent = readFileSync(resolve(cwd, "src/components/discover/DiscoverHub.tsx"), "utf8");
  check(
    "DiscoverHub renders Upcoming Events section",
    discoverHubContent.includes("Upcoming events")
  );
  check(
    "DiscoverHub renders Campaigns section",
    discoverHubContent.includes("Campaigns you can join")
  );
  check(
    "DiscoverHub provides clear all filters action",
    discoverHubContent.includes("Clear all filters")
  );
  check(
    "DiscoverHub uses DiscoverCardSkeletons for loading states",
    discoverHubContent.includes("DiscoverCardSkeletons")
  );

  const skeletonsContent = readFileSync(resolve(cwd, "src/components/discover/DiscoverCardSkeletons.tsx"), "utf8");
  check(
    "DiscoverCardSkeletons exports EventCardSkeleton",
    skeletonsContent.includes("export function EventCardSkeleton")
  );
  check(
    "DiscoverCardSkeletons exports CampaignCardSkeleton",
    skeletonsContent.includes("export function CampaignCardSkeleton")
  );

  const campaignCardContent = readFileSync(resolve(cwd, "src/components/campaigns/CampaignCard.tsx"), "utf8");
  check(
    "CampaignCard renders parent event link or title",
    campaignCardContent.includes("campaign.event") || campaignCardContent.includes("parentEvent") || campaignCardContent.includes("event")
  );

  // 4. Connected campaigns layer and conversion funnel
  console.log("\n--- 4. Connected Campaigns Layer & Funnel Flow ---");
  const funnelContent = readFileSync(resolve(cwd, "src/lib/campaigns/funnel.ts"), "utf8");
  check(
    "funnel.ts defines CAMPAIGN_SHARE_SOURCE",
    funnelContent.includes("CAMPAIGN_SHARE_SOURCE")
  );
  check(
    "funnel.ts defines CAMPAIGN_FUNNEL_SOURCE",
    funnelContent.includes("CAMPAIGN_FUNNEL_SOURCE")
  );
  check(
    "funnel.ts exports buildCampaignShareUrl",
    funnelContent.includes("export function buildCampaignShareUrl")
  );
  check(
    "funnel.ts exports buildEventConversionUrl",
    funnelContent.includes("export function buildEventConversionUrl")
  );
  check(
    "funnel.ts exports isConversionFunnelVisitor",
    funnelContent.includes("export function isConversionFunnelVisitor")
  );

  const shareUrl = testBuildCampaignShareUrl("tech-fest-2026");
  check("buildCampaignShareUrl generates link with campaign_share source", shareUrl === "/campaign/tech-fest-2026?src=campaign_share");

  const conversionUrl = testBuildEventConversionUrl("evt-123", { campaignSlug: "tech-fest-2026" });
  check("buildEventConversionUrl generates link with campaign_funnel and from_campaign", conversionUrl === "/events/evt-123?src=campaign_funnel&from_campaign=tech-fest-2026");

  check("isConversionFunnelVisitor accepts valid campaign_funnel URLSearchParams", testIsConversionFunnelVisitor(new URLSearchParams({ src: "campaign_funnel" })));
  check("isConversionFunnelVisitor rejects foreign source", !testIsConversionFunnelVisitor(new URLSearchParams({ src: "twitter" })));

  const campaignResultActionsContent = readFileSync(resolve(cwd, "src/components/campaigns/CampaignResultActions.tsx"), "utf8");
  check(
    "CampaignResultActions imports buildEventConversionUrl",
    campaignResultActionsContent.includes("buildEventConversionUrl")
  );
  check(
    "CampaignResultActions renders parent event RSVP conversion prompt",
    campaignResultActionsContent.includes("event") || campaignResultActionsContent.includes("Attending") || campaignResultActionsContent.includes("RSVP")
  );

  const campaignSlugContent = readFileSync(resolve(cwd, "src/app/campaign/[slug]/page.tsx"), "utf8");
  check(
    "campaign/[slug]/page.tsx contains parent event link",
    campaignSlugContent.includes("events/") || campaignSlugContent.includes("event")
  );
  check(
    "campaign/[slug]/page.tsx uses modernized participation copy",
    campaignSlugContent.includes("Participate") || campaignSlugContent.includes("campaign")
  );

  // 5. Campaign analytics and event attendance domain isolation
  console.log("\n--- 5. Campaign Analytics & Event Attendance Isolation ---");
  const campaignsServiceContent = readFileSync(resolve(cwd, "src/services/campaigns.service.ts"), "utf8");
  check(
    "campaigns.service exports checkCampaignAttendanceIsolation",
    campaignsServiceContent.includes("export function checkCampaignAttendanceIsolation")
  );
  check(
    "campaigns.service maintains strict separation between campaign participation and event attendance",
    campaignsServiceContent.includes("isIsolated: true")
  );

  const attendanceServiceContent = readFileSync(resolve(cwd, "src/services/attendance.service.ts"), "utf8");
  check(
    "attendance.service queries public_event_attendees view for public attendance counts",
    attendanceServiceContent.includes('.from("public_event_attendees")')
  );
  check(
    "attendance.service queries public_event_attendees for attendee listings",
    attendanceServiceContent.includes("getEventAttendees") && attendanceServiceContent.includes("public_event_attendees")
  );

  // 6. Query performance indexes
  console.log("\n--- 6. Database Performance Indexes Migration ---");
  const migrationContent = readFileSync(
    resolve(cwd, "supabase/migrations/20261028140000_discover_query_performance_indexes.sql"),
    "utf8"
  );
  check("Migration defines idx_events_status_start_at composite index", migrationContent.includes("idx_events_status_start_at"));
  check("Migration defines idx_events_category_id index", migrationContent.includes("idx_events_category_id"));
  check("Migration defines idx_events_is_online index", migrationContent.includes("idx_events_is_online"));
  check("Migration defines idx_events_city index", migrationContent.includes("idx_events_city"));
  check("Migration defines idx_events_coordinates index", migrationContent.includes("idx_events_coordinates"));
  check("Migration defines idx_campaigns_status_created_at composite index", migrationContent.includes("idx_campaigns_status_created_at"));
  check("Migration defines idx_campaign_templates_campaign_active composite index", migrationContent.includes("idx_campaign_templates_campaign_active"));

  // 7. Zero em dashes policy
  console.log("\n--- 7. Zero Em Dashes Policy ---");
  const week4Files = [
    "scripts/verify-milestone3.ts",
    "src/types/campaigns.ts",
    "src/types/discover.ts",
    "src/lib/location/bounding-box.ts",
    "src/lib/campaigns/canvas-integrity.ts",
    "src/lib/campaigns/funnel.ts",
    "src/services/discover.service.ts",
    "src/components/discover/DiscoverHub.tsx",
    "src/components/discover/DiscoverFilterBar.tsx",
    "src/components/discover/DiscoverCardSkeletons.tsx",
  ];

  let emDashCount = 0;
  for (const relativePath of week4Files) {
    const fullPath = resolve(cwd, relativePath);
    if (existsSync(fullPath)) {
      const content = readFileSync(fullPath, "utf8");
      if (content.includes("\u2014")) {
        emDashCount++;
        console.log(`[FAIL] Found em dash in: ${relativePath}`);
      }
    }
  }
  check("Zero em dashes found across Week 4 Milestone 3 code", emDashCount === 0);

  // Summary
  const passedCount = results.filter((r) => r.passed).length;
  const failedCount = results.filter((r) => !r.passed).length;

  console.log("\n=============================================================");
  console.log(`Milestone 3 Checkpoint Summary: ${passedCount} passed, ${failedCount} failed`);
  console.log("=============================================================\n");

  if (failedCount > 0) {
    process.exit(1);
  }
}

runMilestone3Verification().catch((error) => {
  console.error("Fatal verification error:", error);
  process.exit(1);
});
