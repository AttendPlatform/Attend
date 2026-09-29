import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";

export type CampaignRow = Database["public"]["Tables"]["campaigns"]["Row"];
export type CampaignTemplateRow = Database["public"]["Tables"]["campaign_templates"]["Row"];

export async function getHomeCampaigns(limit = 50) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("campaigns")
    .select(`
      id,
      event_id,
      title,
      slug,
      description,
      status,
      views,
      generations,
      downloads,
      participants,
      events (
        id,
        title,
        description,
        cover_image,
        start_at,
        city,
        state,
        is_online,
        event_categories (
          id,
          name,
          slug
        )
      ),
      campaign_templates (
        id,
        asset_url,
        width,
        height,
        version,
        is_active
      )
    `)
    .eq("status", "published")
    .order("created_at", {
      ascending: false,
    })
    .limit(limit);

  if (error) {
    throw error;
  }
  return data ?? [];
}

export async function getDiscoverCampaigns() {
  const supabase = await createClient();

  const { data: campaignData, error: campaignError } = await supabase
    .from("campaigns")
    .select(`
      id,
      event_id,
      creator_id,
      title,
      slug,
      description,
      status,
      views,
      generations,
      downloads,
      participants,
      created_at
    `)
    .eq("status", "published")
    .order("created_at", {
      ascending: false,
    });

  if (campaignError) {
    throw campaignError;
  }

  const rawCampaigns = campaignData || [];
  const campaignEventIds = Array.from(
    new Set(rawCampaigns.map((c) => c.event_id).filter(Boolean))
  ) as string[];
  const campaignIds = rawCampaigns.map((c) => c.id);

  const [eventsResult, templatesResult, categoriesResult] = await Promise.all([
    campaignEventIds.length > 0
      ? supabase
          .from("events")
          .select(`
            id,
            creator_id,
            category_id,
            title,
            slug,
            description,
            cover_image,
            venue_name,
            address,
            city,
            state,
            country,
            is_online,
            online_url,
            start_at,
            end_at,
            status,
            views,
            participant_count,
            created_at
          `)
          .in("id", campaignEventIds)
      : Promise.resolve({ data: [] }),
    campaignIds.length > 0
      ? supabase
          .from("campaign_templates")
          .select(`
            id,
            campaign_id,
            name,
            asset_url,
            width,
            height,
            canvas_config,
            version,
            is_active
          `)
          .in("campaign_id", campaignIds)
          .eq("is_active", true)
          .order("version", { ascending: false })
      : Promise.resolve({ data: [] }),
    supabase.from("event_categories").select("id, name, slug, icon"),
  ]);

  const categories = categoriesResult.data || [];
  const campaignEvents = (eventsResult.data || []).map((event) => ({
    ...event,
    category: categories.find((c) => c.id === event.category_id) || null,
  }));
  const templates = templatesResult.data || [];

  return rawCampaigns
    .map((campaign) => {
      const parentEvent =
        campaignEvents.find((event) => event.id === campaign.event_id) || null;
      const template =
        templates.find((item) => item.campaign_id === campaign.id) || null;

      return {
        ...campaign,
        event: parentEvent,
        template,
      };
    })
    .filter((campaign) => campaign.event?.status === "published");
}

export async function getCampaignsByEventId(eventId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("campaigns")
    .select(`
      id,
      event_id,
      title,
      description,
      slug,
      status,
      views,
      generations,
      downloads,
      participants,
      created_at
    `)
    .eq("event_id", eventId)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }
  return data ?? [];
}

export async function getUserCampaigns(userId: string, limit = 6) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("campaigns")
    .select(`
      id,
      event_id,
      title,
      slug,
      status,
      views,
      generations,
      downloads
    `)
    .eq("creator_id", userId)
    .order("created_at", {
      ascending: false,
    })
    .limit(limit);

  if (error) {
    throw error;
  }
  return data ?? [];
}

export async function getCampaignBySlug(slug: string) {
  const supabase = await createClient();
  const { data: campaign, error: campaignError } = await supabase
    .from("campaigns")
    .select(`
      id,
      event_id,
      creator_id,
      title,
      slug,
      description,
      status,
      views,
      generations,
      downloads,
      participants,
      events (
        id,
        title,
        slug,
        cover_image,
        start_at
      )
    `)
    .eq("slug", slug)
    .single();

  if (campaignError || !campaign) {
    return null;
  }

  const { data: template } = await supabase
    .from("campaign_templates")
    .select("*")
    .eq("campaign_id", campaign.id)
    .eq("is_active", true)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();

  return {
    campaign,
    template,
  };
}
