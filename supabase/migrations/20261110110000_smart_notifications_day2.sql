-- Attend: Smart Notification Timezone Quiet Hours, Frequency Caps & Scheduled Delivery
-- Migration: 20261110110000_smart_notifications_day2.sql

BEGIN;

-- 1. Upgrade create_notification_for_user with preference checks, deduplication, daily caps, and quiet hours
CREATE OR REPLACE FUNCTION public.create_notification_for_user(
  p_user_id UUID,
  p_type TEXT,
  p_category TEXT,
  p_title TEXT,
  p_message TEXT,
  p_action_url TEXT DEFAULT NULL,
  p_action_label TEXT DEFAULT NULL,
  p_event_id UUID DEFAULT NULL,
  p_campaign_id UUID DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb,
  p_dedupe_key TEXT DEFAULT NULL,
  p_priority TEXT DEFAULT 'normal'
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pref RECORD;
  v_existing_notif RECORD;
  v_sent_last_24h INT;
  v_tz TEXT;
  v_current_local_time TIME;
  v_start_time TIME;
  v_end_time TIME;
  v_in_quiet_hours BOOLEAN := false;
  v_current_local_date DATE;
  v_target_local_ts TIMESTAMP;
  v_scheduled_for TIMESTAMPTZ := NULL;
  v_sent_at TIMESTAMPTZ := NULL;
  v_status TEXT := 'unread';
  v_new_notif RECORD;
  v_format TEXT;
  v_image_url TEXT;
  v_image_alt TEXT;
  v_why_rec TEXT;
  v_meta JSONB;
BEGIN
  v_meta := COALESCE(p_metadata, '{}'::jsonb);
  v_format := COALESCE(v_meta->>'presentation_format', 'text');
  v_image_url := v_meta->>'image_url';
  v_image_alt := v_meta->>'image_alt';
  v_why_rec := v_meta->>'why_recommended';

  -- Step 1: Idempotent Deduplication Check
  IF p_dedupe_key IS NOT NULL AND p_dedupe_key <> '' THEN
    SELECT * INTO v_existing_notif
    FROM public.notifications
    WHERE dedupe_key = p_dedupe_key
    LIMIT 1;

    IF FOUND THEN
      RETURN row_to_json(v_existing_notif)::text;
    END IF;

    PERFORM 1
    FROM public.notification_events
    WHERE dedupe_key = p_dedupe_key
      AND event_type = 'suppressed'
    LIMIT 1;

    IF FOUND THEN
      RETURN jsonb_build_object(
        'status', 'suppressed',
        'dedupe_key', p_dedupe_key,
        'reason', 'already_suppressed'
      )::text;
    END IF;
  END IF;

  -- Step 2: User Preference Check with Transactional Bypass
  SELECT * INTO v_pref
  FROM public.notification_preferences
  WHERE user_id = p_user_id;

  IF NOT FOUND THEN
    SELECT
      p_user_id AS user_id,
      true AS event_reminders,
      true AS new_events,
      true AS trending_events,
      true AS campaign_activity,
      true AS campaign_milestones,
      true AS recommendations,
      true AS campaign_insights,
      true AS abandoned_reminders_enabled,
      true AS social_notifications_enabled,
      true AS smart_notifications,
      5 AS max_daily_notifications,
      'Africa/Lagos' AS timezone,
      false AS quiet_hours_enabled,
      NULL::TIME AS quiet_hours_start,
      NULL::TIME AS quiet_hours_end
    INTO v_pref;
  END IF;

  IF p_priority = 'urgent' OR p_type IN ('event_cancelled', 'registration_receipt') THEN
    -- Transactional bypass: always delivered in-app
    NULL;
  ELSE
    -- Category Toggle Verification
    IF (p_category = 'event_reminder' AND NOT COALESCE(v_pref.event_reminders, true))
       OR (p_category = 'new_events' AND NOT COALESCE(v_pref.new_events, true))
       OR (p_category = 'trending_events' AND NOT COALESCE(v_pref.trending_events, true))
       OR (p_category = 'campaign_activity' AND NOT COALESCE(v_pref.campaign_activity, true))
       OR (p_category = 'campaign_milestones' AND NOT COALESCE(v_pref.campaign_milestones, true))
       OR ((p_category = 'recommendations' OR p_category = 'featured_promotion') AND NOT COALESCE(v_pref.recommendations, true))
       OR ((p_category = 'campaign_insights' OR p_category = 'organizer_insight') AND NOT COALESCE(v_pref.campaign_insights, true))
       OR (p_category = 'recovery' AND NOT COALESCE(v_pref.abandoned_reminders_enabled, true))
       OR (p_category = 'social' AND NOT COALESCE(v_pref.social_notifications_enabled, true))
    THEN
      INSERT INTO public.notification_events (
        user_id, event_type, event_id, campaign_id, dedupe_key, metadata
      ) VALUES (
        p_user_id,
        'suppressed',
        p_event_id,
        p_campaign_id,
        p_dedupe_key,
        jsonb_build_object('reason', 'preference_disabled', 'category', p_category)
      );

      RETURN jsonb_build_object(
        'status', 'suppressed',
        'reason', 'preference_disabled',
        'category', p_category
      )::text;
    END IF;

    -- Step 3: Daily Frequency Cap Check (Sliding 24-Hour Window)
    IF COALESCE(v_pref.smart_notifications, true) AND p_priority IN ('low', 'normal') THEN
      SELECT COUNT(*) INTO v_sent_last_24h
      FROM public.notifications
      WHERE user_id = p_user_id
        AND priority IN ('low', 'normal')
        AND status IN ('sent', 'unread', 'read')
        AND created_at >= (now() - interval '24 hours');

      IF v_sent_last_24h >= COALESCE(v_pref.max_daily_notifications, 5) THEN
        INSERT INTO public.notification_events (
          user_id, event_type, event_id, campaign_id, dedupe_key, metadata
        ) VALUES (
          p_user_id,
          'suppressed',
          p_event_id,
          p_campaign_id,
          p_dedupe_key,
          jsonb_build_object(
            'reason', 'frequency_cap_exceeded',
            'max_daily_notifications', COALESCE(v_pref.max_daily_notifications, 5),
            'sent_last_24h', v_sent_last_24h
          )
        );

        RETURN jsonb_build_object(
          'status', 'suppressed',
          'reason', 'frequency_cap_exceeded',
          'max_daily_notifications', COALESCE(v_pref.max_daily_notifications, 5)
        )::text;
      END IF;
    END IF;
  END IF;

  -- Step 4: Timezone-Aware Quiet Hours Evaluation
  v_tz := COALESCE(v_pref.timezone, 'Africa/Lagos');

  IF COALESCE(v_pref.quiet_hours_enabled, false)
     AND v_pref.quiet_hours_start IS NOT NULL
     AND v_pref.quiet_hours_end IS NOT NULL
     AND p_priority != 'urgent'
  THEN
    BEGIN
      v_current_local_time := (now() AT TIME ZONE v_tz)::time;
      v_current_local_date := (now() AT TIME ZONE v_tz)::date;
      v_start_time := v_pref.quiet_hours_start::time;
      v_end_time := v_pref.quiet_hours_end::time;

      IF v_start_time < v_end_time THEN
        -- Same-day quiet hours (e.g. 13:00 to 15:00)
        IF v_current_local_time >= v_start_time AND v_current_local_time < v_end_time THEN
          v_in_quiet_hours := true;
          v_target_local_ts := v_current_local_date + v_end_time;
        END IF;
      ELSE
        -- Overnight quiet hours (e.g. 22:00 to 07:00)
        IF v_current_local_time >= v_start_time THEN
          v_in_quiet_hours := true;
          v_target_local_ts := (v_current_local_date + interval '1 day')::date + v_end_time;
        ELSIF v_current_local_time < v_end_time THEN
          v_in_quiet_hours := true;
          v_target_local_ts := v_current_local_date + v_end_time;
        END IF;
      END IF;

      IF v_in_quiet_hours THEN
        v_status := 'scheduled';
        v_scheduled_for := v_target_local_ts AT TIME ZONE v_tz;
      END IF;
    EXCEPTION
      WHEN OTHERS THEN
        v_in_quiet_hours := false;
    END;
  END IF;

  IF NOT v_in_quiet_hours THEN
    IF v_meta->>'scheduled_for' IS NOT NULL THEN
      v_status := 'scheduled';
      v_scheduled_for := (v_meta->>'scheduled_for')::timestamptz;
    ELSE
      v_status := 'unread';
      v_sent_at := now();
    END IF;
  END IF;

  -- Step 5: Insert Notification
  INSERT INTO public.notifications (
    user_id,
    type,
    category,
    title,
    message,
    action_url,
    action_label,
    event_id,
    campaign_id,
    metadata,
    dedupe_key,
    priority,
    status,
    presentation_format,
    image_url,
    image_alt,
    why_recommended,
    scheduled_for,
    sent_at,
    delivery_channel
  ) VALUES (
    p_user_id,
    p_type,
    p_category,
    p_title,
    p_message,
    p_action_url,
    p_action_label,
    p_event_id,
    p_campaign_id,
    v_meta,
    p_dedupe_key,
    COALESCE(p_priority, 'normal'),
    v_status,
    COALESCE(v_format, 'text'),
    v_image_url,
    v_image_alt,
    v_why_rec,
    v_scheduled_for,
    v_sent_at,
    'in_app'
  ) RETURNING * INTO v_new_notif;

  -- Record delivery or scheduling event
  INSERT INTO public.notification_events (
    user_id,
    event_type,
    event_id,
    campaign_id,
    dedupe_key,
    metadata
  ) VALUES (
    p_user_id,
    CASE WHEN v_status = 'scheduled' THEN 'scheduled' ELSE 'delivered' END,
    p_event_id,
    p_campaign_id,
    p_dedupe_key,
    jsonb_build_object(
      'notification_id', v_new_notif.id,
      'status', v_status,
      'priority', COALESCE(p_priority, 'normal'),
      'scheduled_for', v_scheduled_for
    )
  );

  RETURN row_to_json(v_new_notif)::text;
END;
$$;

-- 2. Upgrade process_smart_notification as compatible alias
CREATE OR REPLACE FUNCTION public.process_smart_notification(
  p_user_id UUID,
  p_type TEXT,
  p_category TEXT,
  p_title TEXT,
  p_message TEXT,
  p_action_url TEXT DEFAULT NULL,
  p_action_label TEXT DEFAULT NULL,
  p_event_id UUID DEFAULT NULL,
  p_campaign_id UUID DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb,
  p_dedupe_key TEXT DEFAULT NULL,
  p_priority TEXT DEFAULT 'normal'
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN public.create_notification_for_user(
    p_user_id,
    p_type,
    p_category,
    p_title,
    p_message,
    p_action_url,
    p_action_label,
    p_event_id,
    p_campaign_id,
    p_metadata,
    p_dedupe_key,
    p_priority
  );
END;
$$;

-- 3. Create promote_scheduled_notifications SECURITY DEFINER RPC
CREATE OR REPLACE FUNCTION public.promote_scheduled_notifications()
RETURNS SETOF public.notifications
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  UPDATE public.notifications
  SET
    status = 'unread',
    sent_at = now()
  WHERE
    status = 'scheduled'
    AND scheduled_for <= now()
    AND (expires_at IS NULL OR expires_at > now())
  RETURNING *;
END;
$$;

-- 4. Update get_my_notifications to only return active notifications
CREATE OR REPLACE FUNCTION public.get_my_notifications(
  p_category TEXT DEFAULT NULL,
  p_limit INT DEFAULT 20
)
RETURNS TABLE (
  id UUID,
  type TEXT,
  category TEXT,
  title TEXT,
  message TEXT,
  action_url TEXT,
  action_label TEXT,
  event_id UUID,
  campaign_id UUID,
  metadata JSONB,
  delivery_channel TEXT,
  status TEXT,
  priority TEXT,
  presentation_format TEXT,
  image_url TEXT,
  image_alt TEXT,
  why_recommended TEXT,
  read_at TIMESTAMPTZ,
  dismissed_at TIMESTAMPTZ,
  scheduled_for TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    n.id,
    n.type,
    n.category,
    n.title,
    n.message,
    n.action_url,
    n.action_label,
    n.event_id,
    n.campaign_id,
    n.metadata,
    n.delivery_channel,
    n.status,
    n.priority,
    n.presentation_format,
    n.image_url,
    n.image_alt,
    n.why_recommended,
    n.read_at,
    n.dismissed_at,
    n.scheduled_for,
    n.sent_at,
    n.created_at
  FROM public.notifications n
  WHERE n.user_id = auth.uid()
    AND n.status IN ('unread', 'read', 'sent')
    AND (
      p_category IS NULL
      OR p_category = ''
      OR p_category = 'all'
      OR n.category = p_category
    )
  ORDER BY n.created_at DESC
  LIMIT LEAST(COALESCE(p_limit, 20), 100);
END;
$$;

-- 5. Update get_unread_notification_count to count only unread and sent rows
CREATE OR REPLACE FUNCTION public.get_unread_notification_count()
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INT;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM public.notifications
  WHERE user_id = auth.uid()
    AND status IN ('unread', 'sent');

  RETURN COALESCE(v_count, 0);
END;
$$;

-- 6. Grant function permissions
GRANT EXECUTE ON FUNCTION public.create_notification_for_user TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.process_smart_notification TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.promote_scheduled_notifications TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_my_notifications TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_unread_notification_count TO authenticated, service_role;

COMMIT;
