'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import {
  StructuredLocation,
  LocationSearchResult,
  searchPlaces,
  NIGERIAN_HUBS,
  NigerianHub,
  hasValidCoordinates
} from '@/lib/location'
import { MapPreview } from './MapPreview'
import {
  MapPin,
  Search,
  Globe,
  Building,
  Check,
  ChevronDown,
  ChevronUp,
  X,
  Compass,
  Link as LinkIcon
} from 'lucide-react'

interface LocationPickerProps {
  value?: Partial<StructuredLocation>
  onChange: (location: StructuredLocation) => void
  className?: string
}

export function LocationPicker({
  value,
  onChange,
  className = ''
}: LocationPickerProps) {
  const [isOnline, setIsOnline] = useState<boolean>(Boolean(value?.is_online))
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [searchResults, setSearchResults] = useState<LocationSearchResult[]>([])
  const [isSearching, setIsSearching] = useState<boolean>(false)
  const [isOpenDropdown, setIsOpenDropdown] = useState<boolean>(false)
  const [showManualFields, setShowManualFields] = useState<boolean>(false)
  const [selectedHub, setSelectedHub] = useState<NigerianHub | null>(null)

  const [venueName, setVenueName] = useState<string>(value?.venue_name || '')
  const [address, setAddress] = useState<string>(value?.address || '')
  const [city, setCity] = useState<string>(value?.city || '')
  const [state, setState] = useState<string>(value?.state || '')
  const [country, setCountry] = useState<string>(value?.country || 'Nigeria')
  const [latitude, setLatitude] = useState<number | null>(value?.latitude ?? null)
  const [longitude, setLongitude] = useState<number | null>(value?.longitude ?? null)
  const [placeId, setPlaceId] = useState<string | null>(value?.place_id ?? null)
  const [onlineUrl, setOnlineUrl] = useState<string>(value?.online_url || '')

  const searchContainerRef = useRef<HTMLDivElement>(null)
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (value) {
      setIsOnline(Boolean(value.is_online))
      setVenueName(value.venue_name || '')
      setAddress(value.address || '')
      setCity(value.city || '')
      setState(value.state || '')
      setCountry(value.country || 'Nigeria')
      setLatitude(value.latitude ?? null)
      setLongitude(value.longitude ?? null)
      setPlaceId(value.place_id ?? null)
      setOnlineUrl(value.online_url || '')
    }
  }, [value])

  const notifyChange = useCallback(
    (overrides: Partial<StructuredLocation> = {}) => {
      const nextLocation: StructuredLocation = {
        venue_name: overrides.venue_name !== undefined ? overrides.venue_name : venueName || null,
        address: overrides.address !== undefined ? overrides.address : address || null,
        city: overrides.city !== undefined ? overrides.city : city || null,
        state: overrides.state !== undefined ? overrides.state : state || null,
        country: overrides.country !== undefined ? overrides.country : country || 'Nigeria',
        latitude: overrides.latitude !== undefined ? overrides.latitude : latitude,
        longitude: overrides.longitude !== undefined ? overrides.longitude : longitude,
        place_id: overrides.place_id !== undefined ? overrides.place_id : placeId,
        is_online: overrides.is_online !== undefined ? overrides.is_online : isOnline,
        online_url: overrides.online_url !== undefined ? overrides.online_url : onlineUrl || null
      }
      onChange(nextLocation)
    },
    [address, city, country, isOnline, latitude, longitude, onChange, onlineUrl, placeId, state, venueName]
  )

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setIsOpenDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSearchInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value
    setSearchQuery(q)

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    if (!q.trim()) {
      setSearchResults([])
      setIsOpenDropdown(false)
      return
    }

    setIsSearching(true)
    debounceTimerRef.current = setTimeout(async () => {
      try {
        const results = await searchPlaces(q, { countryCodes: ['ng'], limit: 6 })
        setSearchResults(results)
        setIsOpenDropdown(true)
      } finally {
        setIsSearching(false)
      }
    }, 300)
  }

  const handleSelectPlace = (place: LocationSearchResult) => {
    const nextVenue = place.venue_name || place.display_name.split(',')[0] || ''
    const nextAddress = place.address || ''
    const nextCity = place.city || ''
    const nextState = place.state || ''
    const nextCountry = place.country || 'Nigeria'
    const nextLat = place.latitude
    const nextLon = place.longitude
    const nextPlaceId = place.place_id

    setVenueName(nextVenue)
    setAddress(nextAddress)
    setCity(nextCity)
    setState(nextState)
    setCountry(nextCountry)
    setLatitude(nextLat)
    setLongitude(nextLon)
    setPlaceId(nextPlaceId)
    setSearchQuery(place.display_name)
    setIsOpenDropdown(false)

    notifyChange({
      venue_name: nextVenue,
      address: nextAddress,
      city: nextCity,
      state: nextState,
      country: nextCountry,
      latitude: nextLat,
      longitude: nextLon,
      place_id: nextPlaceId,
      is_online: false
    })
  }

  const handleSelectHub = (hub: NigerianHub) => {
    setSelectedHub(hub)
    setCity(hub.name)
    setState(hub.state)
    setCountry('Nigeria')
    setLatitude(hub.coordinates.latitude)
    setLongitude(hub.coordinates.longitude)
    setPlaceId(`hub-${hub.name.toLowerCase()}`)

    notifyChange({
      city: hub.name,
      state: hub.state,
      country: 'Nigeria',
      latitude: hub.coordinates.latitude,
      longitude: hub.coordinates.longitude,
      place_id: `hub-${hub.name.toLowerCase()}`,
      is_online: false
    })
  }

  const handleSelectPopularVenue = (venue: string) => {
    setVenueName(venue)
    notifyChange({ venue_name: venue })
  }

  const handleToggleOnline = (online: boolean) => {
    setIsOnline(online)
    notifyChange({ is_online: online })
  }

  const handleOnlineUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value
    setOnlineUrl(url)
    notifyChange({ online_url: url, is_online: true })
  }

  const currentLocationObject: Partial<StructuredLocation> = {
    venue_name: venueName,
    address,
    city,
    state,
    country,
    latitude,
    longitude,
    place_id: placeId,
    is_online: isOnline,
    online_url: onlineUrl
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center rounded-xl border border-white/10 bg-neutral-900/60 p-1">
        <button
          type="button"
          onClick={() => handleToggleOnline(false)}
          className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-xs font-semibold transition-all ${
            !isOnline
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          <Building className="h-3.5 w-3.5" />
          <span>In-Person Venue</span>
        </button>
        <button
          type="button"
          onClick={() => handleToggleOnline(true)}
          className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-xs font-semibold transition-all ${
            isOnline
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          <Globe className="h-3.5 w-3.5" />
          <span>Online Event</span>
        </button>
      </div>

      {isOnline ? (
        <div className="space-y-3 rounded-xl border border-white/10 bg-neutral-900/40 p-4">
          <label className="block text-xs font-medium text-neutral-300">
            Virtual Meeting or Stream URL
          </label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-neutral-400">
              <LinkIcon className="h-4 w-4" />
            </div>
            <input
              type="url"
              placeholder="https://meet.google.com/abc-defg-hij or https://zoom.us/j/..."
              value={onlineUrl}
              onChange={handleOnlineUrlChange}
              className="w-full rounded-lg border border-white/10 bg-neutral-950 py-2.5 pl-9 pr-3 text-sm text-neutral-100 placeholder-neutral-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <MapPreview location={{ is_online: true, online_url: onlineUrl }} height={110} />
        </div>
      ) : (
        <div className="space-y-4">
          <div ref={searchContainerRef} className="relative">
            <label className="block text-xs font-medium text-neutral-300 mb-1.5">
              Search Venue or Address
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-neutral-400">
                <Search className="h-4 w-4" />
              </div>
              <input
                type="text"
                placeholder="Search venue (e.g. Eko Convention Centre, Landmark, The Dome...)"
                value={searchQuery}
                onChange={handleSearchInput}
                onFocus={() => {
                  if (searchResults.length > 0) setIsOpenDropdown(true)
                }}
                className="w-full rounded-lg border border-white/10 bg-neutral-950 py-2.5 pl-9 pr-8 text-sm text-neutral-100 placeholder-neutral-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('')
                    setSearchResults([])
                    setIsOpenDropdown(false)
                  }}
                  className="absolute inset-y-0 right-0 flex items-center pr-2.5 text-neutral-400 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {isOpenDropdown && searchResults.length > 0 && (
              <div className="absolute z-30 mt-1.5 max-h-60 w-full overflow-y-auto rounded-xl border border-white/15 bg-neutral-950 p-1.5 shadow-2xl backdrop-blur-xl">
                {searchResults.map((res) => (
                  <button
                    key={res.place_id}
                    type="button"
                    onClick={() => handleSelectPlace(res)}
                    className="flex w-full items-start gap-2.5 rounded-lg p-2 text-left hover:bg-white/10 transition-colors"
                  >
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-blue-400" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-semibold text-neutral-100">
                        {res.venue_name || res.display_name.split(',')[0]}
                      </p>
                      <p className="truncate text-[11px] text-neutral-400">
                        {res.display_name}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
            {isSearching && (
              <div className="absolute right-9 top-9 text-xs text-neutral-400">
                Searching...
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-medium uppercase tracking-wider text-neutral-400">
                Quick Select Hubs (Nigeria)
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {NIGERIAN_HUBS.map((hub) => {
                const isSelected = city.toLowerCase() === hub.name.toLowerCase()
                return (
                  <button
                    key={hub.name}
                    type="button"
                    onClick={() => handleSelectHub(hub)}
                    className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-all ${
                      isSelected
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'border border-white/10 bg-neutral-900 text-neutral-300 hover:border-white/20 hover:bg-neutral-800'
                    }`}
                  >
                    {isSelected && <Check className="h-3 w-3" />}
                    <span>{hub.name}</span>
                  </button>
                )
              })}
            </div>

            {selectedHub && selectedHub.popularVenues.length > 0 && (
              <div className="mt-2.5 rounded-lg border border-white/5 bg-neutral-900/40 p-2.5">
                <p className="text-[11px] font-medium text-neutral-400 mb-1.5">
                  Popular venues in {selectedHub.name}:
                </p>
                <div className="flex flex-wrap gap-1">
                  {selectedHub.popularVenues.map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => handleSelectPopularVenue(v)}
                      className={`rounded-md px-2 py-0.5 text-[11px] transition-colors ${
                        venueName === v
                          ? 'bg-blue-500/20 text-blue-300 font-medium border border-blue-500/40'
                          : 'bg-white/5 text-neutral-300 hover:bg-white/10'
                      }`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <MapPreview location={currentLocationObject} height={180} />

          <div className="rounded-xl border border-white/10 bg-neutral-900/40 p-3">
            <button
              type="button"
              onClick={() => setShowManualFields(!showManualFields)}
              className="flex w-full items-center justify-between text-xs font-medium text-neutral-300 hover:text-white"
            >
              <div className="flex items-center gap-1.5">
                <Compass className="h-3.5 w-3.5 text-blue-400" />
                <span>Manual Venue & Coordinate Details</span>
              </div>
              {showManualFields ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>

            {showManualFields && (
              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 pt-2 border-t border-white/5">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-medium text-neutral-400 mb-1">
                    Venue Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Landmark Centre Hall A"
                    value={venueName}
                    onChange={(e) => {
                      setVenueName(e.target.value)
                      notifyChange({ venue_name: e.target.value })
                    }}
                    className="w-full rounded-lg border border-white/10 bg-neutral-950 px-3 py-1.5 text-xs text-neutral-100 placeholder-neutral-500 focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-medium text-neutral-400 mb-1">
                    Street Address
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Plot 2 & 3, Water Corporation Drive"
                    value={address}
                    onChange={(e) => {
                      setAddress(e.target.value)
                      notifyChange({ address: e.target.value })
                    }}
                    className="w-full rounded-lg border border-white/10 bg-neutral-950 px-3 py-1.5 text-xs text-neutral-100 placeholder-neutral-500 focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-neutral-400 mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Lagos"
                    value={city}
                    onChange={(e) => {
                      setCity(e.target.value)
                      notifyChange({ city: e.target.value })
                    }}
                    className="w-full rounded-lg border border-white/10 bg-neutral-950 px-3 py-1.5 text-xs text-neutral-100 placeholder-neutral-500 focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-neutral-400 mb-1">
                    State
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Lagos State"
                    value={state}
                    onChange={(e) => {
                      setState(e.target.value)
                      notifyChange({ state: e.target.value })
                    }}
                    className="w-full rounded-lg border border-white/10 bg-neutral-950 px-3 py-1.5 text-xs text-neutral-100 placeholder-neutral-500 focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-neutral-400 mb-1">
                    Latitude
                  </label>
                  <input
                    type="number"
                    step="any"
                    placeholder="e.g. 6.4253"
                    value={latitude !== null ? latitude : ''}
                    onChange={(e) => {
                      const val = e.target.value ? parseFloat(e.target.value) : null
                      setLatitude(val)
                      notifyChange({ latitude: val })
                    }}
                    className="w-full rounded-lg border border-white/10 bg-neutral-950 px-3 py-1.5 text-xs text-neutral-100 placeholder-neutral-500 focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-neutral-400 mb-1">
                    Longitude
                  </label>
                  <input
                    type="number"
                    step="any"
                    placeholder="e.g. 3.4278"
                    value={longitude !== null ? longitude : ''}
                    onChange={(e) => {
                      const val = e.target.value ? parseFloat(e.target.value) : null
                      setLongitude(val)
                      notifyChange({ longitude: val })
                    }}
                    className="w-full rounded-lg border border-white/10 bg-neutral-950 px-3 py-1.5 text-xs text-neutral-100 placeholder-neutral-500 focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
