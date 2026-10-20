"use client";

import { useEffect, useRef, useCallback } from "react";
import { AlertCircle, Loader2, X } from "lucide-react";
import { useEventAttendance } from "./EventAttendanceProvider";

interface CancelRsvpModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  onConfirm?: () => void;
  eventTitle?: string;
  isPending?: boolean;
  triggerElement?: HTMLElement | null;
}

export default function CancelRsvpModal(props: CancelRsvpModalProps) {
  const context = useEventAttendance();

  const isOpen = props.isOpen ?? context?.isCancelModalOpen ?? false;
  const onClose = props.onClose ?? context?.closeCancelModal;
  const onConfirm = props.onConfirm ?? context?.handleConfirmCancel;
  const eventTitle = props.eventTitle ?? context?.eventTitle ?? "this event";
  const isPending = props.isPending ?? context?.isPending ?? false;
  const triggerElement = props.triggerElement ?? context?.triggerElement ?? null;

  const modalRef = useRef<HTMLDivElement>(null);
  const keepButtonRef = useRef<HTMLButtonElement>(null);

  // Restore focus to trigger element when closing
  const handleClose = useCallback(() => {
    if (isPending) return;
    onClose?.();
    if (triggerElement && typeof triggerElement.focus === "function") {
      // Defer focus restoration slightly to ensure DOM transition completes
      requestAnimationFrame(() => {
        triggerElement.focus();
      });
    }
  }, [isPending, onClose, triggerElement]);

  // Trap focus and handle ESC key inside modal
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // Initial focus on the safe "Keep My Spot" button
    const focusTimer = setTimeout(() => {
      keepButtonRef.current?.focus();
    }, 50);

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        handleClose();
        return;
      }

      if (event.key !== "Tab" || !modalRef.current) return;

      const focusableElements = modalRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );

      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (event.shiftKey) {
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      clearTimeout(focusTimer);
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen, handleClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={handleClose}
      role="presentation"
    >
      <div
        ref={modalRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="cancel-rsvp-title"
        aria-describedby="cancel-rsvp-description"
        className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white p-6 shadow-2xl transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={handleClose}
          disabled={isPending}
          aria-label="Close modal"
          className="absolute right-4 top-4 rounded-full p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 disabled:opacity-50"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-600">
            <AlertCircle className="h-6 w-6" />
          </div>

          <div className="min-w-0 flex-1">
            <h3
              id="cancel-rsvp-title"
              className="text-lg font-bold text-neutral-900"
            >
              Cancel your RSVP?
            </h3>
            <p
              id="cancel-rsvp-description"
              className="mt-2 text-sm leading-relaxed text-neutral-600"
            >
              Are you sure you want to cancel your attendance for{" "}
              <span className="font-semibold text-neutral-800">{eventTitle}</span>?
              You can always RSVP again later if spots remain, but your current
              spot will no longer be reserved.
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            ref={keepButtonRef}
            type="button"
            onClick={handleClose}
            disabled={isPending}
            className="inline-flex h-11 items-center justify-center rounded-xl border border-neutral-300 bg-white px-4 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600 disabled:opacity-50"
          >
            Keep My Spot
          </button>

          <button
            type="button"
            onClick={() => onConfirm?.()}
            disabled={isPending}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-red-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 disabled:opacity-60"
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-white" />
                Cancelling...
              </>
            ) : (
              "Yes, Cancel RSVP"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
