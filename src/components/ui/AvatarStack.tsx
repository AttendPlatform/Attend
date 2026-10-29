
"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export type PublicAttendee = {
  user_id: string | null;
  name: string | null;
  profile_display_name: string | null;
  profile_avatar_url: string | null;
  profile_username: string | null;
};

type Props = {
  eventId: string;
  fallbackCount?: number | null;
  label?: string;
  initialAttendees?: PublicAttendee[];
  compact?: boolean;
};

const EMPTY_ATTENDEES: PublicAttendee[] = [];

const attendeeCache = new Map<string, PublicAttendee[]>();
const pendingRequests = new Map<string, Promise<PublicAttendee[]>>();

export function invalidateAttendeeCache(eventId?: string) {
  if (eventId) {
    attendeeCache.delete(eventId);
    pendingRequests.delete(eventId);
  } else {
    attendeeCache.clear();
    pendingRequests.clear();
  }
}

export default function AvatarStack({
  eventId,
  fallbackCount = 0,
  label = "attending",
  initialAttendees = EMPTY_ATTENDEES,
  compact = false,
}: Props) {
  const [attendees, setAttendees] = useState<PublicAttendee[]>(() => {
    if (initialAttendees.length > 0) {
      if (eventId) attendeeCache.set(eventId, initialAttendees);
      return initialAttendees;
    }
    return eventId ? attendeeCache.get(eventId) ?? EMPTY_ATTENDEES : EMPTY_ATTENDEES;
  });

  const [count, setCount] = useState(() =>
    Math.max(fallbackCount ?? 0, attendees.length)
  );

  useEffect(() => {
    if (typeof fallbackCount === "number") {
      setCount((prev) => Math.max(prev, fallbackCount));
    }
  }, [fallbackCount]);

  useEffect(() => {
    if (initialAttendees.length > 0) {
      if (eventId) attendeeCache.set(eventId, initialAttendees);
      setAttendees(initialAttendees);
      setCount((prev) => Math.max(prev, initialAttendees.length));
    }
  }, [eventId, initialAttendees]);

  useEffect(() => {
    if (!eventId) return;

    if (initialAttendees.length > 0) return;

    if (attendeeCache.has(eventId)) {
      const cached = attendeeCache.get(eventId)!;
      setAttendees(cached);
      setCount((prev) => Math.max(prev, cached.length));
      return;
    }

    let active = true;

    async function loadAttendees() {
      try {
        let request = pendingRequests.get(eventId);
        if (!request) {
          const fetchPromise = (async (): Promise<PublicAttendee[]> => {
            try {
              const supabase = createClient();
              const { data, error } = await supabase
                .from("public_event_attendees")
                .select(
                  "user_id,name,profile_display_name,profile_avatar_url,profile_username"
                )
                .eq("event_id", eventId)
                .limit(5);

              if (error || !data) return EMPTY_ATTENDEES;
              return data as PublicAttendee[];
            } catch {
              return EMPTY_ATTENDEES;
            } finally {
              pendingRequests.delete(eventId);
            }
          })();

          pendingRequests.set(eventId, fetchPromise);
          request = fetchPromise;
        }

        const data = await request;
        if (!active || !data) return;

        attendeeCache.set(eventId, data);
        setAttendees(data);
        setCount((prev) => Math.max(prev, data.length));
      } catch {
        // Fallback gracefully if public_event_attendees view is not present
      }
    }

    void loadAttendees();

    return () => {
      active = false;
    };
  }, [eventId]);

  const visibleAttendees = attendees.slice(0, 4);
  const displayedAttendees = compact ? visibleAttendees.slice(0, 3) : visibleAttendees;

  return (
    <div className={`flex min-w-0 items-center ${compact ? "gap-1.5" : "gap-2"}`}>
      {displayedAttendees.length > 0 && (
        <div className={`flex shrink-0 ${compact ? "-space-x-1.5" : "-space-x-2"}`}>
          {displayedAttendees.map((attendee, index) => {
            const name =
              attendee.profile_display_name ||
              attendee.name ||
              attendee.profile_username ||
              "Attendee";

            return (
              <div
                key={`${attendee.user_id ?? name}-${index}`}
                title={name}
                className={`flex items-center justify-center overflow-hidden rounded-full border-2 border-white bg-violet-100 font-semibold text-violet-700 ${
                  compact
                    ? "h-5 w-5 sm:h-6 sm:w-6 text-[8px] sm:text-[9px]"
                    : "h-7 w-7 text-[10px]"
                }`}
              >
                {attendee.profile_avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={attendee.profile_avatar_url}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  name.trim().charAt(0).toUpperCase()
                )}
              </div>
            );
          })}
        </div>
      )}

      <span className={`truncate text-neutral-500 ${compact ? "text-[10px] sm:text-xs" : "text-xs"}`}>
        {count > 0 ? `${count.toLocaleString()} ${label}` : "Be the first to join"}
      </span>
    </div>
  );
}
