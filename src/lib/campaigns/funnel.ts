export const CAMPAIGN_SHARE_SOURCE = "campaign_share";
export const CAMPAIGN_FUNNEL_SOURCE = "campaign_funnel";

export interface EventConversionOptions {
  campaignSlug?: string;
  source?: string;
  baseUrl?: string;
}

export function buildCampaignShareUrl(slug: string, baseUrl?: string): string {
  const cleanSlug = encodeURIComponent(slug.trim());
  const path = `/campaign/${cleanSlug}?src=${CAMPAIGN_SHARE_SOURCE}`;

  if (baseUrl) {
    return new URL(path, baseUrl).toString();
  }

  if (typeof window !== "undefined" && window.location?.origin) {
    return new URL(path, window.location.origin).toString();
  }

  return path;
}

export function buildEventConversionUrl(
  eventId: string,
  options: EventConversionOptions = {}
): string {
  const cleanId = encodeURIComponent(eventId.trim());
  const source = options.source || CAMPAIGN_FUNNEL_SOURCE;
  const params = new URLSearchParams({ src: source });

  if (options.campaignSlug) {
    params.set("from_campaign", options.campaignSlug.trim());
  }

  const query = params.toString();
  const path = `/events/${cleanId}${query ? `?${query}` : ""}`;

  if (options.baseUrl) {
    return new URL(path, options.baseUrl).toString();
  }

  return path;
}

export function isConversionFunnelVisitor(
  searchParams:
    | URLSearchParams
    | Record<string, string | string[] | undefined>
    | null
    | undefined
): boolean {
  if (!searchParams) return false;

  if (searchParams instanceof URLSearchParams) {
    const src = searchParams.get("src")?.trim().toLowerCase();
    return src === CAMPAIGN_FUNNEL_SOURCE;
  }

  const srcVal = searchParams.src;
  const src = Array.isArray(srcVal) ? srcVal[0] : srcVal;
  return typeof src === "string" && src.trim().toLowerCase() === CAMPAIGN_FUNNEL_SOURCE;
}

export function parseFunnelSource(
  searchParams:
    | URLSearchParams
    | Record<string, string | string[] | undefined>
    | null
    | undefined
): string | null {
  if (!searchParams) return null;

  if (searchParams instanceof URLSearchParams) {
    const src =
      searchParams.get("src") ||
      searchParams.get("source") ||
      searchParams.get("utm_source");
    return src?.trim().toLowerCase() || null;
  }

  const raw = searchParams.src ?? searchParams.source ?? searchParams.utm_source;
  const first = Array.isArray(raw) ? raw[0] : raw;
  return typeof first === "string" ? first.trim().toLowerCase() : null;
}
