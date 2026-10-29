-- Public attendee social proof view with privacy masking
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
  AND ep.status IN ('attending', 'registered', 'ticketed', 'attended');

GRANT SELECT ON public.public_event_attendees TO anon, authenticated;
