"use client";

import { useEffect, useState, useTransition } from "react";
import {
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
  User,
  Mail,
  Phone,
  Building2,
  Briefcase,
  HelpCircle,
} from "lucide-react";
import {
  normalizeRegistrationConfig,
  validateRegistrationPayload,
} from "@/lib/validations/registration";
import { submitRegistrationAction } from "@/app/actions/attendance";
import { useEventAttendance } from "./EventAttendanceProvider";

export interface RegistrationModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  eventId?: string;
  eventTitle?: string;
  participationConfig?: Record<string, unknown> | null;
  initialName?: string;
  initialEmail?: string;
  onSuccess?: () => void;
}

export default function RegistrationModal(props: RegistrationModalProps) {
  const context = useEventAttendance();

  const isOpen = props.isOpen ?? context?.isRegistrationModalOpen ?? false;
  const onClose = props.onClose ?? context?.closeRegistrationModal ?? (() => {});
  const onSuccess = props.onSuccess ?? context?.handleRegistrationSuccess;
  const eventId = props.eventId ?? context?.eventId ?? "";
  const eventTitle = props.eventTitle ?? context?.eventTitle ?? "Event";
  const participationConfig = props.participationConfig ?? context?.participationConfig;
  const initialName = props.initialName ?? context?.userName ?? "";
  const initialEmail = props.initialEmail ?? context?.userEmail ?? "";

  const config = normalizeRegistrationConfig(participationConfig);

  const [name, setName] = useState(initialName);
  const [email, setEmail] = useState(initialEmail);
  const [phone, setPhone] = useState("");
  const [organization, setOrganization] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [answers, setAnswers] = useState<Record<string, unknown>>({});

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [pending, startTransition] = useTransition();

  // Reset or initialize state on open
  useEffect(() => {
    if (isOpen) {
      setName(initialName);
      setEmail(initialEmail);
      setPhone("");
      setOrganization("");
      setJobTitle("");
      setAnswers({});
      setErrors({});
      setGeneralError(null);
      setIsSuccess(false);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen, initialName, initialEmail]);

  // Escape key handler
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen && !pending) {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, pending, onClose]);

  if (!isOpen) return null;

  const handleAnswerChange = (questionId: string, value: unknown) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }));
    if (errors[`answers.${questionId}`]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[`answers.${questionId}`];
        return next;
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError(null);

    const payload = {
      name: name.trim(),
      email: email.trim() || undefined,
      phone: phone.trim() || undefined,
      organization: organization.trim() || undefined,
      job_title: jobTitle.trim() || undefined,
      answers,
    };

    const validation = validateRegistrationPayload(participationConfig, payload);

    if (!validation.success && validation.errors) {
      setErrors(validation.errors);
      return;
    }

    setErrors({});

    startTransition(async () => {
      const pathname = typeof window !== "undefined" ? window.location.pathname : undefined;
      const res = await submitRegistrationAction({
        eventId,
        name: payload.name,
        participationType: "registrant",
        registrationData: {
          email: payload.email,
          phone: payload.phone,
          organization: payload.organization,
          job_title: payload.job_title,
          answers: payload.answers,
        },
        pathname,
      });

      if (res.requiresLogin) {
        if (typeof window !== "undefined") {
          window.location.href = `/login?next=${encodeURIComponent(window.location.pathname)}`;
        }
        return;
      }

      if (res.error) {
        setGeneralError(res.error);
        return;
      }

      setIsSuccess(true);
      if (onSuccess) {
        onSuccess();
      }
    });
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="registration-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-neutral-900/60 p-4 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget && !pending) {
          onClose();
        }
      }}
    >
      <div className="relative flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-3xl border border-neutral-100 bg-white shadow-2xl transition-all animate-in zoom-in-95 duration-200">
        {/* Header banner */}
        <div className="relative shrink-0 border-b border-neutral-100 bg-gradient-to-r from-violet-50 via-white to-violet-50/50 p-5 sm:p-6">
          <button
            type="button"
            onClick={onClose}
            disabled={pending}
            className="absolute right-5 top-5 rounded-full p-1.5 text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-700 disabled:opacity-50"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
          <span className="inline-block rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold text-violet-800">
            Event Registration
          </span>
          <h2
            id="registration-modal-title"
            className="mt-2 text-xl font-bold tracking-tight text-neutral-900"
          >
            {isSuccess ? "Registration Confirmed" : `Register for ${eventTitle}`}
          </h2>
          <p className="mt-1 text-xs leading-5 text-neutral-500">
            {isSuccess
              ? "Your attendance spot has been reserved."
              : "Please complete the required information below to confirm your attendance."}
          </p>
        </div>

        {/* Content body */}
        <div className="overflow-y-auto p-5 sm:p-6">
          {isSuccess ? (
            <div className="py-4 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 ring-8 ring-emerald-50">
                <CheckCircle2 className="h-10 w-10" />
              </div>
              <h3 className="mt-5 text-lg font-bold text-neutral-900">
                You are registered!
              </h3>
              <p className="mx-auto mt-2 max-w-sm text-sm text-neutral-600">
                Thank you, <span className="font-semibold text-neutral-900">{name}</span>. Your registration for <span className="font-semibold text-neutral-900">{eventTitle}</span> has been confirmed.
              </p>

              <div className="mt-6 flex justify-center">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-full bg-violet-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-700"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {generalError && (
                <div className="flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 p-3.5 text-xs text-red-700">
                  <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
                  <span>{generalError}</span>
                </div>
              )}

              {/* Full Name */}
              <div>
                <label className="block text-xs font-semibold text-neutral-800">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <div className="relative mt-1">
                  <User className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-neutral-400" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (errors.name) {
                        setErrors((prev) => {
                          const next = { ...prev };
                          delete next.name;
                          return next;
                        });
                      }
                    }}
                    placeholder="e.g. Jane Doe"
                    className={`h-10 w-full rounded-xl border bg-white pl-10 pr-3 text-xs outline-none transition focus:ring-2 ${
                      errors.name
                        ? "border-red-400 focus:border-red-500 focus:ring-red-100"
                        : "border-neutral-200 focus:border-violet-500 focus:ring-violet-50"
                    }`}
                  />
                </div>
                {errors.name && (
                  <p className="mt-1 text-xs text-red-600">{errors.name}</p>
                )}
              </div>

              {/* Email Address */}
              <div>
                <label className="block text-xs font-semibold text-neutral-800">
                  Email Address
                </label>
                <div className="relative mt-1">
                  <Mail className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-neutral-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (errors.email) {
                        setErrors((prev) => {
                          const next = { ...prev };
                          delete next.email;
                          return next;
                        });
                      }
                    }}
                    placeholder="e.g. jane@example.com"
                    className={`h-10 w-full rounded-xl border bg-white pl-10 pr-3 text-xs outline-none transition focus:ring-2 ${
                      errors.email
                        ? "border-red-400 focus:border-red-500 focus:ring-red-100"
                        : "border-neutral-200 focus:border-violet-500 focus:ring-violet-50"
                    }`}
                  />
                </div>
                {errors.email && (
                  <p className="mt-1 text-xs text-red-600">{errors.email}</p>
                )}
              </div>

              {/* Phone (conditional or standard) */}
              {(config.require_phone || phone) && (
                <div>
                  <label className="block text-xs font-semibold text-neutral-800">
                    Phone Number {config.require_phone && <span className="text-red-500">*</span>}
                  </label>
                  <div className="relative mt-1">
                    <Phone className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-neutral-400" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => {
                        setPhone(e.target.value);
                        if (errors.phone) {
                          setErrors((prev) => {
                            const next = { ...prev };
                            delete next.phone;
                            return next;
                          });
                        }
                      }}
                      placeholder="e.g. +234 801 234 5678"
                      className={`h-10 w-full rounded-xl border bg-white pl-10 pr-3 text-xs outline-none transition focus:ring-2 ${
                        errors.phone
                          ? "border-red-400 focus:border-red-500 focus:ring-red-100"
                          : "border-neutral-200 focus:border-violet-500 focus:ring-violet-50"
                      }`}
                    />
                  </div>
                  {errors.phone && (
                    <p className="mt-1 text-xs text-red-600">{errors.phone}</p>
                  )}
                </div>
              )}

              {/* Organization / Company (conditional) */}
              {(config.require_organization || organization) && (
                <div>
                  <label className="block text-xs font-semibold text-neutral-800">
                    Organization / Company {config.require_organization && <span className="text-red-500">*</span>}
                  </label>
                  <div className="relative mt-1">
                    <Building2 className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-neutral-400" />
                    <input
                      type="text"
                      value={organization}
                      onChange={(e) => {
                        setOrganization(e.target.value);
                        if (errors.organization) {
                          setErrors((prev) => {
                            const next = { ...prev };
                            delete next.organization;
                            return next;
                          });
                        }
                      }}
                      placeholder="e.g. Acme Corporation"
                      className={`h-10 w-full rounded-xl border bg-white pl-10 pr-3 text-xs outline-none transition focus:ring-2 ${
                        errors.organization
                          ? "border-red-400 focus:border-red-500 focus:ring-red-100"
                          : "border-neutral-200 focus:border-violet-500 focus:ring-violet-50"
                      }`}
                    />
                  </div>
                  {errors.organization && (
                    <p className="mt-1 text-xs text-red-600">{errors.organization}</p>
                  )}
                </div>
              )}

              {/* Job Title / Role (conditional) */}
              {(config.require_job_title || jobTitle) && (
                <div>
                  <label className="block text-xs font-semibold text-neutral-800">
                    Job Title / Role {config.require_job_title && <span className="text-red-500">*</span>}
                  </label>
                  <div className="relative mt-1">
                    <Briefcase className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-neutral-400" />
                    <input
                      type="text"
                      value={jobTitle}
                      onChange={(e) => {
                        setJobTitle(e.target.value);
                        if (errors.job_title) {
                          setErrors((prev) => {
                            const next = { ...prev };
                            delete next.job_title;
                            return next;
                          });
                        }
                      }}
                      placeholder="e.g. Frontend Engineer"
                      className={`h-10 w-full rounded-xl border bg-white pl-10 pr-3 text-xs outline-none transition focus:ring-2 ${
                        errors.job_title
                          ? "border-red-400 focus:border-red-500 focus:ring-red-100"
                          : "border-neutral-200 focus:border-violet-500 focus:ring-violet-50"
                      }`}
                    />
                  </div>
                  {errors.job_title && (
                    <p className="mt-1 text-xs text-red-600">{errors.job_title}</p>
                  )}
                </div>
              )}

              {/* Dynamic Custom Questions */}
              {config.questions.length > 0 && (
                <div className="space-y-3 pt-2">
                  <div className="border-t border-neutral-100 pt-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                      Additional Questions
                    </h4>
                  </div>

                  {config.questions.map((question) => {
                    const errKey = `answers.${question.id}`;
                    const hasError = Boolean(errors[errKey]);

                    return (
                      <div key={question.id}>
                        <label className="block text-xs font-semibold text-neutral-800">
                          {question.label} {question.required && <span className="text-red-500">*</span>}
                        </label>

                        {question.type === "select" && question.options ? (
                          <div className="mt-1">
                            <select
                              value={String(answers[question.id] || "")}
                              onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                              className={`h-10 w-full rounded-xl border bg-white px-3 text-xs outline-none transition focus:ring-2 ${
                                hasError
                                  ? "border-red-400 focus:border-red-500 focus:ring-red-100"
                                  : "border-neutral-200 focus:border-violet-500 focus:ring-violet-50"
                              }`}
                            >
                              <option value="">Select an option...</option>
                              {question.options.map((opt) => (
                                <option key={opt} value={opt}>
                                  {opt}
                                </option>
                              ))}
                            </select>
                          </div>
                        ) : question.type === "textarea" ? (
                          <div className="mt-1">
                            <textarea
                              rows={3}
                              value={String(answers[question.id] || "")}
                              onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                              placeholder={question.placeholder || "Enter your answer..."}
                              className={`w-full rounded-xl border bg-white p-3 text-xs outline-none transition focus:ring-2 ${
                                hasError
                                  ? "border-red-400 focus:border-red-500 focus:ring-red-100"
                                  : "border-neutral-200 focus:border-violet-500 focus:ring-violet-50"
                              }`}
                            />
                          </div>
                        ) : question.type === "checkbox" ? (
                          <label className="mt-2 flex items-center gap-2.5 text-xs text-neutral-700 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={Boolean(answers[question.id])}
                              onChange={(e) => handleAnswerChange(question.id, e.target.checked)}
                              className="h-4 w-4 rounded border-neutral-300 text-violet-600 focus:ring-violet-500"
                            />
                            <span>{question.placeholder || "Yes, I agree"}</span>
                          </label>
                        ) : (
                          <div className="relative mt-1">
                            <HelpCircle className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-neutral-400" />
                            <input
                              type="text"
                              value={String(answers[question.id] || "")}
                              onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                              placeholder={question.placeholder || "Your answer..."}
                              className={`h-10 w-full rounded-xl border bg-white pl-10 pr-3 text-xs outline-none transition focus:ring-2 ${
                                hasError
                                  ? "border-red-400 focus:border-red-500 focus:ring-red-100"
                                  : "border-neutral-200 focus:border-violet-500 focus:ring-violet-50"
                              }`}
                            />
                          </div>
                        )}

                        {hasError && (
                          <p className="mt-1 text-xs text-red-600">{errors[errKey]}</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Action buttons */}
              <div className="sticky bottom-0 -mx-5 -mb-5 sm:-mx-6 sm:-mb-6 mt-6 flex items-center justify-end gap-3 border-t border-neutral-100 bg-white/95 px-5 sm:px-6 py-3.5 backdrop-blur-sm">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={pending}
                  className="rounded-full px-4 py-2.5 text-xs font-semibold text-neutral-600 transition hover:bg-neutral-100 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={pending}
                  className="inline-flex items-center gap-2 rounded-full bg-violet-600 px-6 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-violet-700 disabled:opacity-60"
                >
                  {pending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin text-white" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <span>Complete Registration</span>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
