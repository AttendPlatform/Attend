"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Globe,
  ImagePlus,
  Loader2,
  Type,
  X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Category = {
  id: string;
  name: string;
  slug: string;
};

export default function CreateEventPage() {
  const router = useRouter();
  const supabase = createClient();

  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");

  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");

  const [venueName, setVenueName] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [country, setCountry] = useState("Nigeria");

  const [isOnline, setIsOnline] = useState(false);
  const [onlineUrl, setOnlineUrl] = useState("");

  const [cover, setCover] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function initPage() {
      // Check authentication first on load
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      // Load categories if authenticated
      const { data, error } = await supabase
        .from("event_categories")
        .select("id, name, slug")
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

  async function createEvent(e: React.FormEvent) {
    e.preventDefault();

    setLoading(true);
    setError("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    if (!categoryId) {
      setError("Please select an event category.");
      setLoading(false);
      return;
    }

    const slug = `${title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")}-${Date.now()}`;

    const { data: event, error: eventError } = await supabase
      .from("events")
      .insert({
        creator_id: user.id,
        category_id: categoryId,
        title,
        slug,
        description,
        start_at: startAt,
        end_at: endAt || null,
        venue_name: isOnline ? null : venueName || null,
        address: isOnline ? null : address || null,
        city: isOnline ? null : city || null,
        state: isOnline ? null : state || null,
        country: isOnline ? null : country || null,
        is_online: isOnline,
        online_url: isOnline ? onlineUrl || null : null,
        status: "published",
      })
      .select("id, title")
      .single();

    if (eventError || !event) {
      console.error(eventError);
      setError(eventError?.message || "Could not create event.");
      setLoading(false);
      return;
    }

    if (cover) {
      const extension = cover.name.split(".").pop() || "jpg";
      const filePath = `${user.id}/${event.id}/cover.${extension}`;

      const { error: uploadError } = await supabase.storage
        .from("event-covers")
        .upload(filePath, cover, {
          cacheControl: "3600",
          upsert: true,
          contentType: cover.type,
        });

      if (uploadError) {
        console.error(uploadError);

        await supabase
          .from("events")
          .delete()
          .eq("id", event.id);

        setError(uploadError.message);
        setLoading(false);
        return;
      }

      const {
        data: { publicUrl },
      } = supabase.storage
        .from("event-covers")
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from("events")
        .update({
          cover_image: publicUrl,
        })
        .eq("id", event.id);

      if (updateError) {
        console.error(updateError);

        await supabase.storage
          .from("event-covers")
          .remove([filePath]);

        await supabase
          .from("events")
          .delete()
          .eq("id", event.id);

        setError(updateError.message);
        setLoading(false);
        return;
      }
    }

    await supabase.from("notifications").insert({
      user_id: user.id,
      title: "Event Created",
      message: `Your event "${event.title}" has been successfully created.`,
      type: "event",
    });

    router.push(`/events/${event.id}`);
  }

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-neutral-50 px-5 py-10 sm:px-6">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8">
          <p className="text-sm font-semibold text-violet-600">
            CREATE
          </p>

          <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
            Create your event
          </h1>

          <p className="mt-2 text-neutral-500">
            Add your event details and an optional cover image.
          </p>
        </div>

        <form
          onSubmit={createEvent}
          className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-8"
        >
          <div className="space-y-7">
            {/* COVER */}
            <div>
              <label className="mb-2 block text-sm font-medium">
                Event cover
              </label>

              {coverPreview ? (
                <div className="relative overflow-hidden rounded-2xl border border-neutral-200">
                  <img
                    src={coverPreview}
                    alt="Event cover preview"
                    className="aspect-[16/7] w-full object-cover"
                  />

                  <button
                    type="button"
                    onClick={removeCover}
                    className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-black/70 text-white backdrop-blur transition hover:bg-black"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <label className="flex aspect-[16/7] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-neutral-200 bg-neutral-50 transition hover:border-violet-300 hover:bg-violet-50/30">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white shadow-sm">
                    <ImagePlus className="h-5 w-5 text-violet-600" />
                  </div>

                  <p className="mt-3 text-sm font-semibold">
                    Upload event cover
                  </p>

                  <p className="mt-1 text-xs text-neutral-500">
                    PNG, JPG or WebP · Max 8MB
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

            {/* EVENT NAME */}
            <div>
              <label className="mb-2 block text-sm font-medium">
                Event name
              </label>

              <div className="relative">
                <Type className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />

                <input
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Attend Pilot Launch"
                  className="h-12 w-full rounded-xl border border-neutral-200 bg-white pl-11 pr-4 text-sm outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-50"
                />
              </div>
            </div>

            {/* DESCRIPTION */}
            <div>
              <label className="mb-2 block text-sm font-medium">
                Description
              </label>

              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Tell people what this event is about..."
                rows={5}
                className="w-full resize-none rounded-xl border border-neutral-200 p-4 text-sm outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-50"
              />
            </div>

            {/* CATEGORY */}
            <div>
              <label className="mb-2 block text-sm font-medium">
                Category
              </label>

              <select
                required
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                disabled={loadingCategories}
                className="h-12 w-full rounded-xl border border-neutral-200 bg-white px-4 text-sm outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-50 disabled:bg-neutral-50"
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

            {/* DATE */}
            <div>
              <label className="mb-2 block text-sm font-medium">
                Date & time
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="mb-2 text-xs text-neutral-500">
                    Starts
                  </p>

                  <input
                    type="datetime-local"
                    required
                    value={startAt}
                    onChange={(e) => setStartAt(e.target.value)}
                    className="h-12 w-full rounded-xl border border-neutral-200 px-4 text-sm outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-50"
                  />
                </div>

                <div>
                  <p className="mb-2 text-xs text-neutral-500">
                    Ends
                  </p>

                  <input
                    type="datetime-local"
                    value={endAt}
                    onChange={(e) => setEndAt(e.target.value)}
                    className="h-12 w-full rounded-xl border border-neutral-200 px-4 text-sm outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-50"
                  />
                </div>
              </div>
            </div>

            {/* ONLINE */}
            <div className="rounded-2xl border border-neutral-200 p-4">
              <label className="flex cursor-pointer items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50">
                    <Globe className="h-5 w-5 text-violet-600" />
                  </div>

                  <div>
                    <p className="text-sm font-semibold">
                      Online event
                    </p>

                    <p className="text-xs text-neutral-500">
                      This event takes place online
                    </p>
                  </div>
                </div>

                <input
                  type="checkbox"
                  checked={isOnline}
                  onChange={(e) => setIsOnline(e.target.checked)}
                  className="h-5 w-5 accent-violet-600"
                />
              </label>
            </div>

            {/* LOCATION */}
            {isOnline ? (
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Event link
                </label>

                <input
                  type="url"
                  value={onlineUrl}
                  onChange={(e) => setOnlineUrl(e.target.value)}
                  placeholder="https://zoom.us/..."
                  className="h-12 w-full rounded-xl border border-neutral-200 px-4 text-sm outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-50"
                />
              </div>
            ) : (
              <>
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Venue
                  </label>

                  <input
                    value={venueName}
                    onChange={(e) => setVenueName(e.target.value)}
                    placeholder="e.g. International Conference Centre"
                    className="h-12 w-full rounded-xl border border-neutral-200 px-4 text-sm outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-50"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Address
                  </label>

                  <input
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Street address"
                    className="h-12 w-full rounded-xl border border-neutral-200 px-4 text-sm outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-50"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <input
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="City"
                    className="h-12 rounded-xl border border-neutral-200 px-4 text-sm outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-50"
                  />

                  <input
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    placeholder="State"
                    className="h-12 rounded-xl border border-neutral-200 px-4 text-sm outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-50"
                  />

                  <input
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    placeholder="Country"
                    className="h-12 rounded-xl border border-neutral-200 px-4 text-sm outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-50"
                  />
                </div>
              </>
            )}

            {/* ERROR */}
            {error && (
              <div className="rounded-xl bg-red-50 p-4 text-sm text-red-600">
                {error}
              </div>
            )}

            {/* SUBMIT */}
            <button
              type="submit"
              disabled={loading || loadingCategories}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-violet-600 text-sm font-semibold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating event...
                </>
              ) : (
                <>
                  Create event
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}