export type FeaturedEventPriority =
  | "standard"
  | "high_priority"
  | "campaign_level";

export type FeaturedEventNotificationMode =
  | "platform_only"
  | "selected_audience"
  | "broad_announcement"
  | "scheduled_campaign";

export type FeaturedEventStatus =
  | "draft"
  | "active"
  | "paused"
  | "expired"
  | "archived";

export interface FeaturedEventTargetAudience {
  cities?: string[];
  categories?: string[];
  interests?: string[];
  past_attendees?: boolean;
  saved_similar?: boolean;
  [key: string]: unknown;
}

export interface FeaturedEventRecord {
  id: string;
  event_id: string;
  priority: FeaturedEventPriority;
  promotional_message: string | null;
  promotional_image_url: string | null;
  target_audience: FeaturedEventTargetAudience;
  notification_channels: string[];
  notification_mode: FeaturedEventNotificationMode;
  scheduled_notification_at: string | null;
  start_at: string;
  end_at: string;
  status: FeaturedEventStatus;
  views_count: number;
  clicks_count: number;
  saves_count: number;
  registrations_count: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export type BannerPlacement = "home" | "discover" | "both";

export type BannerStatus = "draft" | "published" | "paused" | "archived";

export interface BannerTargetingRules {
  cities?: string[];
  categories?: string[];
  authenticated_only?: boolean;
  [key: string]: unknown;
}

export interface PromotionalBannerRecord {
  id: string;
  title: string;
  description: string | null;
  image_url: string;
  mobile_image_url: string | null;
  desktop_image_url: string | null;
  cta_label: string | null;
  destination_url: string;
  placement: BannerPlacement;
  slot_type: string;
  priority: number;
  targeting_rules: BannerTargetingRules;
  start_at: string;
  end_at: string;
  status: BannerStatus;
  impressions_count: number;
  clicks_count: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export type BannerAnalyticsEventType = "impression" | "click";

export interface BannerAnalyticsRecord {
  id: string;
  banner_id: string;
  user_id: string | null;
  event_type: BannerAnalyticsEventType;
  placement: BannerPlacement;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface AdminAuditLogRecord {
  id: string;
  admin_id: string;
  action: string;
  target_type: string;
  target_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface AdminNotificationSettingRecord {
  key: string;
  value: Record<string, unknown>;
  updated_by: string | null;
  updated_at: string;
}

export type FeaturedEventMetric = "view" | "click" | "save" | "registration";

export interface PromotionViewerContext {
  userId?: string | null;
  city?: string | null;
  categoryIds?: string[];
  isAuthenticated?: boolean;
}

export interface FeaturedEventSummary {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  cover_image: string | null;
  start_at: string;
  end_at: string | null;
  city: string | null;
  state: string | null;
  venue_name: string | null;
  is_online: boolean | null;
  category_id: string | null;
  participant_count: number;
  status: string;
  category_name: string | null;
}

export interface FeaturedEventWithEvent extends FeaturedEventRecord {
  event: FeaturedEventSummary | null;
}

export interface FeatureEventInput {
  eventId: string;
  priority?: FeaturedEventPriority;
  promotionalMessage?: string | null;
  promotionalImageUrl?: string | null;
  targetAudience?: FeaturedEventTargetAudience;
  notificationChannels?: string[];
  notificationMode?: FeaturedEventNotificationMode;
  scheduledNotificationAt?: string | null;
  startAt: string;
  endAt: string;
  status?: FeaturedEventStatus;
}

export interface PromotionalBannerInput {
  title: string;
  description?: string | null;
  imageUrl: string;
  mobileImageUrl?: string | null;
  desktopImageUrl?: string | null;
  ctaLabel?: string | null;
  destinationUrl: string;
  placement: BannerPlacement;
  slotType?: string;
  priority?: number;
  targetingRules?: BannerTargetingRules;
  startAt: string;
  endAt: string;
  status?: BannerStatus;
}

export interface FeaturedCampaignDispatchResult {
  featuredEventId: string;
  skipped: boolean;
  reason?: string;
  eligibleRecipients: number;
  dispatchedCount: number;
}

export interface AdminBroadcastInput {
  title: string;
  message: string;
  actionUrl?: string | null;
  actionLabel?: string | null;
  priority?: "normal" | "high" | "urgent";
  cities?: string[];
  testPreview?: boolean;
  confirmBroadcast?: boolean;
}

export interface AdminBroadcastResult {
  testPreview: boolean;
  eligibleRecipients: number;
  dispatchedCount: number;
  batchesProcessed: number;
}

export interface NotificationTemplateRecord {
  id: string;
  type: string;
  category: string;
  title_template: string;
  message_template: string;
  action_label: string | null;
  is_active: boolean;
  is_smart: boolean;
  updated_at: string;
}
