
import Link from "next/link";
import { CalendarDays, MapPin, Bookmark } from "lucide-react";
import type { Event } from "@/types/home";
import {
  getCategory,
  formatLocation,
} from "@/lib/utils/home-helpers";
import AvatarStack from "@/components/ui/AvatarStack";
import SaveButton from "@/components/ui/SaveButton";

export function EventCard({ event }: { event: Event }) {
  const category = getCategory(event);

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
    <article className="min-w-0 overflow-hidden rounded-2xl border border-neutral-200 bg-white p-3 shadow-md transition-shadow hover:shadow-lg">
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
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-violet-800" />
        )}

        {category?.name && (
          <span className="absolute left-2 top-2 rounded-full bg-violet-200/90 px-2.5 py-1 text-[10px] font-medium uppercase text-violet-800 shadow-sm">
            {category.name}
          </span>
        )}
      </Link>

      {/* TITLE + BOOKMARK */}
      <div className="mt-2 flex min-w-0 items-start gap-1">
        <Link
          href={`/events/${event.id}`}
          className="min-w-0 flex-1"
        >
          <h3 className="line-clamp-2 text-sm font-bold leading-5 text-neutral-900">
            {event.title}
          </h3>
        </Link>

        <div className="-mr-1 -mt-1 shrink-0">
          <SaveButton
            targetId={event.id}
            targetType="event"
          />
        </div>
      </div>

        {/* DESCRIPTION */}
        {event.description && (
          <p className="mt-1 line-clamp-2 text-xs leading-4 text-neutral-500">
            {event.description}
          </p>
        )}

      {/* DATE + TIME */}
      <div className="mt-1.5 flex min-w-0 items-center gap-1.5 text-xs text-neutral-500">
        <CalendarDays className="h-3.5 w-3.5 shrink-0" />
        <span className="truncate">{formattedDate}</span>
      </div>

      {/* LOCATION */}
      <div className="mt-1 flex min-w-0 items-center gap-1.5 text-xs text-neutral-500">
        <MapPin className="h-3.5 w-3.5 shrink-0" />
        <span className="truncate">{formatLocation(event)}</span>
      </div>

      {/* ATTENDEES + ATTEND ACTION */}
      <div className="mt-2 flex items-center justify-between gap-2 border-t border-neutral-200 pt-2">
        <div className="min-w-0 flex-1">
          <AvatarStack
            eventId={event.id}
            fallbackCount={null}
            label="attending"
          />
        </div>

        <Link
          href={`/events/${event.id}`}
          className="shrink-0 rounded-full bg-violet-600 px-3 py-1.5 text-[11px] font-medium text-white shadow-sm transition hover:bg-violet-700"
        >
          Attend
        </Link>
      </div>
    </article>
  );
}
