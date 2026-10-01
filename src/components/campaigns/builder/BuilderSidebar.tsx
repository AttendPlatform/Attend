import type { ChangeEvent } from "react";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Circle,
  ImagePlus,
  Info,
  Maximize2,
  Minus,
  Move,
  Plus,
  RefreshCw,
  Square,
  Trash2,
  Type,
  Upload,
} from "lucide-react";
import { useCampaignBuilderStore } from "@/stores/useCampaignBuilderStore";
import { FONT_OPTIONS } from "@/types/campaign-builder";
import type { PhotoShape } from "@/types/campaign-builder";

type Props = {
  isEdit: boolean;
  handleDesignUpload: (e: ChangeEvent<HTMLInputElement>) => void;
  removeDesign: () => void;
  addPhotoField: () => void;
  addNameField: () => void;
  deleteSelectedField: () => void;
  applyPhotoShape: (shape: PhotoShape) => void;
  centerSelectedField: () => void;
  updateNameField: (updates: any) => void;
};

export function BuilderSidebar({
  isEdit,
  handleDesignUpload,
  removeDesign,
  addPhotoField,
  addNameField,
  deleteSelectedField,
  applyPhotoShape,
  centerSelectedField,
  updateNameField,
}: Props) {
  const {
    title,
    setTitle,
    description,
    setDescription,
    designUrl,
    designFile,
    originalWidth,
    originalHeight,
    selectedField,
    photoShape,
    nameStyle,
    error,
  } = useCampaignBuilderStore();

  return (
    <aside className="border-b border-neutral-200 bg-white lg:border-b-0 lg:border-r">

          <div className="p-5 sm:p-6">

            <div>
              <div className="flex items-center gap-2">

                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                  <ImagePlus className="h-4 w-4" />
                </div>

                <div>
                  <h1 className="text-lg font-semibold tracking-tight">
                    {isEdit
                      ? "Edit your campaign"
                      : "Build your campaign"}
                  </h1>

                  <p className="text-xs text-neutral-400">
                    {isEdit
                      ? "Update your design and fields"
                      : "Everything happens here"}
                  </p>
                </div>

              </div>

              <p className="mt-4 text-sm leading-6 text-neutral-500">
                Upload your artwork and place attendee information directly on it.
              </p>
            </div>

            <div className="mt-7 space-y-5">

              {/* CAMPAIGN NAME */}

              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Campaign name
                </label>

                <input
                  value={title}
                  onChange={(e) =>
                    setTitle(
                      e.target.value
                    )
                  }
                  placeholder="Conference DP Campaign"
                  className="h-11 w-full rounded-xl border border-neutral-200 bg-white px-3 text-sm outline-none transition placeholder:text-neutral-400 focus:border-violet-500 focus:ring-4 focus:ring-violet-50"
                />
              </div>

              {/* DESCRIPTION */}

              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Description{" "}
                  <span className="ml-1 font-normal text-neutral-400">
                    Optional
                  </span>
                </label>

                <textarea
                  value={
                    description
                  }
                  onChange={(e) =>
                    setDescription(
                      e.target.value
                    )
                  }
                  rows={3}
                  placeholder="Tell attendees what this campaign is for."
                  className="w-full resize-none rounded-xl border border-neutral-200 bg-white p-3 text-sm outline-none transition placeholder:text-neutral-400 focus:border-violet-500 focus:ring-4 focus:ring-violet-50"
                />
              </div>

              {/* ARTWORK */}

              <div>
                <div className="mb-2 flex items-center justify-between">

                  <label className="text-sm font-semibold">
                    Artwork
                  </label>

                  {designUrl && (
                    <button
                      type="button"
                      onClick={
                        removeDesign
                      }
                      className="text-xs font-medium text-red-500 hover:text-red-600"
                    >
                      Remove
                    </button>
                  )}

                </div>

                {!designUrl ? (
                  <label className="group flex cursor-pointer flex-col items-center rounded-2xl border-2 border-dashed border-neutral-200 bg-neutral-50 p-7 text-center transition hover:border-violet-300 hover:bg-violet-50/40">

                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white shadow-sm">
                      <Upload className="h-5 w-5 text-violet-600" />
                    </div>

                    <p className="mt-3 text-sm font-semibold">
                      Upload artwork
                    </p>

                    <p className="mt-1 text-xs leading-5 text-neutral-500">
                      PNG, JPG or WebP
                      <br />
                      Maximum 15MB
                    </p>

                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={
                        handleDesignUpload
                      }
                      className="hidden"
                    />

                  </label>
                ) : (
                  <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-3">

                    <div className="flex items-center gap-3">

                      <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white">
                        <img
                          src={
                            designUrl
                          }
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      </div>

                      <div className="min-w-0 flex-1">

                        <p className="truncate text-sm font-semibold">
                          {designFile?.name ||
                            "Current artwork"}
                        </p>

                        <p className="mt-0.5 text-xs text-neutral-500">
                          {originalWidth}{" "}
                          ×{" "}
                          {originalHeight}{" "}
                          px
                        </p>

                      </div>

                      <label className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg bg-white text-neutral-500 shadow-sm transition hover:text-violet-600">

                        <RefreshCw className="h-4 w-4" />

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
                )}
              </div>

              {/* ATTENDEE FIELDS */}

              {designUrl && (
                <div>

                  <div className="mb-2 flex items-center justify-between">

                    <p className="text-sm font-semibold">
                      Attendee fields
                    </p>

                    <span className="text-xs text-neutral-400">
                      Add to artwork
                    </span>

                  </div>

                  <div className="grid grid-cols-2 gap-2">

                    <button
                      type="button"
                      onClick={
                        addPhotoField
                      }
                      className="group flex flex-col items-center gap-2 rounded-xl border border-neutral-200 bg-white p-4 text-xs font-semibold transition hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700"
                    >
                      <ImagePlus className="h-5 w-5 transition group-hover:scale-110" />
                      Photo
                    </button>

                    <button
                      type="button"
                      onClick={
                        addNameField
                      }
                      className="group flex flex-col items-center gap-2 rounded-xl border border-neutral-200 bg-white p-4 text-xs font-semibold transition hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700"
                    >
                      <Type className="h-5 w-5 transition group-hover:scale-110" />
                      Name
                    </button>

                  </div>

                </div>
              )}

              {/* PHOTO CONTROLS */}

              {selectedField ===
                "photo" && (
                <div className="rounded-2xl border border-violet-100 bg-violet-50 p-4">

                  <div className="flex items-start justify-between gap-3">

                    <div>
                      <p className="text-sm font-semibold text-violet-950">
                        Photo field
                      </p>

                      <p className="mt-1 text-xs leading-5 text-violet-700">
                        Drag and resize this field on the artwork.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={
                        deleteSelectedField
                      }
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-red-500 shadow-sm transition hover:bg-red-50"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>

                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2">

                    <button
                      type="button"
                      onClick={() =>
                        applyPhotoShape(
                          "rectangle"
                        )
                      }
                      className={`flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold shadow-sm transition ${
                        photoShape ===
                        "rectangle"
                          ? "bg-violet-600 text-white"
                          : "bg-white text-neutral-700 hover:bg-neutral-100"
                      }`}
                    >
                      <Square className="h-3.5 w-3.5" />
                      Rectangle
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        applyPhotoShape(
                          "circle"
                        )
                      }
                      className={`flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold shadow-sm transition ${
                        photoShape ===
                        "circle"
                          ? "bg-violet-600 text-white"
                          : "bg-white text-neutral-700 hover:bg-neutral-100"
                      }`}
                    >
                      <Circle className="h-3.5 w-3.5" />
                      Circle
                    </button>

                  </div>

                  <button
                    type="button"
                    onClick={
                      centerSelectedField
                    }
                    className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-white px-3 py-2 text-xs font-semibold text-neutral-700 shadow-sm transition hover:bg-neutral-100"
                  >
                    <Maximize2 className="h-3.5 w-3.5" />
                    Center field
                  </button>

                </div>
              )}

              {/* NAME CONTROLS */}

              {selectedField ===
                "name" && (
                <div className="rounded-2xl border border-violet-100 bg-violet-50 p-4">

                  <div className="flex items-start justify-between gap-3">

                    <div>
                      <p className="text-sm font-semibold text-violet-950">
                        Name field
                      </p>

                      <p className="mt-1 text-xs leading-5 text-violet-700">
                        Drag and resize this field on the artwork.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={
                        deleteSelectedField
                      }
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-red-500 shadow-sm transition hover:bg-red-50"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>

                  </div>

                  {/* FONT */}

                  <div className="mt-3">

                    <label className="mb-1.5 block text-xs font-semibold text-violet-950">
                      Font
                    </label>

                    <select
                      value={
                        nameStyle.fontFamily
                      }
                      onChange={(e) =>
                        updateNameField({
                          fontFamily:
                            e.target
                              .value,
                        })
                      }
                      className="h-9 w-full rounded-lg border border-violet-200 bg-white px-2.5 text-xs font-medium outline-none focus:border-violet-500"
                    >
                      {FONT_OPTIONS.map(
                        (font) => (
                          <option
                            key={
                              font
                            }
                            value={
                              font
                            }
                            style={{
                              fontFamily:
                                font,
                            }}
                          >
                            {font}
                          </option>
                        )
                      )}
                    </select>

                  </div>

                  {/* SIZE */}

                  <div className="mt-3">

                    <label className="mb-1.5 block text-xs font-semibold text-violet-950">
                      Size
                    </label>

                    <div className="flex items-center gap-2">

                      <button
                        type="button"
                        onClick={() =>
                          updateNameField({
                            fontSize:
                              Math.max(
                                10,
                                nameStyle.fontSize -
                                  2
                              ),
                          })
                        }
                        className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-neutral-600 shadow-sm transition hover:bg-neutral-100"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>

                      <div className="flex h-9 flex-1 items-center justify-center rounded-lg bg-white text-xs font-semibold text-neutral-700 shadow-sm">
                        {nameStyle.fontSize}
                        px
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          updateNameField({
                            fontSize:
                              Math.min(
                                200,
                                nameStyle.fontSize +
                                  2
                              ),
                          })
                        }
                        className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-neutral-600 shadow-sm transition hover:bg-neutral-100"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>

                    </div>

                  </div>

                  {/* COLOR + BOLD */}

                  <div className="mt-3 flex items-center gap-2">

                    <div className="flex-1">

                      <label className="mb-1.5 block text-xs font-semibold text-violet-950">
                        Color
                      </label>

                      <label className="flex h-9 cursor-pointer items-center gap-2 rounded-lg bg-white px-2.5 shadow-sm">

                        <input
                          type="color"
                          value={
                            nameStyle.color
                          }
                          onChange={(e) =>
                            updateNameField({
                              color:
                                e.target
                                  .value,
                            })
                          }
                          className="h-6 w-6 cursor-pointer rounded border-none bg-transparent p-0"
                        />

                        <span className="text-xs font-medium text-neutral-600">
                          {
                            nameStyle.color
                          }
                        </span>

                      </label>

                    </div>

                    <div>

                      <label className="mb-1.5 block text-xs font-semibold text-violet-950">
                        Style
                      </label>

                      <button
                        type="button"
                        onClick={() =>
                          updateNameField({
                            bold:
                              !nameStyle.bold,
                          })
                        }
                        className={`flex h-9 w-9 items-center justify-center rounded-lg shadow-sm transition ${
                          nameStyle.bold
                            ? "bg-violet-600 text-white"
                            : "bg-white text-neutral-600 hover:bg-neutral-100"
                        }`}
                        title="Bold"
                      >
                        <Bold className="h-3.5 w-3.5" />
                      </button>

                    </div>

                  </div>

                  {/* ALIGNMENT */}

                  <div className="mt-3">

                    <label className="mb-1.5 block text-xs font-semibold text-violet-950">
                      Alignment
                    </label>

                    <div className="grid grid-cols-3 gap-2">

                      {(
                        [
                          {
                            value:
                              "left",
                            icon:
                              AlignLeft,
                          },
                          {
                            value:
                              "center",
                            icon:
                              AlignCenter,
                          },
                          {
                            value:
                              "right",
                            icon:
                              AlignRight,
                          },
                        ] as const
                      ).map(
                        ({
                          value,
                          icon: Icon,
                        }) => (
                          <button
                            key={
                              value
                            }
                            type="button"
                            onClick={() =>
                              updateNameField({
                                textAlign:
                                  value,
                              })
                            }
                            className={`flex h-9 items-center justify-center rounded-lg shadow-sm transition ${
                              nameStyle.textAlign ===
                              value
                                ? "bg-violet-600 text-white"
                                : "bg-white text-neutral-600 hover:bg-neutral-100"
                            }`}
                          >
                            <Icon className="h-3.5 w-3.5" />
                          </button>
                        )
                      )}

                    </div>

                  </div>

                  <button
                    type="button"
                    onClick={
                      centerSelectedField
                    }
                    className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-white px-3 py-2 text-xs font-semibold text-neutral-700 shadow-sm transition hover:bg-neutral-100"
                  >
                    <Maximize2 className="h-3.5 w-3.5" />
                    Center field
                  </button>

                </div>
              )}

              {/* HELP */}

              {designUrl &&
                !selectedField && (
                  <div className="rounded-2xl bg-neutral-50 p-4">

                    <div className="flex gap-3">

                      <Move className="mt-0.5 h-4 w-4 shrink-0 text-violet-600" />

                      <div>

                        <p className="text-xs font-semibold text-neutral-800">
                          Position your fields
                        </p>

                        <p className="mt-1 text-xs leading-5 text-neutral-500">
                          Add a Photo or Name field, then drag and resize it on your artwork.
                        </p>

                      </div>

                    </div>

                  </div>
                )}

              {/* ERROR */}

              {error && (
                <div className="flex gap-3 rounded-xl border border-red-100 bg-red-50 p-4">

                  <Info className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />

                  <p className="text-xs leading-5 text-red-600">
                    {error}
                  </p>

                </div>
              )}

            </div>
          </div>
        </aside>
  );
}
