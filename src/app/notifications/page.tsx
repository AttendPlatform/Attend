"use client";

import Link from "next/link";
import { ArrowLeft, Bell, CheckCheck, Settings } from "lucide-react";
import { useNotifications } from "@/hooks/useNotifications";

function formatNotificationDate(date: string) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(date));
}

export default function NotificationsPage() {
  const {
    notifications,
    unreadCount,
    loading,
    markRead,
    markAllRead,
  } = useNotifications("all", { autoFetchList: true });

  return (
    <main className="min-h-screen bg-neutral-50/50">
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        {/* Header Section */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link
              href="/"
              className="mb-4 inline-flex items-center gap-2 text-xs font-medium text-neutral-500 hover:text-neutral-900 transition"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to dashboard
            </Link>

            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-violet-100 text-violet-600 shadow-xs">
                <Bell className="h-5 w-5" />
              </div>

              <div>
                <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
                  Notifications
                </h1>
                <p className="text-xs text-neutral-500">
                  {unreadCount > 0
                    ? `${unreadCount} unread notification${unreadCount === 1 ? "" : "s"}`
                    : "You're all caught up"}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <Link
              href="/settings/notifications"
              className="inline-flex items-center gap-1.5 rounded-xl border border-neutral-200 bg-white px-3.5 py-2 text-xs font-medium text-neutral-700 shadow-xs transition hover:bg-neutral-50"
            >
              <Settings className="h-3.5 w-3.5 text-neutral-500" />
              Settings
            </Link>

            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="inline-flex items-center gap-1.5 rounded-xl border border-violet-200 bg-violet-50 px-3.5 py-2 text-xs font-medium text-violet-700 shadow-xs transition hover:bg-violet-100"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Mark all read
              </button>
            )}
          </div>
        </div>

        {/* Content Section */}
        {loading ? (
          <div className="py-20 text-center text-xs text-neutral-400">
            Loading notifications...
          </div>
        ) : notifications.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-neutral-200 bg-white py-16 text-center shadow-xs">
            <Bell className="mx-auto mb-3 h-8 w-8 text-neutral-300" />
            <h2 className="text-sm font-semibold text-neutral-900">
              No notifications yet
            </h2>
            <p className="mt-1 text-xs text-neutral-500">
              Activity from your events and campaigns will appear here.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-xs">
            {notifications.map((notification) => {
              const unread = notification.status === "unread";

              return (
                <div
                  key={notification.id}
                  className={`border-b border-neutral-100 last:border-b-0 transition ${
                    unread ? "bg-violet-50/40" : "bg-white hover:bg-neutral-50/50"
                  }`}
                >
                  <Link
                    href={notification.action_url || "#"}
                    onClick={() => {
                      if (unread) {
                        markRead(notification.id);
                      }
                    }}
                    className="block px-5 py-4 sm:px-6"
                  >
                    <div className="flex gap-4">
                      <div className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-600">
                        <Bell className="h-4 w-4" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h2
                              className={`text-xs sm:text-sm ${
                                unread
                                  ? "font-semibold text-neutral-900"
                                  : "font-medium text-neutral-800"
                              }`}
                            >
                              {notification.title}
                            </h2>

                            {notification.message && (
                              <p className="mt-1 text-xs leading-relaxed text-neutral-600">
                                {notification.message}
                              </p>
                            )}
                          </div>

                          {unread && (
                            <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-violet-600 shadow-xs" />
                          )}
                        </div>

                        <div className="mt-3 flex items-center justify-between gap-4">
                          <span className="text-[11px] text-neutral-400">
                            {formatNotificationDate(notification.created_at)}
                          </span>

                          {notification.action_label && (
                            <span className="text-xs font-medium text-violet-600">
                              {notification.action_label} &rarr;
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}