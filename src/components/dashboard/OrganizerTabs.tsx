"use client";

import Link from "next/link";
import { LayoutDashboard, Users, Megaphone, Settings } from "lucide-react";

export type OrganizerTabKey = "overview" | "people" | "campaigns" | "settings";

interface OrganizerTabsProps {
  eventId: string;
  activeTab: OrganizerTabKey;
}

const TABS: { key: OrganizerTabKey; label: string; icon: typeof LayoutDashboard }[] = [
  { key: "overview", label: "Overview", icon: LayoutDashboard },
  { key: "people", label: "People", icon: Users },
  { key: "campaigns", label: "Campaigns", icon: Megaphone },
  { key: "settings", label: "Settings", icon: Settings },
];

export function OrganizerTabs({ eventId, activeTab }: OrganizerTabsProps) {
  return (
    <nav className="border-b border-neutral-200 bg-white" aria-label="Organizer tabs">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex gap-2 sm:gap-6 overflow-x-auto no-scrollbar">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;

            return (
              <Link
                key={tab.key}
                href={`/dashboard/events/${eventId}?tab=${tab.key}`}
                className={`flex items-center gap-2 border-b-2 py-3 px-1 text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap ${
                  isActive
                    ? "border-violet-600 text-violet-700"
                    : "border-transparent text-neutral-500 hover:border-neutral-300 hover:text-neutral-800"
                }`}
                aria-current={isActive ? "page" : undefined}
              >
                <Icon className={`h-4 w-4 ${isActive ? "text-violet-600" : "text-neutral-400"}`} />
                <span>{tab.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
