"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Bookmark, CalendarDays, CircleUser, Image as ImageIcon, Search } from "lucide-react";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { createClient } from "@/lib/supabase/client";
import { getDiscoverData, type DiscoverResults } from "@/services/discover.service";
import { parseDiscoverFiltersFromSearchParams, serializeDiscoverFiltersToSearchParams, type DiscoverFilters } from "@/types/discover";
import { DiscoverFilterBar } from "@/components/discover/DiscoverFilterBar";
import { DiscoverCardSkeletons } from "@/components/discover/DiscoverCardSkeletons";
import { EventCard } from "@/components/home/EventCard";
import { CampaignCard } from "@/components/campaigns/CampaignCard";

const EMPTY_RESULTS: DiscoverResults = { events: [], campaigns: [], categories: [] };

export default function DiscoverHub() {
  const [filters, setFilters] = useState<DiscoverFilters>({ dateFilter: "all", sortBy: "upcoming" });
  const [results, setResults] = useState<DiscoverResults>(EMPTY_RESULTS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setFilters(parseDiscoverFiltersFromSearchParams(new URLSearchParams(window.location.search)));
    const handlePopState = () => setFilters(parseDiscoverFiltersFromSearchParams(new URLSearchParams(window.location.search)));
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const handleFiltersChange = useCallback((nextFilters: DiscoverFilters) => {
    setFilters(nextFilters);
    const params = serializeDiscoverFiltersToSearchParams(nextFilters);
    const query = params.toString();
    const nextUrl = `${window.location.pathname}${query ? `?${query}` : ""}${window.location.hash}`;
    window.history.replaceState(window.history.state, "", nextUrl);
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    getDiscoverData(createClient(), filters)
      .then((data) => { if (!cancelled) setResults(data); })
      .catch((cause: unknown) => {
        if (!cancelled) setError(cause instanceof Error ? cause.message : "Unable to load Discover data.");
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [filters]);

  const hasFilters = Boolean(
    filters.search ||
    filters.city ||
    filters.isOnline ||
    filters.isFree ||
    filters.nearMe ||
    filters.categoryId ||
    (filters.dateFilter && filters.dateFilter !== "all")
  );
  const clearFilters = () => handleFiltersChange({ dateFilter: "all", sortBy: "upcoming" });

  return (
    <main className="min-h-screen bg-neutral-50/40 pb-24 md:pb-16">
      {/* MOBILE TOP BAR (Figma Discover / Default) */}
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-neutral-100 bg-white/95 px-5 py-3.5 backdrop-blur-md md:hidden">
        <h1 className="font-serif text-2xl font-bold tracking-tight text-neutral-950">
          Discover<span className="text-violet-600">.</span>
        </h1>
        <div className="flex items-center gap-3 text-neutral-700">
          <Link
            href="/saved"
            className="rounded-full p-1.5 transition hover:bg-neutral-100 hover:text-neutral-950"
            aria-label="Saved events and campaigns"
          >
            <Bookmark className="h-5 w-5" />
          </Link>
          <NotificationBell />
          <Link
            href="/profile"
            className="rounded-full p-1.5 transition hover:bg-neutral-100 hover:text-neutral-950"
            aria-label="User profile"
          >
            <CircleUser className="h-5 w-5" />
          </Link>
        </div>
      </header>

      {/* DESKTOP DISCOVER TITLE BANNER */}
      <section className="hidden border-b border-neutral-100 bg-white md:block">
        <div className="mx-auto max-w-7xl px-6 py-8">
          <h1 className="font-serif text-3xl font-bold tracking-tight text-neutral-950 lg:text-4xl">
            Discover<span className="text-violet-600">.</span>
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            Find upcoming events and join connected campaigns near you.
          </p>
        </div>
      </section>

      {/* MAIN CONTENT WRAPPER */}
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 sm:py-6">
        <DiscoverFilterBar
          filters={filters}
          onFiltersChange={handleFiltersChange}
          categories={results.categories}
          isPending={loading}
        />

        {error && (
          <div role="alert" className="mt-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* SECTION 1: EVENTS NEAR YOU (2-COLUMN GRID) */}
        <section className="mt-8" aria-busy={loading}>
          <div className="mb-4">
            <h2 className="font-serif text-xl font-bold tracking-tight text-neutral-950 sm:text-2xl">
              Events near you
            </h2>
          </div>

          {loading ? (
            <DiscoverCardSkeletons kind="event" />
          ) : results.events.length ? (
            <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {results.events.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-neutral-200 bg-white px-6 py-10 text-center">
              <CalendarDays className="mx-auto h-7 w-7 text-neutral-300" />
              <h3 className="mt-3 text-sm font-semibold text-neutral-900">No events found</h3>
              <p className="mt-1 text-xs text-neutral-500">Try a different search or loosen your filters.</p>
            </div>
          )}
        </section>

        {/* SECTION 2: JOIN CAMPAIGNS (HORIZONTAL CARDS) */}
        <section className="mt-10" aria-busy={loading}>
          <div className="mb-4">
            <h2 className="font-serif text-xl font-bold tracking-tight text-neutral-950 sm:text-2xl">
              Join Campaigns
            </h2>
          </div>

          {loading ? (
            <DiscoverCardSkeletons kind="campaign" />
          ) : results.campaigns.length ? (
            <div className="flex flex-col gap-4">
              {results.campaigns.map((campaign) => (
                <CampaignCard
                  key={campaign.id}
                  campaign={campaign}
                  layout="horizontal"
                  ctaVariant="participate"
                />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-neutral-200 bg-white px-6 py-10 text-center">
              <ImageIcon className="mx-auto h-7 w-7 text-neutral-300" />
              <h3 className="mt-3 text-sm font-semibold text-neutral-900">No campaigns found</h3>
              <p className="mt-1 text-xs text-neutral-500">Published campaigns connected to matching events will appear here.</p>
            </div>
          )}
        </section>

        {!loading && results.events.length === 0 && results.campaigns.length === 0 && hasFilters && (
          <div className="mt-8 text-center">
            <button
              type="button"
              onClick={clearFilters}
              className="rounded-full bg-neutral-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-neutral-800"
            >
              <Search className="mr-2 inline h-4 w-4" />
              Clear all filters
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
