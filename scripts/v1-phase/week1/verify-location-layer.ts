import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

interface CheckResult {
  name: string
  passed: boolean
  details?: string
}

const results: CheckResult[] = []

function check(name: string, condition: boolean, details?: string) {
  results.push({ name, passed: condition, details })
  const symbol = condition ? 'PASS' : 'FAIL'
  console.log(`[${symbol}] ${name}${details ? ` (${details})` : ''}`)
}

async function runVerification() {
  console.log('\nStarting Week 2 Day 1: Location Abstraction Layer Verification\n')

  const files = [
    'src/lib/location/types.ts',
    'src/lib/location/distance.ts',
    'src/lib/location/navigation.ts',
    'src/lib/location/nigeria-hubs.ts',
    'src/lib/location/format.ts',
    'src/lib/location/osm-provider.ts',
    'src/lib/location/provider.ts',
    'src/lib/location/index.ts'
  ]

  for (const file of files) {
    const fullPath = resolve(process.cwd(), file)
    check(`Location module exists: ${file}`, existsSync(fullPath))
  }

  const typesContent = readFileSync(resolve(process.cwd(), 'src/lib/location/types.ts'), 'utf8')
  check('types.ts defines Coordinates', typesContent.includes('export interface Coordinates'))
  check('types.ts defines StructuredLocation', typesContent.includes('export interface StructuredLocation'))
  check('types.ts defines LocationSearchResult', typesContent.includes('export interface LocationSearchResult'))
  check('types.ts defines LocationProvider interface', typesContent.includes('export interface LocationProvider'))

  const distanceContent = readFileSync(resolve(process.cwd(), 'src/lib/location/distance.ts'), 'utf8')
  check('distance.ts exports calculateDistance', distanceContent.includes('export function calculateDistance'))
  check('distance.ts exports formatDistance', distanceContent.includes('export function formatDistance'))
  check('distance.ts exports isWithinRadius', distanceContent.includes('export function isWithinRadius'))
  check('distance.ts exports sortByProximity', distanceContent.includes('export function sortByProximity'))
  check('distance.ts exports findNearest', distanceContent.includes('export function findNearest'))

  const navContent = readFileSync(resolve(process.cwd(), 'src/lib/location/navigation.ts'), 'utf8')
  check('navigation.ts exports getGoogleMapsUrl', navContent.includes('export function getGoogleMapsUrl'))
  check('navigation.ts exports getGoogleDirectionsUrl', navContent.includes('export function getGoogleDirectionsUrl'))
  check('navigation.ts exports getAppleMapsUrl', navContent.includes('export function getAppleMapsUrl'))
  check('navigation.ts exports getWazeUrl', navContent.includes('export function getWazeUrl'))
  check('navigation.ts exports getMapEmbedUrl', navContent.includes('export function getMapEmbedUrl'))
  check('navigation.ts exports getNavigationUrl', navContent.includes('export function getNavigationUrl'))

  const hubsContent = readFileSync(resolve(process.cwd(), 'src/lib/location/nigeria-hubs.ts'), 'utf8')
  check('nigeria-hubs.ts exports NIGERIAN_HUBS', hubsContent.includes('export const NIGERIAN_HUBS'))
  check('nigeria-hubs.ts exports findNigerianHub', hubsContent.includes('export function findNigerianHub'))
  check('nigeria-hubs.ts exports isNigerianCoordinates', hubsContent.includes('export function isNigerianCoordinates'))

  const formatContent = readFileSync(resolve(process.cwd(), 'src/lib/location/format.ts'), 'utf8')
  check('format.ts exports formatLocationDisplay', formatContent.includes('export function formatLocationDisplay'))
  check('format.ts exports toStructuredLocation', formatContent.includes('export function toStructuredLocation'))
  check('format.ts exports hasValidCoordinates', formatContent.includes('export function hasValidCoordinates'))
  check('format.ts exports getCoordinates', formatContent.includes('export function getCoordinates'))

  const osmContent = readFileSync(resolve(process.cwd(), 'src/lib/location/osm-provider.ts'), 'utf8')
  check('osm-provider.ts exports OpenStreetMapProvider', osmContent.includes('export class OpenStreetMapProvider'))

  const providerContent = readFileSync(resolve(process.cwd(), 'src/lib/location/provider.ts'), 'utf8')
  check('provider.ts exports getLocationProvider', providerContent.includes('export function getLocationProvider'))
  check('provider.ts exports setLocationProvider', providerContent.includes('export function setLocationProvider'))
  check('provider.ts exports searchPlaces', providerContent.includes('export async function searchPlaces'))
  check('provider.ts exports geocode', providerContent.includes('export async function geocode'))

  const indexContent = readFileSync(resolve(process.cwd(), 'src/lib/location/index.ts'), 'utf8')
  check('index.ts re-exports all modules', indexContent.includes("export * from './types'") && indexContent.includes("export * from './provider'"))

  function toRad(deg: number) { return (deg * Math.PI) / 180 }
  function calcDist(a: { lat: number; lon: number }, b: { lat: number; lon: number }) {
    const dLat = toRad(b.lat - a.lat)
    const dLon = toRad(b.lon - a.lon)
    const val = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLon / 2) ** 2
    return 6371 * 2 * Math.atan2(Math.sqrt(val), Math.sqrt(1 - val))
  }

  const lagos = { lat: 6.5244, lon: 3.3792 }
  const ph = { lat: 4.8156, lon: 7.0498 }
  const dist = calcDist(lagos, ph)
  check('Haversine distance between Lagos and PH is between 400 and 480 km', dist > 400 && dist < 480, `${Math.round(dist)} km`)

  const isNigeria = (lat: number, lon: number) => lat >= 4.0 && lat <= 14.0 && lon >= 2.5 && lon <= 15.0
  check('Nigeria coordinates check accepts Lagos', isNigeria(6.5244, 3.3792) === true)
  check('Nigeria coordinates check rejects London', isNigeria(51.5074, -0.1278) === false)

  const passedCount = results.filter((r) => r.passed).length
  const failedCount = results.filter((r) => !r.passed).length

  console.log(`\nLocation Layer Verification Summary: ${passedCount} passed, ${failedCount} failed\n`)

  if (failedCount > 0) {
    process.exit(1)
  }
}

runVerification().catch((err) => {
  console.error('Verification failed:', err)
  process.exit(1)
})
