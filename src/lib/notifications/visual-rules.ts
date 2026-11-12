import type {
  Notification,
  NotificationPriority,
  NotificationStatus,
} from "@/types/notifications";

export const VISUAL_POPUP_COOLDOWN_MS = 20_000;
export const DISMISSAL_SUPPRESSION_DAYS = 7;
export const DISMISSAL_SUPPRESSION_WINDOW_MS =
  DISMISSAL_SUPPRESSION_DAYS * 24 * 60 * 60 * 1000;

export const ALLOWED_LOCAL_IMAGE_PREFIXES = [
  "/images/",
  "/icons/",
  "/storage/v1/object/public/",
] as const;

export const ACTIVE_POPUP_STATUSES: ReadonlySet<NotificationStatus> = new Set([
  "unread",
  "sent",
]);

export const NOTIFICATION_PRIORITY_RANK: Record<NotificationPriority, number> =
  {
    urgent: 4,
    high: 3,
    normal: 2,
    low: 1,
  };

export interface ImageSanitizationOptions {
  allowedHttpsHosts?: readonly string[];
}

export interface VisualImageResolution {
  src: string | null;
  alt: string;
  hasValidImage: boolean;
}

export interface PopupDisplayContext {
  pathname?: string | null;
  hasOpenModal?: boolean;
  lastVisualPopupShownAtMs?: number | null;
  dismissedAtMsByKey?: Record<string, number>;
  nowMs?: number;
}

export interface PopupDisplayDecision {
  canDisplay: boolean;
  reason: string | null;
}

export interface VisualPopupAccessibilityProps {
  role: "status";
  ariaLive: "polite" | "assertive";
  dismissAriaLabel: string;
  imageAlt: string;
}

function hasControlCharsOrWhitespace(value: string): boolean {
  return /[\u0000-\u001F\u007F\s]/.test(value);
}

function isAllowedHost(
  hostname: string,
  allowedHosts: readonly string[]
): boolean {
  const normalizedHost = hostname.toLowerCase();
  return allowedHosts.some((pattern) => {
    const normalizedPattern = pattern.trim().toLowerCase();
    if (!normalizedPattern) return false;
    if (normalizedPattern.startsWith("*.")) {
      const suffix = normalizedPattern.slice(1);
      return (
        normalizedHost.endsWith(suffix) &&
        normalizedHost.length > suffix.length
      );
    }
    return normalizedHost === normalizedPattern;
  });
}

/**
 * Validates that a notification image URL is an HTTPS URL or an approved local/storage path.
 */
export function sanitizeNotificationImageUrl(
  url: string | null | undefined,
  options?: ImageSanitizationOptions
): string | null {
  if (typeof url !== "string") {
    return null;
  }

  const trimmed = url.trim();
  if (!trimmed || hasControlCharsOrWhitespace(trimmed)) {
    return null;
  }

  if (trimmed.startsWith("/")) {
    // Block protocol-relative URLs, backslashes, and directory traversal.
    if (
      trimmed.startsWith("//") ||
      trimmed.includes("\\") ||
      trimmed.includes("..")
    ) {
      return null;
    }

    try {
      const parsedLocal = new URL(trimmed, "https://attend.local");
      const allowedPrefix = ALLOWED_LOCAL_IMAGE_PREFIXES.some((prefix) =>
        parsedLocal.pathname.startsWith(prefix)
      );
      if (!allowedPrefix) {
        return null;
      }
      return `${parsedLocal.pathname}${parsedLocal.search}`;
    } catch {
      return null;
    }
  }

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "https:") {
      return null;
    }
    if (parsed.username || parsed.password) {
      return null;
    }
    if (!parsed.hostname || !parsed.hostname.includes(".")) {
      return null;
    }
    if (
      options?.allowedHttpsHosts &&
      options.allowedHttpsHosts.length > 0 &&
      !isAllowedHost(parsed.hostname, options.allowedHttpsHosts)
    ) {
      return null;
    }
    return parsed.href;
  } catch {
    return null;
  }
}

export function isSupabaseStorageUrl(
  url: string | null | undefined
): boolean {
  const sanitized = sanitizeNotificationImageUrl(url);
  if (!sanitized) {
    return false;
  }
  if (sanitized.startsWith("/storage/v1/object/public/")) {
    return true;
  }
  try {
    const parsed = new URL(sanitized);
    return (
      parsed.hostname.endsWith(".supabase.co") &&
      parsed.pathname.includes("/storage/v1/object/")
    );
  } catch {
    return false;
  }
}

/**
 * Resolves a safe image source and accessible alt text with clean fallback support.
 */
export function resolveVisualNotificationImage(
  notification: Pick<Notification, "title" | "image_url" | "image_alt" | "metadata">,
  options?: ImageSanitizationOptions & { imageLoadFailed?: boolean }
): VisualImageResolution {
  const fallbackAlt = notification.image_alt?.trim() || notification.title;
  if (options?.imageLoadFailed) {
    return {
      src: null,
      alt: fallbackAlt,
      hasValidImage: false,
    };
  }

  const metadataImageUrl =
    typeof notification.metadata?.image_url === "string"
      ? notification.metadata.image_url
      : null;

  const src =
    sanitizeNotificationImageUrl(notification.image_url, options) ??
    sanitizeNotificationImageUrl(metadataImageUrl, options);

  return {
    src,
    alt: fallbackAlt,
    hasValidImage: Boolean(src),
  };
}

export function isSafeNotificationActionUrl(
  url: string | null | undefined,
  appOrigin?: string
): boolean {
  if (typeof url !== "string") {
    return false;
  }

  const trimmed = url.trim();
  if (!trimmed || hasControlCharsOrWhitespace(trimmed)) {
    return false;
  }

  if (trimmed.startsWith("/")) {
    return !trimmed.startsWith("//") && !trimmed.includes("\\");
  }

  try {
    const parsed = new URL(trimmed);
    if (appOrigin) {
      return parsed.origin === new URL(appOrigin).origin;
    }
    return parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export function sanitizeNotificationActionUrl(
  url: string | null | undefined,
  fallback = "/notifications",
  appOrigin?: string
): string {
  if (isSafeNotificationActionUrl(url, appOrigin)) {
    return (url as string).trim();
  }
  return fallback;
}

export function getNotificationPriorityRank(
  priority: string | null | undefined
): number {
  if (
    priority === "urgent" ||
    priority === "high" ||
    priority === "normal" ||
    priority === "low"
  ) {
    return NOTIFICATION_PRIORITY_RANK[priority];
  }
  return NOTIFICATION_PRIORITY_RANK.normal;
}

export function getNotificationDedupeKey(
  notification: Pick<Notification, "dedupe_key" | "metadata">
): string | null {
  if (
    typeof notification.dedupe_key === "string" &&
    notification.dedupe_key.trim().length > 0
  ) {
    return notification.dedupe_key.trim();
  }
  const metaKey = notification.metadata?.dedupe_key;
  if (typeof metaKey === "string" && metaKey.trim().length > 0) {
    return metaKey.trim();
  }
  return null;
}

export function isVisualNotification(
  notification: Pick<
    Notification,
    "presentation_format" | "image_url" | "metadata"
  >
): boolean {
  if (
    notification.presentation_format === "image_popup" ||
    notification.presentation_format === "featured_event"
  ) {
    return true;
  }

  const metadataImageUrl =
    typeof notification.metadata?.image_url === "string"
      ? notification.metadata.image_url
      : null;

  return Boolean(
    sanitizeNotificationImageUrl(notification.image_url) ??
      sanitizeNotificationImageUrl(metadataImageUrl)
  );
}

/**
 * Orders popups with urgent/high transactional notifications ahead of normal/low items,
 * using FIFO created_at order within identical priority tiers.
 */
export function comparePopupNotifications(
  a: Notification,
  b: Notification
): number {
  const rankDiff =
    getNotificationPriorityRank(b.priority) -
    getNotificationPriorityRank(a.priority);
  if (rankDiff !== 0) {
    return rankDiff;
  }

  const timeA = new Date(a.created_at).getTime();
  const timeB = new Date(b.created_at).getTime();
  const validA = !Number.isNaN(timeA);
  const validB = !Number.isNaN(timeB);

  if (validA && validB && timeA !== timeB) {
    return timeA - timeB;
  }

  return a.id.localeCompare(b.id);
}

export function sortNotificationPopupQueue(
  queue: readonly Notification[]
): Notification[] {
  const seenIds = new Set<string>();
  const seenDedupeKeys = new Set<string>();
  const filtered: Notification[] = [];

  for (const item of queue) {
    if (!ACTIVE_POPUP_STATUSES.has(item.status)) {
      continue;
    }
    if (seenIds.has(item.id)) {
      continue;
    }
    const dedupeKey = getNotificationDedupeKey(item);
    if (dedupeKey && seenDedupeKeys.has(dedupeKey)) {
      continue;
    }
    seenIds.add(item.id);
    if (dedupeKey) {
      seenDedupeKeys.add(dedupeKey);
    }
    filtered.push(item);
  }

  return filtered.sort(comparePopupNotifications);
}

export function enqueuePopupNotification(
  queue: readonly Notification[],
  incoming: Notification
): Notification[] {
  if (!ACTIVE_POPUP_STATUSES.has(incoming.status)) {
    return sortNotificationPopupQueue(queue);
  }
  return sortNotificationPopupQueue([...queue, incoming]);
}

export function isInterruptionGuardedRoute(
  pathname: string | null | undefined
): boolean {
  if (!pathname) {
    return false;
  }
  const normalized = pathname.trim().toLowerCase();
  if (!normalized) {
    return false;
  }

  return (
    normalized === "/create" ||
    normalized.startsWith("/create/") ||
    normalized.startsWith("/campaign/") ||
    normalized.includes("/campaigns/create") ||
    normalized.endsWith("/edit")
  );
}

export function isNotificationDismissalSuppressed(
  suppressionKey: string | null | undefined,
  dismissedAtMsByKey?: Record<string, number>,
  nowMs = Date.now()
): boolean {
  if (!suppressionKey || !dismissedAtMsByKey) {
    return false;
  }
  const dismissedAt = dismissedAtMsByKey[suppressionKey];
  if (typeof dismissedAt !== "number" || !Number.isFinite(dismissedAt)) {
    return false;
  }
  return nowMs - dismissedAt < DISMISSAL_SUPPRESSION_WINDOW_MS;
}

export function canDisplayPopupNotification(
  notification: Notification,
  context: PopupDisplayContext = {}
): PopupDisplayDecision {
  if (!ACTIVE_POPUP_STATUSES.has(notification.status)) {
    return {
      canDisplay: false,
      reason: `inactive_status_${notification.status}`,
    };
  }

  const nowMs = context.nowMs ?? Date.now();
  const suppressionKey = getNotificationDedupeKey(notification) ?? notification.id;
  if (
    isNotificationDismissalSuppressed(
      suppressionKey,
      context.dismissedAtMsByKey,
      nowMs
    )
  ) {
    return {
      canDisplay: false,
      reason: "dismissed_within_suppression_window",
    };
  }

  const isHighPrecedence =
    notification.priority === "urgent" || notification.priority === "high";

  if (!isHighPrecedence && isVisualNotification(notification)) {
    if (isInterruptionGuardedRoute(context.pathname)) {
      return {
        canDisplay: false,
        reason: "interruption_guard_route",
      };
    }

    if (context.hasOpenModal) {
      return {
        canDisplay: false,
        reason: "interruption_guard_modal",
      };
    }

    if (
      typeof context.lastVisualPopupShownAtMs === "number" &&
      Number.isFinite(context.lastVisualPopupShownAtMs) &&
      nowMs - context.lastVisualPopupShownAtMs < VISUAL_POPUP_COOLDOWN_MS
    ) {
      return {
        canDisplay: false,
        reason: "visual_popup_cooldown",
      };
    }
  }

  return {
    canDisplay: true,
    reason: null,
  };
}

export function getNextEligiblePopupNotification(
  queue: readonly Notification[],
  context: PopupDisplayContext = {}
): Notification | null {
  const ordered = sortNotificationPopupQueue(queue);
  for (const item of ordered) {
    if (canDisplayPopupNotification(item, context).canDisplay) {
      return item;
    }
  }
  return null;
}

export function getVisualPopupAccessibilityProps(
  notification: Pick<Notification, "title" | "priority" | "image_alt">
): VisualPopupAccessibilityProps {
  return {
    role: "status",
    ariaLive: notification.priority === "urgent" ? "assertive" : "polite",
    dismissAriaLabel: "Dismiss notification",
    imageAlt: notification.image_alt?.trim() || notification.title,
  };
}
