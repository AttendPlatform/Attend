-- Attend: Smart Notification Foundation & Abandoned Action Recovery Schema
-- Migration: 20261110100000_smart_notifications_foundation.sql

BEGIN;

-- 1. Extend notifications table with visual, queue, and tracking columns
ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS image_url TEXT,
  ADD COLUMN IF NOT EXISTS image_alt TEXT,
  ADD COLUMN IF NOT EXISTS presentation_format TEXT NOT NULL DEFAULT 'text',
  ADD COLUMN IF NOT EXISTS why_recommended TEXT,
  ADD COLUMN IF NOT EXISTS dismissed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS retry_count INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS delivery_error TEXT;

DO $$ BEGIN
  ALTER TABLE public.notifications
    DROP CONSTRAINT IF EXISTS chk_notifications_presentation_format;
  ALTER TABLE public.notifications
    ADD CONSTRAINT chk_notifications_presentation_format
    CHECK (presentation_format IN (
      'text',
      'image_popup',
      'featured_event',
      'banner',
      'social',
      'reminder',
      'organizer_insight',
      'system_announcement'
    ));
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE INDEX IF NOT EXISTS idx_notifications_user_status
  ON public.notifications(user_id, status);

CREATE INDEX IF NOT EXISTS idx_notifications_scheduled
  ON public.notifications(scheduled_for)
  WHERE status = 'scheduled';

-- 2. Extend notification preferences with timezone, recovery, and frequency limits
ALTER TABLE public.notification_preferences
  ADD COLUMN IF NOT EXISTS timezone TEXT NOT NULL DEFAULT 'Africa/Lagos',
  ADD COLUMN IF NOT EXISTS abandoned_reminders_enabled BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS social_notifications_enabled BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS max_daily_notifications INT NOT NULL DEFAULT 5;

-- 3. Ensure notification templates table exists and seed canonical templates
CREATE TABLE IF NOT EXISTS public.notification_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL,
  category TEXT NOT NULL,
  title_template TEXT NOT NULL,
  message_template TEXT NOT NULL,
  action_label TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_smart BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_notification_templates_type
  ON public.notification_templates(type);

INSERT INTO public.notification_templates (
  type,
  category,
  title_template,
  message_template,
  action_label,
  is_active,
  is_smart
) VALUES
  ('event_reminder_24h', 'event_reminder', 'Upcoming: {{event_title}} tomorrow', '{{event_title}} starts in 24 hours. Check location and details.', 'View details', true, true),
  ('event_reminder_2h', 'event_reminder', 'Starting soon: {{event_title}}', '{{event_title}} begins in 2 hours at {{venue_name}}.', 'View event', true, true),
  ('event_update', 'event_lifecycle', 'Update: {{event_title}}', 'Schedule or location details for {{event_title}} have been updated.', 'View updates', true, true),
  ('event_cancelled', 'event_lifecycle', 'Cancelled: {{event_title}}', '{{event_title}} has been cancelled by the organizer.', 'View notice', true, false),
  ('registration_receipt', 'event_receipt', 'Registration confirmed: {{event_title}}', 'Your spot is reserved for {{event_title}}.', 'View event', true, false),
  ('campaign_created', 'campaign_activity', 'New campaign for {{event_title}}', 'A participant created a new promotional campaign under your event.', 'View campaign', true, true),
  ('campaign_milestone', 'campaign_milestones', 'Campaign reached {{milestone}} generations', 'Your campaign {{campaign_title}} has reached {{milestone}} generations.', 'View analytics', true, true),
  ('abandoned_event_draft', 'recovery', 'Your event draft is saved', 'You started creating an event but have not finished. Pick up where you left off.', 'Continue editing', true, true),
  ('abandoned_campaign_draft', 'recovery', 'Your campaign draft is saved', 'You have an unpublished campaign draft. Complete it whenever you are ready.', 'Continue campaign', true, true),
  ('abandoned_registration', 'recovery', 'Your registration is not complete', 'You started registering for {{event_title}}. Continue where you left off.', 'Complete registration', true, true),
  ('featured_event_visual', 'featured_promotion', 'Featured: {{event_title}}', '{{event_title}} has been selected as a featured event on Attend.', 'Explore event', true, true),
  ('friend_attending', 'social', 'Friends attending {{event_title}}', 'People in your network are attending {{event_title}}.', 'See who is going', true, true)
ON CONFLICT (type) DO UPDATE SET
  category = EXCLUDED.category,
  title_template = EXCLUDED.title_template,
  message_template = EXCLUDED.message_template,
  action_label = EXCLUDED.action_label,
  is_active = EXCLUDED.is_active,
  is_smart = EXCLUDED.is_smart,
  updated_at = timezone('utc'::text, now());

COMMIT;
