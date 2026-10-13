'use client'

import React, { useState } from 'react'
import {
  StructuredLocation,
  getMapEmbedUrl,
  getGoogleMapsUrl,
  getAppleMapsUrl,
  hasValidCoordinates,
  formatLocationDisplay
} from '@/lib/location'
import { MapPin, Navigation, ExternalLink, Video } from 'lucide-react'

interface MapPreviewProps {
  location: Partial<StructuredLocation>
  zoom?: number
  height?: number | string
  className?: string
  interactive?: boolean
  showDirectionsButton?: boolean
}

export function MapPreview({
  location,
  zoom = 15,
  height = 220,
  className = '',
  interactive = true,
  showDirectionsButton = true
}: MapPreviewProps) {
  const [iframeLoaded, setIframeLoaded] = useState(false)

  if (location.is_online) {
    return (
      <div
        className={`relative overflow-hidden rounded-xl border border-blue-500/20 bg-blue-500/5 p-4 text-left transition-all ${className}`}
        style={{ minHeight: typeof height === 'number' ? `${height}px` : height }}
      >
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400">
            <Video className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="inline-block rounded-full bg-blue-500/10 px-2.5 py-0.5 text-xs font-medium text-blue-400">
              Online Event
            </span>
            <p className="mt-1 text-sm font-medium text-neutral-200">
              Virtual Attendance Link
            </p>
            {location.online_url ? (
              <a
                href={location.online_url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 hover:underline"
              >
                <span className="truncate max-w-[260px]">{location.online_url}</span>
                <ExternalLink className="h-3.5 w-3.5 shrink-0" />
              </a>
            ) : (
              <p className="mt-1 text-xs text-neutral-400">
                Link will be provided to registered attendees
              </p>
            )}
          </div>
        </div>
      </div>
    )
  }

  const validCoords = hasValidCoordinates(location)
  const coords = validCoords
    ? { latitude: location.latitude as number, longitude: location.longitude as number }
    : null

  const displayText = formatLocationDisplay(location, 'compact')
  const gMapsUrl = getGoogleMapsUrl(coords, displayText)
  const aMapsUrl = getAppleMapsUrl(coords, displayText)

  return (
    <div
      className={`group relative overflow-hidden rounded-xl border border-white/10 bg-neutral-900 transition-all ${className}`}
      style={{ height: typeof height === 'number' ? `${height}px` : height }}
    >
      {coords ? (
        <>
          {!iframeLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-neutral-900/80">
              <div className="flex items-center gap-2 text-xs text-neutral-400">
                <MapPin className="h-4 w-4 animate-bounce text-blue-500" />
                <span>Loading map...</span>
              </div>
            </div>
          )}
          <iframe
            title="Location Map"
            src={getMapEmbedUrl(coords, zoom)}
            className={`h-full w-full border-0 transition-opacity duration-300 ${
              iframeLoaded ? 'opacity-100' : 'opacity-0'
            } ${interactive ? '' : 'pointer-events-none'}`}
            loading="lazy"
            onLoad={() => setIframeLoaded(true)}
          />
        </>
      ) : (
        <div className="flex h-full flex-col items-center justify-center gap-2 p-4 text-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5 text-neutral-400">
            <MapPin className="h-5 w-5" />
          </div>
          <p className="text-sm font-medium text-neutral-200">{displayText}</p>
          <p className="text-xs text-neutral-400">
            Coordinates not pinned. Click below to view on Google Maps.
          </p>
        </div>
      )}

      {showDirectionsButton && (
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-2 rounded-lg border border-white/10 bg-neutral-950/85 p-2 backdrop-blur-md">
          <div className="flex min-w-0 items-center gap-2">
            <MapPin className="h-4 w-4 shrink-0 text-blue-400" />
            <span className="truncate text-xs font-medium text-neutral-200">
              {displayText}
            </span>
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
            <a
              href={gMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Directions in Google Maps"
              className="flex items-center gap-1 rounded-md bg-white/10 px-2 py-1 text-[11px] font-medium text-neutral-200 hover:bg-white/20 transition-colors"
            >
              <Navigation className="h-3 w-3 text-blue-400" />
              <span>Google</span>
            </a>
            <a
              href={aMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Directions in Apple Maps"
              className="flex items-center gap-1 rounded-md bg-white/10 px-2 py-1 text-[11px] font-medium text-neutral-200 hover:bg-white/20 transition-colors"
            >
              <ExternalLink className="h-3 w-3 text-neutral-400" />
              <span>Apple</span>
            </a>
          </div>
        </div>
      )}
    </div>
  )
}
