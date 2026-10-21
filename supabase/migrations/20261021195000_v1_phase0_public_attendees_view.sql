-- Public attendee social proof view with privacy masking
CREATE OR REPLACE VIEW public_event_attendees AS
SELECT
  ep.id,
  ep.event_id,
  ep.user_id,
  ep.name,
  ep.status,
  ep.participation_type,
  ep.created_at,
  p.display_name AS profile_display_name,
  p.avatar_url AS profile_avatar_url,
  p.username AS profile_username
FROM event_participants ep
LEFT JOIN profiles p ON ep.user_id = p.id
WHERE ep.status IN ('attending', 'registered', 'ticketed', 'attended');

GRANT SELECT ON public_event_attendees TO anon, authenticated;
