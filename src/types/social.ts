export type AttendanceVisibility = "public" | "connections" | "private";

export type ContactIdentifierType = "phone" | "email";

export interface UserContactIdentifierRecord {
  id: string;
  user_id: string;
  identifier_type: ContactIdentifierType;
  identifier_hash: string;
  created_at: string;
}

export type ConnectionSource = "contact_match" | "mutual_event" | "manual";

export interface UserConnectionRecord {
  id: string;
  user_id: string;
  connected_user_id: string;
  source: ConnectionSource;
  created_at: string;
}

export interface SocialPrivacySettings {
  attendance_visibility: AttendanceVisibility;
  allow_social_notifications: boolean;
  allow_social_recommendations: boolean;
  allow_contact_discovery: boolean;
  contact_discovery_consented_at: string | null;
}

export interface FriendAttendingSummary {
  user_id: string;
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
  source: ConnectionSource;
}
