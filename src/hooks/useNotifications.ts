"use client";

import { useEffect } from "react";
import { useNotificationsStore } from "@/stores/useNotificationsStore";

export function useNotifications(category = "all") {
  const store = useNotificationsStore();

  useEffect(() => {
    // Only refresh if category changes or initial load
    store.refresh(category);
    
    // Setup realtime listener (store ensures it only happens once globally)
    store.setupRealtime();
  }, [category, store]);

  return {
    notifications: store.notifications,
    unreadCount: store.unreadCount,
    loading: store.loading,
    latestNotification: store.latestNotification,
    dismissLatestNotification: store.dismissLatestNotification,
    refresh: () => store.refresh(category),
    markRead: store.markRead,
    markAllRead: store.markAllRead,
  };
}