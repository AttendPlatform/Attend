"use client";

import { FormEvent, Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { safeAuthRedirect } from "@/lib/auth/redirect";
import { ArrowLeft, Loader2 } from "lucide-react";

function VerifyEmailForm() {
  const supabase = createClient();
  const params = useSearchParams();
  const email = (params.get("email") ?? "").trim();
  const mode = params.get("mode") === "otp" ? "otp" : "signup";
  const next = safeAuthRedirect(params.get("next"));
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"error" | "success">("error");

  async function verify(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!email) {
      setMessage("The email address is missing. Return to signup or sign in to continue.");
      setMessageType("error");
      return;
    }

    setLoading(true);
    setMessage("");

    const { error } = await supabase.auth.verifyOtp({
      email,
      token: token.trim(),
      type: mode === "signup" ? "signup" : "email",
    });

    setLoading(false);

    if (error) {
      setMessage(error.message);
      setMessageType("error");
      return;
    }

    window.location.assign(next);
  }

  async function resend() {
    if (!email) {
      setMessage("Enter your email address by returning to signup or sign in first.");
      setMessageType("error");
      return;
    }

    setLoading(true);
    setMessage("");

    const emailRedirectTo =
      mode === "signup"
        ? `${window.location.origin}/auth/confirm?next=${encodeURIComponent(next)}`
        : `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;

    const result =
      mode === "signup"
        ? await supabase.auth.resend({
            type: "signup",
            email,
            options: { emailRedirectTo },
          })
        : await supabase.auth.signInWithOtp({
            email,
            options: {
              shouldCreateUser: false,
              emailRedirectTo,
            },
          });

    setLoading(false);
    setMessageType(result.error ? "error" : "success");
    setMessage(
      result.error
        ? result.error.message
        : "A new code has been sent. Check your inbox."
    );
  }

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-neutral-50 px-5 py-12">
      <div className="mx-auto max-w-md rounded-3xl border border-neutral-200 bg-white p-7 shadow-sm sm:p-9">
        <Link href="/" className="text-xl font-bold tracking-tight">
          Attend<span className="text-violet-600">.</span>
        </Link>
        <h1 className="mt-8 text-3xl font-semibold tracking-tight">
          Check your email
        </h1>

        {!email ? (
          <div className="mt-5 space-y-4">
            <p role="alert" className="text-sm leading-6 text-neutral-600">
              No email address was provided. Return to signup or sign in to request a verification code.
            </p>
            <Link
              href="/signup"
              className="inline-flex text-sm font-semibold text-violet-600 hover:text-violet-800"
            >
              Return to signup
            </Link>
          </div>
        ) : (
          <>
            <p className="mt-2 text-sm leading-6 text-neutral-500">
              Enter the verification code sent to <strong>{email}</strong>. You can
              also use the verification link in that email.
            </p>
            <form onSubmit={verify} className="mt-8 space-y-4">
              <label className="block text-sm font-medium" htmlFor="code">
                Six-digit code
              </label>
              <input
                id="code"
                required
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={8}
                value={token}
                onChange={(e) => setToken(e.target.value.replace(/\s/g, ""))}
                placeholder="Enter code"
                className="h-12 w-full rounded-xl border border-neutral-200 px-4 text-center text-lg tracking-[0.3em] outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-50"
              />
              {message && (
                <p
                  role={messageType === "error" ? "alert" : "status"}
                  className={messageType === "error" ? "text-sm text-rose-600" : "text-sm text-emerald-700"}
                >
                  {message}
                </p>
              )}
              <button
                disabled={loading}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-violet-600 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-60"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Verify email
              </button>
            </form>
            <button
              type="button"
              onClick={resend}
              disabled={loading}
              className="mt-5 w-full text-sm font-semibold text-violet-600 disabled:opacity-50"
            >
              Resend code
            </button>
          </>
        )}

        <Link
          href={`/login?next=${encodeURIComponent(next)}`}
          className="mt-6 flex items-center justify-center gap-2 text-sm text-neutral-500"
        >
          <ArrowLeft className="h-4 w-4" /> Back to sign in
        </Link>
      </div>
    </main>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="p-12 text-center text-neutral-500">Loading...</div>
      }
    >
      <VerifyEmailForm />
    </Suspense>
  );
}
