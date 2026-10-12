import {
  Coordinates,
  LocationProvider,
  LocationSearchOptions,
  LocationSearchResult,
  StructuredLocation
} from './types'
import { OpenStreetMapProvider } from './osm-provider'

let activeProvider: LocationProvider = new OpenStreetMapProvider()

export function getLocationProvider(): LocationProvider {
  return activeProvider
}

export function setLocationProvider(provider: LocationProvider): void {
  activeProvider = provider
}

export function resetLocationProvider(): void {
  activeProvider = new OpenStreetMapProvider()
}

export async function searchPlaces(
  query: string,
  options?: LocationSearchOptions
): Promise<LocationSearchResult[]> {
  return activeProvider.searchPlaces(query, options)
}

export async function geocode(address: string): Promise<Coordinates | null> {
  return activeProvider.geocode(address)
}

export async function reverseGeocode(
  coords: Coordinates
): Promise<StructuredLocation | null> {
  return activeProvider.reverseGeocode(coords)
}

export function getDirectionsUrl(
  coords: Coordinates,
  venueOrAddress?: string
): string {
  return activeProvider.getDirectionsUrl(coords, venueOrAddress)
}
