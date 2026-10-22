
import { createClient, createPublicClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";
import type {
  EventParticipationType,
  EventParticipantWithProfile,
  AttendanceCounts,
} from "@/types/attendance";

export type EventParticipantRow =
  Database["public"]["Tables"]["event_participants"]["Row"];

export async function getEventAttendees(
  eventId: string,
  limit = 10
): Promise<EventParticipantWithProfile[]> {
  const publicClient = createPublicClient();

  const { data, error } = await publicClient
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
    // Ignore incomplete rows from the nullable public view.
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
        profile:
          row.user_id ||
          row.profile_display_name ||
          row.profile_avatar_url ||
          row.profile_username
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

  return (data || []).map((row: any) => ({
    ...row,
    profile: Array.isArray(row.profiles) ? row.profiles[0] : row.profiles,
  })) as EventParticipantWithProfile[];
}

export async function getEventAttendanceCounts(
  eventId: string
): Promise<AttendanceCounts> {
  const supabase = await createClient();

  let { data, error } = await supabase
    .from("event_participants")
    .select("participation_type, status")
    .eq("event_id", eventId)
    .in("status", ["attending", "registered", "ticketed", "attended"]);

  if (error && (error.code === "PGRST303" || error.code === "PGRST301")) {
    const publicClient = createPublicClient();

    const fallback = await publicClient
      .from("public_event_attendees")
      .select("participation_type, status")
      .eq("event_id", eventId)
      .in("status", ["attending", "registered", "ticketed", "attended"]);

    data = (fallback.data || []).flatMap((row) => {
      if (!row.participation_type || !row.status) {
        return [];
      }

      return [
        {
          participation_type: row.participation_type,
          status: row.status,
        },
      ];
    });

    error = fallback.error;
  }

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

  const {
    eventId,
    userId,
    name,
    participationType = "attendee",
    registrationData = {},
  } = params;

  const { data, error } = await supabase
    .from("event_participants")
    .upsert(
      {
        event_id: eventId,
        user_id: userId,
        name: name || null,
        participation_type: participationType,
        status: participationType === "registrant" ? "registered" : "attending",
        registration_data: registrationData as any,
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
