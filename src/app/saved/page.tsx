import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { Bookmark, CalendarDays, Sparkles, Compass } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getSavedEvents, getSavedCampaigns } from "@/services/saved.service";
import { EventCard } from "@/components/home/EventCard";
import { CampaignCard } from "@/components/campaigns/CampaignCard";
import type { Event } from "@/types/home";
import type { CampaignCardData } from "@/types/campaigns";

export const metadata: Metadata = {
  title: "Saved Items | Attend",
  description: "View and manage your bookmarked events and connected campaigns.",
};

interface PageProps {
  searchParams: Promise<{ tab?: string }>;
}

export default async function SavedHubPage({ searchParams }: PageProps) {
  const { tab = "events" } = await searchParams;
  const activeTab = tab === "campaigns" ? "campaigns" : "events";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=${encodeURIComponent("/saved")}`);
  }

  const [savedEvents, savedCampaigns] = await Promise.all([
    getSavedEvents(user.id),
    getSavedCampaigns(user.id),
  ]);

  const eventsCount = savedEvents.length;
  const campaignsCount = savedCampaigns.length;

  return (
    <main className="min-h-screen bg-neutral-50/50 pb-24">
      {/* HEADER BANNER */}
      <section className="border-b border-neutral-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
          <div className="flex items-center gap-2">
            <h1 className="font-serif text-3xl font-bold tracking-tight text-neutral-950 sm:text-4xl">
              Saved<span className="text-violet-600">.</span>
            </h1>
          </div>
          <p className="mt-1.5 text-sm text-neutral-500">
            Keep track of the events and campaigns you have bookmarked.
          </p>

          {/* DUAL TAB SWITCHER */}
          <div className="mt-6 flex gap-2">
            <Link
              href="/saved?tab=events"
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition ${
                activeTab === "events"
                  ? "bg-neutral-950 text-white shadow-sm"
                  : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
              }`}
            >
              <CalendarDays className="h-3.5 w-3.5" />
              <span>Events</span>
              <span
                className={`rounded-full px-1.5 py-0.5 text-[10px] ${
                  activeTab === "events" ? "bg-white/20 text-white" : "bg-neutral-200 text-neutral-700"
                }`}
              >
                {eventsCount}
              </span>
            </Link>

            <Link
              href="/saved?tab=campaigns"
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition ${
                activeTab === "campaigns"
                  ? "bg-neutral-950 text-white shadow-sm"
                  : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
              }`}
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Campaigns</span>
              <span
                className={`rounded-full px-1.5 py-0.5 text-[10px] ${
                  activeTab === "campaigns" ? "bg-white/20 text-white" : "bg-neutral-200 text-neutral-700"
                }`}
              >
                {campaignsCount}
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* CONTENT GRID */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        {activeTab === "events" && (
          <>
            {eventsCount > 0 ? (
              <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {savedEvents.map((event) => (
                  <EventCard key={(event as unknown as Event).id} event={event as unknown as Event} />
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-neutral-200 bg-white px-6 py-16 text-center shadow-sm">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-neutral-100 text-neutral-400">
                  <Bookmark className="h-6 w-6" />
                </div>
                <h3 className="mt-4 font-serif text-lg font-bold text-neutral-900">
                  No saved events yet
                </h3>
                <p className="mx-auto mt-1 max-w-sm text-xs text-neutral-500">
                  When you bookmark events from the home or discover feed, they will appear here.
                </p>
                <div className="mt-6">
                  <Link
                    href="/discover"
                    className="inline-flex items-center gap-2 rounded-full bg-violet-600 px-5 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-violet-700"
                  >
                    <Compass className="h-4 w-4" />
                    <span>Explore Events</span>
                  </Link>
                </div>
              </div>
            )}
          </>
        )}

        {activeTab === "campaigns" && (
          <>
            {campaignsCount > 0 ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {savedCampaigns.map((campaign) => (
                  <CampaignCard
                    key={(campaign as unknown as CampaignCardData).id}
                    campaign={campaign as unknown as CampaignCardData}
                    ctaVariant="participate"
                    isSaved={true}
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-neutral-200 bg-white px-6 py-16 text-center shadow-sm">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-neutral-100 text-neutral-400">
                  <Sparkles className="h-6 w-6" />
                </div>
                <h3 className="mt-4 font-serif text-lg font-bold text-neutral-900">
                  No saved campaigns yet
                </h3>
                <p className="mx-auto mt-1 max-w-sm text-xs text-neutral-500">
                  Bookmark campaigns to easily find and create your personalized badges and flyers.
                </p>
                <div className="mt-6">
                  <Link
                    href="/discover"
                    className="inline-flex items-center gap-2 rounded-full bg-violet-600 px-5 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-violet-700"
                  >
                    <Compass className="h-4 w-4" />
                    <span>Discover Campaigns</span>
                  </Link>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
