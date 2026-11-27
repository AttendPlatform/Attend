
"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  toggleSaveEvent,
  toggleSaveCampaign,
} from "@/services/saved.service";
import { recordFeaturedMetricForEventIfActive } from "@/services/promotions.service";

export type SaveTargetType = "event" | "campaign";

export async function toggleSavedAction(
  targetType: SaveTargetType,
  targetId: string,
  pathname?: string
): Promise<{ saved?: boolean; requiresLogin?: boolean; error?: string }> {
  if (!targetId?.trim()) {
    return { error: "Invalid item." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    return { requiresLogin: true };
  }

  try {
    const result =
      targetType === "event"
        ? await toggleSaveEvent(targetId, data.user.id)
        : await toggleSaveCampaign(targetId, data.user.id);

    if (targetType === "event" && result.saved) {
      await recordFeaturedMetricForEventIfActive(targetId, "save").catch(() => {});
    }

    if (pathname) {
      revalidatePath(pathname);
    }
    revalidatePath("/saved");
    revalidatePath("/profile");

    return { saved: result.saved };
  } catch {
    return { error: "Couldn't update your saved items. Please try again." };
  }
}
