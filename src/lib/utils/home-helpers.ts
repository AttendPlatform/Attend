import type { Category, Event, Campaign, CampaignTemplate } from "@/types/home";

export function getCategory(event: Event | null): Category | null {
  if (!event?.event_categories) {
    return null;
  }

  if (Array.isArray(event.event_categories)) {
    return event.event_categories[0] || null;
  }

  return event.event_categories;
}

export function getCampaignEvent(campaign: Campaign): Event | null {
  if (!campaign.events) {
    return null;
  }

  if (Array.isArray(campaign.events)) {
    return campaign.events[0] || null;
  }

  return campaign.events;
}

export function getTemplate(campaign: Campaign): CampaignTemplate | null {
  if (!campaign.campaign_templates) {
    return null;
  }

  if (Array.isArray(campaign.campaign_templates)) {
    return (
      campaign.campaign_templates.find((template) => template.is_active) || null
    );
  }

  return campaign.campaign_templates.is_active ? campaign.campaign_templates : null;
}

export function formatDate(date: string | null): string {
  if (!date) {
    return "Date TBA";
  }

  const value = new Date(date);

  if (Number.isNaN(value.getTime())) {
    return "Date TBA";
  }

  return value.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatLocation(event: Event): string {
  if (event.is_online) {
    return "Online event";
  }

  const location = [event.city, event.state].filter(Boolean).join(", ");

  return location || "Location TBA";
}
