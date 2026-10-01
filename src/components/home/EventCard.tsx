import Link from "next/link";
import { CalendarDays, MapPin, Sparkles } from "lucide-react";
import type { Event } from "@/types/home";
import { getCategory, formatDate, formatLocation } from "@/lib/utils/home-helpers";

export function EventCard({ event }: { event: Event }) {
  const category = getCategory(event);

  return (
    <Link
      href={`/events/${event.id}`}
      className="group overflow-hidden rounded-2xl border border-neutral-200 bg-white transition hover:-translate-y-1 hover:shadow-xl hover:shadow-neutral-100"
    >
      {/* COVER */}
      <div className="aspect-[16/10] overflow-hidden bg-neutral-100">
        {event.cover_image ? (
          <img
            src={event.cover_image}
            alt={event.title}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-violet-50 via-white to-violet-100">
            <Sparkles className="h-8 w-8 text-violet-200" />
          </div>
        )}
      </div>

      {/* CONTENT */}
      <div className="p-5">
        {category?.name && (
          <span className="text-xs font-semibold text-violet-600">
            {category.name}
          </span>
        )}

        <h3 className="mt-2 line-clamp-2 text-lg font-semibold tracking-tight text-neutral-950">
          {event.title}
        </h3>

        {event.description && (
          <p className="mt-2 line-clamp-2 text-sm leading-6 text-neutral-500">
            {event.description}
          </p>
        )}

        <div className="mt-4 space-y-2 text-sm text-neutral-500">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 shrink-0" />
            <span>{formatDate(event.start_at)}</span>
          </div>

          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 shrink-0" />
            <span className="truncate">{formatLocation(event)}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
