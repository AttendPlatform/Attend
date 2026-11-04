"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  Megaphone,
  PlusCircle,
  Edit2,
  ExternalLink,
  BarChart2,
  Pause,
  Play,
  Search,
  Loader2,
} from "lucide-react";
import { toggleCampaignStatusAction } from "@/app/actions/organizer";

export interface OrganizerCampaignItem {
  id: string;
  title: string;
  slug: string;
  status: string;
  generations: number | null;
  created_at: string;
}

interface OrganizerCampaignsTabProps {
  eventId: string;
  eventTitle?: string;
  campaigns: OrganizerCampaignItem[];
}

export function OrganizerCampaignsTab({
  eventId,
  campaigns: initialCampaigns,
}: OrganizerCampaignsTabProps) {
  const [campaigns, setCampaigns] = useState<OrganizerCampaignItem[]>(initialCampaigns);
  const [searchQuery, setSearchQuery] = useState("");
  const [isPending, startTransition] = useTransition();
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const filteredCampaigns = campaigns.filter((c) =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase().trim())
  );

  const handleToggleStatus = (campaignId: string, currentStatus: string) => {
    const nextStatus = currentStatus === "published" ? "paused" : "published";
    setUpdatingId(campaignId);

    startTransition(async () => {
      const res = await toggleCampaignStatusAction(eventId, campaignId, nextStatus);
      if (res.success) {
        setCampaigns((prev) =>
          prev.map((c) => (c.id === campaignId ? { ...c, status: nextStatus } : c))
        );
      }
      setUpdatingId(null);
    });
  };

  const getStatusBadge = (status: string) => {
    const s = status.toLowerCase();
    if (s === "published") {
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    }
    if (s === "paused") {
      return "border-amber-200 bg-amber-50 text-amber-700";
    }
    return "border-neutral-200 bg-neutral-100 text-neutral-600";
  };

  return (
    <div className="space-y-6">
      {/* HEADER BAR */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-serif text-xl font-bold text-neutral-900 sm:text-2xl">
            Connected Campaigns
          </h2>
          <p className="mt-1 text-xs text-neutral-500 sm:text-sm">
            Manage promotional flyers, custom avatars, and participation analytics.
          </p>
        </div>

        <Link
          href={`/events/${eventId}/campaigns/create`}
          className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-violet-700"
        >
          <PlusCircle className="h-4 w-4" />
          <span>Create New Campaign</span>
        </Link>
      </div>

      {/* SEARCH FILTER */}
      {campaigns.length > 0 && (
        <div className="relative max-w-sm">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search campaigns by title..."
            className="w-full rounded-xl border border-neutral-200 bg-white py-2 pl-10 pr-4 text-xs placeholder:text-neutral-400 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
          />
        </div>
      )}

      {/* CAMPAIGNS LIST */}
      {filteredCampaigns.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredCampaigns.map((campaign) => {
            const isUpdating = updatingId === campaign.id && isPending;
            const isPublished = campaign.status.toLowerCase() === "published";

            return (
              <div
                key={campaign.id}
                className="flex flex-col justify-between rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm transition hover:shadow-md"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider capitalize ${getStatusBadge(
                        campaign.status
                      )}`}
                    >
                      {campaign.status}
                    </span>

                    <span className="text-[11px] text-neutral-400">
                      {new Date(campaign.created_at).toLocaleDateString("en-NG", {
                        dateStyle: "medium",
                      })}
                    </span>
                  </div>

                  <h3 className="mt-3 font-serif text-lg font-bold text-neutral-900 truncate">
                    {campaign.title}
                  </h3>

                  <p className="mt-1 flex items-center gap-1.5 text-xs text-neutral-500">
                    <span className="font-semibold text-neutral-800">
                      {(campaign.generations || 0).toLocaleString()}
                    </span>
                    <span>generations</span>
                  </p>
                </div>

                <div className="mt-5 border-t border-neutral-100 pt-4 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <Link
                      href={`/events/${eventId}/campaigns/${campaign.id}/edit`}
                      className="inline-flex items-center gap-1 rounded-lg border border-neutral-200 bg-white px-2.5 py-1.5 text-xs font-medium text-neutral-700 transition hover:bg-neutral-50 hover:text-neutral-900"
                      title="Edit campaign template"
                    >
                      <Edit2 className="h-3.5 w-3.5 text-neutral-500" />
                      <span>Edit</span>
                    </Link>

                    <Link
                      href={`/campaign/${campaign.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded-lg border border-neutral-200 bg-white px-2.5 py-1.5 text-xs font-medium text-neutral-700 transition hover:bg-neutral-50 hover:text-neutral-900"
                      title="Preview public campaign"
                    >
                      <ExternalLink className="h-3.5 w-3.5 text-neutral-500" />
                      <span>Preview</span>
                    </Link>

                    <Link
                      href={`/events/${eventId}/campaigns/${campaign.id}/analytics`}
                      className="inline-flex items-center gap-1 rounded-lg border border-neutral-200 bg-white px-2.5 py-1.5 text-xs font-medium text-neutral-700 transition hover:bg-neutral-50 hover:text-neutral-900"
                      title="View campaign analytics"
                    >
                      <BarChart2 className="h-3.5 w-3.5 text-neutral-500" />
                      <span>Analytics</span>
                    </Link>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleToggleStatus(campaign.id, campaign.status)}
                    disabled={isUpdating}
                    className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition ${
                      isPublished
                        ? "bg-amber-50 text-amber-700 hover:bg-amber-100"
                        : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                    }`}
                  >
                    {isUpdating ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : isPublished ? (
                      <>
                        <Pause className="h-3.5 w-3.5" />
                        <span>Pause</span>
                      </>
                    ) : (
                      <>
                        <Play className="h-3.5 w-3.5" />
                        <span>Publish</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : campaigns.length > 0 ? (
        <div className="rounded-2xl border border-dashed border-neutral-200 bg-white p-8 text-center">
          <p className="text-xs text-neutral-500">No campaigns matching &quot;{searchQuery}&quot;.</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-neutral-200 bg-white p-8 sm:p-12 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-50 text-violet-600">
            <Megaphone className="h-7 w-7" />
          </div>

          <h3 className="mt-4 font-serif text-lg font-bold text-neutral-900">
            No campaigns created yet
          </h3>
          <p className="mx-auto mt-1 max-w-sm text-xs text-neutral-500">
            Create promotional artwork and badge templates for attendees to personalize and share.
          </p>

          <div className="mt-6">
            <Link
              href={`/events/${eventId}/campaigns/create`}
              className="inline-flex items-center gap-2 rounded-full bg-violet-600 px-5 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-violet-700"
            >
              <PlusCircle className="h-4 w-4" />
              <span>Create First Campaign</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
