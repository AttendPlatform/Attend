
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Image as ImageIcon,
  MapPin,
  Plus,
  Settings,
  Sparkles,
  UserRound,
} from "lucide-react";
import { getCurrentUserProfile, getUserEvents, getUserCampaigns } from "@/services";

type Event = {
  id: string;
  title: string;
  description: string | null;
  cover_image: string | null;
  start_at: string | null;
  city: string | null;
  state: string | null;
  is_online: boolean | null;
  status: string | null;
  event_categories:
    | {
        name: string;
        slug: string;
      }[]
    | {
        name: string;
        slug: string;
      }
    | null;
};

type Campaign = {
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

  return new Date(date).toLocaleDateString(
    undefined,
    {
      month: "short",
      day: "numeric",
      year: "numeric",
    }
  );
}

function formatDateTime(date: string | null) {
  if (!date) return "Date TBA";

  return new Date(date).toLocaleString(
    undefined,
    {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }
  );
}

function getCategory(event: Event) {
  if (Array.isArray(event.event_categories)) {
    return event.event_categories[0];
  }

  return event.event_categories;
}

function getLocation(event: Event) {
  if (event.is_online) {
    return "Online event";
  }

  if (event.city && event.state) {
    return `${event.city}, ${event.state}`;
  }

  return (
    event.city ||
    event.state ||
    "Location TBA"
  );
}

function getInitials(
  name: string
) {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (!parts.length) return "A";

  if (parts.length === 1) {
    return parts[0]
      .slice(0, 2)
      .toUpperCase();
  }

  return (
    parts[0][0] +
    parts[parts.length - 1][0]
  ).toUpperCase();
}

export default async function ProfilePage() {
  const { user, profile } = await getCurrentUserProfile();

  if (!user) {
    redirect("/login");
  }

  const profileName =
    profile?.full_name ||
    profile?.name ||
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.email?.split("@")[0] ||
    "Attend user";

  const avatarUrl =
    profile?.avatar_url ||
    user.user_metadata?.avatar_url ||
    user.user_metadata?.picture ||
    null;

  let eventsData: any[] = [];
  let campaignsData: any[] = [];
  let eventsError = false;
  let campaignsError = false;

  try {
    eventsData = await getUserEvents(user.id, 6);
  } catch {
    eventsError = true;
  }

  try {
    campaignsData = await getUserCampaigns(user.id, 6);
  } catch {
    campaignsError = true;
  }

  const events = (eventsData || []) as Event[];
  const campaigns = (campaignsData || []) as Campaign[];

  /*
   * ---------------------------------------------------------
   * STATS
   * ---------------------------------------------------------
   */

  const eventCount =
    events.length;

  const campaignCount =
    campaigns.length;

  const generationCount =
    campaigns.reduce(
      (total, campaign) =>
        total +
        (campaign.generations || 0),
      0
    );

  const downloadCount =
    campaigns.reduce(
      (total, campaign) =>
        total +
        (campaign.downloads || 0),
      0
    );

  /*
   * ---------------------------------------------------------
   * PAGE
   * ---------------------------------------------------------
   */

  return (
    <main className="min-h-screen bg-neutral-50">

      {/* =====================================================
          HEADER
          ===================================================== */}

      <header className="sticky top-0 z-40 border-b border-neutral-200 bg-white/90 backdrop-blur">

        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-6">

          <Link
            href="/"
            className="flex items-center gap-2 text-sm font-semibold text-neutral-900"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-600 text-white">
              <Sparkles className="h-4 w-4" />
            </div>

            <span>Attend</span>
          </Link>

          <div className="flex items-center gap-2">

            <Link
              href="/"
              className="hidden items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-900 sm:flex"
            >
              <ArrowLeft className="h-4 w-4" />

              Home
            </Link>

            <Link
              href="/create"
              className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-700"
            >
              <Plus className="h-4 w-4" />

              <span className="hidden sm:inline">
                Create event
              </span>

              <span className="sm:hidden">
                Create
              </span>
            </Link>

          </div>

        </div>

      </header>

      {/* =====================================================
          CONTENT
          ===================================================== */}

      <div className="mx-auto max-w-6xl px-5 py-8 sm:px-6 sm:py-10">

        {/* =================================================
            PROFILE HERO
            ================================================= */}

        <section className="overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-sm">

          <div className="h-24 bg-gradient-to-r from-violet-100 via-violet-50 to-white sm:h-32" />

          <div className="px-5 pb-6 sm:px-7 sm:pb-7">

            <div className="-mt-10 flex flex-col gap-5 sm:-mt-12 sm:flex-row sm:items-end sm:justify-between">

              {/* AVATAR + INFO */}

              <div className="flex min-w-0 items-end gap-4">

                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={profileName}
                    className="h-20 w-20 shrink-0 rounded-2xl border-4 border-white bg-neutral-100 object-cover shadow-sm sm:h-24 sm:w-24"
                  />
                ) : (
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border-4 border-white bg-violet-100 text-xl font-bold text-violet-700 shadow-sm sm:h-24 sm:w-24 sm:text-2xl">
                    {getInitials(
                      profileName
                    )}
                  </div>
                )}

                <div className="min-w-0 pb-1">

                  <h1 className="truncate text-2xl font-bold tracking-tight text-neutral-950 sm:text-3xl">
                    {profileName}
                  </h1>

                  <p className="mt-1 truncate text-sm text-neutral-500">
                    {user.email}
                  </p>

                </div>

              </div>

              {/* PROFILE ACTION */}

              <Link
                href="/profile/edit"
                className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-50"
              >
                <Settings className="h-4 w-4" />

                Edit profile
              </Link>

            </div>

            <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-neutral-400">

              <span className="flex items-center gap-1.5">
                <UserRound className="h-3.5 w-3.5" />

                {user.email}
              </span>

              <span className="flex items-center gap-1.5">
                <CalendarDays className="h-3.5 w-3.5" />

                Member since{" "}
                {formatDate(
                  user.created_at
                )}
              </span>

            </div>

          </div>

        </section>

        {/* =================================================
            STATS
            ================================================= */}

        <section className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">

          <div className="rounded-2xl border border-neutral-200 bg-white p-5">

            <p className="text-xs font-medium text-neutral-400">
              Events
            </p>

            <p className="mt-2 text-2xl font-bold tracking-tight">
              {eventCount}
            </p>

            <p className="mt-1 text-xs text-neutral-400">
              Created by you
            </p>

          </div>

          <div className="rounded-2xl border border-neutral-200 bg-white p-5">

            <p className="text-xs font-medium text-neutral-400">
              Campaigns
            </p>

            <p className="mt-2 text-2xl font-bold tracking-tight">
              {campaignCount}
            </p>

            <p className="mt-1 text-xs text-neutral-400">
              Event campaigns
            </p>

          </div>

          <div className="rounded-2xl border border-neutral-200 bg-white p-5">

            <p className="text-xs font-medium text-neutral-400">
              Generations
            </p>

            <p className="mt-2 text-2xl font-bold tracking-tight">
              {generationCount}
            </p>

            <p className="mt-1 text-xs text-neutral-400">
              Attendee graphics
            </p>

          </div>

          <div className="rounded-2xl border border-neutral-200 bg-white p-5">

            <p className="text-xs font-medium text-neutral-400">
              Downloads
            </p>

            <p className="mt-2 text-2xl font-bold tracking-tight">
              {downloadCount}
            </p>

            <p className="mt-1 text-xs text-neutral-400">
              Generated graphics
            </p>

          </div>

        </section>

        {/* =================================================
            EVENTS
            ================================================= */}

        <section className="mt-10">

          <div className="flex items-end justify-between gap-5">

            <div>
              <p className="text-sm font-semibold text-violet-600">
                MY EVENTS
              </p>

              <h2 className="mt-1 text-2xl font-semibold tracking-tight">
                Events you created
              </h2>

              <p className="mt-1 text-sm text-neutral-500">
                Manage your events and campaigns.
              </p>
            </div>

            <Link
              href="/events"
              className="hidden items-center gap-2 text-sm font-semibold text-neutral-900 transition hover:text-violet-600 sm:flex"
            >
              View all

              <ArrowRight className="h-4 w-4" />
            </Link>

          </div>

          {eventsError ? (
            <div className="mt-5 rounded-2xl border border-red-100 bg-red-50 p-5 text-sm text-red-600">
              Unable to load your events.
            </div>
          ) : events.length > 0 ? (
            <div className="mt-5 grid gap-5 md:grid-cols-2 lg:grid-cols-3">

              {events.map((event) => {

                const category =
                  getCategory(event);

                return (
                  <Link
                    key={event.id}
                    href={`/events/${event.id}`}
                    className="group block"
                  >
                    <article className="overflow-hidden rounded-2xl border border-neutral-200 bg-white transition duration-300 hover:-translate-y-1 hover:border-neutral-300 hover:shadow-xl hover:shadow-neutral-100">

                      {/* COVER */}

                      <div className="relative aspect-[16/9] overflow-hidden bg-neutral-100">

                        {event.cover_image ? (
                          <img
                            src={
                              event.cover_image
                            }
                            alt={event.title}
                            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center bg-gradient-to-br from-violet-50 via-white to-neutral-100">
                            <CalendarDays className="h-8 w-8 text-violet-200" />
                          </div>
                        )}

                        {/* STATUS */}

                        {event.status && (
                          <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-semibold capitalize text-neutral-700 shadow-sm backdrop-blur">
                            {event.status ===
                            "published" ? (
                              <CheckCircle2 className="h-3 w-3 text-green-500" />
                            ) : (
                              <Clock3 className="h-3 w-3 text-neutral-400" />
                            )}

                            {event.status}
                          </span>
                        )}

                      </div>

                      {/* DETAILS */}

                      <div className="p-5">

                        {category?.name && (
                          <span className="text-xs font-semibold text-violet-600">
                            {category.name}
                          </span>
                        )}

                        <h3 className="mt-2 line-clamp-2 text-lg font-semibold tracking-tight">
                          {event.title}
                        </h3>

                        <div className="mt-4 space-y-2 text-sm text-neutral-500">

                          <div className="flex items-center gap-2">
                            <CalendarDays className="h-4 w-4 shrink-0" />

                            {formatDate(
                              event.start_at
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 shrink-0" />

                            <span className="truncate">
                              {getLocation(
                                event
                              )}
                            </span>
                          </div>

                        </div>

                      </div>

                    </article>
                  </Link>
                );
              })}

            </div>
          ) : (
            <div className="mt-5 rounded-2xl border border-dashed border-neutral-300 bg-white px-6 py-14 text-center">

              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-50">
                <CalendarDays className="h-6 w-6 text-violet-600" />
              </div>

              <h3 className="mt-5 text-lg font-semibold">
                No events yet
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-neutral-500">
                Create your first event and start
                building an audience around it.
              </p>

              <Link
                href="/create"
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-700"
              >
                <Plus className="h-4 w-4" />

                Create your first event
              </Link>

            </div>
          )}

          <Link
            href="/events"
            className="mt-5 flex items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white px-5 py-3 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-50 sm:hidden"
          >
            View all events

            <ArrowRight className="h-4 w-4" />
          </Link>

        </section>

        {/* =================================================
            CAMPAIGNS
            ================================================= */}

        <section className="mt-12">

          <div className="flex items-end justify-between gap-5">

            <div>
              <p className="text-sm font-semibold text-violet-600">
                MY CAMPAIGNS
              </p>

              <h2 className="mt-1 text-2xl font-semibold tracking-tight">
                Your attendee campaigns
              </h2>

              <p className="mt-1 text-sm text-neutral-500">
                See how your campaigns are performing.
              </p>
            </div>

          </div>

          {campaignsError ? (
            <div className="mt-5 rounded-2xl border border-red-100 bg-red-50 p-5 text-sm text-red-600">
              Unable to load your campaigns.
            </div>
          ) : campaigns.length > 0 ? (
            <div className="mt-5 overflow-hidden rounded-2xl border border-neutral-200 bg-white">

              <div className="hidden grid-cols-[1fr_110px_110px_110px_110px] gap-4 border-b border-neutral-100 px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-neutral-400 sm:grid">
                <span>Campaign</span>
                <span>Status</span>
                <span>Views</span>
                <span>Generations</span>
                <span>Downloads</span>
              </div>

              <div className="divide-y divide-neutral-100">

                {campaigns.map(
                  (campaign) => (
                    <Link
                      key={campaign.id}
                      href={`/events/${campaign.event_id}/campaigns/${campaign.id}`}
                      className="block transition hover:bg-neutral-50"
                    >
                      <div className="grid gap-4 px-5 py-4 sm:grid-cols-[1fr_110px_110px_110px_110px] sm:items-center">

                        {/* CAMPAIGN */}

                        <div className="min-w-0">

                          <div className="flex items-center gap-3">

                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                              <Sparkles className="h-4 w-4" />
                            </div>

                            <div className="min-w-0">

                              <p className="truncate text-sm font-semibold text-neutral-900">
                                {campaign.title}
                              </p>

                              <p className="mt-0.5 truncate text-xs text-neutral-400">
                                Campaign
                              </p>

                            </div>

                          </div>

                        </div>

                        {/* STATUS */}

                        <div className="flex items-center justify-between sm:block">

                          <span className="text-[11px] text-neutral-400 sm:hidden">
                            Status
                          </span>

                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold capitalize ${
                              campaign.status ===
                              "published"
                                ? "bg-green-50 text-green-700"
                                : campaign.status ===
                                    "paused"
                                  ? "bg-amber-50 text-amber-700"
                                  : "bg-neutral-100 text-neutral-600"
                            }`}
                          >
                            {
                              campaign.status
                            }
                          </span>

                        </div>

                        {/* VIEWS */}

                        <div className="flex items-center justify-between sm:block">

                          <span className="text-[11px] text-neutral-400 sm:hidden">
                            Views
                          </span>

                          <span className="text-sm font-semibold text-neutral-900">
                            {
                              campaign.views ||
                              0
                            }
                          </span>

                        </div>

                        {/* GENERATIONS */}

                        <div className="flex items-center justify-between sm:block">

                          <span className="text-[11px] text-neutral-400 sm:hidden">
                            Generations
                          </span>

                          <span className="text-sm font-semibold text-neutral-900">
                            {
                              campaign.generations ||
                              0
                            }
                          </span>

                        </div>

                        {/* DOWNLOADS */}

                        <div className="flex items-center justify-between sm:block">

                          <span className="text-[11px] text-neutral-400 sm:hidden">
                            Downloads
                          </span>

                          <span className="text-sm font-semibold text-neutral-900">
                            {
                              campaign.downloads ||
                              0
                            }
                          </span>

                        </div>

                      </div>
                    </Link>
                  )
                )}

              </div>

            </div>
          ) : (
            <div className="mt-5 rounded-2xl border border-dashed border-neutral-300 bg-white px-6 py-14 text-center">

              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-50">
                <ImageIcon className="h-6 w-6 text-violet-600" />
              </div>

              <h3 className="mt-5 text-lg font-semibold">
                No campaigns yet
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-neutral-500">
                Create an event campaign and let
                attendees generate personalized
                event graphics.
              </p>

              <Link
                href="/create"
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-700"
              >
                <Sparkles className="h-4 w-4" />

                Create a campaign
              </Link>

            </div>
          )}

        </section>

        {/* =================================================
            QUICK ACTIONS
            ================================================= */}

        <section className="mt-12 pb-8">

          <div className="rounded-3xl bg-neutral-950 p-6 text-white sm:p-8">

            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">

              <div>

                <p className="text-sm font-semibold text-violet-400">
                  KEEP BUILDING
                </p>

                <h2 className="mt-2 text-2xl font-semibold tracking-tight">
                  Create something worth showing up for.
                </h2>

                <p className="mt-2 max-w-xl text-sm leading-6 text-neutral-400">
                  Create an event, add your campaign
                  design and turn your attendees into
                  part of the experience.
                </p>

              </div>

              <div className="flex shrink-0 flex-wrap gap-3">

                <Link
                  href="/create"
                  className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-violet-500"
                >
                  <Plus className="h-4 w-4" />

                  Create event
                </Link>

                <Link
                  href="/discover"
                  className="inline-flex items-center gap-2 rounded-xl border border-neutral-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-neutral-900"
                >
                  Discover events

                  <ArrowRight className="h-4 w-4" />
                </Link>

              </div>

            </div>

          </div>

        </section>

      </div>

    </main>
  );
}

