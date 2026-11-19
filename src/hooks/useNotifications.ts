"use client";

import { useCallback, useEffect } from "react";
import { useNotificationsStore } from "@/stores/useNotificationsStore";

export interface UseNotificationsOptions {
  autoFetchList?: boolean;
}

export function useNotifications(
  category = "all",
  options: UseNotificationsOptions = {}
) {
  const { autoFetchList = false } = options;

  const notifications = useNotificationsStore((s) => s.notifications);
  const unreadCount = useNotificationsStore((s) => s.unreadCount);
  const loading = useNotificationsStore((s) => s.loading);
  const latestNotification = useNotificationsStore((s) => s.latestNotification);
  const toastQueue = useNotificationsStore((s) => s.toastQueue);
  const lastVisualPopupAt = useNotificationsStore((s) => s.lastVisualPopupAt);
  const dismissedRecommendationAt = useNotificationsStore(
    (s) => s.dismissedRecommendationAt
  );
  const dismissLatestNotification = useNotificationsStore(
    (s) => s.dismissLatestNotification
  );
  const markVisualPopupShown = useNotificationsStore(
    (s) => s.markVisualPopupShown
  );
  const dismissPopupNotification = useNotificationsStore(
    (s) => s.dismissPopupNotification
  );
  const dismissNotification = useNotificationsStore(
    (s) => s.dismissNotification
  );
  const markRead = useNotificationsStore((s) => s.markRead);
  const markAllRead = useNotificationsStore((s) => s.markAllRead);
  const fetchNotificationsAction = useNotificationsStore(
    (s) => s.fetchNotifications
  );
  const fetchUnreadCountAction = useNotificationsStore(
    (s) => s.fetchUnreadCount
  );

  useEffect(() => {
    if (autoFetchList) {
      fetchNotificationsAction(category);
    }
  }, [category, autoFetchList, fetchNotificationsAction]);

  const fetchNotifications = useCallback(
    (limit = 20) => fetchNotificationsAction(category, limit),
    [category, fetchNotificationsAction]
  );

  const refresh = useCallback(
    () => fetchNotificationsAction(category),
    [category, fetchNotificationsAction]
  );

  return {
    notifications,
    unreadCount,
    loading,
    latestNotification,
    toastQueue,
    lastVisualPopupAt,
    dismissedRecommendationAt,
    dismissLatestNotification,
    markVisualPopupShown,
    dismissPopupNotification,
    dismissNotification,
    refresh,
    fetchNotifications,
    fetchUnreadCount: fetchUnreadCountAction,
    markRead,
    markAllRead,
  };
}