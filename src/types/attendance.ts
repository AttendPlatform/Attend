import type { Database } from "@/lib/supabase/database.types";

export type EventParticipationType =
  Database["public"]["Enums"]["event_participation_type"];

export type EventAttendanceStatus =
  Database["public"]["Enums"]["event_attendance_status"];

export type EventParticipantRow =
  Database["public"]["Tables"]["event_participants"]["Row"];

export type EventParticipantInsert =
  Database["public"]["Tables"]["event_participants"]["Insert"];

export interface EventAttendeeProfile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  username: string | null;
}

export interface EventParticipantWithProfile extends EventParticipantRow {
  profile?: EventAttendeeProfile | null;
}

export interface AttendanceCounts {
  attendees: number;
  registrants: number;
  ticketHolders: number;
  total: number;
}
