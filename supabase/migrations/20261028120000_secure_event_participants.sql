-- Secure event participants base table and enhance public attendee view

BEGIN;

-- 1. Remove obsolete unrestricted public SELECT policies on event_participants.
DROP POLICY IF EXISTS "Participants can be publicly viewed"
  ON public.event_participants;

DROP POLICY IF EXISTS "Public can view attendee social proof for published events"
  ON public.event_participants;

DROP POLICY IF EXISTS "Public can view event participants"
  ON public.event_participants;

DROP POLICY IF EXISTS "Anyone can join published events"
  ON public.event_participants;

-- 2. Revoke public/anon table-level privileges on event_participants.
REVOKE ALL PRIVILEGES
  ON TABLE public.event_participants
  FROM PUBLIC, anon;

-- 3. Grant required operations on event_participants to authenticated and anon.
GRANT SELECT, INSERT, UPDATE, DELETE
  ON TABLE public.event_participants
  TO authenticated;

GRANT INSERT
  ON TABLE public.event_participants
  TO anon;

-- 4. Authenticated users can view their own records and organizers can view all event records.
DROP POLICY IF EXISTS "Users and event organizers can view participation records"
  ON public.event_participants;

CREATE POLICY "Users and event organizers can view participation records"
  ON public.event_participants
  FOR SELECT
  TO authenticated
  USING (
    user_id = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1
      FROM public.events e
      WHERE e.id = event_participants.event_id
        AND e.creator_id = (SELECT auth.uid())
    )
    OR EXISTS (
      SELECT 1
      FROM public.event_organizers eo
      WHERE eo.event_id = event_participants.event_id
        AND eo.user_id = (SELECT auth.uid())
    )
  );

-- 5. Restrict anonymous inserts to guest participation in free published events.
DROP POLICY IF EXISTS "Guests can participate in free published events"
  ON public.event_participants;

CREATE POLICY "Guests can participate in free published events"
  ON public.event_participants
  FOR INSERT
  TO anon
  WITH CHECK (
    user_id IS NULL
    AND name IS NOT NULL
    AND length(trim(name)) > 0
    AND status IN ('attending', 'registered')
    AND participation_type IN ('attendee', 'registrant')
    AND EXISTS (
      SELECT 1
      FROM public.events e
      WHERE e.id = event_participants.event_id
        AND e.status = 'published'
        AND e.participation_model = 'free'
    )
  );

-- 6. Restrict authenticated inserts to the signed-in user joining published events.
DROP POLICY IF EXISTS "Authenticated users can participate in events"
  ON public.event_participants;

CREATE POLICY "Authenticated users can participate in events"
  ON public.event_participants
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = (SELECT auth.uid())
    AND EXISTS (
      SELECT 1
      FROM public.events e
      WHERE e.id = event_participants.event_id
        AND e.status = 'published'
    )
  );

-- 7. Update public_event_attendees view to enforce published events and avoid leaking draft/cancelled event social proof.
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
  p.display_name AS profile_display_name,
  p.avatar_url AS profile_avatar_url,
  p.username AS profile_username
FROM public.event_participants ep
JOIN public.events e ON e.id = ep.event_id
LEFT JOIN public.profiles p ON p.id = ep.user_id
WHERE e.status = 'published'
  AND ep.status IN ('attending', 'registered', 'ticketed', 'attended');

-- 8. Restrict view privileges and grant public read access.
REVOKE ALL PRIVILEGES
  ON TABLE public.public_event_attendees
  FROM PUBLIC;

GRANT SELECT
  ON TABLE public.public_event_attendees
  TO anon, authenticated;

COMMIT;
