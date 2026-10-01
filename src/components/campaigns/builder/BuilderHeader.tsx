import { useRouter } from "next/navigation";
import { ArrowLeft, Check, Loader2 } from "lucide-react";
import { useCampaignBuilderStore } from "@/stores/useCampaignBuilderStore";

type HeaderProps = {
  isEdit: boolean;
  backUrl: string;
  saveCampaign: () => void;
};

export function BuilderHeader({ isEdit, backUrl, saveCampaign }: HeaderProps) {
  const router = useRouter();
  const { event, saving } = useCampaignBuilderStore();

  return (
    <header className="sticky top-0 z-50 border-b border-neutral-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-[1600px] items-center justify-between px-4 sm:px-6">

          <button
            type="button"
            onClick={() =>
              router.push(
                backUrl
              )
            }
            className="flex items-center gap-2 rounded-xl px-2.5 py-2 text-sm font-medium text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-950"
          >
            <ArrowLeft className="h-4 w-4" />

            <span className="hidden sm:block">
              {isEdit
                ? "Back to campaign"
                : "Back to event"}
            </span>

            <span className="sm:hidden">
              Back
            </span>
          </button>

          <div className="hidden text-center md:block">
            <p className="text-[10px] font-bold tracking-[0.18em] text-violet-600">
              CAMPAIGN BUILDER
            </p>

            <p className="mt-0.5 max-w-[280px] truncate text-sm font-semibold">
              {event?.title}
            </p>
          </div>

          <button
            type="button"
            onClick={
              saveCampaign
            }
            disabled={saving}
            className="flex h-10 items-center gap-2 rounded-xl bg-violet-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Check className="h-4 w-4" />
            )}

            {saving
              ? "Saving..."
              : isEdit
              ? "Save changes"
              : "Save campaign"}
          </button>

        </div>
      </header>
  );
}
