
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  CheckCircle2,
  FileEdit,
  ImagePlus,
  Loader2,
  MapPin,
  Sparkles,
  Send,
  Type,
  X,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import { toast } from "@/hooks/use-toast";
import { getErrorMessage } from "@/lib/utils/errorHandler";
import { LocationPicker } from "@/components/location/LocationPicker";
import {
  ParticipationModelSelector,
  ParticipationModelType,
} from "@/components/events/ParticipationModelSelector";
import { StructuredLocation } from "@/lib/location";
import {
  createEvent,
  validateParticipationConfig,
  EventCategoryRow,
} from "@/services/events.service";

type CreateStep = 1 | 2 | 3;

const STEPS = [
  { number: 1, title: "Event details", description: "The essentials" },
  { number: 2, title: "Date & location", description: "When and where" },
  { number: 3, title: "Participation", description: "Set up your event" },
] as const;

const inputClass =
  "h-12 w-full rounded-xl border border-neutral-200 bg-white px-4 text-sm text-neutral-900 outline-none transition placeholder:text-neutral-400 hover:border-neutral-300 focus:border-violet-500 focus:ring-4 focus:ring-violet-50";

const labelClass =
  "mb-2 block text-sm font-semibold text-neutral-800";

export default function CreateEventPage() {
  const router = useRouter();
  const supabase = createClient();

  const [step, setStep] = useState<CreateStep>(1);

  const [categories, setCategories] = useState<EventCategoryRow[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");

  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");

  const [location, setLocation] = useState<StructuredLocation>({
    venue_name: null,
    address: null,
    city: null,
    state: null,
    country: "Nigeria",
    latitude: null,
    longitude: null,
    place_id: null,
    is_online: false,
    online_url: null,
  });

  const [participationModel, setParticipationModel] =
    useState<ParticipationModelType>("free");

  const [participationConfig, setParticipationConfig] = useState<
    Record<string, any>
  >({});

  const [allowParticipantCampaigns, setAllowParticipantCampaigns] =
    useState(true);

  const [eventStatus, setEventStatus] = useState<"published" | "draft">(
    "published"
  );

  const [cover, setCover] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const timezone =
    Intl.DateTimeFormat().resolvedOptions().timeZone || "Local time";

  useEffect(() => {
    let active = true;

    async function initPage() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!active) return;

        if (!user) {
          router.push("/login");
          return;
        }

        const { data, error: categoryError } = await supabase
          .from("event_categories")
          .select("*")
          .order("name");

        if (!active) return;

        if (categoryError) {
          console.error(categoryError);
          setError("Could not load event categories.");
          return;
        }

        setCategories(data ?? []);

        if (data?.length) {
          setCategoryId(data[0].id);
        }
      } catch (err) {
        console.error("Create event initialization failed:", err);
        setError("Something went wrong while preparing the event form.");
      } finally {
        if (active) setLoadingCategories(false);
      }
    }

    initPage();

    return () => {
      active = false;
    };
  }, [router, supabase]);

  useEffect(() => {
    return () => {
      if (coverPreview) URL.revokeObjectURL(coverPreview);
    };
  }, [coverPreview]);

  function showError(message: string) {
    setError(message);
    toast.error(message);
  }

  function handleCoverChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showError("Please select a valid image file.");
      e.target.value = "";
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      showError("Cover image must be smaller than 8MB.");
      e.target.value = "";
      return;
    }

    setError("");
    setCover(file);
    setCoverPreview(URL.createObjectURL(file));
  }

  function removeCover() {
    setCover(null);
    setCoverPreview("");
  }

  function validateCurrentStep(): boolean {
    setError("");

    if (step === 1) {
      if (!title.trim()) {
        showError("Please provide an event title.");
        return false;
      }

      if (!categoryId) {
        showError("Please select an event category.");
        return false;
      }

      return true;
    }

    if (step === 2) {
      if (!startAt) {
        showError("Please provide an event start date and time.");
        return false;
      }

      if (endAt && new Date(endAt) <= new Date(startAt)) {
        showError(
          "Event end date and time must be after the start date and time."
        );
        return false;
      }

      if (location.is_online && !location.online_url?.trim()) {
        showError(
          "Please provide a virtual meeting or stream link for this online event."
        );
        return false;
      }

      return true;
    }

    return true;
  }

  function handleContinue() {
    if (!validateCurrentStep()) return;

    setStep((current) => Math.min(current + 1, 3) as CreateStep);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleBack() {
    setError("");
    setStep((current) => Math.max(current - 1, 1) as CreateStep);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleCreateEvent() {
    // Event creation is only triggered by the explicit final action button.
    if (step !== 3 || loading) return;

    if (!validateCurrentStep()) return;

    setLoading(true);
    setError("");

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const validation = await validateParticipationConfig(
        participationModel,
        participationConfig
      );

      if (!validation.valid) {
        showError(
          validation.errors[0] || "Invalid participation configuration."
        );
        return;
      }

      const created = await createEvent({
        creator_id: user.id,
        category_id: categoryId,
        title: title.trim(),
        description: description.trim() || null,
        start_at: startAt,
        end_at: endAt || null,

        venue_name: location.is_online ? null : location.venue_name,
        address: location.is_online ? null : location.address,
        city: location.is_online ? null : location.city,
        state: location.is_online ? null : location.state,
        country: location.is_online
          ? null
          : location.country || "Nigeria",

        latitude: location.is_online ? null : location.latitude,
        longitude: location.is_online ? null : location.longitude,
        location_place_id: location.is_online ? null : location.place_id,

        is_online: location.is_online,
        online_url: location.is_online ? location.online_url : null,

        participation_model: participationModel,
        participation_config: participationConfig,
        allow_participant_campaigns: allowParticipantCampaigns,
        status: eventStatus,
        cover_image: null,
      });

      if (cover) {
        const extension = cover.name.split(".").pop() || "jpg";
        const filePath = `${user.id}/${created.id}/cover.${extension}`;

        const { error: uploadError } = await supabase.storage
          .from("event-covers")
          .upload(filePath, cover, {
            cacheControl: "3600",
            upsert: true,
            contentType: cover.type,
          });

        if (uploadError) {
          console.error("Cover upload warning:", uploadError);
          toast.error(
            "Your event was created, but the cover image could not be uploaded."
          );
        } else {
          const {
            data: { publicUrl },
          } = supabase.storage
            .from("event-covers")
            .getPublicUrl(filePath);

          const { error: coverUpdateError } = await supabase
            .from("events")
            .update({ cover_image: publicUrl })
            .eq("id", created.id);

          if (coverUpdateError) {
            console.error("Cover update warning:", coverUpdateError);
          }
        }
      }

      toast.success(
        eventStatus === "published"
          ? "Event published successfully!"
          : "Event draft saved successfully!"
      );

      router.push(`/events/${created.id}`);
    } catch (err: unknown) {
      const message = getErrorMessage(
        err,
        "Failed to create event. Please try again."
      );

      showError(message);
    } finally {
      setLoading(false);
    }
  }

  const selectedCategory = categories.find(
    (category) => category.id === categoryId
  );

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-[#faf9fc] px-4 py-8 sm:px-6 sm:py-12">
      <div className="mx-auto max-w-3xl">
        {/* Page heading */}
        <header className="mb-8 sm:mb-10">
          <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-violet-600">
            <span className="h-1.5 w-1.5 rounded-full bg-violet-600" />
            Attend event builder
          </div>

          <h1 className="text-3xl font-semibold tracking-tight text-neutral-950 sm:text-4xl">
            Bring your event to life.
          </h1>

          <p className="mt-2 max-w-xl text-sm leading-6 text-neutral-500">
            A few details are all it takes to create an event people can
            discover and attend.
          </p>
        </header>

        {/* Step progress */}
        <div className="mb-7 rounded-2xl border border-neutral-200/80 bg-white p-4 shadow-sm sm:p-5">
          <div className="mb-4 flex items-center justify-between gap-2">
            <p className="text-sm font-semibold text-neutral-900">
              Step {step} of 3
            </p>
            <p className="text-xs text-neutral-400">
              {STEPS[step - 1].title}
            </p>
          </div>

          <div className="mb-4 flex gap-1.5">
            {STEPS.map((item) => (
              <div
                key={item.number}
                className={`h-1.5 flex-1 rounded-full transition-colors ${
                  step >= item.number ? "bg-violet-600" : "bg-neutral-100"
                }`}
              />
            ))}
          </div>

          <div className="grid grid-cols-3 gap-2">
            {STEPS.map((item) => {
              const isComplete = step > item.number;
              const isCurrent = step === item.number;

              return (
                <div key={item.number} className="flex min-w-0 items-center gap-2">
                  <div
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                      isComplete
                        ? "bg-violet-600 text-white"
                        : isCurrent
                          ? "bg-violet-100 text-violet-700"
                          : "bg-neutral-100 text-neutral-400"
                    }`}
                  >
                    {isComplete ? <Check className="h-3.5 w-3.5" /> : item.number}
                  </div>

                  <div className="min-w-0">
                    <p
                      className={`truncate text-[11px] font-semibold sm:text-xs ${
                        isCurrent ? "text-neutral-900" : "text-neutral-500"
                      }`}
                    >
                      {item.title}
                    </p>
                    <p className="hidden text-[10px] text-neutral-400 sm:block">
                      {item.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="overflow-hidden rounded-3xl border border-neutral-200/80 bg-white shadow-sm">
          <div className="p-5 sm:p-8">
            {/* STEP 1: EVENT DETAILS */}
            {step === 1 && (
              <section className="space-y-7">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-violet-600">
                    01 — The essentials
                  </p>
                  <h2 className="mt-2 text-xl font-semibold tracking-tight text-neutral-950 sm:text-2xl">
                    Tell us about your event
                  </h2>
                  <p className="mt-1.5 text-sm text-neutral-500">
                    Start with the information people will see when they
                    discover your event.
                  </p>
                </div>

                {/* Cover artwork */}
                <div>
                  <div className="mb-3 flex items-end justify-between gap-3">
                    <div>
                      <label className="text-sm font-semibold text-neutral-900">
                        Event cover
                      </label>
                      <p className="mt-1 text-xs text-neutral-500">
                        Give your event a recognizable visual identity.
                      </p>
                    </div>
                    <span className="text-[11px] text-neutral-400">
                      Optional
                    </span>
                  </div>

                  {coverPreview ? (
                    <div className="relative overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-50 p-3">
                      <div className="flex min-h-56 items-center justify-center overflow-hidden rounded-xl bg-[linear-gradient(45deg,#f0eef4_25%,transparent_25%),linear-gradient(-45deg,#f0eef4_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#f0eef4_75%),linear-gradient(-45deg,transparent_75%,#f0eef4_75%)] bg-[length:20px_20px] bg-[position:0_0,0_10px,10px_-10px,-10px_0px]">
                        <img
                          src={coverPreview}
                          alt="Event cover preview"
                          className="max-h-[420px] max-w-full object-contain"
                        />
                      </div>

                      <div className="mt-3 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-xs font-medium text-neutral-800">
                            {cover?.name}
                          </p>
                          <p className="mt-0.5 text-[11px] text-neutral-400">
                            {cover
                              ? `${(cover.size / (1024 * 1024)).toFixed(2)} MB`
                              : ""}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={removeCover}
                          className="flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                        >
                          <X className="h-3.5 w-3.5" />
                          Remove
                        </button>
                      </div>
                    </div>
                  ) : (
                    <label className="group flex cursor-pointer flex-col items-center rounded-2xl border border-dashed border-neutral-300 bg-neutral-50/70 px-5 py-8 text-center transition hover:border-violet-400 hover:bg-violet-50/30">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-violet-600 shadow-sm ring-1 ring-neutral-100 transition group-hover:scale-105">
                        <ImagePlus className="h-5 w-5" />
                      </div>

                      <p className="mt-4 text-sm font-semibold text-neutral-800">
                        Add your event artwork
                      </p>
                      <p className="mt-1 text-xs text-neutral-500">
                        Choose an image from your device
                      </p>

                      <span className="mt-4 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs font-semibold text-neutral-700 shadow-sm">
                        Choose image
                      </span>

                      <p className="mt-3 text-[11px] text-neutral-400">
                        PNG, JPG or WebP · Maximum 8MB
                      </p>

                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        onChange={handleCoverChange}
                        className="hidden"
                      />
                    </label>
                  )}

                  <div className="mt-3 flex items-start gap-2 rounded-xl bg-violet-50/70 p-3">
                    <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-violet-600" />
                    <p className="text-xs leading-5 text-violet-800">
                      <strong>A little design tip:</strong> Square artwork
                      often works well as an event thumbnail. Landscape and
                      portrait images are welcome too. Your original image
                      proportions will be preserved.
                    </p>
                  </div>
                </div>

                {/* Title */}
                <div>
                  <label htmlFor="event-title" className={labelClass}>
                    Event title <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Type className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                    <input
                      id="event-title"
                      required
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g. Lagos Creative Summit 2026"
                      className={`${inputClass} pl-11`}
                    />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <label htmlFor="event-description" className={labelClass.replace("mb-2", "")}>
                      Description
                    </label>
                    <span className="text-[11px] text-neutral-400">
                      Optional
                    </span>
                  </div>

                  <textarea
                    id="event-description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="What is this event about? Share what attendees can expect, the activities, speakers, or anything they should know..."
                    rows={5}
                    className="w-full resize-y rounded-xl border border-neutral-200 bg-white p-4 text-sm leading-6 text-neutral-900 outline-none transition placeholder:text-neutral-400 hover:border-neutral-300 focus:border-violet-500 focus:ring-4 focus:ring-violet-50"
                  />
                </div>

                {/* Category */}
                <div>
                  <label htmlFor="event-category" className={labelClass}>
                    Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="event-category"
                    required
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    disabled={loadingCategories}
                    className={inputClass}
                  >
                    {loadingCategories ? (
                      <option value="">Loading categories...</option>
                    ) : categories.length === 0 ? (
                      <option value="">No categories available</option>
                    ) : (
                      categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))
                    )}
                  </select>
                </div>
              </section>
            )}

            {/* STEP 2: DATE AND LOCATION */}
            {step === 2 && (
              <section className="space-y-8">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-violet-600">
                    02 — The details
                  </p>
                  <h2 className="mt-2 text-xl font-semibold tracking-tight text-neutral-950 sm:text-2xl">
                    When and where?
                  </h2>
                  <p className="mt-1.5 text-sm text-neutral-500">
                    Set your event schedule, then tell people where to find
                    you.
                  </p>
                </div>

                {/* Schedule */}
                <div>
                  <div className="mb-3 flex items-center gap-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                      <CalendarDays className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-neutral-900">
                        Event schedule
                      </h3>
                      <p className="text-xs text-neutral-500">
                        Set the start and end time.
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label htmlFor="start-at" className={labelClass}>
                        Starts <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="start-at"
                        type="datetime-local"
                        required
                        value={startAt}
                        onChange={(e) => setStartAt(e.target.value)}
                        className={inputClass}
                      />
                    </div>

                    <div>
                      <label htmlFor="end-at" className={labelClass}>
                        Ends{" "}
                        <span className="font-normal text-neutral-400">
                          (Optional)
                        </span>
                      </label>
                      <input
                        id="end-at"
                        type="datetime-local"
                        value={endAt}
                        min={startAt || undefined}
                        onChange={(e) => setEndAt(e.target.value)}
                        className={inputClass}
                      />
                    </div>
                  </div>

                  <p className="mt-2 text-[11px] text-neutral-400">
                    Times are entered in your device's local timezone:{" "}
                    <span className="font-medium text-neutral-600">
                      {timezone}
                    </span>
                  </p>
                </div>

                <div className="border-t border-neutral-100" />

                {/* Location */}
                <div>
                  <div className="mb-4 flex items-center gap-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                      <MapPin className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-neutral-900">
                        Event location
                      </h3>
                      <p className="text-xs text-neutral-500">
                        Choose a venue or host your event online.
                      </p>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-neutral-200 bg-neutral-50/50 p-3 sm:p-4">
                    <LocationPicker
                      value={location}
                      onChange={(newLocation) => setLocation(newLocation)}
                    />
                  </div>
                </div>
              </section>
            )}

            {/* STEP 3: PARTICIPATION AND PUBLISH */}
            {step === 3 && (
              <section className="space-y-8">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-violet-600">
                    03 — Make it happen
                  </p>
                  <h2 className="mt-2 text-xl font-semibold tracking-tight text-neutral-950 sm:text-2xl">
                    How will people attend?
                  </h2>
                  <p className="mt-1.5 text-sm text-neutral-500">
                    Choose how people can participate. You can configure the
                    details below.
                  </p>
                </div>

                {/* Participation model */}
                <ParticipationModelSelector
                  model={participationModel}
                  config={participationConfig}
                  onChangeModel={setParticipationModel}
                  onChangeConfig={setParticipationConfig}
                />

                <div className="border-t border-neutral-100" />

                {/* Campaign permissions */}
                <div>
                  <h3 className="text-sm font-semibold text-neutral-900">
                    Community permissions
                  </h3>
                  <p className="mt-1 text-xs text-neutral-500">
                    Decide whether participants can create campaign graphics
                    for this event.
                  </p>

                  <label className="mt-4 flex cursor-pointer items-start justify-between gap-4 rounded-2xl border border-neutral-200 p-4 transition hover:border-violet-200 hover:bg-violet-50/30">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                        <Sparkles className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-neutral-900">
                          Allow participant campaigns
                        </p>
                        <p className="mt-1 text-xs leading-5 text-neutral-500">
                          Let attendees and creators generate personalized
                          promotional graphics and cards under this event.
                        </p>
                      </div>
                    </div>

                    <input
                      type="checkbox"
                      checked={allowParticipantCampaigns}
                      onChange={(e) =>
                        setAllowParticipantCampaigns(e.target.checked)
                      }
                      className="mt-1 h-5 w-5 shrink-0 rounded border-neutral-300 accent-violet-600 focus:ring-violet-500"
                    />
                  </label>
                </div>

                <div className="border-t border-neutral-100" />

                {/* Publishing status */}
                <div>
                  <h3 className="text-sm font-semibold text-neutral-900">
                    Ready to publish?
                  </h3>
                  <p className="mt-1 text-xs text-neutral-500">
                    Choose whether to publish now or save this event as a
                    draft.
                  </p>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => setEventStatus("published")}
                      className={`rounded-2xl border p-4 text-left transition ${
                        eventStatus === "published"
                          ? "border-violet-500 bg-violet-50/60 ring-2 ring-violet-500/10"
                          : "border-neutral-200 hover:border-neutral-300"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div
                          className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                            eventStatus === "published"
                              ? "bg-violet-600 text-white"
                              : "bg-neutral-100 text-neutral-600"
                          }`}
                        >
                          <Send className="h-4 w-4" />
                        </div>
                        {eventStatus === "published" && (
                          <CheckCircle2 className="h-5 w-5 text-violet-600" />
                        )}
                      </div>
                      <p className="mt-3 text-sm font-semibold text-neutral-900">
                        Publish immediately
                      </p>
                      <p className="mt-1 text-xs leading-5 text-neutral-500">
                        Make your event available on Attend.
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setEventStatus("draft")}
                      className={`rounded-2xl border p-4 text-left transition ${
                        eventStatus === "draft"
                          ? "border-violet-500 bg-violet-50/60 ring-2 ring-violet-500/10"
                          : "border-neutral-200 hover:border-neutral-300"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div
                          className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                            eventStatus === "draft"
                              ? "bg-violet-600 text-white"
                              : "bg-neutral-100 text-neutral-600"
                          }`}
                        >
                          <FileEdit className="h-4 w-4" />
                        </div>
                        {eventStatus === "draft" && (
                          <CheckCircle2 className="h-5 w-5 text-violet-600" />
                        )}
                      </div>
                      <p className="mt-3 text-sm font-semibold text-neutral-900">
                        Save as draft
                      </p>
                      <p className="mt-1 text-xs leading-5 text-neutral-500">
                        Keep it hidden while you make further changes.
                      </p>
                    </button>
                  </div>
                </div>

                {/* Review summary */}
                <div className="rounded-2xl border border-neutral-200 bg-neutral-50/70 p-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-violet-600" />
                    <h3 className="text-sm font-semibold text-neutral-900">
                      Event overview
                    </h3>
                  </div>

                  <div className="mt-3 space-y-2 text-xs">
                    <div className="flex justify-between gap-3">
                      <span className="text-neutral-500">Event</span>
                      <span className="max-w-[65%] text-right font-medium text-neutral-800">
                        {title.trim() || "Untitled event"}
                      </span>
                    </div>

                    <div className="flex justify-between gap-3">
                      <span className="text-neutral-500">Category</span>
                      <span className="font-medium text-neutral-800">
                        {selectedCategory?.name || "Not selected"}
                      </span>
                    </div>

                    <div className="flex justify-between gap-3">
                      <span className="text-neutral-500">Format</span>
                      <span className="font-medium text-neutral-800">
                        {location.is_online ? "Online" : "In person"}
                      </span>
                    </div>

                    <div className="flex justify-between gap-3">
                      <span className="text-neutral-500">Participation</span>
                      <span className="font-medium capitalize text-neutral-800">
                        {participationModel === "free"
                          ? "Free attendance"
                          : participationModel === "registration"
                            ? "Free registration"
                            : participationModel === "paid"
                              ? "Paid tickets"
                              : "External ticketing"}
                      </span>
                    </div>

                    <div className="flex justify-between gap-3">
                      <span className="text-neutral-500">Publishing</span>
                      <span className="font-medium capitalize text-neutral-800">
                        {eventStatus}
                      </span>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* Error */}
            {error && (
              <div
                role="alert"
                className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
              >
                {error}
              </div>
            )}
          </div>

          {/* Footer navigation */}
          <div className="flex items-center justify-between gap-3 border-t border-neutral-100 bg-neutral-50/70 px-5 py-4 sm:px-8">
            {step > 1 ? (
              <button
                type="button"
                onClick={handleBack}
                disabled={loading}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-50 disabled:opacity-50"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>
            ) : (
              <button
                type="button"
                onClick={() => router.back()}
                className="h-11 rounded-xl px-3 text-sm font-medium text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-800"
              >
                Cancel
              </button>
            )}

            {step < 3 ? (
              <button
                type="button"
                onClick={handleContinue}
                disabled={loadingCategories || (step === 1 && categories.length === 0)}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 text-sm font-semibold text-white shadow-sm shadow-violet-600/20 transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Continue
                <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleCreateEvent}
                disabled={loading || loadingCategories}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 text-sm font-semibold text-white shadow-sm shadow-violet-600/20 transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating event...
                  </>
                ) : (
                  <>
                    {eventStatus === "published"
                      ? "Publish event"
                      : "Save draft"}
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        <p className="mt-5 text-center text-[11px] text-neutral-400">
          You can review your event details before sharing it with your
          community.
        </p>
      </div>
    </main>
  );
}
