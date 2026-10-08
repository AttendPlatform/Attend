-- Milestone 0 Data Integrity and Referential Alignment

-- Ensure all events have default participation models and campaign permissions
UPDATE events
SET
  participation_model = COALESCE(participation_model, 'free'::participation_model),
  participation_config = COALESCE(participation_config, '{}'::jsonb),
  allow_participant_campaigns = COALESCE(allow_participant_campaigns, true)
WHERE
  participation_model IS NULL
  OR participation_config IS NULL
  OR allow_participant_campaigns IS NULL;

-- Backfill missing event owners into event_organizers
INSERT INTO event_organizers (event_id, user_id, role)
SELECT id, creator_id, 'owner'::organizer_role
FROM events
ON CONFLICT (event_id, user_id) DO NOTHING;

-- Enforce campaign to parent event referential integrity
-- Re-link any orphaned campaign to the oldest published event to preserve campaign content and analytics
DO $$
DECLARE
  fallback_event_id UUID;
BEGIN
  SELECT id INTO fallback_event_id
  FROM events
  WHERE status = 'published'
  ORDER BY created_at ASC
  LIMIT 1;

  IF fallback_event_id IS NOT NULL THEN
    UPDATE campaigns
    SET event_id = fallback_event_id
    WHERE event_id NOT IN (SELECT id FROM events);
  END IF;
END $$;

-- Add foreign key constraint on campaigns.event_id if not present
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'campaigns_event_id_fkey'
  ) THEN
    ALTER TABLE campaigns
      ADD CONSTRAINT campaigns_event_id_fkey
      FOREIGN KEY (event_id)
      REFERENCES events(id)
      ON DELETE CASCADE;
  END IF;
END $$;
