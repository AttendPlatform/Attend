import { z } from "zod";
import type { RegistrationParticipationConfig } from "@/types/events";

export interface CustomQuestion {
  id: string;
  label: string;
  type?: "text" | "textarea" | "select" | "checkbox";
  required?: boolean;
  options?: string[];
  placeholder?: string;
}

export interface NormalizedRegistrationConfig {
  require_phone: boolean;
  require_organization: boolean;
  require_job_title: boolean;
  questions: CustomQuestion[];
}

export const baseRegistrationSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters.")
    .max(100, "Name cannot exceed 100 characters."),
  email: z
    .string()
    .trim()
    .email("Please provide a valid email address.")
    .optional()
    .or(z.literal("")),
  phone: z.string().trim().optional().or(z.literal("")),
  organization: z.string().trim().optional().or(z.literal("")),
  job_title: z.string().trim().optional().or(z.literal("")),
  answers: z.record(z.string(), z.unknown()).default({}),
});

export type BaseRegistrationInput = z.infer<typeof baseRegistrationSchema>;

/**
 * Normalizes question configuration across different formats:
 * - Simple string arrays: ["Dietary preference", "T-shirt size"]
 * - Object arrays: [{ id: "q1", label: "T-shirt", required: true }]
 * - Single custom_question string: "Any special requirements?"
 */
export function normalizeRegistrationQuestions(
  config?: (RegistrationParticipationConfig & Record<string, unknown>) | null
): CustomQuestion[] {
  if (!config) return [];

  const questions: CustomQuestion[] = [];

  // 1. Array of questions
  if (Array.isArray(config.questions)) {
    config.questions.forEach((q, idx) => {
      if (typeof q === "string" && q.trim()) {
        questions.push({
          id: `question_${idx + 1}`,
          label: q.trim(),
          type: "text",
          required: false,
          placeholder: `Your answer...`,
        });
      } else if (typeof q === "object" && q !== null) {
        const item = q as Record<string, unknown>;
        const label = String(item.label || item.question || item.title || "").trim();
        if (label) {
          questions.push({
            id: String(item.id || `question_${idx + 1}`),
            label,
            type: (item.type as CustomQuestion["type"]) || "text",
            required: Boolean(item.required),
            options: Array.isArray(item.options) ? (item.options as string[]) : undefined,
            placeholder: typeof item.placeholder === "string" ? item.placeholder : `Your answer...`,
          });
        }
      }
    });
  }

  // 2. Single custom_question string fallback
  const customQuestionStr =
    typeof config.custom_question === "string" ? config.custom_question.trim() : "";
  if (
    customQuestionStr &&
    !questions.some((q) => q.label === customQuestionStr)
  ) {
    questions.push({
      id: "custom_question_main",
      label: customQuestionStr,
      type: "text",
      required: false,
      placeholder: "Your answer...",
    });
  }

  return questions;
}

/**
 * Normalizes all registration requirements from raw participation config.
 */
export function normalizeRegistrationConfig(
  config?: (RegistrationParticipationConfig & Record<string, unknown>) | null
): NormalizedRegistrationConfig {
  return {
    require_phone: Boolean(config?.require_phone),
    require_organization: Boolean(config?.require_organization),
    require_job_title: Boolean(config?.require_job_title),
    questions: normalizeRegistrationQuestions(config),
  };
}

/**
 * Builds a dynamic Zod schema enforcing event-specific registration rules.
 */
export function buildRegistrationSchema(
  config?: (RegistrationParticipationConfig & Record<string, unknown>) | null
) {
  const normalized = normalizeRegistrationConfig(config);

  let schema = baseRegistrationSchema;

  return schema.superRefine((data, ctx) => {
    // Phone validation
    if (normalized.require_phone) {
      if (!data.phone || data.phone.trim().length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["phone"],
          message: "Phone number is required for this event.",
        });
      } else if (data.phone.trim().length < 7) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["phone"],
          message: "Please enter a valid phone number.",
        });
      }
    }

    // Organization validation
    if (normalized.require_organization) {
      if (!data.organization || data.organization.trim().length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["organization"],
          message: "Organization or company name is required.",
        });
      }
    }

    // Job title validation
    if (normalized.require_job_title) {
      if (!data.job_title || data.job_title.trim().length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["job_title"],
          message: "Job title or role is required.",
        });
      }
    }

    // Required custom questions validation
    for (const question of normalized.questions) {
      if (question.required) {
        const val = data.answers?.[question.id];
        const isEmpty =
          val === undefined ||
          val === null ||
          (typeof val === "string" && val.trim().length === 0) ||
          (Array.isArray(val) && val.length === 0) ||
          val === false;

        if (isEmpty) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["answers", question.id],
            message: `${question.label} is required.`,
          });
        }
      }
    }
  });
}

/**
 * Validates registration submission payload against dynamic config.
 */
export function validateRegistrationPayload(
  config: (RegistrationParticipationConfig & Record<string, unknown>) | null | undefined,
  input: unknown
): {
  success: boolean;
  data?: BaseRegistrationInput;
  errors?: Record<string, string>;
} {
  const schema = buildRegistrationSchema(config);
  const result = schema.safeParse(input);

  if (!result.success) {
    const errors: Record<string, string> = {};
    for (const issue of result.error.issues) {
      const field = issue.path.join(".");
      if (!errors[field]) {
        errors[field] = issue.message;
      }
    }
    return { success: false, errors };
  }

  return { success: true, data: result.data };
}
