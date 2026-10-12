import { Coordinates } from './types'

const EARTH_RADIUS_KM = 6371
const KM_TO_MILES = 0.621371

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180
}

export function calculateDistance(
  pointA: Coordinates,
  pointB: Coordinates,
  unit: 'km' | 'miles' = 'km'
): number {
  if (
    pointA.latitude === pointB.latitude &&
    pointA.longitude === pointB.longitude
  ) {
    return 0
  }

  const dLat = toRadians(pointB.latitude - pointA.latitude)
  const dLon = toRadians(pointB.longitude - pointA.longitude)

  const lat1 = toRadians(pointA.latitude)
  const lat2 = toRadians(pointB.latitude)

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2)

  const clampedA = Math.min(1, Math.max(0, a))
  const c = 2 * Math.atan2(Math.sqrt(clampedA), Math.sqrt(1 - clampedA))
  const distanceKm = EARTH_RADIUS_KM * c

  if (unit === 'miles') {
    return Math.round(distanceKm * KM_TO_MILES * 100) / 100
  }

  return Math.round(distanceKm * 100) / 100
}

export function formatDistance(
  distanceKm: number,
  unit: 'km' | 'miles' = 'km'
): string {
  if (distanceKm < 0) return '0 km'

  if (unit === 'miles') {
    const miles = distanceKm * KM_TO_MILES
    if (miles < 0.1) return '< 0.1 mi'
    if (miles < 10) return `${miles.toFixed(1)} mi`
    return `${Math.round(miles)} mi`
  }

  if (distanceKm < 0.1) return '< 100 m'
  if (distanceKm < 1) return `${Math.round(distanceKm * 1000)} m`
  if (distanceKm < 10) return `${distanceKm.toFixed(1)} km`
  return `${Math.round(distanceKm)} km`
}

export function isWithinRadius(
  center: Coordinates,
  target: Coordinates,
  radiusKm: number
): boolean {
  return calculateDistance(center, target, 'km') <= radiusKm
}

export function sortByProximity<T>(
  items: T[],
  getCoords: (item: T) => Coordinates | null | undefined,
  userCoords: Coordinates
): { item: T; distanceKm: number }[] {
  const withDistance: { item: T; distanceKm: number }[] = []

  for (const item of items) {
    const coords = getCoords(item)
    if (coords && coords.latitude != null && coords.longitude != null) {
      withDistance.push({
        item,
        distanceKm: calculateDistance(userCoords, coords, 'km')
      })
    }
  }

  return withDistance.sort((a, b) => a.distanceKm - b.distanceKm)
}

export function findNearest<T>(
  items: T[],
  getCoords: (item: T) => Coordinates | null | undefined,
  userCoords: Coordinates
): { item: T; distanceKm: number } | null {
  const sorted = sortByProximity(items, getCoords, userCoords)
  return sorted.length > 0 ? sorted[0] : null
}
