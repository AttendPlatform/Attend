import "server-only";

import { createClient as createSupabaseClient, type SupabaseClient } from "@supabase/supabase-js";
import { requirePlatformAdmin } from "@/lib/auth/admin";
import {
  dispatchSmartNotification,
  dispatchVisualEventNotification,
} from "@/lib/notifications/engine";
import { sanitizeNotificationImageUrl } from "@/lib/notifications/visual-rules";
import type { Database, Json } from "@/lib/supabase/database.types";
import { createClient, createPublicClient } from "@/lib/supabase/server";
import {
  adminBroadcastSchema,
  featureEventSchema,
  isWithinActiveWindow,
  matchesBannerTargeting,
  matchesFeaturedAudience,
  promotionalBannerSchema,
  sortBannersByPriority,
  sortFeaturedEventsByPriority,
} from "@/lib/validations/promotions";
import type {
  AdminAuditLogRecord,
  AdminBroadcastInput,
  AdminBroadcastResult,
  AdminNotificationSettingRecord,
  BannerAnalyticsEventType,
  BannerPlacement,
  BannerStatus,
  BannerTargetingRules,
  FeatureEventInput,
  FeaturedCampaignDispatchResult,
  FeaturedEventMetric,
  FeaturedEventNotificationMode,
  FeaturedEventPriority,
  FeaturedEventRecord,
  FeaturedEventStatus,
  FeaturedEventSummary,
  FeaturedEventTargetAudience,
  FeaturedEventWithEvent,
  NotificationTemplateRecord,
  PromotionalBannerInput,
  PromotionalBannerRecord,
  PromotionViewerContext,
} from "@/types/promotions";

type TypedClient = SupabaseClient<Database>;
type FeaturedRow = Database["public"]["Tables"]["featured_events"]["Row"];
type BannerRow = Database["public"]["Tables"]["promotional_banners"]["Row"];

const RECIPIENT_CHUNK_SIZE = 100;
const RECENT_EXPOSURE_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;
const ACTIVE_PARTICIPANT_STATUSES = [
  "attending",
  "registered",
  "ticketed",
  "attended",
] as const;

function toJson(value: Record<string, unknown>): Json {
  return value as Json;
}

function getPrivilegedClient(fallback: TypedClient): TypedClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    return fallback;
  }

  return createSupabaseClient<Database>(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function normalizeObject(value: Json | null | undefined): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
}

function mapFeaturedRow(row: FeaturedRow): FeaturedEventRecord {
  return {
    id: row.id,
    event_id: row.event_id,
    priority: row.priority as FeaturedEventPriority,
    promotional_message: row.promotional_message,
    promotional_image_url: row.promotional_image_url,
    target_audience: normalizeObject(row.target_audience) as FeaturedEventTargetAudience,
    notification_channels: row.notification_channels ?? ["in_app", "push"],
    notification_mode: row.notification_mode as FeaturedEventNotificationMode,
    scheduled_notification_at: row.scheduled_notification_at,
    start_at: row.start_at,
    end_at: row.end_at,
    status: row.status as FeaturedEventStatus,
    views_count: row.views_count,
    clicks_count: row.clicks_count,
    saves_count: row.saves_count,
    registrations_count: row.registrations_count,
    created_by: row.created_by,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export async function recordAdminAuditLog(
  supabase: TypedClient,
  params: {
    adminId: string;
    action: string;
    targetType: string;
    targetId?: string | null;
    metadata?: Record<string, unknown>;
  }
): Promise<void> {
  const { error } = await supabase.from("admin_audit_logs").insert({
    admin_id: params.adminId,
    action: params.action,
    target_type: params.targetType,
    target_id: params.targetId ?? null,
    metadata: toJson(params.metadata ?? {}),
  });

  if (error) {
    console.error("[promotions] Failed to record admin audit log:", error);
  }
}

async function hydrateFeaturedEvents(
  supabase: TypedClient,
  rows: FeaturedRow[]
): Promise<FeaturedEventWithEvent[]> {
  if (rows.length === 0) return [];

  const eventIds = Array.from(new Set(rows.map((row) => row.event_id)));
  const { data: events, error: eventsError } = await supabase
    .from("events")
    .select(
      "id, title, slug, description, cover_image, start_at, end_at, city, state, venue_name, is_online, category_id, participant_count, status"
    )
    .in("id", eventIds);

  if (eventsError) {
    throw new Error(`Failed to load featured event details: ${eventsError.message}`);
  }

  const categoryIds = Array.from(
    new Set(
      (events ?? [])
        .map((ev) => ev.category_id)
        .filter((id): id is string => Boolean(id))
    )
  );

  const categoryMap = new Map<string, string>();
  if (categoryIds.length > 0) {
    const { data: categories } = await supabase
      .from("event_categories")
      .select("id, name")
      .in("id", categoryIds);

    for (const cat of categories ?? []) {
      categoryMap.set(cat.id, cat.name);
    }
  }

  const eventMap = new Map<string, FeaturedEventSummary>();
  for (const ev of events ?? []) {
    eventMap.set(ev.id, {
      id: ev.id,
      title: ev.title,
      slug: ev.slug,
      description: ev.description,
      cover_image: ev.cover_image,
      start_at: ev.start_at,
      end_at: ev.end_at,
      city: ev.city,
      state: ev.state,
      venue_name: ev.venue_name,
      is_online: ev.is_online,
      category_id: ev.category_id,
      participant_count: ev.participant_count,
      status: ev.status,
      category_name: ev.category_id ? categoryMap.get(ev.category_id) ?? null : null,
    });
  }

  return rows.map((row) => ({
    ...mapFeaturedRow(row),
    event: eventMap.get(row.event_id) ?? null,
  }));
}

export async function listFeaturedEventsForAdmin(): Promise<FeaturedEventWithEvent[]> {
  const admin = await requirePlatformAdmin();
  const { data, error } = await admin.supabase
    .from("featured_events")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    throw new Error(`Failed to fetch featured events: ${error.message}`);
  }

  const hydrated = await hydrateFeaturedEvents(admin.supabase, data ?? []);
  return sortFeaturedEventsByPriority(hydrated);
}

export async function listPublishedEventsForPromotion(): Promise<FeaturedEventSummary[]> {
  const admin = await requirePlatformAdmin();
  const { data: events, error } = await admin.supabase
    .from("events")
    .select(
      "id, title, slug, description, cover_image, start_at, end_at, city, state, venue_name, is_online, category_id, participant_count, status"
    )
    .eq("status", "published")
    .order("start_at", { ascending: true })
    .limit(100);

  if (error) {
    throw new Error(`Failed to fetch published events: ${error.message}`);
  }

  const categoryIds = Array.from(
    new Set((events ?? []).map((e) => e.category_id).filter((id): id is string => Boolean(id)))
  );
  const categoryMap = new Map<string, string>();
  if (categoryIds.length > 0) {
    const { data: categories } = await admin.supabase
      .from("event_categories")
      .select("id, name")
      .in("id", categoryIds);
    for (const cat of categories ?? []) {
      categoryMap.set(cat.id, cat.name);
    }
  }

  return (events ?? []).map((ev) => ({
    ...ev,
    category_name: ev.category_id ? categoryMap.get(ev.category_id) ?? null : null,
  }));
}

export async function featureEvent(
  input: FeatureEventInput
): Promise<FeaturedEventWithEvent> {
  const admin = await requirePlatformAdmin();
  const parsed = featureEventSchema.safeParse(input);

  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    throw new Error(issue?.message ?? "Invalid featured event configuration.");
  }

  const payload = parsed.data;
  const { data: targetEvent, error: eventError } = await admin.supabase
    .from("events")
    .select("id, title, status")
    .eq("id", payload.eventId)
    .maybeSingle();

  if (eventError || !targetEvent) {
    throw new Error("Target event not found.");
  }

  if (targetEvent.status !== "published") {
    throw new Error("Only published events can be featured.");
  }

  const sanitizedImage = payload.promotionalImageUrl
    ? sanitizeNotificationImageUrl(payload.promotionalImageUrl)
    : null;

  const { data: inserted, error: insertError } = await admin.supabase
    .from("featured_events")
    .insert({
      event_id: payload.eventId,
      priority: payload.priority,
      promotional_message: payload.promotionalMessage?.trim() || null,
      promotional_image_url: sanitizedImage,
      target_audience: toJson(payload.targetAudience ?? {}),
      notification_channels: payload.notificationChannels,
      notification_mode: payload.notificationMode,
      scheduled_notification_at: payload.scheduledNotificationAt ?? null,
      start_at: new Date(payload.startAt).toISOString(),
      end_at: new Date(payload.endAt).toISOString(),
      status: payload.status,
      created_by: admin.userId,
    })
    .select("*")
    .single();

  if (insertError || !inserted) {
    throw new Error(insertError?.message ?? "Failed to create featured event.");
  }

  await recordAdminAuditLog(admin.supabase, {
    adminId: admin.userId,
    action: "featured_event.created",
    targetType: "featured_event",
    targetId: inserted.id,
    metadata: {
      event_id: payload.eventId,
      priority: payload.priority,
      notification_mode: payload.notificationMode,
      status: payload.status,
    },
  });

  const hydrated = await hydrateFeaturedEvents(admin.supabase, [inserted]);
  return hydrated[0];
}

export async function updateFeaturedEventStatus(
  featuredEventId: string,
  status: FeaturedEventStatus
): Promise<FeaturedEventWithEvent> {
  const admin = await requirePlatformAdmin();
  const { data: updated, error } = await admin.supabase
    .from("featured_events")
    .update({
      status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", featuredEventId)
    .select("*")
    .single();

  if (error || !updated) {
    throw new Error(error?.message ?? "Failed to update featured event status.");
  }

  await recordAdminAuditLog(admin.supabase, {
    adminId: admin.userId,
    action: "featured_event.status_updated",
    targetType: "featured_event",
    targetId: featuredEventId,
    metadata: { status },
  });

  const hydrated = await hydrateFeaturedEvents(admin.supabase, [updated]);
  return hydrated[0];
}

export async function removeFeaturedEvent(featuredEventId: string): Promise<void> {
  const admin = await requirePlatformAdmin();
  const { error } = await admin.supabase
    .from("featured_events")
    .delete()
    .eq("id", featuredEventId);

  if (error) {
    throw new Error(`Failed to remove featured event: ${error.message}`);
  }

  await recordAdminAuditLog(admin.supabase, {
    adminId: admin.userId,
    action: "featured_event.removed",
    targetType: "featured_event",
    targetId: featuredEventId,
  });
}

export async function getActiveFeaturedEvents(
  _placement: "home" | "discover",
  viewerContext?: PromotionViewerContext
): Promise<FeaturedEventWithEvent[]> {
  const supabase = createPublicClient();
  const nowIso = new Date().toISOString();

  const { data, error } = await supabase
    .from("featured_events")
    .select("*")
    .eq("status", "active")
    .lte("start_at", nowIso)
    .gt("end_at", nowIso)
    .order("created_at", { ascending: false })
    .limit(24);

  if (error) {
    console.error("[promotions] Failed to load active featured events:", error);
    return [];
  }

  const hydrated = await hydrateFeaturedEvents(supabase, data ?? []);
  const activeOnly = hydrated.filter(
    (item) =>
      item.event &&
      item.event.status === "published" &&
      isWithinActiveWindow(item.start_at, item.end_at) &&
      matchesFeaturedAudience(item, viewerContext)
  );

  return sortFeaturedEventsByPriority(activeOnly);
}

async function resolveFeaturedCampaignRecipients(
  client: TypedClient,
  featured: FeaturedEventWithEvent,
  adminUserId: string
): Promise<string[]> {
  const audience = featured.target_audience ?? {};
  const targetCities = Array.isArray(audience.cities)
    ? audience.cities.map((c) => c.trim().toLowerCase()).filter(Boolean)
    : [];
  const targetCategories = Array.isArray(audience.categories)
    ? audience.categories.map((c) => c.trim()).filter(Boolean)
    : [];

  const { data: profiles, error: profilesError } = await client
    .from("profiles")
    .select("id, city, state")
    .limit(2000);

  if (profilesError) {
    throw new Error(`Failed to load candidate profiles: ${profilesError.message}`);
  }

  let candidateIds = (profiles ?? [])
    .filter((profile) => {
      if (profile.id === adminUserId && featured.notification_mode === "broad_announcement") {
        return true;
      }
      if (
        featured.notification_mode === "selected_audience" &&
        targetCities.length > 0
      ) {
        const locationText = [profile.city, profile.state]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!locationText || !targetCities.some((c) => locationText.includes(c))) {
          return false;
        }
      }
      return true;
    })
    .map((p) => p.id);

  if (candidateIds.length === 0) {
    return [];
  }

  if (
    featured.notification_mode === "selected_audience" &&
    (audience.past_attendees || targetCategories.length > 0)
  ) {
    const { data: pastRows } = await client
      .from("event_participants")
      .select("user_id, event_id")
      .in("status", [...ACTIVE_PARTICIPANT_STATUSES])
      .not("user_id", "is", null)
      .limit(4000);

    let matchingEventIds: Set<string> | null = null;
    if (targetCategories.length > 0) {
      const { data: catEvents } = await client
        .from("events")
        .select("id")
        .in("category_id", targetCategories);
      matchingEventIds = new Set((catEvents ?? []).map((e) => e.id));
    }

    const pastUserIds = new Set(
      (pastRows ?? [])
        .filter(
          (row) =>
            Boolean(row.user_id) &&
            (!matchingEventIds || matchingEventIds.has(row.event_id))
        )
        .map((row) => row.user_id as string)
    );

    if (pastUserIds.size > 0) {
      candidateIds = candidateIds.filter((id) => pastUserIds.has(id));
    }
  }

  const { data: registeredRows } = await client
    .from("event_participants")
    .select("user_id")
    .eq("event_id", featured.event_id)
    .in("status", [...ACTIVE_PARTICIPANT_STATUSES])
    .not("user_id", "is", null);

  const excludedUserIds = new Set(
    (registeredRows ?? [])
      .map((row) => row.user_id)
      .filter((id): id is string => Boolean(id))
  );

  const recentCutoffIso = new Date(
    Date.now() - RECENT_EXPOSURE_WINDOW_MS
  ).toISOString();

  const { data: recentNotifications } = await client
    .from("notifications")
    .select("user_id")
    .eq("event_id", featured.event_id)
    .in("category", ["recommendations", "featured_promotion"])
    .gte("created_at", recentCutoffIso);

  for (const row of recentNotifications ?? []) {
    if (row.user_id) {
      excludedUserIds.add(row.user_id);
    }
  }

  return Array.from(new Set(candidateIds)).filter((id) => !excludedUserIds.has(id));
}

export async function dispatchFeaturedEventCampaign(
  featuredEventId: string
): Promise<FeaturedCampaignDispatchResult> {
  const admin = await requirePlatformAdmin();
  const privilegedClient = getPrivilegedClient(admin.supabase);

  const { data: row, error } = await admin.supabase
    .from("featured_events")
    .select("*")
    .eq("id", featuredEventId)
    .maybeSingle();

  if (error || !row) {
    throw new Error("Featured event not found.");
  }

  if (row.notification_mode === "platform_only") {
    return {
      featuredEventId,
      skipped: true,
      reason: "platform_only",
      eligibleRecipients: 0,
      dispatchedCount: 0,
    };
  }

  if (row.status !== "active") {
    return {
      featuredEventId,
      skipped: true,
      reason: `status_${row.status}`,
      eligibleRecipients: 0,
      dispatchedCount: 0,
    };
  }

  const hydrated = await hydrateFeaturedEvents(admin.supabase, [row]);
  const featured = hydrated[0];
  if (!featured?.event) {
    throw new Error("Associated event not found for featured promotion.");
  }

  const recipientIds = await resolveFeaturedCampaignRecipients(
    privilegedClient,
    featured,
    admin.userId
  );

  let dispatchedCount = 0;
  for (let i = 0; i < recipientIds.length; i += RECIPIENT_CHUNK_SIZE) {
    const chunk = recipientIds.slice(i, i + RECIPIENT_CHUNK_SIZE);
    const created = await dispatchVisualEventNotification({
      eventId: featured.event.id,
      eventTitle: featured.event.title,
      coverImage: featured.promotional_image_url ?? featured.event.cover_image,
      shortDescription:
        featured.promotional_message ?? featured.event.description,
      startAt: featured.event.start_at,
      city: featured.event.city,
      venueName: featured.event.venue_name,
      actionUrl: `/events/${featured.event.id}`,
      actionLabel: "Explore event",
      whyRecommended: "Featured on Attend",
      recipientUserIds: chunk,
      dedupeKeyPrefix: `featured-event-${featured.id}`,
      priority: featured.priority === "campaign_level" ? "high" : "normal",
      type: "featured_event_visual",
      category: "featured_promotion",
      presentationFormat: "featured_event",
      supabaseClient: privilegedClient,
    });
    dispatchedCount += created.length;
  }

  await recordAdminAuditLog(admin.supabase, {
    adminId: admin.userId,
    action: "featured_event.campaign_dispatched",
    targetType: "featured_event",
    targetId: featured.id,
    metadata: {
      event_id: featured.event.id,
      notification_mode: featured.notification_mode,
      eligible_recipients: recipientIds.length,
      dispatched_count: dispatchedCount,
    },
  });

  return {
    featuredEventId,
    skipped: false,
    eligibleRecipients: recipientIds.length,
    dispatchedCount,
  };
}

export async function recordFeaturedEventMetric(
  featuredEventId: string,
  metric: FeaturedEventMetric
): Promise<boolean> {
  if (!featuredEventId) return false;
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("record_featured_event_metric", {
    p_featured_event_id: featuredEventId,
    p_metric: metric,
  });

  if (error) {
    console.error("[promotions] Failed to record featured metric:", error);
    return false;
  }

  return Boolean(data);
}

function mapBannerRow(row: BannerRow): PromotionalBannerRecord {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    image_url: row.image_url,
    mobile_image_url: row.mobile_image_url,
    desktop_image_url: row.desktop_image_url,
    cta_label: row.cta_label,
    destination_url: row.destination_url,
    placement: row.placement as BannerPlacement,
    slot_type: row.slot_type,
    priority: row.priority,
    targeting_rules: normalizeObject(row.targeting_rules) as BannerTargetingRules,
    start_at: row.start_at,
    end_at: row.end_at,
    status: row.status as BannerStatus,
    impressions_count: row.impressions_count,
    clicks_count: row.clicks_count,
    created_by: row.created_by,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export async function listPromotionalBannersForAdmin(): Promise<
  PromotionalBannerRecord[]
> {
  const admin = await requirePlatformAdmin();
  const { data, error } = await admin.supabase
    .from("promotional_banners")
    .select("*")
    .order("priority", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    throw new Error(`Failed to fetch promotional banners: ${error.message}`);
  }

  return sortBannersByPriority((data ?? []).map(mapBannerRow));
}

function buildValidatedBannerWrite(input: PromotionalBannerInput) {
  const parsed = promotionalBannerSchema.safeParse(input);

  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    throw new Error(issue?.message ?? "Invalid promotional banner configuration.");
  }

  const payload = parsed.data;
  const sanitizedImage = sanitizeNotificationImageUrl(payload.imageUrl);
  if (!sanitizedImage) {
    throw new Error("Invalid banner image URL.");
  }

  return {
    title: payload.title,
    description: payload.description?.trim() || null,
    image_url: sanitizedImage,
    mobile_image_url: payload.mobileImageUrl
      ? sanitizeNotificationImageUrl(payload.mobileImageUrl)
      : null,
    desktop_image_url: payload.desktopImageUrl
      ? sanitizeNotificationImageUrl(payload.desktopImageUrl)
      : null,
    cta_label: payload.ctaLabel?.trim() || null,
    destination_url: payload.destinationUrl.trim(),
    placement: payload.placement,
    slot_type: payload.slotType,
    priority: payload.priority,
    targeting_rules: toJson(payload.targetingRules ?? {}),
    start_at: new Date(payload.startAt).toISOString(),
    end_at: new Date(payload.endAt).toISOString(),
    status: payload.status,
  };
}

export async function createPromotionalBanner(
  input: PromotionalBannerInput
): Promise<PromotionalBannerRecord> {
  const admin = await requirePlatformAdmin();
  const writeData = buildValidatedBannerWrite(input);

  const { data: inserted, error } = await admin.supabase
    .from("promotional_banners")
    .insert({
      ...writeData,
      created_by: admin.userId,
    })
    .select("*")
    .single();

  if (error || !inserted) {
    throw new Error(error?.message ?? "Failed to create promotional banner.");
  }

  await recordAdminAuditLog(admin.supabase, {
    adminId: admin.userId,
    action: "promotional_banner.created",
    targetType: "promotional_banner",
    targetId: inserted.id,
    metadata: {
      title: inserted.title,
      placement: inserted.placement,
      status: inserted.status,
      priority: inserted.priority,
    },
  });

  return mapBannerRow(inserted);
}

export async function updatePromotionalBanner(
  bannerId: string,
  input: PromotionalBannerInput
): Promise<PromotionalBannerRecord> {
  const admin = await requirePlatformAdmin();
  const writeData = buildValidatedBannerWrite(input);

  const { data: updated, error } = await admin.supabase
    .from("promotional_banners")
    .update({
      ...writeData,
      updated_at: new Date().toISOString(),
    })
    .eq("id", bannerId)
    .select("*")
    .single();

  if (error || !updated) {
    throw new Error(error?.message ?? "Failed to update promotional banner.");
  }

  await recordAdminAuditLog(admin.supabase, {
    adminId: admin.userId,
    action: "promotional_banner.updated",
    targetType: "promotional_banner",
    targetId: bannerId,
    metadata: {
      title: updated.title,
      placement: updated.placement,
      status: updated.status,
      priority: updated.priority,
    },
  });

  return mapBannerRow(updated);
}

export async function updateBannerStatus(
  bannerId: string,
  status: BannerStatus
): Promise<PromotionalBannerRecord> {
  const admin = await requirePlatformAdmin();
  const { data: updated, error } = await admin.supabase
    .from("promotional_banners")
    .update({
      status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", bannerId)
    .select("*")
    .single();

  if (error || !updated) {
    throw new Error(error?.message ?? "Failed to update banner status.");
  }

  await recordAdminAuditLog(admin.supabase, {
    adminId: admin.userId,
    action: "promotional_banner.status_updated",
    targetType: "promotional_banner",
    targetId: bannerId,
    metadata: { status },
  });

  return mapBannerRow(updated);
}

export async function getActiveBannersForPlacement(
  placement: Exclude<BannerPlacement, "both">,
  viewerContext?: PromotionViewerContext
): Promise<PromotionalBannerRecord[]> {
  const supabase = createPublicClient();
  const nowIso = new Date().toISOString();

  const { data, error } = await supabase
    .from("promotional_banners")
    .select("*")
    .eq("status", "published")
    .in("placement", [placement, "both"])
    .lte("start_at", nowIso)
    .gt("end_at", nowIso)
    .order("priority", { ascending: false })
    .limit(20);

  if (error) {
    console.error("[promotions] Failed to load active promotional banners:", error);
    return [];
  }

  const mapped = (data ?? []).map(mapBannerRow);
  const eligible = mapped.filter((banner) =>
    matchesBannerTargeting(banner, placement, viewerContext)
  );

  return sortBannersByPriority(eligible);
}

export async function recordBannerInteraction(
  bannerId: string,
  interactionType: BannerAnalyticsEventType,
  placement: BannerPlacement,
  audienceSegment?: string
): Promise<boolean> {
  if (!bannerId) return false;
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("record_banner_interaction", {
    p_banner_id: bannerId,
    p_interaction_type: interactionType,
    p_placement: placement,
    p_audience_segment: audienceSegment ?? undefined,
  });

  if (error) {
    console.error("[promotions] Failed to record banner interaction:", error);
    return false;
  }

  return Boolean(data);
}

export async function getAdminNotificationSettings(): Promise<
  AdminNotificationSettingRecord[]
> {
  const admin = await requirePlatformAdmin();
  const { data, error } = await admin.supabase
    .from("admin_notification_settings")
    .select("*")
    .order("key", { ascending: true });

  if (error) {
    throw new Error(`Failed to load admin notification settings: ${error.message}`);
  }

  return (data ?? []).map((row) => ({
    key: row.key,
    value: normalizeObject(row.value),
    updated_by: row.updated_by,
    updated_at: row.updated_at,
  }));
}

export async function updateAdminNotificationSettings(
  key: string,
  value: Record<string, unknown>
): Promise<AdminNotificationSettingRecord> {
  const admin = await requirePlatformAdmin();
  if (!key.trim()) {
    throw new Error("Setting key is required.");
  }

  const { data: updated, error } = await admin.supabase
    .from("admin_notification_settings")
    .upsert(
      {
        key: key.trim(),
        value: toJson(value),
        updated_by: admin.userId,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "key" }
    )
    .select("*")
    .single();

  if (error || !updated) {
    throw new Error(error?.message ?? "Failed to update admin settings.");
  }

  await recordAdminAuditLog(admin.supabase, {
    adminId: admin.userId,
    action: "admin_settings.updated",
    targetType: "admin_notification_settings",
    metadata: { key: updated.key, value },
  });

  return {
    key: updated.key,
    value: normalizeObject(updated.value),
    updated_by: updated.updated_by,
    updated_at: updated.updated_at,
  };
}

export async function listNotificationTemplatesForAdmin(): Promise<
  NotificationTemplateRecord[]
> {
  const admin = await requirePlatformAdmin();
  const { data, error } = await admin.supabase
    .from("notification_templates")
    .select("id, type, category, title_template, message_template, action_label, is_active, is_smart, updated_at")
    .order("category", { ascending: true })
    .order("type", { ascending: true });

  if (error) {
    throw new Error(`Failed to load notification templates: ${error.message}`);
  }

  return data ?? [];
}

export async function updateNotificationTemplateForAdmin(
  templateId: string,
  updates: {
    title_template: string;
    message_template: string;
    action_label?: string | null;
    is_active: boolean;
  }
): Promise<NotificationTemplateRecord> {
  const admin = await requirePlatformAdmin();
  const titleTemplate = updates.title_template.trim();
  const messageTemplate = updates.message_template.trim();

  if (!titleTemplate || !messageTemplate) {
    throw new Error("Template title and message are required.");
  }

  const { data: updated, error } = await admin.supabase
    .from("notification_templates")
    .update({
      title_template: titleTemplate,
      message_template: messageTemplate,
      action_label: updates.action_label?.trim() || null,
      is_active: updates.is_active,
      updated_at: new Date().toISOString(),
    })
    .eq("id", templateId)
    .select("id, type, category, title_template, message_template, action_label, is_active, is_smart, updated_at")
    .single();

  if (error || !updated) {
    throw new Error(error?.message ?? "Failed to update notification template.");
  }

  await recordAdminAuditLog(admin.supabase, {
    adminId: admin.userId,
    action: "notification_template.updated",
    targetType: "notification_template",
    targetId: templateId,
    metadata: {
      type: updated.type,
      is_active: updated.is_active,
    },
  });

  return updated;
}

export async function listAdminAuditLogs(
  limit = 25
): Promise<AdminAuditLogRecord[]> {
  const admin = await requirePlatformAdmin();
  const { data, error } = await admin.supabase
    .from("admin_audit_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(Math.min(limit, 100));

  if (error) {
    throw new Error(`Failed to fetch admin audit logs: ${error.message}`);
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    admin_id: row.admin_id,
    action: row.action,
    target_type: row.target_type,
    target_id: row.target_id,
    metadata: normalizeObject(row.metadata),
    created_at: row.created_at,
  }));
}

export async function dispatchAdminBroadcast(
  input: AdminBroadcastInput
): Promise<AdminBroadcastResult> {
  const admin = await requirePlatformAdmin();
  const parsed = adminBroadcastSchema.safeParse(input);

  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    throw new Error(issue?.message ?? "Invalid broadcast payload.");
  }

  const payload = parsed.data;
  const privilegedClient = getPrivilegedClient(admin.supabase);

  if (!payload.testPreview) {
    const { data: broadcastRuleRow } = await admin.supabase
      .from("admin_notification_settings")
      .select("value")
      .eq("key", "broadcast_rules")
      .maybeSingle();

    const rules = normalizeObject(broadcastRuleRow?.value);
    const maxDaily =
      typeof rules.max_daily_broadcasts === "number"
        ? rules.max_daily_broadcasts
        : 2;

    const oneDayAgoIso = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { count: recentCount } = await admin.supabase
      .from("admin_audit_logs")
      .select("id", { count: "exact", head: true })
      .eq("action", "admin_broadcast.dispatched")
      .gte("created_at", oneDayAgoIso);

    if ((recentCount ?? 0) >= maxDaily) {
      throw new Error(
        `Daily broadcast limit reached (${maxDaily} per 24 hours). Use test preview or try later.`
      );
    }
  }

  let recipientIds: string[] = [];
  if (payload.testPreview) {
    recipientIds = [admin.userId];
  } else {
    const targetCities = (payload.cities ?? [])
      .map((city) => city.trim().toLowerCase())
      .filter(Boolean);

    const { data: profiles, error: profilesError } = await privilegedClient
      .from("profiles")
      .select("id, city, state")
      .limit(5000);

    if (profilesError) {
      throw new Error(`Failed to resolve broadcast audience: ${profilesError.message}`);
    }

    recipientIds = (profiles ?? [])
      .filter((profile) => {
        if (targetCities.length === 0) return true;
        const loc = [profile.city, profile.state]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return Boolean(loc && targetCities.some((city) => loc.includes(city)));
      })
      .map((profile) => profile.id);
  }

  const broadcastBatchKey = `${Date.now()}`;
  let dispatchedCount = 0;
  let batchesProcessed = 0;

  for (let i = 0; i < recipientIds.length; i += RECIPIENT_CHUNK_SIZE) {
    const chunk = recipientIds.slice(i, i + RECIPIENT_CHUNK_SIZE);
    batchesProcessed += 1;

    for (const userId of chunk) {
      const created = await dispatchSmartNotification({
        userId,
        type: "system_announcement",
        category: "system",
        presentationFormat: "system_announcement",
        priority: payload.priority,
        title: payload.testPreview ? `[Preview] ${payload.title}` : payload.title,
        message: payload.message,
        actionUrl: payload.actionUrl?.trim() || "/discover",
        actionLabel: payload.actionLabel?.trim() || "Explore",
        dedupeKey: payload.testPreview
          ? `admin-broadcast-preview-${broadcastBatchKey}-${userId}`
          : `admin-broadcast-${broadcastBatchKey}-${userId}`,
        supabaseClient: privilegedClient,
        metadata: {
          broadcast_batch: broadcastBatchKey,
          test_preview: payload.testPreview,
        },
      });

      if (created) {
        dispatchedCount += 1;
      }
    }
  }

  await recordAdminAuditLog(admin.supabase, {
    adminId: admin.userId,
    action: payload.testPreview
      ? "admin_broadcast.preview_sent"
      : "admin_broadcast.dispatched",
    targetType: "broadcast",
    metadata: {
      title: payload.title,
      priority: payload.priority,
      cities: payload.cities ?? [],
      eligible_recipients: recipientIds.length,
      dispatched_count: dispatchedCount,
      batches_processed: batchesProcessed,
    },
  });

  return {
    testPreview: payload.testPreview,
    eligibleRecipients: recipientIds.length,
    dispatchedCount,
    batchesProcessed,
  };
}
