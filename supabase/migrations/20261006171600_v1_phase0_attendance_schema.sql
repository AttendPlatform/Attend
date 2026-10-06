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

-- Prevent duplicate participation records for authenticated users
CREATE UNIQUE INDEX IF NOT EXISTS idx_event_participants_event_user_unique
  ON event_participants (event_id, user_id)
  WHERE user_id IS NOT NULL;

-- RLS policies for event_participants
ALTER TABLE event_participants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view event participants" ON event_participants;
CREATE POLICY "Public can view event participants"
  ON event_participants FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can participate in events" ON event_participants;
CREATE POLICY "Authenticated users can participate in events"
  ON event_participants FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

DROP POLICY IF EXISTS "Users can update their own event participation" ON event_participants;
CREATE POLICY "Users can update their own event participation"
  ON event_participants FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own event participation" ON event_participants;
CREATE POLICY "Users can delete their own event participation"
  ON event_participants FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
