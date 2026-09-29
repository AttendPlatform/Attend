"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Bell, Mail, Moon, Smartphone } from "lucide-react";

import { createClient } from "@/lib/supabase/client";

type NotificationPreferences = {
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
};

const defaultPreferences: NotificationPreferences = {
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
  quiet_hours_start: null,
  quiet_hours_end: null,
};

export default function NotificationSettingsPage() {
  const supabase = createClient();

  const [preferences, setPreferences] =
    useState<NotificationPreferences>(
      defaultPreferences
    );

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  /*
   * =========================================================
   * LOAD PREFERENCES
   * =========================================================
   */
  useEffect(() => {
    async function loadPreferences() {
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
          console.error(
            "Failed to load notification preferences:",
            error
          );
          return;
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
            smart_notifications:
              data.smart_notifications,
            quiet_hours_enabled:
              data.quiet_hours_enabled,
            quiet_hours_start:
              data.quiet_hours_start,
            quiet_hours_end:
              data.quiet_hours_end,
          });
        }
      } catch (error) {
        console.error(
          "Notification preferences error:",
          error
        );
      } finally {
        setLoading(false);
      }
    }

    loadPreferences();
  }, [supabase]);

  /*
   * =========================================================
   * UPDATE LOCAL VALUE
   * =========================================================
   */
  const updatePreference = (
    key: keyof NotificationPreferences,
    value: boolean | string
  ) => {
    setPreferences((current) => ({
      ...current,
      [key]: value,
    }));

    setSaved(false);
  };

  /*
   * =========================================================
   * SAVE
   * =========================================================
   */
  const savePreferences = async () => {
    setSaving(true);
    setSaved(false);

    try {
      const { error } = await supabase.rpc(
        "update_notification_preferences",
        {
          p_event_reminders:
            preferences.event_reminders,

          p_new_events:
            preferences.new_events,

          p_trending_events:
            preferences.trending_events,

          p_campaign_activity:
            preferences.campaign_activity,

          p_campaign_milestones:
            preferences.campaign_milestones,

          p_recommendations:
            preferences.recommendations,

          p_campaign_insights:
            preferences.campaign_insights,

          p_push_enabled:
            preferences.push_enabled,

          p_email_enabled:
            preferences.email_enabled,

          p_smart_notifications:
            preferences.smart_notifications,

          p_quiet_hours_enabled:
            preferences.quiet_hours_enabled,

          p_quiet_hours_start:
            preferences.quiet_hours_enabled
              ? preferences.quiet_hours_start || undefined
              : undefined,

          p_quiet_hours_end:
            preferences.quiet_hours_enabled
              ? preferences.quiet_hours_end || undefined
              : undefined,
        }
      );

      if (error) {
        console.error(
          "Failed to save notification preferences:",
          error
        );
        return;
      }

      setSaved(true);
    } catch (error) {
      console.error(
        "Notification settings save error:",
        error
      );
    } finally {
      setSaving(false);
    }
  };

  /*
   * =========================================================
   * LOADING
   * =========================================================
   */
  if (loading) {
    return (
      <main className="min-h-screen bg-neutral-50">
        <div className="mx-auto max-w-3xl px-5 py-10 sm:px-6">
          <div className="h-8 w-48 animate-pulse rounded-lg bg-neutral-200" />

          <div className="mt-8 space-y-3">
            <div className="h-20 animate-pulse rounded-2xl bg-white" />
            <div className="h-20 animate-pulse rounded-2xl bg-white" />
            <div className="h-20 animate-pulse rounded-2xl bg-white" />
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-neutral-50">
      <div className="mx-auto max-w-3xl px-5 py-8 sm:px-6 sm:py-10">

        {/* ===================================================
            BACK
        =================================================== */}
        <Link
          href="/notifications"
          className="inline-flex items-center gap-2 text-sm font-medium text-neutral-500 transition hover:text-neutral-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Notifications
        </Link>


        {/* ===================================================
            HEADER
        =================================================== */}
        <div className="mt-8">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-100 text-violet-600">
              <Bell className="h-5 w-5" />
            </div>

            <div>
              <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
                Notification settings
              </h1>

              <p className="mt-1 text-sm text-neutral-500">
                Choose what Attend should notify you about.
              </p>
            </div>
          </div>
        </div>


        {/* ===================================================
            ACTIVITY
        =================================================== */}
        <section className="mt-8">
          <h2 className="mb-3 px-1 text-xs font-semibold uppercase tracking-wider text-neutral-400">
            Activity
          </h2>

          <div className="overflow-hidden rounded-2xl border border-neutral-100 bg-white">

            <ToggleRow
              title="Event reminders"
              description="Get reminders about events you're attending."
              checked={preferences.event_reminders}
              onChange={(value) =>
                updatePreference(
                  "event_reminders",
                  value
                )
              }
            />

            <ToggleRow
              title="New events"
              description="Get notified when relevant new events are created."
              checked={preferences.new_events}
              onChange={(value) =>
                updatePreference(
                  "new_events",
                  value
                )
              }
            />

            <ToggleRow
              title="Trending events"
              description="Stay updated on events gaining attention."
              checked={preferences.trending_events}
              onChange={(value) =>
                updatePreference(
                  "trending_events",
                  value
                )
              }
            />

            <ToggleRow
              title="Recommendations"
              description="Receive event recommendations based on your interests."
              checked={preferences.recommendations}
              onChange={(value) =>
                updatePreference(
                  "recommendations",
                  value
                )
              }
            />

          </div>
        </section>


        {/* ===================================================
            CAMPAIGNS
        =================================================== */}
        <section className="mt-8">
          <h2 className="mb-3 px-1 text-xs font-semibold uppercase tracking-wider text-neutral-400">
            Campaigns
          </h2>

          <div className="overflow-hidden rounded-2xl border border-neutral-100 bg-white">

            <ToggleRow
              title="Campaign activity"
              description="Get notified about activity on your campaigns."
              checked={preferences.campaign_activity}
              onChange={(value) =>
                updatePreference(
                  "campaign_activity",
                  value
                )
              }
            />

            <ToggleRow
              title="Campaign milestones"
              description="Get notified when your campaign reaches important milestones."
              checked={
                preferences.campaign_milestones
              }
              onChange={(value) =>
                updatePreference(
                  "campaign_milestones",
                  value
                )
              }
            />

            <ToggleRow
              title="Campaign insights"
              description="Receive useful insights about campaign performance."
              checked={
                preferences.campaign_insights
              }
              onChange={(value) =>
                updatePreference(
                  "campaign_insights",
                  value
                )
              }
            />

          </div>
        </section>


        {/* ===================================================
            SMART NOTIFICATIONS
        =================================================== */}
        <section className="mt-8">
          <h2 className="mb-3 px-1 text-xs font-semibold uppercase tracking-wider text-neutral-400">
            Smart notifications
          </h2>

          <div className="overflow-hidden rounded-2xl border border-neutral-100 bg-white">

            <ToggleRow
              title="Smart notifications"
              description="Let Attend intelligently prioritize useful notifications and reduce unnecessary ones."
              checked={
                preferences.smart_notifications
              }
              onChange={(value) =>
                updatePreference(
                  "smart_notifications",
                  value
                )
              }
            />

          </div>
        </section>


        {/* ===================================================
            DELIVERY
        =================================================== */}
        <section className="mt-8">
          <h2 className="mb-3 px-1 text-xs font-semibold uppercase tracking-wider text-neutral-400">
            Delivery
          </h2>

          <div className="overflow-hidden rounded-2xl border border-neutral-100 bg-white">

            <ToggleRow
              icon={
                <Smartphone className="h-4 w-4" />
              }
              title="Push notifications"
              description="Receive notifications on your device."
              checked={
                preferences.push_enabled
              }
              onChange={(value) =>
                updatePreference(
                  "push_enabled",
                  value
                )
              }
            />

            <ToggleRow
              icon={
                <Mail className="h-4 w-4" />
              }
              title="Email notifications"
              description="Receive important notifications by email."
              checked={
                preferences.email_enabled
              }
              onChange={(value) =>
                updatePreference(
                  "email_enabled",
                  value
                )
              }
            />

          </div>
        </section>


        {/* ===================================================
            QUIET HOURS
        =================================================== */}
        <section className="mt-8">
          <h2 className="mb-3 px-1 text-xs font-semibold uppercase tracking-wider text-neutral-400">
            Quiet hours
          </h2>

          <div className="overflow-hidden rounded-2xl border border-neutral-100 bg-white">

            <ToggleRow
              icon={
                <Moon className="h-4 w-4" />
              }
              title="Enable quiet hours"
              description="Pause non-urgent notifications during your quiet period."
              checked={
                preferences.quiet_hours_enabled
              }
              onChange={(value) =>
                updatePreference(
                  "quiet_hours_enabled",
                  value
                )
              }
            />

            {preferences.quiet_hours_enabled && (
              <div className="grid grid-cols-2 gap-4 border-t border-neutral-100 px-5 py-4">

                <div>
                  <label className="mb-2 block text-xs font-medium text-neutral-600">
                    Start
                  </label>

                  <input
                    type="time"
                    value={
                      preferences.quiet_hours_start ||
                      ""
                    }
                    onChange={(event) =>
                      updatePreference(
                        "quiet_hours_start",
                        event.target.value
                      )
                    }
                    className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm text-neutral-900 outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-500/10"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-medium text-neutral-600">
                    End
                  </label>

                  <input
                    type="time"
                    value={
                      preferences.quiet_hours_end ||
                      ""
                    }
                    onChange={(event) =>
                      updatePreference(
                        "quiet_hours_end",
                        event.target.value
                      )
                    }
                    className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm text-neutral-900 outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-500/10"
                  />
                </div>

              </div>
            )}

          </div>
        </section>


        {/* ===================================================
            SAVE
        =================================================== */}
        <div className="sticky bottom-4 mt-8 flex items-center justify-end gap-3 rounded-2xl border border-neutral-100 bg-white/95 p-3 shadow-lg backdrop-blur">

          {saved && (
            <span className="text-xs font-medium text-green-600">
              Settings saved
            </span>
          )}

          <button
            type="button"
            onClick={savePreferences}
            disabled={saving}
            className="rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save settings"}
          </button>

        </div>

      </div>
    </main>
  );
}


/*
 * ===========================================================
 * TOGGLE ROW
 * ===========================================================
 */
function ToggleRow({
  title,
  description,
  checked,
  onChange,
  icon,
}: {
  title: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-5 px-5 py-4">
      <div className="flex min-w-0 items-start gap-3">

        {icon && (
          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-neutral-50 text-neutral-500">
            {icon}
          </div>
        )}

        <div>
          <p className="text-sm font-medium text-neutral-900">
            {title}
          </p>

          <p className="mt-1 max-w-xl text-xs leading-relaxed text-neutral-500">
            {description}
          </p>
        </div>

      </div>

      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition ${
          checked
            ? "bg-violet-600"
            : "bg-neutral-200"
        }`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition ${
            checked
              ? "left-[22px]"
              : "left-0.5"
          }`}
        />
      </button>
    </div>
  );
}