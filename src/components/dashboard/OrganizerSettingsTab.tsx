"use client";

import { useState, useTransition } from "react";
import {
  CalendarDays,
  MapPin,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  X,
  FileText,
  Sliders,
} from "lucide-react";
import type { OrganizerEventDetails } from "@/services/organizer.service";
import {
  updateEventDetailsAction,
  cancelEventAction,
} from "@/app/actions/organizer";

interface OrganizerSettingsTabProps {
  event: OrganizerEventDetails;
}

export function OrganizerSettingsTab({ event }: OrganizerSettingsTabProps) {
  const [title, setTitle] = useState(event.title || "");
  const [description, setDescription] = useState(event.description || "");
  const [startAt, setStartAt] = useState(
    event.start_at ? new Date(event.start_at).toISOString().slice(0, 16) : ""
  );
  const [endAt, setEndAt] = useState(
    event.end_at ? new Date(event.end_at).toISOString().slice(0, 16) : ""
  );
  const [venueName, setVenueName] = useState(event.venue_name || "");
  const [city, setCity] = useState(event.city || "");
  const [isOnline, setIsOnline] = useState(Boolean(event.is_online));
  const [allowParticipantCampaigns, setAllowParticipantCampaigns] = useState(
    Boolean(event.allow_participant_campaigns)
  );

  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const [isSaving, startSaveTransition] = useTransition();
  const [isCancelling, startCancelTransition] = useTransition();

  const isCancelled = event.status.toLowerCase() === "cancelled";

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);

    startSaveTransition(async () => {
      const res = await updateEventDetailsAction(event.id, {
        title,
        description,
        start_at: startAt ? new Date(startAt).toISOString() : undefined,
        end_at: endAt ? new Date(endAt).toISOString() : null,
        venue_name: venueName,
        city,
        is_online: isOnline,
        allow_participant_campaigns: allowParticipantCampaigns,
      });

      if (res.success) {
        setStatusMessage({
          type: "success",
          text: "Event settings saved successfully.",
        });
      } else {
        setStatusMessage({
          type: "error",
          text: res.error || "Failed to save settings. Please try again.",
        });
      }
    });
  };

  const handleConfirmCancel = () => {
    startCancelTransition(async () => {
      const res = await cancelEventAction(event.id);
      if (res.success) {
        setIsCancelModalOpen(false);
        setStatusMessage({
          type: "success",
          text: "Event has been cancelled. Attendees will be notified.",
        });
      } else {
        setStatusMessage({
          type: "error",
          text: res.error || "Failed to cancel event.",
        });
      }
    });
  };

  return (
    <div className="space-y-8 max-w-4xl">
      {/* HEADER */}
      <div>
        <h2 className="font-serif text-xl font-bold text-neutral-900 sm:text-2xl">
          Event Settings
        </h2>
        <p className="mt-1 text-xs text-neutral-500 sm:text-sm">
          Update event details, configure campaign creation permissions, or manage cancellation.
        </p>
      </div>

      {/* STATUS BANNER */}
      {statusMessage && (
        <div
          className={`flex items-center gap-2 rounded-xl p-3.5 text-xs font-medium ${
            statusMessage.type === "success"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          {statusMessage.type === "success" ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertTriangle className="h-4 w-4 text-red-600 shrink-0" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* FORM */}
      <form onSubmit={handleSaveSettings} className="space-y-6">
        {/* 1. BASIC DETAILS */}
        <div className="rounded-2xl border border-neutral-200 bg-white p-5 sm:p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-neutral-100 pb-3">
            <FileText className="h-4 w-4 text-violet-600" />
            <h3 className="font-serif text-base font-bold text-neutral-900">
              Basic Details
            </h3>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700">
              Event Title
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-neutral-200 bg-white px-3.5 py-2.5 text-xs text-neutral-900 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
              placeholder="e.g. Lagos Tech Fest 2026"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700">
              Event Description
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-neutral-200 bg-white px-3.5 py-2.5 text-xs text-neutral-900 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
              placeholder="Tell attendees about this event..."
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 flex items-center gap-1.5">
                <CalendarDays className="h-3.5 w-3.5 text-neutral-400" />
                <span>Start Date and Time</span>
              </label>
              <input
                type="datetime-local"
                value={startAt}
                onChange={(e) => setStartAt(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-neutral-200 bg-white px-3.5 py-2 text-xs text-neutral-900 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 flex items-center gap-1.5">
                <CalendarDays className="h-3.5 w-3.5 text-neutral-400" />
                <span>End Date and Time</span>
              </label>
              <input
                type="datetime-local"
                value={endAt}
                onChange={(e) => setEndAt(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-neutral-200 bg-white px-3.5 py-2 text-xs text-neutral-900 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
              />
            </div>
          </div>
        </div>

        {/* 2. LOCATION & FORMAT */}
        <div className="rounded-2xl border border-neutral-200 bg-white p-5 sm:p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-neutral-100 pb-3">
            <MapPin className="h-4 w-4 text-violet-600" />
            <h3 className="font-serif text-base font-bold text-neutral-900">
              Location and Format
            </h3>
          </div>

          <div className="flex items-center gap-3">
            <label className="inline-flex items-center gap-2 text-xs font-medium text-neutral-700 cursor-pointer">
              <input
                type="checkbox"
                checked={isOnline}
                onChange={(e) => setIsOnline(e.target.checked)}
                className="h-4 w-4 rounded border-neutral-300 text-violet-600 focus:ring-violet-500"
              />
              <span>This is a virtual / online event</span>
            </label>
          </div>

          {!isOnline && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-neutral-700">
                  Venue Name
                </label>
                <input
                  type="text"
                  value={venueName}
                  onChange={(e) => setVenueName(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-neutral-200 bg-white px-3.5 py-2.5 text-xs text-neutral-900 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
                  placeholder="e.g. Landmark Centre"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700">
                  City
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-neutral-200 bg-white px-3.5 py-2.5 text-xs text-neutral-900 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
                  placeholder="e.g. Lagos"
                />
              </div>
            </div>
          )}
        </div>

        {/* 3. CAMPAIGN PERMISSIONS */}
        <div className="rounded-2xl border border-neutral-200 bg-white p-5 sm:p-6 shadow-sm space-y-3">
          <div className="flex items-center gap-2 border-b border-neutral-100 pb-3">
            <Sliders className="h-4 w-4 text-violet-600" />
            <h3 className="font-serif text-base font-bold text-neutral-900">
              Campaign Permissions
            </h3>
          </div>

          <div className="flex items-start justify-between gap-4 pt-1">
            <div>
              <p className="text-xs font-semibold text-neutral-900">
                Allow participants to create campaigns
              </p>
              <p className="mt-0.5 text-xs text-neutral-500">
                When enabled, attendees can design their own custom promotional flyers attached to this event.
              </p>
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={allowParticipantCampaigns}
              onClick={() => setAllowParticipantCampaigns(!allowParticipantCampaigns)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-violet-600 focus:ring-offset-2 ${
                allowParticipantCampaigns ? "bg-violet-600" : "bg-neutral-200"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  allowParticipantCampaigns ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </div>

        {/* SAVE BUTTON */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-6 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-violet-700 disabled:opacity-60"
          >
            {isSaving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            <span>Save Settings</span>
          </button>
        </div>
      </form>

      {/* 4. DANGER ZONE: SAFE CANCELLATION */}
      <div className="rounded-2xl border border-red-200 bg-red-50/40 p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2 border-b border-red-100 pb-3">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <h3 className="font-serif text-base font-bold text-red-950">
            Cancel Event
          </h3>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs text-neutral-700">
              {isCancelled
                ? "This event has already been cancelled. User assets and campaign flyers remain preserved."
                : "Cancelling this event will notify all confirmed attendees and mark connected campaigns with a cancelled notice."}
            </p>
            <p className="mt-1 text-[11px] text-red-700 font-medium">
              This action cannot be undone. User graphics will not be deleted.
            </p>
          </div>

          {!isCancelled && (
            <button
              type="button"
              onClick={() => setIsCancelModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-red-300 bg-white px-4 py-2 text-xs font-semibold text-red-700 shadow-sm transition hover:bg-red-50 shrink-0"
            >
              <AlertTriangle className="h-3.5 w-3.5" />
              <span>Cancel Event</span>
            </button>
          )}

          {isCancelled && (
            <span className="inline-flex items-center rounded-full bg-red-100 px-3 py-1 text-xs font-bold uppercase tracking-wider text-red-800">
              Event Cancelled
            </span>
          )}
        </div>
      </div>

      {/* CONFIRMATION MODAL */}
      {isCancelModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/60 backdrop-blur-sm"
        >
          <div className="w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2.5 text-red-600">
                <div className="rounded-xl bg-red-50 p-2">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <h4 className="font-serif text-lg font-bold text-neutral-950">
                  Cancel Event Confirmation
                </h4>
              </div>

              <button
                type="button"
                onClick={() => setIsCancelModalOpen(false)}
                className="rounded-lg p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="mt-3 text-xs leading-relaxed text-neutral-600">
              Are you sure you want to cancel <strong className="text-neutral-900">{event.title}</strong>? Confirmed attendees will be notified, and all linked campaign templates will display a cancelled banner.
            </p>

            <div className="mt-6 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setIsCancelModalOpen(false)}
                disabled={isCancelling}
                className="rounded-xl border border-neutral-200 bg-white px-4 py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-50"
              >
                Keep Event Active
              </button>

              <button
                type="button"
                onClick={handleConfirmCancel}
                disabled={isCancelling}
                className="inline-flex items-center gap-1.5 rounded-xl bg-red-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-red-700 disabled:opacity-60"
              >
                {isCancelling && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                <span>Yes, Cancel Event</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

