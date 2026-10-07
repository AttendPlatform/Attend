import { createClient } from "@/lib/supabase/server";

export async function isEventSaved(
  eventId: string,
  userId: string
): Promise<boolean> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("saved_events")
    .select("id")
    .eq("event_id", eventId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw error;
  }
  return Boolean(data);
}

export async function isCampaignSaved(
  campaignId: string,
  userId: string
): Promise<boolean> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("saved_campaigns")
    .select("id")
    .eq("campaign_id", campaignId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw error;
  }
  return Boolean(data);
}

export async function toggleSaveEvent(
  eventId: string,
  userId: string
): Promise<{ saved: boolean }> {
  const supabase = await createClient();
  const currentlySaved = await isEventSaved(eventId, userId);

  if (currentlySaved) {
    const { error } = await supabase
      .from("saved_events")
      .delete()
      .eq("event_id", eventId)
      .eq("user_id", userId);

    if (error) throw error;
    return { saved: false };
  }

  const { error } = await supabase.from("saved_events").insert({
    event_id: eventId,
    user_id: userId,
  });

  if (error) throw error;
  return { saved: true };
}

export async function toggleSaveCampaign(
  campaignId: string,
  userId: string
): Promise<{ saved: boolean }> {
  const supabase = await createClient();
  const currentlySaved = await isCampaignSaved(campaignId, userId);

  if (currentlySaved) {
    const { error } = await supabase
      .from("saved_campaigns")
      .delete()
      .eq("campaign_id", campaignId)
      .eq("user_id", userId);

    if (error) throw error;
    return { saved: false };
  }

  const { error } = await supabase.from("saved_campaigns").insert({
    campaign_id: campaignId,
    user_id: userId,
  });

  if (error) throw error;
  return { saved: true };
}

export async function getSavedEvents(userId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("saved_events")
    .select(`
      id,
      created_at,
      events (
        id,
        title,
        slug,
        description,
        cover_image,
        start_at,
        venue_name,
        city,
        state,
        is_online,
        status,
        participation_model,
        event_categories (
          id,
          name,
          slug
        )
      )
    `)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }
  return (data || []).map((item) => item.events).filter(Boolean);
}

export async function getSavedCampaigns(userId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("saved_campaigns")
    .select(`
      id,
      created_at,
      campaigns (
        id,
        title,
        slug,
        description,
        status,
        views,
        generations,
        participants,
        events (
          id,
          title,
          slug,
          cover_image,
          start_at
        ),
        campaign_templates (
          id,
          asset_url,
          width,
          height,
          version,
          is_active
        )
      )
    `)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }
  return (data || []).map((item) => item.campaigns).filter(Boolean);
}
