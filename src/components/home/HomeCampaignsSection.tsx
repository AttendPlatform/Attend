import { Sparkles } from "lucide-react";
import type { Campaign } from "@/types/home";
import { CampaignCard } from "./CampaignCard";

type Props = {
  campaigns: Campaign[];
  error?: string;
};

export function HomeCampaignsSection({ campaigns, error }: Props) {
  if (error) {
    return (
      <div className="mt-8 rounded-2xl border border-red-100 bg-red-50 p-6 text-sm text-red-600">
        Published campaigns could not be loaded right now.
      </div>
    );
  }

  if (campaigns.length === 0) {
    return (
      <div className="mt-8 rounded-2xl border border-dashed border-neutral-300 bg-white p-10 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-violet-50">
          <Sparkles className="h-5 w-5 text-violet-600" />
        </div>
        <h3 className="mt-4 font-semibold">No campaigns in this category</h3>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-neutral-500">
          There are no published event campaigns for this category yet.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {campaigns.slice(0, 6).map((campaign) => (
        <CampaignCard key={campaign.id} campaign={campaign} />
      ))}
    </div>
  );
}
