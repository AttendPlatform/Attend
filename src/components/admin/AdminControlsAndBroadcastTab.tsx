"use client";

import { useState, useTransition } from "react";
import {
  CheckCircle2,
  Clock,
  FileText,
  History,
  Megaphone,
  Send,
  ShieldCheck,
  SlidersHorizontal,
} from "lucide-react";
import {
  dispatchAdminBroadcastAction,
  updateAdminNotificationSettingsAction,
  updateNotificationTemplateAction,
} from "@/app/actions/promotions";
import { toast } from "@/hooks/use-toast";
import type {
  AdminAuditLogRecord,
  AdminNotificationSettingRecord,
  FeaturedEventWithEvent,
  NotificationTemplateRecord,
  PromotionalBannerRecord,
} from "@/types/promotions";

interface AdminControlsAndBroadcastTabProps {
  section?: "controls" | "broadcasts" | "all";
  initialSettings: AdminNotificationSettingRecord[];
  initialTemplates: NotificationTemplateRecord[];
  initialAuditLogs: AdminAuditLogRecord[];
  featuredEvents: FeaturedEventWithEvent[];
  banners: PromotionalBannerRecord[];
}

function getSettingValue(
  settings: AdminNotificationSettingRecord[],
  key: string
): Record<string, unknown> {
  return settings.find((item) => item.key === key)?.value ?? {};
}

export function AdminControlsAndBroadcastTab({
  section = "all",
  initialSettings,
  initialTemplates,
  initialAuditLogs,
  featuredEvents,
  banners,
}: AdminControlsAndBroadcastTabProps) {
  const initialRecovery = getSettingValue(initialSettings, "abandoned_action_delays");
  const initialSocial = getSettingValue(initialSettings, "social_triggers");
  const initialBroadcastRules = getSettingValue(initialSettings, "broadcast_rules");

  const [recoveryEnabled, setRecoveryEnabled] = useState(
    initialRecovery.enabled !== false
  );
  const [stage1Hours, setStage1Hours] = useState(
    Number(initialRecovery.stage_1_hours ?? 24)
  );
  const [stage2Hours, setStage2Hours] = useState(
    Number(initialRecovery.stage_2_hours ?? 72)
  );
  const [maxReminders, setMaxReminders] = useState(
    Number(initialRecovery.max_reminders ?? 2)
  );

  const [socialEnabled, setSocialEnabled] = useState(
    initialSocial.enabled !== false
  );
  const [friendAttendingEnabled, setFriendAttendingEnabled] = useState(
    initialSocial.friend_attending_enabled !== false
  );
  const [minMutualThreshold, setMinMutualThreshold] = useState(
    Number(initialSocial.min_mutual_threshold ?? 1)
  );

  const [maxDailyBroadcasts, setMaxDailyBroadcasts] = useState(
    Number(initialBroadcastRules.max_daily_broadcasts ?? 2)
  );
  const [respectQuietHours, setRespectQuietHours] = useState(
    initialBroadcastRules.respect_quiet_hours !== false
  );

  const [templates, setTemplates] = useState<NotificationTemplateRecord[]>(
    initialTemplates
  );
  const [selectedTemplateId, setSelectedTemplateId] = useState(
    initialTemplates[0]?.id ?? ""
  );
  const activeTemplate =
    templates.find((t) => t.id === selectedTemplateId) ?? templates[0] ?? null;

  const [templateTitle, setTemplateTitle] = useState(
    activeTemplate?.title_template ?? ""
  );
  const [templateMessage, setTemplateMessage] = useState(
    activeTemplate?.message_template ?? ""
  );
  const [templateActionLabel, setTemplateActionLabel] = useState(
    activeTemplate?.action_label ?? ""
  );
  const [templateIsActive, setTemplateIsActive] = useState(
    activeTemplate?.is_active ?? true
  );

  const [broadcastTitle, setBroadcastTitle] = useState("");
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [broadcastActionUrl, setBroadcastActionUrl] = useState("/discover");
  const [broadcastActionLabel, setBroadcastActionLabel] = useState("Explore");
  const [broadcastPriority, setBroadcastPriority] = useState<
    "normal" | "high" | "urgent"
  >("normal");
  const [broadcastCities, setBroadcastCities] = useState("");
  const [confirmBroadcast, setConfirmBroadcast] = useState(false);

  const [auditLogs, setAuditLogs] = useState<AdminAuditLogRecord[]>(initialAuditLogs);
  const [isPending, startTransition] = useTransition();

  function handleTemplateSelection(nextId: string) {
    setSelectedTemplateId(nextId);
    const match = templates.find((t) => t.id === nextId);
    if (match) {
      setTemplateTitle(match.title_template);
      setTemplateMessage(match.message_template);
      setTemplateActionLabel(match.action_label ?? "");
      setTemplateIsActive(match.is_active);
    }
  }

  function handleSaveRecoverySettings() {
    startTransition(async () => {
      const res = await updateAdminNotificationSettingsAction(
        "abandoned_action_delays",
        {
          enabled: recoveryEnabled,
          stage_1_hours: stage1Hours,
          stage_2_hours: stage2Hours,
          max_reminders: maxReminders,
        }
      );
      if (!res.ok) {
        toast.error(res.error ?? "Failed to save recovery settings.");
        return;
      }
      toast.success("Recovery trigger settings updated.");
    });
  }

  function handleSaveSocialSettings() {
    startTransition(async () => {
      const res = await updateAdminNotificationSettingsAction("social_triggers", {
        enabled: socialEnabled,
        friend_attending_enabled: friendAttendingEnabled,
        min_mutual_threshold: minMutualThreshold,
      });
      if (!res.ok) {
        toast.error(res.error ?? "Failed to save social trigger settings.");
        return;
      }
      toast.success("Social trigger settings updated.");
    });
  }

  function handleSaveBroadcastRules() {
    startTransition(async () => {
      const res = await updateAdminNotificationSettingsAction("broadcast_rules", {
        require_audit_log: true,
        max_daily_broadcasts: maxDailyBroadcasts,
        respect_quiet_hours: respectQuietHours,
      });
      if (!res.ok) {
        toast.error(res.error ?? "Failed to save broadcast rules.");
        return;
      }
      toast.success("Broadcast rules updated.");
    });
  }

  function handleSaveTemplate(event: React.FormEvent) {
    event.preventDefault();
    if (!activeTemplate) return;

    startTransition(async () => {
      const res = await updateNotificationTemplateAction(activeTemplate.id, {
        title_template: templateTitle,
        message_template: templateMessage,
        action_label: templateActionLabel.trim() || null,
        is_active: templateIsActive,
      });

      if (!res.ok || !res.template) {
        toast.error(res.error ?? "Failed to update notification template.");
        return;
      }

      setTemplates((prev) =>
        prev.map((row) => (row.id === res.template!.id ? res.template! : row))
      );
      toast.success(`Template "${res.template.type}" updated.`);
    });
  }

  function sendBroadcast(testPreview: boolean) {
    const cities = broadcastCities
      .split(",")
      .map((city) => city.trim())
      .filter(Boolean);

    startTransition(async () => {
      const res = await dispatchAdminBroadcastAction({
        title: broadcastTitle,
        message: broadcastMessage,
        actionUrl: broadcastActionUrl.trim() || "/discover",
        actionLabel: broadcastActionLabel.trim() || "Explore",
        priority: broadcastPriority,
        cities,
        testPreview,
        confirmBroadcast: testPreview ? false : confirmBroadcast,
      });

      if (!res.ok || !res.result) {
        toast.error(res.error ?? "Failed to dispatch broadcast.");
        return;
      }

      const logEntry: AdminAuditLogRecord = {
        id: `local-${Date.now()}`,
        admin_id: "self",
        action: testPreview
          ? "admin_broadcast.preview_sent"
          : "admin_broadcast.dispatched",
        target_type: "broadcast",
        target_id: null,
        metadata: {
          title: broadcastTitle,
          dispatched_count: res.result.dispatchedCount,
        },
        created_at: new Date().toISOString(),
      };
      setAuditLogs((prev) => [logEntry, ...prev]);

      if (testPreview) {
        toast.success(
          `Test preview sent (${res.result.dispatchedCount} notification delivered to your account).`
        );
      } else {
        setBroadcastTitle("");
        setBroadcastMessage("");
        setConfirmBroadcast(false);
        toast.success(
          `Broadcast dispatched to ${res.result.dispatchedCount} of ${res.result.eligibleRecipients} user(s) across ${res.result.batchesProcessed} batch(es).`
        );
      }
    });
  }

  const totalFeaturedViews = featuredEvents.reduce(
    (sum, item) => sum + item.views_count,
    0
  );
  const totalFeaturedClicks = featuredEvents.reduce(
    (sum, item) => sum + item.clicks_count,
    0
  );
  const totalBannerImpressions = banners.reduce(
    (sum, item) => sum + item.impressions_count,
    0
  );
  const totalBannerClicks = banners.reduce(
    (sum, item) => sum + item.clicks_count,
    0
  );

  const showControls = section === "controls" || section === "all";
  const showBroadcasts = section === "broadcasts" || section === "all";

  return (
    <div className="space-y-8">
      {showControls && (
        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm space-y-5">
            <div className="flex items-center gap-2 text-violet-700">
              <Clock className="h-4 w-4" />
              <h2 className="font-serif text-lg font-bold text-neutral-950">
                Abandoned-action recovery controls
              </h2>
            </div>

            <label className="flex items-center justify-between gap-4 text-sm font-medium text-neutral-800">
              <span>Enable draft & registration recovery reminders</span>
              <input
                type="checkbox"
                checked={recoveryEnabled}
                onChange={(e) => setRecoveryEnabled(e.target.checked)}
                className="h-4 w-4 rounded border-neutral-300 text-violet-600 focus:ring-violet-500"
              />
            </label>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-neutral-700">
                  Stage 1 delay (h)
                </label>
                <input
                  type="number"
                  min={1}
                  max={168}
                  value={stage1Hours}
                  onChange={(e) => setStage1Hours(Number(e.target.value) || 24)}
                  className="mt-1.5 w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm text-neutral-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700">
                  Stage 2 delay (h)
                </label>
                <input
                  type="number"
                  min={24}
                  max={336}
                  value={stage2Hours}
                  onChange={(e) => setStage2Hours(Number(e.target.value) || 72)}
                  className="mt-1.5 w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm text-neutral-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700">
                  Max reminders
                </label>
                <input
                  type="number"
                  min={1}
                  max={3}
                  value={maxReminders}
                  onChange={(e) => setMaxReminders(Number(e.target.value) || 2)}
                  className="mt-1.5 w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm text-neutral-900"
                />
              </div>
            </div>

            <button
              type="button"
              disabled={isPending}
              onClick={handleSaveRecoverySettings}
              className="rounded-full bg-violet-600 px-5 py-2 text-xs font-semibold text-white transition hover:bg-violet-700 disabled:opacity-50"
            >
              Save recovery rules
            </button>

            <hr className="border-neutral-100" />

            <div className="flex items-center gap-2 text-violet-700">
              <SlidersHorizontal className="h-4 w-4" />
              <h3 className="font-serif text-base font-bold text-neutral-950">
                Social trigger controls
              </h3>
            </div>

            <label className="flex items-center justify-between gap-4 text-sm font-medium text-neutral-800">
              <span>Enable social discovery notifications</span>
              <input
                type="checkbox"
                checked={socialEnabled}
                onChange={(e) => setSocialEnabled(e.target.checked)}
                className="h-4 w-4 rounded border-neutral-300 text-violet-600 focus:ring-violet-500"
              />
            </label>

            <label className="flex items-center justify-between gap-4 text-sm font-medium text-neutral-800">
              <span>Allow friend-attending event alerts</span>
              <input
                type="checkbox"
                checked={friendAttendingEnabled}
                onChange={(e) => setFriendAttendingEnabled(e.target.checked)}
                className="h-4 w-4 rounded border-neutral-300 text-violet-600 focus:ring-violet-500"
              />
            </label>

            <div className="max-w-[180px]">
              <label className="block text-xs font-semibold text-neutral-700">
                Minimum mutual connections
              </label>
              <input
                type="number"
                min={1}
                max={10}
                value={minMutualThreshold}
                onChange={(e) => setMinMutualThreshold(Number(e.target.value) || 1)}
                className="mt-1.5 w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm text-neutral-900"
              />
            </div>

            <button
              type="button"
              disabled={isPending}
              onClick={handleSaveSocialSettings}
              className="rounded-full border border-violet-200 bg-violet-50 px-5 py-2 text-xs font-semibold text-violet-700 transition hover:bg-violet-100 disabled:opacity-50"
            >
              Save social rules
            </button>
          </section>

          <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-violet-700">
              <FileText className="h-4 w-4" />
              <h2 className="font-serif text-lg font-bold text-neutral-950">
                Notification template editor
              </h2>
            </div>

            {templates.length === 0 ? (
              <p className="text-sm text-neutral-500">
                No notification templates found.
              </p>
            ) : (
              <form onSubmit={handleSaveTemplate} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700">
                    Template key
                  </label>
                  <select
                    value={activeTemplate?.id ?? ""}
                    onChange={(e) => handleTemplateSelection(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900"
                  >
                    {templates.map((tpl) => (
                      <option key={tpl.id} value={tpl.id}>
                        {tpl.type} ({tpl.category})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700">
                    Title template
                  </label>
                  <input
                    type="text"
                    required
                    value={templateTitle}
                    onChange={(e) => setTemplateTitle(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm text-neutral-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700">
                    Message template
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={templateMessage}
                    onChange={(e) => setTemplateMessage(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm text-neutral-900"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3 items-end">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700">
                      Default action label
                    </label>
                    <input
                      type="text"
                      value={templateActionLabel}
                      onChange={(e) => setTemplateActionLabel(e.target.value)}
                      className="mt-1.5 w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm text-neutral-900"
                    />
                  </div>

                  <label className="flex items-center gap-2 pb-2 text-xs font-semibold text-neutral-700">
                    <input
                      type="checkbox"
                      checked={templateIsActive}
                      onChange={(e) => setTemplateIsActive(e.target.checked)}
                      className="h-4 w-4 rounded border-neutral-300 text-violet-600"
                    />
                    Template active
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={isPending}
                  className="rounded-full bg-neutral-950 px-5 py-2 text-xs font-semibold text-white transition hover:bg-neutral-800 disabled:opacity-50"
                >
                  Save template
                </button>
              </form>
            )}
          </section>
        </div>
      )}

      {showBroadcasts && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-neutral-200 bg-white p-5">
              <p className="text-xs font-semibold text-neutral-500">
                Featured event views
              </p>
              <p className="mt-1 text-2xl font-bold text-neutral-950">
                {totalFeaturedViews}
              </p>
            </div>
            <div className="rounded-2xl border border-neutral-200 bg-white p-5">
              <p className="text-xs font-semibold text-neutral-500">
                Featured event clicks
              </p>
              <p className="mt-1 text-2xl font-bold text-neutral-950">
                {totalFeaturedClicks}
              </p>
            </div>
            <div className="rounded-2xl border border-neutral-200 bg-white p-5">
              <p className="text-xs font-semibold text-neutral-500">
                Banner impressions
              </p>
              <p className="mt-1 text-2xl font-bold text-neutral-950">
                {totalBannerImpressions}
              </p>
            </div>
            <div className="rounded-2xl border border-neutral-200 bg-white p-5">
              <p className="text-xs font-semibold text-neutral-500">
                Banner clicks
              </p>
              <p className="mt-1 text-2xl font-bold text-neutral-950">
                {totalBannerClicks}
              </p>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
            <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-violet-700">
                  <Megaphone className="h-4 w-4" />
                  <h2 className="font-serif text-lg font-bold text-neutral-950">
                    Platform broadcast composer
                  </h2>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full bg-neutral-100 px-2.5 py-1 text-[11px] font-semibold text-neutral-600">
                  <ShieldCheck className="h-3.5 w-3.5 text-violet-600" />
                  Chunked (100/batch)
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 rounded-xl border border-neutral-100 bg-neutral-50 p-3">
                <div>
                  <label className="block text-[11px] font-semibold text-neutral-600">
                    Max daily broadcasts
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={maxDailyBroadcasts}
                    onChange={(e) =>
                      setMaxDailyBroadcasts(Number(e.target.value) || 2)
                    }
                    className="mt-1 w-full rounded-lg border border-neutral-200 bg-white px-2.5 py-1.5 text-xs"
                  />
                </div>
                <div className="flex items-end justify-between gap-2">
                  <label className="flex items-center gap-2 text-xs font-medium text-neutral-700">
                    <input
                      type="checkbox"
                      checked={respectQuietHours}
                      onChange={(e) => setRespectQuietHours(e.target.checked)}
                      className="h-4 w-4 rounded border-neutral-300 text-violet-600"
                    />
                    Respect quiet hours
                  </label>
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={handleSaveBroadcastRules}
                    className="rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-neutral-700 hover:bg-neutral-100"
                  >
                    Save cap
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700">
                  Announcement title
                </label>
                <input
                  type="text"
                  value={broadcastTitle}
                  onChange={(e) => setBroadcastTitle(e.target.value)}
                  placeholder="Weekend lineup is live on Attend"
                  className="mt-1.5 w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm text-neutral-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700">
                  Announcement message
                </label>
                <textarea
                  rows={3}
                  value={broadcastMessage}
                  onChange={(e) => setBroadcastMessage(e.target.value)}
                  placeholder="Discover curated live events and community campaigns happening this weekend."
                  className="mt-1.5 w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm text-neutral-900"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700">
                    Priority
                  </label>
                  <select
                    value={broadcastPriority}
                    onChange={(e) =>
                      setBroadcastPriority(
                        e.target.value as "normal" | "high" | "urgent"
                      )
                    }
                    className="mt-1.5 w-full rounded-xl border border-neutral-200 bg-white px-2.5 py-2 text-xs text-neutral-900"
                  >
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700">
                    Action URL
                  </label>
                  <input
                    type="text"
                    value={broadcastActionUrl}
                    onChange={(e) => setBroadcastActionUrl(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-neutral-200 px-2.5 py-2 text-xs text-neutral-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700">
                    Action label
                  </label>
                  <input
                    type="text"
                    value={broadcastActionLabel}
                    onChange={(e) => setBroadcastActionLabel(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-neutral-200 px-2.5 py-2 text-xs text-neutral-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700">
                  Target cities (optional, comma-separated; leave blank for all users)
                </label>
                <input
                  type="text"
                  value={broadcastCities}
                  onChange={(e) => setBroadcastCities(e.target.value)}
                  placeholder="Lagos, Abuja"
                  className="mt-1.5 w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm text-neutral-900"
                />
              </div>

              <label className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50/70 p-3 text-xs font-medium text-amber-900">
                <input
                  type="checkbox"
                  checked={confirmBroadcast}
                  onChange={(e) => setConfirmBroadcast(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-amber-400 text-violet-600"
                />
                <span>
                  I have verified the copy via test preview and approve dispatching this announcement to matching Attend users.
                </span>
              </label>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  disabled={isPending || !broadcastTitle.trim() || !broadcastMessage.trim()}
                  onClick={() => sendBroadcast(true)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 px-4 py-2 text-xs font-semibold text-neutral-800 transition hover:bg-neutral-50 disabled:opacity-50"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Send test preview to me
                </button>

                <button
                  type="button"
                  disabled={
                    isPending ||
                    !confirmBroadcast ||
                    !broadcastTitle.trim() ||
                    !broadcastMessage.trim()
                  }
                  onClick={() => sendBroadcast(false)}
                  className="inline-flex items-center gap-1.5 rounded-full bg-violet-600 px-5 py-2 text-xs font-semibold text-white transition hover:bg-violet-700 disabled:opacity-50"
                >
                  <Send className="h-3.5 w-3.5" />
                  Send platform broadcast
                </button>
              </div>
            </section>

            <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-2 text-neutral-800">
                <History className="h-4 w-4 text-violet-700" />
                <h2 className="font-serif text-lg font-bold text-neutral-950">
                  Recent admin audit logs
                </h2>
              </div>

              <div className="mt-4 space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
                {auditLogs.length === 0 ? (
                  <p className="text-xs text-neutral-500">No audit entries yet.</p>
                ) : (
                  auditLogs.map((log) => (
                    <div
                      key={log.id}
                      className="rounded-xl border border-neutral-100 bg-neutral-50/70 p-3 text-xs"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-neutral-900">
                          {log.action}
                        </span>
                        <span className="text-[11px] text-neutral-400">
                          {new Date(log.created_at).toLocaleString()}
                        </span>
                      </div>
                      <p className="mt-1 text-[11px] text-neutral-500">
                        Target: {log.target_type}
                        {log.target_id ? ` (${log.target_id.slice(0, 8)})` : ""}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>
        </div>
      )}
    </div>
  );
}
