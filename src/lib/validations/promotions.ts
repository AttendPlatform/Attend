import { z } from "zod";
import {
  isSafeNotificationActionUrl,
  sanitizeNotificationImageUrl,
} from "@/lib/notifications/visual-rules";
import type {
  BannerPlacement,
  FeaturedEventPriority,
  FeaturedEventWithEvent,
  PromotionalBannerRecord,
  PromotionViewerContext,
} from "@/types/promotions";

export const FEATURED_PRIORITY_RANK: Record<FeaturedEventPriority, number> = {
  campaign_level: 3,
  high_priority: 2,
  standard: 1,
};

export const featureEventSchema = z
  .object({
    eventId: z.string().uuid("Please select a valid event."),
    priority: z
      .enum(["standard", "high_priority", "campaign_level"])
      .default("standard"),
    promotionalMessage: z
      .string()
      .trim()
      .max(280, "Promotional message must be 280 characters or fewer.")
      .optional()
      .nullable(),
    promotionalImageUrl: z
      .string()
      .trim()
      .optional()
      .nullable(),
    targetAudience: z
      .object({
        cities: z.array(z.string().trim().min(1)).optional(),
        categories: z.array(z.string().trim().min(1)).optional(),
        interests: z.array(z.string().trim().min(1)).optional(),
        past_attendees: z.boolean().optional(),
        saved_similar: z.boolean().optional(),
      })
      .passthrough()
      .optional()
      .default({}),
    notificationChannels: z
      .array(z.enum(["in_app", "push", "email"]))
      .min(1)
      .optional()
      .default(["in_app", "push"]),
    notificationMode: z
      .enum([
        "platform_only",
        "selected_audience",
        "broad_announcement",
        "scheduled_campaign",
      ])
      .default("platform_only"),
    scheduledNotificationAt: z.string().datetime({ offset: true }).optional().nullable(),
    startAt: z.string().min(1, "Start date is required."),
    endAt: z.string().min(1, "End date is required."),
    status: z
      .enum(["draft", "active", "paused", "expired", "archived"])
      .optional()
      .default("active"),
  })
  .superRefine((data, ctx) => {
    const startMs = Date.parse(data.startAt);
    const endMs = Date.parse(data.endAt);

    if (Number.isNaN(startMs)) {
      ctx.addIssue({
        code: "custom",
        path: ["startAt"],
        message: "Invalid start date.",
      });
    }

    if (Number.isNaN(endMs)) {
      ctx.addIssue({
        code: "custom",
        path: ["endAt"],
        message: "Invalid end date.",
      });
    }

    if (!Number.isNaN(startMs) && !Number.isNaN(endMs) && endMs <= startMs) {
      ctx.addIssue({
        code: "custom",
        path: ["endAt"],
        message: "End date must be after start date.",
      });
    }

    if (
      data.promotionalImageUrl &&
      !sanitizeNotificationImageUrl(data.promotionalImageUrl)
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["promotionalImageUrl"],
        message:
          "Promotional image URL must be HTTPS or an approved local image path.",
      });
    }
  });

export function validateScheduleRange(
  startAt: string,
  endAt: string
): { valid: boolean; error?: string } {
  const startMs = Date.parse(startAt);
  const endMs = Date.parse(endAt);

  if (Number.isNaN(startMs) || Number.isNaN(endMs)) {
    return { valid: false, error: "Invalid schedule timestamps." };
  }

  if (endMs <= startMs) {
    return { valid: false, error: "End time must be after start time." };
  }

  return { valid: true };
}

export function isWithinActiveWindow(
  startAt: string,
  endAt: string,
  nowMs = Date.now()
): boolean {
  const startMs = Date.parse(startAt);
  const endMs = Date.parse(endAt);

  if (Number.isNaN(startMs) || Number.isNaN(endMs)) {
    return false;
  }

  return startMs <= nowMs && endMs > nowMs;
}

export function matchesFeaturedAudience(
  item: Pick<FeaturedEventWithEvent, "target_audience" | "event">,
  viewerContext?: PromotionViewerContext
): boolean {
  if (!viewerContext) return true;

  const audience = item.target_audience ?? {};
  const targetCities = Array.isArray(audience.cities)
    ? audience.cities.map((c) => c.trim().toLowerCase()).filter(Boolean)
    : [];

  if (targetCities.length > 0 && viewerContext.city) {
    const viewerCity = viewerContext.city.trim().toLowerCase();
    if (!targetCities.some((city) => viewerCity.includes(city) || city.includes(viewerCity))) {
      return false;
    }
  }

  const targetCategories = Array.isArray(audience.categories)
    ? audience.categories.map((c) => c.trim().toLowerCase()).filter(Boolean)
    : [];

  if (
    targetCategories.length > 0 &&
    viewerContext.categoryIds &&
    viewerContext.categoryIds.length > 0
  ) {
    const viewerSet = new Set(
      viewerContext.categoryIds.map((c) => c.trim().toLowerCase())
    );
    const eventCategoryId = item.event?.category_id?.toLowerCase();
    const matchesTarget = targetCategories.some((cat) => viewerSet.has(cat));
    const matchesEvent = eventCategoryId ? viewerSet.has(eventCategoryId) : false;
    if (!matchesTarget && !matchesEvent) {
      return false;
    }
  }

  return true;
}

export function sortFeaturedEventsByPriority<
  T extends Pick<FeaturedEventWithEvent, "priority" | "created_at" | "event">
>(items: readonly T[]): T[] {
  return [...items].sort((a, b) => {
    const rankDiff =
      (FEATURED_PRIORITY_RANK[b.priority] ?? 1) -
      (FEATURED_PRIORITY_RANK[a.priority] ?? 1);
    if (rankDiff !== 0) {
      return rankDiff;
    }

    const startA = a.event?.start_at ? Date.parse(a.event.start_at) : Number.MAX_SAFE_INTEGER;
    const startB = b.event?.start_at ? Date.parse(b.event.start_at) : Number.MAX_SAFE_INTEGER;
    if (!Number.isNaN(startA) && !Number.isNaN(startB) && startA !== startB) {
      return startA - startB;
    }

    return Date.parse(b.created_at) - Date.parse(a.created_at);
  });
}

export function isSafeBannerDestinationUrl(url: string | null | undefined): boolean {
  return isSafeNotificationActionUrl(url);
}

export const promotionalBannerSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(2, "Banner title must be at least 2 characters.")
      .max(120, "Banner title must be 120 characters or fewer."),
    description: z
      .string()
      .trim()
      .max(300, "Banner description must be 300 characters or fewer.")
      .optional()
      .nullable(),
    imageUrl: z.string().trim().min(1, "Fallback image URL is required."),
    mobileImageUrl: z.string().trim().optional().nullable(),
    desktopImageUrl: z.string().trim().optional().nullable(),
    ctaLabel: z
      .string()
      .trim()
      .max(40, "CTA label must be 40 characters or fewer.")
      .optional()
      .nullable(),
    destinationUrl: z.string().trim().min(1, "Destination URL is required."),
    placement: z.enum(["home", "discover", "both"]).default("both"),
    slotType: z.string().trim().min(1).max(40).optional().default("hero"),
    priority: z.coerce.number().int().min(1).max(1000).optional().default(1),
    targetingRules: z
      .object({
        cities: z.array(z.string().trim().min(1)).optional(),
        categories: z.array(z.string().trim().min(1)).optional(),
        authenticated_only: z.boolean().optional(),
      })
      .passthrough()
      .optional()
      .default({}),
    startAt: z.string().min(1, "Start date is required."),
    endAt: z.string().min(1, "End date is required."),
    status: z
      .enum(["draft", "published", "paused", "archived"])
      .optional()
      .default("draft"),
  })
  .superRefine((data, ctx) => {
    const schedule = validateScheduleRange(data.startAt, data.endAt);
    if (!schedule.valid) {
      ctx.addIssue({
        code: "custom",
        path: ["endAt"],
        message: schedule.error ?? "Invalid banner schedule range.",
      });
    }

    if (!sanitizeNotificationImageUrl(data.imageUrl)) {
      ctx.addIssue({
        code: "custom",
        path: ["imageUrl"],
        message: "Image URL must be HTTPS or an approved local image path.",
      });
    }

    if (
      data.mobileImageUrl &&
      !sanitizeNotificationImageUrl(data.mobileImageUrl)
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["mobileImageUrl"],
        message:
          "Mobile image URL must be HTTPS or an approved local image path.",
      });
    }

    if (
      data.desktopImageUrl &&
      !sanitizeNotificationImageUrl(data.desktopImageUrl)
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["desktopImageUrl"],
        message:
          "Desktop image URL must be HTTPS or an approved local image path.",
      });
    }

    if (!isSafeBannerDestinationUrl(data.destinationUrl)) {
      ctx.addIssue({
        code: "custom",
        path: ["destinationUrl"],
        message:
          "Destination URL must be a safe relative path or an HTTPS URL.",
      });
    }
  });

export function matchesBannerTargeting(
  banner: Pick<
    PromotionalBannerRecord,
    "placement" | "status" | "start_at" | "end_at" | "targeting_rules"
  >,
  placement: Exclude<BannerPlacement, "both">,
  viewerContext?: PromotionViewerContext,
  nowMs = Date.now()
): boolean {
  if (banner.status !== "published") {
    return false;
  }

  if (!isWithinActiveWindow(banner.start_at, banner.end_at, nowMs)) {
    return false;
  }

  if (banner.placement !== "both" && banner.placement !== placement) {
    return false;
  }

  const rules = banner.targeting_rules ?? {};
  if (rules.authenticated_only && !viewerContext?.isAuthenticated) {
    return false;
  }

  const targetCities = Array.isArray(rules.cities)
    ? rules.cities.map((c) => c.trim().toLowerCase()).filter(Boolean)
    : [];

  if (targetCities.length > 0 && viewerContext?.city) {
    const viewerCity = viewerContext.city.trim().toLowerCase();
    if (!targetCities.some((c) => viewerCity.includes(c) || c.includes(viewerCity))) {
      return false;
    }
  }

  const targetCategories = Array.isArray(rules.categories)
    ? rules.categories.map((c) => c.trim().toLowerCase()).filter(Boolean)
    : [];

  if (
    targetCategories.length > 0 &&
    viewerContext?.categoryIds &&
    viewerContext.categoryIds.length > 0
  ) {
    const viewerSet = new Set(
      viewerContext.categoryIds.map((c) => c.trim().toLowerCase())
    );
    if (!targetCategories.some((c) => viewerSet.has(c))) {
      return false;
    }
  }

  return true;
}

export function sortBannersByPriority<
  T extends Pick<PromotionalBannerRecord, "priority" | "created_at">
>(banners: readonly T[]): T[] {
  return [...banners].sort((a, b) => {
    if (b.priority !== a.priority) {
      return b.priority - a.priority;
    }
    return Date.parse(b.created_at) - Date.parse(a.created_at);
  });
}

export function resolveBannerImages(
  banner: Pick<
    PromotionalBannerRecord,
    "image_url" | "mobile_image_url" | "desktop_image_url"
  >
): {
  fallbackSrc: string | null;
  mobileSrc: string | null;
  desktopSrc: string | null;
} {
  const fallbackSrc = sanitizeNotificationImageUrl(banner.image_url);
  const mobileSrc =
    sanitizeNotificationImageUrl(banner.mobile_image_url) ?? fallbackSrc;
  const desktopSrc =
    sanitizeNotificationImageUrl(banner.desktop_image_url) ?? fallbackSrc;

  return { fallbackSrc, mobileSrc, desktopSrc };
}

export const adminBroadcastSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(2, "Broadcast title must be at least 2 characters.")
      .max(120, "Broadcast title must be 120 characters or fewer."),
    message: z
      .string()
      .trim()
      .min(4, "Broadcast message must be at least 4 characters.")
      .max(500, "Broadcast message must be 500 characters or fewer."),
    actionUrl: z.string().trim().optional().nullable(),
    actionLabel: z
      .string()
      .trim()
      .max(40, "Action label must be 40 characters or fewer.")
      .optional()
      .nullable(),
    priority: z.enum(["normal", "high", "urgent"]).optional().default("normal"),
    cities: z.array(z.string().trim().min(1)).optional(),
    testPreview: z.boolean().optional().default(false),
    confirmBroadcast: z.boolean().optional().default(false),
  })
  .superRefine((data, ctx) => {
    if (data.actionUrl && !isSafeBannerDestinationUrl(data.actionUrl)) {
      ctx.addIssue({
        code: "custom",
        path: ["actionUrl"],
        message: "Broadcast action URL must be a safe relative path or HTTPS URL.",
      });
    }

    if (!data.testPreview && !data.confirmBroadcast) {
      ctx.addIssue({
        code: "custom",
        path: ["confirmBroadcast"],
        message:
          "Please confirm broadcast approval before sending to all matching users.",
      });
    }
  });
