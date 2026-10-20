"use client";

import { useEffect } from "react";
import { AlertTriangle, Loader2, X } from "lucide-react";

export interface CancellationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  eventTitle: string;
  isPending?: boolean;
}

export default function CancellationModal({
  isOpen,
  onClose,
  onConfirm,
  eventTitle,
  isPending = false,
}: CancellationModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen && !isPending) {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isPending, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="cancel-dialog-title"
      aria-describedby="cancel-dialog-description"
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-neutral-900/60 p-4 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isPending) {
          onClose();
        }
      }}
    >
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-neutral-100 bg-white p-6 shadow-2xl transition-all animate-in zoom-in-95 duration-200">
        <button
          type="button"
          onClick={onClose}
          disabled={isPending}
          className="absolute right-5 top-5 rounded-full p-1.5 text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-700 disabled:opacity-50"
          aria-label="Close dialog"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 ring-8 ring-amber-50/50">
          <AlertTriangle className="h-6 w-6" />
        </div>

        <h3
          id="cancel-dialog-title"
          className="mt-4 text-lg font-bold tracking-tight text-neutral-900"
        >
          Cancel your attendance?
        </h3>

        <p
          id="cancel-dialog-description"
          className="mt-2 text-xs leading-5 text-neutral-600"
        >
          Are you sure you want to cancel your RSVP for{" "}
          <span className="font-semibold text-neutral-900">{eventTitle}</span>?
          Your spot will be released, and you may need to register again if capacity allows.
        </p>

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="w-full rounded-full border border-neutral-200 bg-white px-5 py-2.5 text-xs font-semibold text-neutral-700 transition hover:bg-neutral-50 disabled:opacity-50 sm:w-auto"
          >
            Keep my RSVP
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isPending}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-red-600 px-5 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-red-700 disabled:opacity-60 sm:w-auto"
          >
            {isPending ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Cancelling...</span>
              </>
            ) : (
              <span>Yes, cancel RSVP</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
