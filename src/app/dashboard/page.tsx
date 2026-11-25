import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileText,
  MapPin,
  Plus,
  Sparkles,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getUserEvents, getUserCampaigns } from "@/services";
import {
  EventManagementActions,
  CampaignManagementActions,
} from "@/components/dashboard";

export const metadata: Metadata = {
  title: "Dashboard | Attend",
  description: "Manage your events, campaigns, drafts, and analytics.",
};

type DashboardEvent = {
  id: string;
  title: string;
  cover_image: string | null;
  start_at: string | null;
  city: string | null;
  state: string | null;
  is_online: boolean | null;
  status: string | null;
};

type DashboardCampaign = {
  id: string;
  event_id: string;
  title: string;
  slug: string;
  status: string;
  views: number | null;
  generations: number | null;
  downloads: number | null;
};

function formatDate(date: string | null) {
  if (!date) return "Date TBA";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "Date TBA";
  return parsed.toLocaleDateString("en-NG", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getLocation(event: DashboardEvent) {
  if (event.is_online) return "Online event";
  if (event.city && event.state) return `${event.city}, ${event.state}`;
  return event.city || event.state || "Location TBA";
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=${encodeURIComponent("/dashboard")}`);
  }

  const [eventsRaw, campaignsRaw] = await Promise.all([
    getUserEvents(user.id, 50).catch(() => []),
    getUserCampaigns(user.id, 50).catch(() => []),
  ]);

  const events = eventsRaw as DashboardEvent[];
  const campaigns = campaignsRaw as DashboardCampaign[];

  const draftEventsCount = events.filter((e) => e.status === "draft").length;
  const draftCampaignsCount = campaigns.filter((c) => c.status === "draft").length;
  const totalDrafts = draftEventsCount + draftCampaignsCount;
  const totalGenerations = campaigns.reduce((sum, c) => sum + (c.generations || 0), 0);
  const totalDownloads = campaigns.reduce((sum, c) => sum + (c.downloads || 0), 0);

  return (
    <main className="min-h-screen bg-neutral-50 pb-24">
      <section className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-5 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <h1 className="font-serif text-3xl font-bold tracking-tight text-neutral-950">
              Dashboard<span className="text-violet-600">.</span>
            </h1>
            <p className="mt-1 text-sm text-neutral-500">
              Manage your published content, drafts, and campaign performance.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/drafts"
              className="inline-flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-50"
            >
              <FileText className="h-4 w-4 text-amber-600" />
              <span>Drafts ({totalDrafts})</span>
            </Link>

            <Link
              href="/create"
              className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-700"
            >
              <Plus className="h-4 w-4" />
              <span>Create event</span>
            </Link>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-5 py-8 sm:px-6">
        <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-2xl border border-neutral-200 bg-white p-5">
            <p className="text-xs font-medium text-neutral-400">My Events</p>
            <p className="mt-2 text-2xl font-bold tracking-tight text-neutral-900">
              {events.length}
            </p>
          </div>
          <div className="rounded-2xl border border-neutral-200 bg-white p-5">
            <p className="text-xs font-medium text-neutral-400">My Campaigns</p>
            <p className="mt-2 text-2xl font-bold tracking-tight text-neutral-900">
              {campaigns.length}
            </p>
          </div>
          <div className="rounded-2xl border border-neutral-200 bg-white p-5">
            <p className="text-xs font-medium text-neutral-400">Generations</p>
            <p className="mt-2 text-2xl font-bold tracking-tight text-neutral-900">
              {totalGenerations}
            </p>
          </div>
          <div className="rounded-2xl border border-neutral-200 bg-white p-5">
            <p className="text-xs font-medium text-neutral-400">Downloads</p>
            <p className="mt-2 text-2xl font-bold tracking-tight text-neutral-900">
              {totalDownloads}
            </p>
          </div>
        </section>

        <section id="events" className="mt-10 scroll-mt-24">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-violet-600">
                My Events
              </p>
              <h2 className="mt-1 text-2xl font-semibold tracking-tight text-neutral-900">
                Events you created
              </h2>
            </div>
            <Link
              href="/create"
              className="text-sm font-semibold text-violet-600 hover:text-violet-700"
            >
              + New event
            </Link>
          </div>

          {events.length > 0 ? (
            <div className="mt-5 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {events.map((event) => {
                const isPublished = event.status === "published";
                const eventHref = isPublished
                  ? `/events/${event.id}`
                  : `/dashboard/events/${event.id}`;

                return (
                  <article
                    key={event.id}
                    className="flex flex-col justify-between overflow-hidden rounded-2xl border border-neutral-200 bg-white transition hover:border-neutral-300 hover:shadow-md"
                  >
                    <Link href={eventHref} className="block">
                      <div className="relative aspect-[16/9] overflow-hidden bg-neutral-100">
                        {event.cover_image ? (
                          <img
                            src={event.cover_image}
                            alt={event.title}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center bg-gradient-to-br from-violet-50 via-white to-neutral-100">
                            <CalendarDays className="h-8 w-8 text-violet-200" />
                          </div>
                        )}

                        <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-semibold capitalize text-neutral-700 shadow-sm">
                          {isPublished ? (
                            <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                          ) : (
                            <Clock3 className="h-3 w-3 text-amber-500" />
                          )}
                          {event.status || "published"}
                        </span>
                      </div>

                      <div className="p-5 pb-3">
                        <h3 className="line-clamp-2 text-lg font-semibold tracking-tight text-neutral-900">
                          {event.title}
                        </h3>
                        <div className="mt-3 space-y-1.5 text-xs text-neutral-500">
                          <div className="flex items-center gap-2">
                            <CalendarDays className="h-3.5 w-3.5 shrink-0" />
                            <span>{formatDate(event.start_at)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-3.5 w-3.5 shrink-0" />
                            <span className="truncate">{getLocation(event)}</span>
                          </div>
                        </div>
                      </div>
                    </Link>

                    <div className="px-5 pb-5">
                      <EventManagementActions
                        eventId={event.id}
                        eventTitle={event.title}
                        status={event.status || "published"}
                      />
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="mt-5 rounded-2xl border border-dashed border-neutral-300 bg-white px-6 py-12 text-center">
              <CalendarDays className="mx-auto h-8 w-8 text-neutral-300" />
              <p className="mt-3 text-sm font-medium text-neutral-700">
                You have not created any events yet.
              </p>
              <Link
                href="/create"
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700"
              >
                <Plus className="h-4 w-4" />
                Create event
              </Link>
            </div>
          )}
        </section>

        <section id="campaigns" className="mt-12 scroll-mt-24">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-violet-600">
              My Campaigns
            </p>
            <h2 className="mt-1 text-2xl font-semibold tracking-tight text-neutral-900">
              Your campaigns
            </h2>
          </div>

          {campaigns.length > 0 ? (
            <div className="mt-5 divide-y divide-neutral-100 overflow-hidden rounded-2xl border border-neutral-200 bg-white">
              {campaigns.map((campaign) => (
                <div key={campaign.id} className="p-5 transition hover:bg-neutral-50/70">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                        <Sparkles className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/events/${campaign.event_id}/campaigns/${campaign.id}`}
                            className="truncate text-sm font-semibold text-neutral-900 hover:text-violet-700"
                          >
                            {campaign.title}
                          </Link>
                          <span
                            className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${
                              campaign.status === "published"
                                ? "bg-emerald-50 text-emerald-700"
                                : campaign.status === "paused"
                                  ? "bg-amber-50 text-amber-700"
                                  : "bg-neutral-100 text-neutral-600"
                            }`}
                          >
                            {campaign.status}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-neutral-500">
                          {campaign.views || 0} views · {campaign.generations || 0} generations · {campaign.downloads || 0} downloads
                        </p>
                      </div>
                    </div>

                    <CampaignManagementActions
                      eventId={campaign.event_id}
                      campaignId={campaign.id}
                      campaignTitle={campaign.title}
                      slug={campaign.slug}
                      status={campaign.status}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-5 rounded-2xl border border-dashed border-neutral-300 bg-white px-6 py-12 text-center">
              <Sparkles className="mx-auto h-8 w-8 text-neutral-300" />
              <p className="mt-3 text-sm font-medium text-neutral-700">
                No campaigns created yet.
              </p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
