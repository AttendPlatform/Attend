import { createClient } from "@/lib/supabase/server";

type CampaignActivity = {
  campaignId: string;
  creatorId: string;
  eventId?: string | null;
  campaignName: string;
  views: number;
  generations: number;
  downloads: number;
  shares: number;
  participants: number;
};

const MILESTONES = [10, 25, 50, 100, 250, 500, 1000];

export async function processCampaignActivity(
  activity: CampaignActivity
) {
  const supabase = await createClient();

  const results = [];

  /*
   * ----------------------------------------------------------
   * 1. GENERATION MILESTONES
   * ----------------------------------------------------------
   */

  const reachedMilestone = MILESTONES.find(
    (milestone) =>
      activity.generations >= milestone
  );

  if (reachedMilestone) {
    const dedupeKey =
      `campaign-milestone:${activity.campaignId}:${reachedMilestone}`;

    const { data, error } =
      await supabase.rpc(
        "create_notification_for_user",
        {
          p_user_id: activity.creatorId,

          p_type: "campaign_milestone",

          p_category: "campaigns",

          p_title:
            "Your campaign reached a milestone",

          p_message:
            `${activity.campaignName} has reached ${reachedMilestone} personalized graphics.`,

          p_action_url:
            `/events/${activity.eventId}/campaigns/${activity.campaignId}`,

          p_action_label:
            "View campaign",

          p_event_id:
            activity.eventId ?? undefined,

          p_campaign_id:
            activity.campaignId,

          p_metadata: {
            milestone: reachedMilestone,
            generations:
              activity.generations,
          },

          p_dedupe_key:
            dedupeKey,

          p_priority:
            reachedMilestone >= 100
              ? "high"
              : "normal",
        }
      );

    if (!error && data) {
      results.push(data);
    }
  }


  /*
   * ----------------------------------------------------------
   * 2. FIRST 10 GENERATIONS
   * ----------------------------------------------------------
   */

  if (activity.generations === 10) {
    const { data, error } =
      await supabase.rpc(
        "create_notification_for_user",
        {
          p_user_id: activity.creatorId,

          p_type:
            "campaign_generation",

          p_category:
            "campaigns",

          p_title:
            "Your campaign is getting started",

          p_message:
            `${activity.campaignName} has generated its first 10 personalized graphics.`,

          p_action_url:
            `/events/${activity.eventId}/campaigns/${activity.campaignId}`,

          p_action_label:
            "View campaign",

          p_event_id:
            activity.eventId ?? undefined,

          p_campaign_id:
            activity.campaignId,

          p_metadata: {
            generations:
              activity.generations,
          },

          p_dedupe_key:
            `campaign-first-10:${activity.campaignId}`,

          p_priority:
            "normal",
        }
      );

    if (!error && data) {
      results.push(data);
    }
  }


  /*
   * ----------------------------------------------------------
   * 3. CAMPAIGN TRAFFIC SPIKE
   * ----------------------------------------------------------
   *
   * We use meaningful view thresholds for V1.
   */

  const trafficMilestones = [
    25,
    50,
    100,
    250,
    500,
    1000,
  ];

  const trafficMilestone =
    trafficMilestones.find(
      (milestone) =>
        activity.views >= milestone
    );

  if (trafficMilestone) {
    const { data, error } =
      await supabase.rpc(
        "create_notification_for_user",
        {
          p_user_id:
            activity.creatorId,

          p_type:
            "campaign_traffic_spike",

          p_category:
            "campaigns",

          p_title:
            "Your campaign is getting attention",

          p_message:
            `${activity.campaignName} has received ${trafficMilestone}+ views.`,

          p_action_url:
            `/events/${activity.eventId}/campaigns/${activity.campaignId}`,

          p_action_label:
            "View insights",

          p_event_id:
            activity.eventId ?? undefined,

          p_campaign_id:
            activity.campaignId,

          p_metadata: {
            views:
              activity.views,
          },

          p_dedupe_key:
            `campaign-views:${activity.campaignId}:${trafficMilestone}`,

          p_priority:
            trafficMilestone >= 500
              ? "high"
              : "normal",
        }
      );

    if (!error && data) {
      results.push(data);
    }
  }


  /*
   * ----------------------------------------------------------
   * 4. SHARE MILESTONES
   * ----------------------------------------------------------
   */

  const shareMilestones = [
    5,
    10,
    25,
    50,
    100,
  ];

  const shareMilestone =
    shareMilestones.find(
      (milestone) =>
        activity.shares >= milestone
    );

  if (shareMilestone) {
    const { data, error } =
      await supabase.rpc(
        "create_notification_for_user",
        {
          p_user_id:
            activity.creatorId,

          p_type:
            "campaign_share_milestone",

          p_category:
            "campaigns",

          p_title:
            "Your campaign is being shared",

          p_message:
            `${activity.campaignName} has been shared ${shareMilestone} times.`,

          p_action_url:
            `/events/${activity.eventId}/campaigns/${activity.campaignId}`,

          p_action_label:
            "View campaign",

          p_event_id:
            activity.eventId ?? undefined,

          p_campaign_id:
            activity.campaignId,

          p_metadata: {
            shares:
              activity.shares,
          },

          p_dedupe_key:
            `campaign-shares:${activity.campaignId}:${shareMilestone}`,

          p_priority:
            "normal",
        }
      );

    if (!error && data) {
      results.push(data);
    }
  }


  /*
   * ----------------------------------------------------------
   * 5. DOWNLOAD MILESTONES
   * ----------------------------------------------------------
   */

  const downloadMilestones = [
    10,
    25,
    50,
    100,
  ];

  const downloadMilestone =
    downloadMilestones.find(
      (milestone) =>
        activity.downloads >= milestone
    );

  if (downloadMilestone) {
    const { data, error } =
      await supabase.rpc(
        "create_notification_for_user",
        {
          p_user_id:
            activity.creatorId,

          p_type:
            "campaign_download_milestone",

          p_category:
            "campaigns",

          p_title:
            "People are saving your campaign",

          p_message:
            `${activity.campaignName} has been downloaded ${downloadMilestone} times.`,

          p_action_url:
            `/events/${activity.eventId}/campaigns/${activity.campaignId}`,

          p_action_label:
            "View insights",

          p_event_id:
            activity.eventId ?? undefined,

          p_campaign_id:
            activity.campaignId,

          p_metadata: {
            downloads:
              activity.downloads,
          },

          p_dedupe_key:
            `campaign-downloads:${activity.campaignId}:${downloadMilestone}`,

          p_priority:
            "normal",
        }
      );

    if (!error && data) {
      results.push(data);
    }
  }

  return results;
}