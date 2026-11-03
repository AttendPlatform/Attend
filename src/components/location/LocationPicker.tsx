
'use client'

import React, {
  useState,
  useEffect,
  useRef,
  useCallback
} from 'react'

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
  Link as LinkIcon,
  Loader2,
  Map,
  LocateFixed
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
  const [isOnline, setIsOnline] = useState(Boolean(value?.is_online))

  const [searchQuery, setSearchQuery] = useState(
    [value?.venue_name, value?.address].filter(Boolean).join(', ')
  )
  const [searchResults, setSearchResults] = useState<LocationSearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [isOpenDropdown, setIsOpenDropdown] = useState(false)
  const [searchError, setSearchError] = useState('')

  const [showMoreOptions, setShowMoreOptions] = useState(false)
  const [showManualFields, setShowManualFields] = useState(false)
  const [showMap, setShowMap] = useState(false)

  const [selectedHub, setSelectedHub] = useState<NigerianHub | null>(() =>
    NIGERIAN_HUBS.find(
      hub => hub.name.toLowerCase() === (value?.city || '').toLowerCase()
    ) || null
  )

  const [venueName, setVenueName] = useState(value?.venue_name || '')
  const [address, setAddress] = useState(value?.address || '')
  const [city, setCity] = useState(value?.city || '')
  const [state, setState] = useState(value?.state || '')
  const [country, setCountry] = useState(value?.country || 'Nigeria')

  const [latitude, setLatitude] = useState<number | null>(
    value?.latitude ?? null
  )

  const [longitude, setLongitude] = useState<number | null>(
    value?.longitude ?? null
  )

  const [placeId, setPlaceId] = useState<string | null>(
    value?.place_id ?? null
  )

  const [onlineUrl, setOnlineUrl] = useState(value?.online_url || '')

  const searchContainerRef = useRef<HTMLDivElement>(null)
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const searchRequestRef = useRef(0)

  // Clean up pending searches when the component unmounts.
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }

      searchRequestRef.current += 1
    }
  }, [])

  // Close the search dropdown when clicking outside.
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

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const notifyChange = useCallback(
    (overrides: Partial<StructuredLocation> = {}) => {
      const nextLocation: StructuredLocation = {
        venue_name:
          overrides.venue_name !== undefined
            ? overrides.venue_name
            : venueName || null,

        address:
          overrides.address !== undefined
            ? overrides.address
            : address || null,

        city:
          overrides.city !== undefined
            ? overrides.city
            : city || null,

        state:
          overrides.state !== undefined
            ? overrides.state
            : state || null,

        country:
          overrides.country !== undefined
            ? overrides.country
            : country || 'Nigeria',

        latitude:
          overrides.latitude !== undefined
            ? overrides.latitude
            : latitude,

        longitude:
          overrides.longitude !== undefined
            ? overrides.longitude
            : longitude,

        place_id:
          overrides.place_id !== undefined
            ? overrides.place_id
            : placeId,

        is_online:
          overrides.is_online !== undefined
            ? overrides.is_online
            : isOnline,

        online_url:
          overrides.online_url !== undefined
            ? overrides.online_url
            : onlineUrl || null
      }

      onChange(nextLocation)
    },
    [
      address,
      city,
      country,
      isOnline,
      latitude,
      longitude,
      onChange,
      onlineUrl,
      placeId,
      state,
      venueName
    ]
  )

  // Search venues with debounce and protection against stale responses.
  const handleSearchInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value

    setSearchQuery(query)
    setSearchError('')
    setSearchResults([])

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    const requestId = ++searchRequestRef.current

    if (query.trim().length < 2) {
      setIsSearching(false)
      setIsOpenDropdown(false)
      return
    }

    setIsSearching(true)
    setIsOpenDropdown(true)

    debounceTimerRef.current = setTimeout(async () => {
      try {
        const results = await searchPlaces(query.trim(), {
          countryCodes: ['ng'],
          limit: 6
        })

        if (requestId !== searchRequestRef.current) return

        setSearchResults(results)
        setSearchError(
          results.length === 0
            ? 'No matching places found. Try another search or enter the address manually.'
            : ''
        )
      } catch (error) {
        if (requestId !== searchRequestRef.current) return

        console.error('Location search failed:', error)

        setSearchResults([])
        setSearchError(
          'Location search is temporarily unavailable. You can enter the address manually.'
        )
      } finally {
        if (requestId === searchRequestRef.current) {
          setIsSearching(false)
        }
      }
    }, 350)
  }

  const handleSelectPlace = (place: LocationSearchResult) => {
    const nextVenue =
      place.venue_name || place.display_name.split(',')[0] || ''

    const nextAddress = place.address || ''
    const nextCity = place.city || ''
    const nextState = place.state || ''
    const nextCountry = place.country || 'Nigeria'

    setVenueName(nextVenue)
    setAddress(nextAddress)
    setCity(nextCity)
    setState(nextState)
    setCountry(nextCountry)
    setLatitude(place.latitude)
    setLongitude(place.longitude)
    setPlaceId(place.place_id)

    setSearchQuery(place.display_name)
    setSearchResults([])
    setIsOpenDropdown(false)
    setSearchError('')
    setSelectedHub(null)

    notifyChange({
      venue_name: nextVenue,
      address: nextAddress,
      city: nextCity,
      state: nextState,
      country: nextCountry,
      latitude: place.latitude,
      longitude: place.longitude,
      place_id: place.place_id,
      is_online: false
    })
  }

  const handleClearLocation = () => {
    setSearchQuery('')
    setSearchResults([])
    setSearchError('')
    setIsOpenDropdown(false)
    setSelectedHub(null)

    setVenueName('')
    setAddress('')
    setCity('')
    setState('')
    setLatitude(null)
    setLongitude(null)
    setPlaceId(null)

    notifyChange({
      venue_name: null,
      address: null,
      city: null,
      state: null,
      latitude: null,
      longitude: null,
      place_id: null,
      is_online: false
    })
  }

  const handleSelectHub = (hub: NigerianHub) => {
    setSelectedHub(hub)

    // A city preset is not a venue selection; discard any previously selected venue.
    setVenueName('')
    setAddress('')
    setCity(hub.name)
    setState(hub.state)
    setCountry('Nigeria')

    setLatitude(hub.coordinates.latitude)
    setLongitude(hub.coordinates.longitude)

    const nextPlaceId = `hub-${hub.name.toLowerCase()}`
    setPlaceId(nextPlaceId)

    setSearchQuery('')
    setSearchResults([])
    setIsOpenDropdown(false)

    notifyChange({
      venue_name: null,
      address: null,
      city: hub.name,
      state: hub.state,
      country: 'Nigeria',
      latitude: hub.coordinates.latitude,
      longitude: hub.coordinates.longitude,
      place_id: nextPlaceId,
      is_online: false
    })
  }

  const handleSelectPopularVenue = (venue: string) => {
    setVenueName(venue)

    notifyChange({
      venue_name: venue,
      is_online: false
    })
  }

  const handleToggleOnline = (online: boolean) => {
    setIsOnline(online)
    setSearchError('')

    notifyChange({
      is_online: online
    })
  }

  const handleOnlineUrlChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const url = e.target.value

    setOnlineUrl(url)

    notifyChange({
      online_url: url,
      is_online: true
    })
  }

  const updateManualField = (
    field: keyof StructuredLocation,
    value: string | number | null
  ) => {
    switch (field) {
      case 'venue_name':
        setVenueName(value as string)
        break

      case 'address':
        setAddress(value as string)
        break

      case 'city':
        setCity(value as string)
        setSelectedHub(null)
        break

      case 'state':
        setState(value as string)
        break

      case 'country':
        setCountry(value as string)
        break

      case 'latitude':
        setLatitude(value as number | null)
        break

      case 'longitude':
        setLongitude(value as number | null)
        break
    }

    notifyChange({ [field]: value } as Partial<StructuredLocation>)
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

  const hasLocation =
    Boolean(venueName || address || city) ||
    hasValidCoordinates(currentLocationObject)

  return (
    <div className={`space-y-5 ${className}`}>

      {/* Event format */}
      <div>
        <label className="mb-2 block text-sm font-semibold text-neutral-800">
          Event format
        </label>

        <div className="grid grid-cols-2 gap-2 rounded-2xl border border-neutral-200 bg-neutral-50 p-1.5">
          <button
            type="button"
            onClick={() => handleToggleOnline(false)}
            aria-pressed={!isOnline}
            className={`flex items-center justify-center gap-2 rounded-xl px-3 py-3 text-xs font-semibold transition-all ${
              !isOnline
                ? 'bg-white text-violet-700 shadow-sm ring-1 ring-neutral-200'
                : 'text-neutral-500 hover:bg-white/70 hover:text-neutral-800'
            }`}
          >
            <Building className="h-4 w-4" />
            In person
          </button>

          <button
            type="button"
            onClick={() => handleToggleOnline(true)}
            aria-pressed={isOnline}
            className={`flex items-center justify-center gap-2 rounded-xl px-3 py-3 text-xs font-semibold transition-all ${
              isOnline
                ? 'bg-white text-violet-700 shadow-sm ring-1 ring-neutral-200'
                : 'text-neutral-500 hover:bg-white/70 hover:text-neutral-800'
            }`}
          >
            <Globe className="h-4 w-4" />
            Online
          </button>
        </div>
      </div>

      {/* Online event */}
      {isOnline ? (
        <div className="space-y-4">
          <div>
            <label
              htmlFor="online-event-url"
              className="mb-2 block text-sm font-semibold text-neutral-800"
            >
              Meeting or streaming link
            </label>

            <div className="relative">
              <LinkIcon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />

              <input
                id="online-event-url"
                type="url"
                placeholder="https://meet.google.com/..."
                value={onlineUrl}
                onChange={handleOnlineUrlChange}
                className="h-12 w-full rounded-xl border border-neutral-200 bg-white pl-11 pr-4 text-sm text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:border-violet-500 focus:ring-4 focus:ring-violet-50"
              />
            </div>

            <p className="mt-2 text-xs leading-5 text-neutral-500">
              Add the link attendees will use to join your event. You can
              also provide it to attendees later.
            </p>
          </div>

          <MapPreview
            location={{
              is_online: true,
              online_url: onlineUrl
            }}
            height={110}
            className="!rounded-2xl !border-violet-100 !bg-violet-50"
          />
        </div>
      ) : (
        <>
          {/* Main venue search */}
          <div ref={searchContainerRef} className="relative">
            <div className="mb-2 flex items-center justify-between gap-3">
              <label
                htmlFor="venue-search"
                className="text-sm font-semibold text-neutral-800"
              >
                Where is your event?
              </label>

              {hasLocation && (
                <button
                  type="button"
                  onClick={handleClearLocation}
                  className="text-xs font-medium text-neutral-400 transition hover:text-red-600"
                >
                  Clear location
                </button>
              )}
            </div>

            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />

              <input
                id="venue-search"
                role="combobox"
                type="text"
                autoComplete="off"
                placeholder="Search venue, building, or address..."
                value={searchQuery}
                onChange={handleSearchInput}
                onFocus={() => {
                  if (searchResults.length > 0 || searchError) {
                    setIsOpenDropdown(true)
                  }
                }}
                aria-expanded={isOpenDropdown}
                aria-controls="venue-search-results"
                className="h-12 w-full rounded-xl border border-neutral-200 bg-white pl-11 pr-11 text-sm text-neutral-900 outline-none transition placeholder:text-neutral-400 hover:border-neutral-300 focus:border-violet-500 focus:ring-4 focus:ring-violet-50"
              />

              {isSearching ? (
                <Loader2 className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-violet-500" />
              ) : searchQuery ? (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('')
                    setSearchResults([])
                    setSearchError('')
                    setIsOpenDropdown(false)

                    if (debounceTimerRef.current) {
                      clearTimeout(debounceTimerRef.current)
                    }

                    searchRequestRef.current += 1
                    setIsSearching(false)
                  }}
                  aria-label="Clear search text"
                  className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-700"
                >
                  <X className="h-4 w-4" />
                </button>
              ) : null}
            </div>

            {/* Search results */}
            {isOpenDropdown && (
              <div
                id="venue-search-results"
                className="absolute z-40 mt-2 max-h-64 w-full overflow-y-auto rounded-2xl border border-neutral-200 bg-white p-2 shadow-xl shadow-neutral-900/10"
              >
                {searchResults.length > 0 ? (
                  <div className="space-y-1">
                    {searchResults.map((result) => (
                      <button
                        key={result.place_id}
                        type="button"
                        onClick={() => handleSelectPlace(result)}
                        className="flex w-full items-start gap-3 rounded-xl p-3 text-left transition hover:bg-violet-50"
                      >
                        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
                          <MapPin className="h-4 w-4" />
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-neutral-800">
                            {result.venue_name ||
                              result.display_name.split(',')[0]}
                          </p>

                          <p className="mt-0.5 line-clamp-2 text-xs leading-5 text-neutral-500">
                            {result.display_name}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 text-center">
                    <MapPin className="mx-auto h-5 w-5 text-neutral-300" />
                    <p className="mt-2 text-xs leading-5 text-neutral-500">
                      {searchError || 'Searching for locations...'}
                    </p>
                  </div>
                )}
              </div>
            )}

            <p className="mt-2 text-xs text-neutral-400">
              Search for a venue or address in Nigeria.
            </p>
          </div>

          {/* Selected location summary */}
          {hasLocation && (
            <div className="flex items-start gap-3 rounded-xl border border-violet-100 bg-violet-50/60 p-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-violet-600 shadow-sm">
                <MapPin className="h-4 w-4" />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <p className="text-xs font-semibold text-violet-800">
                    Location selected
                  </p>
                  <Check className="h-3.5 w-3.5 text-violet-600" />
                </div>

                <p className="mt-1 text-sm font-medium text-neutral-800">
                  {venueName || city || address}
                </p>

                {(address || city || state) && (
                  <p className="mt-0.5 text-xs text-neutral-500">
                    {[address, city, state, country]
                      .filter(Boolean)
                      .join(', ')}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Additional location tools */}
          <div className="overflow-hidden rounded-2xl border border-neutral-200">
            <button
              type="button"
              onClick={() => setShowMoreOptions(!showMoreOptions)}
              aria-expanded={showMoreOptions}
              className="flex w-full items-center justify-between gap-3 p-4 text-left transition hover:bg-neutral-50"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-neutral-100 text-neutral-600">
                  <LocateFixed className="h-4 w-4" />
                </div>

                <div>
                  <p className="text-sm font-semibold text-neutral-800">
                    Other location options
                  </p>
                  <p className="mt-0.5 text-xs text-neutral-500">
                    Quick-select cities, enter details, or view a map.
                  </p>
                </div>
              </div>

              {showMoreOptions ? (
                <ChevronUp className="h-4 w-4 shrink-0 text-neutral-400" />
              ) : (
                <ChevronDown className="h-4 w-4 shrink-0 text-neutral-400" />
              )}
            </button>

            {showMoreOptions && (
              <div className="space-y-5 border-t border-neutral-100 p-4">

                {/* Nigerian hubs */}
                <div>
                  <div className="mb-3">
                    <p className="text-xs font-semibold text-neutral-800">
                      Quick-select a city
                    </p>
                    <p className="mt-1 text-xs text-neutral-500">
                      Choose a popular Nigerian location.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {NIGERIAN_HUBS.map((hub) => {
                      const isSelected =
                        selectedHub?.name === hub.name ||
                        city.toLowerCase() === hub.name.toLowerCase()

                      return (
                        <button
                          key={hub.name}
                          type="button"
                          onClick={() => handleSelectHub(hub)}
                          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-2 text-xs font-medium transition ${
                            isSelected
                              ? 'border-violet-300 bg-violet-50 text-violet-700'
                              : 'border-neutral-200 bg-white text-neutral-600 hover:border-violet-200 hover:bg-violet-50/50'
                          }`}
                        >
                          {isSelected && (
                            <Check className="h-3 w-3" />
                          )}
                          {hub.name}
                        </button>
                      )
                    })}
                  </div>

                  {selectedHub?.popularVenues?.length ? (
                    <div className="mt-4 rounded-xl bg-neutral-50 p-3">
                      <p className="mb-2 text-xs font-semibold text-neutral-700">
                        Popular venues in {selectedHub.name}
                      </p>

                      <div className="flex flex-wrap gap-2">
                        {selectedHub.popularVenues.map((venue) => (
                          <button
                            key={venue}
                            type="button"
                            onClick={() => handleSelectPopularVenue(venue)}
                            className={`rounded-lg border px-2.5 py-1.5 text-xs transition ${
                              venueName === venue
                                ? 'border-violet-300 bg-violet-50 text-violet-700'
                                : 'border-neutral-200 bg-white text-neutral-600 hover:border-violet-200'
                            }`}
                          >
                            {venue}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>

                <div className="border-t border-neutral-100" />

                {/* Manual address */}
                <div>
                  <button
                    type="button"
                    onClick={() => setShowManualFields(!showManualFields)}
                    aria-expanded={showManualFields}
                    className="flex w-full items-center justify-between gap-3 text-left"
                  >
                    <div className="flex items-center gap-2">
                      <Compass className="h-4 w-4 text-violet-600" />
                      <span className="text-xs font-semibold text-neutral-800">
                        Enter location manually
                      </span>
                    </div>

                    {showManualFields ? (
                      <ChevronUp className="h-4 w-4 text-neutral-400" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-neutral-400" />
                    )}
                  </button>

                  {showManualFields && (
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <div className="sm:col-span-2">
                        <label className="mb-1.5 block text-xs font-medium text-neutral-700">
                          Venue name
                        </label>
                        <input
                          type="text"
                          value={venueName}
                          onChange={(e) =>
                            updateManualField('venue_name', e.target.value)
                          }
                          placeholder="e.g. Landmark Centre, Hall A"
                          className="h-10 w-full rounded-xl border border-neutral-200 bg-white px-3 text-xs outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-50"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="mb-1.5 block text-xs font-medium text-neutral-700">
                          Street address
                        </label>
                        <input
                          type="text"
                          value={address}
                          onChange={(e) =>
                            updateManualField('address', e.target.value)
                          }
                          placeholder="Street, building, or area"
                          className="h-10 w-full rounded-xl border border-neutral-200 bg-white px-3 text-xs outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-50"
                        />
                      </div>

                      <div>
                        <label className="mb-1.5 block text-xs font-medium text-neutral-700">
                          City
                        </label>
                        <input
                          type="text"
                          value={city}
                          onChange={(e) =>
                            updateManualField('city', e.target.value)
                          }
                          placeholder="e.g. Benin City"
                          className="h-10 w-full rounded-xl border border-neutral-200 bg-white px-3 text-xs outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-50"
                        />
                      </div>

                      <div>
                        <label className="mb-1.5 block text-xs font-medium text-neutral-700">
                          State
                        </label>
                        <input
                          type="text"
                          value={state}
                          onChange={(e) =>
                            updateManualField('state', e.target.value)
                          }
                          placeholder="e.g. Edo State"
                          className="h-10 w-full rounded-xl border border-neutral-200 bg-white px-3 text-xs outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-50"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="mb-1.5 block text-xs font-medium text-neutral-700">
                          Country
                        </label>
                        <input
                          type="text"
                          value={country}
                          onChange={(e) =>
                            updateManualField('country', e.target.value)
                          }
                          placeholder="Country"
                          className="h-10 w-full rounded-xl border border-neutral-200 bg-white px-3 text-xs outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-50"
                        />
                      </div>

                      <div>
                        <label className="mb-1.5 block text-xs font-medium text-neutral-700">
                          Latitude
                        </label>
                        <input
                          type="number"
                          step="any"
                          value={latitude ?? ''}
                          onChange={(e) =>
                            updateManualField(
                              'latitude',
                              e.target.value === ''
                                ? null
                                : Number(e.target.value)
                            )
                          }
                          placeholder="e.g. 6.3350"
                          className="h-10 w-full rounded-xl border border-neutral-200 bg-white px-3 text-xs outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-50"
                        />
                      </div>

                      <div>
                        <label className="mb-1.5 block text-xs font-medium text-neutral-700">
                          Longitude
                        </label>
                        <input
                          type="number"
                          step="any"
                          value={longitude ?? ''}
                          onChange={(e) =>
                            updateManualField(
                              'longitude',
                              e.target.value === ''
                                ? null
                                : Number(e.target.value)
                            )
                          }
                          placeholder="e.g. 5.6037"
                          className="h-10 w-full rounded-xl border border-neutral-200 bg-white px-3 text-xs outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-50"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="border-t border-neutral-100" />

                {/* Map preview */}
                <div>
                  <button
                    type="button"
                    onClick={() => setShowMap(!showMap)}
                    aria-expanded={showMap}
                    className="flex w-full items-center justify-between gap-3 text-left"
                  >
                    <div className="flex items-center gap-2">
                      <Map className="h-4 w-4 text-violet-600" />
                      <span className="text-xs font-semibold text-neutral-800">
                        Map preview
                      </span>
                    </div>

                    {showMap ? (
                      <ChevronUp className="h-4 w-4 text-neutral-400" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-neutral-400" />
                    )}
                  </button>

                  {showMap && (
                    <div className="mt-3 overflow-hidden rounded-xl border border-neutral-200">
                      <MapPreview
                        location={currentLocationObject}
                        height={210}
                      />
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
