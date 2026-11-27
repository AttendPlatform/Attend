"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  rsvpEvent,
  cancelEventAttendance,
  getUserEventAttendance,
} from "@/services/attendance.service";
import { dispatchRegistrationReceiptNotification } from "@/services/notifications.service";
import { recordFeaturedMetricForEventIfActive } from "@/services/promotions.service";
import type { EventParticipationType } from "@/types/attendance";

function extractErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  if (
    error &&
    typeof error === "object" &&
    "message" in error &&
    typeof (error as { message?: unknown }).message === "string"
  ) {
    return (error as { message: string }).message;
  }
  return fallback;
}

async function notifyAttendanceConfirmed(params: {
  eventId: string;
  userId: string;
  registrationId: string;
  status: string;
}) {
  try {
    const supabase = await createClient();
    const { data: event } = await supabase
      .from("events")
      .select("title")
      .eq("id", params.eventId)
      .maybeSingle();

    if (!event?.title) return;

    await dispatchRegistrationReceiptNotification({
      userId: params.userId,
      eventId: params.eventId,
      eventTitle: event.title,
      registrationId: params.registrationId,
      status: params.status,
    });
  } catch (err) {
    console.error("Failed to dispatch attendance confirmation notification:", err);
  }
}

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
      revalidatePath(`/events/${eventId}`);
      return { status: "cancelled" };
    }

    const participant = await rsvpEvent({
      eventId,
      userId: user.id,
      participationType: "attendee",
    });

    await notifyAttendanceConfirmed({
      eventId,
      userId: user.id,
      registrationId: participant.id,
      status: participant.status,
    });

    await recordFeaturedMetricForEventIfActive(eventId, "registration").catch(
      () => {}
    );

    if (pathname) revalidatePath(pathname);
    revalidatePath(`/events/${eventId}`);
    return { status: "attending" };
  } catch (error) {
    console.error("toggleAttendanceAction failed:", error);
    return { error: extractErrorMessage(error, "Failed to update attendance.") };
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
    const participant = await rsvpEvent({
      eventId,
      userId: user.id,
      name,
      participationType,
      registrationData,
    });

    await notifyAttendanceConfirmed({
      eventId,
      userId: user.id,
      registrationId: participant.id,
      status: participant.status,
    });

    await recordFeaturedMetricForEventIfActive(eventId, "registration").catch(
      () => {}
    );

    if (pathname) revalidatePath(pathname);
    revalidatePath(`/events/${eventId}`);
    return { success: true };
  } catch (error) {
    console.error("submitRegistrationAction failed:", error);
    return { error: extractErrorMessage(error, "Failed to submit registration.") };
  }
}
