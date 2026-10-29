import Link from "next/link";
import { Users, UserCheck, Megaphone, Sparkles, PlusCircle, ArrowRight, Settings as SettingsIcon } from "lucide-react";
import type { OrganizerEventDetails, OrganizerEventStats } from "@/services/organizer.service";

interface OrganizerOverviewTabProps {
  event: OrganizerEventDetails;
  stats: OrganizerEventStats;
}

export function OrganizerOverviewTab({ event, stats }: OrganizerOverviewTabProps) {
  const statCards = [
    {
      label: "Total Attendees",
      value: stats.attendeesCount.toLocaleString(),
      description: "Confirmed RSVPs and attendees",
      icon: Users,
      color: "text-violet-600 bg-violet-50 border-violet-100",
    },
    {
      label: "Total Registrations",
      value: stats.registrationsCount.toLocaleString(),
      description: "Form submissions recorded",
      icon: UserCheck,
      color: "text-blue-600 bg-blue-50 border-blue-100",
    },
    {
      label: "Connected Campaigns",
      value: stats.campaignsCount.toLocaleString(),
      description: "Active participant campaigns",
      icon: Megaphone,
      color: "text-amber-600 bg-amber-50 border-amber-100",
    },
    {
      label: "DP Generations",
      value: stats.dpGenerationsCount.toLocaleString(),
      description: "Flyers and avatars generated",
      icon: Sparkles,
      color: "text-emerald-600 bg-emerald-50 border-emerald-100",
    },
  ];

  return (
    <div className="space-y-6">
      {/* 1. STATS GRID */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="rounded-2xl border border-neutral-200 bg-white p-4 sm:p-5 shadow-sm transition hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-neutral-500">{card.label}</span>
                <div className={`rounded-xl border p-2 ${card.color}`}>
                  <Icon className="h-4 w-4" />
                </div>
              </div>
              <p className="mt-2 text-2xl sm:text-3xl font-serif font-bold text-neutral-950">
                {card.value}
              </p>
              <p className="mt-1 text-[11px] text-neutral-400">{card.description}</p>
            </div>
          );
        })}
      </div>

      {/* 2. QUICK ACTIONS & EVENT DETAILS */}
      <div className="grid gap-4 sm:gap-6 md:grid-cols-3">
        {/* ACTION SHORTCUTS */}
        <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm md:col-span-1">
          <h2 className="font-serif text-base font-bold text-neutral-900">Quick Actions</h2>
          <p className="mt-1 text-xs text-neutral-500">Manage campaign assets and event settings.</p>

          <div className="mt-4 flex flex-col gap-2">
            <Link
              href={`/events/${event.id}/campaigns/create`}
              className="inline-flex items-center justify-between rounded-xl bg-violet-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-violet-700"
            >
              <span className="flex items-center gap-2">
                <PlusCircle className="h-4 w-4" />
                Create New Campaign
              </span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>

            <Link
              href={`/dashboard/events/${event.id}?tab=people`}
              className="inline-flex items-center justify-between rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-xs font-semibold text-neutral-700 transition hover:bg-neutral-50"
            >
              <span className="flex items-center gap-2">
                <Users className="h-4 w-4 text-neutral-500" />
                Manage Attendees
              </span>
              <ArrowRight className="h-3.5 w-3.5 text-neutral-400" />
            </Link>

            <Link
              href={`/dashboard/events/${event.id}?tab=settings`}
              className="inline-flex items-center justify-between rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-xs font-semibold text-neutral-700 transition hover:bg-neutral-50"
            >
              <span className="flex items-center gap-2">
                <SettingsIcon className="h-4 w-4 text-neutral-500" />
                Event Settings
              </span>
              <ArrowRight className="h-3.5 w-3.5 text-neutral-400" />
            </Link>
          </div>
        </div>

        {/* EVENT PROFILE SUMMARY */}
        <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm md:col-span-2">
          <h2 className="font-serif text-base font-bold text-neutral-900">Event Overview</h2>
          <p className="mt-1 text-xs text-neutral-500">Configuration and participation settings.</p>

          <div className="mt-4 grid grid-cols-2 gap-4 text-xs">
            <div className="rounded-xl bg-neutral-50 p-3">
              <span className="text-neutral-400">Participation Model</span>
              <p className="mt-1 font-semibold text-neutral-800 capitalize">
                {event.participation_model || "Free RSVP"}
              </p>
            </div>
            <div className="rounded-xl bg-neutral-50 p-3">
              <span className="text-neutral-400">Participant Campaigns</span>
              <p className="mt-1 font-semibold text-neutral-800">
                {event.allow_participant_campaigns ? "Allowed" : "Organizer Only"}
              </p>
            </div>
            <div className="rounded-xl bg-neutral-50 p-3">
              <span className="text-neutral-400">Event Format</span>
              <p className="mt-1 font-semibold text-neutral-800">
                {event.is_online ? "Virtual Online" : "In-Person Venue"}
              </p>
            </div>
            <div className="rounded-xl bg-neutral-50 p-3">
              <span className="text-neutral-400">Category</span>
              <p className="mt-1 font-semibold text-neutral-800">
                {event.category?.name || "General"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
