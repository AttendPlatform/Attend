import { createClient } from "@/lib/supabase/client";
import type { Notification } from "./types";

export async function getNotifications(
  category: string = "all",
  limit = 20
): Promise<Notification[]> {
  const supabase = createClient();

  const { data, error } = await supabase.rpc("get_my_notifications", {
    p_limit: limit,
    p_category: category === "all" ? undefined : category,
  });

  if (error) {
    console.error("Failed to fetch notifications:", error);
    throw error;
  }

  return (data as unknown as Notification[]) ?? [];
}

export async function getUnreadNotificationCount(): Promise<number> {
  const supabase = createClient();

  const { data, error } = await supabase.rpc(
    "get_unread_notification_count"
  );

  if (error) {
    console.error("Failed to fetch unread notification count:", error);
    throw error;
  }

  return Number(data ?? 0);
}

export async function markNotificationRead(
  notificationId: string
): Promise<boolean> {
  const supabase = createClient();

  const { data, error } = await supabase.rpc("mark_notification_read", {
    p_notification_id: notificationId,
  });

  if (error) {
    console.error("Failed to mark notification as read:", error);
    throw error;
  }

  return Boolean(data);
}

export async function markAllNotificationsRead(): Promise<number> {
  const supabase = createClient();

  const { data, error } = await supabase.rpc(
    "mark_all_notifications_read"
  );

  if (error) {
    console.error("Failed to mark all notifications as read:", error);
    throw error;
  }

  return Number(data ?? 0);
}

export type NotificationInteractionType = "impression" | "click" | "dismiss";

export async function dismissNotification(
  notificationId: string
): Promise<boolean> {
  const supabase = createClient();

  const { error } = await supabase
    .from("notifications")
    .update({
      status: "dismissed",
      dismissed_at: new Date().toISOString(),
    })
    .eq("id", notificationId);

  if (error) {
    console.error("Failed to dismiss notification:", error);
    return false;
  }

  // Record dismiss event asynchronously
  recordNotificationInteraction(notificationId, "dismiss").catch(() => {});

  return true;
}

export async function recordNotificationInteraction(
  notificationId: string,
  eventType: NotificationInteractionType,
  metadata?: Record<string, unknown>
): Promise<string | null> {
  const supabase = createClient();

  try {
    const { data, error } = await supabase.rpc("record_notification_event", {
      p_event_type: eventType,
      p_metadata: {
        notification_id: notificationId,
        ...metadata,
      },
    });

    if (error) {
      console.warn("Failed to record notification interaction:", error);
      return null;
    }

    return data ?? null;
  } catch (err) {
    console.warn("Failed to record notification interaction:", err);
    return null;
  }
}
