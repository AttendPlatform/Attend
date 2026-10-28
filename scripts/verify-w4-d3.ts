import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import {
  CAMPAIGN_SHARE_SOURCE,
  CAMPAIGN_FUNNEL_SOURCE,
  buildCampaignShareUrl,
  buildEventConversionUrl,
  isConversionFunnelVisitor,
  parseFunnelSource,
} from "../src/lib/campaigns/funnel.ts";

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

async function runWeek4Day3Verification() {
  console.log("\n=============================================================");
  console.log("Starting Week 4 Day 3 Verification: Funnel Flow & Query Indexing");
  console.log("=============================================================\n");

  const cwd = process.cwd();

  // 1. Target files and barrel exports
  console.log("--- 1. Target Files & Core Modules ---");
  const funnelPath = resolve(cwd, "src/lib/campaigns/funnel.ts");
  const analyticsPath = resolve(cwd, "src/lib/campaigns/analytics.ts");
  const campaignResultActionsPath = resolve(
    cwd,
    "src/components/campaigns/CampaignResultActions.tsx"
  );
  const discoverServicePath = resolve(cwd, "src/services/discover.service.ts");
  const migrationPath = resolve(
    cwd,
    "supabase/migrations/20261028140000_discover_query_performance_indexes.sql"
  );
  const campaignSlugPagePath = resolve(
    cwd,
    "src/app/campaign/[slug]/page.tsx"
  );
  const eventDetailPagePath = resolve(cwd, "src/app/events/[id]/page.tsx");

  check("File exists: src/lib/campaigns/funnel.ts", existsSync(funnelPath));
  check("File exists: src/lib/campaigns/analytics.ts", existsSync(analyticsPath));
  check(
    "File exists: src/components/campaigns/CampaignResultActions.tsx",
    existsSync(campaignResultActionsPath)
  );
  check("File exists: src/services/discover.service.ts", existsSync(discoverServicePath));
  check("File exists: migration 20261028140000", existsSync(migrationPath));

  // 2. Conversion Funnel Routing & Share Link Builders
  console.log("\n--- 2. Conversion Funnel Routing & Link Builders ---");
  const funnelContent = readFileSync(funnelPath, "utf8");

  check(
    "funnel.ts exports CAMPAIGN_SHARE_SOURCE constant",
    funnelContent.includes('export const CAMPAIGN_SHARE_SOURCE = "campaign_share"')
  );
  check(
    "funnel.ts exports CAMPAIGN_FUNNEL_SOURCE constant",
    funnelContent.includes('export const CAMPAIGN_FUNNEL_SOURCE = "campaign_funnel"')
  );
  check(
    "funnel.ts exports buildCampaignShareUrl function",
    funnelContent.includes("export function buildCampaignShareUrl")
  );
  check(
    "funnel.ts exports buildEventConversionUrl function",
    funnelContent.includes("export function buildEventConversionUrl")
  );
  check(
    "funnel.ts exports isConversionFunnelVisitor function",
    funnelContent.includes("export function isConversionFunnelVisitor")
  );
  check(
    "funnel.ts exports parseFunnelSource function",
    funnelContent.includes("export function parseFunnelSource")
  );

  const relativeShareUrl = buildCampaignShareUrl("tech-fest-2026");
  check(
    "buildCampaignShareUrl generates relative link with campaign_share",
    relativeShareUrl.includes("/campaign/tech-fest-2026?src=campaign_share")
  );

  const absoluteShareUrl = buildCampaignShareUrl(
    "lagos-tech-summit",
    "https://attend.ng"
  );
  check(
    "buildCampaignShareUrl handles baseUrl parameter",
    absoluteShareUrl ===
      "https://attend.ng/campaign/lagos-tech-summit?src=campaign_share"
  );

  const conversionUrl = buildEventConversionUrl("evt-999");
  check(
    "buildEventConversionUrl produces event deep link with campaign_funnel",
    conversionUrl.includes("/events/evt-999?src=campaign_funnel")
  );

  const conversionWithSlug = buildEventConversionUrl("evt-999", {
    campaignSlug: "promo-banner",
  });
  check(
    "buildEventConversionUrl attaches optional from_campaign param",
    conversionWithSlug.includes("from_campaign=promo-banner")
  );

  const urlParamsTrue = new URLSearchParams("?src=campaign_funnel");
  check(
    "isConversionFunnelVisitor identifies URLSearchParams campaign_funnel",
    isConversionFunnelVisitor(urlParamsTrue)
  );

  const objParamsTrue = { src: "campaign_funnel" };
  check(
    "isConversionFunnelVisitor identifies record campaign_funnel",
    isConversionFunnelVisitor(objParamsTrue)
  );

  const falseParams = { src: "direct" };
  check(
    "isConversionFunnelVisitor rejects non-funnel source",
    !isConversionFunnelVisitor(falseParams)
  );

  const parsedSource = parseFunnelSource(new URLSearchParams("?src=CAMPAIGN_SHARE"));
  check(
    "parseFunnelSource normalizes uppercase query source",
    parsedSource === "campaign_share"
  );

  // 3. Campaign Result Actions & Conversion Callout
  console.log("\n--- 3. Campaign Result Actions & Parent Conversion Callout ---");
  const actionsContent = readFileSync(campaignResultActionsPath, "utf8");

  check(
    "CampaignResultActions imports buildEventConversionUrl",
    actionsContent.includes("buildEventConversionUrl")
  );
  check(
    "CampaignResultActions links to parent event with conversion tracking",
    actionsContent.includes("href={buildEventConversionUrl(parentEvent.id)}")
  );
  check(
    "CampaignResultActions displays parent event title question",
    actionsContent.includes("Attending {parentEvent.title}?")
  );
  check(
    "CampaignResultActions provides one-click action copy",
    actionsContent.includes("Go to Event Page to RSVP / Get Tickets")
  );

  // 4. Analytics & Native Share Integration
  console.log("\n--- 4. Analytics & Campaign Share Pipeline ---");
  const analyticsContent = readFileSync(analyticsPath, "utf8");

  check(
    "analytics.ts includes campaign_share in VALID_TRAFFIC_SOURCES",
    analyticsContent.includes('"campaign_share"')
  );
  check(
    "getCampaignTrafficSource checks src parameter",
    analyticsContent.includes('params.get("src")') ||
      analyticsContent.includes("params\n        .get(\"src\")")
  );

  const campaignSlugContent = readFileSync(campaignSlugPagePath, "utf8");
  check(
    "campaign page imports buildCampaignShareUrl",
    campaignSlugContent.includes("buildCampaignShareUrl")
  );
  check(
    "campaign page uses buildCampaignShareUrl for web sharing",
    campaignSlugContent.includes("buildCampaignShareUrl(campaign.slug)")
  );
  check(
    "campaign page uses modernized participation copy for share dialog",
    campaignSlugContent.includes("I'm participating with")
  );

  // 5. Public Event Destination Conversion Funnel Welcoming
  console.log("\n--- 5. Public Event Destination Funnel Welcoming ---");
  const eventDetailContent = readFileSync(eventDetailPagePath, "utf8");

  check(
    "events/[id]/page.tsx imports isConversionFunnelVisitor",
    eventDetailContent.includes("isConversionFunnelVisitor")
  );
  check(
    "events/[id]/page.tsx declares searchParams on PageProps",
    eventDetailContent.includes("searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;")
  );
  check(
    "events/[id]/page.tsx checks isFromFunnel status",
    eventDetailContent.includes("const isFromFunnel = isConversionFunnelVisitor(resolvedSearchParams);")
  );
  check(
    "events/[id]/page.tsx renders conversion callout banner when arriving from funnel",
    eventDetailContent.includes("isFromFunnel &&") &&
      eventDetailContent.includes("Personalized your campaign graphic? Secure your official RSVP below to confirm attendance.")
  );

  // 6. Discover Service Query Performance & Indexing
  console.log("\n--- 6. Discover Service Query Performance ---");
  const discoverContent = readFileSync(discoverServicePath, "utf8");

  check(
    "discover.service pushes category_id filter to Supabase eventQuery",
    discoverContent.includes('eventQuery = eventQuery.eq("category_id", filters.categoryId);')
  );
  check(
    "discover.service pushes is_online filter to Supabase eventQuery",
    discoverContent.includes('eventQuery = eventQuery.eq("is_online", filters.isOnline);')
  );
  check(
    "discover.service uses Map lookup for categories",
    discoverContent.includes("const categoryMap = new Map(") &&
      discoverContent.includes("categoryMap.get(")
  );
  check(
    "discover.service uses Map lookup for organizer profiles",
    discoverContent.includes("const profileNameMap = new Map(") &&
      discoverContent.includes("profileNameMap.get(")
  );
  check(
    "discover.service uses Map lookup for campaign templates",
    discoverContent.includes("const templateMap = new Map<string, CampaignTemplatePreview>();") &&
      discoverContent.includes("templateMap.get(")
  );
  check(
    "discover.service safely prunes events with null coordinates when bounding box is active",
    discoverContent.includes("if (event.latitude == null || event.longitude == null) return false;")
  );
  check(
    "discover.service protects against NaN timestamps in date range filter",
    discoverContent.includes("if (Number.isNaN(eventTime)) return false;")
  );
  check(
    "discover.service protects against NaN participant count in popular sorting",
    discoverContent.includes("const aCount = a.participant_count ?? 0;") &&
      discoverContent.includes("const bCount = b.participant_count ?? 0;")
  );
  check(
    "discover.service implements deterministic tie-breaker sorting by event ID",
    discoverContent.includes("return a.id.localeCompare(b.id);")
  );

  // 7. Database Performance Indexes Migration
  console.log("\n--- 7. Database Performance Indexes Migration ---");
  const migrationContent = readFileSync(migrationPath, "utf8");

  check(
    "Migration defines idx_events_status_start_at composite index",
    migrationContent.includes("CREATE INDEX IF NOT EXISTS idx_events_status_start_at ON events(status, start_at);")
  );
  check(
    "Migration defines idx_events_category_id index",
    migrationContent.includes("CREATE INDEX IF NOT EXISTS idx_events_category_id ON events(category_id);")
  );
  check(
    "Migration defines idx_events_is_online index",
    migrationContent.includes("CREATE INDEX IF NOT EXISTS idx_events_is_online ON events(is_online);")
  );
  check(
    "Migration defines idx_events_city index",
    migrationContent.includes("CREATE INDEX IF NOT EXISTS idx_events_city ON events(city);")
  );
  check(
    "Migration defines idx_events_coordinates geospatial index",
    migrationContent.includes("CREATE INDEX IF NOT EXISTS idx_events_coordinates ON events(latitude, longitude)")
  );
  check(
    "Migration defines idx_campaigns_status_created_at composite index",
    migrationContent.includes("CREATE INDEX IF NOT EXISTS idx_campaigns_status_created_at ON campaigns(status, created_at DESC);")
  );
  check(
    "Migration defines idx_campaign_templates_campaign_active composite index",
    migrationContent.includes("CREATE INDEX IF NOT EXISTS idx_campaign_templates_campaign_active ON campaign_templates(campaign_id, is_active, version DESC);")
  );

  // 8. Zero Em Dashes Policy
  console.log("\n--- 8. Zero Em Dashes Policy ---");
  const allTargetFiles = [
    funnelPath,
    analyticsPath,
    campaignResultActionsPath,
    discoverServicePath,
    migrationPath,
    campaignSlugPagePath,
    eventDetailPagePath,
  ];

  let hasEmDash = false;
  for (const file of allTargetFiles) {
    const text = readFileSync(file, "utf8");
    if (text.includes("—") || text.includes("–")) {
      hasEmDash = true;
      console.log(`FAIL: Em dash found in ${file}`);
    }
  }
  check("Zero em dashes found across all Week 4 Day 3 code and migrations", !hasEmDash);

  // Summary
  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;
  console.log("\n=============================================================");
  console.log(`Week 4 Day 3 Checkpoint Summary: ${passed} passed, ${failed} failed`);
  console.log("=============================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runWeek4Day3Verification().catch((err) => {
  console.error("Verification crashed:", err);
  process.exit(1);
});
