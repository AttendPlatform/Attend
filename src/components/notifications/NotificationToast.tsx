"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Bell, CalendarDays, MapPin, Sparkles, X } from "lucide-react";
import type { Notification } from "@/lib/notifications/types";
import { recordNotificationInteraction } from "@/lib/notifications/client";
import {
  getVisualPopupAccessibilityProps,
  isVisualNotification,
  resolveVisualNotificationImage,
  sanitizeNotificationActionUrl,
} from "@/lib/notifications/visual-rules";

interface NotificationToastProps {
  notification: Notification;
  onClose: () => void;
  onDismiss?: () => void;
}

function formatEventDate(startAt: unknown): string | null {
  if (typeof startAt !== "string" || !startAt) return null;
  const parsed = new Date(startAt);
  if (Number.isNaN(parsed.getTime())) return null;

  return new Intl.DateTimeFormat("en", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(parsed);
}

export function NotificationToast({
  notification,
  onClose,
  onDismiss,
}: NotificationToastProps) {
  const [imageError, setImageError] = useState(false);

  const isVisual = isVisualNotification(notification);
  const a11y = getVisualPopupAccessibilityProps(notification);
  const actionUrl = sanitizeNotificationActionUrl(notification.action_url);
  const handleDismiss = onDismiss ?? onClose;

  if (!isVisual) {
    return (
      <div
        role={a11y.role}
        aria-live={a11y.ariaLive}
        className="fixed bottom-20 left-4 right-4 z-[100] animate-in slide-in-from-right-5 fade-in duration-300 sm:bottom-auto sm:left-auto sm:right-5 sm:top-20 sm:w-full sm:max-w-sm"
      >
        <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-2xl ring-1 ring-black/5">
          <div className="flex items-start gap-3 p-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-violet-100 text-violet-600">
              <Bell className="h-4 w-4" />
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-neutral-900">
                {notification.title}
              </p>

              {notification.message && (
                <p className="mt-1 text-xs leading-relaxed text-neutral-500">
                  {notification.message}
                </p>
              )}

              {actionUrl && (
                <Link
                  href={actionUrl}
                  onClick={() => {
                    void recordNotificationInteraction(notification.id, "click");
                    onClose();
                  }}
                  className="mt-2 inline-block text-xs font-semibold text-violet-600 hover:text-violet-700"
                >
                  {notification.action_label || "View"}
                </Link>
              )}
            </div>

            <button
              type="button"
              onClick={handleDismiss}
              aria-label={a11y.dismissAriaLabel}
              className="shrink-0 rounded-full p-1 text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-700"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  const metadata = notification.metadata ?? {};
  const imageResolution = resolveVisualNotificationImage(notification, {
    imageLoadFailed: imageError,
  });

  const whyRecommended =
    notification.why_recommended ||
    (typeof metadata.why_recommended === "string"
      ? metadata.why_recommended
      : null) ||
    "You might be interested in this event";

  const shortDescription =
    (typeof metadata.short_description === "string"
      ? metadata.short_description
      : null) || notification.message;

  const formattedDate = formatEventDate(metadata.start_at);
  const locationLabel =
    (typeof metadata.city === "string" && metadata.city) ||
    (typeof metadata.venue_name === "string" && metadata.venue_name) ||
    null;
  const dateLocationLine = [formattedDate, locationLabel]
    .filter(Boolean)
    .join(" · ");

  return (
    <div
      role={a11y.role}
      aria-live={a11y.ariaLive}
      className="fixed bottom-20 left-4 right-4 z-[100] animate-in slide-in-from-right-5 fade-in duration-300 sm:bottom-auto sm:left-auto sm:right-5 sm:top-20 sm:w-full sm:max-w-sm"
    >
      <div className="overflow-hidden rounded-3xl border border-neutral-200/90 bg-white shadow-2xl ring-1 ring-black/5">
        <div className="relative aspect-[16/10] w-full overflow-hidden bg-gradient-to-br from-violet-600 via-violet-500 to-fuchsia-500">
          {imageResolution.src && imageResolution.hasValidImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageResolution.src}
              alt={a11y.imageAlt}
              onError={() => setImageError(true)}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-white/90">
              <CalendarDays className="h-10 w-10" />
            </div>
          )}

          <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-3">
            <span className="inline-flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-violet-700 shadow-sm backdrop-blur-sm">
              <Sparkles className="h-3 w-3" />
              {whyRecommended}
            </span>

            <button
              type="button"
              onClick={handleDismiss}
              aria-label={a11y.dismissAriaLabel}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-sm transition hover:bg-black/65"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="p-4">
          <h3 className="line-clamp-1 text-sm font-bold text-neutral-950">
            {notification.title}
          </h3>

          {shortDescription && (
            <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-neutral-600">
              {shortDescription}
            </p>
          )}

          {dateLocationLine && (
            <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-neutral-500">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-violet-600" />
              <span className="truncate">{dateLocationLine}</span>
            </p>
          )}

          <div className="mt-3.5 flex items-center gap-2">
            {actionUrl && (
              <Link
                href={actionUrl}
                onClick={() => {
                  void recordNotificationInteraction(notification.id, "click");
                  onClose();
                }}
                className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-violet-600 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-violet-700"
              >
                {notification.action_label || "View event"}
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            )}

            <button
              type="button"
              onClick={handleDismiss}
              aria-label={a11y.dismissAriaLabel}
              className="rounded-xl border border-neutral-200 px-3 py-2 text-xs font-medium text-neutral-600 transition hover:bg-neutral-50 hover:text-neutral-900"
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
