import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { Users, Megaphone, Settings as SettingsIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import {
  getOrganizerEvent,
  getOrganizerEventStats,
  isUserEventOrganizer,
} from "@/services/organizer.service";
import {
  OrganizerHeader,
  OrganizerTabs,
  OrganizerOverviewTab,
  OrganizerTabPlaceholder,
  type OrganizerTabKey,
} from "@/components/dashboard";

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const event = await getOrganizerEvent(supabase, id);

  if (!event) {
    return { title: "Organizer Dashboard | Attend" };
  }

  return {
    title: `Dashboard: ${event.title} | Attend`,
    description: `Organizer dashboard and attendee metrics for ${event.title}.`,
  };
}

export default async function OrganizerEventDashboardPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const { tab = "overview" } = await searchParams;
  const activeTab: OrganizerTabKey = ["overview", "people", "campaigns", "settings"].includes(tab)
    ? (tab as OrganizerTabKey)
    : "overview";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=${encodeURIComponent(`/dashboard/events/${id}`)}`);
  }

  const isOrganizer = await isUserEventOrganizer(supabase, id, user.id);
  if (!isOrganizer) {
    redirect(`/events/${id}`);
  }

  const [event, stats] = await Promise.all([
    getOrganizerEvent(supabase, id),
    getOrganizerEventStats(supabase, id),
  ]);

  if (!event) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-neutral-50/50 pb-20">
      <OrganizerHeader event={event} />
      <OrganizerTabs eventId={event.id} activeTab={activeTab} />

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        {activeTab === "overview" && <OrganizerOverviewTab event={event} stats={stats} />}

        {activeTab === "people" && (
          <OrganizerTabPlaceholder
            title="People and Attendees Roster"
            description="View confirmed attendees, registrants, ticket holders, and custom registration question responses."
            icon={Users}
            badge="Week 5 Day 10"
            actionLabel="View Public Attendees"
            actionHref={`/events/${event.id}`}
          />
        )}

        {activeTab === "campaigns" && (
          <OrganizerTabPlaceholder
            title="Connected Campaign Templates"
            description="Manage attached campaign artwork, flyer templates, generation analytics, and publishing states."
            icon={Megaphone}
            badge="Week 5 Day 11"
            actionLabel="Create New Campaign"
            actionHref={`/events/${event.id}/campaigns/create`}
          />
        )}

        {activeTab === "settings" && (
          <OrganizerTabPlaceholder
            title="Event Settings and Safe Cancellation"
            description="Update event metadata, venue coordinates, campaign permissions, or safely cancel this event."
            icon={SettingsIcon}
            badge="Week 5 Day 11"
            actionLabel="Back to Event Overview"
            actionHref={`/dashboard/events/${event.id}?tab=overview`}
          />
        )}
      </div>
    </main>
  );
}
