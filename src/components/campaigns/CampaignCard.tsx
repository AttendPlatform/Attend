import Link from "next/link";
import { ArrowRight, CalendarDays, ExternalLink, MapPin, Sparkles, Users } from "lucide-react";
import SaveButton from "@/components/ui/SaveButton";
import type { Campaign } from "@/types/home";
import {
  type CampaignCardData,
  type CampaignCardProps,
  formatCampaignParticipants,
  getCampaignCtaLabel,
  getCampaignParentEvent,
  getCampaignParticipantCount,
  getCampaignTemplate,
} from "@/types/campaigns";
import { formatDate, formatLocation } from "@/lib/utils/home-helpers";

type UnifiedCampaignCardProps = Partial<CampaignCardProps> & {
  campaign: CampaignCardData | Campaign;
};

export function CampaignCard({
  campaign,
  className = "",
  ctaVariant = "default",
  showParentEvent = true,
  showSaveButton = true,
  showParticipantBadge = true,
  isSaved = false,
  onSaveToggle,
  onClick,
}: UnifiedCampaignCardProps) {
  const normalizedCampaign = campaign as CampaignCardData;
  const parentEvent = getCampaignParentEvent(normalizedCampaign);
  const template = getCampaignTemplate(normalizedCampaign);
  const participantCount = getCampaignParticipantCount(normalizedCampaign);

  const previewImage = template?.asset_url || parentEvent?.cover_image;
  const categoryName = parentEvent?.category?.name || "Campaign";
  const ctaLabel = getCampaignCtaLabel(ctaVariant);

  return (
    <article
      onClick={onClick}
      className={`group relative flex flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-violet-300 hover:shadow-xl hover:shadow-violet-500/10 focus-within:ring-2 focus-within:ring-violet-500 focus-within:ring-offset-2 ${className}`}
    >
      {/* ARTWORK PREVIEW */}
      <div className="relative aspect-square w-full overflow-hidden bg-neutral-100">
        <Link
          href={`/campaign/${campaign.slug}`}
          className="block h-full w-full"
          tabIndex={-1}
          aria-hidden="true"
        >
          {previewImage ? (
            <img
              src={previewImage}
              alt={campaign.title}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-gradient-to-br from-violet-50 via-white to-violet-100">
              <Sparkles className="h-10 w-10 text-violet-300" />
            </div>
          )}
        </Link>

        {/* TOP LEFT BADGE */}
        <div className="absolute left-3 top-3 z-10 flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1.5 text-[11px] font-semibold text-violet-700 shadow-sm backdrop-blur">
          <Sparkles className="h-3 w-3 text-violet-500" />
          <span>{ctaLabel}</span>
        </div>

        {/* TOP RIGHT SAVE BUTTON */}
        {showSaveButton && (
          <div className="absolute right-3 top-3 z-10">
            <SaveButton
              targetId={campaign.id}
              targetType="campaign"
              initialSaved={isSaved}
            />
          </div>
        )}

        {/* BOTTOM PARTICIPANT BADGE OVERLAY */}
        {showParticipantBadge && (
          <div className="absolute bottom-3 left-3 z-10 flex items-center gap-1.5 rounded-full bg-neutral-900/80 px-2.5 py-1 text-[11px] font-medium text-white shadow-sm backdrop-blur">
            <Users className="h-3 w-3 text-violet-300" />
            <span>{formatCampaignParticipants(participantCount)}</span>
          </div>
        )}
      </div>

      {/* CONTENT / DETAILS */}
      <div className="flex flex-1 flex-col p-5">
        <span className="text-xs font-semibold uppercase tracking-wider text-violet-600">
          {categoryName}
        </span>

        <h3 className="mt-2 line-clamp-2 text-lg font-bold tracking-tight text-neutral-900 group-hover:text-violet-700">
          <Link href={`/campaign/${campaign.slug}`} className="hover:underline">
            {campaign.title}
          </Link>
        </h3>

        {/* EXPLICIT PARENT EVENT LINK */}
        {showParentEvent && parentEvent && (
          <div className="mt-2 flex items-center gap-1.5 text-xs text-neutral-600">
            <span className="font-medium text-neutral-400">For:</span>
            <Link
              href={`/events/${parentEvent.id}`}
              className="inline-flex items-center gap-1 font-semibold text-violet-700 hover:text-violet-800 hover:underline"
              title={`View parent event: ${parentEvent.title}`}
            >
              <span className="max-w-[200px] truncate sm:max-w-[240px]">
                {parentEvent.title}
              </span>
              <ExternalLink className="h-3 w-3 flex-shrink-0" />
            </Link>
          </div>
        )}

        {/* EVENT TIME & LOCATION IF AVAILABLE */}
        {parentEvent && (
          <div className="mt-4 space-y-1.5 text-xs text-neutral-500">
            {parentEvent.start_at && (
              <div className="flex items-center gap-2">
                <CalendarDays className="h-3.5 w-3.5 text-neutral-400" />
                <span>{formatDate(parentEvent.start_at)}</span>
              </div>
            )}
            {(parentEvent.city || parentEvent.venue_name || parentEvent.is_online) && (
              <div className="flex items-center gap-2">
                <MapPin className="h-3.5 w-3.5 text-neutral-400" />
                <span className="truncate">
                  {parentEvent.is_online
                    ? "Online"
                    : [parentEvent.venue_name, parentEvent.city]
                        .filter(Boolean)
                        .join(", ")}
                </span>
              </div>
            )}
          </div>
        )}

        {/* PRIMARY CTA */}
        <div className="mt-auto pt-5">
          <Link
            href={`/campaign/${campaign.slug}`}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 text-sm font-semibold text-white transition hover:bg-violet-700 group-hover:shadow-md"
          >
            <span>{ctaLabel}</span>
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </article>
  );
}
export default CampaignCard;
