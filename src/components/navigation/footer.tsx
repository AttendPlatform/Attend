import Link from "next/link";
import { Mail } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-neutral-100 bg-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-5 py-8 sm:px-6 md:flex-row md:items-center md:justify-between">
        <div>
          <Link href="/" className="text-lg font-bold tracking-tight text-neutral-950">
            Attend<span className="text-violet-600">.</span>
          </Link>
          <p className="mt-1 text-sm text-neutral-500">Discover. Create. Share.</p>
        </div>
        <nav aria-label="Footer navigation" className="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm font-medium text-neutral-500">
          <Link href="/discover" className="transition hover:text-violet-600">Discover</Link>
          <Link href="/create" className="transition hover:text-violet-600">Create</Link>
          <Link href="/about" className="transition hover:text-violet-600">About us</Link>
          <a href="mailto:attendplatform@gmail.com" className="inline-flex items-center gap-2 transition hover:text-violet-600">
            <Mail className="h-4 w-4" /> Contact
          </a>
        </nav>
        <p className="text-xs text-neutral-400">© {new Date().getFullYear()} Attend. All rights reserved.</p>
      </div>
    </footer>
  );
}
