"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Bell, CheckCheck, Settings, X } from "lucide-react";
import { useNotifications } from "@/hooks/useNotifications";
import { recordNotificationInteraction } from "@/lib/notifications/client";
import type { Notification } from "@/lib/notifications/types";

type NotificationCategoryFilter =
  | "all"
  | "events"
  | "campaigns"
  | "reminders"
  | "social";

function formatNotificationDate(date: string) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(date));
}

function matchesCategory(
  item: Notification,
  filter: NotificationCategoryFilter
): boolean {
  if (filter === "all") return true;

  if (filter === "events") {
    return Boolean(
      item.category?.startsWith("event_") ||
        item.category === "new_events" ||
        item.category === "trending_events" ||
        item.category === "featured_promotion" ||
        item.event_id
    );
  }

  if (filter === "campaigns") {
    return Boolean(
      item.category?.startsWith("campaign_") ||
        item.campaign_id
    );
  }

  if (filter === "reminders") {
    return Boolean(
      item.category === "event_reminder" ||
        item.category === "reminder" ||
        item.category === "recovery" ||
        item.type?.includes("reminder") ||
        item.type?.includes("abandoned")
    );
  }

  if (filter === "social") {
    return Boolean(
      item.category === "social" ||
        item.type === "friend_attending"
    );
  }

  return true;
}

export default function NotificationsPage() {
  const [categoryFilter, setCategoryFilter] =
    useState<NotificationCategoryFilter>("all");

  const {
    notifications,
    unreadCount,
    loading,
    markRead,
    markAllRead,
    dismissNotification,
  } = useNotifications("all", { autoFetchList: true });

  const activeNotifications = notifications.filter((item) => {
    if (
      item.status === "dismissed" ||
      item.status === "suppressed" ||
      item.status === "expired"
    ) {
      return false;
    }
    return matchesCategory(item, categoryFilter);
  });

  const handleNotificationClick = (notification: Notification) => {
    recordNotificationInteraction(notification.id, "click").catch(() => {});
    if (notification.status !== "read") {
      markRead(notification.id);
    }
  };

  const handleDismiss = (e: React.MouseEvent, notificationId: string) => {
    e.preventDefault();
    e.stopPropagation();
    dismissNotification(notificationId);
  };

  const filterTabs = [
    { id: "all", label: "All" },
    { id: "events", label: "Events" },
    { id: "campaigns", label: "Campaigns" },
    { id: "reminders", label: "Reminders" },
    { id: "social", label: "Social" },
  ] as const;

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
                type="button"
                onClick={markAllRead}
                className="inline-flex items-center gap-1.5 rounded-xl border border-violet-200 bg-violet-50 px-3.5 py-2 text-xs font-medium text-violet-700 shadow-xs transition hover:bg-violet-100"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Mark all read
              </button>
            )}
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="mb-6 flex items-center gap-2 overflow-x-auto pb-1">
          {filterTabs.map((tab) => {
            const isActive = categoryFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setCategoryFilter(tab.id)}
                className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
                  isActive
                    ? "bg-violet-600 text-white shadow-xs"
                    : "bg-white text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 border border-neutral-200/80"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Content Section */}
        {loading ? (
          <div className="py-20 text-center text-xs text-neutral-400">
            Loading notifications...
          </div>
        ) : activeNotifications.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-neutral-200 bg-white py-16 text-center shadow-xs">
            <Bell className="mx-auto mb-3 h-8 w-8 text-neutral-300" />
            <h2 className="text-sm font-semibold text-neutral-900">
              No notifications in this view
            </h2>
            <p className="mt-1 text-xs text-neutral-500">
              Activity from your events, campaigns, and reminders will appear here.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-xs">
            {activeNotifications.map((notification) => {
              const unread =
                notification.status === "unread" || notification.status === "sent";

              return (
                <div
                  key={notification.id}
                  className={`border-b border-neutral-100 last:border-b-0 transition ${
                    unread ? "bg-violet-50/40" : "bg-white hover:bg-neutral-50/50"
                  }`}
                >
                  <Link
                    href={notification.action_url || "#"}
                    onClick={() => handleNotificationClick(notification)}
                    className="block px-5 py-4 sm:px-6"
                  >
                    <div className="flex gap-4">
                      {notification.image_url ? (
                        <div className="mt-1 h-11 w-11 shrink-0 overflow-hidden rounded-xl border border-neutral-200/80 bg-neutral-100 shadow-xs">
                          <img
                            src={notification.image_url}
                            alt={notification.image_alt || notification.title}
                            className="h-full w-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-600 shadow-xs">
                          <Bell className="h-4 w-4" />
                        </div>
                      )}

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h2
                                className={`text-xs sm:text-sm ${
                                  unread
                                    ? "font-semibold text-neutral-900"
                                    : "font-medium text-neutral-800"
                                }`}
                              >
                                {notification.title}
                              </h2>

                              {notification.priority === "urgent" && (
                                <span className="rounded-md bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-700 uppercase tracking-wider">
                                  Urgent
                                </span>
                              )}

                              {notification.priority === "high" && (
                                <span className="rounded-md bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700 uppercase tracking-wider">
                                  High
                                </span>
                              )}

                              {notification.category === "recovery" && (
                                <span className="rounded-md bg-violet-100 px-2 py-0.5 text-[10px] font-bold text-violet-700">
                                  Draft recovery
                                </span>
                              )}
                            </div>

                            {notification.message && (
                              <p className="text-xs leading-relaxed text-neutral-600">
                                {notification.message}
                              </p>
                            )}

                            {notification.why_recommended && (
                              <p className="text-[11px] font-medium text-violet-600">
                                {notification.why_recommended}
                              </p>
                            )}
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {unread && (
                              <span className="h-2.5 w-2.5 rounded-full bg-violet-600 shadow-xs" />
                            )}

                            <button
                              type="button"
                              onClick={(e) => handleDismiss(e, notification.id)}
                              aria-label="Dismiss notification"
                              className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 transition"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
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
