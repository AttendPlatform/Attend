BEGIN;

CREATE OR REPLACE FUNCTION public.record_banner_interaction(
  p_banner_id UUID,
  p_interaction_type TEXT,
  p_placement TEXT,
  p_audience_segment TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_banner_active BOOLEAN := false;
  v_metadata JSONB := '{}'::jsonb;
BEGIN
  IF p_banner_id IS NULL THEN
    RETURN false;
  END IF;

  IF p_interaction_type NOT IN ('impression', 'click') THEN
    RAISE EXCEPTION 'Unsupported banner interaction type: %', p_interaction_type;
  END IF;

  IF p_placement NOT IN ('home', 'discover', 'both') THEN
    RAISE EXCEPTION 'Unsupported banner placement: %', p_placement;
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM public.promotional_banners pb
    WHERE pb.id = p_banner_id
      AND pb.status = 'published'
      AND pb.start_at <= timezone('utc'::text, now())
      AND pb.end_at > timezone('utc'::text, now())
  )
  INTO v_banner_active;

  IF NOT v_banner_active THEN
    RETURN false;
  END IF;

  IF p_audience_segment IS NOT NULL AND btrim(p_audience_segment) <> '' THEN
    v_metadata := jsonb_build_object('audience_segment', btrim(p_audience_segment));
  END IF;

  INSERT INTO public.banner_analytics (
    banner_id,
    user_id,
    event_type,
    placement,
    metadata
  )
  VALUES (
    p_banner_id,
    auth.uid(),
    p_interaction_type,
    p_placement,
    v_metadata
  );

  UPDATE public.promotional_banners
  SET
    impressions_count = impressions_count + CASE WHEN p_interaction_type = 'impression' THEN 1 ELSE 0 END,
    clicks_count = clicks_count + CASE WHEN p_interaction_type = 'click' THEN 1 ELSE 0 END,
    updated_at = timezone('utc'::text, now())
  WHERE id = p_banner_id;

  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.record_banner_interaction(UUID, TEXT, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_banner_interaction(UUID, TEXT, TEXT, TEXT) TO anon, authenticated, service_role;

COMMIT;
