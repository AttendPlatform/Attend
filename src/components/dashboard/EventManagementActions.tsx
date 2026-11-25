"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BarChart3,
  Edit2,
  Loader2,
  Send,
  Trash2,
  AlertTriangle,
  X,
} from "lucide-react";
import {
  deleteEventAction,
  publishEventAction,
} from "@/app/actions/organizer";
import { toast } from "@/hooks/use-toast";

interface EventManagementActionsProps {
  eventId: string;
  eventTitle: string;
  status: string;
  compact?: boolean;
}

export function EventManagementActions({
  eventId,
  eventTitle,
  status,
  compact = false,
}: EventManagementActionsProps) {
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [actionType, setActionType] = useState<"publish" | "delete" | null>(null);

  const isDraft = status.toLowerCase() === "draft";

  function handlePublish() {
    if (isPending) return;
    setActionType("publish");
    startTransition(async () => {
      const res = await publishEventAction(eventId);
      setActionType(null);
      if (res.success) {
        toast.success("Event published.");
        router.refresh();
      } else {
        toast.error(res.error || "Failed to publish event.");
      }
    });
  }

  function handleDelete() {
    if (isPending) return;
    setActionType("delete");
    startTransition(async () => {
      const res = await deleteEventAction(eventId);
      setActionType(null);
      if (res.success) {
        setConfirmOpen(false);
        toast.success("Event deleted.");
        router.refresh();
      } else {
        toast.error(res.error || "Failed to delete event.");
      }
    });
  }

  return (
    <>
      <div className={`flex flex-wrap items-center gap-1.5 ${compact ? "" : "pt-3 border-t border-neutral-100"}`}>
        <Link
          href={`/dashboard/events/${eventId}`}
          className="inline-flex items-center gap-1 rounded-lg border border-neutral-200 bg-white px-2.5 py-1.5 text-xs font-medium text-neutral-700 transition hover:bg-neutral-50 hover:text-neutral-900"
        >
          <BarChart3 className="h-3.5 w-3.5 text-neutral-500" />
          <span>Manage</span>
        </Link>

        <Link
          href={`/dashboard/events/${eventId}?tab=settings`}
          className="inline-flex items-center gap-1 rounded-lg border border-neutral-200 bg-white px-2.5 py-1.5 text-xs font-medium text-neutral-700 transition hover:bg-neutral-50 hover:text-neutral-900"
        >
          <Edit2 className="h-3.5 w-3.5 text-neutral-500" />
          <span>Edit</span>
        </Link>

        {isDraft && (
          <button
            type="button"
            onClick={handlePublish}
            disabled={isPending}
            className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-60"
          >
            {isPending && actionType === "publish" ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Send className="h-3.5 w-3.5" />
            )}
            <span>Publish</span>
          </button>
        )}

        <button
          type="button"
          onClick={() => setConfirmOpen(true)}
          disabled={isPending}
          className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-white px-2.5 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-60"
          aria-label={`Delete ${eventTitle}`}
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
          aria-labelledby={`delete-event-title-${eventId}`}
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
              id={`delete-event-title-${eventId}`}
              className="mt-4 text-lg font-semibold text-neutral-900"
            >
              Delete event?
            </h3>
            <p className="mt-2 text-sm text-neutral-600">
              This will permanently delete <span className="font-semibold">{eventTitle}</span> and its associated data. This action cannot be undone.
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
                <span>Delete event</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
