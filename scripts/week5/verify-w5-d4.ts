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

async function runWeek5Day4Verification() {
  console.log("\n=============================================================");
  console.log("Starting Week 5 Day 4 Verification: Cross-Device QA & Upload Integrity");
  console.log("=============================================================\n");

  const cwd = process.cwd();

  // 1. Cross-Device Responsive Layouts
  console.log("--- 1. Responsive Viewport Adaptations ---");
  const responsiveFiles = [
    {
      file: "src/components/dashboard/OrganizerTabs.tsx",
      tokens: ["overflow-x-auto", "gap-2", "sm:gap-6"],
      description: "OrganizerTabs horizontal scroll dock on mobile",
    },
    {
      file: "src/components/dashboard/OrganizerOverviewTab.tsx",
      tokens: ["grid-cols-2", "lg:grid-cols-4", "md:grid-cols-3"],
      description: "OrganizerOverviewTab 2-column mobile to 4-column desktop grid",
    },
    {
      file: "src/components/dashboard/OrganizerPeopleTab.tsx",
      tokens: ["overflow-x-auto", "grid-cols-2", "sm:grid-cols-4"],
      description: "OrganizerPeopleTab horizontal scroll table and adaptive metrics grid",
    },
    {
      file: "src/components/dashboard/OrganizerCampaignsTab.tsx",
      tokens: ["grid", "sm:grid-cols-2", "lg:grid-cols-3"],
      description: "OrganizerCampaignsTab responsive multi-breakpoint card grid",
    },
    {
      file: "src/components/dashboard/OrganizerSettingsTab.tsx",
      tokens: ["sm:grid-cols-2", "space-y-6"],
      description: "OrganizerSettingsTab responsive form layout",
    },
    {
      file: "src/components/navigation/mobile-nav.tsx",
      tokens: ["fixed", "bottom-0", "md:hidden"],
      description: "mobile-nav bottom dock strictly hidden on desktop viewports",
    },
    {
      file: "src/components/events/MobileEventActionBar.tsx",
      tokens: ["fixed", "lg:hidden"],
      description: "MobileEventActionBar fixed bottom dock for mobile viewports",
    },
  ];

  for (const item of responsiveFiles) {
    const fullPath = resolve(cwd, item.file);
    const exists = existsSync(fullPath);
    if (!exists) {
      check(item.description, false, `File not found: ${item.file}`);
      continue;
    }
    const content = readFileSync(fullPath, "utf8");
    const hasTokens = item.tokens.every((t) => content.includes(t));
    check(item.description, hasTokens, item.file);
  }

  // 2. Image Upload Constraints & Type Validation
  console.log("\n--- 2. Image Upload Constraints & Security Limits ---");
  const createPath = resolve(cwd, "src/app/create/page.tsx");
  const createExists = existsSync(createPath);
  check("Create event page exists", createExists, "src/app/create/page.tsx");
  if (createExists) {
    const createPage = readFileSync(createPath, "utf8");
    check(
      "Create event enforces 8MB cover upload ceiling",
      createPage.includes("8 * 1024 * 1024")
    );
    check(
      "Create event restricts file input to secure image types (PNG, JPEG, WebP)",
      createPage.includes('accept="image/png,image/jpeg,image/webp"')
    );
  } else {
    check("Create event enforces 8MB cover upload ceiling", false, "Missing file");
    check("Create event restricts file input to secure image types (PNG, JPEG, WebP)", false, "Missing file");
  }

  const campaignSlugPath = resolve(cwd, "src/app/campaign/[slug]/page.tsx");
  const campaignSlugExists = existsSync(campaignSlugPath);
  check("Campaign participation page exists", campaignSlugExists, "src/app/campaign/[slug]/page.tsx");
  if (campaignSlugExists) {
    const campaignSlugPage = readFileSync(campaignSlugPath, "utf8");
    check(
      "Campaign participation enforces 10MB photo upload limit",
      campaignSlugPage.includes("10 * 1024 * 1024")
    );
  } else {
    check("Campaign participation enforces 10MB photo upload limit", false, "Missing file");
  }

  const campaignBuilderPath = resolve(cwd, "src/components/campaigns/campaign-builder.tsx");
  const campaignBuilderExists = existsSync(campaignBuilderPath);
  check("Campaign builder component exists", campaignBuilderExists, "src/components/campaigns/campaign-builder.tsx");
  if (campaignBuilderExists) {
    const campaignBuilder = readFileSync(campaignBuilderPath, "utf8");
    check(
      "Campaign builder enforces 15MB template upload ceiling",
      campaignBuilder.includes("15 * 1024 * 1024")
    );
  } else {
    check("Campaign builder enforces 15MB template upload ceiling", false, "Missing file");
  }

  // 3. Canvas Generation Integrity & Export Boundaries
  console.log("\n--- 3. Canvas Generation Integrity & Safeguards ---");
  const canvasIntegrityPath = resolve(cwd, "src/lib/campaigns/canvas-integrity.ts");
  const canvasIntegrityExists = existsSync(canvasIntegrityPath);
  check("Canvas integrity module exists", canvasIntegrityExists, "src/lib/campaigns/canvas-integrity.ts");
  if (canvasIntegrityExists) {
    const canvasIntegrity = readFileSync(canvasIntegrityPath, "utf8");
    check(
      "canvas-integrity exports MIN_CANVAS_DIMENSION and MAX_CANVAS_DIMENSION",
      canvasIntegrity.includes("MIN_CANVAS_DIMENSION = 100") &&
      canvasIntegrity.includes("MAX_CANVAS_DIMENSION = 8192")
    );
    check(
      "canvas-integrity enforces zoom clamp between 1x and 5x",
      canvasIntegrity.includes("MIN_ZOOM = 1") &&
      canvasIntegrity.includes("MAX_ZOOM = 5")
    );
    check(
      "canvas-integrity exports assertCanvasIntegrity validation",
      canvasIntegrity.includes("export function assertCanvasIntegrity")
    );
  } else {
    check("canvas-integrity exports MIN_CANVAS_DIMENSION and MAX_CANVAS_DIMENSION", false, "Missing file");
    check("canvas-integrity enforces zoom clamp between 1x and 5x", false, "Missing file");
    check("canvas-integrity exports assertCanvasIntegrity validation", false, "Missing file");
  }

  const generatePath = resolve(cwd, "src/lib/campaigns/generate.ts");
  const generateExists = existsSync(generatePath);
  check("Campaign generate module exists", generateExists, "src/lib/campaigns/generate.ts");
  if (generateExists) {
    const generateModule = readFileSync(generatePath, "utf8");
    check(
      "generateCampaignImage validates canvas integrity prior to rendering",
      generateModule.includes("assertCanvasIntegrity")
    );
    check(
      "generateCampaignImage draws circular and rectangular photo shapes",
      generateModule.includes('photoPosition.shape === "circle"')
    );
    check(
      "generateCampaignImage exports lossless PNG data URL",
      generateModule.includes('canvas.toDataURL("image/png"')
    );
  } else {
    check("generateCampaignImage validates canvas integrity prior to rendering", false, "Missing file");
    check("generateCampaignImage draws circular and rectangular photo shapes", false, "Missing file");
    check("generateCampaignImage exports lossless PNG data URL", false, "Missing file");
  }

  // 4. Zero Em Dashes Policy
  console.log("\n--- 4. Zero Em Dashes Policy ---");
  const testFiles = [
    "scripts/week5/verify-w5-d4.ts",
    "src/lib/campaigns/canvas-integrity.ts",
    "src/lib/campaigns/generate.ts",
    "src/app/create/page.tsx",
    "src/app/campaign/[slug]/page.tsx",
    "src/components/campaigns/campaign-builder.tsx",
    "src/components/navigation/mobile-nav.tsx",
    "src/components/events/MobileEventActionBar.tsx",
    "src/components/dashboard/OrganizerTabs.tsx",
    "src/components/dashboard/OrganizerOverviewTab.tsx",
    "src/components/dashboard/OrganizerPeopleTab.tsx",
    "src/components/dashboard/OrganizerCampaignsTab.tsx",
    "src/components/dashboard/OrganizerSettingsTab.tsx",
  ];

  let emDashCount = 0;
  for (const relPath of testFiles) {
    const fullPath = resolve(cwd, relPath);
    if (existsSync(fullPath)) {
      const content = readFileSync(fullPath, "utf8");
      if (content.includes(String.fromCharCode(0x2014))) {
        emDashCount++;
        console.log(`[FAIL] Em dash found in: ${relPath}`);
      }
    }
  }
  check("Zero em dashes found across Day 12 audited components", emDashCount === 0);

  // Summary
  const passedCount = results.filter((r) => r.passed).length;
  const failedCount = results.filter((r) => !r.passed).length;

  console.log("\n=============================================================");
  console.log(`Week 5 Day 4 Verification: ${passedCount} passed, ${failedCount} failed`);
  console.log("=============================================================\n");

  if (failedCount > 0) {
    process.exit(1);
  }
}

runWeek5Day4Verification().catch((error) => {
  console.error("Fatal verification error:", error);
  process.exit(1);
});
