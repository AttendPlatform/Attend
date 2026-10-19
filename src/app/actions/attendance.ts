"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  rsvpEvent,
  cancelEventAttendance,
  getUserEventAttendance,
} from "@/services/attendance.service";
import type { EventParticipationType } from "@/types/attendance";

export async function toggleAttendanceAction(
  eventId: string,
  pathname?: string
): Promise<{
  status?: "attending" | "cancelled";
  requiresLogin?: boolean;
  error?: string;
}> {
  if (!eventId?.trim()) {
    return { error: "Invalid event." };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { requiresLogin: true };
  }

  try {
    const existing = await getUserEventAttendance(eventId, user.id);
    const isCurrentlyAttending =
      existing && existing.status !== "cancelled";

    if (isCurrentlyAttending) {
      await cancelEventAttendance(eventId, user.id);
      if (pathname) revalidatePath(pathname);
      return { status: "cancelled" };
    }

    await rsvpEvent({
      eventId,
      userId: user.id,
      participationType: "attendee",
    });

    if (pathname) revalidatePath(pathname);
    return { status: "attending" };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to update attendance.";
    return { error: message };
  }
}

export async function submitRegistrationAction(params: {
  eventId: string;
  name?: string;
  participationType?: EventParticipationType;
  registrationData?: Record<string, unknown>;
  pathname?: string;
}): Promise<{ success?: boolean; requiresLogin?: boolean; error?: string }> {
  const { eventId, name, participationType = "registrant", registrationData = {}, pathname } = params;

  if (!eventId?.trim()) {
    return { error: "Invalid event." };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { requiresLogin: true };
  }

  try {
    await rsvpEvent({
      eventId,
      userId: user.id,
      name,
      participationType,
      registrationData,
    });

    if (pathname) revalidatePath(pathname);
    return { success: true };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to submit registration.";
    return { error: message };
  }
}
