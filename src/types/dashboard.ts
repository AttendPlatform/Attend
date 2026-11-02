import type { EventStatus, ParticipationModel } from "./events";

export type OrganizerRole = "owner" | "admin" | "member";

export interface OrganizerAccessResult {
  isOrganizer: boolean;
  role: OrganizerRole | null;
  isCreator: boolean;
}

export type DashboardTab = "overview" | "people" | "campaigns" | "settings";

export type SavedHubTab = "events" | "campaigns";

export interface DashboardOverviewStats {
  totalAttendees: number;
  totalRegistrations: number;
  totalCampaigns: number;
  totalGenerations: number;
}

export interface OrganizerEventHeaderData {
  id: string;
  title: string;
  slug: string;
  status: EventStatus;
  start_at: string;
  end_at: string | null;
  venue_name: string | null;
  city: string | null;
  is_online: boolean;
  cover_image: string | null;
  participant_count: number;
  participation_model: ParticipationModel;
}

export interface OrganizerMemberSummary {
  userId: string;
  role: OrganizerRole;
  createdAt: string;
}
