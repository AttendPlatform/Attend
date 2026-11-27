import { existsSync, readFileSync } from "node:fs";
import * as nodeModule from "node:module";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import type * as PromotionsValidationModule from "../../../src/lib/validations/promotions";
import type {
  FeaturedEventWithEvent,
  PromotionalBannerRecord,
} from "../../../src/types/promotions";

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

function makeFeaturedItem(
  overrides: Partial<FeaturedEventWithEvent> = {}
): FeaturedEventWithEvent {
  return {
    id: "feat-1",
    event_id: "00000000-0000-4000-8000-000000000001",
    priority: "standard",
    promotional_message: "Featured event spotlight",
    promotional_image_url: null,
    target_audience: {},
    notification_channels: ["in_app", "push"],
    notification_mode: "platform_only",
    scheduled_notification_at: null,
    start_at: new Date(Date.now() - 3600_000).toISOString(),
    end_at: new Date(Date.now() + 86_400_000).toISOString(),
    status: "active",
    views_count: 0,
    clicks_count: 0,
    saves_count: 0,
    registrations_count: 0,
    created_by: "admin-1",
    created_at: "2026-11-20T10:00:00.000Z",
    updated_at: "2026-11-20T10:00:00.000Z",
    event: {
      id: "00000000-0000-4000-8000-000000000001",
      title: "Sample Event",
      slug: "sample-event",
      description: "Event description",
      cover_image: "https://cdn.example.com/cover.jpg",
      start_at: new Date(Date.now() + 172_800_000).toISOString(),
      end_at: null,
      city: "Lagos",
      state: "Lagos",
      venue_name: "Landmark Centre",
      is_online: false,
      category_id: "cat-music",
      participant_count: 25,
      status: "published",
      category_name: "Music",
    },
    ...overrides,
  };
}

function makeBanner(
  overrides: Partial<PromotionalBannerRecord> = {}
): PromotionalBannerRecord {
  return {
    id: "banner-1",
    title: "Weekend Showcase",
    description: "Explore top events near you",
    image_url: "https://cdn.example.com/fallback.jpg",
    mobile_image_url: "https://cdn.example.com/mobile.jpg",
    desktop_image_url: "https://cdn.example.com/desktop.jpg",
    cta_label: "Explore",
    destination_url: "/discover",
    placement: "both",
    slot_type: "hero",
    priority: 10,
    targeting_rules: {},
    start_at: new Date(Date.now() - 3600_000).toISOString(),
    end_at: new Date(Date.now() + 86_400_000).toISOString(),
    status: "published",
    impressions_count: 0,
    clicks_count: 0,
    created_by: "admin-1",
    created_at: "2026-11-20T10:00:00.000Z",
    updated_at: "2026-11-20T10:00:00.000Z",
    ...overrides,
  };
}

async function runWeek2Day6To8Verification() {
  console.log("\n=============================================================");
  console.log("Starting Smart Notifications Week 2 Days 6-8 Verification");
  console.log("Scope: Featured Events, Banners, Decoupled Analytics & Admin");
  console.log("=============================================================\n");

  const cwd = process.cwd();

  const files = {
    featuredRpcMigration: resolve(
      cwd,
      "supabase/migrations/20261127100000_promotions_featured_metric_rpc.sql"
    ),
    bannerRpcMigration: resolve(
      cwd,
      "supabase/migrations/20261127110000_banner_interaction_rpc.sql"
    ),
    templatesRlsMigration: resolve(
      cwd,
      "supabase/migrations/20261127120000_notification_templates_admin_rls.sql"
    ),
    validations: resolve(cwd, "src/lib/validations/promotions.ts"),
    service: resolve(cwd, "src/services/promotions.service.ts"),
    actions: resolve(cwd, "src/app/actions/promotions.ts"),
    adminPage: resolve(cwd, "src/app/admin/promotions/page.tsx"),
    adminConsole: resolve(cwd, "src/components/admin/AdminPromotionsConsole.tsx"),
    featuredManager: resolve(cwd, "src/components/admin/FeaturedEventsManager.tsx"),
    bannerManager: resolve(cwd, "src/components/admin/BannerManagementTab.tsx"),
    controlsTab: resolve(
      cwd,
      "src/components/admin/AdminControlsAndBroadcastTab.tsx"
    ),
    adminIndex: resolve(cwd, "src/components/admin/index.ts"),
    featuredSection: resolve(cwd, "src/components/home/FeaturedEventsSection.tsx"),
    bannerSlot: resolve(cwd, "src/components/home/PromotionalBannerSlot.tsx"),
    homeIndex: resolve(cwd, "src/components/home/index.ts"),
    homePage: resolve(cwd, "src/app/page.tsx"),
    discoverPage: resolve(cwd, "src/app/discover/page.tsx"),
    discoverHub: resolve(cwd, "src/components/discover/DiscoverHub.tsx"),
    dbTypes: resolve(cwd, "src/lib/supabase/database.types.ts"),
    campaignAnalytics: resolve(cwd, "src/lib/campaigns/analytics.ts"),
  };

  console.log("--- 1. Target Files & Exports ---");
  for (const [label, filePath] of Object.entries(files)) {
    check(`File exists (${label})`, existsSync(filePath));
  }

  console.log("\n--- 2. SQL Migrations, RLS & Decoupled Analytics ---");
  const featuredRpcSql = readFileSync(files.featuredRpcMigration, "utf8");
  const bannerRpcSql = readFileSync(files.bannerRpcMigration, "utf8");
  const templatesRlsSql = readFileSync(files.templatesRlsMigration, "utf8");
  const dbTypesContent = readFileSync(files.dbTypes, "utf8");
  const campaignAnalyticsContent = readFileSync(files.campaignAnalytics, "utf8");

  check(
    "record_featured_event_metric RPC supports view, click, save, registration",
    featuredRpcSql.includes("CREATE OR REPLACE FUNCTION public.record_featured_event_metric") &&
      featuredRpcSql.includes("'view', 'click', 'save', 'registration'") &&
      featuredRpcSql.includes("SECURITY DEFINER")
  );
  check(
    "record_banner_interaction RPC logs to banner_analytics and promotional_banners only",
    bannerRpcSql.includes("CREATE OR REPLACE FUNCTION public.record_banner_interaction") &&
      bannerRpcSql.includes("INSERT INTO public.banner_analytics") &&
      bannerRpcSql.includes("UPDATE public.promotional_banners") &&
      !bannerRpcSql.includes("campaign_analytics") &&
      !bannerRpcSql.includes("INSERT INTO public.notifications")
  );
  check(
    "notification_templates enables RLS with platform-admin management policy",
    templatesRlsSql.includes("ENABLE ROW LEVEL SECURITY") &&
      templatesRlsSql.includes("public.is_platform_admin()")
  );
  check(
    "database.types.ts exposes record_featured_event_metric and record_banner_interaction",
    dbTypesContent.includes("record_featured_event_metric:") &&
      dbTypesContent.includes("record_banner_interaction:")
  );
  check(
    "Campaign analytics track_campaign_event remains untouched",
    campaignAnalyticsContent.includes("track_campaign_event") &&
      dbTypesContent.includes("track_campaign_event:")
  );

  console.log("\n--- 3. Service, Actions, Admin Protection & Integrations ---");
  const serviceContent = readFileSync(files.service, "utf8");
  const actionsContent = readFileSync(files.actions, "utf8");
  const adminPageContent = readFileSync(files.adminPage, "utf8");
  const consoleContent = readFileSync(files.adminConsole, "utf8");
  const bannerSlotContent = readFileSync(files.bannerSlot, "utf8");
  const homePageContent = readFileSync(files.homePage, "utf8");
  const discoverPageContent = readFileSync(files.discoverPage, "utf8");
  const discoverHubContent = readFileSync(files.discoverHub, "utf8");

  check(
    "promotions.service enforces requirePlatformAdmin and records admin_audit_logs",
    serviceContent.includes("requirePlatformAdmin()") &&
      serviceContent.includes("recordAdminAuditLog") &&
      serviceContent.includes("RECIPIENT_CHUNK_SIZE = 100")
  );
  check(
    "dispatchFeaturedEventCampaign skips platform_only and dispatches visual notifications",
    serviceContent.includes('row.notification_mode === "platform_only"') &&
      serviceContent.includes("dispatchVisualEventNotification") &&
      serviceContent.includes("Featured on Attend")
  );
  check(
    "promotions actions export featured, banner, settings, template, and broadcast handlers",
    [
      "featureEventAction",
      "removeFeaturedEventAction",
      "dispatchFeaturedEventCampaignAction",
      "createPromotionalBannerAction",
      "updatePromotionalBannerAction",
      "updateBannerStatusAction",
      "trackBannerImpressionAction",
      "trackBannerClickAction",
      "updateAdminNotificationSettingsAction",
      "updateNotificationTemplateAction",
      "dispatchAdminBroadcastAction",
    ].every((fn) => actionsContent.includes(`export async function ${fn}`))
  );
  check(
    "/admin/promotions page enforces requirePlatformAdmin and handles 401/403",
    adminPageContent.includes("requirePlatformAdmin()") &&
      adminPageContent.includes("PlatformAdminError") &&
      adminPageContent.includes("/login?next=/admin/promotions")
  );
  check(
    "AdminPromotionsConsole renders all 4 required tabs",
    consoleContent.includes("Featured Events") &&
      consoleContent.includes("Promotional Banners") &&
      consoleContent.includes("Recovery & Social Controls") &&
      consoleContent.includes("Broadcasts & Analytics")
  );
  check(
    "PromotionalBannerSlot renders responsive <picture>, session cap, and dismiss control",
    bannerSlotContent.includes("<picture>") &&
      bannerSlotContent.includes("(min-width: 768px)") &&
      bannerSlotContent.includes("sessionViewCap") &&
      bannerSlotContent.includes("Dismiss promotional banner")
  );
  check(
    "Home and Discover integrate FeaturedEventsSection and PromotionalBannerSlot",
    homePageContent.includes("FeaturedEventsSection") &&
      homePageContent.includes("PromotionalBannerSlot") &&
      discoverPageContent.includes("getActiveFeaturedEvents") &&
      discoverPageContent.includes("getActiveBannersForPlacement") &&
      discoverHubContent.includes("FeaturedEventsSection") &&
      discoverHubContent.includes("PromotionalBannerSlot")
  );

  console.log("\n--- 4. Behavioral Unit Tests (Validation, Priority, Targeting) ---");
  type ResolveFn = (
    specifier: string,
    context: Record<string, unknown>,
    nextResolve: (s: string, c: Record<string, unknown>) => unknown
  ) => unknown;
  const registerHooksFn = (
    nodeModule as unknown as {
      registerHooks?: (hooks: { resolve: ResolveFn }) => void;
    }
  ).registerHooks;

  registerHooksFn?.({
    resolve(specifier, context, nextResolve) {
      if (specifier.startsWith("@/")) {
        const target = resolve(cwd, "src", `${specifier.slice(2)}.ts`);
        if (existsSync(target)) {
          return { shortCircuit: true, url: pathToFileURL(target).href };
        }
      }
      return nextResolve(specifier, context);
    },
  });

  const validations = (await import(
    pathToFileURL(files.validations).href
  )) as typeof PromotionsValidationModule;

  const sortedFeatured = validations.sortFeaturedEventsByPriority([
    makeFeaturedItem({ id: "std", priority: "standard" }),
    makeFeaturedItem({ id: "camp", priority: "campaign_level" }),
    makeFeaturedItem({ id: "high", priority: "high_priority" }),
  ]);
  check(
    "Featured events sort strictly by campaign_level > high_priority > standard",
    sortedFeatured.map((i) => i.id).join(",") === "camp,high,std"
  );

  const lagosFeatured = makeFeaturedItem({
    target_audience: { cities: ["Lagos"], categories: ["cat-music"] },
  });
  check(
    "Featured audience targeting filters non-matching cities and allows matching city",
    validations.matchesFeaturedAudience(lagosFeatured, { city: "Lagos" }) &&
      !validations.matchesFeaturedAudience(lagosFeatured, { city: "Abuja" })
  );

  const badFeaturedSchedule = validations.featureEventSchema.safeParse({
    eventId: "00000000-0000-4000-8000-000000000001",
    startAt: "2026-12-10T10:00:00.000Z",
    endAt: "2026-12-09T10:00:00.000Z",
  });
  check(
    "featureEventSchema rejects endAt <= startAt",
    !badFeaturedSchedule.success
  );

  check(
    "Destination URL validator allows safe paths/HTTPS and blocks javascript:/http/protocol-relative",
    validations.isSafeBannerDestinationUrl("/discover") &&
      validations.isSafeBannerDestinationUrl("https://attend.app/events") &&
      !validations.isSafeBannerDestinationUrl("javascript:alert(1)") &&
      !validations.isSafeBannerDestinationUrl("//evil.example.com") &&
      !validations.isSafeBannerDestinationUrl("http://insecure.example.com")
  );

  const validBanner = validations.promotionalBannerSchema.safeParse({
    title: "Lagos Tech Week",
    imageUrl: "https://cdn.example.com/banner.jpg",
    mobileImageUrl: "https://cdn.example.com/banner-mobile.jpg",
    desktopImageUrl: "https://cdn.example.com/banner-desktop.jpg",
    destinationUrl: "/discover?city=Lagos",
    placement: "both",
    priority: 5,
    startAt: "2026-11-01T00:00:00.000Z",
    endAt: "2026-12-01T00:00:00.000Z",
    status: "published",
  });
  const invalidBannerSchedule = validations.promotionalBannerSchema.safeParse({
    title: "Invalid Banner",
    imageUrl: "http://insecure.example.com/banner.jpg",
    destinationUrl: "javascript:void(0)",
    placement: "home",
    startAt: "2026-12-01T00:00:00.000Z",
    endAt: "2026-11-01T00:00:00.000Z",
  });
  check(
    "promotionalBannerSchema accepts valid responsive banners and rejects unsafe URLs/schedules",
    validBanner.success && !invalidBannerSchedule.success
  );

  const homeBanner = makeBanner({
    id: "home-only",
    placement: "home",
    priority: 5,
    targeting_rules: { cities: ["Lagos"], authenticated_only: true },
  });
  const expiredBanner = makeBanner({
    id: "expired",
    end_at: new Date(Date.now() - 60_000).toISOString(),
  });
  const pausedBanner = makeBanner({ id: "paused", status: "paused" });

  check(
    "Banner targeting hides expired, paused, wrong-placement, and unauthenticated banners",
    validations.matchesBannerTargeting(homeBanner, "home", {
      city: "Lagos",
      isAuthenticated: true,
    }) &&
      !validations.matchesBannerTargeting(homeBanner, "discover", {
        city: "Lagos",
        isAuthenticated: true,
      }) &&
      !validations.matchesBannerTargeting(homeBanner, "home", {
        city: "Lagos",
        isAuthenticated: false,
      }) &&
      !validations.matchesBannerTargeting(expiredBanner, "home") &&
      !validations.matchesBannerTargeting(pausedBanner, "home")
  );

  const sortedBanners = validations.sortBannersByPriority([
    makeBanner({ id: "low", priority: 1 }),
    makeBanner({ id: "top", priority: 50 }),
    makeBanner({ id: "mid", priority: 10 }),
  ]);
  check(
    "Banners sort by descending numeric priority",
    sortedBanners.map((b) => b.id).join(",") === "top,mid,low"
  );

  const unconfirmedBroadcast = validations.adminBroadcastSchema.safeParse({
    title: "Platform Update",
    message: "New weekend discovery features are live.",
    testPreview: false,
    confirmBroadcast: false,
  });
  const previewBroadcast = validations.adminBroadcastSchema.safeParse({
    title: "Platform Update",
    message: "New weekend discovery features are live.",
    testPreview: true,
    confirmBroadcast: false,
  });
  const confirmedBroadcast = validations.adminBroadcastSchema.safeParse({
    title: "Platform Update",
    message: "New weekend discovery features are live.",
    actionUrl: "/discover",
    testPreview: false,
    confirmBroadcast: true,
  });
  check(
    "adminBroadcastSchema enforces approval confirmation unless testPreview is true",
    !unconfirmedBroadcast.success &&
      previewBroadcast.success &&
      confirmedBroadcast.success
  );

  console.log("\n--- 5. Zero Em Dashes Guardrail ---");
  const allWeek2Files = [
    ...Object.values(files),
    resolve(cwd, "scripts/smart-notifications/week2/verify-sn-w2-d6.ts"),
  ];
  const filesWithEmDash = allWeek2Files.filter((filePath) =>
    readFileSync(filePath, "utf8").includes("\u2014")
  );
  check(
    "Zero em dashes (U+2014) across all Week 2 deliverables",
    filesWithEmDash.length === 0,
    filesWithEmDash.length > 0 ? filesWithEmDash.join(", ") : undefined
  );

  const failed = results.filter((r) => !r.passed);
  console.log("\n=============================================================");
  console.log(
    `Verification Summary: ${results.length - failed.length}/${results.length} passed`
  );
  console.log("=============================================================\n");

  if (failed.length > 0) {
    process.exit(1);
  }
}

runWeek2Day6To8Verification().catch((error) => {
  console.error("Verification crashed:", error);
  process.exit(1);
});
