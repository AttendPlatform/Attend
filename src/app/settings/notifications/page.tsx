"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "@/hooks/use-toast";
import {
  subscribeToPush,
  unsubscribeFromPush,
} from "@/lib/notifications/push";

interface NotificationPreferences {
  event_reminders: boolean;
  new_events: boolean;
  trending_events: boolean;
  campaign_activity: boolean;
  campaign_milestones: boolean;
  recommendations: boolean;
  campaign_insights: boolean;
  abandoned_reminders_enabled: boolean;
  social_notifications_enabled: boolean;
  push_enabled: boolean;
  email_enabled: boolean;
  smart_notifications: boolean;
  max_daily_notifications: number;
  quiet_hours_enabled: boolean;
  quiet_hours_start: string | null;
  quiet_hours_end: string | null;
  timezone: string;
}

const PRESET_TIMEZONES = [
  { value: "Africa/Lagos", label: "Africa/Lagos (WAT)" },
  { value: "Africa/Accra", label: "Africa/Accra" },
  { value: "Africa/Nairobi", label: "Africa/Nairobi" },
  { value: "Europe/London", label: "Europe/London" },
  { value: "America/New_York", label: "America/New_York" },
  { value: "UTC", label: "UTC" },
];

const DAILY_LIMIT_OPTIONS = [
  { value: 3, label: "3 per day" },
  { value: 5, label: "5 per day (Recommended)" },
  { value: 10, label: "10 per day" },
];

function detectLocalTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "Africa/Lagos";
  } catch {
    return "Africa/Lagos";
  }
}

const DEFAULT_PREFERENCES: NotificationPreferences = {
  event_reminders: true,
  new_events: true,
  trending_events: true,
  campaign_activity: true,
  campaign_milestones: true,
  recommendations: true,
  campaign_insights: true,
  abandoned_reminders_enabled: true,
  social_notifications_enabled: true,
  push_enabled: false,
  email_enabled: false,
  smart_notifications: true,
  max_daily_notifications: 5,
  quiet_hours_enabled: false,
  quiet_hours_start: "22:00",
  quiet_hours_end: "07:00",
  timezone: "Africa/Lagos",
};

interface ToggleRowProps {
  title: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
}

function ToggleRow({
  title,
  description,
  checked,
  onChange,
  disabled = false,
}: ToggleRowProps) {
  return (
    <div className="flex items-center justify-between gap-6 py-5">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-neutral-900">{title}</p>
        <p className="mt-1 max-w-2xl text-sm leading-6 text-neutral-500">
          {description}
        </p>
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={title}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={[
          "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition",
          "focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2",
          checked ? "bg-violet-600" : "bg-neutral-300",
          disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer",
        ].join(" ")}
      >
        <span
          className={[
            "inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition",
            checked ? "translate-x-5" : "translate-x-0.5",
          ].join(" ")}
        />
      </button>
    </div>
  );
}

export default function NotificationSettingsPage() {
  const supabase = createClient();
  const detectedTimezone = useMemo(() => detectLocalTimezone(), []);

  const [preferences, setPreferences] = useState<NotificationPreferences>(() => ({
    ...DEFAULT_PREFERENCES,
    timezone: detectLocalTimezone(),
  }));

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const timezoneOptions = useMemo(() => {
    const hasDetected = PRESET_TIMEZONES.some(
      (tz) => tz.value === detectedTimezone
    );
    const base = hasDetected
      ? PRESET_TIMEZONES
      : [
          {
            value: detectedTimezone,
            label: `${detectedTimezone} (Detected)`,
          },
          ...PRESET_TIMEZONES,
        ];
    if (
      preferences.timezone &&
      !base.some((tz) => tz.value === preferences.timezone)
    ) {
      return [
        { value: preferences.timezone, label: preferences.timezone },
        ...base,
      ];
    }
    return base;
  }, [detectedTimezone, preferences.timezone]);

  useEffect(() => {
    let active = true;

    const loadPreferences = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!active) return;
        if (!user) {
          setLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from("notification_preferences")
          .select(
            `
              event_reminders,
              new_events,
              trending_events,
              campaign_activity,
              campaign_milestones,
              recommendations,
              campaign_insights,
              abandoned_reminders_enabled,
              social_notifications_enabled,
              push_enabled,
              email_enabled,
              smart_notifications,
              max_daily_notifications,
              quiet_hours_enabled,
              quiet_hours_start,
              quiet_hours_end,
              timezone
            `
          )
          .eq("user_id", user.id)
          .maybeSingle();

        if (!active) return;
        if (error) {
          throw error;
        }

        if (data) {
          setPreferences({
            event_reminders: data.event_reminders,
            new_events: data.new_events,
            trending_events: data.trending_events,
            campaign_activity: data.campaign_activity,
            campaign_milestones: data.campaign_milestones,
            recommendations: data.recommendations,
            campaign_insights: data.campaign_insights,
            abandoned_reminders_enabled:
              data.abandoned_reminders_enabled ?? true,
            social_notifications_enabled:
              data.social_notifications_enabled ?? true,
            push_enabled: data.push_enabled,
            email_enabled: data.email_enabled,
            smart_notifications: data.smart_notifications,
            max_daily_notifications: data.max_daily_notifications ?? 5,
            quiet_hours_enabled: data.quiet_hours_enabled,
            quiet_hours_start: data.quiet_hours_start,
            quiet_hours_end: data.quiet_hours_end,
            timezone: data.timezone || detectedTimezone,
          });
        }
      } catch (error) {
        if (!active) return;
        console.error(
          "[Attend Notifications] Failed to load preferences:",
          error
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadPreferences();

    return () => {
      active = false;
    };
  }, [supabase, detectedTimezone]);

  const persistPreferences = async (
    nextPreferences: NotificationPreferences
  ) => {
    const { error } = await supabase.rpc(
      "update_notification_preferences",
      {
        p_event_reminders: nextPreferences.event_reminders,
        p_new_events: nextPreferences.new_events,
        p_trending_events: nextPreferences.trending_events,
        p_campaign_activity: nextPreferences.campaign_activity,
        p_campaign_milestones: nextPreferences.campaign_milestones,
        p_recommendations: nextPreferences.recommendations,
        p_campaign_insights: nextPreferences.campaign_insights,
        p_push_enabled: nextPreferences.push_enabled,
        p_email_enabled: nextPreferences.email_enabled,
        p_smart_notifications: nextPreferences.smart_notifications,
        p_quiet_hours_enabled: nextPreferences.quiet_hours_enabled,
        p_quiet_hours_start: nextPreferences.quiet_hours_enabled
          ? nextPreferences.quiet_hours_start || undefined
          : undefined,
        p_quiet_hours_end: nextPreferences.quiet_hours_enabled
          ? nextPreferences.quiet_hours_end || undefined
          : undefined,
      }
    );

    if (error) {
      throw error;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { error: extendedError } = await supabase
        .from("notification_preferences")
        .update({
          timezone: nextPreferences.timezone,
          abandoned_reminders_enabled:
            nextPreferences.abandoned_reminders_enabled,
          social_notifications_enabled:
            nextPreferences.social_notifications_enabled,
          max_daily_notifications: nextPreferences.max_daily_notifications,
        })
        .eq("user_id", user.id);

      if (extendedError) {
        throw extendedError;
      }
    }
  };

  const applyPreferenceUpdate = async <K extends keyof NotificationPreferences>(
    key: K,
    value: NotificationPreferences[K],
    successMessage?: string
  ) => {
    if (saving) return;

    const previousPreferences = preferences;
    const nextPreferences: NotificationPreferences = {
      ...preferences,
      [key]: value,
    };

    setPreferences(nextPreferences);
    setSaving(true);

    try {
      await persistPreferences(nextPreferences);
      if (successMessage) {
        toast.success(successMessage);
      }
    } catch (error) {
      console.error(
        `[Attend Notifications] Failed to save "${String(key)}":`,
        error
      );
      setPreferences(previousPreferences);
      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to save notification setting."
      );
    } finally {
      setSaving(false);
    }
  };

  const handlePushToggle = async (value: boolean) => {
    if (saving) return;

    const previousPreferences = preferences;
    setSaving(true);

    try {
      if (value) {
        await subscribeToPush();
      } else {
        await unsubscribeFromPush();
      }

      const nextPreferences: NotificationPreferences = {
        ...preferences,
        push_enabled: value,
      };

      setPreferences(nextPreferences);
      await persistPreferences(nextPreferences);
      toast.success(
        value
          ? "Push notifications enabled."
          : "Push notifications disabled."
      );
    } catch (error) {
      console.error(
        "[Attend Notifications] Push notification preference error:",
        error
      );

      setPreferences(previousPreferences);
      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to update push notifications."
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-white">
        <div className="mx-auto max-w-3xl px-6 py-10">
          <div className="animate-pulse">
            <div className="h-8 w-56 rounded bg-neutral-200" />
            <div className="mt-3 h-4 w-96 max-w-full rounded bg-neutral-100" />

            <div className="mt-10 space-y-4">
              <div className="h-24 rounded-2xl bg-neutral-100" />
              <div className="h-24 rounded-2xl bg-neutral-100" />
              <div className="h-24 rounded-2xl bg-neutral-100" />
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-3xl px-6 py-10">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-950">
            Notification settings
          </h1>

          <p className="mt-2 text-sm leading-6 text-neutral-500">
            Choose what notifications you receive from Attend. Your changes
            are saved automatically.
          </p>
        </div>

        <div className="mt-8 space-y-8">
          {/* Event notifications */}
          <section className="rounded-2xl border border-neutral-200 bg-white">
            <div className="border-b border-neutral-200 px-6 py-5">
              <h2 className="text-base font-semibold text-neutral-950">
                Events
              </h2>

              <p className="mt-1 text-sm text-neutral-500">
                Stay informed about events and activity that matter to you.
              </p>
            </div>

            <div className="divide-y divide-neutral-100 px-6">
              <ToggleRow
                title="Event reminders"
                description="Get reminded about events you are attending or have registered for."
                checked={preferences.event_reminders}
                disabled={saving}
                onChange={(value) =>
                  applyPreferenceUpdate("event_reminders", value)
                }
              />

              <ToggleRow
                title="New events"
                description="Get notified when new events matching your interests are published."
                checked={preferences.new_events}
                disabled={saving}
                onChange={(value) =>
                  applyPreferenceUpdate("new_events", value)
                }
              />

              <ToggleRow
                title="Trending events"
                description="Receive updates about popular and trending events."
                checked={preferences.trending_events}
                disabled={saving}
                onChange={(value) =>
                  applyPreferenceUpdate("trending_events", value)
                }
              />

              <ToggleRow
                title="Recommendations"
                description="Receive personalized event recommendations based on your activity and interests."
                checked={preferences.recommendations}
                disabled={saving}
                onChange={(value) =>
                  applyPreferenceUpdate("recommendations", value)
                }
              />

              <ToggleRow
                title="Saved draft & registration reminders"
                description="Receive a helpful reminder when you have an unfinished event draft or registration so you can pick up where you left off."
                checked={preferences.abandoned_reminders_enabled}
                disabled={saving}
                onChange={(value) =>
                  applyPreferenceUpdate("abandoned_reminders_enabled", value)
                }
              />

              <ToggleRow
                title="Friends & social activity"
                description="Receive updates when friends or people in your network are attending events."
                checked={preferences.social_notifications_enabled}
                disabled={saving}
                onChange={(value) =>
                  applyPreferenceUpdate("social_notifications_enabled", value)
                }
              />
            </div>
          </section>

          {/* Campaign notifications */}
          <section className="rounded-2xl border border-neutral-200 bg-white">
            <div className="border-b border-neutral-200 px-6 py-5">
              <h2 className="text-base font-semibold text-neutral-950">
                Campaigns
              </h2>

              <p className="mt-1 text-sm text-neutral-500">
                Stay updated on campaigns and participation activity.
              </p>
            </div>

            <div className="divide-y divide-neutral-100 px-6">
              <ToggleRow
                title="Campaign activity"
                description="Get notified when people interact with your campaigns or campaigns you participate in."
                checked={preferences.campaign_activity}
                disabled={saving}
                onChange={(value) =>
                  applyPreferenceUpdate("campaign_activity", value)
                }
              />

              <ToggleRow
                title="Campaign milestones"
                description="Receive updates when your campaigns reach important participation milestones."
                checked={preferences.campaign_milestones}
                disabled={saving}
                onChange={(value) =>
                  applyPreferenceUpdate("campaign_milestones", value)
                }
              />

              <ToggleRow
                title="Campaign insights"
                description="Receive useful updates and insights about campaign performance."
                checked={preferences.campaign_insights}
                disabled={saving}
                onChange={(value) =>
                  applyPreferenceUpdate("campaign_insights", value)
                }
              />
            </div>
          </section>

          {/* Delivery */}
          <section className="rounded-2xl border border-neutral-200 bg-white">
            <div className="border-b border-neutral-200 px-6 py-5">
              <h2 className="text-base font-semibold text-neutral-950">
                Delivery
              </h2>

              <p className="mt-1 text-sm text-neutral-500">
                Choose how Attend can reach you.
              </p>
            </div>

            <div className="divide-y divide-neutral-100 px-6">
              <ToggleRow
                title="Push notifications"
                description="Receive notifications directly on your device, even when Attend is not open."
                checked={preferences.push_enabled}
                disabled={saving}
                onChange={handlePushToggle}
              />

              <ToggleRow
                title="Email notifications"
                description="Receive selected Attend notifications by email."
                checked={preferences.email_enabled}
                disabled={saving}
                onChange={(value) =>
                  applyPreferenceUpdate("email_enabled", value)
                }
              />

              <ToggleRow
                title="Smart notifications"
                description="Let Attend intelligently prioritize useful notifications and reduce unnecessary interruptions."
                checked={preferences.smart_notifications}
                disabled={saving}
                onChange={(value) =>
                  applyPreferenceUpdate("smart_notifications", value)
                }
              />

              <div className="flex flex-col gap-3 py-5 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
                <div className="min-w-0 flex-1">
                  <label
                    htmlFor="daily-notification-limit"
                    className="text-sm font-semibold text-neutral-900"
                  >
                    Daily smart notification limit
                  </label>
                  <p className="mt-1 max-w-2xl text-sm leading-6 text-neutral-500">
                    Cap non-urgent smart notifications delivered in any 24-hour window.
                  </p>
                </div>

                <select
                  id="daily-notification-limit"
                  value={preferences.max_daily_notifications}
                  disabled={saving}
                  onChange={(event) =>
                    applyPreferenceUpdate(
                      "max_daily_notifications",
                      Number(event.target.value),
                      "Daily notification limit updated."
                    )
                  }
                  className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 disabled:cursor-not-allowed disabled:bg-neutral-50 sm:w-56"
                >
                  {DAILY_LIMIT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          {/* Quiet hours */}
          <section className="rounded-2xl border border-neutral-200 bg-white">
            <div className="border-b border-neutral-200 px-6 py-5">
              <h2 className="text-base font-semibold text-neutral-950">
                Quiet hours
              </h2>

              <p className="mt-1 text-sm text-neutral-500">
                Pause non-urgent notifications during a specific time period.
              </p>
            </div>

            <div className="px-6">
              <ToggleRow
                title="Enable quiet hours"
                description="Temporarily reduce non-urgent notifications during your selected hours."
                checked={preferences.quiet_hours_enabled}
                disabled={saving}
                onChange={(value) =>
                  applyPreferenceUpdate("quiet_hours_enabled", value)
                }
              />

              <div className="border-t border-neutral-100 py-5">
                <label
                  htmlFor="quiet-hours-timezone"
                  className="block text-sm font-semibold text-neutral-900"
                >
                  Time zone
                </label>

                <p className="mt-1 text-xs text-neutral-500">
                  Quiet hours are evaluated in this time zone.
                </p>

                <select
                  id="quiet-hours-timezone"
                  value={preferences.timezone}
                  disabled={saving}
                  onChange={(event) =>
                    applyPreferenceUpdate(
                      "timezone",
                      event.target.value,
                      "Time zone updated."
                    )
                  }
                  className="mt-3 block w-full rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm text-neutral-900 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 disabled:cursor-not-allowed disabled:bg-neutral-50 sm:max-w-xs"
                >
                  {timezoneOptions.map((tz) => (
                    <option key={tz.value} value={tz.value}>
                      {tz.label}
                    </option>
                  ))}
                </select>
              </div>

              {preferences.quiet_hours_enabled && (
                <div className="grid gap-5 border-t border-neutral-100 py-5 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="quiet-hours-start"
                      className="block text-sm font-semibold text-neutral-900"
                    >
                      Start time
                    </label>

                    <p className="mt-1 text-xs text-neutral-500">
                      Notifications will be reduced from this time.
                    </p>

                    <input
                      id="quiet-hours-start"
                      type="time"
                      value={preferences.quiet_hours_start ?? ""}
                      disabled={saving}
                      onChange={(event) =>
                        applyPreferenceUpdate(
                          "quiet_hours_start",
                          event.target.value || null
                        )
                      }
                      className="mt-3 block w-full rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm text-neutral-900 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 disabled:cursor-not-allowed disabled:bg-neutral-50"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="quiet-hours-end"
                      className="block text-sm font-semibold text-neutral-900"
                    >
                      End time
                    </label>

                    <p className="mt-1 text-xs text-neutral-500">
                      Notifications will resume after this time.
                    </p>

                    <input
                      id="quiet-hours-end"
                      type="time"
                      value={preferences.quiet_hours_end ?? ""}
                      disabled={saving}
                      onChange={(event) =>
                        applyPreferenceUpdate(
                          "quiet_hours_end",
                          event.target.value || null
                        )
                      }
                      className="mt-3 block w-full rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm text-neutral-900 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 disabled:cursor-not-allowed disabled:bg-neutral-50"
                    />
                  </div>
                </div>
              )}
            </div>
          </section>

          <p className="text-xs text-neutral-400">
            Notification settings are saved automatically when you make a
            change.
          </p>
        </div>
      </div>
    </main>
  );
}