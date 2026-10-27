"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, CalendarDays, Image as ImageIcon, MapPin, Search, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getDiscoverData, type DiscoverCampaign, type DiscoverEvent, type DiscoverResults } from "@/services/discover.service";
import { parseDiscoverFiltersFromSearchParams, serializeDiscoverFiltersToSearchParams, type DiscoverFilters } from "@/types/discover";
import { DiscoverFilterBar } from "@/components/discover/DiscoverFilterBar";
import { DiscoverCardSkeletons } from "@/components/discover/DiscoverCardSkeletons";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-NG", { weekday: "short", month: "short", day: "numeric", year: "numeric" }).format(new Date(value));
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat("en-NG", { hour: "numeric", minute: "2-digit" }).format(new Date(value));
}

function getLocation(event: DiscoverEvent) {
  if (event.is_online) return "Online event";
  return [event.city, event.state].filter(Boolean).join(", ") || event.venue_name || "Location TBA";
}

function EventCard({ event }: { event: DiscoverEvent }) {
  return (
    <article className="group overflow-hidden rounded-2xl border border-neutral-200 bg-white transition hover:-translate-y-1 hover:shadow-xl hover:shadow-neutral-100">
      <Link href={`/events/${event.id}`} className="block">
        <div className="relative aspect-[16/10] overflow-hidden bg-neutral-100">
          {event.cover_image ? <img src={event.cover_image} alt="" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" /> : <div className="flex h-full items-center justify-center bg-gradient-to-br from-violet-50 to-neutral-100"><CalendarDays className="h-8 w-8 text-violet-300" /></div>}
          {event.category?.name && <span className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-[11px] font-semibold text-violet-700 backdrop-blur">{event.category.name}</span>}
        </div>
      </Link>
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <Link href={`/events/${event.id}`} className="min-w-0"><h3 className="line-clamp-2 text-lg font-semibold tracking-tight text-neutral-950">{event.title}</h3></Link>
          <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-neutral-300 transition group-hover:translate-x-1 group-hover:text-violet-600" />
        </div>
        {event.organizerName && <p className="mt-1 truncate text-xs text-neutral-500">Hosted by {event.organizerName}</p>}
        <div className="mt-4 space-y-2.5 text-sm text-neutral-500">
          <div className="flex items-center gap-2"><CalendarDays className="h-4 w-4 shrink-0" /><span>{formatDate(event.start_at)} · {formatTime(event.start_at)}</span></div>
          <div className="flex items-center gap-2"><MapPin className="h-4 w-4 shrink-0" /><span className="truncate">{getLocation(event)}{event.distanceKm != null ? ` · ${event.distanceKm.toFixed(1)} km` : ""}</span></div>
        </div>
        <div className="mt-5 flex items-center justify-between border-t border-neutral-100 pt-4 text-xs text-neutral-400"><span>{event.participant_count} attending</span><Link href={`/events/${event.id}`} className="font-semibold text-violet-600">View event</Link></div>
      </div>
    </article>
  );
}

function CampaignCard({ campaign }: { campaign: DiscoverCampaign }) {
  const image = campaign.template?.asset_url || campaign.event?.cover_image;
  return (
    <article className="group overflow-hidden rounded-2xl border border-neutral-200 bg-white transition hover:-translate-y-1 hover:shadow-xl hover:shadow-neutral-100">
      <Link href={`/campaign/${campaign.slug}?source=discover`} className="block">
        <div className="relative aspect-[16/10] overflow-hidden bg-neutral-100">
          {image ? <img src={image} alt="" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" /> : <div className="flex h-full items-center justify-center"><ImageIcon className="h-8 w-8 text-neutral-300" /></div>}
          <span className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-[11px] font-semibold text-violet-700 backdrop-blur">Create your version</span>
        </div>
      </Link>
      <div className="p-5">
        <span className="text-xs font-semibold text-violet-600">{campaign.event?.category?.name || "Campaign"}</span>
        <Link href={`/campaign/${campaign.slug}?source=discover`}><h3 className="mt-2 line-clamp-2 text-lg font-semibold tracking-tight text-neutral-950">{campaign.title}</h3></Link>
        {campaign.event && <p className="mt-1 truncate text-sm text-neutral-500">For: {campaign.event.title}</p>}
        <div className="mt-4 flex items-center justify-between text-xs text-neutral-400"><span>{campaign.participants ?? 0} participating</span><span>{campaign.generations ?? 0} versions created</span></div>
        <Link href={`/campaign/${campaign.slug}?source=discover`} className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-violet-700">Create your version <ArrowRight className="h-4 w-4" /></Link>
      </div>
    </article>
  );
}

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

  const hasFilters = Boolean(filters.search || filters.city || filters.isOnline || filters.nearMe || filters.categoryId || (filters.dateFilter && filters.dateFilter !== "all"));
  const clearFilters = () => handleFiltersChange({ dateFilter: "all", sortBy: "upcoming" });

  return (
    <main className="min-h-screen bg-white">
      <section className="border-b border-neutral-100">
        <div className="mx-auto max-w-7xl px-5 py-14 sm:px-6 md:py-20">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-violet-50 px-3 py-1.5 text-xs font-semibold text-violet-700"><Sparkles className="h-3.5 w-3.5" />Discover</div>
            <h1 className="mt-5 text-4xl font-semibold tracking-tight text-neutral-950 sm:text-5xl lg:text-6xl">Find something worth <span className="block text-violet-600">showing up for.</span></h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-neutral-500 sm:text-lg">Discover events happening around you and campaigns you can be part of.</p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-10 sm:px-6 sm:py-14">
        <DiscoverFilterBar filters={filters} onFiltersChange={handleFiltersChange} categories={results.categories} isPending={loading} />
        {error && <div role="alert" className="mt-6 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

        <section className="mt-10" aria-busy={loading}>
          <div className="mb-5"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-violet-600">EVENTS</p><h2 className="mt-2 text-2xl font-semibold tracking-tight">Upcoming events</h2><p className="mt-1 text-sm text-neutral-500">Find events worth attending.</p></div>
          {loading ? <DiscoverCardSkeletons kind="event" /> : results.events.length ? <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{results.events.map((event) => <EventCard key={event.id} event={event} />)}</div> : <div className="rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 px-6 py-12 text-center"><CalendarDays className="mx-auto h-7 w-7 text-neutral-300" /><h3 className="mt-4 text-sm font-semibold text-neutral-900">No events found</h3><p className="mt-1 text-sm text-neutral-500">Try a different search or loosen your filters.</p></div>}
        </section>

        <section className="mt-14" aria-busy={loading}>
          <div className="mb-5"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-violet-600">CAMPAIGNS</p><h2 className="mt-2 text-2xl font-semibold tracking-tight">Campaigns you can join</h2><p className="mt-1 text-sm text-neutral-500">Create and share your version of an event campaign.</p></div>
          {loading ? <DiscoverCardSkeletons kind="campaign" /> : results.campaigns.length ? <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{results.campaigns.map((campaign) => <CampaignCard key={campaign.id} campaign={campaign} />)}</div> : <div className="rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 px-6 py-12 text-center"><ImageIcon className="mx-auto h-7 w-7 text-neutral-300" /><h3 className="mt-4 text-sm font-semibold text-neutral-900">No campaigns found</h3><p className="mt-1 text-sm text-neutral-500">Published campaigns connected to matching events will appear here.</p></div>}
        </section>

        {!loading && results.events.length === 0 && results.campaigns.length === 0 && hasFilters && <div className="mt-8 text-center"><button type="button" onClick={clearFilters} className="rounded-full bg-neutral-950 px-5 py-2.5 text-sm font-semibold text-white hover:bg-neutral-800"><Search className="mr-2 inline h-4 w-4" />Clear all filters</button></div>}
      </section>
    </main>
  );
}
