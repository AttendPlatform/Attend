"use client";

import { useState, useMemo } from "react";
import {
  Users,
  UserCheck,
  Ticket,
  Sparkles,
  Download,
  Search,
  ExternalLink,
  Info,
  Calendar,
} from "lucide-react";
import type {
  OrganizerPeopleRosterItem,
  OrganizerPeopleStats,
  PeopleSubTab,
} from "@/types/dashboard";
import { formatRosterCsv, downloadRosterCsv } from "@/lib/dashboard/csv-export";

interface OrganizerPeopleTabProps {
  eventId: string;
  eventTitle?: string;
  stats: OrganizerPeopleStats;
  items: OrganizerPeopleRosterItem[];
  onRefresh?: () => void;
}

export function OrganizerPeopleTab({
  eventId: _eventId,
  eventTitle = "Event",
  stats,
  items,
}: OrganizerPeopleTabProps) {
  const [activeSubTab, setActiveSubTab] = useState<PeopleSubTab>("attendees");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedResponseItem, setSelectedResponseItem] =
    useState<OrganizerPeopleRosterItem | null>(null);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      let matchesSubTab = false;
      if (activeSubTab === "attendees") {
        matchesSubTab = item.participationType === "attendee";
      } else if (activeSubTab === "registrants") {
        matchesSubTab = item.participationType === "registrant";
      } else if (activeSubTab === "ticket_holders") {
        matchesSubTab = item.participationType === "ticket_holder";
      } else if (activeSubTab === "campaign_participants") {
        matchesSubTab = item.participationType === "campaign_participant";
      }

      if (!matchesSubTab) return false;

      if (!searchQuery.trim()) return true;

      const q = searchQuery.toLowerCase().trim();
      const matchName = item.name?.toLowerCase().includes(q);
      const matchDisplayName = item.displayName?.toLowerCase().includes(q);
      const matchUsername = item.username?.toLowerCase().includes(q);
      const matchCampaign = item.campaignTitle?.toLowerCase().includes(q);

      return Boolean(matchName || matchDisplayName || matchUsername || matchCampaign);
    });
  }, [items, activeSubTab, searchQuery]);

  const handleExport = () => {
    const csvContent = formatRosterCsv(filteredItems);
    const dateStr = new Date().toISOString().split("T")[0];
    const safeTitle = eventTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const filename = `${safeTitle}-${activeSubTab}-roster-${dateStr}.csv`;
    downloadRosterCsv(filename, csvContent);
  };

  const getSubTabCount = (tab: PeopleSubTab): number => {
    switch (tab) {
      case "attendees":
        return stats.totalAttendees;
      case "registrants":
        return stats.totalRegistrants;
      case "ticket_holders":
        return stats.totalTicketHolders;
      case "campaign_participants":
        return stats.totalCampaignParticipants;
    }
  };

  return (
    <div className="space-y-6">
      {/* Distinction Header Banner */}
      <div className="rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
                <Users className="h-4 w-4" />
              </span>
              <h2 className="text-base font-semibold text-neutral-900">
                People and Participation Directory
              </h2>
            </div>
            <p className="mt-1 text-xs text-neutral-500">
              Strictly separates confirmed event attendance records from community campaign participation.
            </p>
          </div>

          <button
            type="button"
            onClick={handleExport}
            disabled={filteredItems.length === 0}
            className="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white px-3.5 text-xs font-semibold text-neutral-700 shadow-sm transition hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download className="h-3.5 w-3.5" />
            Export Roster ({filteredItems.length})
          </button>
        </div>

        {/* Metric Badges */}
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl border border-neutral-100 bg-neutral-50/70 p-3">
            <p className="text-[11px] font-medium text-neutral-500">RSVP Attendees</p>
            <p className="mt-1 text-lg font-semibold text-neutral-900">
              {stats.totalAttendees}
            </p>
          </div>
          <div className="rounded-xl border border-neutral-100 bg-neutral-50/70 p-3">
            <p className="text-[11px] font-medium text-neutral-500">Form Registrants</p>
            <p className="mt-1 text-lg font-semibold text-neutral-900">
              {stats.totalRegistrants}
            </p>
          </div>
          <div className="rounded-xl border border-neutral-100 bg-neutral-50/70 p-3">
            <p className="text-[11px] font-medium text-neutral-500">Ticket Holders</p>
            <p className="mt-1 text-lg font-semibold text-neutral-900">
              {stats.totalTicketHolders}
            </p>
          </div>
          <div className="rounded-xl border border-neutral-100 bg-neutral-50/70 p-3">
            <p className="text-[11px] font-medium text-neutral-500">Campaign DP Users</p>
            <p className="mt-1 text-lg font-semibold text-neutral-900">
              {stats.totalCampaignParticipants}
            </p>
          </div>
        </div>
      </div>

      {/* Sub-tab navigation and search */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1.5 rounded-2xl border border-neutral-200 bg-neutral-50 p-1">
          <button
            type="button"
            onClick={() => setActiveSubTab("attendees")}
            className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition ${
              activeSubTab === "attendees"
                ? "bg-white text-violet-700 shadow-sm"
                : "text-neutral-600 hover:text-neutral-900"
            }`}
          >
            <UserCheck className="h-3.5 w-3.5" />
            Attendees
            <span className="rounded-full bg-neutral-100 px-1.5 py-0.5 text-[10px] text-neutral-600">
              {getSubTabCount("attendees")}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab("registrants")}
            className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition ${
              activeSubTab === "registrants"
                ? "bg-white text-violet-700 shadow-sm"
                : "text-neutral-600 hover:text-neutral-900"
            }`}
          >
            <Users className="h-3.5 w-3.5" />
            Registrants
            <span className="rounded-full bg-neutral-100 px-1.5 py-0.5 text-[10px] text-neutral-600">
              {getSubTabCount("registrants")}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab("ticket_holders")}
            className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition ${
              activeSubTab === "ticket_holders"
                ? "bg-white text-violet-700 shadow-sm"
                : "text-neutral-600 hover:text-neutral-900"
            }`}
          >
            <Ticket className="h-3.5 w-3.5" />
            Ticket Holders
            <span className="rounded-full bg-neutral-100 px-1.5 py-0.5 text-[10px] text-neutral-600">
              {getSubTabCount("ticket_holders")}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab("campaign_participants")}
            className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition ${
              activeSubTab === "campaign_participants"
                ? "bg-white text-violet-700 shadow-sm"
                : "text-neutral-600 hover:text-neutral-900"
            }`}
          >
            <Sparkles className="h-3.5 w-3.5" />
            Campaign Participants
            <span className="rounded-full bg-neutral-100 px-1.5 py-0.5 text-[10px] text-neutral-600">
              {getSubTabCount("campaign_participants")}
            </span>
          </button>
        </div>

        <div className="relative min-w-[240px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            placeholder="Search by name or handle..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-10 w-full rounded-xl border border-neutral-200 bg-white pl-9 pr-3 text-xs text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:border-violet-500 focus:ring-2 focus:ring-violet-50"
          />
        </div>
      </div>

      {/* Roster Table */}
      <div className="overflow-hidden rounded-2xl border border-neutral-200/80 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-neutral-100 bg-neutral-50/70 text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
              <tr>
                <th scope="col" className="px-4 py-3 sm:px-6">
                  Participant
                </th>
                <th scope="col" className="px-4 py-3">
                  Category
                </th>
                <th scope="col" className="px-4 py-3">
                  Status
                </th>
                <th scope="col" className="px-4 py-3">
                  Date
                </th>
                <th scope="col" className="px-4 py-3 text-right sm:pr-6">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 text-neutral-700">
              {filteredItems.length > 0 ? (
                filteredItems.map((item) => (
                  <tr key={item.id} className="transition hover:bg-neutral-50/50">
                    <td className="whitespace-nowrap px-4 py-3.5 sm:px-6">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-violet-100 text-xs font-semibold text-violet-700">
                          {item.avatarUrl ? (
                            <img
                              src={item.avatarUrl}
                              alt={item.name || "Participant"}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            (item.name || item.displayName || "P").charAt(0).toUpperCase()
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-neutral-900">
                            {item.name || item.displayName || "Anonymous participant"}
                          </p>
                          {item.username && (
                            <p className="text-[11px] text-neutral-400">
                              @{item.username}
                            </p>
                          )}
                          {item.campaignTitle && (
                            <p className="text-[11px] font-medium text-violet-600">
                              Campaign: {item.campaignTitle}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="whitespace-nowrap px-4 py-3.5">
                      <span className="inline-flex rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-medium capitalize text-neutral-700">
                        {item.participationType.replace("_", " ")}
                      </span>
                    </td>

                    <td className="whitespace-nowrap px-4 py-3.5">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium capitalize ${
                          item.status === "attended" || item.status === "attending"
                            ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/50"
                            : item.status === "registered"
                              ? "bg-violet-50 text-violet-700 ring-1 ring-violet-200/50"
                              : "bg-neutral-100 text-neutral-600"
                        }`}
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-current" />
                        {item.status}
                      </span>
                    </td>

                    <td className="whitespace-nowrap px-4 py-3.5 text-neutral-500">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3 w-3 text-neutral-400" />
                        {item.createdAt
                          ? new Date(item.createdAt).toLocaleDateString(undefined, {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })
                          : "N/A"}
                      </div>
                    </td>

                    <td className="whitespace-nowrap px-4 py-3.5 text-right sm:pr-6">
                      {item.registrationData &&
                      Object.keys(item.registrationData).length > 0 ? (
                        <button
                          type="button"
                          onClick={() => setSelectedResponseItem(item)}
                          className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold text-violet-600 transition hover:bg-violet-50"
                        >
                          <Info className="h-3 w-3" />
                          View answers
                        </button>
                      ) : item.campaignSlug ? (
                        <a
                          href={`/campaign/${item.campaignSlug}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold text-violet-600 transition hover:bg-violet-50"
                        >
                          <ExternalLink className="h-3 w-3" />
                          View campaign
                        </a>
                      ) : (
                        <span className="text-[11px] text-neutral-400">Standard RSVP</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <Users className="mx-auto h-8 w-8 text-neutral-300" />
                    <p className="mt-2 text-sm font-semibold text-neutral-800">
                      No participants found
                    </p>
                    <p className="mt-1 text-xs text-neutral-400">
                      {searchQuery
                        ? "Try clearing your search query to see all records."
                        : `No records present in the ${activeSubTab.replace("_", " ")} category.`}
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Registration Details Modal */}
      {selectedResponseItem && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/40 p-4 backdrop-blur-sm"
        >
          <div className="w-full max-w-md rounded-3xl border border-neutral-200 bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold text-neutral-900">
                  Registration Responses
                </h3>
                <p className="mt-0.5 text-xs text-neutral-500">
                  {selectedResponseItem.name || "Participant answers"}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedResponseItem(null)}
                className="rounded-lg p-1 text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-700"
              >
                Close
              </button>
            </div>

            <div className="mt-5 space-y-3">
              {Object.entries(selectedResponseItem.registrationData).map(
                ([key, value]) => (
                  <div
                    key={key}
                    className="rounded-xl border border-neutral-100 bg-neutral-50 p-3"
                  >
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                      {key.replace(/_/g, " ")}
                    </p>
                    <p className="mt-1 text-xs font-medium text-neutral-800">
                      {typeof value === "object"
                        ? JSON.stringify(value)
                        : String(value)}
                    </p>
                  </div>
                )
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedResponseItem(null)}
                className="h-9 rounded-xl bg-violet-600 px-4 text-xs font-semibold text-white transition hover:bg-violet-700"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
