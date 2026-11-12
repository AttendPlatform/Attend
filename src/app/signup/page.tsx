
"use client";

import { FormEvent, Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { safeAuthRedirect } from "@/lib/auth/redirect";
import { createClient } from "@/lib/supabase/client";
import {
  ArrowRight,
  Eye,
  EyeOff,
  Loader2,
  CalendarDays,
  Sparkles,
  Users,
  Compass,
  Megaphone,
  Image as ImageIcon,
  UserRound,
} from "lucide-react";

const JOIN_REASONS = [
  {
    value: "discover_events",
    label: "Discover and attend events",
    description: "Find events and experiences happening around me.",
    icon: Compass,
  },
  {
    value: "create_events",
    label: "Create and promote events",
    description: "Organise events and reach more people.",
    icon: Megaphone,
  },
  {
    value: "create_campaigns",
    label: "Create campaigns and share content",
    description: "Create graphics and participate in campaigns.",
    icon: ImageIcon,
  },
  {
    value: "connect_communities",
    label: "Connect with people and communities",
    description: "Meet people and discover communities.",
    icon: UserRound,
  },
] as const;

function SignupForm() {
  const supabase = createClient();
  const params = useSearchParams();
  const next = safeAuthRedirect(params.get("next"));

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [reasons, setReasons] = useState<string[]>([]);
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  function toggleReason(value: string) {
    setReasons((current) =>
      current.includes(value)
        ? current.filter((reason) => reason !== value)
        : [...current, value]
    );
  }

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setLoading(true);
    setError("");

    const { data, error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        data: {
          full_name: name.trim(),
          signup_reasons: reasons,
        },
        emailRedirectTo: `${window.location.origin}/auth/confirm?next=${encodeURIComponent(next)}`,
      },
    });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    if (data.session) {
      window.location.assign(next);
      return;
    }

    setSent(true);
  }

  async function google() {
    setLoading(true);
    setError("");

    // Carry the selected reasons through the OAuth callback.
    // The callback route will be updated separately to save them.
    const callbackUrl = new URL(
      "/auth/callback",
      window.location.origin
    );

    callbackUrl.searchParams.set("next", next);
    callbackUrl.searchParams.set(
      "signup_reasons",
      JSON.stringify(reasons)
    );

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: callbackUrl.toString(),
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    }
  }

  return (
    <main className="relative isolate flex min-h-[calc(100vh-4rem)] items-center justify-center overflow-hidden bg-[#faf9ff] px-4 py-10 sm:px-6">
      {/* Decorative background */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-violet-300/25 blur-3xl animate-pulse" />
        <div className="absolute -right-32 top-1/4 h-96 w-96 rounded-full bg-purple-300/25 blur-3xl animate-pulse [animation-delay:2s]" />
        <div className="absolute -bottom-40 left-1/3 h-96 w-96 rounded-full bg-indigo-200/30 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(#8b5cf6_0.6px,transparent_0.6px)] [background-size:24px_24px] opacity-[0.12]" />
      </div>

      <div className="grid w-full max-w-5xl overflow-hidden rounded-[2rem] border border-white/80 bg-white/90 shadow-[0_25px_100px_-30px_rgba(91,33,182,0.25)] backdrop-blur-xl lg:grid-cols-2">
        {/* Left visual panel */}
        <section className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-violet-700 via-purple-700 to-indigo-900 p-12 text-white lg:flex">
          <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full border border-white/10" />
          <div className="absolute -right-12 -top-12 h-56 w-56 rounded-full border border-white/10" />
          <div className="absolute -bottom-32 -left-24 h-96 w-96 rounded-full bg-white/5 blur-2xl" />

          <Link
            href="/"
            className="relative flex items-center gap-2 text-2xl font-bold tracking-tight"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15">
              <CalendarDays className="h-5 w-5" />
            </span>
            Attend<span className="text-purple-200">.</span>
          </Link>

          <div className="relative my-16">
            <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-medium backdrop-blur-md">
              <Sparkles className="h-3.5 w-3.5" />
              Discover. Create. Share.
            </span>

            <h2 className="max-w-md text-4xl font-bold leading-tight tracking-tight xl:text-5xl">
              Life happens when people come together.
            </h2>

            <p className="mt-6 max-w-sm text-base leading-7 text-purple-100/80">
              Discover exciting events, create memorable experiences and
              connect with communities that matter to you.
            </p>

            <div className="mt-10 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/15">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold">
                  Your next experience starts here.
                </p>
                <p className="text-xs text-purple-200">
                  Join the Attend community.
                </p>
              </div>
            </div>
          </div>

          <p className="relative text-xs text-purple-200/70">
            Discover experiences worth showing up for.
          </p>
        </section>

        {/* Signup panel */}
        <section className="p-6 sm:p-10 lg:p-12">
          <div className="mx-auto max-w-md">
            {/* Mobile brand */}
            <Link
              href="/"
              className="mb-8 inline-flex items-center text-2xl font-bold tracking-tight lg:hidden"
            >
              Attend<span className="text-violet-600">.</span>
            </Link>

            {sent ? (
              <div className="py-8">
                <div className="mb-7 flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-100 text-violet-700">
                  <Sparkles className="h-8 w-8" />
                </div>

                <h1 className="text-3xl font-bold tracking-tight text-neutral-900">
                  Check your inbox
                </h1>

                <p className="mt-3 text-sm leading-7 text-neutral-500">
                  We&apos;ve sent a verification email to{" "}
                  <span className="font-semibold text-neutral-800">
                    {email}
                  </span>
                  . Enter the code or use the verification link to activate
                  your account.
                </p>

                <Link
                  href={`/verify-email?email=${encodeURIComponent(email)}&mode=signup&next=${encodeURIComponent(next)}`}
                  className="mt-8 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 text-sm font-semibold text-white shadow-lg shadow-violet-600/20 transition hover:bg-violet-700"
                >
                  Verify email address
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            ) : (
              <>
                <div>
                  <div className="mb-5 hidden h-12 w-12 items-center justify-center rounded-2xl bg-violet-100 text-violet-700 lg:flex">
                    <Sparkles className="h-6 w-6" />
                  </div>

                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-violet-600">
                    Get started for free
                  </p>

                  <h1 className="mt-3 text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl">
                    Create your account
                    <span className="text-violet-600">.</span>
                  </h1>

                  <p className="mt-3 text-sm leading-6 text-neutral-500">
                    Your next experience is waiting. Join Attend and start
                    discovering what brings people together.
                  </p>
                </div>

                <form onSubmit={submit} className="mt-8 space-y-5">
                  {/* Full name */}
                  <div className="space-y-2">
                    <label
                      htmlFor="name"
                      className="text-sm font-semibold text-neutral-700"
                    >
                      Full name
                    </label>
                    <input
                      id="name"
                      required
                      maxLength={80}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      autoComplete="name"
                      placeholder="Your full name"
                      className="h-12 w-full rounded-xl border border-neutral-200 bg-white px-4 text-sm outline-none transition placeholder:text-neutral-400 hover:border-violet-300 focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10"
                    />
                  </div>

                  {/* Email */}
                  <div className="space-y-2">
                    <label
                      htmlFor="email"
                      className="text-sm font-semibold text-neutral-700"
                    >
                      Email address
                    </label>
                    <input
                      id="email"
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
                  <div className="space-y-2">
                    <label
                      htmlFor="password"
                      className="text-sm font-semibold text-neutral-700"
                    >
                      Password
                    </label>

                    <div className="relative">
                      <input
                        id="password"
                        required
                        minLength={8}
                        type={show ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoComplete="new-password"
                        placeholder="At least 8 characters"
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

                    <p className="text-xs text-neutral-400">
                      Use at least 8 characters.
                    </p>
                  </div>

                  {/* Reasons for joining */}
                  <fieldset className="space-y-3">
                    <div>
                      <legend className="text-sm font-semibold text-neutral-800">
                        What brings you to Attend?
                      </legend>
                      <p className="mt-1 text-xs leading-5 text-neutral-500">
                        Select all that apply. This helps us personalise your
                        experience.
                      </p>
                    </div>

                    <div className="space-y-2">
                      {JOIN_REASONS.map((reason) => {
                        const Icon = reason.icon;
                        const checked = reasons.includes(reason.value);

                        return (
                          <label
                            key={reason.value}
                            className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition ${
                              checked
                                ? "border-violet-400 bg-violet-50/80"
                                : "border-neutral-200 bg-white hover:border-violet-200 hover:bg-violet-50/30"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleReason(reason.value)}
                              className="mt-1 h-4 w-4 shrink-0 accent-violet-600"
                            />

                            <span
                              className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                                checked
                                  ? "bg-violet-100 text-violet-700"
                                  : "bg-neutral-100 text-neutral-500"
                              }`}
                            >
                              <Icon className="h-4 w-4" />
                            </span>

                            <span className="min-w-0 flex-1">
                              <span className="block text-sm font-semibold text-neutral-800">
                                {reason.label}
                              </span>
                              <span className="mt-0.5 block text-xs leading-5 text-neutral-500">
                                {reason.description}
                              </span>
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </fieldset>

                  {error && (
                    <p
                      role="alert"
                      className="rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-600"
                    >
                      {error}
                    </p>
                  )}

                  {/* Email signup */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="group flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-violet-600 text-sm font-semibold text-white shadow-lg shadow-violet-600/20 transition hover:-translate-y-0.5 hover:bg-violet-700 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        Create account
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </>
                    )}
                  </button>
                </form>

                {/* Divider */}
                <div className="my-6 flex items-center gap-4">
                  <div className="h-px flex-1 bg-neutral-200" />
                  <span className="text-[10px] font-bold tracking-[0.15em] text-neutral-400">
                    OR CONTINUE WITH
                  </span>
                  <div className="h-px flex-1 bg-neutral-200" />
                </div>

                {/* Google signup */}
                <button
                  type="button"
                  onClick={google}
                  disabled={loading}
                  className="flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-neutral-200 bg-white text-sm font-semibold text-neutral-700 transition hover:-translate-y-0.5 hover:border-violet-300 hover:bg-violet-50/50 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
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

                {/* Legal notice: intentionally below Google */}
                <p className="mt-5 text-center text-xs leading-6 text-neutral-500">
                  By creating an account, you agree to our{" "}
                  <Link
                    href="/terms"
                    className="font-semibold text-violet-600 underline-offset-4 hover:underline"
                  >
                    Terms of Service
                  </Link>{" "}
                  and acknowledge our{" "}
                  <Link
                    href="/privacy"
                    className="font-semibold text-violet-600 underline-offset-4 hover:underline"
                  >
                    Privacy Policy
                  </Link>
                  .
                </p>
              </>
            )}

            <p className="mt-8 text-center text-sm text-neutral-500">
              Already have an account?{" "}
              <Link
                href={`/login?next=${encodeURIComponent(next)}`}
                className="font-bold text-violet-600 transition hover:text-violet-800"
              >
                Sign in
              </Link>
            </p>

            <p className="mt-8 text-center text-[11px] text-neutral-400">
              © 2026 Attend. All rights reserved.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}

export default function SignupPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-[#faf9ff] px-4">
          <p className="text-sm text-neutral-500">Loading signup...</p>
        </main>
      }
    >
      <SignupForm />
    </Suspense>
  );
}
