"use client";

import {
  ChangeEvent,
  PointerEvent as ReactPointerEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useParams } from "next/navigation";

import { createClient } from "@/lib/supabase/client";

import {
  getCampaignTrafficSource,
  getVisitorId,
  trackCampaignEvent as sendCampaignEvent,
} from "@/lib/campaigns/analytics";

import {
  clampAdjustment,
  DEFAULT_ADJUSTMENT,
  PhotoAdjustment,
} from "@/lib/campaigns/image";

import type {
  Campaign,
  NamePosition,
  PhotoPosition,
  Template,
} from "@/lib/campaigns/types";

import { generateCampaignImage } from "@/lib/campaigns/generate";

import CampaignHeader from "@/components/campaigns/CampaignHeader";
import CampaignIntro from "@/components/campaigns/CampaignIntro";
import CampaignPreview from "@/components/campaigns/CampaignPreview";
import CampaignPhotoUpload from "@/components/campaigns/CampaignPhotoUpload";
import CampaignPhotoControls from "@/components/campaigns/CampaignPhotoControls";
import CampaignNameInput from "@/components/campaigns/CampaignNameInput";
import CampaignGeneratedImage from "@/components/campaigns/CampaignGeneratedImage";
import CampaignResultActions from "@/components/campaigns/CampaignResultActions";
import CampaignLoadingState from "@/components/campaigns/CampaignLoadingState";
import CampaignErrorState from "@/components/campaigns/CampaignErrorState";
import type { CampaignParentEventSummary } from "@/types/campaigns";

export default function PublicCampaignPage() {
  const params = useParams();

  const slug = params.slug as string;

  const supabase = createClient();

  const [campaign, setCampaign] =
    useState<Campaign | null>(null);

  const [parentEvent, setParentEvent] =
    useState<CampaignParentEventSummary | null>(null);

  const [creator, setCreator] =
    useState<{
      id: string;
      name: string;
      avatar_url?: string | null;
      is_verified?: boolean;
    } | null>(null);

  const [template, setTemplate] =
    useState<Template | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [photo, setPhoto] =
    useState<string | null>(null);

  const [photoSize, setPhotoSize] =
    useState<{
      width: number;
      height: number;
    } | null>(null);

  const [adjustment, setAdjustment] =
    useState<PhotoAdjustment>(
      DEFAULT_ADJUSTMENT
    );

  const [name, setName] =
    useState("");

  const [generating, setGenerating] =
    useState(false);

  const [generatedImage, setGeneratedImage] =
    useState<string | null>(null);

  const [downloaded, setDownloaded] =
    useState(false);

  const [sharing, setSharing] =
    useState(false);

  const [shared, setShared] =
    useState(false);

  const visitorIdRef =
    useRef<string | null>(null);

  const trafficSourceRef =
    useRef<ReturnType<
      typeof getCampaignTrafficSource
    >>("direct");

  const viewTrackedRef =
    useRef(false);

  const frameRef =
    useRef<HTMLDivElement | null>(null);

  const dragState = useRef<{
    startX: number;
    startY: number;
    startOffset: PhotoAdjustment;
  } | null>(null);

  /*
   * =======================================================
   * VISITOR / ANALYTICS
   * =======================================================
   */

  const getCurrentVisitorId =
    useCallback(() => {
      if (!visitorIdRef.current) {
        visitorIdRef.current =
          getVisitorId();
      }

      return visitorIdRef.current;
    }, []);

  const trackCampaignEvent =
    useCallback(
      async (
        campaignId: string,
        eventType:
          | "view"
          | "generate"
          | "download"
          | "share",
        sharePlatform?: string,
        metadata?: Record<string, unknown>
      ) => {
        await sendCampaignEvent(
          supabase,
          campaignId,
          getCurrentVisitorId(),
          eventType,
          trafficSourceRef.current,
          sharePlatform,
          metadata
        );
      },
      [
        getCurrentVisitorId,
        supabase,
      ]
    );

  /*
   * =======================================================
   * LOAD CAMPAIGN
   * =======================================================
   */

  useEffect(() => {
    async function loadCampaign() {
      setLoading(true);
      setError("");

      try {
        const {
          data: campaignData,
          error: campaignError,
        } = await supabase
          .from("campaigns")
          .select("*")
          .eq("slug", slug)
          .eq("status", "published")
          .single();

        if (
          campaignError ||
          !campaignData
        ) {
          throw new Error(
            "This campaign does not exist or is no longer available."
          );
        }

        const typedCampaign =
          campaignData as Campaign;

        setCampaign(
          typedCampaign
        );

        // Fetch parent event details
        if (campaignData.event_id) {
          const { data: eventData } = await supabase
            .from("events")
            .select(`
              id,
              title,
              slug,
              cover_image,
              start_at,
              end_at,
              venue_name,
              address,
              city,
              state,
              country,
              is_online,
              status,
              event_categories (
                id,
                name,
                slug
              )
            `)
            .eq("id", campaignData.event_id)
            .maybeSingle();

          if (eventData) {
            setParentEvent(eventData as unknown as CampaignParentEventSummary);
          }
        }

        // Fetch campaign creator profile
        if (campaignData.creator_id) {
          const { data: creatorData } = await supabase
            .from("profiles")
            .select("id, name, avatar_url")
            .eq("id", campaignData.creator_id)
            .maybeSingle();

          if (creatorData && creatorData.name) {
            setCreator({
              id: creatorData.id,
              name: creatorData.name,
              avatar_url: creatorData.avatar_url,
              is_verified: true,
            });
          }
        }

        const {
          data: templateData,
          error: templateError,
        } = await supabase
          .from("campaign_templates")
          .select("*")
          .eq(
            "campaign_id",
            campaignData.id
          )
          .eq("is_active", true)
          .order("version", {
            ascending: false,
          })
          .limit(1)
          .maybeSingle();

        if (templateError) {
          throw new Error(
            templateError.message
          );
        }

        if (!templateData) {
          throw new Error(
            "This campaign does not have a design yet."
          );
        }

        setTemplate(
          templateData as Template
        );

        trafficSourceRef.current =
          getCampaignTrafficSource(
            campaignData.id
          );

        /*
         * Track the page view through
         * the central analytics function.
         *
         * Do NOT directly update campaigns.views here.
         */
        if (!viewTrackedRef.current) {
          viewTrackedRef.current = true;

          await trackCampaignEvent(
            campaignData.id,
            "view",
            undefined,
            {
              page: "public_campaign",
              slug: campaignData.slug,
            }
          );
        }
      } catch (err: any) {
        console.error(
          "Campaign loading error:",
          err
        );

        setError(
          err?.message ||
            "Unable to load this campaign."
        );
      } finally {
        setLoading(false);
      }
    }

    if (slug) {
      loadCampaign();
    }
  }, [
    slug,
    supabase,
    trackCampaignEvent,
  ]);

  /*
   * =======================================================
   * PHOTO UPLOAD
   * =======================================================
   */

  function handlePhotoUpload(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const file =
      event.target.files?.[0];

    if (!file) return;

    if (
      !file.type.startsWith("image/")
    ) {
      setError(
        "Please upload an image file."
      );
      return;
    }

    if (
      file.size >
      10 * 1024 * 1024
    ) {
      setError(
        "Please choose an image smaller than 10 MB."
      );
      return;
    }

    setError("");

    const reader =
      new FileReader();

    reader.onload = () => {
      const dataUrl =
        reader.result as string;

      const probe =
        new Image();

      probe.onload = () => {
        setPhotoSize({
          width:
            probe.naturalWidth,
          height:
            probe.naturalHeight,
        });

        setAdjustment(
          DEFAULT_ADJUSTMENT
        );

        setPhoto(dataUrl);

        setGeneratedImage(
          null
        );

        setDownloaded(false);
        setShared(false);
      };

      probe.onerror = () => {
        setError(
          "Could not read your photo."
        );
      };

      probe.src = dataUrl;
    };

    reader.onerror = () => {
      setError(
        "Could not read your photo."
      );
    };

    reader.readAsDataURL(file);

    event.target.value = "";
  }

  /*
   * =======================================================
   * CANVAS CONFIG
   * =======================================================
   */

  const canvasConfig =
    template?.canvas_config;

  const canvasWidth =
    canvasConfig?.canvas?.width ||
    template?.width ||
    1080;

  const canvasHeight =
    canvasConfig?.canvas?.height ||
    template?.height ||
    1080;

  const photoPosition =
    useMemo<PhotoPosition>(() => {
      const photoConfig =
        canvasConfig?.photo;

      if (!photoConfig) {
        return {
          left: 25,
          top: 25,
          width: 50,
          height: 50,
          angle: 0,
          shape: "rectangle",
        };
      }

      return {
        left:
          (photoConfig.x /
            canvasWidth) *
          100,

        top:
          (photoConfig.y /
            canvasHeight) *
          100,

        width:
          (photoConfig.width /
            canvasWidth) *
          100,

        height:
          (photoConfig.height /
            canvasHeight) *
          100,

        angle:
          photoConfig.angle ||
          0,

        shape:
          photoConfig.shape ||
          "rectangle",
      };
    }, [
      canvasConfig,
      canvasWidth,
      canvasHeight,
    ]);

  const namePosition =
    useMemo<NamePosition>(() => {
      const nameConfig =
        canvasConfig?.name;

      if (!nameConfig) {
        return {
          left: 10,
          top: 85,
          width: 80,
          fontSize: 42,
          fontFamily: "Arial",
          fontWeight: 600,
          textAlign: "center",
          color: "#111111",
          angle: 0,
        };
      }

      return {
        left:
          (nameConfig.x /
            canvasWidth) *
          100,

        top:
          (nameConfig.y /
            canvasHeight) *
          100,

        width:
          (nameConfig.width /
            canvasWidth) *
          100,

        fontSize:
          nameConfig.fontSize ||
          42,

        fontFamily:
          nameConfig.fontFamily ||
          "Arial",

        fontWeight:
          nameConfig.fontWeight ||
          600,

        textAlign:
          nameConfig.textAlign ||
          "center",

        color:
          nameConfig.color ||
          "#111111",

        angle:
          nameConfig.angle ||
          0,
      };
    }, [
      canvasConfig,
      canvasWidth,
      canvasHeight,
    ]);

  const nameHeightPct =
    ((namePosition.fontSize *
      1.5) /
      canvasHeight) *
    100;

  const clampedAdjustment =
    useMemo(() => {
      if (!photoSize) {
        return adjustment;
      }

      return clampAdjustment(
        adjustment,
        photoPosition.width,
        photoPosition.height,
        photoSize.width,
        photoSize.height
      );
    }, [
      adjustment,
      photoPosition.width,
      photoPosition.height,
      photoSize,
    ]);

  /*
   * =======================================================
   * PHOTO CONTROLS
   * =======================================================
   */

  function updateZoom(
    nextZoom: number
  ) {
    setAdjustment(
      (current: PhotoAdjustment) => {
        const zoom = Math.min(
          3,
          Math.max(
            1,
            nextZoom
          )
        );

        if (!photoSize) {
          return {
            ...current,
            zoom,
          };
        }

        return clampAdjustment(
          {
            ...current,
            zoom,
          },
          photoPosition.width,
          photoPosition.height,
          photoSize.width,
          photoSize.height
        );
      }
    );
  }

  function resetAdjustment() {
    setAdjustment(
      DEFAULT_ADJUSTMENT
    );
  }

  /*
   * =======================================================
   * PHOTO DRAGGING
   * =======================================================
   */

  function handlePointerDown(
    event: ReactPointerEvent<HTMLDivElement>
  ) {
    if (!photo) return;

    (
      event.target as HTMLElement
    ).setPointerCapture(
      event.pointerId
    );

    dragState.current = {
      startX:
        event.clientX,
      startY:
        event.clientY,
      startOffset:
        clampedAdjustment,
    };
  }

  function handlePointerMove(
    event: ReactPointerEvent<HTMLDivElement>
  ) {
    if (
      !dragState.current ||
      !frameRef.current ||
      !photoSize
    ) {
      return;
    }

    const rect =
      frameRef.current.getBoundingClientRect();

    const dxPct =
      (event.clientX -
        dragState.current
          .startX) /
      rect.width;

    const dyPct =
      (event.clientY -
        dragState.current
          .startY) /
      rect.height;

    const next =
      clampAdjustment(
        {
          zoom:
            dragState.current
              .startOffset
              .zoom,

          offsetX:
            dragState.current
              .startOffset
              .offsetX +
            dxPct,

          offsetY:
            dragState.current
              .startOffset
              .offsetY +
            dyPct,
        },
        photoPosition.width,
        photoPosition.height,
        photoSize.width,
        photoSize.height
      );

    setAdjustment(next);
  }

  function handlePointerUp() {
    dragState.current = null;
  }

  /*
   * =======================================================
   * GENERATE DP
   * =======================================================
   */

  async function generateDP() {
    if (
      !campaign ||
      !template
    ) {
      return;
    }

    if (
      !photo ||
      !photoSize
    ) {
      setError(
        "Please upload your photo first."
      );
      return;
    }

    if (!name.trim()) {
      setError(
        "Please enter your name."
      );
      return;
    }

    setError("");
    setGenerating(true);
    setGeneratedImage(null);
    setDownloaded(false);
    setShared(false);

    try {
      const result =
        await generateCampaignImage({
          templateUrl:
            template.asset_url,

          photoUrl:
            photo,

          name,

          canvasWidth,

          canvasHeight,

          photoPosition,

          namePosition,

          nameHeightPct,

          zoom:
            clampedAdjustment.zoom,

          offsetX:
            clampedAdjustment.offsetX,

          offsetY:
            clampedAdjustment.offsetY,
        });

      setGeneratedImage(
        result
      );

      await trackCampaignEvent(
        campaign.id,
        "generate",
        undefined,
        {
          page: "public_campaign",
          slug: campaign.slug,
          has_photo: true,
          has_name: true,
        }
      );
    } catch (err: any) {
      console.error(
        "DP generation failed:",
        err
      );

      setGeneratedImage(null);

      setError(
        err?.message ||
          "Could not generate your DP."
      );
    } finally {
      setGenerating(false);
    }
  }

  /*
   * =======================================================
   * DOWNLOAD DP
   * =======================================================
   */

  async function downloadDP() {
    if (!generatedImage) {
      return;
    }

    try {
      const link =
        document.createElement(
          "a"
        );

      link.href =
        generatedImage;

      link.download =
        `${slug}-attend-dp.png`;

      document.body.appendChild(
        link
      );

      link.click();

      link.remove();

      setDownloaded(true);

      if (campaign) {
        await trackCampaignEvent(
          campaign.id,
          "download",
          undefined,
          {
            page: "public_campaign",
            slug: campaign.slug,
          }
        );
      }
    } catch (err) {
      console.error(
        "Download failed:",
        err
      );

      setError(
        "Could not download the image. Please try again."
      );
    }
  }

  /*
   * =======================================================
   * SHARE GENERATED IMAGE
   * =======================================================
   */

  async function shareGeneratedImage() {
    if (
      !generatedImage ||
      !campaign
    ) {
      return;
    }

    setSharing(true);

    try {
      const res =
        await fetch(
          generatedImage
        );

      const blob =
        await res.blob();

      const file =
        new File(
          [blob],
          `${slug}-attend-dp.png`,
          {
            type: "image/png",
          }
        );

      if (
        navigator.canShare &&
        navigator.canShare({
          files: [file],
        })
      ) {
        await navigator.share({
          files: [file],
          title:
            campaign.title,
          text: `Check out my personalized DP for ${campaign.title}!`,
        });
      } else if (
        navigator.share
      ) {
        await navigator.share({
          title:
            campaign.title,
          text: `I'm attending ${campaign.title}! Create yours here:`,
          url:
            window.location.href,
        });
      } else {
        await downloadDP();
      }

      setShared(true);

      await trackCampaignEvent(
        campaign.id,
        "share",
        "native_share",
        {
          page: "public_campaign",
          slug: campaign.slug,
        }
      );
    } catch (err: any) {
      if (
        err.name !==
        "AbortError"
      ) {
        console.warn(
          "Share failed:",
          err
        );
      }
    } finally {
      setSharing(false);
    }
  }

  /*
   * =======================================================
   * LOADING
   * =======================================================
   */

  if (loading) {
    return (
      <CampaignLoadingState />
    );
  }

  /*
   * =======================================================
   * ERROR
   * =======================================================
   */

  if (
    error &&
    !campaign
  ) {
    return (
      <CampaignErrorState
        error={error}
      />
    );
  }

  if (
    !campaign ||
    !template
  ) {
    return null;
  }

  /*
   * =======================================================
   * PAGE UI
   * =======================================================
   */

  return (
    <main className="min-h-screen bg-white">
      <CampaignHeader
        parentEvent={parentEvent}
        creator={creator}
      />

      <div className="mx-auto max-w-5xl px-5 py-8 sm:py-12">
        <CampaignIntro
          title={campaign.title}
          parentEvent={parentEvent}
          participantCount={campaign.participants || campaign.generations || 0}
        />

        <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_420px] lg:items-start">
          <section className="order-2 lg:order-1">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold">
                Preview
              </h2>

              <span className="text-xs text-neutral-400">
                {canvasWidth} ×{" "}
                {canvasHeight}px
              </span>
            </div>

            <div className="rounded-2xl bg-neutral-100 p-3 sm:p-5">
              {generatedImage ? (
                <CampaignGeneratedImage
                  image={
                    generatedImage
                  }
                />
              ) : (
                <CampaignPreview
                  template={template}
                  photo={photo ?? ""}
                  name={name}
                  canvasWidth={
                    canvasWidth
                  }
                  canvasHeight={
                    canvasHeight
                  }
                  photoPosition={
                    photoPosition
                  }
                  namePosition={
                    namePosition
                  }
                  nameHeightPct={
                    nameHeightPct
                  }
                  photoSize={
                    photoSize
                  }
                  clampedAdjustment={
                    clampedAdjustment
                  }
                  frameRef={
                    frameRef
                  }
                  onPointerDown={
                    handlePointerDown
                  }
                  onPointerMove={
                    handlePointerMove
                  }
                  onPointerUp={
                    handlePointerUp
                  }
                />
              )}
            </div>

            {photo &&
              !generatedImage && (
                <CampaignPhotoControls
                  zoom={
                    clampedAdjustment.zoom
                  }
                  onZoomChange={
                    updateZoom
                  }
                  onReset={
                    resetAdjustment
                  }
                />
              )}
          </section>

          <section className="order-1 lg:order-2">
            <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm sm:p-6">
              <h2 className="text-base font-semibold">
                Create from campaign
              </h2>

              <p className="mt-1 text-xs leading-5 text-neutral-500">
                Your photo and name will be placed into the campaign design for you.
              </p>

              <CampaignPhotoUpload
                photo={
                  photo || ""
                }
                onChange={
                  handlePhotoUpload
                }
              />

              <CampaignNameInput
                name={name}
                onChange={(value) => {
                  setName(value);
                  setGeneratedImage(
                    null
                  );
                  setDownloaded(
                    false
                  );
                  setShared(false);
                  setError("");
                }}
              />

              {error && (
                <div className="mt-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-xs leading-5 text-red-600">
                  {error}
                </div>
              )}

              {!generatedImage ? (
                <button
                  type="button"
                  onClick={
                    generateDP
                  }
                  disabled={
                    generating ||
                    !photo ||
                    !name.trim()
                  }
                  className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-violet-600 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {generating
                    ? "Generating version..."
                    : "Create your version"}
                </button>
              ) : (
                <CampaignResultActions
                  downloaded={
                    downloaded
                  }
                  sharing={
                    sharing
                  }
                  shared={
                    shared
                  }
                  parentEvent={
                    parentEvent
                  }
                  onDownload={
                    downloadDP
                  }
                  onShare={
                    shareGeneratedImage
                  }
                  onCreateAnother={() => {
                    setGeneratedImage(
                      null
                    );
                    setDownloaded(
                      false
                    );
                    setShared(
                      false
                    );
                  }}
                />
              )}

              <p className="mt-5 text-center text-[11px] leading-5 text-neutral-400">
                No account required.
                Your photo is
                processed in your
                browser.
              </p>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}