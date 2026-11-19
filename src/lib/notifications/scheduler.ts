import "server-only";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/lib/supabase/database.types";

type ServiceClient = ReturnType<typeof createServiceClient>;
type NotificationRow = Database["public"]["Tables"]["notifications"]["Row"];
type CreatedNotification = Pick<
  NotificationRow,
  "id" | "user_id" | "type" | "title" | "message" | "action_url" | "status"
> & { status: string | null };

type DispatchSummary = {
  scannedEvents: number;
  attempted: number;
  delivered: number;
  failed: number;
};

const ACTIVE_PARTICIPANT_STATUSES = ["attending", "registered", "ticketed"] as const;
const ORGANIZER_MILESTONES = [10, 50, 100] as const;
const EVENT_BATCH_LIMIT = 500;

function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Notification scheduler requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY."
    );
  }

  return createSupabaseClient<Database>(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function parseNotification(value: unknown): CreatedNotification | null {
  if (typeof value === "string") {
    try {
      const parsed: unknown = JSON.parse(value);
      return parsed && typeof parsed === "object"
        ? (parsed as CreatedNotification)
        : null;
    } catch {
      return null;
    }
  }

  return value && typeof value === "object"
    ? (value as CreatedNotification)
    : null;
}

async function sendPushNotification(
  supabase: ServiceClient,
  notification: CreatedNotification
): Promise<boolean> {
  if (!notification.user_id || !["unread", "sent"].includes(notification.status ?? "")) {
    return false;
  }

  const { data: preferences, error: preferenceError } = await supabase
    .from("notification_preferences")
    .select("push_enabled")
    .eq("user_id", notification.user_id)
    .maybeSingle();

  if (preferenceError) {
    throw new Error(
      `Could not read push preferences for ${notification.user_id}: ${preferenceError.message}`
    );
  }

  if (!preferences?.push_enabled) {
    return false;
  }

  const { error } = await supabase.functions.invoke("send-push", {
    body: {
      title: notification.title ?? "Attend",
      body: notification.message ?? "",
      url: notification.action_url ?? "/notifications",
      tag: notification.id
        ? `notification-${notification.id}`
        : "attend-notification",
    },
  });

  if (error) {
    throw new Error(`Push delivery failed for ${notification.id}: ${error.message}`);
  }

  return true;
}

async function dispatchToUser(
  supabase: ServiceClient,
  params: {
    userId: string;
    type: string;
    category: string;
    title: string;
    message: string;
    eventId: string;
    dedupeKey: string;
    actionUrl: string;
    actionLabel: string;
    metadata?: Record<string, unknown>;
    priority?: "low" | "normal" | "high" | "urgent";
  }
): Promise<"delivered" | "suppressed" | "failed"> {
  const { data, error } = await supabase.rpc("create_notification_for_user", {
    p_user_id: params.userId,
    p_type: params.type,
    p_category: params.category,
    p_title: params.title,
    p_message: params.message,
    p_action_url: params.actionUrl,
    p_action_label: params.actionLabel,
    p_event_id: params.eventId,
    p_dedupe_key: params.dedupeKey,
    p_metadata: (params.metadata ?? {}) as Json,
    p_priority: params.priority ?? "normal",
  });

  if (error) {
    console.error("Smart notification dispatch failed:", error);
    return "failed";
  }

  const notification = parseNotification(data);
  if (!notification) {
    console.error("Smart notification RPC returned an unreadable result.");
    return "failed";
  }

  if (notification.status === "suppressed" || notification.status === "scheduled") {
    return "suppressed";
  }

  if (notification.status !== "unread" && notification.status !== "sent") {
    return "suppressed";
  }

  try {
    await sendPushNotification(supabase, notification);
  } catch (pushError) {
    // The in-app notification is already committed. Log push failure without
    // retrying the RPC and creating a second notification.
    console.error(pushError);
  }

  return "delivered";
}

async function dispatchReminderWindow(
  supabase: ServiceClient,
  window: {
    type: "event_reminder_24h" | "event_reminder_2h";
    label: "24 hours" | "2 hours";
    from: Date;
    to: Date;
  }
): Promise<DispatchSummary> {
  const { data: events, error } = await supabase
    .from("events")
    .select("id, title, start_at")
    .eq("status", "published")
    .gte("start_at", window.from.toISOString())
    .lte("start_at", window.to.toISOString())
    .order("start_at", { ascending: true })
    .limit(EVENT_BATCH_LIMIT);

  if (error) {
    throw new Error(`Could not fetch ${window.label} events: ${error.message}`);
  }

  const summary: DispatchSummary = {
    scannedEvents: events?.length ?? 0,
    attempted: 0,
    delivered: 0,
    failed: 0,
  };

  for (const event of events ?? []) {
    const { data: participants, error: participantsError } = await supabase
      .from("event_participants")
      .select("user_id")
      .eq("event_id", event.id)
      .in("status", [...ACTIVE_PARTICIPANT_STATUSES]);

    if (participantsError) {
      console.error(`Could not fetch participants for event ${event.id}:`, participantsError);
      summary.failed += 1;
      continue;
    }

    const recipientIds = [
      ...new Set(
        (participants ?? [])
          .map((participant) => participant.user_id)
          .filter((userId): userId is string => Boolean(userId))
      ),
    ];

    for (const userId of recipientIds) {
      summary.attempted += 1;
      const result = await dispatchToUser(supabase, {
        userId,
        type: window.type,
        category: "event_reminder",
        title: `Coming up: ${event.title}`,
        message: `"${event.title}" starts in about ${window.label}. Review the event details so you are ready.`,
        eventId: event.id,
        actionUrl: `/events/${event.id}`,
        actionLabel: "View event",
        dedupeKey: `event-${event.id}-reminder-${window.type === "event_reminder_24h" ? "24h" : "2h"}-${userId}`,
        metadata: {
          reminder_type: window.type,
          event_start_at: event.start_at,
        },
        priority: "normal",
      });

      if (result === "failed") summary.failed += 1;
      if (result === "delivered") summary.delivered += 1;
    }
  }

  return summary;
}

/**
 * Promotes due quiet-hours notifications atomically, then sends push only for
 * promoted rows whose recipients have push enabled. Expired rows are cleaned up
 * in the same scheduled run.
 */
export async function processDueScheduledNotifications() {
  const supabase = createServiceClient();
  const { data: promoted, error: promoteError } = await supabase.rpc(
    "promote_scheduled_notifications"
  );

  if (promoteError) {
    throw new Error(`Scheduled notification promotion failed: ${promoteError.message}`);
  }

  let pushSent = 0;
  let pushFailed = 0;

  for (const row of promoted ?? []) {
    const notification = row as CreatedNotification;
    if (!notification.user_id || !["unread", "sent"].includes(notification.status ?? "")) {
      continue;
    }

    try {
      if (await sendPushNotification(supabase, notification)) pushSent += 1;
    } catch (error) {
      pushFailed += 1;
      console.error(error);
    }
  }

  const { data: expiredCount, error: expireError } = await supabase.rpc(
    "expire_old_notifications"
  );

  if (expireError) {
    throw new Error(`Notification expiration failed: ${expireError.message}`);
  }

  return {
    promoted: promoted?.length ?? 0,
    pushSent,
    pushFailed,
    expired: expiredCount ?? 0,
  };
}

/** Dispatches idempotent 24-hour and 2-hour reminders for confirmed participants. */
export async function dispatchUpcomingEventReminders() {
  const supabase = createServiceClient();
  const now = Date.now();

  const [dayAhead, twoHoursAhead] = await Promise.all([
    dispatchReminderWindow(supabase, {
      type: "event_reminder_24h",
      label: "24 hours",
      from: new Date(now + 23 * 60 * 60 * 1000),
      to: new Date(now + 25 * 60 * 60 * 1000),
    }),
    dispatchReminderWindow(supabase, {
      type: "event_reminder_2h",
      label: "2 hours",
      from: new Date(now + 90 * 60 * 1000),
      to: new Date(now + 150 * 60 * 1000),
    }),
  ]);

  return {
    dayAhead,
    twoHoursAhead,
    attempted: dayAhead.attempted + twoHoursAhead.attempted,
    delivered: dayAhead.delivered + twoHoursAhead.delivered,
    failed: dayAhead.failed + twoHoursAhead.failed,
  };
}

/**
 * Sends organizer progress insights at 10, 50, and 100 confirmed participants.
 * The per-recipient dedupe key prevents repeated cron runs and avoids collisions
 * between multiple organizers on the same event.
 */
export async function dispatchOrganizerProgressInsights() {
  const supabase = createServiceClient();
  const { data: events, error } = await supabase
    .from("events")
    .select("id, title, creator_id")
    .eq("status", "published")
    .limit(EVENT_BATCH_LIMIT);

  if (error) {
    throw new Error(`Could not fetch published events for organizer insights: ${error.message}`);
  }

  const summary: DispatchSummary = {
    scannedEvents: events?.length ?? 0,
    attempted: 0,
    delivered: 0,
    failed: 0,
  };

  for (const event of events ?? []) {
    const [{ count, error: countError }, { data: organizers, error: organizersError }] =
      await Promise.all([
        supabase
          .from("event_participants")
          .select("id", { count: "exact", head: true })
          .eq("event_id", event.id)
          .in("status", [...ACTIVE_PARTICIPANT_STATUSES]),
        supabase
          .from("event_organizers")
          .select("user_id")
          .eq("event_id", event.id),
      ]);

    if (countError || organizersError) {
      console.error(`Could not resolve organizer milestone for event ${event.id}:`, countError ?? organizersError);
      summary.failed += 1;
      continue;
    }

    const reachedMilestones = ORGANIZER_MILESTONES.filter(
      (value) => (count ?? 0) >= value
    );

    if (reachedMilestones.length === 0) continue;

    const recipientIds = [
      ...new Set([
        event.creator_id,
        ...(organizers ?? []).map((organizer) => organizer.user_id),
      ]),
    ].filter(Boolean);

    for (const milestone of reachedMilestones) {
      for (const userId of recipientIds) {
        summary.attempted += 1;
        const result = await dispatchToUser(supabase, {
          userId,
          type: "organizer_insight",
          category: "organizer_insight",
          title: `${milestone} people are part of your event`,
          message: `"${event.title}" has reached ${milestone} confirmed attendees or registrations. Keep your participants informed and engaged.`,
          eventId: event.id,
          actionUrl: `/dashboard/events/${event.id}`,
          actionLabel: "View event",
          dedupeKey: `event-${event.id}-attendee-milestone-${milestone}-${userId}`,
          metadata: {
            milestone,
            confirmed_participants: count ?? 0,
            metric: "confirmed_participants",
          },
          priority: "normal",
        });

        if (result === "failed") summary.failed += 1;
        if (result === "delivered") summary.delivered += 1;
      }
    }
  }

  return summary;
}
