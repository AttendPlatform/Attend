import { create } from 'zustand';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import {
  getNotifications,
  getUnreadNotificationCount,
  markAllNotificationsRead,
  markNotificationRead,
} from '@/lib/notifications/client';
import type { Notification } from '@/lib/notifications/types';

interface NotificationsState {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  latestNotification: Notification | null;
  isInitialized: boolean;

  fetchUnreadCount: () => Promise<number>;
  fetchNotifications: (category?: string, limit?: number) => Promise<void>;
  refresh: (category?: string) => Promise<void>;
  setupRealtime: (userId?: string) => Promise<void>;
  cleanupRealtime: () => void;
  reset: () => void;
  dismissLatestNotification: () => void;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
}

let activeChannel: RealtimeChannel | null = null;
let activeUserId: string | null = null;
let isSettingUp = false;

export const useNotificationsStore = create<NotificationsState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  loading: false,
  latestNotification: null,
  isInitialized: false,

  fetchUnreadCount: async () => {
    try {
      const count = await getUnreadNotificationCount();
      set({ unreadCount: count });
      return count;
    } catch (error) {
      console.error('[Attend Notifications] Failed to fetch unread count:', error);
      return get().unreadCount;
    }
  },

  fetchNotifications: async (category = 'all', limit = 20) => {
    set({ loading: true });
    try {
      const items = await getNotifications(category, limit);
      set({ notifications: items });
    } catch (error) {
      console.error('[Attend Notifications] Failed to fetch notifications:', error);
    } finally {
      set({ loading: false });
    }
  },

  refresh: async (category = 'all') => {
    set({ loading: true });
    try {
      const [items, count] = await Promise.all([
        getNotifications(category, 20),
        getUnreadNotificationCount(),
      ]);
      set({ notifications: items, unreadCount: count });
    } catch (error) {
      console.error('[Attend Notifications] Refresh failed:', error);
    } finally {
      set({ loading: false });
    }
  },

  setupRealtime: async (targetUserId?: string) => {
    let userId = targetUserId;
    if (!userId) {
      const supabase = createClient();
      const { data } = await supabase.auth.getUser();
      userId = data.user?.id;
    }

    if (!userId) {
      return;
    }

    if (activeChannel && activeUserId === userId) {
      return;
    }

    if (isSettingUp) {
      return;
    }

    isSettingUp = true;
    try {
      const supabase = createClient();

      if (activeChannel) {
        supabase.removeChannel(activeChannel);
        activeChannel = null;
        activeUserId = null;
      }

      const channel = supabase
        .channel(`notifications:${userId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${userId}`,
          },
          (payload) => {
            if (payload.eventType === 'INSERT') {
              const notification = payload.new as Notification;
              set((state) => ({
                latestNotification: notification,
                unreadCount: state.unreadCount + 1,
                notifications: state.notifications.length > 0
                  ? [notification, ...state.notifications.filter((item) => item.id !== notification.id)].slice(0, 50)
                  : state.notifications,
              }));
            } else if (payload.eventType === 'UPDATE') {
              const updated = payload.new as Notification;
              set((state) => {
                const prev = state.notifications.find((item) => item.id === updated.id);
                let countDiff = 0;
                if (prev?.status === 'unread' && updated.status === 'read') {
                  countDiff = -1;
                } else if (prev?.status === 'read' && updated.status === 'unread') {
                  countDiff = 1;
                }
                return {
                  unreadCount: Math.max(0, state.unreadCount + countDiff),
                  notifications: state.notifications.map((item) =>
                    item.id === updated.id ? updated : item
                  ),
                };
              });
            } else if (payload.eventType === 'DELETE') {
              const oldId = (payload.old as { id?: string })?.id;
              if (oldId) {
                set((state) => {
                  const deletedItem = state.notifications.find((item) => item.id === oldId);
                  const countDiff = deletedItem?.status === 'unread' ? -1 : 0;
                  return {
                    unreadCount: Math.max(0, state.unreadCount + countDiff),
                    notifications: state.notifications.filter((item) => item.id !== oldId),
                  };
                });
              }
            }
          }
        );

      channel.subscribe();
      activeChannel = channel;
      activeUserId = userId;
      set({ isInitialized: true });
    } finally {
      isSettingUp = false;
    }
  },

  cleanupRealtime: () => {
    if (activeChannel) {
      const supabase = createClient();
      supabase.removeChannel(activeChannel);
      activeChannel = null;
      activeUserId = null;
    }
    set({ isInitialized: false });
  },

  reset: () => {
    if (activeChannel) {
      const supabase = createClient();
      supabase.removeChannel(activeChannel);
      activeChannel = null;
      activeUserId = null;
    }
    set({
      notifications: [],
      unreadCount: 0,
      loading: false,
      latestNotification: null,
      isInitialized: false,
    });
  },

  dismissLatestNotification: () => {
    set({ latestNotification: null });
  },

  markRead: async (id: string) => {
    const { notifications } = get();
    const notification = notifications.find((item) => item.id === id);

    if (notification && notification.status === 'read') {
      return;
    }

    set((state) => ({
      notifications: state.notifications.map((item) =>
        item.id === id
          ? {
              ...item,
              status: 'read',
              read_at: item.read_at ?? new Date().toISOString(),
            }
          : item
      ),
      unreadCount: Math.max(0, state.unreadCount - 1),
    }));

    try {
      const success = await markNotificationRead(id);
      if (!success) {
        get().fetchUnreadCount();
      }
    } catch (error) {
      console.error('[Attend Notifications] Mark read failed:', error);
      get().fetchUnreadCount();
    }
  },

  markAllRead: async () => {
    const { unreadCount, notifications } = get();
    if (unreadCount === 0 && !notifications.some((n) => n.status === 'unread')) return;

    set((state) => ({
      notifications: state.notifications.map((notification) => ({
        ...notification,
        status: 'read',
        read_at: notification.read_at ?? new Date().toISOString(),
      })),
      unreadCount: 0,
    }));

    try {
      await markAllNotificationsRead();
    } catch (error) {
      console.error('[Attend Notifications] Mark all read failed:', error);
      get().fetchUnreadCount();
    }
  },
}));
