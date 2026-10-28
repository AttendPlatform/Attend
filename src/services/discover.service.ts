import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { calculateDistance } from "@/lib/location/distance";
import { calculateBoundingBox, isWithinBoundingBox, matchesCity, type BoundingBox } from "@/lib/location";
import type { DiscoverFilters } from "@/types/discover";
import { resolveDateFilterRange } from "@/types/discover";
import type { CampaignCardData, CampaignParentEventSummary, CampaignTemplatePreview } from "@/types/campaigns";

type EventRow = Database["public"]["Tables"]["events"]["Row"];
type CategoryRow = Database["public"]["Tables"]["event_categories"]["Row"];

export type DiscoverEvent = Pick<
  EventRow,
  | "id"
  | "creator_id"
  | "category_id"
  | "title"
  | "slug"
  | "description"
  | "cover_image"
  | "venue_name"
  | "address"
  | "city"
  | "state"
  | "country"
  | "is_online"
  | "online_url"
  | "start_at"
  | "end_at"
  | "status"
  | "views"
  | "participant_count"
  | "created_at"
  | "latitude"
  | "longitude"
> & {
  category: Pick<CategoryRow, "id" | "name" | "slug" | "icon"> | null;
  organizerName: string | null;
  distanceKm?: number;
};

export interface DiscoverCampaign extends CampaignCardData {
  event: (CampaignParentEventSummary & {
    category?: Pick<CategoryRow, "id" | "name" | "slug" | "icon"> | null;
    latitude?: number | null;
    longitude?: number | null;
    description?: string | null;
  }) | null;
  template: CampaignTemplatePreview | null;
}

export interface DiscoverResults {
  events: DiscoverEvent[];
  campaigns: DiscoverCampaign[];
  categories: Pick<CategoryRow, "id" | "name" | "slug" | "icon">[];
}

const EVENT_COLUMNS = `
  id, creator_id, category_id, title, slug, description, cover_image,
  venue_name, address, city, state, country, is_online, online_url,
  start_at, end_at, status, views, participant_count, created_at, latitude, longitude
`;

function includesQuery(value: string | null | undefined, query: string): boolean {
  return Boolean(value?.toLocaleLowerCase().includes(query));
}

function matchesEvent(
  event: DiscoverEvent,
  filters: DiscoverFilters,
  search: string,
  range: { start: string; end: string } | null,
  boundingBox?: BoundingBox | null
) {
  if (filters.categoryId && event.category_id !== filters.categoryId) return false;
  if (typeof filters.isOnline === "boolean" && event.is_online !== filters.isOnline) return false;
  if (filters.city && !matchesCity(event.city, filters.city)) return false;
  if (boundingBox) {
    if (event.latitude == null || event.longitude == null) return false;
    if (!isWithinBoundingBox({ latitude: event.latitude, longitude: event.longitude }, boundingBox)) {
      return false;
    }
  }
  if (range) {
    const eventTime = new Date(event.start_at).getTime();
    if (Number.isNaN(eventTime)) return false;
    const startTime = new Date(range.start).getTime();
    const endTime = new Date(range.end).getTime();
    if (eventTime < startTime || eventTime > endTime) return false;
  }
  return !search || [event.title, event.description, event.organizerName, event.category?.name]
    .some((value) => includesQuery(value, search));
}

function rankEvents(events: DiscoverEvent[], filters: DiscoverFilters): DiscoverEvent[] {
  const now = Date.now();
  const coords = filters.userCoordinates;
  const withDistance = events.map((event) => {
    const distanceKm = coords && event.latitude != null && event.longitude != null
      ? calculateDistance(coords, { latitude: event.latitude, longitude: event.longitude })
      : undefined;
    return { ...event, distanceKm };
  });

  return withDistance.sort((a, b) => {
    if ((filters.nearMe || filters.sortBy === "nearest") && coords) {
      if (a.distanceKm != null || b.distanceKm != null) {
        if (a.distanceKm == null) return 1;
        if (b.distanceKm == null) return -1;
        if (a.distanceKm !== b.distanceKm) return a.distanceKm - b.distanceKm;
      }
    }
    const aUpcoming = new Date(a.start_at).getTime() >= now;
    const bUpcoming = new Date(b.start_at).getTime() >= now;
    if (aUpcoming !== bUpcoming) return aUpcoming ? -1 : 1;
    if (filters.sortBy === "popular") {
      const aCount = a.participant_count ?? 0;
      const bCount = b.participant_count ?? 0;
      if (bCount !== aCount) return bCount - aCount;
    }
    const timeDiff = new Date(a.start_at).getTime() - new Date(b.start_at).getTime();
    if (timeDiff !== 0) return timeDiff;
    return a.id.localeCompare(b.id);
  });
}

/** Fetches Discover data concurrently, then applies deterministic client-safe filtering and ranking. */
export async function getDiscoverData(
  supabase: SupabaseClient<Database>,
  filters: DiscoverFilters = {}
): Promise<DiscoverResults> {
  let eventQuery = supabase
    .from("events")
    .select(EVENT_COLUMNS)
    .eq("status", "published")
    .order("start_at", { ascending: true });

  if (filters.categoryId) {
    eventQuery = eventQuery.eq("category_id", filters.categoryId);
  }
  if (typeof filters.isOnline === "boolean") {
    eventQuery = eventQuery.eq("is_online", filters.isOnline);
  }

  const [categoryResult, eventResult, campaignResult] = await Promise.all([
    supabase.from("event_categories").select("id, name, slug, icon").order("name"),
    eventQuery,
    supabase.from("campaigns").select(`id, event_id, creator_id, title, slug, description, status, views, generations, downloads, participants, created_at`).eq("status", "published").order("created_at", { ascending: false }),
  ]);

  if (eventResult.error) throw eventResult.error;
  if (campaignResult.error) throw campaignResult.error;
  const categories = categoryResult.data ?? [];
  const categoryMap = new Map(categories.map((c) => [c.id, c]));
  const rawEvents = (eventResult.data ?? []) as unknown as Omit<DiscoverEvent, "category" | "organizerName">[];
  const rawCampaigns = campaignResult.data ?? [];
  const creatorIds = [...new Set(rawEvents.map((event) => event.creator_id))];
  const parentEventIds = [...new Set(rawCampaigns.map((campaign) => campaign.event_id).filter((id): id is string => Boolean(id)))];
  const campaignIds = rawCampaigns.map((campaign) => campaign.id);

  const [profilesResult, parentEventsResult, templatesResult] = await Promise.all([
    creatorIds.length
      ? supabase.from("profiles").select("id, full_name, display_name, username").in("id", creatorIds)
      : Promise.resolve({ data: [], error: null }),
    parentEventIds.length
      ? supabase.from("events").select(EVENT_COLUMNS).in("id", parentEventIds)
      : Promise.resolve({ data: [], error: null }),
    campaignIds.length
      ? supabase.from("campaign_templates").select("id, campaign_id, name, asset_url, width, height, version, is_active, canvas_config").in("campaign_id", campaignIds).eq("is_active", true).order("version", { ascending: false })
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (parentEventsResult.error) throw parentEventsResult.error;
  if (templatesResult.error) throw templatesResult.error;

  const profiles = profilesResult.data ?? [];
  const profileNameMap = new Map(
    profiles.map((p) => [
      p.id,
      p.display_name || p.full_name || p.username || null,
    ])
  );

  const templateMap = new Map<string, CampaignTemplatePreview>();
  for (const template of templatesResult.data ?? []) {
    if (template.campaign_id && !templateMap.has(template.campaign_id)) {
      templateMap.set(template.campaign_id, template as CampaignTemplatePreview);
    }
  }

  const toEvent = (row: Omit<DiscoverEvent, "category" | "organizerName">): DiscoverEvent => ({
    ...row,
    category: row.category_id ? categoryMap.get(row.category_id) ?? null : null,
    organizerName: profileNameMap.get(row.creator_id) ?? null,
  });
  const eventsById = new Map(((parentEventsResult.data ?? []) as unknown as Omit<DiscoverEvent, "category" | "organizerName">[]).map((row) => [row.id, toEvent(row)]));
  const allEvents = rawEvents.map(toEvent);
  const search = filters.search?.trim().toLocaleLowerCase() ?? "";
  const range = resolveDateFilterRange(filters.dateFilter);
  const boundingBox = filters.nearMe && filters.userCoordinates
    ? calculateBoundingBox(filters.userCoordinates, 60)
    : null;
  const filteredEvents = rankEvents(allEvents.filter((event) => matchesEvent(event, filters, search, range, boundingBox)), filters);

  const filteredCampaigns = rawCampaigns.flatMap((campaign) => {
    const parent = campaign.event_id ? eventsById.get(campaign.event_id) : null;
    if (!parent || parent.status !== "published") return [];
    if (!matchesEvent(parent, { ...filters, search: undefined }, "", range, boundingBox)) return [];
    if (search && ![campaign.title, campaign.description, parent.title, parent.description, parent.organizerName, parent.category?.name]
      .some((value) => includesQuery(value, search))) return [];
    const template = templateMap.get(campaign.id) ?? null;
    return [{
      ...campaign,
      event: {
        ...parent,
        category: parent.category,
      },
      template,
    } as DiscoverCampaign];
  });

  return { events: filteredEvents, campaigns: filteredCampaigns, categories };
}
