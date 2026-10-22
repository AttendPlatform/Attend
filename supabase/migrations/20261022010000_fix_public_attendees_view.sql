-- Correct public attendee social proof view and access policies.

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
  AND ep.status IN ('attending', 'registered', 'ticketed', 'attended');

-- Remove obsolete unrestricted public SELECT policies on the base table.
DROP POLICY IF EXISTS "Participants can be publicly viewed"
  ON public.event_participants;

DROP POLICY IF EXISTS "Public can view attendee social proof for published events"
  ON public.event_participants;

-- Public visitors should use the social-proof view, not the base table.
REVOKE SELECT ON TABLE public.event_participants FROM anon;

GRANT SELECT ON TABLE public.public_event_attendees TO anon, authenticated;
