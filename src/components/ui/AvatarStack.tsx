
"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type PublicAttendee = {
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

export default function AvatarStack({
  eventId,
  fallbackCount = 0,
  label = "attending",
  initialAttendees = [],
  compact = false,
}: Props) {
  const [attendees, setAttendees] = useState<PublicAttendee[]>(initialAttendees);
  const [count, setCount] = useState(fallbackCount ?? 0);

  useEffect(() => {
    let active = true;

    async function loadAttendees() {
      if (initialAttendees.length > 0) return;

      const supabase = createClient();

      try {
        const { data, error } = await supabase
          .from("public_event_attendees")
          .select(
            "user_id,name,profile_display_name,profile_avatar_url,profile_username"
          )
          .eq("event_id", eventId)
          .limit(5);

        if (!active || error || !data) return;

        setAttendees(data as PublicAttendee[]);
        setCount((prev) => Math.max(prev, data.length));
      } catch {
        // Fallback gracefully if public_event_attendees view is not present
      }
    }

    void loadAttendees();

    return () => {
      active = false;
    };
  }, [eventId, initialAttendees]);

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
