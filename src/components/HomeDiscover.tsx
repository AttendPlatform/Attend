"use client";

import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  MapPin,
  Sparkles,
} from "lucide-react";
import { useMemo, useState } from "react";
import type { Category, Event, Campaign, CampaignTemplate } from "@/types/home";
import {
  getCategory,
  getCampaignEvent,
  getTemplate,
  formatDate,
  formatLocation,
} from "@/lib/utils/home-helpers";

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
  const [activeCategory, setActiveCategory] =
    useState("all");

  /*
   * ---------------------------------------------------------
   * FILTER EVENTS
   * ---------------------------------------------------------
   */

  const filteredEvents =
    useMemo(() => {
      if (
        activeCategory ===
        "all"
      ) {
        return events;
      }

      return events.filter(
        (event) => {
          const category =
            getCategory(event);

          return (
            category?.slug ===
              activeCategory ||
            category?.name.toLowerCase() ===
              activeCategory.toLowerCase()
          );
        }
      );
    }, [
      events,
      activeCategory,
    ]);

  /*
   * ---------------------------------------------------------
   * FILTER CAMPAIGNS
   * ---------------------------------------------------------
   *
   * A campaign belongs to the category
   * of its event.
   */

  const filteredCampaigns =
    useMemo(() => {
      if (
        activeCategory ===
        "all"
      ) {
        return campaigns;
      }

      return campaigns.filter(
        (campaign) => {
          const event =
            getCampaignEvent(
              campaign
            );

          const category =
            getCategory(event);

          return (
            category?.slug ===
              activeCategory ||
            category?.name.toLowerCase() ===
              activeCategory.toLowerCase()
          );
        }
      );
    }, [
      campaigns,
      activeCategory,
    ]);

  /*
   * ---------------------------------------------------------
   * PAGE
   * ---------------------------------------------------------
   */

  return (
    <>
      {/* =====================================================
          DISCOVER EVENTS
          ===================================================== */}

      <section className="mx-auto max-w-7xl px-5 py-16 sm:px-6">

        <div className="flex items-end justify-between gap-5">

          <div>
            <p className="text-sm font-semibold text-violet-600">
              DISCOVER
            </p>

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

        {/* ===================================================
            FILTERS
            =================================================== */}

        <div className="mt-8 flex gap-2 overflow-x-auto pb-2">

          {categories.map(
            (category) => {
              const active =
                activeCategory ===
                category.slug;

              return (
                <button
                  key={
                    category.id
                  }
                  type="button"
                  onClick={() =>
                    setActiveCategory(
                      category.slug
                    )
                  }
                  className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition ${
                    active
                      ? "bg-neutral-950 text-white"
                      : "border border-neutral-200 text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900"
                  }`}
                >
                  {category.name}
                </button>
              );
            }
          )}

        </div>

        {/* ===================================================
            EVENTS ERROR
            =================================================== */}

        {eventError ? (
          <div className="mt-8 rounded-2xl border border-red-100 bg-red-50 p-6 text-sm text-red-600">
            We couldn&apos;t load events right
            now.
          </div>
        ) : filteredEvents.length ===
          0 ? (
          <div className="mt-8 rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 p-10 text-center">

            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white">
              <CalendarDays className="h-5 w-5 text-neutral-400" />
            </div>

            <h3 className="mt-4 font-semibold">
              No events in this category
            </h3>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-neutral-500">
              Try another category or check
              back later for new events.
            </p>

          </div>
        ) : (
          <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">

            {filteredEvents
              .slice(0, 6)
              .map((event) => {
                const category =
                  getCategory(
                    event
                  );

                return (
                  <Link
                    key={event.id}
                    href={`/events/${event.id}`}
                    className="group overflow-hidden rounded-2xl border border-neutral-200 bg-white transition hover:-translate-y-1 hover:shadow-xl hover:shadow-neutral-100"
                  >

                    {/* COVER */}

                    <div className="aspect-[16/10] overflow-hidden bg-neutral-100">

                      {event.cover_image ? (
                        <img
                          src={
                            event.cover_image
                          }
                          alt={
                            event.title
                          }
                          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center bg-gradient-to-br from-violet-50 via-white to-violet-100">
                          <Sparkles className="h-8 w-8 text-violet-200" />
                        </div>
                      )}

                    </div>

                    {/* CONTENT */}

                    <div className="p-5">

                      {category?.name && (
                        <span className="text-xs font-semibold text-violet-600">
                          {category.name}
                        </span>
                      )}

                      <h3 className="mt-2 line-clamp-2 text-lg font-semibold tracking-tight text-neutral-950">
                        {event.title}
                      </h3>

                      {event.description && (
                        <p className="mt-2 line-clamp-2 text-sm leading-6 text-neutral-500">
                          {
                            event.description
                          }
                        </p>
                      )}

                      <div className="mt-4 space-y-2 text-sm text-neutral-500">

                        <div className="flex items-center gap-2">
                          <CalendarDays className="h-4 w-4 shrink-0" />

                          <span>
                            {formatDate(
                              event.start_at
                            )}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 shrink-0" />

                          <span className="truncate">
                            {formatLocation(
                              event
                            )}
                          </span>
                        </div>

                      </div>

                    </div>

                  </Link>
                );
              })}

          </div>
        )}

        {/* MOBILE VIEW ALL */}

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

      {/* =====================================================
          CAMPAIGNS
          ===================================================== */}

      <section className="border-y border-neutral-100 bg-neutral-50/70">

        <div className="mx-auto max-w-7xl px-5 py-16 sm:px-6">

          <div className="flex items-end justify-between gap-5">

            <div>
              <p className="text-sm font-semibold text-violet-600">
                ATTEND
              </p>

              <h2 className="mt-2 text-3xl font-semibold tracking-tight">
                Create your event DP
              </h2>

              <p className="mt-2 max-w-xl text-sm leading-6 text-neutral-500">
                Join an event campaign and create
                a personalized graphic with your
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

          {/* CAMPAIGN ERROR */}

          {campaignError ? (
            <div className="mt-8 rounded-2xl border border-red-100 bg-red-50 p-6 text-sm text-red-600">
              Published campaigns could not be
              loaded right now.
            </div>
          ) : filteredCampaigns.length ===
            0 ? (
            <div className="mt-8 rounded-2xl border border-dashed border-neutral-300 bg-white p-10 text-center">

              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-violet-50">
                <Sparkles className="h-5 w-5 text-violet-600" />
              </div>

              <h3 className="mt-4 font-semibold">
                No campaigns in this category
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-neutral-500">
                There are no published event
                campaigns for this category yet.
              </p>

            </div>
          ) : (
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">

              {filteredCampaigns
                .slice(0, 6)
                .map((campaign) => {
                  const event =
                    getCampaignEvent(
                      campaign
                    );

                  const category =
                    getCategory(
                      event
                    );

                  const template =
                    getTemplate(
                      campaign
                    );

                  return (
                    <article
                      key={
                        campaign.id
                      }
                      className="group overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl hover:shadow-neutral-200/60"
                    >

                      {/* ARTWORK */}

                      <Link
                        href={`/campaign/${campaign.slug}`}
                        className="block"
                      >
                        <div className="relative aspect-square overflow-hidden bg-neutral-100">

                          {template?.asset_url ? (
                            <img
                              src={
                                template.asset_url
                              }
                              alt={
                                campaign.title
                              }
                              className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                            />
                          ) : event?.cover_image ? (
                            <img
                              src={
                                event.cover_image
                              }
                              alt={
                                campaign.title
                              }
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center bg-gradient-to-br from-violet-50 via-white to-violet-100">
                              <Sparkles className="h-10 w-10 text-violet-200" />
                            </div>
                          )}

                          {/* BADGE */}

                          <div className="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1.5 text-[11px] font-semibold text-violet-700 shadow-sm backdrop-blur">
                            Create your DP
                          </div>

                        </div>
                      </Link>

                      {/* DETAILS */}

                      <div className="p-5">

                        {category?.name && (
                          <span className="text-xs font-semibold text-violet-600">
                            {
                              category.name
                            }
                          </span>
                        )}

                        <h3 className="mt-2 line-clamp-2 text-lg font-semibold tracking-tight">
                          {
                            campaign.title
                          }
                        </h3>

                        {event?.title && (
                          <p className="mt-1 line-clamp-1 text-sm text-neutral-500">
                            {
                              event.title
                            }
                          </p>
                        )}

                        <div className="mt-4 space-y-2 text-xs text-neutral-500">

                          {event?.start_at && (
                            <div className="flex items-center gap-2">
                              <CalendarDays className="h-4 w-4" />

                              {
                                formatDate(
                                  event.start_at
                                )
                              }
                            </div>
                          )}

                          {event && (
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4" />

                              <span className="truncate">
                                {formatLocation(
                                  event
                                )}
                              </span>
                            </div>
                          )}

                        </div>

                        {/* CTA */}

                        <Link
                          href={`/campaign/${campaign.slug}`}
                          className="mt-5 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 text-sm font-semibold text-white transition hover:bg-violet-700"
                        >
                          Create my DP

                          <ArrowRight className="h-4 w-4" />
                        </Link>

                      </div>

                    </article>
                  );
                })}

            </div>
          )}

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