"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, CalendarDays, MapPin, Sparkles } from "lucide-react";
import {
  getActiveFeaturedEventsAction,
  recordFeaturedEventMetricAction,
} from "@/app/actions/promotions";
import { OptimizedImage } from "@/components/ui/OptimizedImage";
import { sanitizeNotificationImageUrl } from "@/lib/notifications/visual-rules";
import {
  FEATURED_TRACKED_VIEWS_KEY,
  readPromotionSessionMap,
  writePromotionSessionMap,
} from "@/lib/utils/promotion-session";
import { sortFeaturedEventsByPriority } from "@/lib/validations/promotions";
import type {
  FeaturedEventPriority,
  FeaturedEventWithEvent,
} from "@/types/promotions";

interface FeaturedEventsSectionProps {
  placement: "home" | "discover";
  initialItems?: FeaturedEventWithEvent[];
  maxItems?: number;
}

const PRIORITY_BADGE: Record<FeaturedEventPriority, string> = {
  campaign_level: "Campaign Spotlight",
  high_priority: "Featured on Attend",
  standard: "Featured Event",
};

function formatFeaturedDate(startAt: string | null | undefined): string {
  if (!startAt) return "Date TBA";
  const parsed = new Date(startAt);
  if (Number.isNaN(parsed.getTime())) return "Date TBA";
  return parsed.toLocaleDateString("en-NG", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function FeaturedEventsSection({
  placement,
  initialItems,
  maxItems = 3,
}: FeaturedEventsSectionProps) {
  const [fetchedItems, setFetchedItems] = useState<FeaturedEventWithEvent[]>(
    []
  );
  const trackedViewsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (initialItems) {
      return;
    }

    let active = true;
    getActiveFeaturedEventsAction(placement).then((res) => {
      if (active && res.ok) {
        setFetchedItems(res.items);
      }
    });
    return () => {
      active = false;
    };
  }, [initialItems, placement]);

  const orderedItems = useMemo(() => {
    const items = initialItems ?? fetchedItems;
    const valid = items.filter((item) => Boolean(item.event));
    return sortFeaturedEventsByPriority(valid).slice(0, maxItems);
  }, [initialItems, fetchedItems, maxItems]);

  useEffect(() => {
    const sessionTracked = readPromotionSessionMap(FEATURED_TRACKED_VIEWS_KEY);
    let updated = false;

    for (const item of orderedItems) {
      if (trackedViewsRef.current.has(item.id) || sessionTracked[item.id]) {
        continue;
      }
      trackedViewsRef.current.add(item.id);
      sessionTracked[item.id] = Date.now();
      updated = true;
      recordFeaturedEventMetricAction(item.id, "view").catch(() => {});
    }

    if (updated) {
      writePromotionSessionMap(FEATURED_TRACKED_VIEWS_KEY, sessionTracked);
    }
  }, [orderedItems]);

  if (orderedItems.length === 0) {
    return null;
  }

  return (
    <section
      aria-label="Featured events"
      className={
        placement === "home"
          ? "mx-auto max-w-7xl px-5 pt-12 sm:px-6"
          : "mt-5 mb-2"
      }
    >
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <p className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-violet-700">
            <Sparkles className="h-3.5 w-3.5" />
            Featured on Attend
          </p>
          <h2 className="mt-1 font-serif text-xl font-bold tracking-tight text-neutral-950 sm:text-2xl">
            Curated spotlights
          </h2>
        </div>
        <Link
          href="/discover"
          className="hidden items-center gap-1.5 text-xs font-semibold text-neutral-700 transition hover:text-violet-700 sm:inline-flex"
        >
          Browse all
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {orderedItems.map((item) => {
          const event = item.event!;
          const imageSrc =
            sanitizeNotificationImageUrl(item.promotional_image_url) ??
            sanitizeNotificationImageUrl(event.cover_image) ??
            event.cover_image;
          const locationText = event.is_online
            ? "Online event"
            : [event.city, event.state].filter(Boolean).join(", ") ||
              event.venue_name ||
              "Location TBA";

          return (
            <article
              key={item.id}
              className="group flex flex-col overflow-hidden rounded-2xl border border-violet-200/80 bg-white shadow-sm transition-all duration-300 hover:border-violet-400 hover:shadow-md"
            >
              <Link
                href={`/events/${event.id}`}
                onClick={() => {
                  recordFeaturedEventMetricAction(item.id, "click").catch(() => {});
                }}
                className="relative block aspect-[16/10] overflow-hidden bg-gradient-to-br from-violet-700 via-violet-600 to-indigo-700"
              >
                {imageSrc ? (
                  <OptimizedImage
                    src={imageSrc}
                    alt={event.title}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-white/80">
                    <Sparkles className="h-8 w-8" />
                  </div>
                )}

                <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-neutral-950/80 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-white backdrop-blur-sm">
                  <Sparkles className="h-3 w-3 text-violet-300" />
                  {PRIORITY_BADGE[item.priority]}
                </span>
              </Link>

              <div className="flex flex-1 flex-col p-4">
                {event.category_name && (
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-violet-700">
                    {event.category_name}
                  </span>
                )}

                <Link
                  href={`/events/${event.id}`}
                  onClick={() => {
                    recordFeaturedEventMetricAction(item.id, "click").catch(() => {});
                  }}
                  className="mt-1"
                >
                  <h3 className="line-clamp-2 font-serif text-base font-bold leading-snug text-neutral-950 group-hover:text-violet-700">
                    {event.title}
                  </h3>
                </Link>

                {(item.promotional_message || event.description) && (
                  <p className="mt-1.5 line-clamp-2 text-xs leading-5 text-neutral-500">
                    {item.promotional_message || event.description}
                  </p>
                )}

                <div className="mt-3 space-y-1 text-xs text-neutral-500">
                  <div className="flex items-center gap-1.5">
                    <CalendarDays className="h-3.5 w-3.5 shrink-0 text-neutral-400" />
                    <span className="truncate">{formatFeaturedDate(event.start_at)}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 shrink-0 text-neutral-400" />
                    <span className="truncate">{locationText}</span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-neutral-100">
                  <Link
                    href={`/events/${event.id}`}
                    onClick={() => {
                      recordFeaturedEventMetricAction(item.id, "click").catch(() => {});
                    }}
                    className="inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-violet-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-violet-700"
                  >
                    Explore event
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
