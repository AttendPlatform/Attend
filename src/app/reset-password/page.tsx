"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Eye, EyeOff, Loader2 } from "lucide-react";

export default function ResetPasswordPage() {
  const supabase = createClient();
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [hasSession, setHasSession] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;

    async function checkRecoverySession() {
      const { data, error } = await supabase.auth.getUser();
      if (!active) return;

      const sessionExists = !error && Boolean(data.user);
      setHasSession(sessionExists);
      setCheckingSession(false);

      if (!sessionExists) {
        setMessage("This password reset link is invalid or has expired.");
      }
    }

    void checkRecoverySession();

    return () => {
      active = false;
    };
  }, [supabase]);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!hasSession) {
      setMessage("Your password reset session has expired. Request a new link.");
      return;
    }
    if (password.length < 8) {
      setMessage("Use at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setMessage("Passwords do not match.");
      return;
    }

    setLoading(true);
    setMessage("");

    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setLoading(false);
      setMessage(error.message);
      return;
    }

    // End this browser session after the password change. Navigation still
    // proceeds if the sign-out request fails, so the form cannot get stuck.
    try {
      const { error: signOutError } = await supabase.auth.signOut({
        scope: "local",
      });
      if (signOutError) {
        console.error("Password updated, but local sign-out failed:", signOutError);
      }
    } catch (signOutError) {
      console.error("Password updated, but local sign-out failed:", signOutError);
    } finally {
      setLoading(false);
      window.location.assign("/login?password_updated=1");
    }
  }

  if (checkingSession) {
    return (
      <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-neutral-50 px-5 py-12">
        <Loader2 className="h-5 w-5 animate-spin text-violet-600" />
        <span className="ml-3 text-sm text-neutral-500">
          Checking your reset link...
        </span>
      </main>
    );
  }

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-neutral-50 px-5 py-12">
      <div className="mx-auto max-w-md rounded-3xl border border-neutral-200 bg-white p-7 shadow-sm sm:p-9">
        <Link href="/" className="text-xl font-bold">
          Attend<span className="text-violet-600">.</span>
        </Link>
        <h1 className="mt-8 text-3xl font-semibold">
          Choose a new password
        </h1>

        {!hasSession ? (
          <div className="mt-5 space-y-4">
            <p role="alert" className="text-sm leading-6 text-rose-600">
              {message}
            </p>
            <Link
              href="/forgot-password"
              className="inline-flex text-sm font-semibold text-violet-600 hover:text-violet-800"
            >
              Request a new password reset link
            </Link>
            <Link
              href="/login"
              className="block text-sm font-medium text-neutral-500 hover:text-neutral-800"
            >
              Back to sign in
            </Link>
          </div>
        ) : (
          <form onSubmit={submit} className="mt-8 space-y-4">
            <label className="block text-sm font-medium" htmlFor="password">
              New password
            </label>
            <div className="relative">
              <input
                id="password"
                required
                minLength={8}
                type={visible ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-12 w-full rounded-xl border border-neutral-200 px-4 pr-12 text-sm"
              />
              <button
                type="button"
                onClick={() => setVisible(!visible)}
                aria-label="Toggle password visibility"
                className="absolute right-3 top-3 text-neutral-500"
              >
                {visible ? <EyeOff /> : <Eye />}
              </button>
            </div>

            <label className="block text-sm font-medium" htmlFor="confirm">
              Confirm password
            </label>
            <input
              id="confirm"
              required
              type={visible ? "text" : "password"}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="h-12 w-full rounded-xl border border-neutral-200 px-4 text-sm"
            />

            {message && (
              <p role="alert" className="text-sm text-rose-600">
                {message}
              </p>
            )}

            <button
              disabled={loading}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-violet-600 text-sm font-semibold text-white disabled:opacity-60"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Update password
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
