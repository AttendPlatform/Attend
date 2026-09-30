import { create } from 'zustand';
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

  refresh: (category?: string) => Promise<void>;
  setupRealtime: () => void;
  dismissLatestNotification: () => void;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
}

import type { RealtimeChannel } from '@supabase/supabase-js';

export const useNotificationsStore = create<NotificationsState>((set, get) => {
  let channel: RealtimeChannel | null = null;
  let isSettingUp = false;

  return {
    notifications: [],
    unreadCount: 0,
    loading: true,
    latestNotification: null,
    isInitialized: false,

    refresh: async (category = 'all') => {
      try {
        const [items, count] = await Promise.all([
          getNotifications(category),
          getUnreadNotificationCount(),
        ]);

        set({ notifications: items, unreadCount: count });
      } catch (error) {
        console.error('[Attend Notifications] Refresh failed:', error);
      } finally {
        set({ loading: false });
      }
    },

    setupRealtime: async () => {
      if (get().isInitialized || isSettingUp) return;
      isSettingUp = true;

      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        isSettingUp = false;
        return;
      }

      channel = supabase
        .channel(`notifications:${user.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            console.log('[Attend Notifications] New notification:', payload.new);

            const notification = payload.new as Notification;
            set({ latestNotification: notification });

            // Refresh list and unread count
            get().refresh();
          }
        );

      channel?.subscribe((status: string) => {
        console.log('[Attend Notifications] Realtime status:', status);
      });

      set({ isInitialized: true });
      isSettingUp = false;
    },

    dismissLatestNotification: () => {
      set({ latestNotification: null });
    },

    markRead: async (id: string) => {
      const { notifications } = get();
      const notification = notifications.find((item) => item.id === id);

      if (!notification || notification.status === 'read') {
        return;
      }

      try {
        const success = await markNotificationRead(id);
        if (!success) return;

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
      } catch (error) {
        console.error('[Attend Notifications] Mark read failed:', error);
      }
    },

    markAllRead: async () => {
      const { unreadCount, notifications } = get();
      if (unreadCount === 0) return;

      try {
        await markAllNotificationsRead();

        set({
          notifications: notifications.map((notification) => ({
            ...notification,
            status: 'read',
            read_at: notification.read_at ?? new Date().toISOString(),
          })),
          unreadCount: 0,
        });
      } catch (error) {
        console.error('[Attend Notifications] Mark all read failed:', error);
      }
    },
  };
});
