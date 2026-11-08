import Link from "next/link";
import { ArrowUpRight, CalendarDays, Instagram, Mail } from "lucide-react";

export function Footer() {
  return (
    <footer className="relative overflow-hidden border-t border-violet-100 bg-[#fbfaff]">
      <div className="pointer-events-none absolute -right-24 -top-28 h-72 w-72 rounded-full bg-violet-200/40 blur-3xl" />
      <div className="relative mx-auto max-w-7xl px-5 pb-7 pt-12 sm:px-6 sm:pt-16">
        <div className="grid gap-10 border-b border-violet-100 pb-10 md:grid-cols-[1.4fr_1fr_1fr] md:gap-12">
          <div className="max-w-sm">
            <Link href="/" className="inline-flex items-center gap-2.5 text-xl font-bold tracking-tight text-neutral-950">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-600 text-white shadow-lg shadow-violet-600/20">
                <CalendarDays className="h-5 w-5" />
              </span>
              Attend<span className="text-violet-600">.</span>
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-7 text-neutral-500">
              Discover experiences, bring people together, and share moments that matter.
            </p>
          </div>

          <nav aria-label="Explore Attend" className="space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-[0.16em] text-violet-700">Explore</h2>
            <div className="flex flex-col items-start gap-3 text-sm font-medium text-neutral-600">
              <Link href="/discover" className="transition hover:text-violet-700">Discover events</Link>
              <Link href="/create" className="transition hover:text-violet-700">Create an event</Link>
              <Link href="/about" className="transition hover:text-violet-700">About Attend</Link>
            </div>
          </nav>

          <div className="space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-[0.16em] text-violet-700">Get in touch</h2>
            <a href="mailto:attendplatform@gmail.com" className="inline-flex items-center gap-2 text-sm font-medium text-neutral-600 transition hover:text-violet-700">
              <Mail className="h-4 w-4" />
              attendplatform@gmail.com
              <ArrowUpRight className="h-3.5 w-3.5" />
            </a>
            <p className="text-sm leading-6 text-neutral-500">Have a question or an idea? We would love to hear from you.</p>
          </div>
        </div>

        <div className="flex flex-col gap-4 pt-6 text-xs text-neutral-400 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Attend. All rights reserved.</p>
          <nav aria-label="Legal" className="flex flex-wrap items-center gap-x-5 gap-y-2 font-medium">
            <Link href="/privacy" className="transition hover:text-violet-700">Privacy Policy</Link>
            <Link href="/terms" className="transition hover:text-violet-700">Terms of Service</Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
