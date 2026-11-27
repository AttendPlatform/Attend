import { z } from "zod";
import { sanitizeNotificationImageUrl } from "@/lib/notifications/visual-rules";
import type {
  FeaturedEventPriority,
  FeaturedEventWithEvent,
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
