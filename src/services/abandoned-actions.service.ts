import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/lib/supabase/database.types";
import type {
  AbandonedActionRecord,
  AbandonedActionStatus,
  AbandonedActionType,
} from "@/types/notifications";
import {
  buildRecoveryDedupeKeysForAction,
  evaluateAbandonedActionEligibility,
  validateAbandonedActionProgress,
} from "@/lib/notifications/recovery-rules";
import { dispatchSmartNotification } from "@/lib/notifications/engine";

type TypedSupabaseClient = SupabaseClient<Database>;

export interface UpsertAbandonedActionInput {
  userId: string;
  actionType: AbandonedActionType;
  eventId?: string | null;
  campaignId?: string | null;
  draftTitle?: string | null;
  draftPayload?: Record<string, unknown>;
  resumeUrl: string;
  lastProgressedAt?: string;
}

export interface UpsertAbandonedActionResult {
  ok: boolean;
  skipped?: boolean;
  reason?: string | null;
  action?: AbandonedActionRecord | null;
}

export interface CompleteOrDismissTarget {
  userId: string;
  actionId?: string;
  actionType?: AbandonedActionType;
  eventId?: string | null;
  campaignId?: string | null;
}

export interface ProcessAbandonedRemindersResult {
  syncedEventDrafts: number;
  syncedCampaignDrafts: number;
  evaluated: number;
  sent: number;
  suppressed: number;
  errors: number;
}

const DEFAULT_STAGE_1_CUTOFF_MS = 24 * 60 * 60 * 1000;

function toJson(value: Record<string, unknown>): Json {
  return value as Json;
}

function mapRowToRecord(
  row: Database["public"]["Tables"]["abandoned_actions"]["Row"]
): AbandonedActionRecord {
  return {
    id: row.id,
    user_id: row.user_id,
    action_type: row.action_type as AbandonedActionType,
    event_id: row.event_id,
    campaign_id: row.campaign_id,
    draft_title: row.draft_title,
    draft_payload:
      row.draft_payload &&
      typeof row.draft_payload === "object" &&
      !Array.isArray(row.draft_payload)
        ? (row.draft_payload as Record<string, unknown>)
        : {},
    resume_url: row.resume_url,
    last_progressed_at: row.last_progressed_at,
    reminder_stage: row.reminder_stage,
    last_reminded_at: row.last_reminded_at,
    recovered_at: row.recovered_at,
    status: row.status as AbandonedActionStatus,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

async function findExistingAction(
  supabase: TypedSupabaseClient,
  userId: string,
  actionType: AbandonedActionType,
  eventId?: string | null,
  campaignId?: string | null
) {
  let query = supabase
    .from("abandoned_actions")
    .select("*")
    .eq("user_id", userId)
    .eq("action_type", actionType);

  query = eventId ? query.eq("event_id", eventId) : query.is("event_id", null);
  query = campaignId
    ? query.eq("campaign_id", campaignId)
    : query.is("campaign_id", null);

  const { data, error } = await query.maybeSingle();
  if (error) {
    throw error;
  }
  return data;
}

export async function suppressScheduledRecoveryNotifications(
  supabase: TypedSupabaseClient,
  userId: string,
  actionIds: string[]
): Promise<void> {
  if (actionIds.length === 0) return;

  const dedupeKeys = actionIds.flatMap((id) =>
    buildRecoveryDedupeKeysForAction(id)
  );
  if (dedupeKeys.length === 0) return;

  const { error } = await supabase
    .from("notifications")
    .update({ status: "suppressed" })
    .eq("user_id", userId)
    .eq("status", "scheduled")
    .in("dedupe_key", dedupeKeys);

  if (error) {
    console.error(
      "[abandoned-actions] Failed to suppress scheduled recovery notifications:",
      error
    );
  }
}

async function updateActionLifecycleStatus(
  supabase: TypedSupabaseClient,
  target: CompleteOrDismissTarget,
  nextStatus: "completed" | "dismissed"
): Promise<{ updatedIds: string[] }> {
  const nowIso = new Date().toISOString();

  let query = supabase
    .from("abandoned_actions")
    .select("id")
    .eq("user_id", target.userId)
    .in("status", ["active", "recovered"]);

  if (target.actionId) {
    query = query.eq("id", target.actionId);
  } else {
    if (target.actionType) {
      query = query.eq("action_type", target.actionType);
    }
    if (target.eventId !== undefined) {
      query = target.eventId
        ? query.eq("event_id", target.eventId)
        : query.is("event_id", null);
    }
    if (target.campaignId !== undefined) {
      query = target.campaignId
        ? query.eq("campaign_id", target.campaignId)
        : query.is("campaign_id", null);
    }
  }

  const { data: matchingRows, error: selectError } = await query;
  if (selectError) {
    throw selectError;
  }

  const ids = (matchingRows ?? []).map((row) => row.id);
  if (ids.length === 0) {
    return { updatedIds: [] };
  }

  const updatePayload: Database["public"]["Tables"]["abandoned_actions"]["Update"] =
    {
      status: nextStatus,
      updated_at: nowIso,
      ...(nextStatus === "completed" ? { recovered_at: nowIso } : {}),
    };

  const { error: updateError } = await supabase
    .from("abandoned_actions")
    .update(updatePayload)
    .eq("user_id", target.userId)
    .in("id", ids);

  if (updateError) {
    throw updateError;
  }

  await suppressScheduledRecoveryNotifications(supabase, target.userId, ids);
  return { updatedIds: ids };
}

export async function upsertAbandonedAction(
  supabase: TypedSupabaseClient,
  input: UpsertAbandonedActionInput
): Promise<UpsertAbandonedActionResult> {
  const draftPayload = input.draftPayload ?? {};
  const progressCheck = validateAbandonedActionProgress({
    actionType: input.actionType,
    draftTitle: input.draftTitle ?? null,
    draftPayload,
  });

  if (!progressCheck.meaningful) {
    return {
      ok: false,
      skipped: true,
      reason: progressCheck.reason,
      action: null,
    };
  }

  const nowIso = input.lastProgressedAt ?? new Date().toISOString();
  const existing = await findExistingAction(
    supabase,
    input.userId,
    input.actionType,
    input.eventId,
    input.campaignId
  );

  if (existing) {
    const { data, error } = await supabase
      .from("abandoned_actions")
      .update({
        draft_title: input.draftTitle ?? existing.draft_title,
        draft_payload: toJson(draftPayload),
        resume_url: input.resumeUrl,
        last_progressed_at: nowIso,
        status: "active",
        recovered_at: null,
        updated_at: nowIso,
      })
      .eq("id", existing.id)
      .eq("user_id", input.userId)
      .select("*")
      .single();

    if (error) {
      throw error;
    }

    return { ok: true, action: mapRowToRecord(data) };
  }

  const { data, error } = await supabase
    .from("abandoned_actions")
    .insert({
      user_id: input.userId,
      action_type: input.actionType,
      event_id: input.eventId ?? null,
      campaign_id: input.campaignId ?? null,
      draft_title: input.draftTitle ?? null,
      draft_payload: toJson(draftPayload),
      resume_url: input.resumeUrl,
      last_progressed_at: nowIso,
      reminder_stage: 0,
      status: "active",
    })
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return { ok: true, action: mapRowToRecord(data) };
}

export async function completeAbandonedAction(
  supabase: TypedSupabaseClient,
  target: CompleteOrDismissTarget
): Promise<{ updatedIds: string[] }> {
  return updateActionLifecycleStatus(supabase, target, "completed");
}

export async function dismissAbandonedAction(
  supabase: TypedSupabaseClient,
  target: CompleteOrDismissTarget
): Promise<{ updatedIds: string[] }> {
  return updateActionLifecycleStatus(supabase, target, "dismissed");
}

export async function listActiveAbandonedActions(
  supabase: TypedSupabaseClient,
  userId: string
): Promise<AbandonedActionRecord[]> {
  const { data, error } = await supabase
    .from("abandoned_actions")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "active")
    .order("last_progressed_at", { ascending: false })
    .limit(20);

  if (error) {
    throw error;
  }

  return (data ?? []).map(mapRowToRecord);
}

export async function getAbandonedActionById(
  supabase: TypedSupabaseClient,
  userId: string,
  actionId: string
): Promise<AbandonedActionRecord | null> {
  const { data, error } = await supabase
    .from("abandoned_actions")
    .select("*")
    .eq("id", actionId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ? mapRowToRecord(data) : null;
}

export async function syncDatabaseDraftsToAbandonedActions(
  supabaseAdmin: TypedSupabaseClient,
  now = new Date()
): Promise<{ syncedEventDrafts: number; syncedCampaignDrafts: number }> {
  const cutoffIso = new Date(
    now.getTime() - DEFAULT_STAGE_1_CUTOFF_MS
  ).toISOString();

  let syncedEventDrafts = 0;
  let syncedCampaignDrafts = 0;

  const { data: draftEvents, error: eventsError } = await supabaseAdmin
    .from("events")
    .select("id, creator_id, title, updated_at")
    .eq("status", "draft")
    .lte("updated_at", cutoffIso)
    .limit(100);

  if (eventsError) {
    console.error("[abandoned-actions] Failed to query draft events:", eventsError);
  } else {
    for (const draft of draftEvents ?? []) {
      const existing = await findExistingAction(
        supabaseAdmin,
        draft.creator_id,
        "event_draft",
        draft.id,
        null
      );
      if (existing) continue;

      const result = await upsertAbandonedAction(supabaseAdmin, {
        userId: draft.creator_id,
        actionType: "event_draft",
        eventId: draft.id,
        draftTitle: draft.title,
        draftPayload: { title: draft.title },
        resumeUrl: `/dashboard/events/${draft.id}`,
        lastProgressedAt: draft.updated_at,
      });
      if (result.ok) {
        syncedEventDrafts += 1;
      }
    }
  }

  const { data: draftCampaigns, error: campaignsError } = await supabaseAdmin
    .from("campaigns")
    .select("id, creator_id, title, slug, updated_at")
    .eq("status", "draft")
    .lte("updated_at", cutoffIso)
    .limit(100);

  if (campaignsError) {
    console.error(
      "[abandoned-actions] Failed to query draft campaigns:",
      campaignsError
    );
  } else {
    for (const draft of draftCampaigns ?? []) {
      const existing = await findExistingAction(
        supabaseAdmin,
        draft.creator_id,
        "campaign_draft",
        null,
        draft.id
      );
      if (existing) continue;

      const result = await upsertAbandonedAction(supabaseAdmin, {
        userId: draft.creator_id,
        actionType: "campaign_draft",
        campaignId: draft.id,
        draftTitle: draft.title,
        draftPayload: { title: draft.title },
        resumeUrl: draft.slug ? `/campaign/${draft.slug}` : "/create",
        lastProgressedAt: draft.updated_at,
      });
      if (result.ok) {
        syncedCampaignDrafts += 1;
      }
    }
  }

  return { syncedEventDrafts, syncedCampaignDrafts };
}

function resolveNotificationTypeForAction(actionType: AbandonedActionType): string {
  switch (actionType) {
    case "campaign_draft":
      return "abandoned_campaign_draft";
    case "incomplete_registration":
      return "abandoned_registration";
    default:
      return "abandoned_event_draft";
  }
}

export async function processAbandonedActionReminders(
  supabaseAdmin: TypedSupabaseClient,
  now = new Date()
): Promise<ProcessAbandonedRemindersResult> {
  const syncStats = await syncDatabaseDraftsToAbandonedActions(
    supabaseAdmin,
    now
  );

  const result: ProcessAbandonedRemindersResult = {
    syncedEventDrafts: syncStats.syncedEventDrafts,
    syncedCampaignDrafts: syncStats.syncedCampaignDrafts,
    evaluated: 0,
    sent: 0,
    suppressed: 0,
    errors: 0,
  };

  const { data: activeRows, error } = await supabaseAdmin
    .from("abandoned_actions")
    .select("*")
    .eq("status", "active")
    .lt("reminder_stage", 2)
    .order("last_progressed_at", { ascending: true })
    .limit(200);

  if (error) {
    console.error("[abandoned-actions] Failed to load active actions:", error);
    return { ...result, errors: result.errors + 1 };
  }

  for (const row of activeRows ?? []) {
    result.evaluated += 1;
    const action = mapRowToRecord(row);

    try {
      const eligibility = await evaluateAbandonedActionEligibility(
        supabaseAdmin,
        action,
        { now }
      );

      if (!eligibility.eligible) {
        if (eligibility.shouldSuppress && eligibility.suppressionStatus) {
          const nowIso = now.toISOString();
          await supabaseAdmin
            .from("abandoned_actions")
            .update({
              status: eligibility.suppressionStatus,
              updated_at: nowIso,
              ...(eligibility.suppressionStatus === "completed"
                ? { recovered_at: nowIso }
                : {}),
            })
            .eq("id", action.id);

          await suppressScheduledRecoveryNotifications(
            supabaseAdmin,
            action.user_id,
            [action.id]
          );
          result.suppressed += 1;
        }
        continue;
      }

      if (!eligibility.copy || !eligibility.dedupeKey || !eligibility.nextStage) {
        continue;
      }

      const actionUrl =
        action.action_type === "event_draft" &&
        !action.event_id &&
        action.resume_url === "/create"
          ? `/create?resumeDraft=${action.id}`
          : action.resume_url;

      const dispatchResult = await dispatchSmartNotification({
        userId: action.user_id,
        type: resolveNotificationTypeForAction(action.action_type),
        category: "reminders",
        presentationFormat: "reminder",
        priority: "normal",
        title: eligibility.copy.title,
        message: eligibility.copy.message,
        actionUrl,
        actionLabel: eligibility.copy.actionLabel,
        eventId: action.event_id,
        campaignId: action.campaign_id,
        dedupeKey: eligibility.dedupeKey,
        metadata: {
          abandoned_action_id: action.id,
          action_type: action.action_type,
          reminder_stage: eligibility.nextStage,
        },
        supabaseClient: supabaseAdmin,
      });

      if (dispatchResult) {
        await supabaseAdmin
          .from("abandoned_actions")
          .update({
            reminder_stage: eligibility.nextStage,
            last_reminded_at: now.toISOString(),
            updated_at: now.toISOString(),
          })
          .eq("id", action.id);
        result.sent += 1;
      }
    } catch (err) {
      console.error(
        `[abandoned-actions] Error processing action ${action.id}:`,
        err
      );
      result.errors += 1;
    }
  }

  return result;
}
