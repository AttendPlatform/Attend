import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../../src/lib/supabase/database.types";
import type { AbandonedActionRecord } from "../../../src/types/notifications";
import type * as RecoveryRulesModule from "../../../src/lib/notifications/recovery-rules";

interface CheckResult {
  name: string;
  passed: boolean;
  details?: string;
}

const results: CheckResult[] = [];

function check(name: string, condition: boolean, details?: string) {
  results.push({ name, passed: condition, details });
  const symbol = condition ? "PASS" : "FAIL";
  console.log(`[${symbol}] ${name}${details ? ` (${details})` : ""}`);
}

function makeAction(
  overrides: Partial<AbandonedActionRecord> = {}
): AbandonedActionRecord {
  const now = Date.now();
  return {
    id: "action-1",
    user_id: "user-1",
    action_type: "event_draft",
    event_id: "event-1",
    campaign_id: null,
    draft_title: "Lagos Builders Meetup",
    draft_payload: { title: "Lagos Builders Meetup", categoryId: "cat-1", step: 2 },
    resume_url: "/create?resumeDraft=action-1",
    last_progressed_at: new Date(now - 25 * 3_600_000).toISOString(),
    reminder_stage: 0,
    last_reminded_at: null,
    recovered_at: null,
    status: "active",
    created_at: new Date(now - 25 * 3_600_000).toISOString(),
    updated_at: new Date(now - 25 * 3_600_000).toISOString(),
    ...overrides,
  };
}

type MockTableFixtures = {
  events?: Record<string, unknown> | null;
  campaigns?: Record<string, unknown> | null;
  activeParticipants?: { id: string }[];
  participantCount?: number;
};

function createMockSupabase(
  fixtures: MockTableFixtures
): SupabaseClient<Database> {
  const client = {
    from(table: string) {
      let headMode = false;

      const builder = {
        select(_cols?: string, opts?: { count?: string; head?: boolean }) {
          headMode = Boolean(opts?.head);
          return builder;
        },
        eq() {
          return builder;
        },
        in() {
          return builder;
        },
        limit() {
          if (table === "event_participants") {
            return Promise.resolve({
              data: fixtures.activeParticipants ?? [],
              error: null,
            });
          }
          return Promise.resolve({ data: [], error: null });
        },
        maybeSingle() {
          if (table === "events") {
            return Promise.resolve({ data: fixtures.events ?? null, error: null });
          }
          if (table === "campaigns") {
            return Promise.resolve({ data: fixtures.campaigns ?? null, error: null });
          }
          return Promise.resolve({ data: null, error: null });
        },
        then(
          onFulfilled: (value: { count: number; data: null; error: null }) => unknown
        ) {
          if (table === "event_participants" && headMode) {
            return Promise.resolve({
              count: fixtures.participantCount ?? 0,
              data: null,
              error: null,
            }).then(onFulfilled);
          }
          return Promise.resolve({ count: 0, data: null, error: null }).then(
            onFulfilled
          );
        },
      };

      return builder;
    },
  };

  return client as unknown as SupabaseClient<Database>;
}

async function runSmartNotificationsDay3Verification() {
  console.log("\n=============================================================");
  console.log("Starting Smart Notifications Week 1 Day 3 Verification");
  console.log("Scope: Abandoned-Action Eligibility, Payment Checks & Copy Guard");
  console.log("=============================================================\n");

  const cwd = process.cwd();

  // 1. Target Files & Exports
  console.log("--- 1. Target Files & Exports ---");
  const recoveryRulesPath = resolve(cwd, "src/lib/notifications/recovery-rules.ts");
  const notifIndexPath = resolve(cwd, "src/lib/notifications/index.ts");
  const foundationMigrationPath = resolve(
    cwd,
    "supabase/migrations/20261110100000_smart_notifications_foundation.sql"
  );
  const planDocPath = resolve(
    cwd,
    "docs/smart_notification_implementation_plan.md"
  );

  check("recovery-rules.ts exists", existsSync(recoveryRulesPath));
  check("src/lib/notifications/index.ts exists", existsSync(notifIndexPath));
  check("Day 1 migration defines abandoned_actions", existsSync(foundationMigrationPath));

  const notifIndexContent = readFileSync(notifIndexPath, "utf8");
  check(
    "notifications barrel exports recovery-rules",
    notifIndexContent.includes("./recovery-rules")
  );

  const {
    ACTIVE_EDITING_GUARD_MINUTES,
    buildRecoveryDedupeKey,
    buildRecoveryDedupeKeysForAction,
    DEFAULT_RECOVERY_STAGE_1_DELAY_HOURS,
    DEFAULT_RECOVERY_STAGE_2_DELAY_HOURS,
    evaluateAbandonedActionEligibility,
    evaluateIncompleteRegistrationEligibility,
    evaluateRecoveryTiming,
    getRecoveryCopyTemplate,
    hasMeaningfulAbandonedProgress,
    validateRecoveryCopy,
  } = (await import(
    pathToFileURL(recoveryRulesPath).href
  )) as typeof RecoveryRulesModule;

  // 2. Anti-Surveillance Copy Validation
  console.log("\n--- 2. Anti-Surveillance Copy Validation ---");
  const forbiddenPhrases = [
    "We noticed you left your event draft",
    "You stopped halfway through registration",
    "We saw you browsing this conference",
    "You have been inactive for 24 hours",
    "We are watching your draft progress",
    "Noticed   You\nLeft earlier",
  ];

  for (const phrase of forbiddenPhrases) {
    const res = validateRecoveryCopy("Reminder", phrase);
    check(`Blocks surveillance phrasing: "${phrase.replace(/\s+/g, " ")}"`, !res.valid);
  }

  check(
    "Rejects empty recovery title or message",
    !validateRecoveryCopy("", "Valid message").valid &&
      !validateRecoveryCopy("Valid title", "   ").valid
  );

  const eventCopy = getRecoveryCopyTemplate("event_draft");
  const campaignCopy = getRecoveryCopyTemplate("campaign_draft");
  const registrationCopy = getRecoveryCopyTemplate("incomplete_registration", {
    eventTitle: "Lagos Tech Fest",
  });
  const blockedTitleRegistrationCopy = getRecoveryCopyTemplate(
    "incomplete_registration",
    { eventTitle: "Bird Watching Night" }
  );

  check(
    "Event draft copy matches product-oriented spec",
    eventCopy.title === "Your event draft is saved" &&
      eventCopy.actionLabel === "Continue editing" &&
      validateRecoveryCopy(eventCopy.title, eventCopy.message).valid
  );
  check(
    "Campaign draft copy matches product-oriented spec",
    campaignCopy.title === "Your campaign is ready when you are" &&
      campaignCopy.actionLabel === "Continue campaign" &&
      validateRecoveryCopy(campaignCopy.title, campaignCopy.message).valid
  );
  check(
    "Registration copy includes event title and passes copy guard",
    registrationCopy.title === "Your registration isn't complete" &&
      registrationCopy.message.includes("Lagos Tech Fest") &&
      registrationCopy.actionLabel === "Complete registration" &&
      validateRecoveryCopy(registrationCopy.title, registrationCopy.message).valid
  );
  check(
    "Registration copy falls back safely if event title contains blocked word",
    validateRecoveryCopy(
      blockedTitleRegistrationCopy.title,
      blockedTitleRegistrationCopy.message
    ).valid
  );

  // 3. Empty-Form Rejection
  console.log("\n--- 3. Empty-Form Rejection ---");
  check(
    "Rejects completely empty event draft payload",
    !hasMeaningfulAbandonedProgress({
      actionType: "event_draft",
      draftTitle: "",
      draftPayload: {},
    })
  );
  check(
    "Rejects untouched /create form with auto-selected defaults only",
    !hasMeaningfulAbandonedProgress({
      actionType: "event_draft",
      draftTitle: "   ",
      draftPayload: {
        title: "",
        description: "",
        categoryId: "cat-default-1",
        country: "Nigeria",
        participationModel: "free",
        step: 1,
      },
    })
  );
  check(
    "Accepts meaningful event draft with title and step 2 progression",
    hasMeaningfulAbandonedProgress({
      actionType: "event_draft",
      draftTitle: "Abuja Design Conf",
      draftPayload: {
        title: "Abuja Design Conf",
        categoryId: "cat-design",
        step: 2,
      },
    })
  );
  check(
    "Rejects empty campaign draft or untouched empty canvas_config",
    !hasMeaningfulAbandonedProgress({
      actionType: "campaign_draft",
      draftTitle: "  ",
      draftPayload: { title: "", canvasConfig: {} },
    }) &&
      !hasMeaningfulAbandonedProgress({
        actionType: "campaign_draft",
        draftPayload: { canvas_config: { objects: [] } },
      }) &&
      hasMeaningfulAbandonedProgress({
        actionType: "campaign_draft",
        draftPayload: { canvas_config: { objects: [{ type: "image" }] } },
      })
  );
  check(
    "Rejects untouched or prefilled-only registration form",
    !hasMeaningfulAbandonedProgress({
      actionType: "incomplete_registration",
      draftPayload: {},
    }) &&
      !hasMeaningfulAbandonedProgress({
        actionType: "incomplete_registration",
        draftPayload: {
          name: "Ada Lovelace",
          email: "ada@example.com",
          phone: "",
          organization: "",
          answers: {},
        },
      })
  );
  check(
    "Accepts incomplete registration with modified phone or custom answers",
    hasMeaningfulAbandonedProgress({
      actionType: "incomplete_registration",
      draftPayload: { phone: "+2348012345678" },
    }) &&
      hasMeaningfulAbandonedProgress({
        actionType: "incomplete_registration",
        draftPayload: { answers: { role: "Speaker" } },
      })
  );

  // 4. 24h Delay Enforcement & Active-Editing Guard
  console.log("\n--- 4. 24h Delay Enforcement & Active-Editing Guard ---");
  const now = new Date("2026-11-12T12:00:00.000Z");

  check(
    "Default Stage 1 delay is 24h, Stage 2 is 72h, active guard is 30m",
    DEFAULT_RECOVERY_STAGE_1_DELAY_HOURS === 24 &&
      DEFAULT_RECOVERY_STAGE_2_DELAY_HOURS === 72 &&
      ACTIVE_EDITING_GUARD_MINUTES === 30
  );

  const activeEditTiming = evaluateRecoveryTiming(
    makeAction({
      last_progressed_at: new Date(now.getTime() - 15 * 60_000).toISOString(),
    }),
    undefined,
    now
  );
  check(
    "Active-editing guard blocks reminders within 30 minutes of last edit",
    !activeEditTiming.eligible && activeEditTiming.reason === "active_editing_guard"
  );

  const tooEarlyTiming = evaluateRecoveryTiming(
    makeAction({
      last_progressed_at: new Date(
        now.getTime() - 23 * 3_600_000 - 50 * 60_000
      ).toISOString(),
    }),
    undefined,
    now
  );
  check(
    "Enforces 24h delay before Stage 1 reminder",
    !tooEarlyTiming.eligible && tooEarlyTiming.reason === "stage_1_delay_not_met"
  );

  const stage1DueTiming = evaluateRecoveryTiming(
    makeAction({
      last_progressed_at: new Date(now.getTime() - 24 * 3_600_000).toISOString(),
    }),
    undefined,
    now
  );
  check(
    "Allows Stage 1 reminder at exactly 24h",
    stage1DueTiming.eligible && stage1DueTiming.nextStage === 1
  );

  const stage2TooEarly = evaluateRecoveryTiming(
    makeAction({
      reminder_stage: 1,
      last_progressed_at: new Date(now.getTime() - 48 * 3_600_000).toISOString(),
      last_reminded_at: new Date(now.getTime() - 24 * 3_600_000).toISOString(),
    }),
    undefined,
    now
  );
  check(
    "Enforces 72h delay before Stage 2 final reminder",
    !stage2TooEarly.eligible && stage2TooEarly.reason === "stage_2_delay_not_met"
  );

  const stage2Due = evaluateRecoveryTiming(
    makeAction({
      reminder_stage: 1,
      last_progressed_at: new Date(now.getTime() - 72 * 3_600_000).toISOString(),
      last_reminded_at: new Date(now.getTime() - 48 * 3_600_000).toISOString(),
    }),
    undefined,
    now
  );
  check(
    "Allows Stage 2 final reminder at 72h",
    stage2Due.eligible && stage2Due.nextStage === 2
  );

  const maxReached = evaluateRecoveryTiming(
    makeAction({ reminder_stage: 2 }),
    undefined,
    now
  );
  check(
    "Enforces max_reminders = 2 suppression cap",
    !maxReached.eligible &&
      maxReached.shouldSuppress &&
      maxReached.reason === "max_reminders_reached"
  );

  const nanConfigTiming = evaluateRecoveryTiming(
    makeAction({
      last_progressed_at: new Date(now.getTime() - 2 * 3_600_000).toISOString(),
    }),
    { stage1DelayHours: Number.NaN, maxReminders: Number.NaN },
    now
  );
  check(
    "Falls back safely to default delays when numeric config values are NaN",
    !nanConfigTiming.eligible && nanConfigTiming.reason === "stage_1_delay_not_met"
  );

  // 5. Registration & Payment Status Verification
  console.log("\n--- 5. Registration & Payment Status Verification ---");
  const futureStart = new Date(now.getTime() + 5 * 24 * 3_600_000).toISOString();
  const pastStart = new Date(now.getTime() - 3_600_000).toISOString();

  const baseRegistrationEvent = {
    id: "event-1",
    title: "Lagos AI Conference",
    status: "published",
    start_at: futureStart,
    participation_model: "registration",
    participation_config: { max_attendees: 100 },
  };

  check(
    "Blocks & completes if user already has active event_participants row",
    (() => {
      const res = evaluateIncompleteRegistrationEligibility(
        {
          hasActiveParticipation: true,
          event: baseRegistrationEvent,
          activeParticipantCount: 10,
        },
        now
      );
      return !res.eligible && res.shouldSuppress && res.suppressionStatus === "completed";
    })()
  );

  check(
    "Suppresses if event is cancelled or already started",
    (() => {
      const cancelled = evaluateIncompleteRegistrationEligibility(
        {
          hasActiveParticipation: false,
          event: { ...baseRegistrationEvent, status: "cancelled" },
          activeParticipantCount: 10,
        },
        now
      );
      const started = evaluateIncompleteRegistrationEligibility(
        {
          hasActiveParticipation: false,
          event: { ...baseRegistrationEvent, start_at: pastStart },
          activeParticipantCount: 10,
        },
        now
      );
      return (
        !cancelled.eligible &&
        cancelled.shouldSuppress &&
        !started.eligible &&
        started.shouldSuppress
      );
    })()
  );

  check(
    "Suppresses if registration capacity is full",
    (() => {
      const res = evaluateIncompleteRegistrationEligibility(
        {
          hasActiveParticipation: false,
          event: baseRegistrationEvent,
          activeParticipantCount: 100,
        },
        now
      );
      return !res.eligible && res.shouldSuppress && res.reason === "event_capacity_full";
    })()
  );

  check(
    "Suppresses if registration deadline passed or participation model is external",
    (() => {
      const deadlinePassed = evaluateIncompleteRegistrationEligibility(
        {
          hasActiveParticipation: false,
          event: {
            ...baseRegistrationEvent,
            participation_config: {
              max_attendees: 100,
              registration_deadline: pastStart,
            },
          },
          activeParticipantCount: 10,
        },
        now
      );
      const externalModel = evaluateIncompleteRegistrationEligibility(
        {
          hasActiveParticipation: false,
          event: {
            ...baseRegistrationEvent,
            participation_model: "external",
          },
          activeParticipantCount: 10,
        },
        now
      );
      return (
        !deadlinePassed.eligible &&
        deadlinePassed.shouldSuppress &&
        deadlinePassed.reason === "registration_deadline_passed" &&
        !externalModel.eligible &&
        externalModel.shouldSuppress &&
        externalModel.reason === "external_participation_not_supported"
      );
    })()
  );

  const paidEvent = {
    ...baseRegistrationEvent,
    participation_model: "paid",
    participation_config: { ticket_price: 5000, currency: "NGN", ticket_capacity: 50 },
  };

  check(
    "Paid event blocks reminder when payment_status is pending",
    (() => {
      const res = evaluateIncompleteRegistrationEligibility(
        {
          hasActiveParticipation: false,
          event: paidEvent,
          activeParticipantCount: 10,
          draftPayload: { payment_status: "pending" },
        },
        now
      );
      return !res.eligible && res.reason === "payment_pending";
    })()
  );

  check(
    "Paid event suppresses as completed when payment_status is completed",
    (() => {
      const res = evaluateIncompleteRegistrationEligibility(
        {
          hasActiveParticipation: false,
          event: paidEvent,
          activeParticipantCount: 10,
          draftPayload: { payment_status: "completed" },
        },
        now
      );
      return !res.eligible && res.shouldSuppress && res.suppressionStatus === "completed";
    })()
  );

  check(
    "Paid event blocks reminder when payment_status is missing",
    (() => {
      const res = evaluateIncompleteRegistrationEligibility(
        {
          hasActiveParticipation: false,
          event: paidEvent,
          activeParticipantCount: 10,
          draftPayload: { phone: "+2348012345678" },
        },
        now
      );
      return !res.eligible;
    })()
  );

  check(
    "Paid event allows reminder ONLY when payment_status is failed or expired",
    evaluateIncompleteRegistrationEligibility(
      {
        hasActiveParticipation: false,
        event: paidEvent,
        activeParticipantCount: 10,
        draftPayload: { payment_status: "failed" },
      },
      now
    ).eligible &&
      evaluateIncompleteRegistrationEligibility(
        {
          hasActiveParticipation: false,
          event: paidEvent,
          activeParticipantCount: 10,
          draftPayload: { payment_status: "expired" },
        },
        now
      ).eligible
  );

  // 6. Completion Auto-Suppression (Live Table Verification)
  console.log("\n--- 6. Completion Auto-Suppression ---");
  const publishedEventMock = createMockSupabase({
    events: { status: "published" },
  });
  const publishedDraftResult = await evaluateAbandonedActionEligibility(
    publishedEventMock,
    makeAction({
      action_type: "event_draft",
      last_progressed_at: new Date(now.getTime() - 26 * 3_600_000).toISOString(),
    }),
    { now }
  );
  check(
    "Auto-suppresses event_draft as completed when event is published",
    !publishedDraftResult.eligible &&
      publishedDraftResult.shouldSuppress &&
      publishedDraftResult.suppressionStatus === "completed"
  );

  const publishedCampaignMock = createMockSupabase({
    campaigns: { status: "published" },
  });
  const publishedCampaignResult = await evaluateAbandonedActionEligibility(
    publishedCampaignMock,
    makeAction({
      action_type: "campaign_draft",
      event_id: null,
      campaign_id: "camp-1",
      last_progressed_at: new Date(now.getTime() - 26 * 3_600_000).toISOString(),
    }),
    { now }
  );
  check(
    "Auto-suppresses campaign_draft as completed when campaign is published",
    !publishedCampaignResult.eligible &&
      publishedCampaignResult.shouldSuppress &&
      publishedCampaignResult.suppressionStatus === "completed"
  );

  const activeRegMock = createMockSupabase({
    activeParticipants: [{ id: "part-1" }],
    events: baseRegistrationEvent,
    participantCount: 10,
  });
  const completedRegResult = await evaluateAbandonedActionEligibility(
    activeRegMock,
    makeAction({
      action_type: "incomplete_registration",
      draft_payload: { phone: "+2348012345678" },
      last_progressed_at: new Date(now.getTime() - 26 * 3_600_000).toISOString(),
    }),
    { now }
  );
  check(
    "Auto-suppresses incomplete_registration when user already registered",
    !completedRegResult.eligible &&
      completedRegResult.shouldSuppress &&
      completedRegResult.suppressionStatus === "completed"
  );

  const rejectedDraftMock = createMockSupabase({
    events: { status: "rejected" },
  });
  const rejectedDraftResult = await evaluateAbandonedActionEligibility(
    rejectedDraftMock,
    makeAction({
      action_type: "event_draft",
      last_progressed_at: new Date(now.getTime() - 26 * 3_600_000).toISOString(),
    }),
    { now }
  );
  const editPublishedResult = await evaluateAbandonedActionEligibility(
    publishedEventMock,
    makeAction({
      action_type: "unfinished_event_edit",
      last_progressed_at: new Date(now.getTime() - 26 * 3_600_000).toISOString(),
    }),
    { now }
  );
  check(
    "Suppresses rejected drafts while keeping unfinished edits on published events eligible",
    !rejectedDraftResult.eligible &&
      rejectedDraftResult.shouldSuppress &&
      rejectedDraftResult.suppressionStatus === "suppressed" &&
      editPublishedResult.eligible &&
      editPublishedResult.nextStage === 1
  );

  const eligibleDraftMock = createMockSupabase({
    events: { status: "draft" },
  });
  const eligibleDraftResult = await evaluateAbandonedActionEligibility(
    eligibleDraftMock,
    makeAction({
      action_type: "event_draft",
      last_progressed_at: new Date(now.getTime() - 26 * 3_600_000).toISOString(),
    }),
    { now }
  );
  check(
    "Eligible active draft returns product-safe copy and deterministic dedupeKey",
    eligibleDraftResult.eligible &&
      eligibleDraftResult.nextStage === 1 &&
      eligibleDraftResult.copy?.title === "Your event draft is saved" &&
      eligibleDraftResult.dedupeKey === buildRecoveryDedupeKey("action-1", 1)
  );

  const dedupeKeys = buildRecoveryDedupeKeysForAction("action-1");
  check(
    "Builds deterministic Stage 1 and Stage 2 dedupe keys for suppression",
    dedupeKeys.length === 2 &&
      dedupeKeys[0] === "recovery-action-1-stage-1" &&
      dedupeKeys[1] === "recovery-action-1-stage-2"
  );

  // 7. Zero Em Dashes Policy
  console.log("\n--- 7. Zero Em Dashes Policy ---");
  const emDashChar = String.fromCharCode(0x2014);
  const filesToCheck = [
    recoveryRulesPath,
    notifIndexPath,
    resolve(cwd, "src/types/notifications.ts"),
    planDocPath,
    resolve(cwd, "scripts/smart-notifications/week1/verify-sn-w1-d3.ts"),
  ];

  for (const filePath of filesToCheck) {
    if (existsSync(filePath)) {
      const content = readFileSync(filePath, "utf8");
      check(
        `Zero em dashes in ${filePath.replace(cwd + "/", "")}`,
        !content.includes(emDashChar)
      );
    }
  }

  console.log("\n=============================================================");
  const passedCount = results.filter((r) => r.passed).length;
  const failedCount = results.filter((r) => !r.passed).length;
  console.log(
    `Smart Notifications Day 3 Summary: ${passedCount} passed, ${failedCount} failed`
  );
  console.log("=============================================================\n");

  if (failedCount > 0) {
    process.exit(1);
  }
}

runSmartNotificationsDay3Verification().catch((err) => {
  console.error("Verification suite failed:", err);
  process.exit(1);
});
