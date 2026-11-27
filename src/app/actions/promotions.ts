"use server";

import { revalidatePath } from "next/cache";
import {
  dispatchFeaturedEventCampaign,
  featureEvent,
  getActiveFeaturedEvents,
  recordFeaturedEventMetric,
  removeFeaturedEvent,
  updateFeaturedEventStatus,
} from "@/services/promotions.service";
import type {
  FeatureEventInput,
  FeaturedCampaignDispatchResult,
  FeaturedEventMetric,
  FeaturedEventStatus,
  FeaturedEventWithEvent,
  PromotionViewerContext,
} from "@/types/promotions";

function revalidatePromotionSurfaces() {
  revalidatePath("/");
  revalidatePath("/discover");
  revalidatePath("/admin/promotions");
}

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

export async function featureEventAction(input: FeatureEventInput): Promise<{
  ok: boolean;
  featured?: FeaturedEventWithEvent;
  dispatch?: FeaturedCampaignDispatchResult;
  error?: string;
}> {
  try {
    const featured = await featureEvent(input);
    let dispatch: FeaturedCampaignDispatchResult | undefined;

    if (
      featured.status === "active" &&
      (featured.notification_mode === "selected_audience" ||
        featured.notification_mode === "broad_announcement")
    ) {
      dispatch = await dispatchFeaturedEventCampaign(featured.id);
    }

    revalidatePromotionSurfaces();
    return { ok: true, featured, dispatch };
  } catch (error) {
    return {
      ok: false,
      error: getErrorMessage(error, "Failed to feature event."),
    };
  }
}

export async function updateFeaturedEventStatusAction(
  featuredEventId: string,
  status: FeaturedEventStatus
): Promise<{
  ok: boolean;
  featured?: FeaturedEventWithEvent;
  error?: string;
}> {
  try {
    const featured = await updateFeaturedEventStatus(featuredEventId, status);
    revalidatePromotionSurfaces();
    return { ok: true, featured };
  } catch (error) {
    return {
      ok: false,
      error: getErrorMessage(error, "Failed to update featured event status."),
    };
  }
}

export async function removeFeaturedEventAction(
  featuredEventId: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    await removeFeaturedEvent(featuredEventId);
    revalidatePromotionSurfaces();
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: getErrorMessage(error, "Failed to remove featured event."),
    };
  }
}

export async function dispatchFeaturedEventCampaignAction(
  featuredEventId: string
): Promise<{
  ok: boolean;
  result?: FeaturedCampaignDispatchResult;
  error?: string;
}> {
  try {
    const result = await dispatchFeaturedEventCampaign(featuredEventId);
    revalidatePath("/admin/promotions");
    return { ok: true, result };
  } catch (error) {
    return {
      ok: false,
      error: getErrorMessage(error, "Failed to dispatch featured campaign."),
    };
  }
}

export async function getActiveFeaturedEventsAction(
  placement: "home" | "discover",
  viewerContext?: PromotionViewerContext
): Promise<{ ok: boolean; items: FeaturedEventWithEvent[]; error?: string }> {
  try {
    const items = await getActiveFeaturedEvents(placement, viewerContext);
    return { ok: true, items };
  } catch (error) {
    return {
      ok: false,
      items: [],
      error: getErrorMessage(error, "Failed to load featured events."),
    };
  }
}

export async function recordFeaturedEventMetricAction(
  featuredEventId: string,
  metric: FeaturedEventMetric
): Promise<{ ok: boolean }> {
  const updated = await recordFeaturedEventMetric(featuredEventId, metric);
  return { ok: updated };
}
