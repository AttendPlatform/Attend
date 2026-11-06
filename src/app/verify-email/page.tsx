"use client";

import { FormEvent, Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ArrowLeft, Loader2 } from "lucide-react";

function VerifyEmailForm() {
  const supabase = createClient();
  const router = useRouter();
  const params = useSearchParams();
  const email = params.get("email") ?? "";
  const mode = params.get("mode") === "otp" ? "otp" : "signup";
  const next = params.get("next") ?? "/";
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function verify(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    const { error } = await supabase.auth.verifyOtp({
      email,
      token: token.trim(),
      type: mode === "signup" ? "signup" : "email",
    });
    setLoading(false);
    if (error) { setMessage(error.message); return; }
    router.replace(next.startsWith("/") && !next.startsWith("//") ? next : "/");
    router.refresh();
  }

  async function resend() {
    setLoading(true);
    setMessage("");
    const result = mode === "signup"
      ? await supabase.auth.resend({ type: "signup", email })
      : await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: false } });
    setLoading(false);
    setMessage(result.error ? result.error.message : "A new code has been sent. Check your inbox.");
  }

  return <main className="min-h-[calc(100vh-4rem)] bg-neutral-50 px-5 py-12"><div className="mx-auto max-w-md rounded-3xl border border-neutral-200 bg-white p-7 shadow-sm sm:p-9">
    <Link href="/" className="text-xl font-bold tracking-tight">Attend<span className="text-violet-600">.</span></Link>
    <h1 className="mt-8 text-3xl font-semibold tracking-tight">Check your email</h1>
    <p className="mt-2 text-sm leading-6 text-neutral-500">Enter the verification code sent to <strong>{email}</strong>. You can also use the verification link in that email.</p>
    <form onSubmit={verify} className="mt-8 space-y-4">
      <label className="block text-sm font-medium" htmlFor="code">Six-digit code</label>
      <input id="code" required inputMode="numeric" autoComplete="one-time-code" maxLength={8} value={token} onChange={e=>setToken(e.target.value.replace(/\s/g,""))} placeholder="Enter code" className="h-12 w-full rounded-xl border border-neutral-200 px-4 text-center text-lg tracking-[0.3em] outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-50"/>
      {message && <p role="status" className="text-sm text-rose-600">{message}</p>}
      <button disabled={loading} className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-violet-600 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-60">{loading ? <Loader2 className="h-4 w-4 animate-spin"/> : null}Verify email</button>
    </form>
    <button onClick={resend} disabled={loading || !email} className="mt-5 w-full text-sm font-semibold text-violet-600 disabled:opacity-50">Resend code</button>
    <Link href="/login" className="mt-6 flex items-center justify-center gap-2 text-sm text-neutral-500"><ArrowLeft className="h-4 w-4"/> Back to sign in</Link>
  </div></main>;
}

export default function VerifyEmailPage() {
  return <Suspense fallback={<div className="p-12 text-center text-neutral-500">Loading...</div>}><VerifyEmailForm/></Suspense>;
}
