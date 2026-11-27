"use client";

import { useState, useTransition } from "react";
import {
  Archive,
  BarChart3,
  Edit3,
  Image as ImageIcon,
  Monitor,
  Pause,
  Play,
  Smartphone,
} from "lucide-react";
import {
  createPromotionalBannerAction,
  updateBannerStatusAction,
  updatePromotionalBannerAction,
} from "@/app/actions/promotions";
import { toast } from "@/hooks/use-toast";
import { sanitizeNotificationImageUrl } from "@/lib/notifications/visual-rules";
import type {
  BannerPlacement,
  BannerStatus,
  PromotionalBannerRecord,
} from "@/types/promotions";

interface BannerManagementTabProps {
  initialBanners: PromotionalBannerRecord[];
}

function toLocalDateTimeInput(date: Date): string {
  const safeDate = Number.isNaN(date.getTime()) ? new Date() : date;
  const offsetMs = safeDate.getTimezoneOffset() * 60_000;
  return new Date(safeDate.getTime() - offsetMs).toISOString().slice(0, 16);
}

function formatCtr(impressions: number, clicks: number): string {
  if (impressions <= 0) return "0.0%";
  return `${((clicks / impressions) * 100).toFixed(1)}%`;
}

export function BannerManagementTab({
  initialBanners,
}: BannerManagementTabProps) {
  const [banners, setBanners] = useState<PromotionalBannerRecord[]>(initialBanners);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">("desktop");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [desktopImageUrl, setDesktopImageUrl] = useState("");
  const [mobileImageUrl, setMobileImageUrl] = useState("");
  const [ctaLabel, setCtaLabel] = useState("Explore now");
  const [destinationUrl, setDestinationUrl] = useState("/discover");
  const [placement, setPlacement] = useState<BannerPlacement>("both");
  const [priority, setPriority] = useState<number>(10);
  const [targetCitiesInput, setTargetCitiesInput] = useState("");
  const [authenticatedOnly, setAuthenticatedOnly] = useState(false);
  const [status, setStatus] = useState<BannerStatus>("published");
  const [startAt, setStartAt] = useState(() => toLocalDateTimeInput(new Date()));
  const [endAt, setEndAt] = useState(() =>
    toLocalDateTimeInput(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000))
  );
  const [isPending, startTransition] = useTransition();

  function resetForm() {
    setEditingId(null);
    setTitle("");
    setDescription("");
    setImageUrl("");
    setDesktopImageUrl("");
    setMobileImageUrl("");
    setCtaLabel("Explore now");
    setDestinationUrl("/discover");
    setPlacement("both");
    setPriority(10);
    setTargetCitiesInput("");
    setAuthenticatedOnly(false);
    setStatus("published");
    setStartAt(toLocalDateTimeInput(new Date()));
    setEndAt(toLocalDateTimeInput(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)));
  }

  function startEditing(banner: PromotionalBannerRecord) {
    setEditingId(banner.id);
    setTitle(banner.title);
    setDescription(banner.description ?? "");
    setImageUrl(banner.image_url);
    setDesktopImageUrl(banner.desktop_image_url ?? "");
    setMobileImageUrl(banner.mobile_image_url ?? "");
    setCtaLabel(banner.cta_label ?? "");
    setDestinationUrl(banner.destination_url);
    setPlacement(banner.placement);
    setPriority(banner.priority);
    setTargetCitiesInput(
      Array.isArray(banner.targeting_rules?.cities)
        ? banner.targeting_rules.cities.join(", ")
        : ""
    );
    setAuthenticatedOnly(Boolean(banner.targeting_rules?.authenticated_only));
    setStatus(banner.status);
    setStartAt(toLocalDateTimeInput(new Date(banner.start_at)));
    setEndAt(toLocalDateTimeInput(new Date(banner.end_at)));
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    const startMs = Date.parse(startAt);
    const endMs = Date.parse(endAt);
    if (Number.isNaN(startMs) || Number.isNaN(endMs) || endMs <= startMs) {
      toast.error("Please enter a valid schedule where end date is after start date.");
      return;
    }

    const cities = targetCitiesInput
      .split(",")
      .map((city) => city.trim())
      .filter(Boolean);

    const payload = {
      title,
      description: description.trim() || null,
      imageUrl,
      desktopImageUrl: desktopImageUrl.trim() || null,
      mobileImageUrl: mobileImageUrl.trim() || null,
      ctaLabel: ctaLabel.trim() || null,
      destinationUrl,
      placement,
      slotType: "hero",
      priority,
      targetingRules: {
        ...(cities.length > 0 ? { cities } : {}),
        ...(authenticatedOnly ? { authenticated_only: true } : {}),
      },
      startAt: new Date(startMs).toISOString(),
      endAt: new Date(endMs).toISOString(),
      status,
    };

    startTransition(async () => {
      if (editingId) {
        const res = await updatePromotionalBannerAction(editingId, payload);
        if (!res.ok || !res.banner) {
          toast.error(res.error ?? "Failed to update promotional banner.");
          return;
        }
        setBanners((prev) =>
          prev.map((row) => (row.id === editingId ? res.banner! : row))
        );
        resetForm();
        toast.success("Promotional banner updated.");
        return;
      }

      const res = await createPromotionalBannerAction(payload);
      if (!res.ok || !res.banner) {
        toast.error(res.error ?? "Failed to create promotional banner.");
        return;
      }
      setBanners((prev) => [res.banner!, ...prev]);
      resetForm();
      toast.success("Promotional banner created.");
    });
  }

  function handleStatusChange(bannerId: string, nextStatus: BannerStatus) {
    startTransition(async () => {
      const res = await updateBannerStatusAction(bannerId, nextStatus);
      if (!res.ok || !res.banner) {
        toast.error(res.error ?? "Failed to update banner status.");
        return;
      }
      setBanners((prev) =>
        prev.map((row) => (row.id === bannerId ? res.banner! : row))
      );
      toast.success(`Banner marked as ${nextStatus}.`);
    });
  }

  const previewCandidate =
    previewMode === "desktop"
      ? desktopImageUrl || imageUrl
      : mobileImageUrl || imageUrl;
  const previewSrc = sanitizeNotificationImageUrl(previewCandidate);

  return (
    <div className="grid gap-8 lg:grid-cols-[420px_1fr]">
      <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-violet-700">
            <ImageIcon className="h-4 w-4" />
            <h2 className="font-serif text-lg font-bold text-neutral-950">
              {editingId ? "Edit banner" : "Create promotional banner"}
            </h2>
          </div>
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="text-xs font-semibold text-neutral-500 hover:text-neutral-900"
            >
              Cancel edit
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-neutral-700">
              Title
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Discover Weekend Gatherings"
              className="mt-1.5 w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm text-neutral-900 focus:border-violet-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700">
              Description
            </label>
            <textarea
              rows={2}
              maxLength={300}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Explore curated concerts, conferences, and community meetups near you."
              className="mt-1.5 w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm text-neutral-900 focus:border-violet-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700">
              Fallback image URL
            </label>
            <input
              type="text"
              required
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://... or /images/banner.jpg"
              className="mt-1.5 w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm text-neutral-900 focus:border-violet-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-neutral-700">
                Desktop image URL
              </label>
              <input
                type="text"
                value={desktopImageUrl}
                onChange={(e) => setDesktopImageUrl(e.target.value)}
                placeholder="Optional md+ image"
                className="mt-1.5 w-full rounded-xl border border-neutral-200 px-3 py-2 text-xs text-neutral-900 focus:border-violet-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700">
                Mobile image URL
              </label>
              <input
                type="text"
                value={mobileImageUrl}
                onChange={(e) => setMobileImageUrl(e.target.value)}
                placeholder="Optional mobile image"
                className="mt-1.5 w-full rounded-xl border border-neutral-200 px-3 py-2 text-xs text-neutral-900 focus:border-violet-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-neutral-700">
                CTA label
              </label>
              <input
                type="text"
                value={ctaLabel}
                onChange={(e) => setCtaLabel(e.target.value)}
                placeholder="Explore now"
                className="mt-1.5 w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm text-neutral-900 focus:border-violet-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700">
                Destination URL
              </label>
              <input
                type="text"
                required
                value={destinationUrl}
                onChange={(e) => setDestinationUrl(e.target.value)}
                placeholder="/discover or https://..."
                className="mt-1.5 w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm text-neutral-900 focus:border-violet-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-neutral-700">
                Placement
              </label>
              <select
                value={placement}
                onChange={(e) => setPlacement(e.target.value as BannerPlacement)}
                className="mt-1.5 w-full rounded-xl border border-neutral-200 bg-white px-2.5 py-2 text-xs text-neutral-900 focus:border-violet-500 focus:outline-none"
              >
                <option value="both">Home & Discover</option>
                <option value="home">Home only</option>
                <option value="discover">Discover only</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700">
                Priority
              </label>
              <input
                type="number"
                min={1}
                max={1000}
                value={priority}
                onChange={(e) => setPriority(Number(e.target.value) || 1)}
                className="mt-1.5 w-full rounded-xl border border-neutral-200 px-2.5 py-2 text-xs text-neutral-900 focus:border-violet-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as BannerStatus)}
                className="mt-1.5 w-full rounded-xl border border-neutral-200 bg-white px-2.5 py-2 text-xs text-neutral-900 focus:border-violet-500 focus:outline-none"
              >
                <option value="published">Published</option>
                <option value="draft">Draft</option>
                <option value="paused">Paused</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-neutral-700">
                Start at
              </label>
              <input
                type="datetime-local"
                required
                value={startAt}
                onChange={(e) => setStartAt(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-neutral-200 px-3 py-2 text-xs text-neutral-900 focus:border-violet-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700">
                End at
              </label>
              <input
                type="datetime-local"
                required
                value={endAt}
                onChange={(e) => setEndAt(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-neutral-200 px-3 py-2 text-xs text-neutral-900 focus:border-violet-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700">
              Target cities (optional, comma-separated)
            </label>
            <input
              type="text"
              value={targetCitiesInput}
              onChange={(e) => setTargetCitiesInput(e.target.value)}
              placeholder="Lagos, Abuja"
              className="mt-1.5 w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm text-neutral-900 focus:border-violet-500 focus:outline-none"
            />
          </div>

          <label className="flex items-center gap-2 text-xs font-medium text-neutral-700">
            <input
              type="checkbox"
              checked={authenticatedOnly}
              onChange={(e) => setAuthenticatedOnly(e.target.checked)}
              className="h-4 w-4 rounded border-neutral-300 text-violet-600 focus:ring-violet-500"
            />
            Show only to signed-in users
          </label>

          <button
            type="submit"
            disabled={isPending}
            className="w-full rounded-full bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-700 disabled:opacity-50"
          >
            {isPending
              ? "Saving..."
              : editingId
              ? "Save banner changes"
              : "Publish banner"}
          </button>
        </form>
      </section>

      <div className="space-y-6">
        <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="font-serif text-base font-bold text-neutral-950">
                Responsive banner preview
              </h3>
              <p className="text-xs text-neutral-500">
                Switch between desktop and mobile asset views.
              </p>
            </div>
            <div className="inline-flex rounded-full border border-neutral-200 bg-neutral-50 p-1">
              <button
                type="button"
                onClick={() => setPreviewMode("desktop")}
                className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold transition ${
                  previewMode === "desktop"
                    ? "bg-white text-neutral-950 shadow-sm"
                    : "text-neutral-500"
                }`}
              >
                <Monitor className="h-3.5 w-3.5" />
                Desktop
              </button>
              <button
                type="button"
                onClick={() => setPreviewMode("mobile")}
                className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold transition ${
                  previewMode === "mobile"
                    ? "bg-white text-neutral-950 shadow-sm"
                    : "text-neutral-500"
                }`}
              >
                <Smartphone className="h-3.5 w-3.5" />
                Mobile
              </button>
            </div>
          </div>

          <div
            className={`mt-4 overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-950 ${
              previewMode === "mobile" ? "mx-auto max-w-sm" : "w-full"
            }`}
          >
            <div className="relative h-40">
              {previewSrc && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={previewSrc}
                  alt={title || "Banner preview"}
                  className="h-full w-full object-cover opacity-70"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-r from-neutral-950/90 via-neutral-950/60 to-transparent p-5 flex flex-col justify-center">
                <p className="font-serif text-lg font-bold text-white">
                  {title || "Banner headline preview"}
                </p>
                <p className="mt-1 line-clamp-2 text-xs text-neutral-200">
                  {description || "Your promotional description appears here."}
                </p>
                <span className="mt-3 inline-flex w-fit rounded-full bg-white px-3 py-1 text-[11px] font-semibold text-neutral-950">
                  {ctaLabel || "Learn more"}
                </span>
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-lg font-bold text-neutral-950">
            Configured banners ({banners.length})
          </h2>

          {banners.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-neutral-300 bg-white p-10 text-center text-sm text-neutral-500">
              No promotional banners created yet.
            </div>
          ) : (
            banners.map((banner) => (
              <article
                key={banner.id}
                className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold capitalize ${
                          banner.status === "published"
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-neutral-100 text-neutral-600"
                        }`}
                      >
                        {banner.status}
                      </span>
                      <span className="rounded-full bg-violet-50 px-2.5 py-0.5 text-[11px] font-semibold text-violet-700 capitalize">
                        {banner.placement}
                      </span>
                      <span className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-[11px] font-medium text-neutral-600">
                        Priority {banner.priority}
                      </span>
                    </div>

                    <h3 className="mt-2 font-serif text-base font-bold text-neutral-950">
                      {banner.title}
                    </h3>
                    {banner.description && (
                      <p className="mt-1 text-xs text-neutral-600">
                        {banner.description}
                      </p>
                    )}

                    <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-neutral-500">
                      <span>
                        {new Date(banner.start_at).toLocaleDateString()} to{" "}
                        {new Date(banner.end_at).toLocaleDateString()}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <BarChart3 className="h-3.5 w-3.5" />
                        {banner.impressions_count} impressions
                      </span>
                      <span>{banner.clicks_count} clicks</span>
                      <span>
                        CTR {formatCtr(banner.impressions_count, banner.clicks_count)}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => startEditing(banner)}
                      className="inline-flex items-center gap-1 rounded-full border border-neutral-200 px-3 py-1.5 text-xs font-semibold text-neutral-700 transition hover:bg-neutral-50"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                      Edit
                    </button>

                    {banner.status === "published" ? (
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => handleStatusChange(banner.id, "paused")}
                        className="inline-flex items-center gap-1 rounded-full border border-neutral-200 px-3 py-1.5 text-xs font-semibold text-neutral-700 transition hover:bg-neutral-50"
                      >
                        <Pause className="h-3.5 w-3.5" />
                        Pause
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => handleStatusChange(banner.id, "published")}
                        className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100"
                      >
                        <Play className="h-3.5 w-3.5" />
                        Publish
                      </button>
                    )}

                    {banner.status !== "archived" && (
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => handleStatusChange(banner.id, "archived")}
                        className="inline-flex items-center gap-1 rounded-full border border-neutral-200 px-3 py-1.5 text-xs font-semibold text-neutral-500 transition hover:bg-neutral-50"
                      >
                        <Archive className="h-3.5 w-3.5" />
                        Archive
                      </button>
                    )}
                  </div>
                </div>
              </article>
            ))
          )}
        </section>
      </div>
    </div>
  );
}
