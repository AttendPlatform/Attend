import type { SupabaseClient } from "@supabase/supabase-js";

export interface OrganizerEventStats {
  attendeesCount: number;
  registrationsCount: number;
  campaignsCount: number;
  dpGenerationsCount: number;
}

export interface OrganizerEventDetails {
  id: string;
  title: string;
  slug: string;
  status: string;
  creator_id: string;
  cover_image: string | null;
  start_at: string | null;
  end_at: string | null;
  venue_name: string | null;
  city: string | null;
  state: string | null;
  is_online: boolean;
  participation_model: string | null;
  allow_participant_campaigns: boolean;
  category?: { id: string; name: string; slug: string } | null;
  organizers: { user_id: string; role: string }[];
}

export async function isUserEventOrganizer(
  supabase: SupabaseClient,
  eventId: string,
  userId: string
): Promise<boolean> {
  const { data: event } = await supabase
    .from("events")
    .select("creator_id")
    .eq("id", eventId)
    .maybeSingle();

  if (event && event.creator_id === userId) {
    return true;
  }

  const { data: organizer } = await supabase
    .from("event_organizers")
    .select("id")
    .eq("event_id", eventId)
    .eq("user_id", userId)
    .maybeSingle();

  return Boolean(organizer);
}

export async function getOrganizerEvent(
  supabase: SupabaseClient,
  eventId: string
): Promise<OrganizerEventDetails | null> {
  const { data: event, error } = await supabase
    .from("events")
    .select(`
      id,
      title,
      slug,
      status,
      creator_id,
      cover_image,
      start_at,
      end_at,
      venue_name,
      city,
      state,
      is_online,
      participation_model,
      allow_participant_campaigns,
      event_categories ( id, name, slug ),
      event_organizers ( user_id, role )
    `)
    .eq("id", eventId)
    .maybeSingle();

  if (error || !event) {
    return null;
  }

  const category = Array.isArray(event.event_categories)
    ? event.event_categories[0]
    : event.event_categories;

  return {
    id: event.id,
    title: event.title,
    slug: event.slug,
    status: event.status || "draft",
    creator_id: event.creator_id,
    cover_image: event.cover_image,
    start_at: event.start_at,
    end_at: event.end_at,
    venue_name: event.venue_name,
    city: event.city,
    state: event.state,
    is_online: Boolean(event.is_online),
    participation_model: event.participation_model,
    allow_participant_campaigns: Boolean(event.allow_participant_campaigns),
    category: category || null,
    organizers: (event.event_organizers || []) as { user_id: string; role: string }[],
  };
}

export async function getOrganizerEventStats(
  supabase: SupabaseClient,
  eventId: string
): Promise<OrganizerEventStats> {
  const [participantsRes, registrationsRes, campaignsRes] = await Promise.all([
    supabase
      .from("event_participants")
      .select("id, status", { count: "exact" })
      .eq("event_id", eventId)
      .neq("status", "cancelled"),
    supabase
      .from("event_participants")
      .select("id", { count: "exact" })
      .eq("event_id", eventId)
      .eq("participation_type", "registration")
      .neq("status", "cancelled"),
    supabase
      .from("campaigns")
      .select("id, generations")
      .eq("event_id", eventId),
  ]);

  const attendeesCount = participantsRes.count ?? 0;
  const registrationsCount = registrationsRes.count ?? 0;
  const campaigns = campaignsRes.data ?? [];
  const campaignsCount = campaigns.length;
  const dpGenerationsCount = campaigns.reduce(
    (sum, c) => sum + (Number(c.generations) || 0),
    0
  );

  return {
    attendeesCount,
    registrationsCount,
    campaignsCount,
    dpGenerationsCount,
  };
}
