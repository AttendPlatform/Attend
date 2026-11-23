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

async function runWeek2Day5Verification() {
  console.log("\n=============================================================");
  console.log("Starting Smart Notifications Week 2 Day 5 Verification");
  console.log("Scope: Platform-Admin Auth, Promotions Schema & Contracts");
  console.log("=============================================================\n");

  const cwd = process.cwd();

  const migrationPath = resolve(
    cwd,
    "supabase/migrations/20261117100000_promotions_and_social_discovery.sql"
  );
  const promotionsTypePath = resolve(cwd, "src/types/promotions.ts");
  const socialTypePath = resolve(cwd, "src/types/social.ts");
  const indexTypePath = resolve(cwd, "src/types/index.ts");
  const dbTypesPath = resolve(cwd, "src/lib/supabase/database.types.ts");
  const adminAuthPath = resolve(cwd, "src/lib/auth/admin.ts");

  console.log("--- 1. Target Files & Barrel Exports ---");
  check(
    "Migration file exists: 20261117100000_promotions_and_social_discovery.sql",
    existsSync(migrationPath)
  );
  check("Promotions types exist: src/types/promotions.ts", existsSync(promotionsTypePath));
  check("Social types exist: src/types/social.ts", existsSync(socialTypePath));
  check("Admin auth guard exists: src/lib/auth/admin.ts", existsSync(adminAuthPath));

  const indexContent = readFileSync(indexTypePath, "utf8");
  check(
    "src/types/index.ts exports promotions and social contracts",
    indexContent.includes('export * from "./promotions";') &&
      indexContent.includes('export * from "./social";')
  );

  console.log("\n--- 2. Database Migration & RLS Integrity ---");
  const migrationSql = readFileSync(migrationPath, "utf8");

  check(
    "Migration adds is_platform_admin column and SECURITY DEFINER helper",
    migrationSql.includes("ADD COLUMN IF NOT EXISTS is_platform_admin BOOLEAN NOT NULL DEFAULT false") &&
      migrationSql.includes("CREATE OR REPLACE FUNCTION public.is_platform_admin()") &&
      migrationSql.includes("SECURITY DEFINER")
  );

  check(
    "Migration creates admin_audit_logs and admin_notification_settings with RLS",
    migrationSql.includes("CREATE TABLE IF NOT EXISTS public.admin_audit_logs") &&
      migrationSql.includes("ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY") &&
      migrationSql.includes("CREATE TABLE IF NOT EXISTS public.admin_notification_settings") &&
      migrationSql.includes("ALTER TABLE public.admin_notification_settings ENABLE ROW LEVEL SECURITY")
  );

  check(
    "Migration creates featured_events with active-window and admin RLS policies",
    migrationSql.includes("CREATE TABLE IF NOT EXISTS public.featured_events") &&
      migrationSql.includes("ALTER TABLE public.featured_events ENABLE ROW LEVEL SECURITY") &&
      migrationSql.includes("Public can view active featured events") &&
      migrationSql.includes("Platform admins can manage featured events")
  );

  check(
    "Migration creates promotional_banners and decoupled banner_analytics with RLS",
    migrationSql.includes("CREATE TABLE IF NOT EXISTS public.promotional_banners") &&
      migrationSql.includes("ALTER TABLE public.promotional_banners ENABLE ROW LEVEL SECURITY") &&
      migrationSql.includes("CREATE TABLE IF NOT EXISTS public.banner_analytics") &&
      migrationSql.includes("ALTER TABLE public.banner_analytics ENABLE ROW LEVEL SECURITY")
  );

  check(
    "Migration adds social privacy columns and user_contact_identifiers / user_connections",
    migrationSql.includes("attendance_visibility") &&
      migrationSql.includes("allow_contact_discovery") &&
      migrationSql.includes("CREATE TABLE IF NOT EXISTS public.user_contact_identifiers") &&
      migrationSql.includes("ALTER TABLE public.user_contact_identifiers ENABLE ROW LEVEL SECURITY") &&
      migrationSql.includes("CREATE TABLE IF NOT EXISTS public.user_connections") &&
      migrationSql.includes("ALTER TABLE public.user_connections ENABLE ROW LEVEL SECURITY")
  );

  check(
    "Migration updates public_event_attendees view to enforce public attendance_visibility",
    migrationSql.includes("CREATE OR REPLACE VIEW public.public_event_attendees AS") &&
      migrationSql.includes("COALESCE(p.attendance_visibility, 'public') = 'public'")
  );

  console.log("\n--- 3. Admin Guard & TypeScript Contracts ---");
  const adminContent = readFileSync(adminAuthPath, "utf8");
  check(
    "Admin auth guard exports requirePlatformAdmin and isPlatformAdmin",
    adminContent.includes("export async function requirePlatformAdmin") &&
      adminContent.includes("export async function isPlatformAdmin") &&
      adminContent.includes("is_platform_admin")
  );

  const dbTypesContent = readFileSync(dbTypesPath, "utf8");
  const requiredDbTables = [
    "admin_audit_logs:",
    "admin_notification_settings:",
    "banner_analytics:",
    "featured_events:",
    "promotional_banners:",
    "user_connections:",
    "user_contact_identifiers:",
    "is_platform_admin:",
  ];
  check(
    "database.types.ts includes all Week 2 tables and is_platform_admin function",
    requiredDbTables.every((entry) => dbTypesContent.includes(entry))
  );

  console.log("\n--- 4. Em Dash Guardrail ---");
  const filesToCheck = [
    migrationPath,
    promotionsTypePath,
    socialTypePath,
    indexTypePath,
    dbTypesPath,
    adminAuthPath,
  ];
  const hasEmDash = filesToCheck.some((filePath) =>
    readFileSync(filePath, "utf8").includes("\u2014")
  );
  check("Zero em dashes (U+2014) in all Day 5 deliverables", !hasEmDash);

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

runWeek2Day5Verification().catch((error) => {
  console.error("Verification crashed:", error);
  process.exit(1);
});
