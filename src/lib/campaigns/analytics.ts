import type { SupabaseClient } from "@supabase/supabase-js";

export type CampaignEventType =
  | "view"
  | "generate"
  | "download"
  | "share";

export type TrafficSource =
  | "discover"
  | "whatsapp"
  | "facebook"
  | "x"
  | "instagram"
  | "telegram"
  | "email"
  | "direct"
  | "campaign_share"
  | "other";

export const VALID_TRAFFIC_SOURCES: TrafficSource[] = [
  "discover",
  "whatsapp",
  "facebook",
  "x",
  "instagram",
  "telegram",
  "email",
  "direct",
  "campaign_share",
  "other",
];

const VISITOR_STORAGE_KEY = "attend_visitor_id";

export function getVisitorId(): string {
  try {
    const existing =
      window.localStorage.getItem(
        VISITOR_STORAGE_KEY
      );

    if (existing) {
      return existing;
    }

    const newId = crypto.randomUUID();

    window.localStorage.setItem(
      VISITOR_STORAGE_KEY,
      newId
    );

    return newId;
  } catch {
    return crypto.randomUUID();
  }
}

export function getCampaignTrafficSource(
  campaignId: string
): TrafficSource {
  const storageKey =
    `attend_campaign_source_${campaignId}`;

  try {
    const params =
      new URLSearchParams(
        window.location.search
      );

    const querySource =
      params
        .get("source")
        ?.trim()
        .toLowerCase() ||
      params
        .get("utm_source")
        ?.trim()
        .toLowerCase() ||
      params
        .get("src")
        ?.trim()
        .toLowerCase();

    if (
      querySource &&
      VALID_TRAFFIC_SOURCES.includes(
        querySource as TrafficSource
      )
    ) {
      const source =
        querySource as TrafficSource;

      window.sessionStorage.setItem(
        storageKey,
        source
      );

      return source;
    }

    const savedSource =
      window.sessionStorage.getItem(
        storageKey
      );

    if (
      savedSource &&
      VALID_TRAFFIC_SOURCES.includes(
        savedSource as TrafficSource
      )
    ) {
      return savedSource as TrafficSource;
    }
  } catch {
    // Ignore browser storage errors.
  }

  return "direct";
}

export async function trackCampaignEvent(
  supabase: SupabaseClient,
  campaignId: string,
  visitorId: string,
  eventType: CampaignEventType,
  trafficSource: TrafficSource,
  sharePlatform?: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  const { error } =
    await supabase.rpc(
      "track_campaign_event",
      {
        campaign_uuid: campaignId,
        visitor_uuid: visitorId,
        event_name: eventType,
        traffic_source: trafficSource,
        share_network:
          sharePlatform ?? null,
        event_metadata:
          metadata ?? {},
      }
    );

  if (error) {
    console.warn(
      `Campaign ${eventType} tracking failed:`,
      error
    );
  }
}