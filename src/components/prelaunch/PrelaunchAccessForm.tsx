"use client";

import { FormEvent, useState } from "react";
import { ArrowRight, CheckCircle2, ShieldCheck, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type IntendedUse = "attend" | "create" | "both";

export default function PrelaunchAccessForm() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [intendedUse, setIntendedUse] = useState<IntendedUse | "">("");
  const [message, setMessage] = useState("");
  const [website, setWebsite] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    // Quiet honeypot for basic bot filtering.
    if (website.trim()) {
      setSubmitted(true);
      return;
    }

    if (!intendedUse) {
      setError("Please choose how you plan to use EventSocial.");
      return;
    }

    setSubmitting(true);
    try {
      const supabase = createClient() as any;
      const { error: insertError } = await supabase
        .from("access_requests")
        .insert({
          full_name: fullName.trim(),
          email: email.trim().toLowerCase(),
          phone: phone.trim() || null,
          intended_use: intendedUse,
          message: message.trim() || null,
          status: "pending",
        });

      if (insertError) {
        if (insertError.code === "23505") {
          throw new Error("A request with this email may already exist. If you have already applied, our team will review it.");
        }
        throw new Error("We couldn't submit your request just now. Please check your connection and try again.");
      }

      setSubmitted(true);
      setFullName("");
      setEmail("");
      setPhone("");
      setIntendedUse("");
      setMessage("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-[80vh] bg-white">
      <section className="mx-auto grid max-w-6xl gap-12 px-5 py-12 sm:px-8 sm:py-16 lg:grid-cols-[0.9fr_1.1fr] lg:items-start lg:gap-20">
        <div className="pt-2">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-violet-100 bg-violet-50 px-3 py-1.5 text-xs font-semibold text-violet-700">
            <Sparkles className="h-3.5 w-3.5" /> Early access is opening soon
          </div>
          <h1 className="max-w-xl text-4xl font-semibold tracking-tight text-neutral-950 sm:text-5xl">
            Good things happen when people <span className="text-violet-700">show up.</span>
          </h1>
          <p className="mt-5 max-w-lg text-base leading-7 text-neutral-600">
            EventSocial helps you discover events, bring people together, and create moments worth sharing. Request early access and our team will be in touch.
          </p>
          <div className="mt-9 space-y-4">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-50 text-violet-700"><CheckCircle2 className="h-4 w-4" /></span>
              <div><p className="font-medium text-neutral-900">One simple request</p><p className="mt-1 text-sm text-neutral-500">Tell us a little about yourself and what you want to do.</p></div>
            </div>
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-50 text-violet-700"><ShieldCheck className="h-4 w-4" /></span>
              <div><p className="font-medium text-neutral-900">Reviewed by our team</p><p className="mt-1 text-sm text-neutral-500">We review requests and email access instructions when your account is ready.</p></div>
            </div>
          </div>
          <p className="mt-10 text-xs text-neutral-400">No password required. Submitting a request does not automatically create an account.</p>
        </div>

        <div className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm sm:p-8">
          {submitted ? (
            <div className="py-10 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-50 text-green-700"><CheckCircle2 className="h-7 w-7" /></div>
              <h2 className="mt-5 text-2xl font-semibold text-neutral-950">Request received</h2>
              <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-neutral-600">Thanks for your interest in EventSocial. Our team will review your request and contact you by email with the next steps.</p>
              <button type="button" onClick={() => setSubmitted(false)} className="mt-7 text-sm font-semibold text-violet-700 hover:text-violet-800">Submit another request</button>
            </div>
          ) : (
            <>
              <div className="mb-7">
                <p className="text-sm font-semibold text-violet-700">REQUEST ACCESS</p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-neutral-950">Let’s get to know you</h2>
                <p className="mt-2 text-sm text-neutral-500">A few details are all we need to get started.</p>
              </div>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="absolute -left-[10000px] top-auto h-px w-px overflow-hidden" aria-hidden="true">
                  <label htmlFor="website">Website</label>
                  <input id="website" tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
                </div>
                <div>
                  <label htmlFor="fullName" className="mb-2 block text-sm font-medium text-neutral-800">Full name <span className="text-red-500">*</span></label>
                  <input id="fullName" required minLength={2} maxLength={100} autoComplete="name" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your full name" className="h-12 w-full rounded-xl border border-neutral-200 bg-white px-4 text-sm outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-100" />
                </div>
                <div>
                  <label htmlFor="email" className="mb-2 block text-sm font-medium text-neutral-800">Email address <span className="text-red-500">*</span></label>
                  <input id="email" required type="email" maxLength={254} autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="h-12 w-full rounded-xl border border-neutral-200 bg-white px-4 text-sm outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-100" />
                </div>
                <div>
                  <label htmlFor="phone" className="mb-2 block text-sm font-medium text-neutral-800">Phone number <span className="font-normal text-neutral-400">(optional)</span></label>
                  <input id="phone" type="tel" maxLength={30} autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+234 800 000 0000" className="h-12 w-full rounded-xl border border-neutral-200 bg-white px-4 text-sm outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-100" />
                </div>
                <fieldset>
                  <legend className="mb-3 text-sm font-medium text-neutral-800">How would you like to use EventSocial? <span className="text-red-500">*</span></legend>
                  <div className="grid gap-2 sm:grid-cols-3">
                    {([{value:"attend",title:"Attend events",desc:"Find events and join in"},{value:"create",title:"Create events",desc:"Host and promote events"},{value:"both",title:"A bit of both",desc:"Discover and organise"}] as const).map((option) => (
                      <button key={option.value} type="button" onClick={() => setIntendedUse(option.value)} aria-pressed={intendedUse === option.value} className={`rounded-xl border p-3 text-left transition ${intendedUse === option.value ? "border-violet-500 bg-violet-50 ring-2 ring-violet-100" : "border-neutral-200 hover:border-neutral-300"}`}>
                        <span className="block text-sm font-semibold text-neutral-900">{option.title}</span>
                        <span className="mt-1 block text-xs text-neutral-500">{option.desc}</span>
                      </button>
                    ))}
                  </div>
                </fieldset>
                <div>
                  <label htmlFor="message" className="mb-2 block text-sm font-medium text-neutral-800">Anything you’d like us to know? <span className="font-normal text-neutral-400">(optional)</span></label>
                  <textarea id="message" rows={3} maxLength={500} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Tell us briefly what you’re looking forward to..." className="w-full resize-y rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-100" />
                </div>
                {error && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
                <button type="submit" disabled={submitting} className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-violet-700 px-5 text-sm font-semibold text-white transition hover:bg-violet-800 disabled:cursor-not-allowed disabled:opacity-60">
                  {submitting ? "Sending request..." : "Request early access"} {!submitting && <ArrowRight className="h-4 w-4" />}
                </button>
                <p className="text-center text-xs leading-5 text-neutral-400">By submitting, you agree that EventSocial may contact you about your access request.</p>
              </form>
            </>
          )}
        </div>
      </section>
    </main>
  );
}
