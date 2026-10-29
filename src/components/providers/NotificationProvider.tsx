"use client";

import { useEffect, useRef } from "react";
import { useAuthStore } from "@/stores/useAuthStore";
import { useNotificationsStore } from "@/stores/useNotificationsStore";

export function NotificationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const userId = useAuthStore((s) => s.user?.id);
  const fetchUnreadCount = useNotificationsStore((s) => s.fetchUnreadCount);
  const setupRealtime = useNotificationsStore((s) => s.setupRealtime);
  const cleanupRealtime = useNotificationsStore((s) => s.cleanupRealtime);
  const reset = useNotificationsStore((s) => s.reset);
  const lastVisibilityFetch = useRef<number>(0);

  useEffect(() => {
    if (!userId) {
      cleanupRealtime();
      reset();
      return;
    }

    fetchUnreadCount();
    setupRealtime(userId);

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        const now = Date.now();
        if (now - lastVisibilityFetch.current > 60_000) {
          lastVisibilityFetch.current = now;
          fetchUnreadCount();
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      cleanupRealtime();
    };
  }, [userId, fetchUnreadCount, setupRealtime, cleanupRealtime, reset]);

  return <>{children}</>;
}
