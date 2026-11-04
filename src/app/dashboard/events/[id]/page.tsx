import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import {
  getOrganizerEvent,
  getOrganizerEventStats,
  getOrganizerEventCampaigns,
  isUserEventOrganizer,
} from "@/services/organizer.service";
import {
  getOrganizerPeopleStats,
  getOrganizerPeopleRoster,
} from "@/services/attendance.service";
import {
  OrganizerHeader,
  OrganizerTabs,
  OrganizerOverviewTab,
  OrganizerPeopleTab,
  OrganizerCampaignsTab,
  OrganizerSettingsTab,
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

  const [peopleStats, attendeeRoster, campaignRoster] =
    activeTab === "people"
      ? await Promise.all([
          getOrganizerPeopleStats(id),
          getOrganizerPeopleRoster(id, { limit: 100 }),
          getOrganizerPeopleRoster(id, { subTab: "campaign_participants", limit: 100 }),
        ])
      : [null, [], []];

  const peopleRoster = [...attendeeRoster, ...campaignRoster];

  const campaigns =
    activeTab === "campaigns"
      ? await getOrganizerEventCampaigns(supabase, id)
      : [];

  return (
    <main className="min-h-screen bg-neutral-50/50 pb-20">
      <OrganizerHeader event={event} />
      <OrganizerTabs eventId={event.id} activeTab={activeTab} />

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        {activeTab === "overview" && <OrganizerOverviewTab event={event} stats={stats} />}

        {activeTab === "people" && peopleStats && (
          <OrganizerPeopleTab
            eventId={event.id}
            eventTitle={event.title}
            stats={peopleStats}
            items={peopleRoster}
          />
        )}

        {activeTab === "campaigns" && (
          <OrganizerCampaignsTab
            eventId={event.id}
            eventTitle={event.title}
            campaigns={campaigns}
          />
        )}

        {activeTab === "settings" && <OrganizerSettingsTab event={event} />}
      </div>
    </main>
  );
}
