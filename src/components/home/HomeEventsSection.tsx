import { CalendarDays } from "lucide-react";
import type { Event } from "@/types/home";
import { EventCard } from "./EventCard";

type Props = {
  events: Event[];
  error?: string;
};

export function HomeEventsSection({ events, error }: Props) {
  if (error) {
    return (
      <div className="mt-8 rounded-2xl border border-red-100 bg-red-50 p-6 text-sm text-red-600">
        We couldn&apos;t load events right now.
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="mt-8 rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 p-10 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white">
          <CalendarDays className="h-5 w-5 text-neutral-400" />
        </div>
        <h3 className="mt-4 font-semibold">No events in this category</h3>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-neutral-500">
          Try another category or check back later for new events.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
      {events.slice(0, 6).map((event) => (
        <EventCard key={event.id} event={event} />
      ))}
    </div>
  );
}
