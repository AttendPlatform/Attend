import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import type {
  AbandonedActionRecord,
  AbandonedActionType,
} from "@/types/notifications";

export const DEFAULT_RECOVERY_STAGE_1_DELAY_HOURS = 24;
export const DEFAULT_RECOVERY_STAGE_2_DELAY_HOURS = 72;
export const DEFAULT_MAX_RECOVERY_REMINDERS = 2;
export const ACTIVE_EDITING_GUARD_MINUTES = 30;

export const ACTIVE_PARTICIPANT_STATUSES = [
  "attending",
  "registered",
  "ticketed",
] as const;

export const BLOCKED_SURVEILLANCE_PHRASES = [
  "noticed you left",
  "stopped halfway",
  "saw you browsing",
  "inactive for",
  "watching",
  "we noticed you",
  "we saw you",
  "tracking your activity",
] as const;

export interface RecoveryCopyValidationResult {
  valid: boolean;
  matchedPhrases: string[];
  reason: string | null;
}

export interface RecoveryNotificationCopy {
  templateType: string;
  title: string;
  message: string;
  actionLabel: string;
}

export interface AbandonedProgressCheckInput {
  actionType: AbandonedActionType;
  draftTitle?: string | null;
  draftPayload?: Record<string, unknown> | null;
}

export interface AbandonedProgressCheckResult {
  meaningful: boolean;
  reason: string | null;
}

export interface RecoveryTimingConfig {
  enabled?: boolean;
  stage1DelayHours?: number;
  stage2DelayHours?: number;
  maxReminders?: number;
  activeEditingGuardMinutes?: number;
}

export interface RecoveryTimingEvaluation {
  eligible: boolean;
  shouldSuppress: boolean;
  nextStage: 1 | 2 | null;
  reason: string | null;
}

export type AbandonedSuppressionStatus = "completed" | "suppressed";

export interface IncompleteRegistrationLiveContext {
  hasActiveParticipation: boolean;
  event: {
    id: string;
    title: string;
    status: string;
    start_at: string;
    participation_model: string;
    participation_config?: Record<string, unknown> | null;
  } | null;
  activeParticipantCount: number;
  draftPayload?: Record<string, unknown> | null;
}

export interface RegistrationEligibilityResult {
  eligible: boolean;
  shouldSuppress: boolean;
  suppressionStatus: AbandonedSuppressionStatus | null;
  reason: string | null;
}

export interface AbandonedActionEligibilityResult {
  eligible: boolean;
  shouldSuppress: boolean;
  suppressionStatus: AbandonedSuppressionStatus | null;
  nextStage: 1 | 2 | null;
  reason: string | null;
  copy: RecoveryNotificationCopy | null;
  dedupeKey: string | null;
}

function hasNonEmptyText(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function asPlainRecord(
  value: Record<string, unknown> | null | undefined
): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }
  return value;
}

function hasNonEmptyAnswerValue(value: unknown): boolean {
  if (hasNonEmptyText(value)) {
    return true;
  }
  if (typeof value === "number") {
    return Number.isFinite(value);
  }
  if (typeof value === "boolean") {
    return value;
  }
  if (Array.isArray(value)) {
    return value.some((item) => hasNonEmptyAnswerValue(item));
  }
  return false;
}

function hasNonEmptyAnswers(value: unknown): boolean {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }
  return Object.values(value).some((entry) => hasNonEmptyAnswerValue(entry));
}

function parsePositiveInteger(value: unknown): number | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }
  return Math.floor(parsed);
}

/**
 * Blocks surveillance-style phrasing in abandoned-action reminder copy.
 */
export function validateRecoveryCopy(
  title: string,
  message: string
): RecoveryCopyValidationResult {
  if (!hasNonEmptyText(title) || !hasNonEmptyText(message)) {
    return {
      valid: false,
      matchedPhrases: [],
      reason: "Recovery notification title and message must be non-empty.",
    };
  }

  const normalized = `${title} ${message}`
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

  const matchedPhrases = BLOCKED_SURVEILLANCE_PHRASES.filter((phrase) =>
    normalized.includes(phrase)
  );

  if (matchedPhrases.length > 0) {
    return {
      valid: false,
      matchedPhrases,
      reason: `Blocked surveillance phrasing detected: ${matchedPhrases.join(", ")}`,
    };
  }

  return {
    valid: true,
    matchedPhrases: [],
    reason: null,
  };
}

/**
 * Returns product-oriented, non-surveillance copy for a given abandoned action type.
 */
export function getRecoveryCopyTemplate(
  actionType: AbandonedActionType,
  options?: { eventTitle?: string | null }
): RecoveryNotificationCopy {
  const rawEventTitle = options?.eventTitle?.replace(/\s+/g, " ").trim();

  const buildCandidate = (eventTitle?: string | null): RecoveryNotificationCopy => {
    switch (actionType) {
      case "event_draft":
      case "unfinished_event_edit":
        return {
          templateType: "abandoned_event_draft",
          title: "Your event draft is saved",
          message:
            "You started creating an event but haven't finished. Pick up where you left off.",
          actionLabel: "Continue editing",
        };
      case "campaign_draft":
        return {
          templateType: "abandoned_campaign_draft",
          title: "Your campaign is ready when you are",
          message:
            "You have an unpublished campaign draft. Complete it whenever you're ready.",
          actionLabel: "Continue campaign",
        };
      case "incomplete_registration":
        return {
          templateType: "abandoned_registration",
          title: "Your registration isn't complete",
          message: eventTitle
            ? `You started registering for ${eventTitle}. Continue where you left off.`
            : "You started registering for this event. Continue where you left off.",
          actionLabel: "Complete registration",
        };
      case "incomplete_profile":
        return {
          templateType: "abandoned_profile",
          title: "Your profile is almost ready",
          message:
            "Add a few details to your profile whenever you're ready.",
          actionLabel: "Complete profile",
        };
    }
  };

  const candidate = buildCandidate(rawEventTitle);
  const validation = validateRecoveryCopy(candidate.title, candidate.message);

  // Fall back to generic phrasing if a user-supplied event title contains a blocked keyword.
  if (!validation.valid && actionType === "incomplete_registration" && rawEventTitle) {
    const safeFallback = buildCandidate(null);
    const fallbackValidation = validateRecoveryCopy(
      safeFallback.title,
      safeFallback.message
    );
    if (fallbackValidation.valid) {
      return safeFallback;
    }
  }

  if (!validation.valid) {
    throw new Error(validation.reason || "Invalid recovery copy template.");
  }

  return candidate;
}

/**
 * Ensures empty or untouched forms are never persisted as abandoned actions.
 */
export function validateAbandonedActionProgress(
  input: AbandonedProgressCheckInput
): AbandonedProgressCheckResult {
  const payload = asPlainRecord(input.draftPayload);

  switch (input.actionType) {
    case "event_draft":
    case "unfinished_event_edit": {
      // Ignore auto-initialized defaults like categoryId, country, or step 1 alone.
      const hasContent =
        hasNonEmptyText(input.draftTitle) ||
        hasNonEmptyText(payload.title) ||
        hasNonEmptyText(payload.description) ||
        hasNonEmptyText(payload.startAt) ||
        hasNonEmptyText(payload.start_at) ||
        hasNonEmptyText(payload.venue_name) ||
        hasNonEmptyText(payload.venueName) ||
        hasNonEmptyText(payload.city) ||
        hasNonEmptyText(payload.online_url) ||
        hasNonEmptyText(payload.onlineUrl);

      return hasContent
        ? { meaningful: true, reason: null }
        : {
            meaningful: false,
            reason: "Empty or untouched event draft cannot be saved as abandoned.",
          };
    }

    case "campaign_draft": {
      const canvasConfig = asPlainRecord(
        payload.canvasConfig as Record<string, unknown> | undefined
      );
      const hasContent =
        hasNonEmptyText(input.draftTitle) ||
        hasNonEmptyText(payload.title) ||
        hasNonEmptyText(payload.name) ||
        hasNonEmptyText(payload.description) ||
        hasNonEmptyText(payload.templateId) ||
        hasNonEmptyText(payload.assetUrl) ||
        hasNonEmptyText(payload.asset_url) ||
        Object.keys(canvasConfig).length > 0;

      return hasContent
        ? { meaningful: true, reason: null }
        : {
            meaningful: false,
            reason: "Empty campaign draft cannot be saved as abandoned.",
          };
    }

    case "incomplete_registration": {
      const hasUserEditsFlag = payload.hasUserEdits === true;
      const prefilledOnly = payload.prefilledOnly === true;
      const hasPrefilledOverride =
        !prefilledOnly &&
        hasUserEditsFlag &&
        (hasNonEmptyText(payload.name) || hasNonEmptyText(payload.email));

      const hasRegistrationDetails =
        hasNonEmptyText(payload.phone) ||
        hasNonEmptyText(payload.organization) ||
        hasNonEmptyText(payload.job_title) ||
        hasNonEmptyText(payload.jobTitle) ||
        hasNonEmptyAnswers(payload.answers) ||
        hasNonEmptyText(payload.ticket_tier_id) ||
        hasNonEmptyText(payload.ticketTierId) ||
        hasNonEmptyText(payload.payment_status) ||
        hasNonEmptyText(payload.paymentStatus) ||
        hasPrefilledOverride;

      return hasRegistrationDetails
        ? { meaningful: true, reason: null }
        : {
            meaningful: false,
            reason:
              "Untouched registration form without user-modified fields cannot be tracked.",
          };
    }

    case "incomplete_profile": {
      const hasProfileProgress =
        hasNonEmptyText(input.draftTitle) ||
        hasNonEmptyText(payload.display_name) ||
        hasNonEmptyText(payload.displayName) ||
        hasNonEmptyText(payload.bio) ||
        hasNonEmptyText(payload.city) ||
        hasNonEmptyText(payload.username);

      return hasProfileProgress
        ? { meaningful: true, reason: null }
        : {
            meaningful: false,
            reason: "Empty profile state cannot be tracked as abandoned.",
          };
    }
  }
}

export function hasMeaningfulAbandonedProgress(
  input: AbandonedProgressCheckInput
): boolean {
  return validateAbandonedActionProgress(input).meaningful;
}

/**
 * Evaluates Stage 1 (24h), Stage 2 (72h), max reminder cap, and 30-minute active-editing guard.
 */
export function evaluateRecoveryTiming(
  action: Pick<
    AbandonedActionRecord,
    "status" | "last_progressed_at" | "reminder_stage" | "last_reminded_at"
  >,
  config?: RecoveryTimingConfig,
  now = new Date()
): RecoveryTimingEvaluation {
  if (config?.enabled === false) {
    return {
      eligible: false,
      shouldSuppress: false,
      nextStage: null,
      reason: "recovery_disabled_by_admin",
    };
  }

  if (action.status !== "active") {
    return {
      eligible: false,
      shouldSuppress: false,
      nextStage: null,
      reason: `action_status_${action.status}`,
    };
  }

  const maxReminders = Math.max(
    1,
    Math.min(
      DEFAULT_MAX_RECOVERY_REMINDERS,
      config?.maxReminders ?? DEFAULT_MAX_RECOVERY_REMINDERS
    )
  );
  const stage1DelayHours = Math.max(
    0,
    config?.stage1DelayHours ?? DEFAULT_RECOVERY_STAGE_1_DELAY_HOURS
  );
  const stage2DelayHours = Math.max(
    stage1DelayHours,
    config?.stage2DelayHours ?? DEFAULT_RECOVERY_STAGE_2_DELAY_HOURS
  );
  const activeEditingGuardMinutes = Math.max(
    ACTIVE_EDITING_GUARD_MINUTES,
    config?.activeEditingGuardMinutes ?? ACTIVE_EDITING_GUARD_MINUTES
  );

  if (action.reminder_stage >= maxReminders) {
    return {
      eligible: false,
      shouldSuppress: true,
      nextStage: null,
      reason: "max_reminders_reached",
    };
  }

  const progressedAtMs = new Date(action.last_progressed_at).getTime();
  if (Number.isNaN(progressedAtMs)) {
    return {
      eligible: false,
      shouldSuppress: false,
      nextStage: null,
      reason: "invalid_last_progressed_at",
    };
  }

  const elapsedMs = now.getTime() - progressedAtMs;
  const activeGuardMs = activeEditingGuardMinutes * 60_000;

  if (elapsedMs < activeGuardMs) {
    return {
      eligible: false,
      shouldSuppress: false,
      nextStage: null,
      reason: "active_editing_guard",
    };
  }

  if (action.reminder_stage === 0) {
    if (elapsedMs < stage1DelayHours * 3_600_000) {
      return {
        eligible: false,
        shouldSuppress: false,
        nextStage: null,
        reason: "stage_1_delay_not_met",
      };
    }

    return {
      eligible: true,
      shouldSuppress: false,
      nextStage: 1,
      reason: null,
    };
  }

  if (action.reminder_stage === 1) {
    if (maxReminders < 2) {
      return {
        eligible: false,
        shouldSuppress: true,
        nextStage: null,
        reason: "max_reminders_reached",
      };
    }

    if (elapsedMs < stage2DelayHours * 3_600_000) {
      return {
        eligible: false,
        shouldSuppress: false,
        nextStage: null,
        reason: "stage_2_delay_not_met",
      };
    }

    if (action.last_reminded_at) {
      const lastRemindedMs = new Date(action.last_reminded_at).getTime();
      if (
        !Number.isNaN(lastRemindedMs) &&
        now.getTime() - lastRemindedMs < activeGuardMs
      ) {
        return {
          eligible: false,
          shouldSuppress: false,
          nextStage: null,
          reason: "recent_reminder_cooldown",
        };
      }
    }

    return {
      eligible: true,
      shouldSuppress: false,
      nextStage: 2,
      reason: null,
    };
  }

  return {
    eligible: false,
    shouldSuppress: true,
    nextStage: null,
    reason: "invalid_reminder_stage",
  };
}

export function extractEventRegistrationCapacity(
  participationModel: string,
  participationConfig?: Record<string, unknown> | null
): number | null {
  const config = asPlainRecord(participationConfig);
  if (participationModel === "paid") {
    return (
      parsePositiveInteger(config.max_tickets) ??
      parsePositiveInteger(config.ticket_capacity)
    );
  }
  return parsePositiveInteger(config.max_attendees);
}

/**
 * Evaluates live participant, event lifecycle, capacity, and paid payment status rules.
 */
export function evaluateIncompleteRegistrationEligibility(
  context: IncompleteRegistrationLiveContext,
  now = new Date()
): RegistrationEligibilityResult {
  if (context.hasActiveParticipation) {
    return {
      eligible: false,
      shouldSuppress: true,
      suppressionStatus: "completed",
      reason: "user_already_registered",
    };
  }

  if (!context.event || context.event.status !== "published") {
    return {
      eligible: false,
      shouldSuppress: true,
      suppressionStatus: "suppressed",
      reason: "event_not_published",
    };
  }

  const startAtMs = new Date(context.event.start_at).getTime();
  if (Number.isNaN(startAtMs) || startAtMs <= now.getTime()) {
    return {
      eligible: false,
      shouldSuppress: true,
      suppressionStatus: "suppressed",
      reason: "event_already_started",
    };
  }

  const capacity = extractEventRegistrationCapacity(
    context.event.participation_model,
    context.event.participation_config
  );
  if (capacity !== null && context.activeParticipantCount >= capacity) {
    return {
      eligible: false,
      shouldSuppress: true,
      suppressionStatus: "suppressed",
      reason: "event_capacity_full",
    };
  }

  if (context.event.participation_model === "paid") {
    const payload = asPlainRecord(context.draftPayload);
    const paymentStatus = String(
      payload.payment_status ?? payload.paymentStatus ?? ""
    )
      .trim()
      .toLowerCase();

    if (
      paymentStatus === "completed" ||
      paymentStatus === "paid" ||
      paymentStatus === "succeeded"
    ) {
      return {
        eligible: false,
        shouldSuppress: true,
        suppressionStatus: "completed",
        reason: "payment_already_completed",
      };
    }

    if (paymentStatus === "pending" || paymentStatus === "processing") {
      return {
        eligible: false,
        shouldSuppress: false,
        suppressionStatus: null,
        reason: "payment_pending",
      };
    }

    if (paymentStatus !== "failed" && paymentStatus !== "expired") {
      return {
        eligible: false,
        shouldSuppress: false,
        suppressionStatus: null,
        reason: "paid_registration_requires_failed_or_expired_payment",
      };
    }
  }

  return {
    eligible: true,
    shouldSuppress: false,
    suppressionStatus: null,
    reason: null,
  };
}

/**
 * Verifies incomplete registration eligibility directly against live Supabase tables.
 */
export async function verifyIncompleteRegistrationAgainstLiveTables(
  supabase: SupabaseClient<Database>,
  action: Pick<
    AbandonedActionRecord,
    "user_id" | "event_id" | "draft_payload"
  >,
  now = new Date()
): Promise<RegistrationEligibilityResult & { eventTitle: string | null }> {
  if (!action.event_id) {
    return {
      eligible: false,
      shouldSuppress: true,
      suppressionStatus: "suppressed",
      reason: "missing_event_id",
      eventTitle: null,
    };
  }

  const [participantRes, eventRes, countRes] = await Promise.all([
    supabase
      .from("event_participants")
      .select("id")
      .eq("event_id", action.event_id)
      .eq("user_id", action.user_id)
      .in("status", [...ACTIVE_PARTICIPANT_STATUSES])
      .limit(1),
    supabase
      .from("events")
      .select(
        "id, title, status, start_at, participation_model, participation_config"
      )
      .eq("id", action.event_id)
      .maybeSingle(),
    supabase
      .from("event_participants")
      .select("id", { count: "exact", head: true })
      .eq("event_id", action.event_id)
      .in("status", [...ACTIVE_PARTICIPANT_STATUSES]),
  ]);

  if (participantRes.error || eventRes.error || countRes.error) {
    return {
      eligible: false,
      shouldSuppress: false,
      suppressionStatus: null,
      reason: "live_verification_query_failed",
      eventTitle: null,
    };
  }

  const eventRow = eventRes.data
    ? {
        id: eventRes.data.id,
        title: eventRes.data.title,
        status: eventRes.data.status,
        start_at: eventRes.data.start_at,
        participation_model: eventRes.data.participation_model,
        participation_config: asPlainRecord(
          eventRes.data.participation_config as Record<string, unknown> | null
        ),
      }
    : null;

  const evaluation = evaluateIncompleteRegistrationEligibility(
    {
      hasActiveParticipation: (participantRes.data?.length ?? 0) > 0,
      event: eventRow,
      activeParticipantCount: countRes.count ?? 0,
      draftPayload: action.draft_payload,
    },
    now
  );

  return {
    ...evaluation,
    eventTitle: eventRow?.title ?? null,
  };
}

export function buildRecoveryDedupeKey(
  actionId: string,
  stage: 1 | 2
): string {
  return `recovery-${actionId}-stage-${stage}`;
}

export function buildRecoveryDedupeKeysForAction(
  actionId: string,
  maxReminders = DEFAULT_MAX_RECOVERY_REMINDERS
): string[] {
  const keys: string[] = [];
  for (let stage = 1; stage <= maxReminders; stage += 1) {
    if (stage === 1 || stage === 2) {
      keys.push(buildRecoveryDedupeKey(actionId, stage));
    }
  }
  return keys;
}

/**
 * Runs complete eligibility checks (meaningful progress, timing, live table state, and safe copy).
 */
export async function evaluateAbandonedActionEligibility(
  supabase: SupabaseClient<Database>,
  action: AbandonedActionRecord,
  options?: { config?: RecoveryTimingConfig; now?: Date }
): Promise<AbandonedActionEligibilityResult> {
  const now = options?.now ?? new Date();

  const progressCheck = validateAbandonedActionProgress({
    actionType: action.action_type,
    draftTitle: action.draft_title,
    draftPayload: action.draft_payload,
  });

  if (!progressCheck.meaningful) {
    return {
      eligible: false,
      shouldSuppress: true,
      suppressionStatus: "suppressed",
      nextStage: null,
      reason: progressCheck.reason,
      copy: null,
      dedupeKey: null,
    };
  }

  const timing = evaluateRecoveryTiming(action, options?.config, now);
  if (!timing.eligible || !timing.nextStage) {
    return {
      eligible: false,
      shouldSuppress: timing.shouldSuppress,
      suppressionStatus: timing.shouldSuppress ? "suppressed" : null,
      nextStage: null,
      reason: timing.reason,
      copy: null,
      dedupeKey: null,
    };
  }

  let eventTitle = action.draft_title;

  if (action.action_type === "incomplete_registration") {
    const registrationCheck =
      await verifyIncompleteRegistrationAgainstLiveTables(supabase, action, now);
    if (!registrationCheck.eligible) {
      return {
        eligible: false,
        shouldSuppress: registrationCheck.shouldSuppress,
        suppressionStatus: registrationCheck.suppressionStatus,
        nextStage: null,
        reason: registrationCheck.reason,
        copy: null,
        dedupeKey: null,
      };
    }
    eventTitle = registrationCheck.eventTitle ?? eventTitle;
  } else if (action.action_type === "event_draft" && action.event_id) {
    const { data: eventRow, error } = await supabase
      .from("events")
      .select("status")
      .eq("id", action.event_id)
      .maybeSingle();

    if (error) {
      return {
        eligible: false,
        shouldSuppress: false,
        suppressionStatus: null,
        nextStage: null,
        reason: "live_event_draft_query_failed",
        copy: null,
        dedupeKey: null,
      };
    }

    if (!eventRow || eventRow.status === "cancelled" || eventRow.status === "archived") {
      return {
        eligible: false,
        shouldSuppress: true,
        suppressionStatus: "suppressed",
        nextStage: null,
        reason: "event_no_longer_draft",
        copy: null,
        dedupeKey: null,
      };
    }

    if (eventRow.status === "published" || eventRow.status === "completed") {
      return {
        eligible: false,
        shouldSuppress: true,
        suppressionStatus: "completed",
        nextStage: null,
        reason: "event_already_published",
        copy: null,
        dedupeKey: null,
      };
    }
  } else if (action.action_type === "campaign_draft" && action.campaign_id) {
    const { data: campaignRow, error } = await supabase
      .from("campaigns")
      .select("status")
      .eq("id", action.campaign_id)
      .maybeSingle();

    if (error) {
      return {
        eligible: false,
        shouldSuppress: false,
        suppressionStatus: null,
        nextStage: null,
        reason: "live_campaign_draft_query_failed",
        copy: null,
        dedupeKey: null,
      };
    }

    if (!campaignRow || campaignRow.status === "archived") {
      return {
        eligible: false,
        shouldSuppress: true,
        suppressionStatus: "suppressed",
        nextStage: null,
        reason: "campaign_no_longer_draft",
        copy: null,
        dedupeKey: null,
      };
    }

    if (campaignRow.status === "published") {
      return {
        eligible: false,
        shouldSuppress: true,
        suppressionStatus: "completed",
        nextStage: null,
        reason: "campaign_already_published",
        copy: null,
        dedupeKey: null,
      };
    }
  }

  const copy = getRecoveryCopyTemplate(action.action_type, { eventTitle });
  const copyValidation = validateRecoveryCopy(copy.title, copy.message);
  if (!copyValidation.valid) {
    return {
      eligible: false,
      shouldSuppress: true,
      suppressionStatus: "suppressed",
      nextStage: null,
      reason: copyValidation.reason,
      copy: null,
      dedupeKey: null,
    };
  }

  return {
    eligible: true,
    shouldSuppress: false,
    suppressionStatus: null,
    nextStage: timing.nextStage,
    reason: null,
    copy,
    dedupeKey: buildRecoveryDedupeKey(action.id, timing.nextStage),
  };
}
