import { createClient } from "@/lib/supabase/client";
import type { Notification } from "./types";

export async function getNotifications(
  category: string = "all",
  limit = 30
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