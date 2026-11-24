-- Attend: Platform-Admin Auth, Promotions, Banners, and Social Discovery Schema
-- Migration: 20261117100000_promotions_and_social_discovery.sql

BEGIN;

-- 1. Platform-admin authorization on profiles and helper function
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_platform_admin BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS attendance_visibility TEXT NOT NULL DEFAULT 'public',
  ADD COLUMN IF NOT EXISTS allow_social_notifications BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS allow_social_recommendations BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS allow_contact_discovery BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS contact_discovery_consented_at TIMESTAMPTZ;

DO $$ BEGIN
  ALTER TABLE public.profiles
    DROP CONSTRAINT IF EXISTS chk_profiles_attendance_visibility;
  ALTER TABLE public.profiles
    ADD CONSTRAINT chk_profiles_attendance_visibility
    CHECK (attendance_visibility IN ('public', 'connections', 'private'));
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE OR REPLACE FUNCTION public.is_platform_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (
      SELECT p.is_platform_admin
      FROM public.profiles p
      WHERE p.id = auth.uid()
      LIMIT 1
    ),
    false
  );
$$;

REVOKE ALL ON FUNCTION public.is_platform_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_platform_admin() TO authenticated;

-- 2. Admin audit logs and notification trigger settings
CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id UUID,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_admin_created
  ON public.admin_audit_logs(admin_id, created_at DESC);

ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Platform admins can view audit logs" ON public.admin_audit_logs;
CREATE POLICY "Platform admins can view audit logs"
  ON public.admin_audit_logs
  FOR SELECT
  TO authenticated
  USING (public.is_platform_admin());

DROP POLICY IF EXISTS "Platform admins can insert audit logs" ON public.admin_audit_logs;
CREATE POLICY "Platform admins can insert audit logs"
  ON public.admin_audit_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_platform_admin() AND admin_id = (SELECT auth.uid()));

CREATE TABLE IF NOT EXISTS public.admin_notification_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.admin_notification_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Platform admins can manage notification settings" ON public.admin_notification_settings;
CREATE POLICY "Platform admins can manage notification settings"
  ON public.admin_notification_settings
  FOR ALL
  TO authenticated
  USING (public.is_platform_admin())
  WITH CHECK (public.is_platform_admin());

INSERT INTO public.admin_notification_settings (key, value)
VALUES
  (
    'social_triggers',
    '{"enabled": true, "friend_attending_enabled": true, "min_mutual_threshold": 1}'::jsonb
  ),
  (
    'abandoned_action_delays',
    '{"enabled": true, "stage_1_hours": 24, "stage_2_hours": 72, "max_reminders": 2}'::jsonb
  ),
  (
    'broadcast_rules',
    '{"require_audit_log": true, "max_daily_broadcasts": 2, "respect_quiet_hours": true}'::jsonb
  )
ON CONFLICT (key) DO NOTHING;

-- 3. Featured events table
CREATE TABLE IF NOT EXISTS public.featured_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  priority TEXT NOT NULL DEFAULT 'standard' CHECK (priority IN ('standard', 'high_priority', 'campaign_level')),
  promotional_message TEXT,
  promotional_image_url TEXT,
  target_audience JSONB NOT NULL DEFAULT '{}'::jsonb,
  notification_channels TEXT[] NOT NULL DEFAULT ARRAY['in_app', 'push'],
  notification_mode TEXT NOT NULL DEFAULT 'platform_only' CHECK (
    notification_mode IN ('platform_only', 'selected_audience', 'broad_announcement', 'scheduled_campaign')
  ),
  scheduled_notification_at TIMESTAMPTZ,
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('draft', 'active', 'paused', 'expired', 'archived')),
  views_count INT NOT NULL DEFAULT 0,
  clicks_count INT NOT NULL DEFAULT 0,
  saves_count INT NOT NULL DEFAULT 0,
  registrations_count INT NOT NULL DEFAULT 0,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT chk_featured_events_window CHECK (end_at > start_at)
);

CREATE INDEX IF NOT EXISTS idx_featured_events_active_window
  ON public.featured_events(status, start_at, end_at);

CREATE INDEX IF NOT EXISTS idx_featured_events_event_id
  ON public.featured_events(event_id);

ALTER TABLE public.featured_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view active featured events" ON public.featured_events;
CREATE POLICY "Public can view active featured events"
  ON public.featured_events
  FOR SELECT
  TO anon, authenticated
  USING (
    status = 'active'
    AND start_at <= timezone('utc'::text, now())
    AND end_at > timezone('utc'::text, now())
  );

DROP POLICY IF EXISTS "Platform admins can manage featured events" ON public.featured_events;
CREATE POLICY "Platform admins can manage featured events"
  ON public.featured_events
  FOR ALL
  TO authenticated
  USING (public.is_platform_admin())
  WITH CHECK (public.is_platform_admin());

-- 4. Promotional banners and decoupled banner analytics
CREATE TABLE IF NOT EXISTS public.promotional_banners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT NOT NULL,
  mobile_image_url TEXT,
  desktop_image_url TEXT,
  cta_label TEXT,
  destination_url TEXT NOT NULL,
  placement TEXT NOT NULL DEFAULT 'both' CHECK (placement IN ('home', 'discover', 'both')),
  slot_type TEXT NOT NULL DEFAULT 'hero',
  priority INT NOT NULL DEFAULT 1,
  targeting_rules JSONB NOT NULL DEFAULT '{}'::jsonb,
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'paused', 'archived')),
  impressions_count INT NOT NULL DEFAULT 0,
  clicks_count INT NOT NULL DEFAULT 0,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT chk_promotional_banners_window CHECK (end_at > start_at)
);

CREATE INDEX IF NOT EXISTS idx_promotional_banners_active
  ON public.promotional_banners(status, placement, start_at, end_at);

ALTER TABLE public.promotional_banners ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view published active banners" ON public.promotional_banners;
CREATE POLICY "Public can view published active banners"
  ON public.promotional_banners
  FOR SELECT
  TO anon, authenticated
  USING (
    status = 'published'
    AND start_at <= timezone('utc'::text, now())
    AND end_at > timezone('utc'::text, now())
  );

DROP POLICY IF EXISTS "Platform admins can manage promotional banners" ON public.promotional_banners;
CREATE POLICY "Platform admins can manage promotional banners"
  ON public.promotional_banners
  FOR ALL
  TO authenticated
  USING (public.is_platform_admin())
  WITH CHECK (public.is_platform_admin());

CREATE TABLE IF NOT EXISTS public.banner_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  banner_id UUID NOT NULL REFERENCES public.promotional_banners(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('impression', 'click')),
  placement TEXT NOT NULL CHECK (placement IN ('home', 'discover', 'both')),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_banner_analytics_banner_event
  ON public.banner_analytics(banner_id, event_type, created_at DESC);

ALTER TABLE public.banner_analytics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can record analytics for published active banners" ON public.banner_analytics;
CREATE POLICY "Anyone can record analytics for published active banners"
  ON public.banner_analytics
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.promotional_banners pb
      WHERE pb.id = banner_id
        AND pb.status = 'published'
        AND pb.start_at <= timezone('utc'::text, now())
        AND pb.end_at > timezone('utc'::text, now())
    )
    AND (user_id IS NULL OR user_id = (SELECT auth.uid()))
  );

DROP POLICY IF EXISTS "Platform admins can view banner analytics" ON public.banner_analytics;
CREATE POLICY "Platform admins can view banner analytics"
  ON public.banner_analytics
  FOR SELECT
  TO authenticated
  USING (public.is_platform_admin());

-- 5. Social discovery identifiers and connection graph (provisioned for Week 3)
CREATE TABLE IF NOT EXISTS public.user_contact_identifiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  identifier_type TEXT NOT NULL CHECK (identifier_type IN ('phone', 'email')),
  identifier_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT uq_user_contact_identifier UNIQUE (user_id, identifier_type, identifier_hash)
);

CREATE INDEX IF NOT EXISTS idx_user_contact_identifiers_hash
  ON public.user_contact_identifiers(identifier_type, identifier_hash);

ALTER TABLE public.user_contact_identifiers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own contact identifiers" ON public.user_contact_identifiers;
CREATE POLICY "Users can manage own contact identifiers"
  ON public.user_contact_identifiers
  FOR ALL
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE TABLE IF NOT EXISTS public.user_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  connected_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  source TEXT NOT NULL DEFAULT 'contact_match' CHECK (source IN ('contact_match', 'mutual_event', 'manual')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT uq_user_connection UNIQUE (user_id, connected_user_id),
  CONSTRAINT chk_user_connection_not_self CHECK (user_id <> connected_user_id)
);

CREATE INDEX IF NOT EXISTS idx_user_connections_user
  ON public.user_connections(user_id, connected_user_id);

ALTER TABLE public.user_connections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own connections" ON public.user_connections;
CREATE POLICY "Users can manage own connections"
  ON public.user_connections
  FOR ALL
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

-- 6. Update public_event_attendees view to enforce attendance_visibility = 'public'
DROP VIEW IF EXISTS public.public_event_attendees CASCADE;
CREATE OR REPLACE VIEW public.public_event_attendees AS
SELECT
  ep.id,
  ep.event_id,
  ep.user_id,
  ep.name,
  ep.status,
  ep.participation_type,
  ep.created_at,
  p.id AS profile_id,
  p.display_name AS profile_display_name,
  p.avatar_url AS profile_avatar_url,
  p.username AS profile_username
FROM public.event_participants ep
JOIN public.events e ON e.id = ep.event_id
LEFT JOIN public.profiles p ON p.id = ep.user_id
WHERE e.status = 'published'
  AND ep.status IN ('attending', 'registered', 'ticketed', 'attended')
  AND COALESCE(p.attendance_visibility, 'public') = 'public';

GRANT SELECT ON public.public_event_attendees TO anon, authenticated;

COMMIT;
