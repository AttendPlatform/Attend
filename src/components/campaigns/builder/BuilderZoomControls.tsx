import { ZoomIn, ZoomOut } from "lucide-react";
import { useCampaignBuilderStore } from "@/stores/useCampaignBuilderStore";

type ZoomProps = {
  changeZoom: (amount: number) => void;
};

export function BuilderZoomControls({ changeZoom }: ZoomProps) {
  const { designUrl, zoom, setZoom } = useCampaignBuilderStore();

  if (!designUrl) return null;

  return (
    <div className="absolute left-1/2 top-4 z-20 flex -translate-x-1/2 items-center gap-1 rounded-xl border border-neutral-200 bg-white p-1.5 shadow-lg">

      <button
        type="button"
        onClick={() => changeZoom(-0.1)}
        className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-900"
        title="Zoom out"
      >
        <ZoomOut className="h-4 w-4" />
      </button>

      <span className="min-w-[48px] text-center text-xs font-semibold text-neutral-600">
        {Math.round(zoom * 100)}%
      </span>

      <button
        type="button"
        onClick={() => changeZoom(0.1)}
        className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-900"
        title="Zoom in"
      >
        <ZoomIn className="h-4 w-4" />
      </button>

      <div className="mx-1 h-5 w-px bg-neutral-200" />

      <button
        type="button"
        onClick={() => setZoom(1)}
        className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-900"
      >
        Fit
      </button>

    </div>
  );
}
