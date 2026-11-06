"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Eye, EyeOff, Loader2 } from "lucide-react";

export default function ResetPasswordPage() {
  const supabase = createClient(); const router = useRouter();
  const [password,setPassword] = useState(""); const [confirm,setConfirm] = useState("");
  const [visible,setVisible] = useState(false); const [loading,setLoading] = useState(false); const [message,setMessage] = useState("");
  async function submit(e: FormEvent) {
    e.preventDefault();
    if(password.length < 8) { setMessage("Use at least 8 characters."); return; }
    if(password !== confirm) { setMessage("Passwords do not match."); return; }
    setLoading(true); setMessage("");
    const {error} = await supabase.auth.updateUser({password});
    setLoading(false);
    if(error) { setMessage(error.message); return; }
    await supabase.auth.signOut({scope:"others"});
    router.replace("/login?password_updated=1");
  }
  return <main className="min-h-[calc(100vh-4rem)] bg-neutral-50 px-5 py-12"><div className="mx-auto max-w-md rounded-3xl border border-neutral-200 bg-white p-7 shadow-sm sm:p-9">
    <Link href="/" className="text-xl font-bold">Attend<span className="text-violet-600">.</span></Link><h1 className="mt-8 text-3xl font-semibold">Choose a new password</h1>
    <form onSubmit={submit} className="mt-8 space-y-4">
      <label className="block text-sm font-medium" htmlFor="password">New password</label>
      <div className="relative"><input id="password" required minLength={8} type={visible?"text":"password"} value={password} onChange={e=>setPassword(e.target.value)} className="h-12 w-full rounded-xl border border-neutral-200 px-4 pr-12 text-sm"/><button type="button" onClick={()=>setVisible(!visible)} aria-label="Toggle password visibility" className="absolute right-3 top-3 text-neutral-500">{visible?<EyeOff/>:<Eye/>}</button></div>
      <label className="block text-sm font-medium" htmlFor="confirm">Confirm password</label><input id="confirm" required type={visible?"text":"password"} value={confirm} onChange={e=>setConfirm(e.target.value)} className="h-12 w-full rounded-xl border border-neutral-200 px-4 text-sm"/>
      {message && <p role="alert" className="text-sm text-rose-600">{message}</p>}
      <button disabled={loading} className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-violet-600 text-sm font-semibold text-white disabled:opacity-60">{loading&&<Loader2 className="h-4 w-4 animate-spin"/>}Update password</button>
    </form>
  </div></main>;
}
