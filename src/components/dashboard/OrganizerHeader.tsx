import Link from "next/link";
import { ArrowLeft, ExternalLink, CalendarDays, MapPin } from "lucide-react";
import type { OrganizerEventDetails } from "@/services/organizer.service";

interface OrganizerHeaderProps {
  event: OrganizerEventDetails;
}

export function OrganizerHeader({ event }: OrganizerHeaderProps) {
  const statusStyles: Record<string, string> = {
    published: "bg-emerald-50 text-emerald-700 border-emerald-200",
    draft: "bg-amber-50 text-amber-700 border-amber-200",
    cancelled: "bg-red-50 text-red-700 border-red-200",
  };

  const statusClass = statusStyles[event.status.toLowerCase()] || "bg-neutral-100 text-neutral-700 border-neutral-200";

  return (
    <header className="border-b border-neutral-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 sm:py-6">
        <div className="flex items-center gap-2 text-xs text-neutral-500 mb-2">
          <Link
            href="/profile"
            className="inline-flex items-center gap-1 hover:text-neutral-900 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>My Events</span>
          </Link>
          <span>/</span>
          <span className="truncate max-w-[200px]">{event.title}</span>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-serif text-2xl font-bold tracking-tight text-neutral-950 sm:text-3xl">
                {event.title}
              </h1>
              <span
                className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider capitalize ${statusClass}`}
              >
                {event.status}
              </span>
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-neutral-500">
              {event.start_at && (
                <div className="flex items-center gap-1">
                  <CalendarDays className="h-3.5 w-3.5 text-neutral-400" />
                  <span>{new Date(event.start_at).toLocaleDateString("en-NG", { dateStyle: "medium" })}</span>
                </div>
              )}
              <div className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5 text-neutral-400" />
                <span>
                  {event.is_online
                    ? "Online Event"
                    : [event.venue_name, event.city].filter(Boolean).join(", ") || "Location TBA"}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href={`/events/${event.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-neutral-700 shadow-sm transition hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700"
            >
              <span>View Public Page</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
