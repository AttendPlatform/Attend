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

COMMIT;
