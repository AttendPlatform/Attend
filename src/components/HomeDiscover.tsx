import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { Category, Event, Campaign } from "@/types/home";
import { getCategory, getCampaignEvent } from "@/lib/utils/home-helpers";
import { HomeCategoryFilters } from "@/components/home/HomeCategoryFilters";
import { HomeEventsSection } from "@/components/home/HomeEventsSection";
import { HomeCampaignsSection } from "@/components/home/HomeCampaignsSection";

type Props = {
  events: Event[];
  campaigns: Campaign[];
  categories: Category[];
  eventError?: string;
  campaignError?: string;
};

export default function HomeDiscover({
  events,
  campaigns,
  categories,
  eventError,
  campaignError,
}: Props) {
  const [activeCategory, setActiveCategory] = useState("all");

  const filteredEvents = useMemo(() => {
    if (activeCategory === "all") return events;

    return events.filter((event) => {
      const category = getCategory(event);
      return (
        category?.slug === activeCategory ||
        category?.name.toLowerCase() === activeCategory.toLowerCase()
      );
    });
  }, [events, activeCategory]);

  const filteredCampaigns = useMemo(() => {
    if (activeCategory === "all") return campaigns;

    return campaigns.filter((campaign) => {
      const event = getCampaignEvent(campaign);
      const category = getCategory(event);
      return (
        category?.slug === activeCategory ||
        category?.name.toLowerCase() === activeCategory.toLowerCase()
      );
    });
  }, [campaigns, activeCategory]);

  return (
    <>
      <section className="mx-auto max-w-7xl px-5 py-16 sm:px-6">
        <div className="flex items-end justify-between gap-5">
          <div>
            <p className="text-sm font-semibold text-violet-600">DISCOVER</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight">
              What&apos;s happening around you?
            </h2>
            <p className="mt-2 text-sm text-neutral-500">
              Find something worth showing up for.
            </p>
          </div>
          <Link
            href="/discover"
            className="hidden items-center gap-2 text-sm font-semibold text-neutral-900 sm:flex"
          >
            View all
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <HomeCategoryFilters
          categories={categories}
          activeCategory={activeCategory}
          onSelectCategory={setActiveCategory}
        />

        <HomeEventsSection events={filteredEvents} error={eventError} />

        <div className="mt-8 sm:hidden">
          <Link
            href="/discover"
            className="inline-flex items-center gap-2 text-sm font-semibold"
          >
            View all events
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <section className="border-y border-neutral-100 bg-neutral-50/70">
        <div className="mx-auto max-w-7xl px-5 py-16 sm:px-6">
          <div className="flex items-end justify-between gap-5">
            <div>
              <p className="text-sm font-semibold text-violet-600">ATTEND</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight">
                Create your event DP
              </h2>
              <p className="mt-2 max-w-xl text-sm leading-6 text-neutral-500">
                Join an event campaign and create a personalized graphic with your
                photo and name.
              </p>
            </div>
            <Link
              href="/discover"
              className="hidden items-center gap-2 text-sm font-semibold text-neutral-900 sm:flex"
            >
              Explore campaigns
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <HomeCampaignsSection
            campaigns={filteredCampaigns}
            error={campaignError}
          />

          <div className="mt-8 sm:hidden">
            <Link
              href="/discover"
              className="inline-flex items-center gap-2 text-sm font-semibold"
            >
              Explore campaigns
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}