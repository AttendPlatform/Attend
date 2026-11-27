"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { ArrowRight, X } from "lucide-react";
import {
  getActiveBannersAction,
  trackBannerClickAction,
  trackBannerImpressionAction,
} from "@/app/actions/promotions";
import {
  isSafeBannerDestinationUrl,
  resolveBannerImages,
  sortBannersByPriority,
} from "@/lib/validations/promotions";
import type { BannerPlacement, PromotionalBannerRecord } from "@/types/promotions";

interface PromotionalBannerSlotProps {
  placement: Exclude<BannerPlacement, "both">;
  initialBanners?: PromotionalBannerRecord[];
  sessionViewCap?: number;
}

const DISMISSED_STORAGE_KEY = "attend_dismissed_banners_v1";
const IMPRESSION_COUNT_KEY = "attend_banner_session_views_v1";
const SESSION_SYNC_EVENT = "attend:banner-session-sync";

function readSessionMap(key: string): Record<string, number> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.sessionStorage.getItem(key);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, number>;
    }
  } catch {
    return {};
  }
  return {};
}

function writeSessionMap(key: string, value: Record<string, number>) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(key, JSON.stringify(value));
    window.dispatchEvent(new Event(SESSION_SYNC_EVENT));
  } catch {
    // Ignore storage quota errors in restricted browsing contexts.
  }
}

function subscribeSessionStorage(callback: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(SESSION_SYNC_EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(SESSION_SYNC_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

export function PromotionalBannerSlot({
  placement,
  initialBanners,
  sessionViewCap = 5,
}: PromotionalBannerSlotProps) {
  const [fetchedBanners, setFetchedBanners] = useState<PromotionalBannerRecord[]>(
    []
  );
  const trackedImpressionRef = useRef<Set<string>>(new Set());

  const hydrated = useSyncExternalStore(
    subscribeSessionStorage,
    () => true,
    () => false
  );

  const dismissedRaw = useSyncExternalStore(
    subscribeSessionStorage,
    () =>
      typeof window === "undefined"
        ? "{}"
        : window.sessionStorage.getItem(DISMISSED_STORAGE_KEY) ?? "{}",
    () => "{}"
  );

  const sessionViewsRaw = useSyncExternalStore(
    subscribeSessionStorage,
    () =>
      typeof window === "undefined"
        ? "{}"
        : window.sessionStorage.getItem(IMPRESSION_COUNT_KEY) ?? "{}",
    () => "{}"
  );

  const dismissedIds = useMemo(() => {
    try {
      const parsed = JSON.parse(dismissedRaw) as unknown;
      return parsed && typeof parsed === "object" && !Array.isArray(parsed)
        ? (parsed as Record<string, number>)
        : {};
    } catch {
      return {};
    }
  }, [dismissedRaw]);

  const sessionViews = useMemo(() => {
    try {
      const parsed = JSON.parse(sessionViewsRaw) as unknown;
      return parsed && typeof parsed === "object" && !Array.isArray(parsed)
        ? (parsed as Record<string, number>)
        : {};
    } catch {
      return {};
    }
  }, [sessionViewsRaw]);

  useEffect(() => {
    if (initialBanners) {
      return;
    }

    let active = true;
    getActiveBannersAction(placement).then((res) => {
      if (active && res.ok) {
        setFetchedBanners(res.banners);
      }
    });
    return () => {
      active = false;
    };
  }, [initialBanners, placement]);

  const activeBanner = useMemo(() => {
    const banners = initialBanners ?? fetchedBanners;
    const ordered = sortBannersByPriority(banners);
    for (const banner of ordered) {
      if (!isSafeBannerDestinationUrl(banner.destination_url)) {
        continue;
      }
      const { fallbackSrc } = resolveBannerImages(banner);
      if (!fallbackSrc) {
        continue;
      }
      if (dismissedIds[banner.id]) {
        continue;
      }
      if ((sessionViews[banner.id] ?? 0) >= sessionViewCap) {
        continue;
      }
      return banner;
    }
    return null;
  }, [initialBanners, fetchedBanners, dismissedIds, sessionViews, sessionViewCap]);

  useEffect(() => {
    if (!hydrated || !activeBanner) return;
    if (trackedImpressionRef.current.has(activeBanner.id)) return;

    trackedImpressionRef.current.add(activeBanner.id);
    const currentViews = readSessionMap(IMPRESSION_COUNT_KEY);
    writeSessionMap(IMPRESSION_COUNT_KEY, {
      ...currentViews,
      [activeBanner.id]: (currentViews[activeBanner.id] ?? 0) + 1,
    });

    trackBannerImpressionAction(activeBanner.id, placement).catch(() => {});
  }, [activeBanner, hydrated, placement]);

  if (!activeBanner) {
    return null;
  }

  const { fallbackSrc, mobileSrc, desktopSrc } = resolveBannerImages(activeBanner);
  if (!fallbackSrc) {
    return null;
  }

  const destination = activeBanner.destination_url.trim();
  const isExternal = destination.startsWith("https://");

  function handleDismiss() {
    if (!activeBanner) return;
    const currentDismissed = readSessionMap(DISMISSED_STORAGE_KEY);
    writeSessionMap(DISMISSED_STORAGE_KEY, {
      ...currentDismissed,
      [activeBanner.id]: Date.now(),
    });
  }

  function handleBannerClick() {
    if (!activeBanner) return;
    trackBannerClickAction(activeBanner.id, placement).catch(() => {});
  }

  const ctaContent = (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-xs font-semibold text-neutral-950 shadow-sm transition group-hover:bg-violet-50">
      {activeBanner.cta_label?.trim() || "Learn more"}
      <ArrowRight className="h-3.5 w-3.5" />
    </span>
  );

  const innerContent = (
    <div className="relative overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-950 shadow-sm">
      <picture>
        {desktopSrc && (
          <source media="(min-width: 768px)" srcSet={desktopSrc} />
        )}
        {mobileSrc && (
          <source media="(max-width: 767px)" srcSet={mobileSrc} />
        )}
        <img
          src={fallbackSrc}
          alt={activeBanner.title}
          className="h-44 w-full object-cover opacity-75 transition-transform duration-500 group-hover:scale-[1.02] sm:h-52"
        />
      </picture>

      <div className="absolute inset-0 bg-gradient-to-r from-neutral-950/90 via-neutral-950/60 to-transparent" />

      <div className="absolute inset-0 flex flex-col justify-end p-5 sm:justify-center sm:p-8">
        <div className="max-w-xl pr-8">
          <h3 className="font-serif text-lg font-bold tracking-tight text-white sm:text-2xl">
            {activeBanner.title}
          </h3>
          {activeBanner.description && (
            <p className="mt-1.5 line-clamp-2 text-xs leading-5 text-neutral-200 sm:text-sm">
              {activeBanner.description}
            </p>
          )}
          <div className="mt-3 sm:mt-4">{ctaContent}</div>
        </div>
      </div>
    </div>
  );

  return (
    <section
      aria-label="Promotional banner"
      className={
        placement === "home"
          ? "mx-auto max-w-7xl px-5 pt-10 sm:px-6"
          : "mt-4"
      }
    >
      <div className="group relative">
        {isExternal ? (
          <a
            href={destination}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleBannerClick}
            className="block"
          >
            {innerContent}
          </a>
        ) : (
          <Link href={destination} onClick={handleBannerClick} className="block">
            {innerContent}
          </Link>
        )}

        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Dismiss promotional banner"
          className="absolute right-3 top-3 z-10 inline-flex h-8 w-8 items-center justify-center rounded-full bg-neutral-950/70 text-white backdrop-blur-sm transition hover:bg-neutral-950"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </section>
  );
}
