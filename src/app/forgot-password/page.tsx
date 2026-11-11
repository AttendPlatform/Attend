"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Loader2 } from "lucide-react";

export default function ForgotPasswordPage() {
  const supabase = createClient();
  const [email,setEmail] = useState("");
  const [loading,setLoading] = useState(false);
  const [message,setMessage] = useState("");
  async function submit(e: FormEvent) {
    e.preventDefault(); setLoading(true); setMessage("");
    const redirectTo = `${window.location.origin}/auth/confirm?next=${encodeURIComponent("/reset-password")}`;
    const {error} = await supabase.auth.resetPasswordForEmail(email,{redirectTo});
    setLoading(false);
    setMessage(error ? error.message : "If an account exists for this email, a password reset link has been sent.");
  }
  return <main className="min-h-[calc(100vh-4rem)] bg-neutral-50 px-5 py-12"><div className="mx-auto max-w-md rounded-3xl border border-neutral-200 bg-white p-7 shadow-sm sm:p-9">
    <Link href="/" className="text-xl font-bold">Attend<span className="text-violet-600">.</span></Link>
    <h1 className="mt-8 text-3xl font-semibold">Reset your password</h1>
    <p className="mt-2 text-sm text-neutral-500">We'll email you a secure link to choose a new password.</p>
    <form onSubmit={submit} className="mt-8 space-y-4">
      <label htmlFor="email" className="block text-sm font-medium">Email</label>
      <input id="email" type="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" className="h-12 w-full rounded-xl border border-neutral-200 px-4 text-sm outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-50"/>
      {message && <p role="status" className="text-sm text-neutral-600">{message}</p>}
      <button disabled={loading} className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-violet-600 text-sm font-semibold text-white disabled:opacity-60">{loading && <Loader2 className="h-4 w-4 animate-spin"/>}Send reset link</button>
    </form>
    <Link href="/login" className="mt-6 block text-center text-sm font-semibold text-violet-600">Back to sign in</Link>
  </div></main>;
}
