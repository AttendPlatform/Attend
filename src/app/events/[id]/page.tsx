import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  Eye,
  ImageIcon,
  MapPin,
  Plus,
  Sparkles,
  Users,
} from "lucide-react";
import { getEventById, getCampaignsByEventId } from "@/services";

type Campaign = {
  id: string;
  event_id: string;
  title: string;
  description: string | null;
  slug: string;
  status: "draft" | "published" | "paused" | "archived";
  views: number;
  generations: number;
  downloads: number;
  participants: number;
  created_at: string;
};

export default async function EventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [event, campaigns] = await Promise.all([
    getEventById(id),
    getCampaignsByEventId(id),
  ]);

  if (!event) {
    notFound();
  }

  const eventCampaigns = (campaigns || []) as Campaign[];

  const category = Array.isArray(event.event_categories)
    ? event.event_categories[0]
    : event.event_categories;

  /*
   * ---------------------------------------------------------
   * STATUS STYLES
   * ---------------------------------------------------------
   */

  function getStatusStyles(
    status: Campaign["status"]
  ) {
    switch (status) {
      case "published":
        return "bg-green-50 text-green-700";

      case "paused":
        return "bg-amber-50 text-amber-700";

      case "archived":
        return "bg-neutral-100 text-neutral-500";

      default:
        return "bg-neutral-100 text-neutral-600";
    }
  }

  function getStatusLabel(
    status: Campaign["status"]
  ) {
    switch (status) {
      case "published":
        return "Published";

      case "paused":
        return "Paused";

      case "archived":
        return "Archived";

      default:
        return "Draft";
    }
  }

  return (
    <main className="min-h-screen bg-neutral-50 px-5 py-8 sm:px-6">
      <div className="mx-auto max-w-5xl">

        {/* BACK */}

        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-neutral-500 transition hover:text-neutral-950"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>

        {/* EVENT */}

        <div className="mt-8 overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-sm">

          {/* COVER */}

          <div className="relative aspect-[3/1] overflow-hidden bg-gradient-to-br from-violet-100 via-white to-violet-200">
            {event.cover_image ? (
              <img
                src={event.cover_image}
                alt={event.title}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <span className="text-sm font-medium text-violet-400">
                  No cover image
                </span>
              </div>
            )}
          </div>

          {/* DETAILS */}

          <div className="p-6 sm:p-8">
            <div className="flex flex-col justify-between gap-7 lg:flex-row">

              <div className="min-w-0">

                {category?.name && (
                  <span className="text-sm font-semibold text-violet-600">
                    {category.name}
                  </span>
                )}

                <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
                  {event.title}
                </h1>

                {event.description && (
                  <p className="mt-4 max-w-2xl leading-7 text-neutral-500">
                    {event.description}
                  </p>
                )}

                <div className="mt-6 flex flex-wrap gap-x-6 gap-y-3 text-sm text-neutral-500">

                  {event.start_at && (
                    <span className="flex items-center gap-2">
                      <CalendarDays className="h-4 w-4" />

                      {new Date(
                        event.start_at
                      ).toLocaleString(undefined, {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </span>
                  )}

                  {event.is_online ? (
                    <span className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Online event
                    </span>
                  ) : (
                    event.city && (
                      <span className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        {event.city}
                        {event.state
                          ? `, ${event.state}`
                          : ""}
                      </span>
                    )
                  )}

                </div>
              </div>

              {/* CREATE CAMPAIGN */}

              <Link
                href={`/events/${event.id}/campaigns/create`}
                className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 text-sm font-semibold text-white transition hover:bg-violet-700"
              >
                <Plus className="h-4 w-4" />
                Create campaign
              </Link>

            </div>
          </div>
        </div>

        {/* CAMPAIGNS */}

        <section className="mt-10">

          <div className="flex items-end justify-between gap-4">

            <div>
              <p className="text-sm font-semibold text-violet-600">
                CAMPAIGNS
              </p>

              <h2 className="mt-1 text-2xl font-semibold tracking-tight">
                Your event campaigns
              </h2>

              <p className="mt-1 text-sm text-neutral-500">
                Manage attendee DP campaigns for this event.
              </p>
            </div>

            {eventCampaigns.length > 0 && (
              <Link
                href={`/events/${event.id}/campaigns/create`}
                className="hidden items-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-semibold text-neutral-700 shadow-sm transition hover:bg-neutral-50 sm:inline-flex"
              >
                <Plus className="h-4 w-4" />
                New campaign
              </Link>
            )}

          </div>

          {eventCampaigns.length === 0 ? (

            /* EMPTY STATE */

            <div className="mt-5 rounded-2xl border border-dashed border-neutral-300 bg-white p-10 text-center">

              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-violet-50">
                <Sparkles className="h-5 w-5 text-violet-600" />
              </div>

              <h3 className="mt-4 font-semibold">
                No campaigns yet
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-neutral-500">
                Create a personalized attendee campaign and let people
                generate their own event graphics.
              </p>

              <Link
                href={`/events/${event.id}/campaigns/create`}
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-700"
              >
                <Plus className="h-4 w-4" />
                Create your first campaign
              </Link>

            </div>

          ) : (

            /* CAMPAIGN LIST */

            <div className="mt-5 space-y-3">

              {eventCampaigns.map((campaign) => (
                <Link
                  key={campaign.id}
                  href={`/events/${event.id}/campaigns/${campaign.id}`}
                  className="group block rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-md"
                >

                  <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

                    {/* LEFT */}

                    <div className="min-w-0">

                      <div className="flex flex-wrap items-center gap-2">

                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusStyles(
                            campaign.status
                          )}`}
                        >
                          {getStatusLabel(
                            campaign.status
                          )}
                        </span>

                        <span className="text-xs text-neutral-400">
                          Campaign
                        </span>

                      </div>

                      <h3 className="mt-2 truncate text-base font-semibold text-neutral-950 group-hover:text-violet-700">
                        {campaign.title}
                      </h3>

                      {campaign.description && (
                        <p className="mt-1 line-clamp-2 max-w-xl text-sm leading-6 text-neutral-500">
                          {campaign.description}
                        </p>
                      )}

                    </div>

                    {/* STATS */}

                    <div className="grid grid-cols-3 gap-5 sm:shrink-0">

                      <CampaignStat
                        icon={
                          <Users className="h-4 w-4" />
                        }
                        value={
                          campaign.participants || 0
                        }
                        label="People"
                      />

                      <CampaignStat
                        icon={
                          <ImageIcon className="h-4 w-4" />
                        }
                        value={
                          campaign.generations || 0
                        }
                        label="Generated"
                      />

                      <CampaignStat
                        icon={
                          <Eye className="h-4 w-4" />
                        }
                        value={
                          campaign.views || 0
                        }
                        label="Views"
                      />

                    </div>

                  </div>

                </Link>
              ))}

            </div>

          )}

        </section>

      </div>
    </main>
  );
}

/*
 * ---------------------------------------------------------
 * CAMPAIGN STAT
 * ---------------------------------------------------------
 */

function CampaignStat({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: number;
  label: string;
}) {
  return (
    <div className="text-center">

      <div className="flex items-center justify-center text-neutral-400">
        {icon}
      </div>

      <p className="mt-1 text-sm font-semibold text-neutral-900">
        {value.toLocaleString()}
      </p>

      <p className="text-[11px] text-neutral-400">
        {label}
      </p>

    </div>
  );
}