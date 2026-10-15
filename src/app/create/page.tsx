"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Calendar,
  ImagePlus,
  Layers,
  Loader2,
  MapPin,
  Sparkles,
  Type,
  X,
  FileEdit,
  Send
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "@/hooks/use-toast";
import { getErrorMessage } from "@/lib/utils/errorHandler";
import { LocationPicker } from "@/components/location/LocationPicker";
import {
  ParticipationModelSelector,
  ParticipationModelType
} from "@/components/events/ParticipationModelSelector";
import { StructuredLocation } from "@/lib/location";
import {
  createEvent,
  validateParticipationConfig,
  EventCategoryRow
} from "@/services/events.service";

export default function CreateEventPage() {
  const router = useRouter();
  const supabase = createClient();

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
    online_url: null
  });

  const [participationModel, setParticipationModel] =
    useState<ParticipationModelType>("free");
  const [participationConfig, setParticipationConfig] = useState<
    Record<string, any>
  >({});

  const [allowParticipantCampaigns, setAllowParticipantCampaigns] =
    useState<boolean>(true);
  const [eventStatus, setEventStatus] = useState<"published" | "draft">(
    "published"
  );

  const [cover, setCover] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function initPage() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const { data, error } = await supabase
        .from("event_categories")
        .select("*")
        .order("name");

      if (error) {
        console.error(error);
        setError("Could not load event categories.");
        setLoadingCategories(false);
        return;
      }

      setCategories(data ?? []);

      if (data && data.length > 0) {
        setCategoryId(data[0].id);
      }

      setLoadingCategories(false);
    }

    initPage();
  }, [supabase, router]);

  function handleCoverChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select an image file.");
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      setError("Cover image must be smaller than 8MB.");
      return;
    }

    setError("");
    setCover(file);

    const preview = URL.createObjectURL(file);
    setCoverPreview(preview);
  }

  function removeCover() {
    setCover(null);
    setCoverPreview("");
  }

  async function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault();

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

      if (!title.trim()) {
        const msg = "Please provide an event title.";
        setError(msg);
        toast.error(msg);
        setLoading(false);
        return;
      }

      if (!categoryId) {
        const msg = "Please select an event category.";
        setError(msg);
        toast.error(msg);
        setLoading(false);
        return;
      }

      if (!startAt) {
        const msg = "Please provide an event start date and time.";
        setError(msg);
        toast.error(msg);
        setLoading(false);
        return;
      }

      if (location.is_online && !location.online_url) {
        const msg = "Please provide a virtual meeting or stream link for this online event.";
        setError(msg);
        toast.error(msg);
        setLoading(false);
        return;
      }

      const validation = await validateParticipationConfig(
        participationModel,
        participationConfig
      );

      if (!validation.valid) {
        const msg = validation.errors[0] || "Invalid participation configuration.";
        setError(msg);
        toast.error(msg);
        setLoading(false);
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
        country: location.is_online ? null : location.country || "Nigeria",
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
        } else {
          const {
            data: { publicUrl },
          } = supabase.storage.from("event-covers").getPublicUrl(filePath);

          await supabase
            .from("events")
            .update({ cover_image: publicUrl })
            .eq("id", created.id);
        }
      }

      toast.success(
        eventStatus === "published"
          ? "Event published successfully!"
          : "Event draft saved successfully!"
      );
      router.push(`/events/${created.id}`);
    } catch (err: unknown) {
      const msg = getErrorMessage(err, "Failed to create event. Please try again.");
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-neutral-50 px-5 py-10 sm:px-6">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8">
          <p className="text-xs font-bold uppercase tracking-wider text-violet-600">
            EVENT BUILDER
          </p>

          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-neutral-900 sm:text-4xl">
            Create your event
          </h1>

          <p className="mt-2 text-sm text-neutral-500">
            Configure your event details, location coordinates, participation model, and community permissions.
          </p>
        </div>

        <form
          onSubmit={handleFormSubmit}
          className="space-y-8 rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-8"
        >
          {/* 1. COVER IMAGE */}
          <div>
            <label className="mb-2 block text-sm font-semibold text-neutral-900">
              Event Cover Image
            </label>

            {coverPreview ? (
              <div className="relative overflow-hidden rounded-2xl border border-neutral-200 shadow-sm">
                <img
                  src={coverPreview}
                  alt="Event cover preview"
                  className="aspect-[16/7] w-full object-cover"
                />

                <button
                  type="button"
                  onClick={removeCover}
                  aria-label="Remove cover image"
                  className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-black/75 text-white backdrop-blur transition hover:bg-black"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <label className="flex aspect-[16/7] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-neutral-200 bg-neutral-50/70 transition hover:border-violet-400 hover:bg-violet-50/30">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white shadow-sm">
                  <ImagePlus className="h-5 w-5 text-violet-600" />
                </div>

                <p className="mt-3 text-sm font-semibold text-neutral-800">
                  Upload event cover
                </p>

                <p className="mt-1 text-xs text-neutral-500">
                  PNG, JPG or WebP (Max 8MB)
                </p>

                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleCoverChange}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {/* 2. BASIC EVENT INFO */}
          <div className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-semibold text-neutral-900">
                Event Title
              </label>

              <div className="relative">
                <Type className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                <input
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Lagos Tech Meetup 2026"
                  className="h-12 w-full rounded-xl border border-neutral-200 bg-white pl-11 pr-4 text-sm text-neutral-900 outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-50"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-neutral-900">
                Description
              </label>

              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Give attendees context on what to expect, speakers, schedule, and activities..."
                rows={4}
                className="w-full resize-none rounded-xl border border-neutral-200 p-4 text-sm text-neutral-900 outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-50"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-neutral-900">
                Category
              </label>

              <select
                required
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                disabled={loadingCategories}
                className="h-12 w-full rounded-xl border border-neutral-200 bg-white px-4 text-sm text-neutral-900 outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-50 disabled:bg-neutral-50"
              >
                {loadingCategories ? (
                  <option>Loading categories...</option>
                ) : (
                  categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))
                )}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-neutral-900">
                Date & Schedule
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <div className="flex items-center gap-1.5 mb-1.5 text-xs font-medium text-neutral-600">
                    <Calendar className="h-3.5 w-3.5 text-violet-600" />
                    <span>Starts</span>
                  </div>

                  <input
                    type="datetime-local"
                    required
                    value={startAt}
                    onChange={(e) => setStartAt(e.target.value)}
                    className="h-12 w-full rounded-xl border border-neutral-200 bg-white px-4 text-sm text-neutral-900 outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-50"
                  />
                </div>

                <div>
                  <div className="flex items-center gap-1.5 mb-1.5 text-xs font-medium text-neutral-600">
                    <Calendar className="h-3.5 w-3.5 text-neutral-400" />
                    <span>Ends (Optional)</span>
                  </div>

                  <input
                    type="datetime-local"
                    value={endAt}
                    onChange={(e) => setEndAt(e.target.value)}
                    className="h-12 w-full rounded-xl border border-neutral-200 bg-white px-4 text-sm text-neutral-900 outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-50"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 3. STRUCTURED LOCATION PICKER */}
          <div className="pt-2">
            <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-5 text-white shadow-md">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
                  <MapPin className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">Event Location</h3>
                  <p className="text-xs text-neutral-400">
                    Auto-suggest venues, select Nigerian hubs, or set virtual online link
                  </p>
                </div>
              </div>

              <LocationPicker
                value={location}
                onChange={(newLoc) => setLocation(newLoc)}
              />
            </div>
          </div>

          {/* 4. PARTICIPATION MODEL SELECTOR */}
          <div className="pt-2">
            <ParticipationModelSelector
              model={participationModel}
              config={participationConfig}
              onChangeModel={setParticipationModel}
              onChangeConfig={setParticipationConfig}
            />
          </div>

          {/* 5. CAMPAIGN PERMISSIONS & PUBLISH STATUS */}
          <div className="space-y-4 pt-2">
            <label className="block text-sm font-semibold text-neutral-900">
              Community & Publishing Controls
            </label>

            <div className="rounded-2xl border border-neutral-200 bg-neutral-50/70 p-4 transition-all">
              <label className="flex cursor-pointer items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-neutral-900">
                      Allow participant campaigns
                    </p>
                    <p className="text-xs text-neutral-500 mt-0.5 leading-relaxed">
                      Enable attendees and creators to generate personalized promotional graphics and cards under this event.
                    </p>
                  </div>
                </div>

                <input
                  type="checkbox"
                  checked={allowParticipantCampaigns}
                  onChange={(e) => setAllowParticipantCampaigns(e.target.checked)}
                  className="mt-1 h-5 w-5 rounded border-neutral-300 text-violet-600 focus:ring-violet-500 accent-violet-600"
                />
              </label>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setEventStatus("published")}
                className={`flex items-start gap-3 rounded-2xl border p-4 text-left transition-all ${
                  eventStatus === "published"
                    ? "border-violet-600 bg-violet-50/50 ring-2 ring-violet-600/20 shadow-sm"
                    : "border-neutral-200 bg-white hover:border-neutral-300"
                }`}
              >
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                    eventStatus === "published"
                      ? "bg-violet-600 text-white"
                      : "bg-neutral-100 text-neutral-600"
                  }`}
                >
                  <Send className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-neutral-900">
                    Publish Immediately
                  </p>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    Live immediately in discovery feeds and public event pages.
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setEventStatus("draft")}
                className={`flex items-start gap-3 rounded-2xl border p-4 text-left transition-all ${
                  eventStatus === "draft"
                    ? "border-violet-600 bg-violet-50/50 ring-2 ring-violet-600/20 shadow-sm"
                    : "border-neutral-200 bg-white hover:border-neutral-300"
                }`}
              >
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                    eventStatus === "draft"
                      ? "bg-violet-600 text-white"
                      : "bg-neutral-100 text-neutral-600"
                  }`}
                >
                  <FileEdit className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-neutral-900">
                    Save as Draft
                  </p>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    Hidden from discovery. Edit and publish later from your organizer dashboard.
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* 6. ERROR DISPLAY */}
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-600">
              {error}
            </div>
          )}

          {/* 7. SUBMIT BUTTON */}
          <button
            type="submit"
            disabled={loading || loadingCategories}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-violet-600 text-sm font-semibold text-white shadow-md shadow-violet-600/20 transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Processing event creation...</span>
              </>
            ) : (
              <>
                <span>
                  {eventStatus === "published"
                    ? "Publish Event"
                    : "Save Event as Draft"}
                </span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </main>
  );
}