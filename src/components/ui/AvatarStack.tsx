
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
};

export default function AvatarStack({
  eventId,
  fallbackCount = 0,
  label = "attending",
}: Props) {
  const [attendees, setAttendees] = useState<PublicAttendee[]>([]);
  const [count, setCount] = useState(fallbackCount ?? 0);

  useEffect(() => {
    let active = true;

    async function loadAttendees() {
      const supabase = createClient();

      const { data, error } = await supabase
        .from("public_event_attendees")
        .select(
          "user_id,name,profile_display_name,profile_avatar_url,profile_username"
        )
        .eq("event_id", eventId)
        .limit(5);

      if (!active || error || !data) return;

      setAttendees(data as PublicAttendee[]);
      setCount(Math.max(fallbackCount ?? 0, data.length));
    }

    void loadAttendees();

    return () => {
      active = false;
    };
  }, [eventId, fallbackCount]);

  const visibleAttendees = attendees.slice(0, 4);

  return (
    <div className="flex min-w-0 items-center gap-2">
      {visibleAttendees.length > 0 && (
        <div className="flex shrink-0 -space-x-2">
          {visibleAttendees.map((attendee, index) => {
            const name =
              attendee.profile_display_name ||
              attendee.name ||
              attendee.profile_username ||
              "Attendee";

            return (
              <div
                key={`${attendee.user_id ?? name}-${index}`}
                title={name}
                className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-full border-2 border-white bg-violet-100 text-[10px] font-semibold text-violet-700"
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

      <span className="truncate text-xs text-neutral-500">
        {count > 0 ? `${count.toLocaleString()} ${label}` : "Be the first to join"}
      </span>
    </div>
  );
}
