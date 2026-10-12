import { Coordinates, StructuredLocation } from './types'

export type LocationFormatMode = 'compact' | 'full' | 'venue-only' | 'city-only'

export function hasValidCoordinates(
  location?: Partial<StructuredLocation> | null
): boolean {
  if (!location) return false
  const { latitude, longitude } = location
  return (
    typeof latitude === 'number' &&
    typeof longitude === 'number' &&
    !isNaN(latitude) &&
    !isNaN(longitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180
  )
}

export function formatLocationDisplay(
  location?: Partial<StructuredLocation> | null,
  mode: LocationFormatMode = 'compact'
): string {
  if (!location) return 'Location TBA'

  if (location.is_online) {
    return 'Online Event'
  }

  const venue = location.venue_name?.trim()
  const address = location.address?.trim()
  const city = location.city?.trim()
  const state = location.state?.trim()
  const country = location.country?.trim()

  if (mode === 'venue-only') {
    return venue || address || city || 'Location TBA'
  }

  if (mode === 'city-only') {
    const parts = [city, state, country].filter(Boolean)
    return parts.length > 0 ? parts.join(', ') : 'Location TBA'
  }

  if (mode === 'full') {
    const parts = [venue, address, city, state, country].filter(Boolean)
    return parts.length > 0 ? parts.join(', ') : 'Location TBA'
  }

  if (venue && city) {
    return `${venue}, ${city}`
  }

  if (venue && address) {
    return `${venue}, ${address}`
  }

  if (venue) return venue
  if (address && city) return `${address}, ${city}`
  if (address) return address
  if (city) return state ? `${city}, ${state}` : city

  return 'Location TBA'
}

export function toStructuredLocation(raw: {
  venue_name?: string | null
  address?: string | null
  city?: string | null
  state?: string | null
  country?: string | null
  latitude?: number | null
  location_place_id?: string | null
  longitude?: number | null
  is_online?: boolean | null
  online_url?: string | null
}): StructuredLocation {
  return {
    venue_name: raw.venue_name || null,
    address: raw.address || null,
    city: raw.city || null,
    state: raw.state || null,
    country: raw.country || null,
    latitude: typeof raw.latitude === 'number' ? raw.latitude : null,
    longitude: typeof raw.longitude === 'number' ? raw.longitude : null,
    place_id: raw.location_place_id || null,
    is_online: Boolean(raw.is_online),
    online_url: raw.online_url || null
  }
}

export function getCoordinates(
  location?: Partial<StructuredLocation> | null
): Coordinates | null {
  if (
    location &&
    typeof location.latitude === 'number' &&
    typeof location.longitude === 'number' &&
    !isNaN(location.latitude) &&
    !isNaN(location.longitude)
  ) {
    return {
      latitude: location.latitude,
      longitude: location.longitude
    }
  }
  return null
}
