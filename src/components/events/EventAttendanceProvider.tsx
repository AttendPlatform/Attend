"use client";

import {
  createContext,
  useContext,
  useState,
  useTransition,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { toggleAttendanceAction } from "@/app/actions/attendance";
import {
  getGuestIntent,
  clearGuestIntent,
  parseGuestIntentFromSearch,
  buildLoginUrlWithIntent,
  setGuestIntent,
} from "@/lib/utils/guest-intent";

export type AttendanceStatus =
  | "none"
  | "attending"
  | "registered"
  | "ticketed"
  | "cancelled";

interface EventAttendanceContextValue {
  eventId: string;
  eventTitle: string;
  participationModel: string;
  externalUrl: string | null;
  isLoggedIn: boolean;
  eventStatus: string;
  status: AttendanceStatus;
  isAttending: boolean;
  isPending: boolean;
  errorMessage: string | null;
  isCancelModalOpen: boolean;
  isRegistrationModalOpen: boolean;
  triggerElement: HTMLElement | null;
  participationConfig?: Record<string, unknown> | null;
  userName?: string;
  userEmail?: string;
  openCancelModal: (trigger?: HTMLElement | null) => void;
  closeCancelModal: () => void;
  openRegistrationModal: () => void;
  closeRegistrationModal: () => void;
  handleRegistrationSuccess: () => void;
  handleToggleRSVP: (trigger?: HTMLElement | null) => void;
  handleConfirmCancel: () => void;
}

const EventAttendanceContext =
  createContext<EventAttendanceContextValue | null>(null);

export interface EventAttendanceProviderProps {
  eventId: string;
  eventTitle: string;
  participationModel: string;
  externalUrl: string | null;
  isLoggedIn: boolean;
  initialStatus: AttendanceStatus;
  eventStatus?: string;
  participationConfig?: Record<string, unknown> | null;
  userName?: string;
  userEmail?: string;
  children: ReactNode;
}

export function EventAttendanceProvider({
  eventId,
  eventTitle,
  participationModel,
  externalUrl,
  isLoggedIn,
  initialStatus = "none",
  eventStatus = "published",
  participationConfig,
  userName = "",
  userEmail = "",
  children,
}: EventAttendanceProviderProps) {
  const [status, setStatus] = useState<AttendanceStatus>(initialStatus);
  const [prevInitial, setPrevInitial] = useState<AttendanceStatus>(initialStatus);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isRegistrationModalOpen, setIsRegistrationModalOpen] = useState(false);
  const [triggerElement, setTriggerElement] = useState<HTMLElement | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  if (initialStatus !== prevInitial) {
    setPrevInitial(initialStatus);
    setStatus(initialStatus);
  }

  const isAttending =
    status === "attending" ||
    status === "registered" ||
    status === "ticketed";

  const openCancelModal = useCallback((trigger?: HTMLElement | null) => {
    if (trigger) {
      setTriggerElement(trigger);
    } else if (typeof document !== "undefined" && document.activeElement instanceof HTMLElement) {
      setTriggerElement(document.activeElement);
    }
    setIsCancelModalOpen(true);
  }, []);

  const closeCancelModal = useCallback(() => {
    setIsCancelModalOpen(false);
  }, []);

  const openRegistrationModal = useCallback(() => {
    setIsRegistrationModalOpen(true);
  }, []);

  useEffect(() => {
    if (!isLoggedIn || typeof window === "undefined") return;

    const urlIntent = parseGuestIntentFromSearch(window.location.search);
    const storedIntent = getGuestIntent();
    const action =
      urlIntent || (storedIntent?.eventId === eventId ? storedIntent.action : null);

    if (!action) return;

    clearGuestIntent();
    if (urlIntent) {
      const url = new URL(window.location.href);
      url.searchParams.delete("intent");
      window.history.replaceState({}, "", url.pathname + (url.search ? url.search : ""));
    }

    if (action === "register") {
      if (status !== "registered") {
        setIsRegistrationModalOpen(true);
      }
    } else if (action === "attend") {
      if (status !== "attending" && status !== "registered" && status !== "ticketed") {
        setStatus("attending");
        startTransition(async () => {
          const pathname = window.location.pathname;
          const result = await toggleAttendanceAction(eventId, pathname);
          if (result.error || !result.status) {
            setStatus("none");
            setErrorMessage(result.error ?? "Failed to complete attendance.");
            return;
          }
          setStatus(result.status);
        });
      }
    }
  }, [eventId, isLoggedIn, status]);

  const closeRegistrationModal = useCallback(() => {
    setIsRegistrationModalOpen(false);
  }, []);

  const handleRegistrationSuccess = useCallback(() => {
    setStatus("registered");
    setIsRegistrationModalOpen(false);
  }, []);

  const handleToggleRSVP = useCallback(
    (trigger?: HTMLElement | null) => {
      if (isPending) return;

      if (!isLoggedIn) {
        const intentAction = participationModel === "registration" ? "register" : "attend";
        setGuestIntent({ eventId, action: intentAction });
        const nextUrl = typeof window !== "undefined" ? window.location.pathname : `/events/${eventId}`;
        router.push(buildLoginUrlWithIntent(eventId, intentAction, nextUrl));
        return;
      }

      if (isAttending) {
        openCancelModal(trigger);
        return;
      }

      if (participationModel === "registration") {
        openRegistrationModal();
        return;
      }

      setErrorMessage(null);
      const previousStatus = status;
      setStatus("attending");

      startTransition(async () => {
        const pathname = typeof window !== "undefined" ? window.location.pathname : undefined;
        const result = await toggleAttendanceAction(eventId, pathname);

        if (result.requiresLogin) {
          setStatus(previousStatus);
          router.push(`/login?next=${encodeURIComponent(window.location.pathname)}`);
          return;
        }

        if (result.error || !result.status) {
          setStatus(previousStatus);
          setErrorMessage(result.error ?? "Failed to update RSVP.");
          return;
        }

        setStatus(result.status);
      });
    },
    [eventId, isAttending, isLoggedIn, isPending, openCancelModal, openRegistrationModal, participationModel, router, status]
  );

  const handleConfirmCancel = useCallback(() => {
    if (isPending) return;

    setErrorMessage(null);
    const previousStatus = status;
    setStatus("cancelled");
    setIsCancelModalOpen(false);

    startTransition(async () => {
      const pathname = typeof window !== "undefined" ? window.location.pathname : undefined;
      const result = await toggleAttendanceAction(eventId, pathname);

      if (result.requiresLogin) {
        setStatus(previousStatus);
        router.push(`/login?next=${encodeURIComponent(window.location.pathname)}`);
        return;
      }

      if (result.error || !result.status) {
        setStatus(previousStatus);
        setErrorMessage(result.error ?? "Failed to cancel RSVP.");
        return;
      }

      setStatus(result.status);
    });
  }, [eventId, isPending, router, status]);

  return (
    <EventAttendanceContext.Provider
      value={{
        eventId,
        eventTitle,
        participationModel,
        externalUrl,
        isLoggedIn,
        eventStatus,
        status,
        isAttending,
        isPending,
        errorMessage,
        isCancelModalOpen,
        isRegistrationModalOpen,
        triggerElement,
        participationConfig,
        userName,
        userEmail,
        openCancelModal,
        closeCancelModal,
        openRegistrationModal,
        closeRegistrationModal,
        handleRegistrationSuccess,
        handleToggleRSVP,
        handleConfirmCancel,
      }}
    >
      {children}
    </EventAttendanceContext.Provider>
  );
}

export function useEventAttendance() {
  const context = useContext(EventAttendanceContext);
  return context;
}
