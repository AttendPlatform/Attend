"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
  } catch {
    // Ignore storage quota errors in restricted browsing contexts.
  }
}

export function PromotionalBannerSlot({
  placement,
  initialBanners,
  sessionViewCap = 5,
}: PromotionalBannerSlotProps) {
  const [banners, setBanners] = useState<PromotionalBannerRecord[]>(
    initialBanners ?? []
  );
  const [dismissedIds, setDismissedIds] = useState<Record<string, number>>({});
  const [sessionViews, setSessionViews] = useState<Record<string, number>>({});
  const [hydrated, setHydrated] = useState(false);
  const trackedImpressionRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    setDismissedIds(readSessionMap(DISMISSED_STORAGE_KEY));
    setSessionViews(readSessionMap(IMPRESSION_COUNT_KEY));
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (initialBanners) {
      setBanners(initialBanners);
      return;
    }

    let active = true;
    getActiveBannersAction(placement).then((res) => {
      if (active && res.ok) {
        setBanners(res.banners);
      }
    });
    return () => {
      active = false;
    };
  }, [initialBanners, placement]);

  const activeBanner = useMemo(() => {
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
  }, [banners, dismissedIds, sessionViews, sessionViewCap]);

  useEffect(() => {
    if (!hydrated || !activeBanner) return;
    if (trackedImpressionRef.current.has(activeBanner.id)) return;

    trackedImpressionRef.current.add(activeBanner.id);
    const updatedCounts = {
      ...readSessionMap(IMPRESSION_COUNT_KEY),
      [activeBanner.id]: (readSessionMap(IMPRESSION_COUNT_KEY)[activeBanner.id] ?? 0) + 1,
    };
    writeSessionMap(IMPRESSION_COUNT_KEY, updatedCounts);

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
    const next = { ...dismissedIds, [activeBanner.id]: Date.now() };
    setDismissedIds(next);
    writeSessionMap(DISMISSED_STORAGE_KEY, next);
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
        {/* eslint-disable-next-line @next/next/no-img-element */}
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
