import { createClient, createPublicClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";

export type EventRow = Database["public"]["Tables"]["events"]["Row"];
export type EventCategoryRow = Database["public"]["Tables"]["event_categories"]["Row"];

export interface DiscoverEvent extends EventRow {
  category?: EventCategoryRow | null;
}

export async function getEventCategories(): Promise<EventCategoryRow[]> {
  const supabase = await createClient();
  let { data, error } = await supabase
    .from("event_categories")
    .select("*")
    .order("name", { ascending: true });

  if (error && (error.code === "PGRST303" || error.code === "PGRST301")) {
    const publicClient = createPublicClient();
    const fallback = await publicClient
      .from("event_categories")
      .select("*")
      .order("name", { ascending: true });
    data = fallback.data;
    error = fallback.error;
  }

  if (error) {
    throw error;
  }
  return data ?? [];
}

export async function getDiscoverEvents(): Promise<DiscoverEvent[]> {
  const supabase = await createClient();

  const [categories, { data: eventData, error: eventError }] = await Promise.all([
    getEventCategories().catch(() => []),
    supabase
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
      .eq("status", "published")
      .order("start_at", { ascending: true }),
  ]);

  if (eventError) {
    throw eventError;
  }

  return (eventData || []).map((event) => ({
    ...event,
    category: categories.find((c) => c.id === event.category_id) || null,
  })) as DiscoverEvent[];
}

export async function getHomeEvents(limit = 50) {
  const supabase = await createClient();
  let { data, error } = await supabase
    .from("events")
    .select(`
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
    `)
    .order("start_at", {
      ascending: true,
      nullsFirst: false,
    })
    .limit(limit);

  if (error && (error.code === "PGRST303" || error.code === "PGRST301")) {
    const publicClient = createPublicClient();
    const fallback = await publicClient
      .from("events")
      .select(`
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
      `)
      .order("start_at", {
        ascending: true,
        nullsFirst: false,
      })
      .limit(limit);
    data = fallback.data;
    error = fallback.error;
  }

  if (error) {
    throw error;
  }
  return data ?? [];
}

export async function getEventById(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("events")
    .select(`
      *,
      event_categories (
        name,
        slug
      )
    `)
    .eq("id", id)
    .single();

  if (error || !data) {
    return null;
  }
  return data;
}

export async function getUserEvents(userId: string, limit = 6) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("events")
    .select(`
      id,
      title,
      description,
      cover_image,
      start_at,
      city,
      state,
      is_online,
      status,
      event_categories (
        name,
        slug
      )
    `)
    .eq("creator_id", userId)
    .order("start_at", {
      ascending: true,
      nullsFirst: false,
    })
    .limit(limit);

  if (error) {
    throw error;
  }
  return data ?? [];
}

export async function getPublicProfileEvents(creatorId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("events")
    .select("id, title, cover_image, start_at, city, state, is_online")
    .eq("creator_id", creatorId)
    .eq("status", "published")
    .order("start_at", { ascending: true });

  if (error) {
    throw error;
  }
  return data ?? [];
}
