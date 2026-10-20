"use client";

import SaveButton from "@/components/ui/SaveButton";
import ShareButton from "@/components/ui/ShareButton";
import EventPrimaryAction from "./EventPrimaryAction";

export interface MobileEventActionBarProps {
  eventId: string;
  eventTitle: string;
  participationModel: string;
  externalUrl: string | null;
  isLoggedIn: boolean;
  initialStatus: "none" | "attending" | "registered" | "ticketed" | "cancelled";
  eventStatus?: string;
  participationConfig?: Record<string, unknown> | null;
  userName?: string;
  userEmail?: string;
  isSaved?: boolean;
}

export default function MobileEventActionBar({
  eventId,
  eventTitle,
  participationModel,
  externalUrl,
  isLoggedIn,
  initialStatus,
  eventStatus,
  participationConfig,
  userName,
  userEmail,
  isSaved = false,
}: MobileEventActionBarProps) {
  return (
    <div
      aria-label="Mobile event actions"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-neutral-200/80 bg-white/95 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-4px_24px_rgba(0,0,0,0.08)] backdrop-blur-md md:hidden animate-in slide-in-from-bottom duration-200"
    >
      <div className="mx-auto flex max-w-lg items-center gap-3">
        {/* Quick Save and Share buttons */}
        <div className="flex shrink-0 items-center gap-1.5">
          <SaveButton
            targetId={eventId}
            targetType="event"
            initialSaved={isSaved}
          />
          <ShareButton
            title={eventTitle}
            path={`/events/${eventId}`}
            sourceType="event"
          />
        </div>

        {/* Primary Action Button */}
        <div className="flex-1 min-w-0">
          <EventPrimaryAction
            eventId={eventId}
            eventTitle={eventTitle}
            participationModel={participationModel}
            externalUrl={externalUrl}
            isLoggedIn={isLoggedIn}
            initialStatus={initialStatus}
            eventStatus={eventStatus}
            participationConfig={participationConfig}
            userName={userName}
            userEmail={userEmail}
          />
        </div>
      </div>
    </div>
  );
}
