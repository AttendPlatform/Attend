-- Discover query performance indexes for events and campaigns

-- Composite index for published events ordered by start date (used by discover.service.ts)
CREATE INDEX IF NOT EXISTS idx_events_status_start_at ON events(status, start_at);

-- Category filtering index on events
CREATE INDEX IF NOT EXISTS idx_events_category_id ON events(category_id);

-- Online and in-person status filter index on events
CREATE INDEX IF NOT EXISTS idx_events_is_online ON events(is_online);

-- City filtering index on events
CREATE INDEX IF NOT EXISTS idx_events_city ON events(city);

-- Geospatial coordinate index for bounding box filtering
CREATE INDEX IF NOT EXISTS idx_events_coordinates ON events(latitude, longitude) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- Composite index for published campaigns ordered by creation date
CREATE INDEX IF NOT EXISTS idx_campaigns_status_created_at ON campaigns(status, created_at DESC);

-- Composite index for active campaign templates lookup
CREATE INDEX IF NOT EXISTS idx_campaign_templates_campaign_active ON campaign_templates(campaign_id, is_active, version DESC);
