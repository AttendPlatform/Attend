"use client";

import { useState } from "react";
import { Sparkles, Image as ImageIcon, SlidersHorizontal, Megaphone } from "lucide-react";
import { FeaturedEventsManager } from "./FeaturedEventsManager";
import type {
  FeaturedEventSummary,
  FeaturedEventWithEvent,
} from "@/types/promotions";

export type AdminPromotionsTab =
  | "featured"
  | "banners"
  | "controls"
  | "broadcasts";

interface AdminPromotionsConsoleProps {
  initialFeaturedEvents: FeaturedEventWithEvent[];
  availableEvents: FeaturedEventSummary[];
}

const TABS: {
  id: AdminPromotionsTab;
  label: string;
  icon: typeof Sparkles;
}[] = [
  { id: "featured", label: "Featured Events", icon: Sparkles },
  { id: "banners", label: "Promotional Banners", icon: ImageIcon },
  { id: "controls", label: "Recovery & Social Controls", icon: SlidersHorizontal },
  { id: "broadcasts", label: "Broadcasts & Analytics", icon: Megaphone },
];

export function AdminPromotionsConsole({
  initialFeaturedEvents,
  availableEvents,
}: AdminPromotionsConsoleProps) {
  const [activeTab, setActiveTab] = useState<AdminPromotionsTab>("featured");

  return (
    <div className="space-y-6">
      <nav
        aria-label="Admin promotion sections"
        className="flex flex-wrap gap-2 border-b border-neutral-200 pb-3"
      >
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              aria-pressed={isActive}
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition ${
                isActive
                  ? "bg-violet-600 text-white shadow-sm"
                  : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {tab.label}
            </button>
          );
        })}
      </nav>

      {activeTab === "featured" && (
        <FeaturedEventsManager
          initialFeaturedEvents={initialFeaturedEvents}
          availableEvents={availableEvents}
        />
      )}

      {activeTab === "banners" && (
        <div className="rounded-2xl border border-dashed border-neutral-300 bg-white p-8 text-center text-sm text-neutral-500">
          Promotional Banners manager is scheduled in the next milestone step.
        </div>
      )}

      {activeTab === "controls" && (
        <div className="rounded-2xl border border-dashed border-neutral-300 bg-white p-8 text-center text-sm text-neutral-500">
          Recovery & Social trigger controls are scheduled in the next milestone step.
        </div>
      )}

      {activeTab === "broadcasts" && (
        <div className="rounded-2xl border border-dashed border-neutral-300 bg-white p-8 text-center text-sm text-neutral-500">
          Broadcasts & Analytics console is scheduled in the next milestone step.
        </div>
      )}
    </div>
  );
}
