import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/lib/supabase/database.types";

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

type CreatedNotification = {
  id?: string | null;
  user_id?: string | null;
  type?: string | null;
  category?: string | null;
  title?: string | null;
  message?: string | null;
  action_url?: string | null;
  action_label?: string | null;
  event_id?: string | null;
  campaign_id?: string | null;
  metadata?: Json | null;
  dedupe_key?: string | null;
  priority?: string | null;
};

const MILESTONES = [10, 25, 50, 100, 250, 500, 1000];

function toJson(value: Record<string, unknown>): Json {
  return value as Json;
}

function parseCreatedNotification(
  value: unknown
): CreatedNotification | null {
  if (!value) {
    return null;
  }

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);

      if (parsed && typeof parsed === "object") {
        return parsed as CreatedNotification;
      }

      return null;
    } catch {
      return null;
    }
  }

  if (typeof value === "object") {
    return value as CreatedNotification;
  }

  return null;
}

async function sendPushNotification(
  supabase: Awaited<ReturnType<typeof createClient>>,
  notification: CreatedNotification
) {
  if (!notification.user_id) {
    return;
  }

  const { data: preferences, error: preferencesError } = await supabase
    .from("notification_preferences")
    .select("push_enabled")
    .eq("user_id", notification.user_id)
    .maybeSingle();

  if (preferencesError) {
    console.error(
      "Failed to fetch push notification preferences:",
      preferencesError
    );
    return;
  }

  if (!preferences?.push_enabled) {
    return;
  }

  try {
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
      console.error("Failed to send push notification:", error);
    }
  } catch (error) {
    console.error("Push notification error:", error);
  }
}

async function createNotification(
  supabase: Awaited<ReturnType<typeof createClient>>,
  params: {
    userId: string;
    type: string;
    category: string;
    title: string;
    message: string;
    actionUrl?: string | null;
    actionLabel?: string | null;
    eventId?: string | null;
    campaignId?: string | null;
    metadata?: Record<string, unknown>;
    dedupeKey?: string | null;
    priority?: "low" | "normal" | "high" | "urgent";
  }
): Promise<CreatedNotification | null> {
  const { data, error } = await supabase.rpc(
  "create_notification_for_user",
  {
    p_user_id: params.userId,
    p_type: params.type,
    p_category: params.category,
    p_title: params.title,
    p_message: params.message,
    p_action_url: params.actionUrl ?? undefined,
    p_action_label: params.actionLabel ?? undefined,
    p_event_id: params.eventId ?? undefined,
    p_campaign_id: params.campaignId ?? undefined,
    p_metadata: params.metadata
      ? toJson(params.metadata)
      : undefined,
    p_dedupe_key: params.dedupeKey ?? undefined,
    p_priority: params.priority ?? "normal",
  }
);

  if (error) {
    console.error("Failed to create notification:", error);
    return null;
  }

  const notification = parseCreatedNotification(data);

  if (notification) {
    await sendPushNotification(supabase, notification);
  }

  return notification;
}

export async function processCampaignActivity(
  activity: CampaignActivity
) {
  const supabase = await createClient();

  const results: CreatedNotification[] = [];

  // ------------------------------------------------------------
  // 1. First generation
  // ------------------------------------------------------------

  if (activity.generations === 1) {
    const notification = await createNotification(supabase, {
      userId: activity.creatorId,
      type: "campaign_generation",
      category: "campaign_activity",
      title: "Your campaign got its first generation",
      message: `"${activity.campaignName}" has received its first generated version.`,
      actionUrl: `/campaign/${activity.campaignId}`,
      actionLabel: "View campaign",
      eventId: activity.eventId ?? null,
      campaignId: activity.campaignId,
      metadata: {
        generations: activity.generations,
        campaign_name: activity.campaignName,
      },
      dedupeKey: `campaign-${activity.campaignId}-first-generation`,
      priority: "normal",
    });

    if (notification) {
      results.push(notification);
    }
  }

  // ------------------------------------------------------------
  // 2. First 10 generations
  // ------------------------------------------------------------

  if (activity.generations === 10) {
    const notification = await createNotification(supabase, {
      userId: activity.creatorId,
      type: "campaign_milestone",
      category: "campaign_milestones",
      title: "10 people generated your campaign",
      message: `"${activity.campaignName}" has reached 10 generations.`,
      actionUrl: `/campaign/${activity.campaignId}`,
      actionLabel: "View campaign",
      eventId: activity.eventId ?? null,
      campaignId: activity.campaignId,
      metadata: {
        milestone: 10,
        metric: "generations",
        campaign_name: activity.campaignName,
      },
      dedupeKey: `campaign-${activity.campaignId}-generations-10`,
      priority: "normal",
    });

    if (notification) {
      results.push(notification);
    }
  }

  // ------------------------------------------------------------
  // 3. Traffic milestones
  // ------------------------------------------------------------

  if (MILESTONES.includes(activity.views)) {
    const notification = await createNotification(supabase, {
      userId: activity.creatorId,
      type: "campaign_milestone",
      category: "campaign_milestones",
      title: `${activity.views} people viewed your campaign`,
      message: `"${activity.campaignName}" has reached ${activity.views} views.`,
      actionUrl: `/campaign/${activity.campaignId}`,
      actionLabel: "View analytics",
      eventId: activity.eventId ?? null,
      campaignId: activity.campaignId,
      metadata: {
        milestone: activity.views,
        metric: "views",
        campaign_name: activity.campaignName,
      },
      dedupeKey: `campaign-${activity.campaignId}-views-${activity.views}`,
      priority: "normal",
    });

    if (notification) {
      results.push(notification);
    }
  }

  // ------------------------------------------------------------
  // 4. Share milestones
  // ------------------------------------------------------------

  const shareMilestones = [5, 10, 25, 50, 100];

  if (shareMilestones.includes(activity.shares)) {
    const notification = await createNotification(supabase, {
      userId: activity.creatorId,
      type: "campaign_milestone",
      category: "campaign_milestones",
      title: `${activity.shares} people shared your campaign`,
      message: `"${activity.campaignName}" has been shared ${activity.shares} times.`,
      actionUrl: `/campaign/${activity.campaignId}`,
      actionLabel: "View analytics",
      eventId: activity.eventId ?? null,
      campaignId: activity.campaignId,
      metadata: {
        milestone: activity.shares,
        metric: "shares",
        campaign_name: activity.campaignName,
      },
      dedupeKey: `campaign-${activity.campaignId}-shares-${activity.shares}`,
      priority: "normal",
    });

    if (notification) {
      results.push(notification);
    }
  }

  // ------------------------------------------------------------
  // 5. Download milestones
  // ------------------------------------------------------------

  const downloadMilestones = [10, 25, 50, 100];

  if (downloadMilestones.includes(activity.downloads)) {
    const notification = await createNotification(supabase, {
      userId: activity.creatorId,
      type: "campaign_milestone",
      category: "campaign_milestones",
      title: `${activity.downloads} people downloaded your campaign`,
      message: `"${activity.campaignName}" has been downloaded ${activity.downloads} times.`,
      actionUrl: `/campaign/${activity.campaignId}`,
      actionLabel: "View analytics",
      eventId: activity.eventId ?? null,
      campaignId: activity.campaignId,
      metadata: {
        milestone: activity.downloads,
        metric: "downloads",
        campaign_name: activity.campaignName,
      },
      dedupeKey: `campaign-${activity.campaignId}-downloads-${activity.downloads}`,
      priority: "normal",
    });

    if (notification) {
      results.push(notification);
    }
  }

  return results;
}