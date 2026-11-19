
/// <reference lib="webworker" />

export {};

const sw = self as unknown as ServiceWorkerGlobalScope;

sw.addEventListener("push", (event: PushEvent) => {
  if (!event.data) return;

  let data: {
    title?: string;
    body?: string;
    icon?: string;
    badge?: string;
    image?: string;
    actionLabel?: string;
    notificationId?: string;
    url?: string;
    tag?: string;
  };

  try {
    data = event.data.json();
  } catch {
    data = { body: event.data.text() };
  }

  const notificationOptions: NotificationOptions & { image?: string } = {
    body: data.body || "",
    icon: data.icon || "/icons/icon-192x192.png",
    badge: data.badge || "/icons/icon-192x192.png",
    data: {
      url: data.url || "/notifications",
      notificationId: data.notificationId,
      actionLabel: data.actionLabel,
    },
    tag: data.tag || "attend-notification",
  };

  if (data.image) {
    notificationOptions.image = data.image;
  }

  event.waitUntil(
    sw.registration.showNotification(data.title || "Attend", notificationOptions)
  );
});

sw.addEventListener("notificationclick", (event: NotificationEvent) => {
  event.notification.close();

  const target = new URL(
    event.notification.data?.url || "/notifications",
    sw.location.origin
  );

  // Keep notification navigation within Attend's origin.
  if (target.origin !== sw.location.origin) {
    target.href = new URL("/notifications", sw.location.origin).href;
  }

  target.searchParams.set("src", "push_notification");

  event.waitUntil(
    sw.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then(async (clientList) => {
        const windowClient = clientList.find(
          (client): client is WindowClient => "focus" in client
        );

        if (windowClient) {
          await windowClient.navigate(target.href);
          return windowClient.focus();
        }

        return sw.clients.openWindow(target.href);
      })
  );
});
