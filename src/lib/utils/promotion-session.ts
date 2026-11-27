export const BANNER_DISMISSED_STORAGE_KEY = "attend_dismissed_banners_v1";
export const BANNER_IMPRESSION_COUNT_KEY = "attend_banner_session_views_v1";
export const BANNER_TRACKED_IMPRESSIONS_KEY = "attend_banner_tracked_impressions_v1";
export const FEATURED_TRACKED_VIEWS_KEY = "attend_featured_tracked_views_v1";
const SESSION_SYNC_EVENT = "attend:promotion-session-sync";

export function readPromotionSessionMap(key: string): Record<string, number> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.sessionStorage.getItem(key);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, number>;
    }
  } catch {
    return {};
  }
  return {};
}

export function writePromotionSessionMap(
  key: string,
  value: Record<string, number>
) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(key, JSON.stringify(value));
    window.dispatchEvent(new Event(SESSION_SYNC_EVENT));
  } catch {
    // Ignore storage quota errors in restricted browsing contexts.
  }
}

export function subscribePromotionSessionStorage(callback: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(SESSION_SYNC_EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(SESSION_SYNC_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}
