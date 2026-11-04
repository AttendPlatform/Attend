"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getOrganizerAccess } from "@/services/events.service";

export interface UpdateEventDetailsInput {
  title?: string;
  description?: string | null;
  start_at?: string;
  end_at?: string | null;
  venue_name?: string | null;
  city?: string | null;
  is_online?: boolean;
  allow_participant_campaigns?: boolean;
}

export async function updateEventDetailsAction(
  eventId: string,
  input: UpdateEventDetailsInput
): Promise<{ success: boolean; error?: string }> {
  if (!eventId) return { success: false, error: "Event ID is required." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "Authentication required." };

  const access = await getOrganizerAccess(eventId, user.id, supabase);
  if (!access.isOrganizer) {
    return { success: false, error: "Unauthorized." };
  }

  const { error } = await supabase
    .from("events")
    .update({
      ...(input.title !== undefined && { title: input.title.trim() }),
      ...(input.description !== undefined && {
        description: input.description?.trim() || null,
      }),
      ...(input.start_at !== undefined && { start_at: input.start_at }),
      ...(input.end_at !== undefined && { end_at: input.end_at || null }),
      ...(input.venue_name !== undefined && {
        venue_name: input.venue_name?.trim() || null,
      }),
      ...(input.city !== undefined && { city: input.city?.trim() || null }),
      ...(input.is_online !== undefined && {
        is_online: Boolean(input.is_online),
      }),
      ...(input.allow_participant_campaigns !== undefined && {
        allow_participant_campaigns: Boolean(input.allow_participant_campaigns),
      }),
      updated_at: new Date().toISOString(),
    })
    .eq("id", eventId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath(`/dashboard/events/${eventId}`);
  revalidatePath(`/events/${eventId}`);
  return { success: true };
}

export async function toggleCampaignStatusAction(
  eventId: string,
  campaignId: string,
  newStatus: "published" | "paused"
): Promise<{ success: boolean; error?: string }> {
  if (!eventId || !campaignId) {
    return { success: false, error: "Invalid parameters." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "Authentication required." };

  const access = await getOrganizerAccess(eventId, user.id, supabase);
  if (!access.isOrganizer) {
    return { success: false, error: "Unauthorized." };
  }

  const { error } = await supabase
    .from("campaigns")
    .update({ status: newStatus, updated_at: new Date().toISOString() })
    .eq("id", campaignId)
    .eq("event_id", eventId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath(`/dashboard/events/${eventId}`);
  revalidatePath(`/campaigns`);
  return { success: true };
}

export async function cancelEventAction(
  eventId: string
): Promise<{ success: boolean; error?: string }> {
  if (!eventId) return { success: false, error: "Event ID is required." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "Authentication required." };

  const access = await getOrganizerAccess(eventId, user.id, supabase);
  if (!access.isOrganizer) {
    return { success: false, error: "Unauthorized." };
  }

  const { error } = await supabase
    .from("events")
    .update({ status: "cancelled", updated_at: new Date().toISOString() })
    .eq("id", eventId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath(`/dashboard/events/${eventId}`);
  revalidatePath(`/events/${eventId}`);
  return { success: true };
}

