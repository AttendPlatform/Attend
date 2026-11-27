BEGIN;

CREATE OR REPLACE FUNCTION public.record_featured_event_metric(
  p_featured_event_id UUID,
  p_metric TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_updated BOOLEAN := false;
BEGIN
  IF p_featured_event_id IS NULL THEN
    RETURN false;
  END IF;

  IF p_metric NOT IN ('view', 'click', 'save', 'registration') THEN
    RAISE EXCEPTION 'Unsupported featured event metric: %', p_metric;
  END IF;

  UPDATE public.featured_events
  SET
    views_count = views_count + CASE WHEN p_metric = 'view' THEN 1 ELSE 0 END,
    clicks_count = clicks_count + CASE WHEN p_metric = 'click' THEN 1 ELSE 0 END,
    saves_count = saves_count + CASE WHEN p_metric = 'save' THEN 1 ELSE 0 END,
    registrations_count = registrations_count + CASE WHEN p_metric = 'registration' THEN 1 ELSE 0 END,
    updated_at = timezone('utc'::text, now())
  WHERE id = p_featured_event_id
    AND status = 'active'
    AND start_at <= timezone('utc'::text, now())
    AND end_at > timezone('utc'::text, now());

  v_updated := FOUND;
  RETURN v_updated;
END;
$$;

REVOKE ALL ON FUNCTION public.record_featured_event_metric(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_featured_event_metric(UUID, TEXT) TO anon, authenticated, service_role;

COMMIT;
