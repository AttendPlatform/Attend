
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock3,
  ExternalLink,
  Globe2,
  MapPin,
  Share2,
  Users,
  Image as ImageIcon,
} from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { getCategory } from "@/lib/utils/home-helpers";
import { isEventSaved } from "@/services/saved.service";
import { getUserEventAttendance } from "@/services/attendance.service";
import type { Event } from "@/types/home";

import AvatarStack from "@/components/ui/AvatarStack";
import SaveButton from "@/components/ui/SaveButton";
import ShareButton from "@/components/ui/ShareButton";
import { MapPreview } from "@/components/location/MapPreview";
import {
  ExpandableEventCover,
  EventPrimaryAction,
  CancelRsvpModal,
  MobileEventActionBar,
  EventAttendanceProvider,
} from "@/components/events";

type PageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const { data: event } = await supabase
    .from("events")
    .select("title, description, cover_image")
    .eq("id", id)
    .eq("status", "published")
    .maybeSingle();

  if (!event) {
    return {
      title: "Event Details | Attend",
    };
  }

  return {
    title: `${event.title} | Attend`,
    description: event.description || "Join this event on Attend.",
    openGraph: {
      title: event.title,
      description: event.description || "Join this event on Attend.",
      images: event.cover_image ? [event.cover_image] : [],
    },
  };
}

type EventRecord = {
  id: string;
  creator_id: string;
  category_id: string | null;
  title: string;
  slug: string;
  description: string | null;
  cover_image: string | null;
  venue_name: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  latitude: number | null;
  longitude: number | null;
  location_place_id?: string | null;
  is_online: boolean;
  online_url: string | null;
  start_at: string;
  end_at: string | null;
  status: string;
  participant_count: number;
  participation_model: string;
  participation_config: unknown;
  allow_participant_campaigns: boolean;
  event_categories?: Event["event_categories"];
};

type ProfileRecord = {
  id?: string;
  username?: string | null;
  display_name?: string | null;
  full_name?: string | null;
  avatar_url?: string | null;
  is_verified?: boolean | null;
  verified?: boolean | null;
};

type CampaignRecord = {
  id: string;
  event_id: string;
  title: string;
  slug: string;
  description: string | null;
  status: string;
  views: number;
  generations: number;
  downloads: number;
  participants: number;
  campaign_templates?: {
    id: string;
    asset_url: string | null;
    is_active: boolean;
  }[] | null;
};

function formatDate(value: string | null | undefined) {
  if (!value) return "Date to be announced";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Date to be announced";

  return new Intl.DateTimeFormat("en-NG", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

function formatTime(value: string | null | undefined) {
  if (!value) return "Time to be announced";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Time to be announced";

  return new Intl.DateTimeFormat("en-NG", {
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(date);
}

function getCalendarDate(value: Date) {
  return value.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

function getParticipationConfig(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }

  return {};
}

function getExternalUrl(config: Record<string, unknown>) {
  const candidates = [
    config.external_url,
    config.registration_url,
    config.ticket_url,
    config.url,
  ];

  for (const candidate of candidates) {
    if (typeof candidate !== "string") continue;

    try {
      const url = new URL(candidate);

      if (url.protocol === "https:" || url.protocol === "http:") {
        return url.toString();
      }
    } catch {
      // Ignore invalid URLs.
    }
  }

  return null;
}

function getCampaignImage(campaign: CampaignRecord) {
  const templates = campaign.campaign_templates ?? [];

  return templates.find((template) => template.is_active)?.asset_url ??
    templates[0]?.asset_url ??
    null;
}

export default async function PublicEventPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  // Public visitors can only access published events.
  const { data: rawEvent, error: eventError } = await supabase
    .from("events")
    .select(`
      id,
      creator_id,
      category_id,
      title,
      slug,
      description,
      cover_image,
      venue_name,
      address,
      city,
      state,
      country,
      latitude,
      longitude,
      location_place_id,
      is_online,
      online_url,
      start_at,
      end_at,
      status,
      participant_count,
      participation_model,
      participation_config,
      allow_participant_campaigns
    `)
    .eq("id", id)
    .eq("status", "published")
    .maybeSingle();

  if (eventError) {
    throw new Error("Unable to load this event. Please try again.");
  }

  if (!rawEvent) {
    notFound();
  }

  const event = rawEvent as unknown as EventRecord;

  // Fetch category, organizer, campaigns, and authenticated user in parallel.
  const [categoryResult, profileResult, campaignsResult, authResult] =
    await Promise.all([
      event.category_id
        ? supabase
            .from("event_categories")
            .select("id, name, slug")
            .eq("id", event.category_id)
            .maybeSingle()
        : Promise.resolve({ data: null, error: null }),

      supabase
        .from("profiles")
        .select("*")
        .eq("id", event.creator_id)
        .maybeSingle(),

      supabase
        .from("campaigns")
        .select(`
          id,
          event_id,
          title,
          slug,
          description,
          status,
          views,
          generations,
          downloads,
          participants,
          campaign_templates (
            id,
            asset_url,
            is_active
          )
        `)
        .eq("event_id", event.id)
        .eq("status", "published")
        .order("created_at", { ascending: false }),

      supabase.auth.getUser(),
    ]);

  const category = categoryResult.data;
  const profile = (profileResult.data ?? {}) as ProfileRecord;
  const user = authResult.data?.user ?? null;

  const [isSaved, userAttendance] = await Promise.all([
    user ? isEventSaved(event.id, user.id) : Promise.resolve(false),
    user ? getUserEventAttendance(event.id, user.id) : Promise.resolve(null),
  ]);

  const attendanceStatus =
    userAttendance && userAttendance.status !== "cancelled"
      ? (userAttendance.status as "attending" | "registered" | "ticketed")
      : "none";

  const organizerName =
    profile.display_name ||
    profile.full_name ||
    (profile.username ? `@${profile.username}` : "Event organizer");

  const organizerInitial =
    organizerName.replace(/^@/, "").trim().charAt(0).toUpperCase() || "O";

  const isVerified = Boolean(profile.is_verified ?? profile.verified);

  const locationLabel = event.is_online
    ? "Online event"
    : [
        event.venue_name,
        event.address,
        event.city,
        event.state,
        event.country,
      ]
        .filter(Boolean)
        .filter((value, index, values) => values.indexOf(value) === index)
        .join(", ") || "Location to be announced";

  const participationConfig = getParticipationConfig(
    event.participation_config
  );

  const externalUrl = getExternalUrl(participationConfig);
  const participationModel = event.participation_model.toLowerCase();

  const startDate = new Date(event.start_at);
  const validStartDate = !Number.isNaN(startDate.getTime());
  const endDate = event.end_at ? new Date(event.end_at) : null;

  const calendarEnd =
    endDate && !Number.isNaN(endDate.getTime())
      ? endDate
      : validStartDate
        ? new Date(startDate.getTime() + 2 * 60 * 60 * 1000)
        : null;

  const eventUrl = `${
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://attend-event-discovery.vercel.app"
  }/events/${event.id}`;

  const escapeCalendarText = (value: string) =>
    value
      .replace(/\\/g, "\\\\")
      .replace(/\r?\n/g, "\\n")
      .replace(/,/g, "\\,")
      .replace(/;/g, "\\;");

  const calendarContent =
    validStartDate && calendarEnd
      ? [
          "BEGIN:VCALENDAR",
          "VERSION:2.0",
          "PRODID:-//Attend//Event Calendar//EN",
          "CALSCALE:GREGORIAN",
          "BEGIN:VEVENT",
          `UID:${event.id}@attend`,
          `DTSTAMP:${getCalendarDate(new Date())}`,
          `DTSTART:${getCalendarDate(startDate)}`,
          `DTEND:${getCalendarDate(calendarEnd)}`,
          `SUMMARY:${escapeCalendarText(event.title)}`,
          `DESCRIPTION:${escapeCalendarText(event.description ?? "")}`,
          `LOCATION:${escapeCalendarText(locationLabel)}`,
          `URL:${eventUrl}`,
          "END:VEVENT",
          "END:VCALENDAR",
        ].join("\r\n")
      : null;

  const calendarUrl = validStartDate && calendarEnd
    ? `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.title)}&dates=${getCalendarDate(startDate)}/${getCalendarDate(calendarEnd)}&details=${encodeURIComponent(event.description ?? "")}&location=${encodeURIComponent(locationLabel)}&sprop=${encodeURIComponent(`website:${eventUrl}`)}`
    : null;

  const displayEvent = {
    id: event.id,
    title: event.title,
    description: event.description,
    cover_image: event.cover_image,
    start_at: event.start_at,
    city: event.city,
    state: event.state,
    is_online: event.is_online,
    event_categories: category ?? null,
  } as Event;

  const displayCategory = getCategory(displayEvent);

  // Campaigns remain separate from event attendance.
  const campaigns = (campaignsResult.data ?? []) as unknown as CampaignRecord[];
  const campaignsUnavailable = Boolean(campaignsResult.error);

  return (
    <main className="min-h-screen bg-neutral-50 pb-40 md:pb-24 lg:pb-12 text-neutral-900">
      <EventAttendanceProvider
        eventId={event.id}
        eventTitle={event.title}
        participationModel={participationModel}
        externalUrl={externalUrl}
        isLoggedIn={Boolean(user)}
        initialStatus={attendanceStatus}
        eventStatus={event.status}
      >
        <CancelRsvpModal />
        {/* Navigation */}
        <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex h-16 max-w-6xl items-center px-4 sm:px-6">
          <Link
            href="/discover"
            className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium text-neutral-600 transition hover:bg-violet-50 hover:text-violet-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Discover
          </Link>

          <div className="ml-auto text-sm font-bold tracking-tight text-violet-700">
            Attend
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 pt-5 sm:px-6 sm:pt-8">
        {/* Expandable event cover */}
        <section className="relative overflow-hidden rounded-2xl bg-violet-950 sm:rounded-3xl">
          <div className="relative">
            <ExpandableEventCover
              src={event.cover_image}
              alt={`${event.title} cover photo`}
            />

            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-black/10" />

            <div className="pointer-events-none absolute inset-x-0 bottom-0 p-5 sm:p-8 lg:p-10">
              {displayCategory?.name && (
                <span className="mb-3 inline-flex rounded-full bg-white/95 px-3 py-1.5 text-xs font-semibold text-violet-800">
                  {displayCategory.name}
                </span>
              )}

              <h1 className="max-w-4xl text-2xl font-bold leading-tight text-white sm:text-4xl lg:text-5xl">
                {event.title}
              </h1>

              <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-white/90">
                <span className="inline-flex items-center gap-2">
                  <CalendarDays className="h-4 w-4" />
                  {formatDate(event.start_at)}
                </span>

                <span className="inline-flex items-center gap-2">
                  {event.is_online ? (
                    <Globe2 className="h-4 w-4" />
                  ) : (
                    <MapPin className="h-4 w-4" />
                  )}
                  {event.is_online ? "Online event" : event.city || "Venue TBA"}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Main content */}
        <div className="mt-6 grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-8">
          <div className="min-w-0 space-y-6">
            {/* Organizer */}
            <section className="rounded-2xl border border-neutral-200 bg-white p-5 sm:p-6">
              <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-neutral-500">
                Organized by
              </p>

              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-violet-100 text-lg font-bold text-violet-700">
                  {profile.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={profile.avatar_url}
                      alt={organizerName}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    organizerInitial
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <h2 className="truncate font-semibold text-neutral-900">
                      {organizerName}
                    </h2>

                    {isVerified && (
                      <CheckCircle2
                        className="h-4 w-4 shrink-0 fill-violet-600 text-white"
                        aria-label="Verified organizer"
                      />
                    )}
                  </div>

                  {profile.username && (
                    <p className="mt-0.5 text-sm text-neutral-500">
                      @{profile.username.replace(/^@/, "")}
                    </p>
                  )}
                </div>

                <Link
                  href={`/profile/${event.creator_id}`}
                  className="shrink-0 rounded-full border border-neutral-200 px-4 py-2 text-sm font-medium transition hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700"
                >
                  View profile
                </Link>
              </div>
            </section>

            {/* Quick actions */}
            <section className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-neutral-200 bg-white p-4">
              <div>
                <h2 className="font-semibold">Share the experience</h2>
                <p className="mt-1 text-sm text-neutral-500">
                  Save this event or invite someone to join you.
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <SaveButton
                  targetId={event.id}
                  targetType="event"
                  initialSaved={isSaved}
                />
                <ShareButton
                  title={event.title}
                  path={`/events/${event.id}`}
                  sourceType="event"
                />
              </div>
            </section>

            {/* Description */}
            <section className="rounded-2xl border border-neutral-200 bg-white p-5 sm:p-6">
              <h2 className="text-xl font-bold">About this event</h2>

              {event.description ? (
                <div className="mt-4 whitespace-pre-wrap break-words text-sm leading-7 text-neutral-700 [overflow-wrap:anywhere] sm:text-base">
                  {event.description}
                </div>
              ) : (
                <p className="mt-4 text-sm leading-6 text-neutral-500">
                  The organizer has not added an event description yet.
                </p>
              )}
            </section>

            {/* Location */}
            <section className="rounded-2xl border border-neutral-200 bg-white p-5 sm:p-6">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-700">
                  {event.is_online ? (
                    <Globe2 className="h-5 w-5" />
                  ) : (
                    <MapPin className="h-5 w-5" />
                  )}
                </div>

                <div>
                  <h2 className="font-bold">
                    {event.is_online ? "Online event" : "Event location"}
                  </h2>
                  <p className="mt-0.5 text-sm text-neutral-500">
                    {event.is_online
                      ? "Join from wherever you are."
                      : "Plan your journey ahead of time."}
                  </p>
                </div>
              </div>

              <p className="mb-4 text-sm leading-6 text-neutral-700">
                {locationLabel}
              </p>

              <MapPreview
                location={{
                  venue_name: event.venue_name,
                  address: event.address,
                  city: event.city,
                  state: event.state,
                  country: event.country,
                  latitude: event.latitude,
                  longitude: event.longitude,
                  place_id: event.location_place_id ?? null,
                  is_online: event.is_online,
                  online_url: event.online_url,
                }}
                height={280}
                className="border-neutral-200"
              />
            </section>
          </div>

          {/* Event information sidebar */}
          <aside className="min-w-0 space-y-5 lg:sticky lg:top-6">
            <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm sm:p-6">
              <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                Event details
              </p>

              <div className="mt-5 flex gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-700">
                  <CalendarDays className="h-5 w-5" />
                </div>

                <div className="min-w-0">
                  <p className="font-semibold">Date</p>
                  <p className="mt-1 text-sm leading-6 text-neutral-600">
                    {formatDate(event.start_at)}
                  </p>
                </div>
              </div>

              <div className="mt-5 flex gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-700">
                  <Clock3 className="h-5 w-5" />
                </div>

                <div className="min-w-0">
                  <p className="font-semibold">Time</p>
                  <p className="mt-1 text-sm text-neutral-600">
                    {formatTime(event.start_at)}
                  </p>

                  {event.end_at && (
                    <p className="mt-1 text-sm text-neutral-500">
                      Ends {formatTime(event.end_at)}
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-5 flex gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-700">
                  <Users className="h-5 w-5" />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="font-semibold">Community</p>
                  <div className="mt-2">
                    <AvatarStack
                      eventId={event.id}
                      fallbackCount={event.participant_count}
                      label="attending"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-6 border-t border-neutral-100 pt-5">
                <EventPrimaryAction
                  eventId={event.id}
                  eventTitle={event.title}
                  participationModel={participationModel}
                  externalUrl={externalUrl}
                  isLoggedIn={Boolean(user)}
                  initialStatus={attendanceStatus}
                  eventStatus={event.status}
                />

                <p className="mt-3 text-center text-xs leading-5 text-neutral-500">
                  {participationModel === "paid"
                    ? "Ticket availability and pricing depend on the organizer's setup."
                    : participationModel === "registration"
                      ? "Registration requirements may apply."
                      : "Check the event details before making plans."}
                </p>
              </div>

              {calendarContent && calendarUrl && (
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <a
                    href={`data:text/calendar;charset=utf-8,${encodeURIComponent(calendarContent)}`}
                    download={`${event.slug || event.id}.ics`}
                    className="flex items-center justify-center gap-2 rounded-xl border border-neutral-200 px-3 py-3 text-xs font-medium text-neutral-700 transition hover:bg-neutral-50"
                  >
                    <CalendarDays className="h-4 w-4" />
                    Download .ics
                  </a>

                  <a
                    href={calendarUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 rounded-xl border border-neutral-200 px-3 py-3 text-xs font-medium text-neutral-700 transition hover:bg-neutral-50"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Google Calendar
                  </a>
                </div>
              )}
            </section>

            <section className="rounded-2xl border border-violet-100 bg-violet-50/70 p-5">
              <h2 className="font-bold text-neutral-900">
                Know someone who would love this?
              </h2>
              <p className="mt-2 text-sm leading-6 text-neutral-600">
                Share this event with friends and make the experience better
                together.
              </p>

              <div className="mt-4">
                <ShareButton
                  title={event.title}
                  path={`/events/${event.id}`}
                  sourceType="event"
                />
              </div>
            </section>
          </aside>
        </div>

        {/* Day 12: campaigns connected to this event */}
        <section className="mt-12">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-bold tracking-[0.18em] text-violet-700">
                CONNECTED CAMPAIGNS
              </p>
              <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
                Be part of the story
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-600">
                Discover campaigns connected to this event and create a graphic
                you can personalize and share.
              </p>
            </div>

            {event.allow_participant_campaigns && (
              <Link
                href={`/events/${event.id}/campaigns/create`}
                className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 text-sm font-semibold text-white transition hover:bg-violet-700"
              >
                <Share2 className="h-4 w-4" />
                Create a Campaign
              </Link>
            )}
          </div>

          {campaignsUnavailable ? (
            <div className="mt-5 rounded-2xl border border-neutral-200 bg-white p-6">
              <p className="text-sm text-neutral-600">
                Campaigns are temporarily unavailable. Please try again later.
              </p>
            </div>
          ) : campaigns.length > 0 ? (
            <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {campaigns.map((campaign) => {
                const campaignImage = getCampaignImage(campaign);

                return (
                  <article
                    key={campaign.id}
                    className="group overflow-hidden rounded-2xl border border-neutral-200 bg-white transition hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-md"
                  >
                    <Link
                      href={`/campaign/${campaign.slug}`}
                      className="block"
                      aria-label={`Explore campaign: ${campaign.title}`}
                    >
                      <div className="relative flex aspect-[16/10] items-center justify-center overflow-hidden bg-gradient-to-br from-violet-100 via-white to-violet-200">
                        {campaignImage ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={campaignImage}
                            alt={campaign.title}
                            className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                          />
                        ) : (
                          <div className="flex flex-col items-center gap-2 text-violet-700">
                            <ImageIcon className="h-8 w-8" />
                            <span className="text-xs font-medium">
                              Event campaign
                            </span>
                          </div>
                        )}

                        <span className="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-violet-700 shadow-sm">
                          Campaign
                        </span>
                      </div>

                      <div className="p-4">
                        <h3 className="line-clamp-2 font-semibold text-neutral-900 transition group-hover:text-violet-700">
                          {campaign.title}
                        </h3>

                        {campaign.description && (
                          <p className="mt-2 line-clamp-3 text-sm leading-6 text-neutral-600">
                            {campaign.description}
                          </p>
                        )}

                        <div className="mt-4 flex items-center justify-between border-t border-neutral-100 pt-3 text-xs text-neutral-500">
                          <span>
                            {campaign.participants ?? 0} participants
                          </span>
                          <span className="inline-flex items-center gap-1 font-semibold text-violet-700">
                            Explore
                            <ExternalLink className="h-3.5 w-3.5" />
                          </span>
                        </div>
                      </div>
                    </Link>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="mt-5 rounded-2xl border border-dashed border-neutral-300 bg-white px-5 py-10 text-center sm:px-8">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-50 text-violet-700">
                <Share2 className="h-5 w-5" />
              </div>

              <h3 className="mt-4 font-semibold">
                No published campaigns yet
              </h3>

              <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-neutral-500">
                {event.allow_participant_campaigns
                  ? "Be the first to create a campaign connected to this event."
                  : "The organizer has not published a campaign for this event yet."}
              </p>

              {event.allow_participant_campaigns && (
                <Link
                  href={`/events/${event.id}/campaigns/create`}
                  className="mt-5 inline-flex h-11 items-center justify-center rounded-xl bg-violet-600 px-5 text-sm font-semibold text-white transition hover:bg-violet-700"
                >
                  Create the first campaign
                </Link>
              )}
            </div>
          )}
        </section>
      </div>

      <MobileEventActionBar startDate={event.start_at} />
    </EventAttendanceProvider>
  </main>
);
}
