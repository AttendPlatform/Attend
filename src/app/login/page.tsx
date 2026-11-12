
"use client";

import { FormEvent, Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  ArrowRight,
  Eye,
  EyeOff,
  Loader2,
  CalendarDays,
  Sparkles,
  ShieldCheck,
} from "lucide-react";
import { safeAuthRedirect } from "@/lib/auth/redirect";

function LoginForm() {
  const supabase = createClient();
  const params = useSearchParams();
  const next = safeAuthRedirect(params.get("next"));
  const authErrorCode = params.get("error");
  const authErrorMessages: Record<string, string> = {
    missing_code: "The sign-in link is incomplete. Please try signing in again.",
    oauth_callback: "We could not complete Google sign-in. Please try again.",
    expired_confirmation: "This email link has expired. Request a new link and try again.",
    invalid_confirmation: "This email link is invalid. Request a new link and try again.",
  };
  const authErrorMessage = authErrorCode
    ? authErrorMessages[authErrorCode] ?? "Sign-in could not be completed. Please try again."
    : "";
  const passwordUpdated = params.get("password_updated") === "1";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [mode, setMode] = useState<"password" | "otp">("password");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [greeting, setGreeting] = useState("Good to see you");

  useEffect(() => {
    const greetings = [
      "Good to see you",
      "Welcome back",
      "Great to have you here",
      "Ready for what’s next?",
      "Your next experience starts here",
      "Let’s get you started",
      "Good things happen when we connect",
      "There’s more to experience",
    ];

    const chooseGreeting = (current: string) => {
      const options = greetings.filter((item) => item !== current);
      return options[Math.floor(Math.random() * options.length)];
    };

    const interval = window.setInterval(() => {
      setGreeting((current) => chooseGreeting(current));
    }, 30_000);

    return () => window.clearInterval(interval);
  }, []);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setLoading(true);
    setError("");

    const normalizedEmail = email.trim().toLowerCase();

    if (mode === "password") {
      const { error } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });

      setLoading(false);

      if (error) {
        setError(error.message);
        return;
      }

      window.location.assign(next);
      return;
    }

    const { error } = await supabase.auth.signInWithOtp({
      email: normalizedEmail,
      options: {
        shouldCreateUser: false,
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    setSent(true);
  }

  async function google() {
    setLoading(true);
    setError("");

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="rounded-3xl border border-white bg-white/90 p-7 shadow-xl shadow-violet-950/5 backdrop-blur-xl sm:p-9">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xl font-bold tracking-tight text-neutral-900"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
            <CalendarDays className="h-5 w-5" />
          </span>
          Attend<span className="text-violet-600">.</span>
        </Link>

        <div className="mt-10 flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-100 text-violet-700">
          <Sparkles className="h-7 w-7" />
        </div>

        <h1 className="mt-7 text-3xl font-bold tracking-tight text-neutral-900">
          Check your inbox
        </h1>

        <p className="mt-3 text-sm leading-7 text-neutral-500">
          We sent a sign-in code and link to{" "}
          <span className="font-semibold text-neutral-800">{email}</span>.
          Enter the code below to continue.
        </p>

        <Link
          href={`/verify-email?email=${encodeURIComponent(email)}&mode=otp&next=${encodeURIComponent(next)}`}
          className="mt-8 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-violet-600 text-sm font-semibold text-white shadow-lg shadow-violet-600/20 transition hover:bg-violet-700"
        >
          Enter email code
          <ArrowRight className="h-4 w-4" />
        </Link>

        <button
          type="button"
          onClick={() => setSent(false)}
          className="mt-4 w-full text-center text-sm font-medium text-neutral-500 transition hover:text-violet-600"
        >
          Back to sign in
        </button>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-white bg-white/90 shadow-[0_25px_100px_-30px_rgba(91,33,182,0.2)] backdrop-blur-xl">
      <div className="p-7 sm:p-9">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xl font-bold tracking-tight text-neutral-900"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
            <CalendarDays className="h-5 w-5" />
          </span>
          Attend<span className="text-violet-600">.</span>
        </Link>

        <div className="mt-9">
          <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-100 text-violet-700">
            <Sparkles className="h-6 w-6" />
          </div>

          <p className="text-xs font-bold uppercase tracking-[0.2em] text-violet-600">
            Welcome back
          </p>

          <h1 aria-live="polite" className="mt-3 min-h-[2.5rem] text-3xl font-bold tracking-tight text-neutral-900 transition-opacity duration-300 sm:text-4xl">
            {greeting}
            <span className="text-violet-600">.</span>
          </h1>

          <p className="mt-3 text-sm leading-6 text-neutral-500">
            Sign in to discover events and manage your experiences.
          </p>
        </div>

        {/* Google sign in */}
        <button
          type="button"
          onClick={google}
          disabled={loading}
          className="mt-8 flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-neutral-200 bg-white text-sm font-semibold text-neutral-700 transition hover:-translate-y-0.5 hover:border-violet-300 hover:bg-violet-50/50 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <svg
                viewBox="0 0 48 48"
                className="h-5 w-5"
                aria-hidden="true"
              >
                <path
                  fill="#EA4335"
                  d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 3.12 13.22l7.98 6.19C13 13.72 18.03 9.5 24 9.5Z"
                  transform="translate(0 5)"
                />
                <path
                  fill="#4285F4"
                  d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.74 7.18l7.67 5.95c4.48-4.14 7.11-10.24 7.11-17.6Z"
                />
                <path
                  fill="#FBBC05"
                  d="M10.62 28.59a14.4 14.4 0 0 1 0-9.18l-7.98-6.19a23.9 23.9 0 0 0 0 21.56l7.98-6.19Z"
                />
                <path
                  fill="#34A853"
                  d="M24 48c6.47 0 11.91-2.13 15.87-5.85l-7.67-5.95c-2.13 1.43-4.86 2.28-8.2 2.28-5.97 0-11-4.22-12.9-9.91l-7.98 6.19C6.51 41.62 14.62 48 24 48Z"
                />
              </svg>
              Continue with Google
            </>
          )}
        </button>

        <div className="my-7 flex items-center gap-4">
          <div className="h-px flex-1 bg-neutral-200" />
          <span className="text-[10px] font-bold tracking-[0.15em] text-neutral-400">
            OR CONTINUE WITH EMAIL
          </span>
          <div className="h-px flex-1 bg-neutral-200" />
        </div>

        {/* Sign-in method selector */}
        <div className="mb-5 grid grid-cols-2 rounded-xl bg-neutral-100 p-1">
          <button
            type="button"
            onClick={() => {
              setMode("password");
              setError("");
            }}
            className={`rounded-lg py-2.5 text-sm font-semibold transition ${
              mode === "password"
                ? "bg-white text-violet-700 shadow-sm"
                : "text-neutral-500 hover:text-neutral-800"
            }`}
          >
            Password
          </button>

          <button
            type="button"
            onClick={() => {
              setMode("otp");
              setError("");
            }}
            className={`rounded-lg py-2.5 text-sm font-semibold transition ${
              mode === "otp"
                ? "bg-white text-violet-700 shadow-sm"
                : "text-neutral-500 hover:text-neutral-800"
            }`}
          >
            Email code
          </button>
        </div>

        <form onSubmit={submit} className="space-y-5">
          {/* Email */}
          <div className="space-y-2">
            <label
              htmlFor="login-email"
              className="text-sm font-semibold text-neutral-700"
            >
              Email address
            </label>

            <input
              id="login-email"
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              placeholder="you@example.com"
              className="h-12 w-full rounded-xl border border-neutral-200 bg-white px-4 text-sm outline-none transition placeholder:text-neutral-400 hover:border-violet-300 focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10"
            />
          </div>

          {/* Password */}
          {mode === "password" && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="login-password"
                  className="text-sm font-semibold text-neutral-700"
                >
                  Password
                </label>

                <Link
                  href="/forgot-password"
                  className="text-xs font-semibold text-violet-600 transition hover:text-violet-800"
                >
                  Forgot password?
                </Link>
              </div>

              <div className="relative">
                <input
                  id="login-password"
                  required
                  type={show ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  className="h-12 w-full rounded-xl border border-neutral-200 bg-white px-4 pr-12 text-sm outline-none transition placeholder:text-neutral-400 hover:border-violet-300 focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10"
                />

                <button
                  type="button"
                  onClick={() => setShow(!show)}
                  aria-label={show ? "Hide password" : "Show password"}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 transition hover:text-violet-600"
                >
                  {show ? <EyeOff size={19} /> : <Eye size={19} />}
                </button>
              </div>
            </div>
          )}

          {passwordUpdated && (
            <div
              role="status"
              className="mb-4 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
            >
              Your password has been updated. Sign in with your new password.
            </div>
          )}

          {(error || authErrorMessage) && (
            <div
              role="alert"
              className="rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-600"
            >
              {error || authErrorMessage}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="group flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-violet-600 text-sm font-semibold text-white shadow-lg shadow-violet-600/20 transition hover:-translate-y-0.5 hover:bg-violet-700 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                {mode === "password" ? "Sign in" : "Send sign-in code"}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-neutral-400">
          <ShieldCheck className="h-4 w-4" />
          Your account and information are protected.
        </div>
      </div>

      <div className="border-t border-neutral-100 bg-neutral-50/70 px-7 py-5 text-center sm:px-9">
        <p className="text-sm text-neutral-500">
          New to Attend?{" "}
          <Link
            href={`/signup?next=${encodeURIComponent(next)}`}
            className="font-bold text-violet-600 transition hover:text-violet-800"
          >
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <main className="relative isolate flex min-h-[calc(100vh-4rem)] items-center justify-center overflow-hidden bg-[#faf9ff] px-4 py-12 sm:px-6">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-violet-300/25 blur-3xl animate-pulse" />
        <div className="absolute -right-32 top-1/4 h-96 w-96 rounded-full bg-purple-300/25 blur-3xl animate-pulse [animation-delay:2s]" />
        <div className="absolute -bottom-40 left-1/3 h-96 w-96 rounded-full bg-indigo-200/30 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(#8b5cf6_0.6px,transparent_0.6px)] [background-size:24px_24px] opacity-[0.12]" />
      </div>

      <div className="w-full max-w-md">
        <Suspense
          fallback={
            <div className="rounded-3xl border border-neutral-200 bg-white p-8 text-center text-sm text-neutral-500 shadow-sm">
              <Loader2 className="mx-auto h-5 w-5 animate-spin text-violet-600" />
              <p className="mt-3">Loading sign in...</p>
            </div>
          }
        >
          <LoginForm />
        </Suspense>

        <p className="mt-7 text-center text-[11px] text-neutral-400">
          © 2026 Attend. All rights reserved.
        </p>
      </div>
    </main>
  );
}
