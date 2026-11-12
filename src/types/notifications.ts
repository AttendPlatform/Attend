export type NotificationStatus =
  | "unread"
  | "read"
  | "scheduled"
  | "sent"
  | "suppressed"
  | "expired"
  | "dismissed";

export type NotificationPriority = "low" | "normal" | "high" | "urgent";

export type NotificationPresentationFormat =
  | "text"
  | "image_popup"
  | "featured_event"
  | "banner"
  | "social"
  | "reminder"
  | "organizer_insight"
  | "system_announcement";

export type NotificationCategory =
  | "event_reminder"
  | "event_lifecycle"
  | "event_receipt"
  | "new_events"
  | "trending_events"
  | "recommendations"
  | "campaign_activity"
  | "campaign_milestones"
  | "campaign_insights"
  | "recovery"
  | "featured_promotion"
  | "social"
  | "system"
  | (string & {});

export interface Notification {
  id: string;
  user_id?: string;
  type: string | null;
  category: string | null;
  title: string;
  message: string | null;
  action_url: string | null;
  action_label: string | null;
  event_id: string | null;
  campaign_id: string | null;
  metadata: Record<string, unknown>;
  delivery_channel: string | null;
  status: NotificationStatus;
  priority: NotificationPriority;
  presentation_format?: NotificationPresentationFormat;
  image_url?: string | null;
  image_alt?: string | null;
  why_recommended?: string | null;
  read_at: string | null;
  dismissed_at?: string | null;
  scheduled_for?: string | null;
  sent_at?: string | null;
  created_at: string;
}

export interface SmartNotificationInput {
  userId: string;
  type: string;
  category: string;
  title: string;
  message: string;
  actionUrl?: string | null;
  actionLabel?: string | null;
  eventId?: string | null;
  campaignId?: string | null;
  presentationFormat?: NotificationPresentationFormat;
  imageUrl?: string | null;
  imageAlt?: string | null;
  whyRecommended?: string | null;
  metadata?: Record<string, unknown>;
  dedupeKey?: string | null;
  priority?: NotificationPriority;
  scheduledFor?: string | null;
}

export interface VisualNotificationPayload {
  eventId: string;
  eventTitle: string;
  coverImage?: string | null;
  shortDescription?: string | null;
  startAt?: string | null;
  city?: string | null;
  venueName?: string | null;
  actionUrl: string;
  actionLabel?: string;
  whyRecommended?: string;
  recipientUserIds: string[];
  dedupeKeyPrefix: string;
  priority?: NotificationPriority;
}

export type AbandonedActionType =
  | "event_draft"
  | "campaign_draft"
  | "incomplete_registration"
  | "incomplete_profile"
  | "unfinished_event_edit";

export type AbandonedActionStatus =
  | "active"
  | "recovered"
  | "completed"
  | "dismissed"
  | "suppressed";

export interface AbandonedActionRecord {
  id: string;
  user_id: string;
  action_type: AbandonedActionType;
  event_id: string | null;
  campaign_id: string | null;
  draft_title: string | null;
  draft_payload: Record<string, unknown>;
  resume_url: string;
  last_progressed_at: string;
  reminder_stage: number;
  last_reminded_at: string | null;
  recovered_at: string | null;
  status: AbandonedActionStatus;
  created_at: string;
  updated_at: string;
}

export interface NotificationPreferences {
  user_id?: string;
  event_reminders: boolean;
  new_events: boolean;
  trending_events: boolean;
  campaign_activity: boolean;
  campaign_milestones: boolean;
  recommendations: boolean;
  campaign_insights: boolean;
  abandoned_reminders_enabled: boolean;
  social_notifications_enabled: boolean;
  push_enabled: boolean;
  email_enabled: boolean;
  smart_notifications: boolean;
  max_daily_notifications: number;
  quiet_hours_enabled: boolean;
  quiet_hours_start: string | null;
  quiet_hours_end: string | null;
  timezone: string;
  created_at?: string;
  updated_at?: string;
}

export interface RecipientEligibilityContext {
  userId: string;
  eventId?: string | null;
  campaignId?: string | null;
  roleRequired?:
    | "attendee"
    | "registrant"
    | "ticket_holder"
    | "organizer"
    | "campaign_creator";
}

