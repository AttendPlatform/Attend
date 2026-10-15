"use server";

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

export async function getEventBySlug(slug: string) {
  const supabase = await createClient();
  let { data, error } = await supabase
    .from("events")
    .select(`
      *,
      event_categories (
        name,
        slug
      )
    `)
    .eq("slug", slug)
    .single();

  if (error && (error.code === "PGRST303" || error.code === "PGRST301")) {
    const publicClient = createPublicClient();
    const fallback = await publicClient
      .from("events")
      .select(`
        *,
        event_categories (
          name,
          slug
        )
      `)
      .eq("slug", slug)
      .single();
    data = fallback.data;
    error = fallback.error;
  }

  if (error || !data) {
    return null;
  }
  return data;
}

export async function getRelatedEvents(
  eventId: string,
  categoryId?: string | null,
  city?: string | null,
  limit = 4
) {
  const publicClient = createPublicClient();
  let query = publicClient
    .from("events")
    .select(`
      id,
      title,
      slug,
      cover_image,
      start_at,
      city,
      state,
      is_online,
      participation_model,
      event_categories (
        name,
        slug
      )
    `)
    .eq("status", "published")
    .neq("id", eventId)
    .limit(limit);

  if (categoryId) {
    query = query.eq("category_id", categoryId);
  } else if (city) {
    query = query.eq("city", city);
  }

  const { data } = await query;
  return data ?? [];
}

export async function cancelEvent(
  eventId: string,
  userId: string
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("events")
    .update({ status: "cancelled" })
    .eq("id", eventId)
    .eq("creator_id", userId);

  if (error) {
    throw error;
  }
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

export interface CreateEventInput {
  creator_id: string;
  category_id: string;
  title: string;
  slug?: string;
  description?: string | null;
  start_at: string;
  end_at?: string | null;
  venue_name?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  location_place_id?: string | null;
  is_online?: boolean;
  online_url?: string | null;
  participation_model?: Database["public"]["Enums"]["participation_model"];
  participation_config?: Record<string, unknown>;
  allow_participant_campaigns?: boolean;
  status?: Database["public"]["Enums"]["event_status"];
  cover_image?: string | null;
}

export async function validateParticipationConfig(
  model: Database["public"]["Enums"]["participation_model"] = "free",
  config: Record<string, any> = {}
): Promise<{ valid: boolean; errors: string[] }> {
  const errors: string[] = [];

  if (model === "paid") {
    const price = Number(config.ticket_price);
    if (isNaN(price) || price <= 0) {
      errors.push("Ticket price must be greater than zero.");
    }
    if (!config.currency || typeof config.currency !== "string") {
      errors.push("A valid currency must be selected.");
    }
    if (config.max_tickets !== undefined && config.max_tickets !== null && config.max_tickets !== "") {
      const maxTickets = Number(config.max_tickets);
      if (isNaN(maxTickets) || maxTickets <= 0) {
        errors.push("Max tickets must be a positive integer.");
      }
    }
  } else if (model === "external") {
    if (!config.external_ticket_url || typeof config.external_ticket_url !== "string") {
      errors.push("External ticket URL is required.");
    } else {
      try {
        new URL(config.external_ticket_url);
      } catch {
        errors.push("External ticket URL must be a valid web address.");
      }
    }
  } else if (model === "registration") {
    if (config.max_attendees !== undefined && config.max_attendees !== null && config.max_attendees !== "") {
      const maxAttendees = Number(config.max_attendees);
      if (isNaN(maxAttendees) || maxAttendees <= 0) {
        errors.push("Max attendees must be a positive integer.");
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export async function createEvent(
  input: CreateEventInput,
  client?: any
): Promise<EventRow> {
  const validation = await validateParticipationConfig(
    input.participation_model ?? "free",
    input.participation_config ?? {}
  );

  if (!validation.valid) {
    throw new Error(`Invalid participation configuration: ${validation.errors.join(", ")}`);
  }

  const supabase = client || (await createClient());

  const slug =
    input.slug ||
    `${input.title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")}-${Date.now()}`;

  const { data: event, error: eventError } = await supabase
    .from("events")
    .insert({
      creator_id: input.creator_id,
      category_id: input.category_id,
      title: input.title,
      slug,
      description: input.description ?? null,
      start_at: input.start_at,
      end_at: input.end_at ?? null,
      venue_name: input.is_online ? null : input.venue_name ?? null,
      address: input.is_online ? null : input.address ?? null,
      city: input.is_online ? null : input.city ?? null,
      state: input.is_online ? null : input.state ?? null,
      country: input.is_online ? null : input.country ?? "Nigeria",
      latitude: input.is_online ? null : input.latitude ?? null,
      longitude: input.is_online ? null : input.longitude ?? null,
      location_place_id: input.is_online ? null : input.location_place_id ?? null,
      is_online: Boolean(input.is_online),
      online_url: input.is_online ? input.online_url ?? null : null,
      participation_model: input.participation_model ?? "free",
      participation_config: (input.participation_config ?? {}) as any,
      allow_participant_campaigns: input.allow_participant_campaigns ?? true,
      status: input.status ?? "published",
      cover_image: input.cover_image ?? null,
    })
    .select("*")
    .single();

  if (eventError || !event) {
    throw eventError || new Error("Could not create event.");
  }

  await supabase
    .from("event_organizers")
    .insert({
      event_id: event.id,
      user_id: input.creator_id,
      role: "owner",
    })
    .select()
    .maybeSingle();

  await supabase.from("notifications").insert({
    user_id: input.creator_id,
    title: "Event Created",
    message: `Your event "${event.title}" has been created (${event.status}).`,
    type: "event",
  });

  return event;
}


