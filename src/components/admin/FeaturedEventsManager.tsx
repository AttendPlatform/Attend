"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  Bell,
  CalendarDays,
  Eye,
  MousePointerClick,
  Pause,
  Play,
  Sparkles,
  Trash2,
} from "lucide-react";
import {
  dispatchFeaturedEventCampaignAction,
  featureEventAction,
  removeFeaturedEventAction,
  updateFeaturedEventStatusAction,
} from "@/app/actions/promotions";
import { toast } from "@/hooks/use-toast";
import type {
  FeaturedEventNotificationMode,
  FeaturedEventPriority,
  FeaturedEventSummary,
  FeaturedEventWithEvent,
} from "@/types/promotions";

interface FeaturedEventsManagerProps {
  initialFeaturedEvents: FeaturedEventWithEvent[];
  availableEvents: FeaturedEventSummary[];
}

function toLocalDateTimeInput(date: Date): string {
  const offsetMs = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
}

const PRIORITY_LABELS: Record<FeaturedEventPriority, string> = {
  standard: "Standard",
  high_priority: "High priority",
  campaign_level: "Campaign level",
};

const MODE_LABELS: Record<FeaturedEventNotificationMode, string> = {
  platform_only: "Platform placement only",
  selected_audience: "Selected audience",
  broad_announcement: "Broad announcement",
  scheduled_campaign: "Scheduled campaign",
};

export function FeaturedEventsManager({
  initialFeaturedEvents,
  availableEvents,
}: FeaturedEventsManagerProps) {
  const [featuredEvents, setFeaturedEvents] = useState<FeaturedEventWithEvent[]>(
    initialFeaturedEvents
  );
  const [eventId, setEventId] = useState<string>(availableEvents[0]?.id ?? "");
  const [priority, setPriority] = useState<FeaturedEventPriority>("high_priority");
  const [notificationMode, setNotificationMode] =
    useState<FeaturedEventNotificationMode>("platform_only");
  const [promotionalMessage, setPromotionalMessage] = useState("");
  const [promotionalImageUrl, setPromotionalImageUrl] = useState("");
  const [targetCitiesInput, setTargetCitiesInput] = useState("");
  const [pastAttendeesOnly, setPastAttendeesOnly] = useState(false);
  const [startAt, setStartAt] = useState(() => toLocalDateTimeInput(new Date()));
  const [endAt, setEndAt] = useState(() =>
    toLocalDateTimeInput(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000))
  );
  const [isPending, startTransition] = useTransition();

  function handleCreate(event: React.FormEvent) {
    event.preventDefault();
    if (!eventId) {
      toast.error("Please select an event to feature.");
      return;
    }

    const startMs = Date.parse(startAt);
    const endMs = Date.parse(endAt);
    if (Number.isNaN(startMs) || Number.isNaN(endMs) || endMs <= startMs) {
      toast.error("Please enter a valid schedule where end date is after start date.");
      return;
    }

    const cities = targetCitiesInput
      .split(",")
      .map((city) => city.trim())
      .filter(Boolean);

    startTransition(async () => {
      const response = await featureEventAction({
        eventId,
        priority,
        notificationMode,
        promotionalMessage: promotionalMessage.trim() || null,
        promotionalImageUrl: promotionalImageUrl.trim() || null,
        targetAudience: {
          ...(cities.length > 0 ? { cities } : {}),
          ...(pastAttendeesOnly ? { past_attendees: true } : {}),
        },
        startAt: new Date(startMs).toISOString(),
        endAt: new Date(endMs).toISOString(),
        status: "active",
      });

      if (!response.ok || !response.featured) {
        toast.error(response.error ?? "Unable to feature event.");
        return;
      }

      setFeaturedEvents((prev) => [response.featured!, ...prev]);
      setPromotionalMessage("");
      setPromotionalImageUrl("");
      setTargetCitiesInput("");
      setPastAttendeesOnly(false);

      if (response.dispatch && !response.dispatch.skipped) {
        toast.success(
          `Event featured and ${response.dispatch.dispatchedCount} notification(s) dispatched.`
        );
      } else {
        toast.success("Event featured successfully.");
      }
    });
  }

  function handleToggleStatus(item: FeaturedEventWithEvent) {
    const nextStatus = item.status === "active" ? "paused" : "active";
    startTransition(async () => {
      const response = await updateFeaturedEventStatusAction(item.id, nextStatus);
      if (!response.ok || !response.featured) {
        toast.error(response.error ?? "Failed to update featured status.");
        return;
      }
      setFeaturedEvents((prev) =>
        prev.map((row) => (row.id === item.id ? response.featured! : row))
      );
      toast.success(
        nextStatus === "active" ? "Featured event activated." : "Featured event paused."
      );
    });
  }

  function handleDispatchCampaign(item: FeaturedEventWithEvent) {
    startTransition(async () => {
      const response = await dispatchFeaturedEventCampaignAction(item.id);
      if (!response.ok || !response.result) {
        toast.error(response.error ?? "Failed to dispatch notifications.");
        return;
      }
      if (response.result.skipped) {
        toast.info(`Skipped dispatch (${response.result.reason}).`);
        return;
      }
      toast.success(
        `Dispatched ${response.result.dispatchedCount} of ${response.result.eligibleRecipients} eligible notifications.`
      );
    });
  }

  function handleRemove(featuredId: string) {
    startTransition(async () => {
      const response = await removeFeaturedEventAction(featuredId);
      if (!response.ok) {
        toast.error(response.error ?? "Failed to remove featured event.");
        return;
      }
      setFeaturedEvents((prev) => prev.filter((row) => row.id !== featuredId));
      toast.success("Featured event removed.");
    });
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[400px_1fr]">
      <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2 text-violet-700">
          <Sparkles className="h-4 w-4" />
          <h2 className="font-serif text-lg font-bold text-neutral-950">
            Feature an event
          </h2>
        </div>
        <p className="mt-1 text-xs text-neutral-500">
          Promote a published event on Home and Discover with optional audience notifications.
        </p>

        <form onSubmit={handleCreate} className="mt-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-neutral-700">
              Event
            </label>
            <select
              value={eventId}
              onChange={(e) => setEventId(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-violet-500 focus:outline-none"
            >
              {availableEvents.length === 0 ? (
                <option value="">No published events found</option>
              ) : (
                availableEvents.map((ev) => (
                  <option key={ev.id} value={ev.id}>
                    {ev.title} {ev.city ? `(${ev.city})` : ""}
                  </option>
                ))
              )}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-neutral-700">
                Priority tier
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as FeaturedEventPriority)}
                className="mt-1.5 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-violet-500 focus:outline-none"
              >
                <option value="standard">Standard</option>
                <option value="high_priority">High priority</option>
                <option value="campaign_level">Campaign level</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700">
                Notification mode
              </label>
              <select
                value={notificationMode}
                onChange={(e) =>
                  setNotificationMode(e.target.value as FeaturedEventNotificationMode)
                }
                className="mt-1.5 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-violet-500 focus:outline-none"
              >
                <option value="platform_only">Platform only</option>
                <option value="selected_audience">Selected audience</option>
                <option value="broad_announcement">Broad announcement</option>
                <option value="scheduled_campaign">Scheduled campaign</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-neutral-700">
                Start at
              </label>
              <input
                type="datetime-local"
                value={startAt}
                onChange={(e) => setStartAt(e.target.value)}
                required
                className="mt-1.5 w-full rounded-xl border border-neutral-200 px-3 py-2 text-xs text-neutral-900 focus:border-violet-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700">
                End at
              </label>
              <input
                type="datetime-local"
                value={endAt}
                onChange={(e) => setEndAt(e.target.value)}
                required
                className="mt-1.5 w-full rounded-xl border border-neutral-200 px-3 py-2 text-xs text-neutral-900 focus:border-violet-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700">
              Target cities (optional, comma-separated)
            </label>
            <input
              type="text"
              value={targetCitiesInput}
              onChange={(e) => setTargetCitiesInput(e.target.value)}
              placeholder="Lagos, Abuja, Port Harcourt"
              className="mt-1.5 w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm text-neutral-900 focus:border-violet-500 focus:outline-none"
            />
          </div>

          <label className="flex items-center gap-2 text-xs font-medium text-neutral-700">
            <input
              type="checkbox"
              checked={pastAttendeesOnly}
              onChange={(e) => setPastAttendeesOnly(e.target.checked)}
              className="h-4 w-4 rounded border-neutral-300 text-violet-600 focus:ring-violet-500"
            />
            Prioritize past event attendees when notifying selected audience
          </label>

          <div>
            <label className="block text-xs font-semibold text-neutral-700">
              Promotional message
            </label>
            <textarea
              rows={2}
              maxLength={280}
              value={promotionalMessage}
              onChange={(e) => setPromotionalMessage(e.target.value)}
              placeholder="Highlight what makes this event worth attending."
              className="mt-1.5 w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm text-neutral-900 focus:border-violet-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700">
              Promotional image URL (optional)
            </label>
            <input
              type="text"
              value={promotionalImageUrl}
              onChange={(e) => setPromotionalImageUrl(e.target.value)}
              placeholder="https://... or /images/promo.jpg"
              className="mt-1.5 w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm text-neutral-900 focus:border-violet-500 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={isPending || availableEvents.length === 0}
            className="w-full rounded-full bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-700 disabled:opacity-50"
          >
            {isPending ? "Saving..." : "Feature event"}
          </button>
        </form>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-serif text-lg font-bold text-neutral-950">
              Featured events ({featuredEvents.length})
            </h2>
            <p className="text-xs text-neutral-500">
              Ordered by priority tier (`campaign_level`, `high_priority`, `standard`).
            </p>
          </div>
        </div>

        {featuredEvents.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-neutral-300 bg-white p-10 text-center text-sm text-neutral-500">
            No featured events configured yet.
          </div>
        ) : (
          <div className="space-y-3">
            {featuredEvents.map((item) => (
              <article
                key={item.id}
                className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-violet-50 px-2.5 py-0.5 text-[11px] font-semibold text-violet-700">
                        {PRIORITY_LABELS[item.priority]}
                      </span>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold capitalize ${
                          item.status === "active"
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-neutral-100 text-neutral-600"
                        }`}
                      >
                        {item.status}
                      </span>
                      <span className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-[11px] font-medium text-neutral-600">
                        {MODE_LABELS[item.notification_mode]}
                      </span>
                    </div>

                    <h3 className="mt-2 font-serif text-base font-bold text-neutral-950">
                      {item.event ? (
                        <Link
                          href={`/events/${item.event.id}`}
                          className="hover:text-violet-700"
                        >
                          {item.event.title}
                        </Link>
                      ) : (
                        "Event unavailable"
                      )}
                    </h3>

                    {item.promotional_message && (
                      <p className="mt-1 text-xs text-neutral-600">
                        {item.promotional_message}
                      </p>
                    )}

                    <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-neutral-500">
                      <span className="inline-flex items-center gap-1">
                        <CalendarDays className="h-3.5 w-3.5" />
                        {new Date(item.start_at).toLocaleDateString()} to{" "}
                        {new Date(item.end_at).toLocaleDateString()}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Eye className="h-3.5 w-3.5" />
                        {item.views_count} views
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <MousePointerClick className="h-3.5 w-3.5" />
                        {item.clicks_count} clicks
                      </span>
                      <span>{item.saves_count} saves</span>
                      <span>{item.registrations_count} registrations</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      disabled={isPending || item.notification_mode === "platform_only"}
                      onClick={() => handleDispatchCampaign(item)}
                      className="inline-flex items-center gap-1.5 rounded-full border border-violet-200 bg-violet-50 px-3 py-1.5 text-xs font-semibold text-violet-700 transition hover:bg-violet-100 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <Bell className="h-3.5 w-3.5" />
                      Notify
                    </button>

                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => handleToggleStatus(item)}
                      className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 px-3 py-1.5 text-xs font-semibold text-neutral-700 transition hover:bg-neutral-50 disabled:opacity-50"
                    >
                      {item.status === "active" ? (
                        <>
                          <Pause className="h-3.5 w-3.5" />
                          Pause
                        </>
                      ) : (
                        <>
                          <Play className="h-3.5 w-3.5" />
                          Activate
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => handleRemove(item.id)}
                      aria-label="Remove featured event"
                      className="inline-flex items-center gap-1 rounded-full border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Remove
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
