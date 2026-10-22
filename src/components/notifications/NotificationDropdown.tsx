"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { CheckCheck, Inbox } from "lucide-react";
import type { Notification } from "@/lib/notifications/types";

interface NotificationDropdownProps {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  onClose: () => void;
}

export function NotificationDropdown({
  notifications,
  unreadCount,
  loading,
  markRead,
  markAllRead,
  onClose,
}: NotificationDropdownProps) {
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Handle click / touch outside to fold the dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent | TouchEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [onClose]);

  const handleNotificationClick = async (notification: Notification) => {
    if (notification.status !== "read") {
      await markRead(notification.id);
    }
    onClose();
  };

  const filteredNotifications = notifications.filter((item) => {
    if (filter === "unread") return item.status !== "read";
    return true;
  });

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      <div className="fixed inset-0 z-40 bg-neutral-900/20 backdrop-blur-xs sm:hidden" />

      {/* Dropdown Container */}
      <div
        ref={dropdownRef}
        className="fixed inset-x-4 top-16 z-50 mx-auto max-w-sm overflow-hidden rounded-3xl border border-neutral-200/80 bg-white shadow-2xl ring-1 ring-black/5 animate-in fade-in zoom-in-95 duration-150 sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-3 sm:w-96 sm:rounded-2xl"
      >
        {/* HEADER */}
        <div className="border-b border-neutral-100 bg-neutral-50/60 px-5 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-neutral-900">
                Notifications
              </h3>
              {unreadCount > 0 && (
                <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-bold text-violet-700">
                  {unreadCount}
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllRead}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-violet-600 transition hover:text-violet-700"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Mark all read
              </button>
            )}
          </div>

          {/* FILTER TABS */}
          <div className="mt-3 flex gap-1 rounded-xl bg-neutral-200/60 p-1">
            <button
              onClick={() => setFilter("all")}
              className={`flex-1 rounded-lg py-1 text-xs font-medium transition ${
                filter === "all"
                  ? "bg-white text-neutral-900 shadow-xs"
                  : "text-neutral-600 hover:text-neutral-900"
              }`}
            >
              All ({notifications.length})
            </button>
            <button
              onClick={() => setFilter("unread")}
              className={`flex-1 rounded-lg py-1 text-xs font-medium transition ${
                filter === "unread"
                  ? "bg-white text-neutral-900 shadow-xs"
                  : "text-neutral-600 hover:text-neutral-900"
              }`}
            >
              Unread ({unreadCount})
            </button>
          </div>
        </div>

        {/* NOTIFICATION LIST */}
        <div className="max-h-80 overflow-y-auto divide-y divide-neutral-50">
          {loading ? (
            <div className="py-12 text-center text-xs text-neutral-400">
              Loading updates...
            </div>
          ) : filteredNotifications.length > 0 ? (
            filteredNotifications.map((item) => {
              const isUnread = item.status !== "read";

              return (
                <Link
                  key={item.id}
                  href={item.action_url || "/notifications"}
                  onClick={() => handleNotificationClick(item)}
                  className={`block px-5 py-3.5 transition hover:bg-neutral-50/80 ${
                    isUnread ? "bg-violet-50/40" : ""
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="pt-1.5">
                      <span
                        className={`block h-2 w-2 rounded-full ${
                          isUnread ? "bg-violet-600" : "bg-neutral-200"
                        }`}
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <p
                          className={`text-xs text-neutral-900 ${
                            isUnread ? "font-semibold" : "font-medium"
                          }`}
                        >
                          {item.title}
                        </p>

                        <span className="shrink-0 text-[10px] text-neutral-400">
                          {new Date(item.created_at).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>

                      {item.message && (
                        <p className="mt-1 text-xs leading-relaxed text-neutral-600 line-clamp-2">
                          {item.message}
                        </p>
                      )}

                      {item.action_label && (
                        <p className="mt-2 text-[11px] font-medium text-violet-600">
                          {item.action_label} &rarr;
                        </p>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })
          ) : (
            <div className="py-14 text-center px-4">
              <Inbox className="mx-auto mb-2.5 h-7 w-7 text-neutral-300" />
              <p className="text-xs font-semibold text-neutral-800">
                {filter === "unread" ? "No unread notifications" : "No notifications yet"}
              </p>
              <p className="mt-0.5 text-[11px] text-neutral-400">
                We&apos;ll notify you when something important arrives.
              </p>
            </div>
          )}
        </div>

        {/* VIEW ALL FOOTER */}
        <div className="border-t border-neutral-100 bg-neutral-50/40 p-3">
          <Link
            href="/notifications"
            onClick={onClose}
            className="flex w-full items-center justify-center rounded-xl bg-white border border-neutral-200/80 px-3 py-2.5 text-xs font-semibold text-neutral-700 shadow-xs transition hover:bg-neutral-50"
          >
            View all notifications
          </Link>
        </div>
      </div>
    </>
  );
}