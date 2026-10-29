import Link from "next/link";
import { CalendarDays, MapPin } from "lucide-react";
import type { Event } from "@/types/home";
import type { DiscoverEvent } from "@/services/discover.service";
import {
  getCategory,
} from "@/lib/utils/home-helpers";
import AvatarStack from "@/components/ui/AvatarStack";
import SaveButton from "@/components/ui/SaveButton";

export function EventCard({ event }: { event: Event | DiscoverEvent }) {
  const category = "category" in event && event.category ? event.category : getCategory(event as Event);

  const formattedDate = event.start_at
    ? (() => {
        const date = new Date(event.start_at);

        if (Number.isNaN(date.getTime())) return "Date TBA";

        return date.toLocaleString("en-NG", {
          weekday: "short",
          month: "short",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
        });
      })()
    : "Date TBA";

  return (
    <article className="group min-w-0 overflow-hidden rounded-2xl border border-neutral-200 bg-white p-2.5 sm:p-3 shadow-sm transition-all duration-300 hover:border-violet-300 hover:shadow-md">
      {/* COVER */}
      <Link
        href={`/events/${event.id}`}
        className="relative block aspect-square overflow-hidden rounded-xl bg-violet-800"
        aria-label={`View ${event.title}`}
      >
        {event.cover_image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={event.cover_image}
            alt={event.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-violet-800" />
        )}

        {category?.name && (
          <span className="absolute left-2 top-2 rounded-full bg-violet-200/90 px-2 py-0.5 text-[9px] sm:text-[10px] font-semibold uppercase text-violet-900 shadow-sm backdrop-blur">
            {category.name}
          </span>
        )}
      </Link>

      {/* TITLE + BOOKMARK */}
      <div className="mt-2 flex min-w-0 items-start justify-between gap-1">
        <Link
          href={`/events/${event.id}`}
          className="min-w-0 flex-1"
        >
          <h3 className="line-clamp-2 font-serif text-xs sm:text-sm font-bold leading-tight text-neutral-900 group-hover:text-violet-700">
            {event.title}
          </h3>
        </Link>

        <div className="-mr-1 -mt-0.5 shrink-0">
          <SaveButton
            targetId={event.id}
            targetType="event"
          />
        </div>
      </div>

      {/* DESCRIPTION */}
      {event.description && (
        <p className="mt-0.5 line-clamp-2 text-[10px] sm:text-xs leading-4 text-neutral-500">
          {event.description}
        </p>
      )}

      {/* DATE + TIME */}
      <div className="mt-1 flex min-w-0 items-center gap-1 text-[10px] sm:text-xs text-neutral-500">
        <CalendarDays className="h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0 text-neutral-400" />
        <span className="truncate">{formattedDate}</span>
      </div>

      {/* LOCATION */}
      <div className="mt-0.5 flex min-w-0 items-center gap-1 text-[10px] sm:text-xs text-neutral-500">
        <MapPin className="h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0 text-neutral-400" />
        <span className="truncate">
          {event.is_online
            ? "Online event"
            : [event.city, event.state].filter(Boolean).join(", ") || ("venue_name" in event && event.venue_name ? event.venue_name : "Location TBA")}
        </span>
      </div>

      {/* ATTENDEES + ATTEND ACTION */}
      <div className="mt-2 flex items-center justify-between gap-1 border-t border-neutral-100 pt-1.5">
        <div className="min-w-0 flex-1">
          <AvatarStack
            eventId={event.id}
            fallbackCount={event.participant_count ?? 0}
            label="attending"
            compact
          />
        </div>

        <Link
          href={`/events/${event.id}`}
          className="shrink-0 rounded-full bg-violet-600 px-2.5 sm:px-3 py-1 text-[10px] sm:text-[11px] font-semibold text-white shadow-sm transition hover:bg-violet-700"
        >
          Attend
        </Link>
      </div>
    </article>
  );
}
export default EventCard;
