"use client";

import Link from "next/link";
import { ArrowLeft, CalendarDays, CheckCircle2, ExternalLink, MapPin, Sparkles, UserCheck } from "lucide-react";
import type { CampaignParentEventSummary } from "@/types/campaigns";

type CreatorProfile = {
  id: string;
  name: string;
  avatar_url?: string | null;
  is_verified?: boolean;
};

type CampaignHeaderProps = {
  parentEvent?: CampaignParentEventSummary | null;
  creator?: CreatorProfile | null;
};

export default function CampaignHeader({
  parentEvent,
  creator,
}: CampaignHeaderProps) {
  return (
    <header className="border-b border-neutral-200/80 bg-white/90 backdrop-blur-md sticky top-0 z-30">
      {/* PARENT EVENT CONVERSION BANNER */}
      {parentEvent && (
        <div className="border-b border-violet-100 bg-gradient-to-r from-violet-50 via-purple-50 to-fuchsia-50 px-4 py-2.5 text-xs text-violet-950">
          <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-2 sm:flex-nowrap">
            <div className="flex items-center gap-2 min-w-0">
              <span className="inline-flex items-center gap-1 rounded-full bg-violet-600/10 px-2 py-0.5 font-semibold text-violet-700">
                Official Campaign
              </span>
              <span className="text-neutral-500 hidden sm:inline">for</span>
              <span className="font-bold text-neutral-900 truncate">
                {parentEvent.title}
              </span>
            </div>

            <Link
              href={`/events/${parentEvent.id}`}
              className="inline-flex items-center gap-1.5 font-semibold text-violet-700 hover:text-violet-900 hover:underline flex-shrink-0 ml-auto sm:ml-0"
              title={`View parent event: ${parentEvent.title}`}
            >
              <span>View Event Page</span>
              <ExternalLink className="h-3 w-3" />
            </Link>
          </div>
        </div>
      )}

      {/* MAIN TOP NAVIGATION BAR */}
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-5">
        <div className="flex items-center gap-3">
          <Link
            href={parentEvent ? `/events/${parentEvent.id}` : "/discover"}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-neutral-200 text-neutral-600 transition hover:bg-neutral-50 hover:text-neutral-900"
            title="Go back"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>

          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-600 text-white shadow-sm">
              <Sparkles className="h-4 w-4" />
            </div>
            <span className="text-lg font-bold tracking-tight text-neutral-900">
              Attend
            </span>
          </Link>
        </div>

        {/* CREATOR INFO */}
        <div className="flex items-center gap-2.5">
          {creator && (
            <div className="flex items-center gap-2 rounded-full border border-neutral-200 bg-neutral-50/80 py-1 pl-1.5 pr-3 text-xs">
              {creator.avatar_url ? (
                <img
                  src={creator.avatar_url}
                  alt={creator.name}
                  className="h-5 w-5 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-violet-100 font-semibold text-violet-700 text-[10px]">
                  {creator.name.charAt(0).toUpperCase()}
                </div>
              )}
              <span className="font-medium text-neutral-800 truncate max-w-[120px] sm:max-w-[160px]">
                {creator.name}
              </span>
              <span title="Verified Creator" className="flex items-center">
                <CheckCircle2 className="h-3.5 w-3.5 text-violet-600 flex-shrink-0" />
              </span>
            </div>
          )}

          <span className="hidden sm:inline-block rounded-md bg-neutral-100 px-2 py-1 text-[11px] font-medium text-neutral-500">
            Campaign
          </span>
        </div>
      </div>
    </header>
  );
}