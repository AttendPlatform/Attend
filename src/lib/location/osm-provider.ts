import {
  Coordinates,
  LocationProvider,
  LocationSearchOptions,
  LocationSearchResult,
  StructuredLocation
} from './types'
import { getGoogleDirectionsUrl } from './navigation'
import { NIGERIAN_HUBS, findNigerianHub } from './nigeria-hubs'

interface CacheEntry<T> {
  data: T
  expiresAt: number
}

const CACHE_TTL_MS = 5 * 60 * 1000

export class OpenStreetMapProvider implements LocationProvider {
  readonly name = 'openstreetmap-nominatim'
  private cache = new Map<string, CacheEntry<unknown>>()

  private getCached<T>(key: string): T | null {
    const entry = this.cache.get(key)
    if (!entry) return null
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key)
      return null
    }
    return entry.data as T
  }

  private setCached<T>(key: string, data: T): void {
    if (this.cache.size > 200) {
      const oldestKey = this.cache.keys().next().value
      if (oldestKey) this.cache.delete(oldestKey)
    }
    this.cache.set(key, { data, expiresAt: Date.now() + CACHE_TTL_MS })
  }

  async searchPlaces(
    query: string,
    options: LocationSearchOptions = {}
  ): Promise<LocationSearchResult[]> {
    if (!query || !query.trim()) return []

    const trimmed = query.trim()
    const limit = options.limit || 5
    const cacheKey = `search:${trimmed.toLowerCase()}:${limit}`

    const cached = this.getCached<LocationSearchResult[]>(cacheKey)
    if (cached) return cached

    const presetResults: LocationSearchResult[] = []
    const matchedHub = findNigerianHub(trimmed)

    if (matchedHub) {
      presetResults.push({
        place_id: `hub-${matchedHub.name.toLowerCase()}`,
        display_name: `${matchedHub.name}, ${matchedHub.state}, Nigeria`,
        city: matchedHub.name,
        state: matchedHub.state,
        country: 'Nigeria',
        latitude: matchedHub.coordinates.latitude,
        longitude: matchedHub.coordinates.longitude,
        type: 'city'
      })

      for (const venue of matchedHub.popularVenues) {
        if (
          trimmed.length > 2 &&
          venue.toLowerCase().includes(trimmed.toLowerCase())
        ) {
          presetResults.push({
            place_id: `venue-${venue.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
            display_name: `${venue}, ${matchedHub.name}, Nigeria`,
            venue_name: venue,
            city: matchedHub.name,
            state: matchedHub.state,
            country: 'Nigeria',
            latitude: matchedHub.coordinates.latitude,
            longitude: matchedHub.coordinates.longitude,
            type: 'venue'
          })
        }
      }
    }

    try {
      const countryCodeParam = options.countryCodes?.length
        ? `&countrycodes=${options.countryCodes.join(',')}`
        : '&countrycodes=ng'

      const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(trimmed)}&addressdetails=1&limit=${limit}${countryCodeParam}`

      const response = await fetch(url, {
        headers: {
          Accept: 'application/json',
          'User-Agent': 'AttendPlatform-EventLocation/1.0'
        }
      })

      if (!response.ok) {
        return presetResults.slice(0, limit)
      }

      const rawItems = await response.json()
      if (!Array.isArray(rawItems)) {
        return presetResults.slice(0, limit)
      }

      const remoteResults: LocationSearchResult[] = rawItems.map((item: any) => {
        const addr = item.address || {}
        return {
          place_id: String(item.place_id || item.osm_id),
          display_name: item.display_name,
          venue_name:
            item.name ||
            addr.amenity ||
            addr.building ||
            addr.leisure ||
            undefined,
          address: addr.road || addr.suburb || undefined,
          city:
            addr.city ||
            addr.town ||
            addr.village ||
            addr.state_district ||
            undefined,
          state: addr.state || undefined,
          country: addr.country || 'Nigeria',
          latitude: parseFloat(item.lat),
          longitude: parseFloat(item.lon),
          type: item.type || item.category || undefined
        }
      })

      const combined = [...presetResults]
      for (const rem of remoteResults) {
        if (!combined.some((c) => Math.abs(c.latitude - rem.latitude) < 0.001 && Math.abs(c.longitude - rem.longitude) < 0.001)) {
          combined.push(rem)
        }
      }

      const finalResults = combined.slice(0, limit)
      this.setCached(cacheKey, finalResults)
      return finalResults
    } catch {
      return presetResults.slice(0, limit)
    }
  }

  async geocode(address: string): Promise<Coordinates | null> {
    if (!address || !address.trim()) return null

    const cacheKey = `geocode:${address.trim().toLowerCase()}`
    const cached = this.getCached<Coordinates>(cacheKey)
    if (cached) return cached

    const results = await this.searchPlaces(address, { limit: 1 })
    if (results.length > 0) {
      const coords: Coordinates = {
        latitude: results[0].latitude,
        longitude: results[0].longitude
      }
      this.setCached(cacheKey, coords)
      return coords
    }

    return null
  }

  async reverseGeocode(coords: Coordinates): Promise<StructuredLocation | null> {
    const lat = Math.round(coords.latitude * 10000) / 10000
    const lon = Math.round(coords.longitude * 10000) / 10000
    const cacheKey = `rev:${lat}:${lon}`

    const cached = this.getCached<StructuredLocation>(cacheKey)
    if (cached) return cached

    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}&addressdetails=1`
      const response = await fetch(url, {
        headers: {
          Accept: 'application/json',
          'User-Agent': 'AttendPlatform-EventLocation/1.0'
        }
      })

      if (!response.ok) return null
      const data = await response.json()
      const addr = data.address || {}

      const result: StructuredLocation = {
        venue_name: data.name || addr.amenity || addr.building || null,
        address: addr.road || addr.suburb || null,
        city: addr.city || addr.town || addr.village || addr.state_district || null,
        state: addr.state || null,
        country: addr.country || 'Nigeria',
        latitude: parseFloat(data.lat),
        longitude: parseFloat(data.lon),
        place_id: String(data.place_id || data.osm_id || ''),
        is_online: false,
        online_url: null
      }

      this.setCached(cacheKey, result)
      return result
    } catch {
      return null
    }
  }

  getDirectionsUrl(coords: Coordinates, venueOrAddress?: string): string {
    return getGoogleDirectionsUrl(coords, venueOrAddress)
  }
}
