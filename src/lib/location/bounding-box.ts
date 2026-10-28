import type { Coordinates } from "./types";
import { findNigerianHub } from "./nigeria-hubs";

export interface BoundingBox {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
}

const EARTH_RADIUS_KM = 6371;

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

function roundCoord(value: number): number {
  return Math.round(value * 1e6) / 1e6;
}

export function calculateBoundingBox(
  center: Coordinates,
  radiusKm: number
): BoundingBox {
  const safeRadius = Math.max(0, radiusKm);
  const latDelta = (safeRadius / EARTH_RADIUS_KM) * (180 / Math.PI);

  const minLat = Math.max(-90, center.latitude - latDelta);
  const maxLat = Math.min(90, center.latitude + latDelta);

  const latRad = toRadians(center.latitude);
  const cosLat = Math.cos(latRad);

  if (Math.abs(cosLat) < 1e-6) {
    return {
      minLat: roundCoord(minLat),
      maxLat: roundCoord(maxLat),
      minLng: -180,
      maxLng: 180,
    };
  }

  const lngDelta = (safeRadius / (EARTH_RADIUS_KM * cosLat)) * (180 / Math.PI);
  const minLng = Math.max(-180, center.longitude - Math.abs(lngDelta));
  const maxLng = Math.min(180, center.longitude + Math.abs(lngDelta));

  return {
    minLat: roundCoord(minLat),
    maxLat: roundCoord(maxLat),
    minLng: roundCoord(minLng),
    maxLng: roundCoord(maxLng),
  };
}

export function isWithinBoundingBox(
  target: Coordinates,
  box: BoundingBox
): boolean {
  return (
    target.latitude >= box.minLat &&
    target.latitude <= box.maxLat &&
    target.longitude >= box.minLng &&
    target.longitude <= box.maxLng
  );
}

const NIGERIAN_CITY_ALIASES: Record<string, string[]> = {
  lagos: [
    "ikeja",
    "yaba",
    "lekki",
    "victoria island",
    "vi",
    "surulere",
    "gbagada",
    "ikoyi",
    "maryland",
    "lagos mainland",
    "lagos island",
  ],
  abuja: [
    "fct",
    "federal capital territory",
    "wuse",
    "maitama",
    "garki",
    "asokoro",
    "gwarinpa",
    "jabi",
  ],
  "port harcourt": ["ph", "phc", "rivers", "diobu", "trans amadi", "gra"],
  ibadan: ["bodija", "ring road", "dugbe", "agodi", "oyo"],
  enugu: ["independence layout", "new haven", "ogui", "coal city"],
  kano: ["fagge", "nassarawa", "dala", "gwale"],
  "benin city": ["benin", "ring road benin", "gra benin", "edo"],
};

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function matchesCity(
  candidateCity: string | null | undefined,
  targetCity: string
): boolean {
  if (!candidateCity || !targetCity) return false;

  const candidate = normalizeText(candidateCity);
  const target = normalizeText(targetCity);

  if (!candidate || !target) return false;

  if (candidate === target) return true;
  if (candidate.includes(target) || target.includes(candidate)) return true;

  const targetHub = findNigerianHub(target);
  if (targetHub && candidate.includes(normalizeText(targetHub.name))) {
    return true;
  }

  const aliases = NIGERIAN_CITY_ALIASES[target] ?? [];
  for (const alias of aliases) {
    if (candidate === alias || candidate.includes(alias)) {
      return true;
    }
  }

  for (const [canonical, aliasList] of Object.entries(NIGERIAN_CITY_ALIASES)) {
    if (target === canonical && aliasList.some((alias) => candidate.includes(alias))) {
      return true;
    }
    if (aliasList.includes(target) && (candidate === canonical || candidate.includes(canonical))) {
      return true;
    }
  }

  return false;
}

export function buildBoundingBoxFilter(
  center: Coordinates,
  radiusKm: number
): BoundingBox {
  return calculateBoundingBox(center, radiusKm);
}
