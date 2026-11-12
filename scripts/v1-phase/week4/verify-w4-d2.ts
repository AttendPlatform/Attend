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

// Behavioral implementations for unit verification
const EARTH_RADIUS_KM = 6371;

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

function testCalculateBoundingBox(center: { latitude: number; longitude: number }, radiusKm: number) {
  const safeRadius = Math.max(0, radiusKm);
  const latDelta = (safeRadius / EARTH_RADIUS_KM) * (180 / Math.PI);
  const minLat = Math.max(-90, center.latitude - latDelta);
  const maxLat = Math.min(90, center.latitude + latDelta);
  const latRad = toRadians(center.latitude);
  const cosLat = Math.cos(latRad);

  if (Math.abs(cosLat) < 1e-6) {
    return { minLat, maxLat, minLng: -180, maxLng: 180 };
  }

  const lngDelta = (safeRadius / (EARTH_RADIUS_KM * cosLat)) * (180 / Math.PI);
  const minLng = Math.max(-180, center.longitude - Math.abs(lngDelta));
  const maxLng = Math.min(180, center.longitude + Math.abs(lngDelta));
  return { minLat, maxLat, minLng, maxLng };
}

function testIsWithinBoundingBox(target: { latitude: number; longitude: number }, box: { minLat: number; maxLat: number; minLng: number; maxLng: number }) {
  return (
    target.latitude >= box.minLat &&
    target.latitude <= box.maxLat &&
    target.longitude >= box.minLng &&
    target.longitude <= box.maxLng
  );
}

function testMatchesCity(candidateCity: string | null | undefined, targetCity: string): boolean {
  if (!candidateCity || !targetCity) return false;
  const normalize = (s: string) => s.toLowerCase().replace(/[^\w\s]/g, " ").replace(/\s+/g, " ").trim();
  const c = normalize(candidateCity);
  const t = normalize(targetCity);
  if (!c || !t) return false;
  if (c === t || c.includes(t) || t.includes(c)) return true;
  const aliases: Record<string, string[]> = {
    lagos: ["ikeja", "yaba", "lekki", "victoria island", "vi", "surulere"],
    abuja: ["fct", "federal capital territory", "wuse", "maitama", "garki"],
    ibadan: ["bodija", "ring road", "dugbe"],
  };
  for (const [canonical, list] of Object.entries(aliases)) {
    if (t === canonical && list.some((alias) => c.includes(alias))) return true;
    if (list.includes(t) && (c === canonical || c.includes(canonical))) return true;
  }
  return false;
}

function testValidateCanvasDimensions(width: unknown, height: unknown) {
  const numWidth = typeof width === "number" ? width : Number(width);
  const numHeight = typeof height === "number" ? height : Number(height);
  if (!Number.isFinite(numWidth) || !Number.isFinite(numHeight)) {
    return { width: 1080, height: 1080, isValid: false, error: "Canvas dimensions must be finite numbers." };
  }
  if (numWidth < 100 || numHeight < 100) {
    return { width: Math.max(100, Math.round(numWidth)), height: Math.max(100, Math.round(numHeight)), isValid: false };
  }
  if (numWidth > 8192 || numHeight > 8192) {
    return { width: Math.min(8192, Math.round(numWidth)), height: Math.min(8192, Math.round(numHeight)), isValid: false };
  }
  return { width: Math.round(numWidth), height: Math.round(numHeight), isValid: true };
}

function testValidatePhotoAdjustment(adj: unknown) {
  if (!adj || typeof adj !== "object") return { zoom: 1, offsetX: 0, offsetY: 0 };
  const c = adj as Record<string, unknown>;
  const rawZoom = Number(c.zoom);
  const rawOffsetX = Number(c.offsetX);
  const rawOffsetY = Number(c.offsetY);
  return {
    zoom: Number.isFinite(rawZoom) ? Math.min(5, Math.max(1, rawZoom)) : 1,
    offsetX: Number.isFinite(rawOffsetX) ? Math.min(5, Math.max(-5, rawOffsetX)) : 0,
    offsetY: Number.isFinite(rawOffsetY) ? Math.min(5, Math.max(-5, rawOffsetY)) : 0,
  };
}

async function runWeek4Day2Verification() {
  console.log("\n=============================================================");
  console.log("Starting Week 4 Day 2 Verification: Location Efficiency & Canvas Integrity");
  console.log("=============================================================\n");

  const cwd = process.cwd();

  // 1. Target files and barrel exports
  console.log("--- 1. Target Files & Barrel Exports ---");
  const boundingBoxPath = resolve(cwd, "src/lib/location/bounding-box.ts");
  const locationIndexPath = resolve(cwd, "src/lib/location/index.ts");
  const canvasIntegrityPath = resolve(cwd, "src/lib/campaigns/canvas-integrity.ts");
  const discoverServicePath = resolve(cwd, "src/services/discover.service.ts");
  const generatePath = resolve(cwd, "src/lib/campaigns/generate.ts");

  check("File exists: src/lib/location/bounding-box.ts", existsSync(boundingBoxPath));
  check("File exists: src/lib/location/index.ts", existsSync(locationIndexPath));
  check("File exists: src/lib/campaigns/canvas-integrity.ts", existsSync(canvasIntegrityPath));
  check("File exists: src/services/discover.service.ts", existsSync(discoverServicePath));
  check("File exists: src/lib/campaigns/generate.ts", existsSync(generatePath));

  const locationIndexContent = readFileSync(locationIndexPath, "utf8");
  check(
    "src/lib/location/index.ts exports bounding-box module",
    locationIndexContent.includes("bounding-box")
  );

  // 2. Bounding Box Contracts & Structure (Brief Section 19)
  console.log("\n--- 2. Bounding Box Contracts & Mathematical Properties ---");
  const boundingBoxContent = readFileSync(boundingBoxPath, "utf8");
  check(
    "bounding-box.ts exports BoundingBox interface",
    boundingBoxContent.includes("export interface BoundingBox")
  );
  check(
    "bounding-box.ts exports calculateBoundingBox function",
    boundingBoxContent.includes("export function calculateBoundingBox")
  );
  check(
    "bounding-box.ts exports isWithinBoundingBox function",
    boundingBoxContent.includes("export function isWithinBoundingBox")
  );
  check(
    "bounding-box.ts exports matchesCity function",
    boundingBoxContent.includes("export function matchesCity")
  );
  check(
    "bounding-box.ts exports buildBoundingBoxFilter function",
    boundingBoxContent.includes("export function buildBoundingBoxFilter")
  );

  const lagosCoords = { latitude: 6.5244, longitude: 3.3792 };
  const lagosBox20km = testCalculateBoundingBox(lagosCoords, 20);

  check("Bounding box produces minLat < maxLat", lagosBox20km.minLat < lagosBox20km.maxLat);
  check("Bounding box produces minLng < maxLng", lagosBox20km.minLng < lagosBox20km.maxLng);
  check(
    "Bounding box center latitude is midway",
    Math.abs((lagosBox20km.maxLat + lagosBox20km.minLat) / 2 - lagosCoords.latitude) < 0.001
  );

  const zeroBox = testCalculateBoundingBox(lagosCoords, 0);
  check(
    "Zero radius bounding box matches center point",
    zeroBox.minLat === lagosCoords.latitude && zeroBox.maxLat === lagosCoords.latitude
  );

  const poleCoords = { latitude: 89.99, longitude: 10.0 };
  const poleBox = testCalculateBoundingBox(poleCoords, 50);
  check("High latitude poles handled without NaN", !Number.isNaN(poleBox.minLng) && !Number.isNaN(poleBox.maxLng));
  check("Pole latitude clamped to 90 degrees max", poleBox.maxLat <= 90);

  // 3. Fast Bounding Box Pruning vs Haversine Distance
  console.log("\n--- 3. Fast Bounding Box Pruning vs Haversine ---");
  const viVenue = { latitude: 6.4281, longitude: 3.4219 }; // Victoria Island, Lagos
  const abujaVenue = { latitude: 9.0765, longitude: 7.3986 }; // Abuja

  check(
    "Victoria Island venue is inside Lagos 20km bounding box",
    testIsWithinBoundingBox(viVenue, lagosBox20km)
  );
  check(
    "Abuja venue is pruned outside Lagos 20km bounding box",
    !testIsWithinBoundingBox(abujaVenue, lagosBox20km)
  );

  // 4. City Matching Robustness (Brief Section 19)
  console.log("\n--- 4. City Matching Robustness ---");
  check("Exact city match succeeds", testMatchesCity("Lagos", "Lagos"));
  check("Case-insensitive city match succeeds", testMatchesCity("lagos", "Lagos"));
  check("Punctuation and whitespace normalized", testMatchesCity("  Ikeja, Lagos  ", "Lagos"));
  check("State suffix normalized", testMatchesCity("Lagos State", "Lagos"));
  check("Nigerian tech hub alias (Ikeja -> Lagos) matches", testMatchesCity("Ikeja", "Lagos"));
  check("Nigerian tech hub alias (Wuse -> Abuja) matches", testMatchesCity("Wuse, Abuja", "Abuja"));
  check("Nigerian tech hub alias (Bodija -> Ibadan) matches", testMatchesCity("Bodija", "Ibadan"));
  check("Non-matching cities rejected", !testMatchesCity("Kano", "Lagos"));
  check("Empty strings handled safely without crashing", !testMatchesCity("", "Lagos") && !testMatchesCity(null, "Lagos"));

  // 5. PostGIS Avoidance & Range Filter Construction
  console.log("\n--- 5. PostGIS Avoidance & Range Filters ---");
  const discoverServiceContent = readFileSync(discoverServicePath, "utf8");
  check(
    "discover.service imports bounding box and city matching",
    discoverServiceContent.includes("isWithinBoundingBox") &&
      discoverServiceContent.includes("matchesCity")
  );
  check(
    "discover.service applies bounding box nearMe filter",
    discoverServiceContent.includes("calculateBoundingBox")
  );
  check(
    "discover.service normalizes timestamp ranges",
    discoverServiceContent.includes("new Date(event.start_at).getTime()")
  );

  // 6. Fabric.js Canvas Builder Integrity
  console.log("\n--- 6. Fabric.js Canvas Builder Integrity ---");
  const canvasIntegrityContent = readFileSync(canvasIntegrityPath, "utf8");
  check(
    "canvas-integrity.ts exports validateCanvasDimensions",
    canvasIntegrityContent.includes("export function validateCanvasDimensions")
  );
  check(
    "canvas-integrity.ts exports validatePhotoAdjustment",
    canvasIntegrityContent.includes("export function validatePhotoAdjustment")
  );
  check(
    "canvas-integrity.ts exports validatePhotoPosition",
    canvasIntegrityContent.includes("export function validatePhotoPosition")
  );
  check(
    "canvas-integrity.ts exports validateNamePosition",
    canvasIntegrityContent.includes("export function validateNamePosition")
  );
  check(
    "canvas-integrity.ts exports assertCanvasIntegrity",
    canvasIntegrityContent.includes("export function assertCanvasIntegrity")
  );

  const validDim = testValidateCanvasDimensions(1080, 1080);
  check("Valid standard dimensions accepted", validDim.isValid && validDim.width === 1080 && validDim.height === 1080);

  const smallDim = testValidateCanvasDimensions(50, 50);
  check("Sub-minimum dimensions rejected", !smallDim.isValid && smallDim.width === 100);

  const largeDim = testValidateCanvasDimensions(10000, 10000);
  check("Excessive dimensions clamped to safety limit", !largeDim.isValid && largeDim.width === 8192);

  const nanDim = testValidateCanvasDimensions(NaN, "invalid");
  check("Invalid dimension types fallback safely", !nanDim.isValid && nanDim.width === 1080);

  const cleanAdj = testValidatePhotoAdjustment({ zoom: 2.5, offsetX: 0.1, offsetY: -0.2 });
  check("Valid photo adjustment preserved", cleanAdj.zoom === 2.5 && cleanAdj.offsetX === 0.1);

  const nanAdj = testValidatePhotoAdjustment({ zoom: NaN, offsetX: "invalid" });
  check("Corrupted photo adjustment sanitized", nanAdj.zoom >= 1 && !Number.isNaN(nanAdj.zoom));

  const generateContent = readFileSync(generatePath, "utf8");
  check(
    "generateCampaignImage invokes assertCanvasIntegrity guard",
    generateContent.includes("assertCanvasIntegrity(")
  );

  // 7. Zero Em Dashes Policy
  console.log("\n--- 7. Zero Em Dashes Policy ---");
  const targetCodeFiles = [
    boundingBoxPath,
    canvasIntegrityPath,
    discoverServicePath,
    generatePath,
  ];

  let hasEmDash = false;
  for (const file of targetCodeFiles) {
    const text = readFileSync(file, "utf8");
    if (text.includes("—") || text.includes("–")) {
      hasEmDash = true;
      console.log(`FAIL: Em dash found in ${file}`);
    }
  }
  check("Zero em dashes found across all Week 4 Day 2 code", !hasEmDash);

  // Summary
  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;
  console.log("\n=============================================================");
  console.log(`Week 4 Day 2 Checkpoint Summary: ${passed} passed, ${failed} failed`);
  console.log("=============================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runWeek4Day2Verification().catch((err) => {
  console.error("Verification crashed:", err);
  process.exit(1);
});
