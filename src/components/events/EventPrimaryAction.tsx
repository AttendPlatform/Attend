"use client";

import { useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Check,
  ExternalLink,
  Ticket,
  Users,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { toggleAttendanceAction } from "@/app/actions/attendance";
import { useEventAttendance } from "./EventAttendanceProvider";

interface EventPrimaryActionProps {
  eventId: string;
  eventTitle: string;
  participationModel: string;
  externalUrl: string | null;
  isLoggedIn: boolean;
  initialStatus: "none" | "attending" | "registered" | "ticketed" | "cancelled";
  eventStatus?: string;
}

export default function EventPrimaryAction({
  eventId,
  participationModel,
  externalUrl,
  isLoggedIn,
  initialStatus = "none",
  eventStatus = "published",
}: EventPrimaryActionProps) {
  const context = useEventAttendance();
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Fallback internal state if not wrapped in EventAttendanceProvider
  const [internalStatus, setInternalStatus] = useState(initialStatus);
  const [prevInitial, setPrevInitial] = useState(initialStatus);
  const [internalError, setInternalError] = useState<string | null>(null);
  const [internalPending, startTransition] = useTransition();
  const router = useRouter();

  if (initialStatus !== prevInitial) {
    setPrevInitial(initialStatus);
    setInternalStatus(initialStatus);
  }

  const status = context ? context.status : internalStatus;
  const isAttending = context
    ? context.isAttending
    : status === "attending" || status === "registered" || status === "ticketed";
  const pending = context ? context.isPending : internalPending;
  const errorMessage = context ? context.errorMessage : internalError;

  const isCancelledEvent = eventStatus === "cancelled";

  if (isCancelledEvent) {
    return (
      <div className="flex w-full items-center justify-center gap-2 rounded-full bg-neutral-200 px-5 py-3.5 text-sm font-semibold text-neutral-600">
        <AlertCircle className="h-4 w-4" />
        Event Cancelled
      </div>
    );
  }

  // External ticketing / participation link
  if (externalUrl) {
    return (
      <a
        href={externalUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex w-full items-center justify-center gap-2 rounded-full bg-violet-600 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-violet-700"
      >
        {participationModel === "paid" ? (
          <Ticket className="h-4 w-4" />
        ) : (
          <ExternalLink className="h-4 w-4" />
        )}
        {participationModel === "paid" ? "Get tickets" : "Join event"}
      </a>
    );
  }

  // User is not logged in: redirect to login preserving intent
  if (!isLoggedIn) {
    const loginUrl = `/login?next=${encodeURIComponent(`/events/${eventId}`)}`;
    const actionLabel =
      participationModel === "paid"
        ? "Get tickets"
        : participationModel === "registration"
          ? "Register for event"
          : "Attend event";

    return (
      <Link
        href={loginUrl}
        className="flex w-full items-center justify-center gap-2 rounded-full bg-violet-600 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-violet-700"
      >
        {participationModel === "paid" ? (
          <Ticket className="h-4 w-4" />
        ) : (
          <Users className="h-4 w-4" />
        )}
        {actionLabel}
      </Link>
    );
  }

  // Handle RSVP toggle
  function handleToggleRSVP() {
    if (context) {
      context.handleToggleRSVP(triggerRef.current);
      return;
    }

    if (pending) return;
    setInternalError(null);

    const previousStatus = internalStatus;
    const optimisticNewStatus = isAttending ? "cancelled" : "attending";
    setInternalStatus(optimisticNewStatus);

    startTransition(async () => {
      const pathname =
        typeof window !== "undefined" ? window.location.pathname : undefined;
      const result = await toggleAttendanceAction(eventId, pathname);

      if (result.requiresLogin) {
        setInternalStatus(previousStatus);
        router.push(
          `/login?next=${encodeURIComponent(window.location.pathname)}`
        );
        return;
      }

      if (result.error || !result.status) {
        setInternalStatus(previousStatus);
        setInternalError(result.error ?? "Failed to update RSVP.");
        return;
      }

      setInternalStatus(result.status);
    });
  }

  return (
    <div className="space-y-2">
      {isAttending ? (
        <button
          ref={triggerRef}
          type="button"
          onClick={handleToggleRSVP}
          disabled={pending}
          className="group relative flex w-full items-center justify-center gap-2 rounded-full border border-emerald-300 bg-emerald-50 px-5 py-3.5 text-sm font-semibold text-emerald-800 transition hover:border-red-300 hover:bg-red-50 hover:text-red-700 disabled:opacity-60"
        >
          {pending ? (
            <Loader2 className="h-4 w-4 animate-spin text-emerald-700" />
          ) : (
            <>
              <span className="inline-flex items-center gap-1.5 group-hover:hidden">
                <Check className="h-4 w-4 text-emerald-600" />
                Attending
              </span>
              <span className="hidden items-center gap-1.5 group-hover:inline-flex">
                Cancel RSVP
              </span>
            </>
          )}
        </button>
      ) : (
        <button
          ref={triggerRef}
          type="button"
          onClick={handleToggleRSVP}
          disabled={pending}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-violet-600 px-5 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-700 disabled:opacity-60"
        >
          {pending ? (
            <Loader2 className="h-4 w-4 animate-spin text-white" />
          ) : (
            <>
              {participationModel === "paid" ? (
                <Ticket className="h-4 w-4" />
              ) : (
                <Users className="h-4 w-4" />
              )}
              {participationModel === "registration"
                ? "Register now"
                : "Attend event"}
            </>
          )}
        </button>
      )}

      {errorMessage && (
        <p className="text-center text-xs text-red-600">{errorMessage}</p>
      )}
    </div>
  );
}
