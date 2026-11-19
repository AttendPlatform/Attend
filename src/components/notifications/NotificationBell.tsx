"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Bell } from "lucide-react";

import { useNotifications } from "@/hooks/useNotifications";
import { recordNotificationInteraction } from "@/lib/notifications/client";
import {
  getNextEligiblePopupNotification,
  isVisualNotification,
} from "@/lib/notifications/visual-rules";
import { NotificationDropdown } from "./NotificationDropdown";
import { NotificationToast } from "./NotificationToast";

function hasActiveModalInDom(): boolean {
  if (typeof document === "undefined") return false;
  return document.querySelector('[role="dialog"], [role="alertdialog"]') !== null;
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [hasOpenModal, setHasOpenModal] = useState(false);
  const pathname = usePathname() || "/";
  const impressedIdsRef = useRef<Set<string>>(new Set());

  const {
    notifications,
    unreadCount,
    loading,
    toastQueue,
    lastVisualPopupAt,
    dismissedRecommendationAt,
    markVisualPopupShown,
    dismissPopupNotification,
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
    if (typeof document === "undefined") return;
    setHasOpenModal(hasActiveModalInDom());

    const observer = new MutationObserver(() => {
      setHasOpenModal(hasActiveModalInDom());
    });
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["role"],
    });

    return () => observer.disconnect();
  }, []);

  const activePopup = getNextEligiblePopupNotification(toastQueue, {
    pathname,
    hasOpenModal,
    nowMs: Date.now(),
    lastVisualPopupShownAtMs: lastVisualPopupAt,
    dismissedAtMsByKey: dismissedRecommendationAt,
  });

  useEffect(() => {
    if (!activePopup) {
      return;
    }

    if (
      isVisualNotification(activePopup) &&
      !impressedIdsRef.current.has(activePopup.id)
    ) {
      impressedIdsRef.current.add(activePopup.id);
      markVisualPopupShown(activePopup);
      void recordNotificationInteraction(activePopup.id, "impression");
    }

    const durationMs = isVisualNotification(activePopup) ? 8000 : 6000;
    const timer = window.setTimeout(() => {
      dismissPopupNotification(activePopup, false);
    }, durationMs);

    return () => {
      window.clearTimeout(timer);
    };
  }, [activePopup, markVisualPopupShown, dismissPopupNotification]);

  return (
    <>
      {activePopup && (
        <NotificationToast
          notification={activePopup}
          onClose={() => dismissPopupNotification(activePopup, false)}
          onDismiss={() => dismissPopupNotification(activePopup, true)}
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
