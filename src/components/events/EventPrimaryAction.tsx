"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Check,
  ExternalLink,
  Ticket,
  Users,
  ClipboardList,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { toggleAttendanceAction } from "@/app/actions/attendance";
import RegistrationModal from "./RegistrationModal";
import CancellationModal from "./CancellationModal";

export interface EventPrimaryActionProps {
  eventId: string;
  eventTitle: string;
  participationModel: string;
  externalUrl: string | null;
  isLoggedIn: boolean;
  initialStatus: "none" | "attending" | "registered" | "ticketed" | "cancelled";
  eventStatus?: string;
  participationConfig?: Record<string, unknown> | null;
  userName?: string;
  userEmail?: string;
}

export default function EventPrimaryAction({
  eventId,
  eventTitle,
  participationModel,
  externalUrl,
  isLoggedIn,
  initialStatus = "none",
  eventStatus = "published",
  participationConfig,
  userName = "",
  userEmail = "",
}: EventPrimaryActionProps) {
  const [status, setStatus] = useState(initialStatus);
  const [prevInitial, setPrevInitial] = useState(initialStatus);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isRegModalOpen, setIsRegModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  if (initialStatus !== prevInitial) {
    setPrevInitial(initialStatus);
    setStatus(initialStatus);
  }

  const isAttending =
    status === "attending" ||
    status === "registered" ||
    status === "ticketed";

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
        ) : participationModel === "registration" ? (
          <ClipboardList className="h-4 w-4" />
        ) : (
          <Users className="h-4 w-4" />
        )}
        {actionLabel}
      </Link>
    );
  }

  // Primary click handler for logged-in user
  function handleActionClick() {
    if (pending) return;
    setErrorMessage(null);

    // If currently attending/registered, trigger confirmation modal before cancelling
    if (isAttending) {
      setIsCancelModalOpen(true);
      return;
    }

    // If participation model is registration, open the dynamic registration modal
    if (participationModel === "registration") {
      setIsRegModalOpen(true);
      return;
    }

    // Free standard RSVP: direct toggle
    handleInstantRSVP();
  }

  function handleInstantRSVP() {
    const previousStatus = status;
    setStatus("attending");

    startTransition(async () => {
      const pathname = typeof window !== "undefined" ? window.location.pathname : undefined;
      const result = await toggleAttendanceAction(eventId, pathname);

      if (result.requiresLogin) {
        setStatus(previousStatus);
        router.push(`/login?next=${encodeURIComponent(window.location.pathname)}`);
        return;
      }

      if (result.error || !result.status) {
        setStatus(previousStatus);
        setErrorMessage(result.error ?? "Failed to update RSVP.");
        return;
      }

      setStatus(result.status);
    });
  }

  function handleConfirmCancel() {
    startTransition(async () => {
      const pathname = typeof window !== "undefined" ? window.location.pathname : undefined;
      const result = await toggleAttendanceAction(eventId, pathname);

      if (result.error) {
        setErrorMessage(result.error);
        setIsCancelModalOpen(false);
        return;
      }

      setStatus("cancelled");
      setIsCancelModalOpen(false);
    });
  }

  const attendanceLabel =
    status === "registered" ? "Registered" : "Attending";

  return (
    <>
      <div className="space-y-2">
        {isAttending ? (
          <button
            type="button"
            onClick={handleActionClick}
            disabled={pending}
            className="group relative flex w-full items-center justify-center gap-2 rounded-full border border-emerald-300 bg-emerald-50 px-5 py-3.5 text-sm font-semibold text-emerald-800 transition hover:border-red-300 hover:bg-red-50 hover:text-red-700 disabled:opacity-60"
          >
            {pending ? (
              <Loader2 className="h-4 w-4 animate-spin text-emerald-700" />
            ) : (
              <>
                <span className="inline-flex items-center gap-1.5 group-hover:hidden">
                  <Check className="h-4 w-4 text-emerald-600" />
                  {attendanceLabel}
                </span>
                <span className="hidden items-center gap-1.5 group-hover:inline-flex">
                  Cancel RSVP
                </span>
              </>
            )}
          </button>
        ) : (
          <button
            type="button"
            onClick={handleActionClick}
            disabled={pending}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-violet-600 px-5 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-700 disabled:opacity-60"
          >
            {pending ? (
              <Loader2 className="h-4 w-4 animate-spin text-white" />
            ) : (
              <>
                {participationModel === "paid" ? (
                  <Ticket className="h-4 w-4" />
                ) : participationModel === "registration" ? (
                  <ClipboardList className="h-4 w-4" />
                ) : (
                  <Users className="h-4 w-4" />
                )}
                {participationModel === "registration" ? "Register now" : "Attend event"}
              </>
            )}
          </button>
        )}

        {errorMessage && (
          <p className="text-center text-xs text-red-600">{errorMessage}</p>
        )}
      </div>

      {/* Registration Modal */}
      <RegistrationModal
        isOpen={isRegModalOpen}
        onClose={() => setIsRegModalOpen(false)}
        eventId={eventId}
        eventTitle={eventTitle}
        participationConfig={participationConfig}
        initialName={userName}
        initialEmail={userEmail}
        onSuccess={() => {
          setStatus("registered");
          setIsRegModalOpen(false);
        }}
      />

      {/* Cancellation Confirmation Modal */}
      <CancellationModal
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        onConfirm={handleConfirmCancel}
        eventTitle={eventTitle}
        isPending={pending}
      />
    </>
  );
}
