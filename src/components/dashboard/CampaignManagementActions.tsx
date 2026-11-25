"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  BarChart2,
  Edit2,
  ExternalLink,
  Loader2,
  Pause,
  Play,
  Trash2,
  X,
} from "lucide-react";
import {
  deleteCampaignAction,
  toggleCampaignStatusAction,
} from "@/app/actions/organizer";
import { toast } from "@/hooks/use-toast";

interface CampaignManagementActionsProps {
  eventId: string;
  campaignId: string;
  campaignTitle: string;
  slug: string;
  status: string;
}

export function CampaignManagementActions({
  eventId,
  campaignId,
  campaignTitle,
  slug,
  status,
}: CampaignManagementActionsProps) {
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [actionType, setActionType] = useState<"status" | "delete" | null>(null);

  const isPublished = status.toLowerCase() === "published";

  function handleToggleStatus() {
    if (isPending) return;
    const nextStatus = isPublished ? "paused" : "published";
    setActionType("status");
    startTransition(async () => {
      const res = await toggleCampaignStatusAction(eventId, campaignId, nextStatus);
      setActionType(null);
      if (res.success) {
        toast.success(nextStatus === "published" ? "Campaign published." : "Campaign paused.");
        router.refresh();
      } else {
        toast.error(res.error || "Failed to update campaign status.");
      }
    });
  }

  function handleDelete() {
    if (isPending) return;
    setActionType("delete");
    startTransition(async () => {
      const res = await deleteCampaignAction(eventId, campaignId);
      setActionType(null);
      if (res.success) {
        setConfirmOpen(false);
        toast.success("Campaign deleted.");
        router.refresh();
      } else {
        toast.error(res.error || "Failed to delete campaign.");
      }
    });
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-1.5">
        <Link
          href={`/events/${eventId}/campaigns/${campaignId}/edit`}
          className="inline-flex items-center gap-1 rounded-lg border border-neutral-200 bg-white px-2.5 py-1.5 text-xs font-medium text-neutral-700 transition hover:bg-neutral-50 hover:text-neutral-900"
        >
          <Edit2 className="h-3.5 w-3.5 text-neutral-500" />
          <span>Edit</span>
        </Link>

        <Link
          href={`/events/${eventId}/campaigns/${campaignId}/analytics`}
          className="inline-flex items-center gap-1 rounded-lg border border-neutral-200 bg-white px-2.5 py-1.5 text-xs font-medium text-neutral-700 transition hover:bg-neutral-50 hover:text-neutral-900"
        >
          <BarChart2 className="h-3.5 w-3.5 text-neutral-500" />
          <span>Analytics</span>
        </Link>

        {isPublished && (
          <Link
            href={`/campaign/${slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 rounded-lg border border-neutral-200 bg-white px-2.5 py-1.5 text-xs font-medium text-neutral-700 transition hover:bg-neutral-50 hover:text-neutral-900"
          >
            <ExternalLink className="h-3.5 w-3.5 text-neutral-500" />
            <span>View</span>
          </Link>
        )}

        <button
          type="button"
          onClick={handleToggleStatus}
          disabled={isPending}
          className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition disabled:opacity-60 ${
            isPublished
              ? "bg-amber-50 text-amber-700 hover:bg-amber-100"
              : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
          }`}
        >
          {isPending && actionType === "status" ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : isPublished ? (
            <Pause className="h-3.5 w-3.5" />
          ) : (
            <Play className="h-3.5 w-3.5" />
          )}
          <span>{isPublished ? "Pause" : "Publish"}</span>
        </button>

        <button
          type="button"
          onClick={() => setConfirmOpen(true)}
          disabled={isPending}
          className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-white px-2.5 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-60"
          aria-label={`Delete ${campaignTitle}`}
        >
          <Trash2 className="h-3.5 w-3.5" />
          <span>Delete</span>
        </button>
      </div>

      {confirmOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby={`delete-campaign-title-${campaignId}`}
          onClick={() => !isPending && setConfirmOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <button
                type="button"
                onClick={() => setConfirmOpen(false)}
                disabled={isPending}
                className="rounded-lg p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
                aria-label="Close confirmation"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <h3
              id={`delete-campaign-title-${campaignId}`}
              className="mt-4 text-lg font-semibold text-neutral-900"
            >
              Delete campaign?
            </h3>
            <p className="mt-2 text-sm text-neutral-600">
              This will permanently delete <span className="font-semibold">{campaignTitle}</span> and its analytics history. This action cannot be undone.
            </p>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmOpen(false)}
                disabled={isPending}
                className="rounded-xl border border-neutral-200 bg-white px-4 py-2 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isPending}
                className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"
              >
                {isPending && actionType === "delete" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                <span>Delete campaign</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
