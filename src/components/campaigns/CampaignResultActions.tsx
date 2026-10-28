"use client";

import {
  ArrowDownToLine,
  ArrowRight,
  Check,
  ExternalLink,
  Loader2,
  RotateCcw,
  Share2,
  Ticket,
} from "lucide-react";
import Link from "next/link";
import type { CampaignParentEventSummary } from "@/types/campaigns";

type CampaignResultActionsProps = {
  downloaded: boolean;
  sharing: boolean;
  shared: boolean;
  parentEvent?: CampaignParentEventSummary | null;
  onDownload: () => void;
  onShare: () => void;
  onCreateAnother: () => void;
};

export default function CampaignResultActions({
  downloaded,
  sharing,
  shared,
  parentEvent,
  onDownload,
  onShare,
  onCreateAnother,
}: CampaignResultActionsProps) {
  return (
    <div className="mt-4 space-y-2">
      {/* PARENT EVENT RSVP / ATTENDANCE CONVERSION CALLOUT */}
      {parentEvent && (
        <div className="mb-3 rounded-xl border border-violet-200 bg-gradient-to-br from-violet-50 to-white p-3.5 shadow-sm">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-violet-800">
            <Ticket className="h-4 w-4 text-violet-600" />
            <span>Attending {parentEvent.title}?</span>
          </div>
          <p className="mt-1 text-xs text-neutral-600">
            Make sure to register or secure your spot on the official event page.
          </p>
          <Link
            href={`/events/${parentEvent.id}`}
            className="mt-2.5 inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-violet-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-violet-700"
          >
            <span>Go to Event Page to RSVP / Get Tickets</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      )}

      <button
        type="button"
        onClick={onDownload}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-violet-600 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-700"
      >
        {downloaded ? (
          <>
            <Check className="h-4 w-4" />
            Downloaded
          </>
        ) : (
          <>
            <ArrowDownToLine className="h-4 w-4" />
            Download Graphic
          </>
        )}
      </button>

      <button
        type="button"
        onClick={onShare}
        disabled={sharing}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white text-sm font-semibold text-violet-800 shadow-sm transition hover:bg-neutral-50 disabled:opacity-60"
      >
        {sharing ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Sharing...
          </>
        ) : shared ? (
          <>
            <Check className="h-4 w-4" />
            Shared
          </>
        ) : (
          <>
            <Share2 className="h-4 w-4" />
            Share Graphic
          </>
        )}
      </button>

      <button
        type="button"
        onClick={onCreateAnother}
        className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white text-sm font-semibold text-violet-600 transition hover:bg-neutral-50"
      >
        <RotateCcw className="h-4 w-4" />
        Create another version
      </button>
    </div>
  );
}