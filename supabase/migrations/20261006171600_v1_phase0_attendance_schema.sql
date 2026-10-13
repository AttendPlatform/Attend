-- Participation type and attendance status enums
DO $$ BEGIN
  CREATE TYPE event_participation_type AS ENUM ('attendee', 'registrant', 'ticket_holder');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE event_attendance_status AS ENUM ('attending', 'registered', 'ticketed', 'cancelled', 'attended');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Extend event_participants with typed relationships, status, and registration data
ALTER TABLE event_participants
  ADD COLUMN IF NOT EXISTS participation_type event_participation_type NOT NULL DEFAULT 'attendee',
  ADD COLUMN IF NOT EXISTS status event_attendance_status NOT NULL DEFAULT 'attending',
  ADD COLUMN IF NOT EXISTS registration_data JSONB NOT NULL DEFAULT '{}'::jsonb;

-- Resolve duplicate participation records before creating unique index
DELETE FROM event_participants a
USING event_participants b
WHERE a.id < b.id
  AND a.event_id = b.event_id
  AND a.user_id = b.user_id
  AND a.user_id IS NOT NULL;

-- Prevent duplicate participation records for authenticated users
CREATE UNIQUE INDEX IF NOT EXISTS idx_event_participants_event_user_unique
  ON event_participants (event_id, user_id)
  WHERE user_id IS NOT NULL;

-- RLS policies for event_participants
ALTER TABLE event_participants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view event participants" ON event_participants;
DROP POLICY IF EXISTS "Public can view attendee social proof for published events" ON event_participants;
CREATE POLICY "Public can view attendee social proof for published events"
  ON event_participants FOR SELECT
  USING (
    status IN ('attending', 'registered', 'ticketed', 'attended')
    AND (
      registration_data = '{}'::jsonb
      OR auth.uid() = user_id
      OR EXISTS (
        SELECT 1 FROM events
        WHERE events.id = event_participants.event_id
        AND events.creator_id = auth.uid()
      )
      OR EXISTS (
        SELECT 1 FROM event_organizers
        WHERE event_organizers.event_id = event_participants.event_id
        AND event_organizers.user_id = auth.uid()
      )
    )
    AND EXISTS (
      SELECT 1 FROM events
      WHERE events.id = event_participants.event_id
      AND events.status = 'published'
    )
  );

DROP POLICY IF EXISTS "Authenticated users can participate in events" ON event_participants;
CREATE POLICY "Authenticated users can participate in events"
  ON event_participants FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Guests can participate in free published events" ON event_participants;
CREATE POLICY "Guests can participate in free published events"
  ON event_participants FOR INSERT
  TO anon
  WITH CHECK (
    user_id IS NULL
    AND name IS NOT NULL
    AND length(trim(name)) > 0
    AND EXISTS (
      SELECT 1 FROM events
      WHERE events.id = event_participants.event_id
      AND events.status = 'published'
      AND events.participation_model = 'free'
    )
  );

DROP POLICY IF EXISTS "Users can update their own event participation" ON event_participants;
DROP POLICY IF EXISTS "Users and organizers can update event participation" ON event_participants;
CREATE POLICY "Users and organizers can update event participation"
  ON event_participants FOR UPDATE
  TO authenticated
  USING (
    (auth.uid() = user_id AND user_id IS NOT NULL)
    OR EXISTS (
      SELECT 1 FROM events
      WHERE events.id = event_participants.event_id
      AND events.creator_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM event_organizers
      WHERE event_organizers.event_id = event_participants.event_id
      AND event_organizers.user_id = auth.uid()
    )
  )
  WITH CHECK (
    (auth.uid() = user_id AND user_id IS NOT NULL)
    OR EXISTS (
      SELECT 1 FROM events
      WHERE events.id = event_participants.event_id
      AND events.creator_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM event_organizers
      WHERE event_organizers.event_id = event_participants.event_id
      AND event_organizers.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can delete their own event participation" ON event_participants;
DROP POLICY IF EXISTS "Users and organizers can delete event participation" ON event_participants;
CREATE POLICY "Users and organizers can delete event participation"
  ON event_participants FOR DELETE
  TO authenticated
  USING (
    (auth.uid() = user_id AND user_id IS NOT NULL)
    OR EXISTS (
      SELECT 1 FROM events
      WHERE events.id = event_participants.event_id
      AND events.creator_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM event_organizers
      WHERE event_organizers.event_id = event_participants.event_id
      AND event_organizers.user_id = auth.uid()
    )
  );
