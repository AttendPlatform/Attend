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

-- Backfill missing event owners into event_organizers only for valid profile creators
INSERT INTO event_organizers (event_id, user_id, role)
SELECT e.id, e.creator_id, 'owner'::organizer_role
FROM events e
INNER JOIN profiles p ON e.creator_id = p.id
WHERE e.creator_id IS NOT NULL
ON CONFLICT (event_id, user_id) DO NOTHING;

-- Resolve duplicate event participation records before constraint enforcement
DELETE FROM event_participants a
USING event_participants b
WHERE a.id < b.id
  AND a.event_id = b.event_id
  AND a.user_id = b.user_id
  AND a.user_id IS NOT NULL;

-- Allow campaigns to exist unlinked when parent events are deleted or missing
ALTER TABLE campaigns ALTER COLUMN event_id DROP NOT NULL;

-- Identify orphaned campaigns referencing missing events and safely unlink them
-- Set status to archived so they are not treated as active campaigns or attached to unrelated events
UPDATE campaigns
SET
  event_id = NULL,
  status = 'archived'
WHERE
  event_id IS NOT NULL
  AND event_id NOT IN (SELECT id FROM events);

-- Enforce campaign to parent event referential integrity with ON DELETE SET NULL
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
      ON DELETE SET NULL;
  END IF;
END $$;
