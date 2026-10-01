export type Category = {
  id: string;
  name: string;
  slug: string;
};

export type Event = {
  id: string;
  title: string;
  description: string | null;
  cover_image: string | null;
  start_at: string | null;
  city: string | null;
  state: string | null;
  is_online: boolean | null;
  event_categories: Category | Category[] | null;
};

export type CampaignTemplate = {
  id: string;
  asset_url: string;
  width: number;
  height: number;
  version: number;
  is_active: boolean;
};

export type Campaign = {
  id: string;
  event_id: string;
  title: string;
  slug: string;
  description: string | null;
  status: string;
  views: number;
  generations: number;
  downloads: number;
  participants: number;
  events: Event | Event[] | null;
  campaign_templates: CampaignTemplate | CampaignTemplate[] | null;
};
