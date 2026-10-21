"use client";

import { useRef } from "react";
import Link from "next/link";
import {
  CalendarDays,
  Check,
  ExternalLink,
  Loader2,
  Ticket,
  Users,
  ClipboardList,
  AlertCircle,
} from "lucide-react";
import { useEventAttendance } from "./EventAttendanceProvider";
import SaveButton from "@/components/ui/SaveButton";
import ShareButton from "@/components/ui/ShareButton";
import {
  buildLoginUrlWithIntent,
  setGuestIntent,
} from "@/lib/utils/guest-intent";

export interface MobileEventActionBarProps {
  eventId?: string;
  eventTitle?: string;
  startDate?: string;
  participationModel?: string;
  externalUrl?: string | null;
  isLoggedIn?: boolean;
  eventStatus?: string;
  isSaved?: boolean;
}

function formatMobileDate(dateString?: string): string {
  if (!dateString) return "Date TBA";
  try {
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return "Date TBA";
    return new Intl.DateTimeFormat("en-NG", {
      weekday: "short",
      day: "numeric",
      month: "short",
    }).format(date);
  } catch {
    return "Date TBA";
  }
}

export default function MobileEventActionBar(props: MobileEventActionBarProps) {
  const context = useEventAttendance();
  const triggerRef = useRef<HTMLButtonElement>(null);

  const eventId = props.eventId ?? context?.eventId ?? "";
  const eventTitle = props.eventTitle ?? context?.eventTitle ?? "Event";
  const startDate = props.startDate;
  const participationModel =
    props.participationModel ?? context?.participationModel ?? "free";
  const externalUrl = props.externalUrl ?? context?.externalUrl ?? null;
  const isLoggedIn = props.isLoggedIn ?? context?.isLoggedIn ?? false;
  const eventStatus = props.eventStatus ?? context?.eventStatus ?? "published";
  const isSaved = props.isSaved ?? false;

  const isAttending = context?.isAttending ?? false;
  const isPending = context?.isPending ?? false;
  const handleToggleRSVP = context?.handleToggleRSVP;

  const isCancelledEvent = eventStatus === "cancelled";

  return (
    <aside
      aria-label="Event quick actions"
      className="fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] md:bottom-0 lg:hidden z-40 border-t border-neutral-200 bg-white/95 px-4 py-3 backdrop-blur-md shadow-[0_-4px_20px_rgba(0,0,0,0.06)]"
    >
      <div className="mx-auto flex max-w-lg items-center justify-between gap-3">
        {/* Left Side: Context snippet (date / price / model) */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-neutral-800">
            <CalendarDays className="h-3.5 w-3.5 shrink-0 text-violet-600" />
            <span className="truncate">{formatMobileDate(startDate)}</span>
          </div>

          <div className="mt-0.5 flex items-center gap-1.5 text-xs text-neutral-500">
            <span className="capitalize">
              {participationModel === "paid"
                ? "Paid ticket"
                : participationModel === "registration"
                  ? "Registration"
                  : "Free entry"}
            </span>
            {isAttending && (
              <>
                <span className="text-neutral-300">·</span>
                <span className="inline-flex items-center gap-0.5 font-medium text-emerald-600">
                  <Check className="h-3 w-3" />
                  RSVP confirmed
                </span>
              </>
            )}
          </div>
        </div>

        {/* Right Side: Quick Save, Share, and Primary CTA */}
        <div className="flex shrink-0 items-center gap-2">
          {eventId && (
            <div className="flex items-center gap-1">
              <SaveButton
                targetId={eventId}
                targetType="event"
                initialSaved={isSaved}
              />
              <ShareButton
                title={eventTitle}
                path={`/events/${eventId}`}
                sourceType="event"
              />
            </div>
          )}

          {isCancelledEvent ? (
            <div className="flex items-center gap-1.5 rounded-full bg-neutral-200 px-4 py-2.5 text-xs font-semibold text-neutral-600">
              <AlertCircle className="h-3.5 w-3.5" />
              Cancelled
            </div>
          ) : externalUrl ? (
            <a
              href={externalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-1.5 rounded-full bg-violet-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-violet-700"
            >
              {participationModel === "paid" ? (
                <Ticket className="h-3.5 w-3.5" />
              ) : (
                <ExternalLink className="h-3.5 w-3.5" />
              )}
              {participationModel === "paid" ? "Get tickets" : "Join"}
            </a>
          ) : !isLoggedIn ? (
            <Link
              href={buildLoginUrlWithIntent(
                eventId || "",
                participationModel === "registration" ? "register" : "attend",
                typeof window !== "undefined"
                  ? window.location.pathname
                  : `/events/${eventId}`
              )}
              onClick={() => {
                if (eventId) {
                  setGuestIntent({
                    eventId,
                    action:
                      participationModel === "registration"
                        ? "register"
                        : "attend",
                  });
                }
              }}
              className="inline-flex items-center justify-center gap-1.5 rounded-full bg-violet-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-violet-700"
            >
              {participationModel === "paid" ? (
                <Ticket className="h-3.5 w-3.5" />
              ) : participationModel === "registration" ? (
                <ClipboardList className="h-3.5 w-3.5" />
              ) : (
                <Users className="h-3.5 w-3.5" />
              )}
              {participationModel === "paid"
                ? "Get tickets"
                : participationModel === "registration"
                  ? "Register"
                  : "Attend"}
            </Link>
          ) : isAttending ? (
            <button
              ref={triggerRef}
              type="button"
              onClick={() => handleToggleRSVP?.(triggerRef.current)}
              disabled={isPending}
              className="group relative inline-flex items-center justify-center gap-1.5 rounded-full border border-emerald-300 bg-emerald-50 px-3.5 py-2 text-xs font-semibold text-emerald-800 transition hover:border-red-300 hover:bg-red-50 hover:text-red-700 disabled:opacity-60"
            >
              {isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-emerald-700" />
              ) : (
                <>
                  <span className="inline-flex items-center gap-1 group-hover:hidden">
                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                    Attending
                  </span>
                  <span className="hidden items-center gap-1 group-hover:inline-flex">
                    Cancel RSVP
                  </span>
                </>
              )}
            </button>
          ) : (
            <button
              ref={triggerRef}
              type="button"
              onClick={() => handleToggleRSVP?.(triggerRef.current)}
              disabled={isPending}
              className="inline-flex items-center justify-center gap-1.5 rounded-full bg-violet-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-violet-700 disabled:opacity-60"
            >
              {isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-white" />
              ) : (
                <>
                  {participationModel === "paid" ? (
                    <Ticket className="h-3.5 w-3.5" />
                  ) : participationModel === "registration" ? (
                    <ClipboardList className="h-3.5 w-3.5" />
                  ) : (
                    <Users className="h-3.5 w-3.5" />
                  )}
                  {participationModel === "registration"
                    ? "Register now"
                    : "Attend event"}
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
