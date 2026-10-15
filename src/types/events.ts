import type { Database } from "@/lib/supabase/database.types";

export type ParticipationModel =
  Database["public"]["Enums"]["participation_model"];

export type EventStatus = Database["public"]["Enums"]["event_status"];

export interface FreeParticipationConfig {
  type?: "free";
}

export interface RegistrationParticipationConfig {
  require_approval?: boolean;
  questions?: string[];
  max_attendees?: number | null;
  registration_deadline?: string | null;
}

export interface PaidParticipationConfig {
  ticket_price: number;
  currency: string;
  max_tickets?: number | null;
  ticket_tier_name?: string;
  refund_policy?: string | null;
}

export interface ExternalParticipationConfig {
  external_ticket_url: string;
  external_provider_name?: string | null;
}

export type ParticipationConfig =
  | FreeParticipationConfig
  | RegistrationParticipationConfig
  | PaidParticipationConfig
  | ExternalParticipationConfig
  | Record<string, unknown>;

export interface EventCreationValidationResult {
  valid: boolean;
  errors: string[];
}
