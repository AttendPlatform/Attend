"use client";

import Link from "next/link";
import { ArrowRight, CalendarDays, ExternalLink, MapPin, Sparkles, Users } from "lucide-react";
import type { CampaignParentEventSummary } from "@/types/campaigns";
import { formatDate } from "@/lib/utils/home-helpers";

type CampaignIntroProps = {
  title: string;
  parentEvent?: CampaignParentEventSummary | null;
  participantCount?: number;
};

export default function CampaignIntro({
  title,
  parentEvent,
  participantCount = 0,
}: CampaignIntroProps) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      {/* PARENT EVENT PILL */}
      {parentEvent && (
        <div className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-violet-200/60 bg-violet-50/80 px-3 py-1 text-xs font-medium text-violet-800 shadow-sm backdrop-blur">
          <span className="text-violet-500 font-normal">Connected to event:</span>
          <Link
            href={`/events/${parentEvent.id}`}
            className="inline-flex items-center gap-1 font-bold text-violet-700 hover:text-violet-900 hover:underline"
          >
            <span>{parentEvent.title}</span>
            <ExternalLink className="h-3 w-3" />
          </Link>
        </div>
      )}

      {/* CAMPAIGN TITLE */}
      <h1 className="text-3xl font-extrabold tracking-tight text-neutral-950 sm:text-4xl">
        {title}
      </h1>

      {/* CONTEXTUAL ACTION SUBTITLE */}
      <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-neutral-600 sm:text-base">
        Create your personalized version and participate in this campaign. Upload your photo and add your name to generate your custom graphic.
      </p>

      {/* PARTICIPANT SOCIAL PROOF */}
      {participantCount > 0 && (
        <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-neutral-100 px-3 py-1 text-xs font-semibold text-neutral-700">
          <Users className="h-3.5 w-3.5 text-violet-600" />
          <span>
            {participantCount === 1 ? "1 person participating" : `${participantCount} people participating`}
          </span>
        </div>
      )}
    </div>
  );
}