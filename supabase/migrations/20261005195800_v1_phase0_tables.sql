-- Update event_status enum with missing lifecycle states
ALTER TYPE event_status ADD VALUE IF NOT EXISTS 'cancelled';
ALTER TYPE event_status ADD VALUE IF NOT EXISTS 'completed';

-- Participation model enum for events
DO $$ BEGIN
  CREATE TYPE participation_model AS ENUM ('free', 'registration', 'paid', 'external');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Extend events table with participation configuration and permissions
ALTER TABLE events
  ADD COLUMN IF NOT EXISTS participation_model participation_model NOT NULL DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS participation_config JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS allow_participant_campaigns BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS location_place_id TEXT;

-- Create saved_campaigns table for independent campaign bookmarks
CREATE TABLE IF NOT EXISTS saved_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT saved_campaigns_user_campaign_unique UNIQUE (user_id, campaign_id)
);

CREATE INDEX IF NOT EXISTS idx_saved_campaigns_user_id ON saved_campaigns(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_campaigns_campaign_id ON saved_campaigns(campaign_id);

ALTER TABLE saved_campaigns ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own saved campaigns" ON saved_campaigns;
CREATE POLICY "Users can view their own saved campaigns"
  ON saved_campaigns FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own saved campaigns" ON saved_campaigns;
CREATE POLICY "Users can insert their own saved campaigns"
  ON saved_campaigns FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own saved campaigns" ON saved_campaigns;
CREATE POLICY "Users can delete their own saved campaigns"
  ON saved_campaigns FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Organizer role enum and table for multi-organizer extension point
DO $$ BEGIN
  CREATE TYPE organizer_role AS ENUM ('owner', 'organizer', 'manager', 'moderator');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS event_organizers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role organizer_role NOT NULL DEFAULT 'organizer',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT event_organizers_event_user_unique UNIQUE (event_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_event_organizers_event_id ON event_organizers(event_id);
CREATE INDEX IF NOT EXISTS idx_event_organizers_user_id ON event_organizers(user_id);

ALTER TABLE event_organizers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view event organizers" ON event_organizers;
CREATE POLICY "Public can view event organizers"
  ON event_organizers FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Event owners can manage event organizers" ON event_organizers;
CREATE POLICY "Event owners can manage event organizers"
  ON event_organizers FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = event_organizers.event_id
      AND events.creator_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = event_organizers.event_id
      AND events.creator_id = auth.uid()
    )
  );

-- Backfill event creators as owners in event_organizers
INSERT INTO event_organizers (event_id, user_id, role)
SELECT id, creator_id, 'owner'::organizer_role
FROM events
ON CONFLICT (event_id, user_id) DO NOTHING;
