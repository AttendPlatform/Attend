import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/lib/supabase/database.types";
import type {
  Notification,
  NotificationPriority,
  RecipientEligibilityContext,
  SmartNotificationInput,
} from "@/types/notifications";

type CampaignActivity = {
  campaignId: string;
  creatorId: string;
  eventId?: string | null;
  campaignName: string;
  views: number;
  generations: number;
  downloads: number;
  shares: number;
  participants: number;
};

type CreatedNotification = Pick<
  Notification,
  | "id"
  | "user_id"
  | "type"
  | "category"
  | "title"
  | "message"
  | "action_url"
  | "action_label"
  | "event_id"
  | "campaign_id"
  | "metadata"
  | "dedupe_key"
  | "priority"
  | "status"
> & {
  status: Notification["status"];
};

type SmartDispatchInput = SmartNotificationInput & {
  recipientContext?: RecipientEligibilityContext;
};

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

const MILESTONES = [10, 25, 50, 100, 250, 500, 1000];
const ACTIVE_PARTICIPANT_STATUSES = ["attending", "registered", "ticketed", "attended"] as const;

function toJson(value: Record<string, unknown>): Json {
  return value as Json;
}

function parseCreatedNotification(value: unknown): CreatedNotification | null {
  let candidate = value;

  if (typeof candidate === "string") {
    try {
      candidate = JSON.parse(candidate) as unknown;
    } catch {
      return null;
    }
  }

  if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) {
    return null;
  }

  const record = candidate as Record<string, unknown>;
  if (typeof record.id !== "string" || typeof record.user_id !== "string") {
    return null;
  }

  if (typeof record.status !== "string") {
    return null;
  }

  return {
    id: record.id,
    user_id: record.user_id,
    type: typeof record.type === "string" ? record.type : null,
    category: typeof record.category === "string" ? record.category : null,
    title: typeof record.title === "string" ? record.title : null,
    message: typeof record.message === "string" ? record.message : null,
    action_url: typeof record.action_url === "string" ? record.action_url : null,
    action_label: typeof record.action_label === "string" ? record.action_label : null,
    event_id: typeof record.event_id === "string" ? record.event_id : null,
    campaign_id: typeof record.campaign_id === "string" ? record.campaign_id : null,
    metadata: (record.metadata ?? {}) as Json,
    dedupe_key: typeof record.dedupe_key === "string" ? record.dedupe_key : null,
    priority: typeof record.priority === "string" ? record.priority as NotificationPriority : "normal",
    status: record.status as Notification["status"],
  };
}

/**
 * Fails closed: a notification with an event/campaign relationship is only
 * dispatched when the recipient still has the corresponding live relationship.
 * System notifications without a relationship context do not require one.
 */
export async function verifyRecipientEligibility(
  supabase: SupabaseServerClient,
  userId: string,
  context: RecipientEligibilityContext
): Promise<boolean> {
  if (!userId || context.userId !== userId) {
    return false;
  }

  switch (context.roleRequired) {
    case "attendee":
    case "registrant":
    case "ticket_holder": {
      if (!context.eventId) return false;

      const { data, error } = await supabase
        .from("event_participants")
        .select("user_id")
        .eq("event_id", context.eventId)
        .eq("user_id", userId)
        .in("status", [...ACTIVE_PARTICIPANT_STATUSES]);

      return !error && Boolean(data?.length);
    }

    case "organizer": {
      if (!context.eventId) return false;

      const [eventResult, organizerResult] = await Promise.all([
        supabase
          .from("events")
          .select("creator_id")
          .eq("id", context.eventId)
          .maybeSingle(),
        supabase
          .from("event_organizers")
          .select("user_id")
          .eq("event_id", context.eventId)
          .eq("user_id", userId)
          .maybeSingle(),
      ]);

      if (eventResult.error || organizerResult.error) return false;
      return eventResult.data?.creator_id === userId || Boolean(organizerResult.data);
    }

    case "campaign_creator": {
      if (!context.campaignId) return false;

      const { data, error } = await supabase
        .from("campaigns")
        .select("creator_id")
        .eq("id", context.campaignId)
        .maybeSingle();

      return !error && data?.creator_id === userId;
    }

    default:
      return false;
  }
}

function inferRecipientContext(
  params: SmartNotificationInput
): RecipientEligibilityContext | null {
  const type = params.type.toLowerCase();
  const category = params.category.toLowerCase();

  if (params.campaignId && (
    type.includes("campaign") ||
    category.startsWith("campaign_") ||
    category === "campaign_activity" ||
    category === "campaign_milestones" ||
    category === "campaign_insights"
  )) {
    return {
      userId: params.userId,
      campaignId: params.campaignId,
      roleRequired: "campaign_creator",
    };
  }

  if (params.eventId) {
    return {
      userId: params.userId,
      eventId: params.eventId,
      roleRequired: type === "campaign_created" ? "organizer" : "attendee",
    };
  }

  return null;
}

async function sendPushNotification(
  supabase: SupabaseServerClient,
  notification: CreatedNotification
): Promise<void> {
  // A scheduled, suppressed, expired, or dismissed row must never trigger push.
  if (
    !notification.user_id ||
    (notification.status !== "unread" && notification.status !== "sent")
  ) {
    return;
  }

  const { data: preferences, error } = await supabase
    .from("notification_preferences")
    .select("push_enabled")
    .eq("user_id", notification.user_id)
    .maybeSingle();

  if (error) {
    console.error("Failed to fetch push notification preferences:", error);
    return;
  }

  if (!preferences?.push_enabled) return;

  try {
    const { error: pushError } = await supabase.functions.invoke("send-push", {
      body: {
        title: notification.title ?? "Attend",
        body: notification.message ?? "",
        url: notification.action_url ?? "/notifications",
        tag: notification.id ? `notification-${notification.id}` : "attend-notification",
      },
    });

    if (pushError) {
      console.error("Failed to send push notification:", pushError);
    }
  } catch (error) {
    console.error("Push notification error:", error);
  }
}

/**
 * The only application-level entry point for creating smart notifications.
 * Preferences, deduplication, frequency caps, and quiet hours remain enforced
 * transactionally by create_notification_for_user in Postgres.
 */
export async function dispatchSmartNotification(
  params: SmartDispatchInput
): Promise<CreatedNotification | null> {
  if (!params.userId || !params.type || !params.category || !params.title) {
    return null;
  }

  const supabase = await createClient();
  const context = params.recipientContext ?? inferRecipientContext(params);

  if (context && !(await verifyRecipientEligibility(supabase, params.userId, context))) {
    return null;
  }

  const { data, error } = await supabase.rpc("create_notification_for_user", {
    p_user_id: params.userId,
    p_type: params.type,
    p_category: params.category,
    p_title: params.title,
    p_message: params.message,
    p_action_url: params.actionUrl ?? undefined,
    p_action_label: params.actionLabel ?? undefined,
    p_event_id: params.eventId ?? undefined,
    p_campaign_id: params.campaignId ?? undefined,
    p_metadata: params.metadata ? toJson(params.metadata) : undefined,
    p_dedupe_key: params.dedupeKey ?? undefined,
    p_priority: params.priority ?? "normal",
  });

  if (error) {
    // Deliberately do not fall back to a raw notifications INSERT. Doing so
    // would bypass database-owned preference, deduplication, and timing rules.
    console.error("Failed to dispatch smart notification:", error);
    return null;
  }

  const notification = parseCreatedNotification(data);
  if (notification) {
    await sendPushNotification(supabase, notification);
  }

  return notification;
}

export async function processCampaignActivity(activity: CampaignActivity) {
  const results: CreatedNotification[] = [];

  const dispatch = async (
    type: string,
    title: string,
    message: string,
    metric: string,
    value: number,
    actionLabel: string
  ) => {
    const notification = await dispatchSmartNotification({
      userId: activity.creatorId,
      type,
      category: type === "campaign_generation" ? "campaign_activity" : "campaign_milestones",
      title,
      message,
      actionUrl: `/campaign/${activity.campaignId}`,
      actionLabel,
      eventId: activity.eventId ?? null,
      campaignId: activity.campaignId,
      metadata: { [metric]: value, metric, campaign_name: activity.campaignName },
      dedupeKey: `campaign-${activity.campaignId}-${metric}-${value}`,
      priority: "normal",
      recipientContext: {
        userId: activity.creatorId,
        campaignId: activity.campaignId,
        roleRequired: "campaign_creator",
      },
    });

    if (notification) results.push(notification);
  };

  if (activity.generations === 1) {
    await dispatch(
      "campaign_generation",
      "Your campaign got its first generation",
      `"${activity.campaignName}" has received its first generated version.`,
      "generations",
      1,
      "View campaign"
    );
  }

  if (activity.generations === 10) {
    await dispatch(
      "campaign_milestone",
      "10 people generated your campaign",
      `"${activity.campaignName}" has reached 10 generations.`,
      "generations",
      10,
      "View campaign"
    );
  }

  if (MILESTONES.includes(activity.views)) {
    await dispatch(
      "campaign_milestone",
      `${activity.views} people viewed your campaign`,
      `"${activity.campaignName}" has reached ${activity.views} views.`,
      "views",
      activity.views,
      "View analytics"
    );
  }

  if ([5, 10, 25, 50, 100].includes(activity.shares)) {
    await dispatch(
      "campaign_milestone",
      `${activity.shares} people shared your campaign`,
      `"${activity.campaignName}" has been shared ${activity.shares} times.`,
      "shares",
      activity.shares,
      "View analytics"
    );
  }

  if ([10, 25, 50, 100].includes(activity.downloads)) {
    await dispatch(
      "campaign_milestone",
      `${activity.downloads} people downloaded your campaign`,
      `"${activity.campaignName}" has been downloaded ${activity.downloads} times.`,
      "downloads",
      activity.downloads,
      "View analytics"
    );
  }

  return results;
}
