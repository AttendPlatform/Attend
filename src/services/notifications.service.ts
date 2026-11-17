"use server";

import { createClient } from "@/lib/supabase/server";
import { dispatchSmartNotification } from "@/lib/notifications/engine";
import type { RecipientEligibilityContext } from "@/types/notifications";
import type {
  EventUpdatedNotificationPayload,
  CampaignCreatedNotificationPayload,
  RegistrationReceiptPayload,
  EventCancelledNotificationPayload,
} from "@/types/dashboard";

export interface LifecycleNotificationResult {
  success: boolean;
  dispatchedCount: number;
  recipientIds: string[];
}

export async function createNotificationRecord(params: {
  userId: string;
  type: string;
  category: string;
  title: string;
  message: string;
  actionUrl?: string | null;
  actionLabel?: string | null;
  eventId?: string | null;
  campaignId?: string | null;
  metadata?: Record<string, unknown>;
  dedupeKey?: string | null;
  priority?: "low" | "normal" | "high" | "urgent";
  recipientContext?: RecipientEligibilityContext;
}): Promise<boolean> {
  const notification = await dispatchSmartNotification(params);
  return notification !== null;
}

export async function dispatchDateOrVenueChangeNotification(
  payload: EventUpdatedNotificationPayload & { actorId?: string }
): Promise<LifecycleNotificationResult> {
  const supabase = await createClient();

  const { data: attendees, error } = await supabase
    .from("event_participants")
    .select("user_id")
    .eq("event_id", payload.eventId)
    .in("status", ["attending", "registered", "ticketed"]);

  if (error) {
    console.error("Failed to fetch attendees for event update notification:", error);
    return { success: false, dispatchedCount: 0, recipientIds: [] };
  }

  const rawUserIds = (attendees || [])
    .map((a) => a.user_id)
    .filter((id): id is string => Boolean(id) && id !== payload.actorId);

  const recipientIds = Array.from(new Set(rawUserIds));

  if (recipientIds.length === 0) {
    return { success: true, dispatchedCount: 0, recipientIds: [] };
  }

  const changesDescription =
    payload.changes.length > 0
      ? payload.changes.join(", ")
      : "Schedule or location details were updated.";

  const message = `Important update for "${payload.eventTitle}": ${changesDescription}. Please review the updated schedule and venue details.`;

  let dispatchedCount = 0;

  for (const userId of recipientIds) {
    const success = await createNotificationRecord({
      userId,
      type: "event_update",
      category: "event_lifecycle",
      title: `Update: ${payload.eventTitle}`,
      message,
      actionUrl: `/events/${payload.eventId}`,
      actionLabel: "View event details",
      eventId: payload.eventId,
      priority: "high",
      metadata: {
        event_id: payload.eventId,
        changes: payload.changes,
        new_start_at: payload.newStartAt,
        new_venue: payload.newVenue,
      },
      dedupeKey: `event-${payload.eventId}-update-${payload.newStartAt || ""}-${payload.newVenue || ""}-${userId}`,
      recipientContext: { userId, eventId: payload.eventId, roleRequired: "attendee" },
    });

    if (success) {
      dispatchedCount += 1;
    }
  }

  return {
    success: true,
    dispatchedCount,
    recipientIds,
  };
}

export async function dispatchCampaignCreatedNotification(
  payload: CampaignCreatedNotificationPayload
): Promise<LifecycleNotificationResult> {
  const supabase = await createClient();

  const [eventRes, organizersRes] = await Promise.all([
    supabase
      .from("events")
      .select("creator_id")
      .eq("id", payload.eventId)
      .maybeSingle(),
    supabase
      .from("event_organizers")
      .select("user_id")
      .eq("event_id", payload.eventId),
  ]);

  const candidateIds: string[] = [];

  if (eventRes.data?.creator_id) {
    candidateIds.push(eventRes.data.creator_id);
  }

  if (organizersRes.data) {
    for (const org of organizersRes.data) {
      if (org.user_id) candidateIds.push(org.user_id);
    }
  }

  const recipientIds = Array.from(
    new Set(candidateIds.filter((id) => id !== payload.creatorId))
  );

  if (recipientIds.length === 0) {
    return { success: true, dispatchedCount: 0, recipientIds: [] };
  }

  const creatorName = payload.creatorName?.trim() || "A participant";
  const message = `${creatorName} created a new promotional campaign "${payload.campaignTitle}" under your event "${payload.eventTitle}".`;

  let dispatchedCount = 0;

  for (const userId of recipientIds) {
    const success = await createNotificationRecord({
      userId,
      type: "campaign_created",
      category: "campaign_activity",
      title: `New campaign for ${payload.eventTitle}`,
      message,
      actionUrl: `/campaign/${payload.campaignId}`,
      actionLabel: "View campaign",
      eventId: payload.eventId,
      campaignId: payload.campaignId,
      priority: "normal",
      metadata: {
        campaign_id: payload.campaignId,
        campaign_title: payload.campaignTitle,
        event_id: payload.eventId,
        creator_id: payload.creatorId,
      },
      dedupeKey: `campaign-${payload.campaignId}-created-${userId}`,
      recipientContext: { userId, eventId: payload.eventId, roleRequired: "organizer" },
    });

    if (success) {
      dispatchedCount += 1;
    }
  }

  return {
    success: true,
    dispatchedCount,
    recipientIds,
  };
}

export async function dispatchRegistrationReceiptNotification(
  payload: RegistrationReceiptPayload
): Promise<boolean> {
  const message = `Your registration for "${payload.eventTitle}" is confirmed. Check your event details and schedule anytime.`;

  return createNotificationRecord({
    userId: payload.userId,
    type: "registration_receipt",
    category: "event_receipt",
    title: `Registration confirmed: ${payload.eventTitle}`,
    message,
    actionUrl: `/events/${payload.eventId}`,
    actionLabel: "View event details",
    eventId: payload.eventId,
    priority: "high",
    metadata: {
      event_id: payload.eventId,
      registration_id: payload.registrationId,
      status: payload.status,
    },
    dedupeKey: `receipt-${payload.eventId}-${payload.userId}`,
    recipientContext: { userId: payload.userId, eventId: payload.eventId, roleRequired: "attendee" },
  });
}

export async function dispatchEventCancelledNotification(
  payload: EventCancelledNotificationPayload
): Promise<LifecycleNotificationResult> {
  const supabase = await createClient();

  const { data: attendees, error } = await supabase
    .from("event_participants")
    .select("user_id")
    .eq("event_id", payload.eventId)
    .in("status", ["attending", "registered", "ticketed"]);

  if (error) {
    console.error("Failed to fetch attendees for event cancellation notification:", error);
    return { success: false, dispatchedCount: 0, recipientIds: [] };
  }

  const rawUserIds = (attendees || [])
    .map((a) => a.user_id)
    .filter((id): id is string => Boolean(id) && id !== payload.actorId);

  const recipientIds = Array.from(new Set(rawUserIds));

  if (recipientIds.length === 0) {
    return { success: true, dispatchedCount: 0, recipientIds: [] };
  }

  const reasonSuffix = payload.reason ? ` Reason: ${payload.reason}` : "";
  const message = `The event "${payload.eventTitle}" has been cancelled by the organizer. Confirmed registrations are closed. Any campaign graphics created remain preserved.${reasonSuffix}`;

  let dispatchedCount = 0;

  for (const userId of recipientIds) {
    const success = await createNotificationRecord({
      userId,
      type: "event_cancelled",
      category: "event_lifecycle",
      title: `Cancelled: ${payload.eventTitle}`,
      message,
      actionUrl: `/events/${payload.eventId}`,
      actionLabel: "View event notice",
      eventId: payload.eventId,
      priority: "urgent",
      metadata: {
        event_id: payload.eventId,
        reason: payload.reason || null,
      },
      dedupeKey: `event-${payload.eventId}-cancelled-${userId}`,
      recipientContext: { userId, eventId: payload.eventId, roleRequired: "attendee" },
    });

    if (success) {
      dispatchedCount += 1;
    }
  }

  return {
    success: true,
    dispatchedCount,
    recipientIds,
  };
}


