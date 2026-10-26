import type { Database } from "@/lib/supabase/database.types";

export type CampaignStatus = Database["public"]["Enums"]["campaign_status"] | "draft" | "published" | "paused" | "archived";

export interface CampaignParentEventSummary {
  id: string;
  title: string;
  slug?: string | null;
  cover_image?: string | null;
  start_at?: string | null;
  end_at?: string | null;
  venue_name?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  is_online?: boolean | null;
  status?: string;
  participant_count?: number | null;
  category?: {
    id: string;
    name: string;
    slug: string;
  } | null;
  event_categories?:
    | { id: string; name: string; slug: string }
    | { id: string; name: string; slug: string }[]
    | null;
}

export interface CampaignTemplatePreview {
  id: string;
  campaign_id?: string;
  name?: string | null;
  asset_url: string;
  width: number;
  height: number;
  version?: number;
  is_active?: boolean;
  canvas_config?: Record<string, unknown> | null;
}

export interface CampaignCardData {
  id: string;
  event_id: string;
  title: string;
  slug: string;
  description?: string | null;
  status?: CampaignStatus | string;
  views?: number;
  generations?: number;
  downloads?: number;
  participants?: number;
  creator_id?: string | null;
  created_at?: string;
  event?: CampaignParentEventSummary | null;
  events?: CampaignParentEventSummary | CampaignParentEventSummary[] | null;
  template?: CampaignTemplatePreview | null;
  campaign_templates?: CampaignTemplatePreview | CampaignTemplatePreview[] | null;
}

export type CampaignCtaVariant = "create_version" | "participate" | "default";

export interface CampaignCardProps {
  campaign: CampaignCardData;
  className?: string;
  priority?: boolean;
  ctaVariant?: CampaignCtaVariant;
  showParentEvent?: boolean;
  showSaveButton?: boolean;
  showParticipantBadge?: boolean;
  isSaved?: boolean;
  onSaveToggle?: (isSaved: boolean) => void;
  onClick?: () => void;
}

export interface CampaignParticipantMetric {
  campaignId: string;
  generationsCount: number;
  downloadsCount: number;
  sharesCount: number;
  participantsCount: number;
}

export function getCampaignParentEvent(
  campaign: CampaignCardData
): CampaignParentEventSummary | null {
  if (campaign.event) {
    return campaign.event;
  }
  if (Array.isArray(campaign.events)) {
    return campaign.events[0] || null;
  }
  if (campaign.events && typeof campaign.events === "object") {
    return campaign.events as CampaignParentEventSummary;
  }
  return null;
}

export function getCampaignTemplate(
  campaign: CampaignCardData
): CampaignTemplatePreview | null {
  if (campaign.template) {
    return campaign.template;
  }
  if (Array.isArray(campaign.campaign_templates)) {
    return (
      campaign.campaign_templates.find((t) => t.is_active !== false) ||
      campaign.campaign_templates[0] ||
      null
    );
  }
  if (
    campaign.campaign_templates &&
    typeof campaign.campaign_templates === "object"
  ) {
    return campaign.campaign_templates as CampaignTemplatePreview;
  }
  return null;
}

export function getCampaignParticipantCount(
  campaign: Partial<CampaignCardData>
): number {
  if (typeof campaign.participants === "number" && campaign.participants > 0) {
    return campaign.participants;
  }
  if (typeof campaign.generations === "number" && campaign.generations > 0) {
    return campaign.generations;
  }
  return 0;
}

export function formatCampaignParticipants(count: number): string {
  const safeCount = Math.max(0, count);
  return safeCount === 1 ? "1 participating" : `${safeCount} participating`;
}

export function getCampaignCtaLabel(variant?: CampaignCtaVariant): string {
  switch (variant) {
    case "create_version":
      return "Create Version";
    case "participate":
      return "Participate";
    default:
      return "Create your version";
  }
}
