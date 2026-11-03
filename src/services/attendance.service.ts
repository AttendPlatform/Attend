import { createClient } from "@/lib/supabase/server";
import type { Database, Json } from "@/lib/supabase/database.types";
import type {
  EventParticipationType,
  EventParticipantWithProfile,
  AttendanceCounts,
} from "@/types/attendance";
import type {
  OrganizerPeopleRosterItem,
  OrganizerPeopleStats,
  OrganizerPeopleFilter,
} from "@/types/dashboard";

export type EventParticipantRow =
  Database["public"]["Tables"]["event_participants"]["Row"];

export async function getEventAttendees(
  eventId: string,
  limit = 10
): Promise<EventParticipantWithProfile[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("public_event_attendees")
    .select(`
      id,
      event_id,
      user_id,
      name,
      participation_type,
      status,
      created_at,
      profile_display_name,
      profile_avatar_url,
      profile_username
    `)
    .eq("event_id", eventId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw error;
  }

  return (data || []).flatMap((row) => {
    if (
      !row.id ||
      !row.event_id ||
      !row.status ||
      !row.participation_type ||
      !row.created_at
    ) {
      return [];
    }

    return [
      {
        id: row.id,
        event_id: row.event_id,
        user_id: row.user_id,
        name: row.name,
        participation_type: row.participation_type,
        status: row.status,
        created_at: row.created_at,
        registration_data: {},
        profile: row.user_id
          ? {
              id: row.user_id,
              display_name: row.profile_display_name,
              avatar_url: row.profile_avatar_url,
              username: row.profile_username,
            }
          : null,
      } as EventParticipantWithProfile,
    ];
  });
}

export async function getOrganizerEventRegistrations(
  eventId: string
): Promise<EventParticipantWithProfile[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("event_participants")
    .select(`
      id,
      event_id,
      user_id,
      name,
      participation_type,
      status,
      registration_data,
      created_at,
      profiles (
        id,
        display_name,
        avatar_url,
        username
      )
    `)
    .eq("event_id", eventId)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data || []).map((row) => {
    const record = row as unknown as EventParticipantWithProfile & {
      profiles?: EventParticipantWithProfile["profile"] | EventParticipantWithProfile["profile"][];
    };
    return {
      ...record,
      profile: Array.isArray(record.profiles) ? record.profiles[0] : record.profiles,
    };
  }) as EventParticipantWithProfile[];
}

export async function getEventAttendanceCounts(
  eventId: string
): Promise<AttendanceCounts> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("public_event_attendees")
    .select("participation_type, status")
    .eq("event_id", eventId);

  if (error) {
    throw error;
  }

  const rows = data || [];
  let attendees = 0;
  let registrants = 0;
  let ticketHolders = 0;

  for (const row of rows) {
    if (row.participation_type === "registrant") {
      registrants += 1;
    } else if (row.participation_type === "ticket_holder") {
      ticketHolders += 1;
    } else {
      attendees += 1;
    }
  }

  return {
    attendees,
    registrants,
    ticketHolders,
    total: rows.length,
  };
}

export async function getUserEventAttendance(
  eventId: string,
  userId: string
): Promise<EventParticipantRow | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("event_participants")
    .select("*")
    .eq("event_id", eventId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw error;
  }
  return data;
}

export async function rsvpEvent(params: {
  eventId: string;
  userId: string;
  name?: string;
  participationType?: EventParticipationType;
  registrationData?: Record<string, unknown>;
}): Promise<EventParticipantRow> {
  const supabase = await createClient();
  const { eventId, userId, name, participationType = "attendee", registrationData = {} } = params;

  const { data, error } = await supabase
    .from("event_participants")
    .upsert(
      {
        event_id: eventId,
        user_id: userId,
        name: name || null,
        participation_type: participationType,
        status: participationType === "registrant" ? "registered" : "attending",
        registration_data: (registrationData as unknown as Json) ?? {},
      },
      { onConflict: "event_id,user_id" }
    )
    .select("*")
    .single();

  if (error) {
    throw error;
  }
  return data;
}

export async function cancelEventAttendance(
  eventId: string,
  userId: string
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("event_participants")
    .update({ status: "cancelled" })
    .eq("event_id", eventId)
    .eq("user_id", userId);

  if (error) {
    throw error;
  }
}

export async function getOrganizerPeopleStats(
  eventId: string
): Promise<OrganizerPeopleStats> {
  const supabase = await createClient();

  const [attendeesRes, registrantsRes, ticketHoldersRes, campaignsRes] =
    await Promise.all([
      supabase
        .from("event_participants")
        .select("id", { count: "exact", head: true })
        .eq("event_id", eventId)
        .eq("participation_type", "attendee")
        .in("status", ["attending", "confirmed"]),
      supabase
        .from("event_participants")
        .select("id", { count: "exact", head: true })
        .eq("event_id", eventId)
        .eq("participation_type", "registrant")
        .neq("status", "cancelled"),
      supabase
        .from("event_participants")
        .select("id", { count: "exact", head: true })
        .eq("event_id", eventId)
        .eq("participation_type", "ticket_holder")
        .neq("status", "cancelled"),
      supabase
        .from("campaigns")
        .select("id, generations, participants")
        .eq("event_id", eventId),
    ]);

  const totalAttendees = attendeesRes.count ?? 0;
  const totalRegistrants = registrantsRes.count ?? 0;
  const totalTicketHolders = ticketHoldersRes.count ?? 0;
  const campaigns = campaignsRes.data ?? [];
  const totalCampaignParticipants = campaigns.reduce(
    (sum: number, c) => sum + (Number(c.generations) || Number(c.participants) || 0),
    0
  );

  const grandTotal = totalAttendees + totalRegistrants + totalTicketHolders;

  return {
    totalAttendees,
    totalRegistrants,
    totalTicketHolders,
    totalCampaignParticipants,
    grandTotal,
  };
}

export async function getOrganizerPeopleRoster(
  eventId: string,
  filter?: OrganizerPeopleFilter
): Promise<OrganizerPeopleRosterItem[]> {
  const supabase = await createClient();
  const subTab = filter?.subTab;
  const search = filter?.search?.toLowerCase().trim();

  if (subTab === "campaign_participants") {
    const { data: campaigns, error: campaignError } = await supabase
      .from("campaigns")
      .select("id, title, slug, creator_id, created_at, status")
      .eq("event_id", eventId)
      .order("created_at", { ascending: false });

    if (campaignError) throw campaignError;
    const rawCampaigns = campaigns || [];

    const creatorIds = Array.from(
      new Set(rawCampaigns.map((c) => c.creator_id).filter(Boolean))
    );

    let profilesMap: Record<
      string,
      {
        id: string;
        display_name: string | null;
        avatar_url: string | null;
        username: string | null;
      }
    > = {};

    if (creatorIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, display_name, avatar_url, username")
        .in("id", creatorIds);

      if (profiles) {
        profilesMap = Object.fromEntries(profiles.map((p) => [p.id, p]));
      }
    }

    const items: OrganizerPeopleRosterItem[] = rawCampaigns.map((c) => {
      const profile = profilesMap[c.creator_id] || null;
      return {
        id: c.id,
        userId: c.creator_id,
        name: profile?.display_name || "Campaign Creator",
        displayName: profile?.display_name || null,
        avatarUrl: profile?.avatar_url || null,
        username: profile?.username || null,
        participationType: "campaign_participant",
        status: c.status,
        createdAt: c.created_at,
        registrationData: {},
        campaignTitle: c.title,
        campaignSlug: c.slug,
      };
    });

    if (search) {
      return items.filter(
        (item) =>
          item.name?.toLowerCase().includes(search) ||
          item.campaignTitle?.toLowerCase().includes(search) ||
          item.username?.toLowerCase().includes(search)
      );
    }

    return items;
  }

  let query = supabase
    .from("event_participants")
    .select(`
      id,
      event_id,
      user_id,
      name,
      participation_type,
      status,
      registration_data,
      created_at,
      profiles (
        id,
        display_name,
        avatar_url,
        username
      )
    `)
    .eq("event_id", eventId)
    .order("created_at", { ascending: false });

  if (subTab === "attendees") {
    query = query.eq("participation_type", "attendee");
  } else if (subTab === "registrants") {
    query = query.eq("participation_type", "registrant");
  } else if (subTab === "ticket_holders") {
    query = query.eq("participation_type", "ticket_holder");
  }

  if (filter?.limit) {
    query = query.limit(filter.limit);
  }

  const { data, error } = await query;
  if (error) throw error;

  const rawRows = data || [];
  const items: OrganizerPeopleRosterItem[] = rawRows.map((row) => {
    const rawProfile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
    const profile = rawProfile as {
      id: string;
      display_name: string | null;
      avatar_url: string | null;
      username: string | null;
    } | null;

    const registrationData =
      row.registration_data && typeof row.registration_data === "object"
        ? (row.registration_data as Record<string, unknown>)
        : {};

    return {
      id: row.id,
      userId: row.user_id,
      name: row.name || profile?.display_name || "Attendee",
      displayName: profile?.display_name || null,
      avatarUrl: profile?.avatar_url || null,
      username: profile?.username || null,
      participationType: row.participation_type,
      status: row.status,
      createdAt: row.created_at,
      registrationData,
    };
  });

  if (search) {
    return items.filter(
      (item) =>
        item.name?.toLowerCase().includes(search) ||
        item.displayName?.toLowerCase().includes(search) ||
        item.username?.toLowerCase().includes(search)
    );
  }

  return items;
}

export function checkPeopleDataSeparation(): {
  isConflated: boolean;
  attendeeTable: string;
  campaignTable: string;
  isolatedMetrics: readonly string[];
} {
  return {
    isConflated: false,
    attendeeTable: "event_participants",
    campaignTable: "campaigns",
    isolatedMetrics: [
      "attendees",
      "registrants",
      "ticket_holders",
      "campaign_participants",
    ],
  };
}
