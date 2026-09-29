import {
  ArrowRight,
  CalendarDays,
  MapPin,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { getHomeEvents, getHomeCampaigns } from "@/services";
import HomeDiscover from "@/components/HomeDiscover"

type Category = {
  id: string;
  name: string;
  slug: string;
};

type Event = {
  id: string;
  title: string;
  description: string | null;
  cover_image: string | null;
  start_at: string | null;
  city: string | null;
  state: string | null;
  is_online: boolean | null;
  event_categories:
    | Category
    | Category[]
    | null;
};

type CampaignTemplate = {
  id: string;
  asset_url: string;
  width: number;
  height: number;
  version: number;
  is_active: boolean;
};

type Campaign = {
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
  events:
    | Event
    | Event[]
    | null;
  campaign_templates:
    | CampaignTemplate
    | CampaignTemplate[]
    | null;
};

function getCategory(
  event: Event | null
): Category | null {
  if (!event?.event_categories) {
    return null;
  }

  if (Array.isArray(event.event_categories)) {
    return event.event_categories[0] || null;
  }

  return event.event_categories;
}

export default async function Home() {
  const [eventData, campaignData] = await Promise.all([
    getHomeEvents(50),
    getHomeCampaigns(50),
  ]);

  /*
   * ---------------------------------------------------------
   * CLEAN EVENTS
   * ---------------------------------------------------------
   */

  const events =
    (eventData || []) as Event[];

  /*
   * ---------------------------------------------------------
   * CLEAN CAMPAIGNS
   * ---------------------------------------------------------
   */

  const campaigns =
    (campaignData || []) as Campaign[];

  /*
   * Only keep campaigns that have
   * an active template.
   */

  const validCampaigns =
    campaigns.filter((campaign) => {
      if (!campaign.campaign_templates) {
        return false;
      }

      if (
        Array.isArray(
          campaign.campaign_templates
        )
      ) {
        return campaign.campaign_templates.some(
          (template) =>
            template.is_active
        );
      }

      return (
        campaign.campaign_templates.is_active
      );
    });

  /*
   * ---------------------------------------------------------
   * BUILD CATEGORY LIST
   * ---------------------------------------------------------
   *
   * We build this from the actual events,
   * rather than relying only on hardcoded
   * categories.
   */

  const categoryMap =
    new Map<string, Category>();

  events.forEach((event) => {
    const category =
      getCategory(event);

    if (category) {
      categoryMap.set(
        category.slug,
        category
      );
    }
  });

  /*
   * Also include categories from campaigns.
   */

  validCampaigns.forEach(
    (campaign) => {
      const campaignEvent =
        Array.isArray(campaign.events)
          ? campaign.events[0]
          : campaign.events;

      const category =
        getCategory(
          campaignEvent || null
        );

      if (category) {
        categoryMap.set(
          category.slug,
          category
        );
      }
    }
  );

  const categories = [
    {
      id: "all",
      name: "All",
      slug: "all",
    },
    ...Array.from(
      categoryMap.values()
    ).sort((a, b) =>
      a.name.localeCompare(
        b.name
      )
    ),
  ];

  /*
   * ---------------------------------------------------------
   * PAGE
   * ---------------------------------------------------------
   */

  return (
    <div>
      {/* =====================================================
          HERO
          ===================================================== */}

      <section className="border-b border-neutral-100">
        <div className="mx-auto grid max-w-7xl gap-12 px-5 py-16 sm:px-6 md:py-24 lg:grid-cols-[1.1fr_.9fr] lg:items-center lg:py-28">

          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-violet-100 bg-violet-50 px-3 py-1.5 text-xs font-medium text-violet-700">
              <Sparkles className="h-3.5 w-3.5" />

              Events worth showing up for
            </div>

            <h1 className="max-w-3xl text-5xl font-semibold tracking-[-0.04em] text-neutral-950 sm:text-6xl lg:text-7xl">
              Don&apos;t just attend.

              <span className="block text-violet-600">
                Be part of it.
              </span>
            </h1>

            <p className="mt-6 max-w-xl text-base leading-7 text-neutral-500 sm:text-lg">
              Discover events around you,
              connect with people and create
              personalized graphics worth sharing.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/discover"
                className="inline-flex items-center gap-2 rounded-full bg-violet-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-violet-700"
              >
                Discover events

                <ArrowRight className="h-4 w-4" />
              </Link>

              <Link
                href="/create"
                className="rounded-full border border-neutral-200 px-6 py-3 text-sm font-semibold text-neutral-900 transition hover:bg-neutral-50"
              >
                Create an event
              </Link>
            </div>
          </div>

          {/* CAMPAIGN PREVIEW */}

          <div className="relative">
            <div className="mx-auto max-w-md rounded-[2rem] border border-neutral-200 bg-neutral-50 p-3 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.12)]">

              <div className="aspect-square overflow-hidden rounded-[1.5rem] bg-gradient-to-br from-violet-100 via-white to-violet-200">

                <div className="flex h-full flex-col items-center justify-center p-8 text-center">

                  <div className="mb-5 flex h-24 w-24 items-center justify-center rounded-full border-4 border-white bg-violet-200 text-3xl font-bold text-violet-700 shadow-sm">
                    A
                  </div>

                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-600">
                    I&apos;m attending
                  </p>

                  <h3 className="mt-2 text-2xl font-bold tracking-tight">
                    Tech Summit 2026
                  </h3>

                  <p className="mt-2 text-sm text-neutral-500">
                    Abuja · September 12
                  </p>

                </div>

              </div>

            </div>
          </div>

        </div>
      </section>

      {/* =====================================================
          DISCOVERY
          ===================================================== */}

      <HomeDiscover
        events={events}
        campaigns={validCampaigns}
        categories={categories}
        eventError=""
        campaignError=""
      />

      {/* =====================================================
          ORGANIZER CTA
          ===================================================== */}

      <section className="mx-auto max-w-7xl px-5 pb-16 sm:px-6">

        <div className="overflow-hidden rounded-[2rem] bg-neutral-950 px-6 py-12 text-white sm:px-10 lg:px-14">

          <div className="max-w-2xl">

            <p className="text-sm font-semibold text-violet-400">
              FOR EVENT ORGANIZERS
            </p>

            <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
              Turn your attendees into your campaign.
            </h2>

            <p className="mt-4 max-w-xl leading-7 text-neutral-400">
              Upload your design, place the photo
              and name areas, publish your campaign
              and let attendees create their own
              personalized graphic.
            </p>

            <Link
              href="/create"
              className="mt-7 inline-flex rounded-full bg-violet-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-violet-500"
            >
              Create your campaign
            </Link>

          </div>

        </div>

      </section>
    </div>
  );
}