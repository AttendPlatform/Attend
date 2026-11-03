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

export type PeopleSubTab =
  | "attendees"
  | "registrants"
  | "ticket_holders"
  | "campaign_participants";

export interface OrganizerPeopleRosterItem {
  id: string;
  userId: string | null;
  name: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  username: string | null;
  participationType: string;
  status: string;
  createdAt: string;
  registrationData: Record<string, unknown>;
  campaignTitle?: string | null;
  campaignSlug?: string | null;
}

export interface OrganizerPeopleStats {
  totalAttendees: number;
  totalRegistrants: number;
  totalTicketHolders: number;
  totalCampaignParticipants: number;
  grandTotal: number;
}

export interface OrganizerPeopleFilter {
  subTab?: PeopleSubTab;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface EventUpdatedNotificationPayload {
  eventId: string;
  eventTitle: string;
  previousStartAt?: string | null;
  newStartAt?: string | null;
  previousVenue?: string | null;
  newVenue?: string | null;
  changes: string[];
}

export interface CampaignCreatedNotificationPayload {
  campaignId: string;
  campaignTitle: string;
  eventId: string;
  eventTitle: string;
  creatorId: string;
  creatorName?: string | null;
}

export interface RegistrationReceiptPayload {
  eventId: string;
  eventTitle: string;
  userId: string;
  registrationId: string;
  status: string;
}

