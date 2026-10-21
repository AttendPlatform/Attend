"use client";

import {
  ArrowLeft,
  BarChart3,
  Download,
  Eye,
  Globe2,
  Loader2,
  Share2,
  Sparkles,
  Users,
  WandSparkles,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Analytics = {
  total_views: number;
  total_generations: number;
  total_downloads: number;
  total_shares: number;
  unique_participants: number;
  discover_count: number;
  whatsapp_count: number;
  facebook_count: number;
  x_count: number;
  instagram_count: number;
  telegram_count: number;
  email_count: number;
  direct_count: number;
  other_count: number;
};

type Activity = {
  activity_id: string;
  event_type: string;
  source: string;
  share_platform: string | null;
  created_at: string;
};

type Campaign = {
  id: string;
  title: string;
  slug: string;
  status: string;
  event_id?: string | null;
};

const EMPTY_ANALYTICS: Analytics = {
  total_views: 0,
  total_generations: 0,
  total_downloads: 0,
  total_shares: 0,
  unique_participants: 0,
  discover_count: 0,
  whatsapp_count: 0,
  facebook_count: 0,
  x_count: 0,
  instagram_count: 0,
  telegram_count: 0,
  email_count: 0,
  direct_count: 0,
  other_count: 0,
};

const SOURCE_LABELS: Record<string, string> = {
  discover: "Attend Discover",
  whatsapp: "WhatsApp",
  facebook: "Facebook",
  x: "X",
  instagram: "Instagram",
  telegram: "Telegram",
  email: "Email",
  direct: "Direct",
  other: "Other",
};

const EVENT_LABELS: Record<string, string> = {
  view: "Viewed campaign",
  generate: "Created a DP",
  download: "Downloaded DP",
  share: "Shared campaign",
};

function formatNumber(value: number) {
  return new Intl.NumberFormat().format(value || 0);
}

function formatPercent(value: number) {
  if (!Number.isFinite(value)) return "0%";
  return `${Math.round(value)}%`;
}

function formatTime(dateString: string) {
  const date = new Date(dateString);

  return new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export default function CampaignAnalyticsPage() {
  const params = useParams<{
    eventId: string;
    campaignId: string;
  }>();

  const supabase = createClient();

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [analytics, setAnalytics] =
    useState<Analytics>(EMPTY_ANALYTICS);
  const [activity, setActivity] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadAnalytics() {
      if (!params.campaignId) return;

      setLoading(true);
      setError("");

      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          throw new Error("You must be signed in.");
        }

        const { data: campaignData, error: campaignError } =
          await supabase
            .from("campaigns")
            .select("id, title, slug, status, event_id")
            .eq("id", params.campaignId)
            .eq("creator_id", user.id)
            .maybeSingle();

        if (campaignError) {
          throw new Error(campaignError.message);
        }

        if (!campaignData) {
          throw new Error("Campaign not found.");
        }

        setCampaign(campaignData);

        const [
          { data: analyticsData, error: analyticsError },
          { data: activityData, error: activityError },
        ] = await Promise.all([
          supabase.rpc("get_campaign_analytics", {
            campaign_uuid: params.campaignId,
          }),

          supabase.rpc("get_campaign_recent_activity", {
            campaign_uuid: params.campaignId,
            activity_limit: 25,
          }),
        ]);

        if (analyticsError) {
          throw new Error(analyticsError.message);
        }

        if (activityError) {
          throw new Error(activityError.message);
        }

        setAnalytics(
          analyticsData?.[0] || EMPTY_ANALYTICS
        );

        setActivity(activityData || []);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Something went wrong."
        );
      } finally {
        setLoading(false);
      }
    }

    loadAnalytics();
  }, [params.campaignId]);

  const trafficSources = useMemo(() => {
    const items = [
      {
        key: "whatsapp",
        label: "WhatsApp",
        value: analytics.whatsapp_count,
      },
      {
        key: "discover",
        label: "Attend Discover",
        value: analytics.discover_count,
      },
      {
        key: "facebook",
        label: "Facebook",
        value: analytics.facebook_count,
      },
      {
        key: "x",
        label: "X",
        value: analytics.x_count,
      },
      {
        key: "instagram",
        label: "Instagram",
        value: analytics.instagram_count,
      },
      {
        key: "telegram",
        label: "Telegram",
        value: analytics.telegram_count,
      },
      {
        key: "email",
        label: "Email",
        value: analytics.email_count,
      },
      {
        key: "direct",
        label: "Direct",
        value: analytics.direct_count,
      },
      {
        key: "other",
        label: "Other",
        value: analytics.other_count,
      },
    ];

    return items
      .filter((item) => item.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [analytics]);

  const generationRate =
    analytics.total_views > 0
      ? (analytics.total_generations /
          analytics.total_views) *
        100
      : 0;

  const downloadRate =
    analytics.total_generations > 0
      ? (analytics.total_downloads /
          analytics.total_generations) *
        100
      : 0;

  const effectiveEventId = params.eventId && params.eventId !== "undefined" 
    ? params.eventId 
    : campaign?.event_id;

  const backUrl = effectiveEventId 
    ? `/events/${effectiveEventId}/campaigns/${params.campaignId}` 
    : `/campaigns/${params.campaignId}`;

  if (loading) {
    return (
      <main className="min-h-screen bg-white">
        <div className="mx-auto flex min-h-screen max-w-6xl items-center justify-center">
          <div className="flex items-center gap-3 text-sm text-gray-500">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading campaign analytics...
          </div>
        </div>
      </main>
    );
  }

  if (error || !campaign) {
    return (
      <main className="min-h-screen bg-white px-6 py-10">
        <div className="mx-auto max-w-3xl">
          <Link
            href={backUrl}
            className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-black"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to campaign
          </Link>

          <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
            <h1 className="font-semibold text-red-900">
              Unable to load analytics
            </h1>
            <p className="mt-2 text-sm text-red-700">
              {error || "Campaign not found."}
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#fafafa]">
      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:px-10">
        {/* Header */}
        <div className="mb-8">
          <Link
            href={backUrl}
            className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-gray-500 transition hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to campaign
          </Link>

          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div>
              <div className="mb-2 flex items-center gap-2 text-sm font-medium text-[#7c3aed]">
                <BarChart3 className="h-4 w-4" />
                Campaign Analytics
              </div>

              <h1 className="text-3xl font-bold tracking-tight text-gray-950 sm:text-4xl">
                {campaign.title}
              </h1>

              <p className="mt-2 text-sm text-gray-500">
                Understand how attendees discover and interact
                with your campaign.
              </p>
            </div>

            <Link
              href={`/campaign/${campaign.slug}`}
              target="_blank"
              className="inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-800 shadow-sm transition hover:border-gray-300 hover:bg-gray-50"
            >
              View campaign
            </Link>
          </div>
        </div>

        {/* Overview */}
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <StatCard
            icon={<Eye className="h-5 w-5" />}
            label="Views"
            value={analytics.total_views}
          />

          <StatCard
            icon={<Users className="h-5 w-5" />}
            label="Participants"
            value={analytics.unique_participants}
          />

          <StatCard
            icon={<WandSparkles className="h-5 w-5" />}
            label="Generations"
            value={analytics.total_generations}
          />

          <StatCard
            icon={<Download className="h-5 w-5" />}
            label="Downloads"
            value={analytics.total_downloads}
          />

          <StatCard
            icon={<Share2 className="h-5 w-5" />}
            label="Shares"
            value={analytics.total_shares}
          />
        </section>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          {/* Traffic sources */}
          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-6">
              <div className="flex items-center gap-2">
                <Globe2 className="h-5 w-5 text-[#7c3aed]" />
                <h2 className="text-lg font-semibold text-gray-950">
                  Traffic Sources
                </h2>
              </div>

              <p className="mt-1 text-sm text-gray-500">
                Where campaign visitors came from.
              </p>
            </div>

            {trafficSources.length === 0 ? (
              <div className="rounded-xl bg-gray-50 px-5 py-10 text-center">
                <Globe2 className="mx-auto h-8 w-8 text-gray-300" />
                <p className="mt-3 text-sm text-gray-500">
                  No traffic data yet.
                </p>
              </div>
            ) : (
              <div className="space-y-5">
                {trafficSources.map((source) => {
                  const percentage =
                    analytics.total_views > 0
                      ? (source.value /
                          analytics.total_views) *
                        100
                      : 0;

                  return (
                    <div key={source.key}>
                      <div className="mb-2 flex items-center justify-between text-sm">
                        <span className="font-medium text-gray-800">
                          {source.label}
                        </span>

                        <span className="text-gray-500">
                          {formatNumber(source.value)}{" "}
                          · {formatPercent(percentage)}
                        </span>
                      </div>

                      <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                        <div
                          className="h-full rounded-full bg-[#7c3aed] transition-all"
                          style={{
                            width: `${Math.min(
                              percentage,
                              100
                            )}%`,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Conversion */}
          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-6">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-[#7c3aed]" />
                <h2 className="text-lg font-semibold text-gray-950">
                  Conversion
                </h2>
              </div>

              <p className="mt-1 text-sm text-gray-500">
                How visitors move through the campaign.
              </p>
            </div>

            <div className="space-y-6">
              <FunnelRow
                label="Campaign views"
                value={analytics.total_views}
                percentage={100}
              />

              <FunnelRow
                label="Created a DP"
                value={analytics.total_generations}
                percentage={generationRate}
              />

              <FunnelRow
                label="Downloaded a DP"
                value={analytics.total_downloads}
                percentage={downloadRate}
              />
            </div>

            <div className="mt-8 grid grid-cols-2 gap-3">
              <MetricBox
                label="View → Generate"
                value={formatPercent(generationRate)}
              />

              <MetricBox
                label="Generate → Download"
                value={formatPercent(downloadRate)}
              />
            </div>
          </section>
        </div>

        {/* Recent activity */}
        <section className="mt-6 rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-950">
              Recent Activity
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Latest interactions with this campaign.
            </p>
          </div>

          {activity.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <BarChart3 className="mx-auto h-8 w-8 text-gray-300" />
              <p className="mt-3 text-sm text-gray-500">
                Activity will appear here as people interact
                with your campaign.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {activity.map((item) => (
                <div
                  key={item.activity_id}
                  className="flex flex-col gap-2 px-6 py-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-purple-50 text-[#7c3aed]">
                      {item.event_type === "view" && (
                        <Eye className="h-4 w-4" />
                      )}

                      {item.event_type === "generate" && (
                        <WandSparkles className="h-4 w-4" />
                      )}

                      {item.event_type === "download" && (
                        <Download className="h-4 w-4" />
                      )}

                      {item.event_type === "share" && (
                        <Share2 className="h-4 w-4" />
                      )}
                    </div>

                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {EVENT_LABELS[item.event_type] ||
                          item.event_type}
                      </p>

                      <p className="text-xs text-gray-500">
                        {SOURCE_LABELS[item.source] ||
                          item.source}

                        {item.share_platform
                          ? ` · ${item.share_platform}`
                          : ""}
                      </p>
                    </div>
                  </div>

                  <span className="text-xs text-gray-400">
                    {formatTime(item.created_at)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-[#7c3aed]">
        {icon}
      </div>

      <p className="text-sm text-gray-500">{label}</p>

      <p className="mt-1 text-2xl font-bold tracking-tight text-gray-950">
        {formatNumber(value)}
      </p>
    </div>
  );
}

function FunnelRow({
  label,
  value,
  percentage,
}: {
  label: string;
  value: number;
  percentage: number;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">
          {label}
        </span>

        <span className="text-sm font-semibold text-gray-950">
          {formatNumber(value)}
        </span>
      </div>

      <div className="h-3 overflow-hidden rounded-full bg-gray-100">
        <div
          className="h-full rounded-full bg-[#7c3aed]"
          style={{
            width: `${Math.min(percentage, 100)}%`,
          }}
        />
      </div>
    </div>
  );
}

function MetricBox({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl bg-gray-50 p-4">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="mt-1 text-xl font-bold text-gray-950">
        {value}
      </p>
    </div>
  );
}