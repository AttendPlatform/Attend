"use client";

import { useEffect, useState } from "react";
import { Bell } from "lucide-react";

import { useNotifications } from "@/hooks/useNotifications";
import { NotificationDropdown } from "./NotificationDropdown";
import { NotificationToast } from "./NotificationToast";

export function NotificationBell() {
  const [open, setOpen] = useState(false);

  const {
    notifications,
    unreadCount,
    loading,
    latestNotification,
    dismissLatestNotification,
    fetchNotifications,
    markRead,
    markAllRead,
  } = useNotifications("all", { autoFetchList: false });

  useEffect(() => {
    if (open) {
      fetchNotifications();
    }
  }, [open, fetchNotifications]);

  useEffect(() => {
    if (!latestNotification) {
      return;
    }

    const timer = window.setTimeout(() => {
      dismissLatestNotification();
    }, 6000);

    return () => {
      window.clearTimeout(timer);
    };
  }, [
    latestNotification,
    dismissLatestNotification,
  ]);

  return (
    <>
      {latestNotification && (
        <NotificationToast
          notification={latestNotification}
          onClose={dismissLatestNotification}
        />
      )}

      <div className="relative">
        <button
          type="button"
          aria-label="Notifications"
          aria-expanded={open}
          onClick={() => setOpen((current) => !current)}
          className="relative flex h-9 w-9 items-center justify-center rounded-full bg-neutral-50 text-neutral-600 transition hover:bg-neutral-100 hover:text-neutral-900 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
        >
          <Bell className="h-4 w-4" />

          {unreadCount > 0 && (
            <span className="absolute right-1.5 top-1.5 flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-violet-400 opacity-50" />

              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-violet-600 ring-2 ring-white" />
            </span>
          )}
        </button>

        {open && (
          <NotificationDropdown
            notifications={notifications}
            unreadCount={unreadCount}
            loading={loading}
            markRead={markRead}
            markAllRead={markAllRead}
            onClose={() => setOpen(false)}
          />
        )}
      </div>
    </>
  );
}