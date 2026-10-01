import type { ChangeEvent, RefObject } from "react";
import { ImagePlus, Upload, Move, Info } from "lucide-react";
import { useCampaignBuilderStore } from "@/stores/useCampaignBuilderStore";

type CanvasProps = {
  canvasElement: RefObject<HTMLCanvasElement>;
  handleDesignUpload: (e: ChangeEvent<HTMLInputElement>) => void;
};

export function BuilderCanvas({ canvasElement, handleDesignUpload }: CanvasProps) {
  const { designUrl, zoom, editorWidth, editorHeight, originalWidth, originalHeight } = useCampaignBuilderStore();

  return (
    <>
          {!designUrl ? (
            <div className="flex flex-1 items-center justify-center p-6">

              <div className="max-w-md text-center">

                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-white shadow-sm">
                  <ImagePlus className="h-8 w-8 text-violet-500" />
                </div>

                <h2 className="mt-6 text-xl font-semibold tracking-tight">
                  Start with your artwork
                </h2>

                <p className="mt-2 text-sm leading-6 text-neutral-500">
                  Upload the graphic you want attendees to personalize. The complete artwork will remain visible while you position their photo and name.
                </p>

                <label className="mt-6 inline-flex cursor-pointer items-center gap-2 rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-700">

                  <Upload className="h-4 w-4" />

                  Upload artwork

                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={
                      handleDesignUpload
                    }
                    className="hidden"
                  />

                </label>

              </div>

            </div>
          ) : (
            <div className="flex flex-1 items-center justify-center overflow-auto p-6 pt-20 sm:p-10 sm:pt-20">

              <div
                className="relative shrink-0 rounded-2xl bg-white p-3 shadow-2xl transition-transform duration-200"
                style={{
                  transform: `scale(${zoom})`,
                  transformOrigin:
                    "center center",
                }}
              >

                <div
                  className="relative overflow-hidden rounded-xl"
                  style={{
                    width:
                      editorWidth,
                    height:
                      editorHeight,
                  }}
                >
                  <canvas
                    ref={
                      canvasElement
                    }
                  />
                </div>

                <div className="flex items-center justify-between gap-5 px-1 pt-3">

                  <span className="text-[11px] font-medium text-neutral-400">
                    Original{" "}
                    {originalWidth}{" "}
                    ×{" "}
                    {originalHeight}{" "}
                    px
                  </span>

                  <span className="flex items-center gap-1.5 text-[11px] font-medium text-neutral-400">
                    <Move className="h-3 w-3" />
                    Drag · Resize
                  </span>

                </div>

              </div>

            </div>
          )}

          {/* BOTTOM TIP */}

          {designUrl && (
            <div className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2">

              <div className="flex items-center gap-2 rounded-full border border-neutral-200 bg-white/90 px-4 py-2 text-[11px] font-medium text-neutral-500 shadow-sm backdrop-blur">

                <Info className="h-3.5 w-3.5 text-violet-500" />

                Place fields where attendees should appear

              </div>

            </div>
          )}

    </>
  );
}
