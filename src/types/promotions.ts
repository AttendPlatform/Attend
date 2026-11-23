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
