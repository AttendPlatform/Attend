export interface Coordinates {
  latitude: number
  longitude: number
}

export interface StructuredLocation {
  venue_name?: string | null
  address?: string | null
  city?: string | null
  state?: string | null
  country?: string | null
  latitude?: number | null
  longitude?: number | null
  place_id?: string | null
  is_online: boolean
  online_url?: string | null
}

export interface LocationSearchResult {
  place_id: string
  display_name: string
  venue_name?: string
  address?: string
  city?: string
  state?: string
  country?: string
  latitude: number
  longitude: number
  type?: string
}

export interface LocationSearchOptions {
  limit?: number
  countryCodes?: string[]
  proximity?: Coordinates
}

export type NavigationApp = 'google' | 'apple' | 'waze' | 'universal'

export interface NavigationOptions {
  preferApp?: NavigationApp
  travelMode?: 'driving' | 'walking' | 'transit' | 'bicycling'
}

export interface LocationProvider {
  readonly name: string
  searchPlaces(query: string, options?: LocationSearchOptions): Promise<LocationSearchResult[]>
  geocode(address: string): Promise<Coordinates | null>
  reverseGeocode(coords: Coordinates): Promise<StructuredLocation | null>
  getDirectionsUrl(coords: Coordinates, venueOrAddress?: string): string
}
