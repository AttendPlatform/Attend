-- Attend: attendee privacy reconciliation
-- Safe to rerun. Keeps public attendee social proof separate
-- from private registration data.

-- Remove legacy policies that expose the base table publicly.
DROP POLICY IF EXISTS "Participants can be publicly viewed"
  ON public.event_participants;

DROP POLICY IF EXISTS "Public can view event participants"
  ON public.event_participants;

DROP POLICY IF EXISTS "Public can view attendee social proof for published events"
  ON public.event_participants;

-- Allow authenticated users to read their own participation records
-- and records for events they organize.
DROP POLICY IF EXISTS "Users and event organizers can view participation records"
  ON public.event_participants;

CREATE POLICY "Users and event organizers can view participation records"
  ON public.event_participants
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM public.events e
      WHERE e.id = event_participants.event_id
        AND e.creator_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1
      FROM public.event_organizers eo
      WHERE eo.event_id = event_participants.event_id
        AND eo.user_id = auth.uid()
    )
  );

-- The public view exposes attendee identity and attendance status only.
DROP VIEW IF EXISTS public.public_event_attendees CASCADE;
CREATE OR REPLACE VIEW public.public_event_attendees AS
SELECT
  ep.id,
  ep.event_id,
  ep.user_id,
  ep.name,
  ep.participation_type,
  ep.status,
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

-- Public visitors can query the safe view, not private registration data.
REVOKE SELECT ON TABLE public.event_participants FROM anon, authenticated;

GRANT SELECT (
  id,
  event_id,
  user_id,
  name,
  created_at,
  participation_type,
  status,
  registration_data
) ON TABLE public.event_participants TO authenticated;

GRANT SELECT ON TABLE public.public_event_attendees TO anon, authenticated;
