export type GuestIntentAction = "attend" | "register";

export interface GuestIntentPayload {
  eventId: string;
  action: GuestIntentAction;
  returnUrl?: string;
  timestamp?: number;
}

const STORAGE_KEY = "attend_guest_intent";

export function setGuestIntent(intent: GuestIntentPayload): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ ...intent, timestamp: Date.now() })
    );
  } catch {
    // Graceful fallback if storage is restricted
  }
}

export function getGuestIntent(): GuestIntentPayload | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as GuestIntentPayload;
    if (parsed.timestamp && Date.now() - parsed.timestamp > 30 * 60 * 1000) {
      sessionStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function clearGuestIntent(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore cleanup errors
  }
}

export function buildLoginUrlWithIntent(
  eventId: string,
  action: GuestIntentAction,
  returnUrl?: string
): string {
  const baseTarget = returnUrl || `/events/${eventId}`;
  const separator = baseTarget.includes("?") ? "&" : "?";
  const targetWithIntent = `${baseTarget}${separator}intent=${action}`;
  return `/login?next=${encodeURIComponent(targetWithIntent)}`;
}

export function parseGuestIntentFromSearch(
  search: string | URLSearchParams
): GuestIntentAction | null {
  const params =
    typeof search === "string" ? new URLSearchParams(search) : search;
  const intent = params.get("intent");
  if (intent === "attend" || intent === "register") {
    return intent;
  }
  return null;
}
