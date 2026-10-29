"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
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
  push_enabled: boolean;
  email_enabled: boolean;
  smart_notifications: boolean;
  quiet_hours_enabled: boolean;
  quiet_hours_start: string | null;
  quiet_hours_end: string | null;
}

const DEFAULT_PREFERENCES: NotificationPreferences = {
  event_reminders: true,
  new_events: true,
  trending_events: true,
  campaign_activity: true,
  campaign_milestones: true,
  recommendations: true,
  campaign_insights: true,
  push_enabled: false,
  email_enabled: false,
  smart_notifications: true,
  quiet_hours_enabled: false,
  quiet_hours_start: "22:00",
  quiet_hours_end: "07:00",
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

  const [preferences, setPreferences] =
    useState<NotificationPreferences>(DEFAULT_PREFERENCES);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

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
              push_enabled,
              email_enabled,
              smart_notifications,
              quiet_hours_enabled,
              quiet_hours_start,
              quiet_hours_end
            `
          )
          .eq("user_id", user.id)
          .maybeSingle();

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
            push_enabled: data.push_enabled,
            email_enabled: data.email_enabled,
            smart_notifications: data.smart_notifications,
            quiet_hours_enabled: data.quiet_hours_enabled,
            quiet_hours_start: data.quiet_hours_start,
            quiet_hours_end: data.quiet_hours_end,
          });
        }
      } catch (error) {
        console.error(
          "[Attend Notifications] Failed to load preferences:",
          error
        );
      } finally {
        setLoading(false);
      }
    };

    loadPreferences();
  }, [supabase]);

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
  };

  const updateBooleanPreference = async (
    key: keyof NotificationPreferences,
    value: boolean
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
    } catch (error) {
      console.error(
        `[Attend Notifications] Failed to save "${key}":`,
        error
      );

      setPreferences(previousPreferences);

      alert(
        error instanceof Error
          ? error.message
          : "Unable to save notification setting."
      );
    } finally {
      setSaving(false);
    }
  };

  const updateTimePreference = async (
    key: "quiet_hours_start" | "quiet_hours_end",
    value: string
  ) => {
    if (saving) return;

    const previousPreferences = preferences;

    const nextPreferences: NotificationPreferences = {
      ...preferences,
      [key]: value || null,
    };

    setPreferences(nextPreferences);
    setSaving(true);

    try {
      await persistPreferences(nextPreferences);
    } catch (error) {
      console.error(
        `[Attend Notifications] Failed to save "${key}":`,
        error
      );

      setPreferences(previousPreferences);

      alert(
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

        const nextPreferences: NotificationPreferences = {
          ...preferences,
          push_enabled: true,
        };

        setPreferences(nextPreferences);

        await persistPreferences(nextPreferences);
      } else {
        await unsubscribeFromPush();

        const nextPreferences: NotificationPreferences = {
          ...preferences,
          push_enabled: false,
        };

        setPreferences(nextPreferences);

        await persistPreferences(nextPreferences);
      }
    } catch (error) {
      console.error(
        "[Attend Notifications] Push notification preference error:",
        error
      );

      setPreferences(previousPreferences);

      alert(
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
                  updateBooleanPreference("event_reminders", value)
                }
              />

              <ToggleRow
                title="New events"
                description="Get notified when new events matching your interests are published."
                checked={preferences.new_events}
                disabled={saving}
                onChange={(value) =>
                  updateBooleanPreference("new_events", value)
                }
              />

              <ToggleRow
                title="Trending events"
                description="Receive updates about popular and trending events."
                checked={preferences.trending_events}
                disabled={saving}
                onChange={(value) =>
                  updateBooleanPreference("trending_events", value)
                }
              />

              <ToggleRow
                title="Recommendations"
                description="Receive personalized event recommendations based on your activity and interests."
                checked={preferences.recommendations}
                disabled={saving}
                onChange={(value) =>
                  updateBooleanPreference("recommendations", value)
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
                  updateBooleanPreference("campaign_activity", value)
                }
              />

              <ToggleRow
                title="Campaign milestones"
                description="Receive updates when your campaigns reach important participation milestones."
                checked={preferences.campaign_milestones}
                disabled={saving}
                onChange={(value) =>
                  updateBooleanPreference("campaign_milestones", value)
                }
              />

              <ToggleRow
                title="Campaign insights"
                description="Receive useful updates and insights about campaign performance."
                checked={preferences.campaign_insights}
                disabled={saving}
                onChange={(value) =>
                  updateBooleanPreference("campaign_insights", value)
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
                  updateBooleanPreference("email_enabled", value)
                }
              />

              <ToggleRow
                title="Smart notifications"
                description="Let Attend intelligently prioritize useful notifications and reduce unnecessary interruptions."
                checked={preferences.smart_notifications}
                disabled={saving}
                onChange={(value) =>
                  updateBooleanPreference("smart_notifications", value)
                }
              />
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
                  updateBooleanPreference("quiet_hours_enabled", value)
                }
              />

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
                        updateTimePreference(
                          "quiet_hours_start",
                          event.target.value
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
                        updateTimePreference(
                          "quiet_hours_end",
                          event.target.value
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