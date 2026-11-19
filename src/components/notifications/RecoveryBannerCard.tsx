"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, FileEdit, X } from "lucide-react";
import type { AbandonedActionRecord } from "@/types/notifications";
import { dismissAbandonedActionAction } from "@/app/actions/abandoned-actions";
import { getRecoveryCopyTemplate } from "@/lib/notifications/recovery-rules";

interface RecoveryBannerCardProps {
  action: AbandonedActionRecord;
  onDismissed?: (actionId: string) => void;
}

export function RecoveryBannerCard({
  action,
  onDismissed,
}: RecoveryBannerCardProps) {
  const [dismissing, setDismissing] = useState(false);

  const copy = getRecoveryCopyTemplate(action.action_type, action.draft_title);
  const resumeHref =
    action.action_type === "event_draft" &&
    !action.event_id &&
    action.resume_url === "/create"
      ? `/create?resumeDraft=${action.id}`
      : action.resume_url;

  const handleDismiss = async () => {
    if (dismissing) return;
    setDismissing(true);
    try {
      const result = await dismissAbandonedActionAction(action.id);
      if (result.ok) {
        onDismissed?.(action.id);
      }
    } finally {
      setDismissing(false);
    }
  };

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-violet-200 bg-violet-50/70 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
          <FileEdit className="h-5 w-5" />
        </div>

        <div className="min-w-0">
          <p className="text-sm font-semibold text-neutral-950">
            {action.draft_title || copy.title}
          </p>
          <p className="mt-0.5 text-sm text-neutral-600">{copy.message}</p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2 self-end sm:self-center">
        <Link
          href={resumeHref}
          className="inline-flex items-center gap-1.5 rounded-xl bg-violet-600 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-violet-700"
        >
          {copy.actionLabel}
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>

        <button
          type="button"
          onClick={handleDismiss}
          disabled={dismissing}
          aria-label="Dismiss reminder"
          className="inline-flex items-center gap-1 rounded-xl border border-neutral-200 bg-white px-2.5 py-2 text-xs font-medium text-neutral-600 transition hover:bg-neutral-50 hover:text-neutral-900 disabled:opacity-50"
        >
          <X className="h-3.5 w-3.5" />
          Dismiss
        </button>
      </div>
    </div>
  );
}
