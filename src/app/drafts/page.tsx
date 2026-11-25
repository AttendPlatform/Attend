import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import {
  ArrowLeft,
  CalendarDays,
  Clock3,
  FileText,
  Plus,
  Sparkles,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getUserEvents, getUserCampaigns } from "@/services";
import { listActiveAbandonedActions } from "@/services/abandoned-actions.service";
import { RecoveryBannerCard } from "@/components/notifications/RecoveryBannerCard";
import {
  EventManagementActions,
  CampaignManagementActions,
} from "@/components/dashboard";

export const metadata: Metadata = {
  title: "Drafts | Attend",
  description: "Continue editing, publish, or delete your saved event and campaign drafts.",
};

type DraftEvent = {
  id: string;
  title: string;
  start_at: string | null;
  status: string | null;
};

type DraftCampaign = {
  id: string;
  event_id: string;
  title: string;
  slug: string;
  status: string;
};

export default async function DraftsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=${encodeURIComponent("/drafts")}`);
  }

  const [eventsRaw, campaignsRaw, abandonedActions] = await Promise.all([
    getUserEvents(user.id, 100).catch(() => []),
    getUserCampaigns(user.id, 100).catch(() => []),
    listActiveAbandonedActions(supabase, user.id).catch(() => []),
  ]);

  const draftEvents = (eventsRaw as DraftEvent[]).filter(
    (e) => e.status === "draft"
  );
  const draftCampaigns = (campaignsRaw as DraftCampaign[]).filter(
    (c) => c.status === "draft"
  );
  const draftRecoveryActions = abandonedActions.filter(
    (a) => a.action_type === "event_draft" || a.action_type === "campaign_draft"
  );

  const hasAnyDrafts =
    draftEvents.length > 0 ||
    draftCampaigns.length > 0 ||
    draftRecoveryActions.length > 0;

  return (
    <main className="min-h-screen bg-neutral-50 pb-24">
      <section className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-5 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <Link
              href="/dashboard"
              className="mb-2 inline-flex items-center gap-1.5 text-xs font-medium text-neutral-500 hover:text-neutral-900"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to Dashboard
            </Link>
            <h1 className="font-serif text-3xl font-bold tracking-tight text-neutral-950">
              Drafts<span className="text-violet-600">.</span>
            </h1>
            <p className="mt-1 text-sm text-neutral-500">
              Unpublished event and campaign drafts ready to finish or publish.
            </p>
          </div>

          <Link
            href="/create"
            className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-700"
          >
            <Plus className="h-4 w-4" />
            <span>Create event</span>
          </Link>
        </div>
      </section>

      <div className="mx-auto max-w-6xl space-y-10 px-5 py-8 sm:px-6">
        {!hasAnyDrafts && (
          <div className="rounded-2xl border border-dashed border-neutral-300 bg-white px-6 py-16 text-center">
            <FileText className="mx-auto h-10 w-10 text-neutral-300" />
            <h2 className="mt-4 text-lg font-semibold text-neutral-900">
              No drafts saved
            </h2>
            <p className="mx-auto mt-1 max-w-md text-sm text-neutral-500">
              When you save an event or campaign as a draft, it will appear here so you can resume editing or publish later.
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <Link
                href="/create"
                className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-700"
              >
                <Plus className="h-4 w-4" />
                Create event
              </Link>
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-semibold text-neutral-700 hover:bg-neutral-50"
              >
                Go to Dashboard
              </Link>
            </div>
          </div>
        )}

        {draftRecoveryActions.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-neutral-900">
              In-Progress Drafts
            </h2>
            <div className="space-y-3">
              {draftRecoveryActions.map((action) => (
                <RecoveryBannerCard key={action.id} action={action} />
              ))}
            </div>
          </section>
        )}

        {draftEvents.length > 0 && (
          <section>
            <div className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-violet-600" />
              <h2 className="text-lg font-semibold text-neutral-900">
                Event Drafts ({draftEvents.length})
              </h2>
            </div>

            <div className="mt-4 divide-y divide-neutral-100 overflow-hidden rounded-2xl border border-neutral-200 bg-white">
              {draftEvents.map((event) => (
                <div
                  key={event.id}
                  className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/dashboard/events/${event.id}`}
                        className="truncate text-base font-semibold text-neutral-900 hover:text-violet-700"
                      >
                        {event.title}
                      </Link>
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-[10px] font-semibold text-amber-700">
                        <Clock3 className="h-3 w-3" />
                        Draft
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-neutral-500">
                      {event.start_at
                        ? `Scheduled for ${new Date(event.start_at).toLocaleDateString("en-NG", { dateStyle: "medium" })}`
                        : "Date not set yet"}
                    </p>
                  </div>

                  <EventManagementActions
                    eventId={event.id}
                    eventTitle={event.title}
                    status={event.status || "draft"}
                    compact
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        {draftCampaigns.length > 0 && (
          <section>
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-violet-600" />
              <h2 className="text-lg font-semibold text-neutral-900">
                Campaign Drafts ({draftCampaigns.length})
              </h2>
            </div>

            <div className="mt-4 divide-y divide-neutral-100 overflow-hidden rounded-2xl border border-neutral-200 bg-white">
              {draftCampaigns.map((campaign) => (
                <div
                  key={campaign.id}
                  className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/events/${campaign.event_id}/campaigns/${campaign.id}/edit`}
                        className="truncate text-base font-semibold text-neutral-900 hover:text-violet-700"
                      >
                        {campaign.title}
                      </Link>
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-[10px] font-semibold text-amber-700">
                        <Clock3 className="h-3 w-3" />
                        Draft
                      </span>
                    </div>
                  </div>

                  <CampaignManagementActions
                    eventId={campaign.event_id}
                    campaignId={campaign.id}
                    campaignTitle={campaign.title}
                    slug={campaign.slug}
                    status={campaign.status}
                  />
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
