import { Coordinates, NavigationOptions, StructuredLocation } from './types'

export function getGoogleMapsUrl(
  coords?: Coordinates | null,
  venueOrAddress?: string | null
): string {
  if (coords && coords.latitude != null && coords.longitude != null) {
    if (venueOrAddress) {
      return `https://www.google.com/maps/search/?api=1&query=${coords.latitude},${coords.longitude}&query_place_id=${encodeURIComponent(venueOrAddress)}`
    }
    return `https://www.google.com/maps/search/?api=1&query=${coords.latitude},${coords.longitude}`
  }

  if (venueOrAddress) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(venueOrAddress)}`
  }

  return 'https://www.google.com/maps'
}

export function getGoogleDirectionsUrl(
  coords?: Coordinates | null,
  venueOrAddress?: string | null,
  travelMode: NavigationOptions['travelMode'] = 'driving'
): string {
  const modeMap: Record<string, string> = {
    driving: 'driving',
    walking: 'walking',
    transit: 'transit',
    bicycling: 'bicycling'
  }

  const mode = modeMap[travelMode || 'driving'] || 'driving'
  let destination = ''

  if (coords && coords.latitude != null && coords.longitude != null) {
    destination = `${coords.latitude},${coords.longitude}`
  } else if (venueOrAddress) {
    destination = encodeURIComponent(venueOrAddress)
  }

  return `https://www.google.com/maps/dir/?api=1&destination=${destination}&travelmode=${mode}`
}

export function getAppleMapsUrl(
  coords?: Coordinates | null,
  venueOrAddress?: string | null
): string {
  const query = venueOrAddress ? encodeURIComponent(venueOrAddress) : ''

  if (coords && coords.latitude != null && coords.longitude != null) {
    return `https://maps.apple.com/?ll=${coords.latitude},${coords.longitude}&q=${query || `${coords.latitude},${coords.longitude}`}`
  }

  if (query) {
    return `https://maps.apple.com/?q=${query}`
  }

  return 'https://maps.apple.com/'
}

export function getWazeUrl(coords?: Coordinates | null): string {
  if (coords && coords.latitude != null && coords.longitude != null) {
    return `https://waze.com/ul?ll=${coords.latitude},${coords.longitude}&navigate=yes`
  }
  return 'https://waze.com'
}

export function getMapEmbedUrl(coords: Coordinates, zoom: number = 15): string {
  const delta = 0.008 * (15 / Math.max(zoom, 1))
  const minLon = coords.longitude - delta
  const minLat = coords.latitude - delta
  const maxLon = coords.longitude + delta
  const maxLat = coords.latitude + delta

  return `https://www.openstreetmap.org/export/embed.html?bbox=${minLon}%2C${minLat}%2C${maxLon}%2C${maxLat}&layer=mapnik&marker=${coords.latitude}%2C${coords.longitude}`
}

export function getOpenStreetMapUrl(coords: Coordinates, zoom: number = 16): string {
  return `https://www.openstreetmap.org/?mlat=${coords.latitude}&mlon=${coords.longitude}#map=${zoom}/${coords.latitude}/${coords.longitude}`
}

export function getNavigationUrl(
  location: Partial<StructuredLocation>,
  options: NavigationOptions = {}
): string {
  if (location.is_online) {
    return location.online_url || ''
  }

  const coords: Coordinates | null =
    location.latitude != null && location.longitude != null
      ? { latitude: location.latitude, longitude: location.longitude }
      : null

  const venueOrAddress = [location.venue_name, location.address, location.city]
    .filter(Boolean)
    .join(', ')

  if (options.preferApp === 'apple') {
    return getAppleMapsUrl(coords, venueOrAddress)
  }

  if (options.preferApp === 'waze' && coords) {
    return getWazeUrl(coords)
  }

  if (options.travelMode) {
    return getGoogleDirectionsUrl(coords, venueOrAddress, options.travelMode)
  }

  return getGoogleMapsUrl(coords, venueOrAddress)
}
