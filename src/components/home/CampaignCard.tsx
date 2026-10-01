import Link from "next/link";
import { ArrowRight, CalendarDays, MapPin, Sparkles } from "lucide-react";
import type { Campaign } from "@/types/home";
import {
  getCampaignEvent,
  getCategory,
  getTemplate,
  formatDate,
  formatLocation,
} from "@/lib/utils/home-helpers";

export function CampaignCard({ campaign }: { campaign: Campaign }) {
  const event = getCampaignEvent(campaign);
  const category = getCategory(event);
  const template = getTemplate(campaign);

  return (
    <article className="group overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl hover:shadow-neutral-200/60">
      {/* ARTWORK */}
      <Link href={`/campaign/${campaign.slug}`} className="block">
        <div className="relative aspect-square overflow-hidden bg-neutral-100">
          {template?.asset_url ? (
            <img
              src={template.asset_url}
              alt={campaign.title}
              className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
            />
          ) : event?.cover_image ? (
            <img
              src={event.cover_image}
              alt={campaign.title}
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
            {category.name}
          </span>
        )}

        <h3 className="mt-2 line-clamp-2 text-lg font-semibold tracking-tight">
          {campaign.title}
        </h3>

        {event?.title && (
          <p className="mt-1 line-clamp-1 text-sm text-neutral-500">
            {event.title}
          </p>
        )}

        <div className="mt-4 space-y-2 text-xs text-neutral-500">
          {event?.start_at && (
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4" />
              {formatDate(event.start_at)}
            </div>
          )}

          {event && (
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              <span className="truncate">{formatLocation(event)}</span>
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
}
