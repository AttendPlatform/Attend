"use server";

import { createClient } from "@/lib/supabase/server";
import type {
  AbandonedActionRecord,
  AbandonedActionType,
} from "@/types/notifications";
import {
  completeAbandonedAction,
  dismissAbandonedAction,
  getAbandonedActionById,
  listActiveAbandonedActions,
  upsertAbandonedAction,
} from "@/services/abandoned-actions.service";

export interface SaveAbandonedActionPayload {
  actionType: AbandonedActionType;
  eventId?: string | null;
  campaignId?: string | null;
  draftTitle?: string | null;
  draftPayload?: Record<string, unknown>;
  resumeUrl: string;
}

export interface CompleteAbandonedActionPayload {
  actionId?: string;
  actionType?: AbandonedActionType;
  eventId?: string | null;
  campaignId?: string | null;
}

export async function saveAbandonedActionAction(
  payload: SaveAbandonedActionPayload
): Promise<{
  ok: boolean;
  skipped?: boolean;
  action?: AbandonedActionRecord | null;
  error?: string;
}> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { ok: false, error: "Authentication required" };
    }

    const result = await upsertAbandonedAction(supabase, {
      userId: user.id,
      actionType: payload.actionType,
      eventId: payload.eventId ?? null,
      campaignId: payload.campaignId ?? null,
      draftTitle: payload.draftTitle ?? null,
      draftPayload: payload.draftPayload ?? {},
      resumeUrl: payload.resumeUrl,
    });

    return {
      ok: result.ok,
      skipped: result.skipped,
      action: result.action,
    };
  } catch (error) {
    console.error("[abandoned-actions] saveAbandonedActionAction failed:", error);
    return {
      ok: false,
      error:
        error instanceof Error ? error.message : "Failed to save draft state",
    };
  }
}

export async function completeAbandonedActionAction(
  payload: CompleteAbandonedActionPayload
): Promise<{ ok: boolean; updatedIds: string[]; error?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { ok: false, updatedIds: [], error: "Authentication required" };
    }

    const result = await completeAbandonedAction(supabase, {
      userId: user.id,
      actionId: payload.actionId,
      actionType: payload.actionType,
      eventId: payload.eventId,
      campaignId: payload.campaignId,
    });

    return { ok: true, updatedIds: result.updatedIds };
  } catch (error) {
    console.error(
      "[abandoned-actions] completeAbandonedActionAction failed:",
      error
    );
    return {
      ok: false,
      updatedIds: [],
      error:
        error instanceof Error
          ? error.message
          : "Failed to complete abandoned action",
    };
  }
}

export async function dismissAbandonedActionAction(
  actionId: string
): Promise<{ ok: boolean; updatedIds: string[]; error?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { ok: false, updatedIds: [], error: "Authentication required" };
    }

    const result = await dismissAbandonedAction(supabase, {
      userId: user.id,
      actionId,
    });

    return { ok: true, updatedIds: result.updatedIds };
  } catch (error) {
    console.error(
      "[abandoned-actions] dismissAbandonedActionAction failed:",
      error
    );
    return {
      ok: false,
      updatedIds: [],
      error:
        error instanceof Error
          ? error.message
          : "Failed to dismiss abandoned action",
    };
  }
}

export async function getActiveAbandonedActionsAction(): Promise<{
  ok: boolean;
  actions: AbandonedActionRecord[];
  error?: string;
}> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { ok: true, actions: [] };
    }

    const actions = await listActiveAbandonedActions(supabase, user.id);
    return { ok: true, actions };
  } catch (error) {
    console.error(
      "[abandoned-actions] getActiveAbandonedActionsAction failed:",
      error
    );
    return {
      ok: false,
      actions: [],
      error:
        error instanceof Error
          ? error.message
          : "Failed to load saved drafts",
    };
  }
}

export async function getAbandonedActionByIdAction(actionId: string): Promise<{
  ok: boolean;
  action: AbandonedActionRecord | null;
  error?: string;
}> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { ok: false, action: null, error: "Authentication required" };
    }

    const action = await getAbandonedActionById(supabase, user.id, actionId);
    return { ok: true, action };
  } catch (error) {
    console.error(
      "[abandoned-actions] getAbandonedActionByIdAction failed:",
      error
    );
    return {
      ok: false,
      action: null,
      error:
        error instanceof Error ? error.message : "Failed to load saved draft",
    };
  }
}
