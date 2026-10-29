import Link from "next/link";
import { ArrowRight, CalendarDays, ExternalLink, MapPin, Sparkles, Users } from "lucide-react";
import SaveButton from "@/components/ui/SaveButton";
import AvatarStack from "@/components/ui/AvatarStack";
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
  layout = "vertical",
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

  const descriptionText = campaign.description;
  const formattedDate = parentEvent?.start_at
    ? (() => {
        const date = new Date(parentEvent.start_at);
        if (Number.isNaN(date.getTime())) return "Date TBA";
        return date.toLocaleString("en-NG", {
          weekday: "short",
          month: "short",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
        });
      })()
    : "Date TBA";

  if (layout === "horizontal") {
    return (
      <article
        onClick={onClick}
        className={`group relative flex flex-row overflow-hidden rounded-2xl border border-neutral-200 bg-white p-2.5 sm:p-3 shadow-sm transition-all duration-300 hover:border-violet-300 hover:shadow-md ${className}`}
      >
        {/* LEFT COLUMN: ARTWORK PREVIEW */}
        <div className="relative aspect-square w-28 sm:w-44 md:w-52 shrink-0 overflow-hidden rounded-xl bg-violet-800">
          <Link
            href={`/campaign/${campaign.slug}`}
            className="block h-full w-full"
            tabIndex={-1}
            aria-label={`View campaign ${campaign.title}`}
          >
            {previewImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={previewImage}
                alt={campaign.title}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-violet-800 text-white font-medium text-xs">
                <Sparkles className="h-6 w-6 sm:h-8 sm:w-8 text-violet-300" />
              </div>
            )}
          </Link>

          {/* TOP-LEFT CATEGORY BADGE */}
          <span className="absolute left-1.5 top-1.5 sm:left-2.5 sm:top-2.5 z-10 rounded-full bg-violet-200/90 px-2 py-0.5 text-[9px] sm:text-[10px] font-semibold uppercase text-violet-900 shadow-sm backdrop-blur">
            {categoryName}
          </span>

          {/* TOP-RIGHT BOOKMARK */}
          {showSaveButton && (
            <div className="absolute right-1.5 top-1.5 sm:right-2.5 sm:top-2.5 z-10">
              <SaveButton
                targetId={campaign.id}
                targetType="campaign"
                initialSaved={isSaved}
                variant="overlay"
              />
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: DETAILS & ACTIONS */}
        <div className="flex min-w-0 flex-1 flex-col justify-between pl-2.5 sm:pl-4">
          <div>
            <h3 className="line-clamp-1 sm:line-clamp-2 font-serif text-xs sm:text-base font-bold leading-snug text-neutral-900 group-hover:text-violet-700">
              <Link href={`/campaign/${campaign.slug}`} className="hover:underline">
                {campaign.title}
              </Link>
            </h3>

            {descriptionText && (
              <p className="mt-1 line-clamp-2 text-[10px] sm:text-xs leading-4 sm:leading-5 text-neutral-500">
                {descriptionText}
              </p>
            )}

            {/* DATE & TIME */}
            {parentEvent?.start_at && (
              <div className="mt-1 sm:mt-1.5 flex items-center gap-1.5 text-[10px] sm:text-xs text-neutral-500">
                <CalendarDays className="h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0 text-neutral-400" />
                <span className="truncate">{formattedDate}</span>
              </div>
            )}

            {/* LOCATION */}
            {(parentEvent?.city || parentEvent?.venue_name || parentEvent?.is_online) && (
              <div className="mt-0.5 sm:mt-1 flex items-center gap-1.5 text-[10px] sm:text-xs text-neutral-500">
                <MapPin className="h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0 text-neutral-400" />
                <span className="truncate">
                  {parentEvent.is_online
                    ? "Online"
                    : [parentEvent.venue_name, parentEvent.city].filter(Boolean).join(", ")}
                </span>
              </div>
            )}
          </div>

          {/* FOOTER: ATTENDEES/PARTICIPANTS + PARTICIPATE CTA */}
          <div className="mt-2 sm:mt-3 flex items-center justify-between gap-1.5 border-t border-neutral-100 pt-1.5 sm:pt-2.5">
            <div className="min-w-0 flex-1">
              {parentEvent?.id ? (
                <AvatarStack
                  eventId={parentEvent.id}
                  fallbackCount={participantCount}
                  label="attending"
                  compact
                />
              ) : (
                <div className="flex items-center gap-1 text-[10px] sm:text-xs text-neutral-500">
                  <Users className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-neutral-400" />
                  <span>{formatCampaignParticipants(participantCount)}</span>
                </div>
              )}
            </div>

            <Link
              href={`/campaign/${campaign.slug}`}
              className="shrink-0 rounded-full bg-violet-600 px-3 sm:px-4 py-1 sm:py-1.5 text-[10px] sm:text-xs font-semibold text-white shadow-sm transition hover:bg-violet-700"
            >
              {ctaLabel}
            </Link>
          </div>
        </div>
      </article>
    );
  }

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
            // eslint-disable-next-line @next/next/no-img-element
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
