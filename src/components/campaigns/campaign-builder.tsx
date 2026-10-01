"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
} from "react";
import { useRouter } from "next/navigation";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  ArrowLeft,
  Bold,
  Check,
  Circle,
  ImagePlus,
  Info,
  Loader2,
  Maximize2,
  Minus,
  Move,
  Plus,
  RefreshCw,
  Square,
  Trash2,
  Type,
  Upload,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  Canvas,
  Ellipse,
  FabricImage,
  Rect,
  Textbox,
  type FabricObject,
} from "fabric";
import { useCampaignBuilderStore } from "@/stores/useCampaignBuilderStore";
import { BuilderHeader } from "./builder/BuilderHeader";
import { BuilderSidebar } from "./builder/BuilderSidebar";
import { BuilderZoomControls } from "./builder/BuilderZoomControls";
import { BuilderCanvas } from "./builder/BuilderCanvas";

import type {
  CampaignBuilderCampaign,
  CampaignBuilderProps,
  CampaignBuilderTemplate,
  EventData,
  FieldData,
  FieldObject,
  FieldType,
  NameStyle,
  PhotoShape,
} from "@/types/campaign-builder";
import { DEFAULT_NAME_STYLE, FONT_OPTIONS } from "@/types/campaign-builder";

/*
 * ---------------------------------------------------------
 * PHOTO FIELD STYLE
 * ---------------------------------------------------------
 */

const PHOTO_FIELD_STYLE = {
  originX: "left" as const,
  originY: "top" as const,
  fill: "rgba(124, 58, 237, 0.12)",
  stroke: "#7c3aed",
  strokeWidth: 2,
  strokeDashArray: [8, 6],
  transparentCorners: false,
  cornerColor: "#7c3aed",
  cornerStrokeColor: "#ffffff",
  cornerStyle: "circle" as const,
  selectable: true,
  evented: true,
  objectCaching: false,
};

/*
 * ---------------------------------------------------------
 * COMPONENT
 * ---------------------------------------------------------
 */

export default function CampaignBuilder({
  mode,
  eventId,
  campaign,
  template,
}: CampaignBuilderProps) {
  const router = useRouter();

  const supabase = useMemo(
    () => createClient(),
    []
  );

  /*
   * -------------------------------------------------------
   * REFS
   * -------------------------------------------------------
   */

  const canvasElement =
    useRef<HTMLCanvasElement | null>(null);

  const fabricCanvas =
    useRef<Canvas | null>(null);

  const backgroundImage =
    useRef<FabricImage | null>(null);

  const localPreviewUrl =
    useRef<string | null>(null);

  /*
   * -------------------------------------------------------
   * STATE
   * -------------------------------------------------------
   */

  const {
    event, setEvent,
    title, setTitle,
    description, setDescription,
    designFile, setDesignFile,
    designUrl, setDesignUrl,
    originalWidth, setOriginalWidth,
    originalHeight, setOriginalHeight,
    editorWidth, setEditorWidth,
    editorHeight, setEditorHeight,
    zoom, setZoom,
    selectedField, setSelectedField,
    nameStyle, setNameStyle, updateNameStyle,
    photoShape, setPhotoShape,
    saving, setSaving,
    loading, setLoading,
    error, setError
  } = useCampaignBuilderStore();

  /*
   * ---------------------------------------------------------
   * LOAD EVENT
   * ---------------------------------------------------------
   */

  useEffect(() => {
    let mounted = true;

    async function loadEvent() {
      try {
        setLoading(true);
        setError("");

        const {
          data,
          error: eventError,
        } = await supabase
          .from("events")
          .select(
            "id, title, cover_image"
          )
          .eq("id", eventId)
          .single();

        if (!mounted) return;

        if (eventError || !data) {
          setError(
            eventError?.message ||
              "Event could not be found."
          );
          return;
        }

        setEvent(data as EventData);
      } catch (err: any) {
        if (!mounted) return;

        setError(
          err?.message ||
            "Could not load event."
        );
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadEvent();

    return () => {
      mounted = false;
    };
  }, [eventId, supabase]);

  /*
   * ---------------------------------------------------------
   * LOAD EXISTING CAMPAIGN INTO BUILDER
   * ---------------------------------------------------------
   */

  useEffect(() => {
    if (
      mode !== "edit" ||
      !campaign ||
      !template
    ) {
      return;
    }

    setTitle(campaign.title || "");
    setDescription(
      campaign.description || ""
    );

    setDesignFile(null);
    setDesignUrl(
      template.asset_url || ""
    );

    setOriginalWidth(
      template.width || 1080
    );

    setOriginalHeight(
      template.height || 1080
    );

    setZoom(1);
    setSelectedField(null);
    setError("");
  }, [
    mode,
    campaign,
    template,
  ]);

  /*
   * ---------------------------------------------------------
   * CALCULATE EDITOR SIZE
   * ---------------------------------------------------------
   */

  const calculateEditorSize =
    useCallback(
      (
        width: number,
        height: number
      ) => {
        if (
          typeof window ===
          "undefined"
        ) {
          const scale = Math.min(
            760 / width,
            760 / height,
            1
          );

          return {
            width: Math.max(
              1,
              Math.round(
                width * scale
              )
            ),
            height: Math.max(
              1,
              Math.round(
                height * scale
              )
            ),
          };
        }

        const sidebarWidth = 340;

        const availableWidth =
          Math.max(
            280,
            window.innerWidth -
              sidebarWidth -
              90
          );

        const availableHeight =
          Math.max(
            300,
            window.innerHeight -
              150
          );

        const maxWidth =
          Math.min(
            780,
            availableWidth
          );

        const maxHeight =
          Math.min(
            780,
            availableHeight
          );

        const scale = Math.min(
          maxWidth / width,
          maxHeight / height,
          1
        );

        return {
          width: Math.max(
            1,
            Math.round(
              width * scale
            )
          ),
          height: Math.max(
            1,
            Math.round(
              height * scale
            )
          ),
        };
      },
      []
    );

  /*
   * ---------------------------------------------------------
   * WINDOW RESIZE
   * ---------------------------------------------------------
   */

  useEffect(() => {
    if (!designUrl) return;

    function handleResize() {
      const size =
        calculateEditorSize(
          originalWidth,
          originalHeight
        );

      setEditorWidth(
        size.width
      );

      setEditorHeight(
        size.height
      );
    }

    window.addEventListener(
      "resize",
      handleResize
    );

    return () =>
      window.removeEventListener(
        "resize",
        handleResize
      );
  }, [
    designUrl,
    originalWidth,
    originalHeight,
    calculateEditorSize,
  ]);

  /*
   * ---------------------------------------------------------
   * FIELD HELPERS
   * ---------------------------------------------------------
   */

  function getField(
    type: FieldType
  ) {
    const canvas =
      fabricCanvas.current;

    if (!canvas) return null;

    return canvas
      .getObjects()
      .find(
        (object: any) =>
          object?.data?.type ===
          type
      ) as
      | FieldObject
      | undefined;
  }

  function readNameStyleFromObject(
    object: FieldObject
  ): NameStyle {
    const textbox =
      object as unknown as Textbox;

    return {
      fontFamily:
        (textbox.fontFamily as string) ||
        DEFAULT_NAME_STYLE.fontFamily,

      fontSize: Math.round(
        (textbox.fontSize ||
          DEFAULT_NAME_STYLE.fontSize) *
          (object.scaleY || 1)
      ),

      color:
        (textbox.fill as string) ||
        DEFAULT_NAME_STYLE.color,

      bold:
        String(
          textbox.fontWeight
        ) === "700" ||
        String(
          textbox.fontWeight
        ) === "bold",

      textAlign:
        (textbox.textAlign as NameStyle["textAlign"]) ||
        "center",
    };
  }

  /*
   * ---------------------------------------------------------
   * SELECTION
   * ---------------------------------------------------------
   */

  function handleSelection(
    selectionEvent: any
  ) {
    const object =
      selectionEvent.selected?.[0] as
        | FieldObject
        | undefined;

    if (
      !object?.data?.type
    ) {
      setSelectedField(null);
      return;
    }

    setSelectedField(
      object.data.type
    );

    if (
      object.data.type ===
      "name"
    ) {
      setNameStyle(
        readNameStyleFromObject(
          object
        )
      );
    }

    if (
      object.data.type ===
      "photo"
    ) {
      setPhotoShape(
        object.data.shape ||
          "rectangle"
      );
    }
  }

  /*
   * ---------------------------------------------------------
   * BUILD PHOTO OBJECT
   * ---------------------------------------------------------
   */

  function buildPhotoObject(
    shape: PhotoShape,
    geometry: {
      left: number;
      top: number;
      width: number;
      height: number;
      angle: number;
    }
  ) {
    if (
      shape === "circle"
    ) {
      return new Ellipse({
        ...PHOTO_FIELD_STYLE,
        left: geometry.left,
        top: geometry.top,
        angle: geometry.angle,
        rx:
          geometry.width / 2,
        ry:
          geometry.height / 2,
      });
    }

    return new Rect({
      ...PHOTO_FIELD_STYLE,
      left: geometry.left,
      top: geometry.top,
      angle: geometry.angle,
      width: geometry.width,
      height: geometry.height,
      rx: 10,
      ry: 10,
    });
  }

  /*
   * ---------------------------------------------------------
   * CREATE FIELD FROM SAVED CONFIG
   * ---------------------------------------------------------
   */

  function restoreSavedFields(
    canvas: Canvas,
    config: any,
    size: {
      width: number;
      height: number;
    }
  ) {
    if (!config) {
      return;
    }

    const scaleX =
      size.width /
      originalWidth;

    const scaleY =
      size.height /
      originalHeight;

    /*
     * PHOTO
     */

    if (config.photo) {
      const savedPhoto =
        config.photo;

      const width =
        Number(
          savedPhoto.width
        ) * scaleX;

      const height =
        Number(
          savedPhoto.height
        ) * scaleY;

      const photo =
        buildPhotoObject(
          savedPhoto.shape ===
            "circle"
            ? "circle"
            : "rectangle",
          {
            left:
              Number(
                savedPhoto.x
              ) * scaleX,

            top:
              Number(
                savedPhoto.y
              ) * scaleY,

            width,
            height,

            angle:
              Number(
                savedPhoto.angle
              ) || 0,
          }
        );

      (
        photo as FieldObject
      ).data = {
        type: "photo",
        shape:
          savedPhoto.shape ===
          "circle"
            ? "circle"
            : "rectangle",
      };

      canvas.add(photo);
    }

    /*
     * NAME
     */

    if (config.name) {
      const savedName =
        config.name;

      const savedWidth =
        Number(
          savedName.width
        ) * scaleX;

      const savedFontSize =
        Number(
          savedName.fontSize ||
            DEFAULT_NAME_STYLE.fontSize
        ) * scaleY;

      const textbox =
        new Textbox(
          "ATTENDEE NAME",
          {
            left:
              Number(
                savedName.x
              ) * scaleX,

            top:
              Number(
                savedName.y
              ) * scaleY,

            originX: "left",
            originY: "top",

            width:
              Math.max(
                20,
                savedWidth
              ),

            fontSize:
              Math.max(
                10,
                savedFontSize
              ),

            fontFamily:
              savedName.fontFamily ||
              "Arial",

            fontWeight:
              savedName.fontWeight ||
              "700",

            textAlign:
              savedName.textAlign ||
              "center",

            fill:
              savedName.color ||
              "#111111",

            backgroundColor:
              "rgba(255,255,255,0.35)",

            padding: 8,

            editable: false,

            angle:
              Number(
                savedName.angle
              ) || 0,

            transparentCorners:
              false,

            cornerColor:
              "#7c3aed",

            cornerStrokeColor:
              "#ffffff",

            cornerStyle:
              "circle",

            selectable: true,
            evented: true,
            objectCaching: false,
          }
        );

      (
        textbox as FieldObject
      ).data = {
        type: "name",
      };

      canvas.add(textbox);
    }

    /*
     * Put fields above artwork.
     */

    const photo =
      getFieldFromCanvas(
        canvas,
        "photo"
      );

    const name =
      getFieldFromCanvas(
        canvas,
        "name"
      );

    if (photo) {
      canvas.bringObjectToFront(
        photo
      );
    }

    if (name) {
      canvas.bringObjectToFront(
        name
      );
    }

    canvas.discardActiveObject();
    canvas.renderAll();
  }

  /*
   * ---------------------------------------------------------
   * INITIALIZE FABRIC
   * ---------------------------------------------------------
   */

  useEffect(() => {
    if (
      !canvasElement.current ||
      !designUrl
    ) {
      return;
    }

    let cancelled = false;

    async function initializeCanvas() {
      try {
        if (
          fabricCanvas.current
        ) {
          fabricCanvas.current.dispose();
          fabricCanvas.current =
            null;
        }

        const size =
          calculateEditorSize(
            originalWidth,
            originalHeight
          );

        setEditorWidth(
          size.width
        );

        setEditorHeight(
          size.height
        );

        const canvas =
          new Canvas(
            canvasElement.current!,
            {
              width: size.width,
              height: size.height,
              backgroundColor:
                "#ffffff",
              preserveObjectStacking:
                true,
              selection: true,
              renderOnAddRemove:
                true,
            }
          );

        fabricCanvas.current =
          canvas;

        const image =
          await FabricImage.fromURL(
            designUrl,
            {
              crossOrigin:
                "anonymous",
            }
          );

        if (cancelled) {
          canvas.dispose();
          return;
        }

        const scaleX =
          size.width /
          (image.width || 1);

        const scaleY =
          size.height /
          (image.height || 1);

        image.set({
          left: 0,
          top: 0,
          originX: "left",
          originY: "top",
          selectable: false,
          evented: false,
          hasControls: false,
          hasBorders: false,
          excludeFromExport:
            false,
        });

        image.scaleX = scaleX;
        image.scaleY = scaleY;

        backgroundImage.current =
          image;

        canvas.add(image);
        canvas.sendObjectToBack(
          image
        );

        /*
         * Restore saved fields
         * when editing.
         */

        if (
          mode === "edit" &&
          template?.canvas_config
        ) {
          restoreSavedFields(
            canvas,
            template.canvas_config,
            size
          );
        }

        /*
         * Selection listeners.
         */

        canvas.on(
          "selection:created",
          handleSelection
        );

        canvas.on(
          "selection:updated",
          handleSelection
        );

        canvas.on(
          "selection:cleared",
          () =>
            setSelectedField(
              null
            )
        );

        canvas.on(
          "object:moving",
          () =>
            canvas.renderAll()
        );

        canvas.on(
          "object:scaling",
          () =>
            canvas.renderAll()
        );

        canvas.on(
          "object:rotating",
          () =>
            canvas.renderAll()
        );

        canvas.on(
          "object:scaling",
          (e: any) => {
            const target =
              e.target as
                | FieldObject
                | undefined;

            if (
              target?.data?.type ===
              "name"
            ) {
              setNameStyle(
                readNameStyleFromObject(
                  target
                )
              );
            }
          }
        );

        canvas.renderAll();
      } catch (err) {
        console.error(
          "Fabric initialization error:",
          err
        );

        if (!cancelled) {
          setError(
            "Could not load the design."
          );
        }
      }
    }

    initializeCanvas();

    return () => {
      cancelled = true;

      if (
        fabricCanvas.current
      ) {
        fabricCanvas.current.dispose();
        fabricCanvas.current =
          null;
      }

      backgroundImage.current =
        null;
    };

    // The editor should only rebuild when the actual artwork changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    designUrl,
    originalWidth,
    originalHeight,
    calculateEditorSize,
  ]);

  /*
   * ---------------------------------------------------------
   * UPLOAD ARTWORK
   * ---------------------------------------------------------
   */

  function handleDesignUpload(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const file =
      event.target.files?.[0];

    if (!file) return;

    setError("");

    if (
      !file.type.startsWith(
        "image/"
      )
    ) {
      setError(
        "Please upload a valid image."
      );
      return;
    }

    if (
      file.size >
      15 * 1024 * 1024
    ) {
      setError(
        "Design must be smaller than 15MB."
      );
      return;
    }

    /*
     * Changing artwork means
     * the old field positions may
     * no longer be valid.
     */

    if (
      fabricCanvas.current
    ) {
      const canvas =
        fabricCanvas.current;

      canvas
        .getObjects()
        .filter(
          (object: any) =>
            object?.data?.type
        )
        .forEach((object) =>
          canvas.remove(object)
        );

      canvas.discardActiveObject();
      canvas.renderAll();
    }

    setSelectedField(null);

    if (
      localPreviewUrl.current
    ) {
      URL.revokeObjectURL(
        localPreviewUrl.current
      );
    }

    const localUrl =
      URL.createObjectURL(
        file
      );

    localPreviewUrl.current =
      localUrl;

    const img =
      new Image();

    img.onload = () => {
      setDesignFile(file);

      setOriginalWidth(
        img.naturalWidth
      );

      setOriginalHeight(
        img.naturalHeight
      );

      setZoom(1);

      setDesignUrl(
        localUrl
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(
        localUrl
      );

      localPreviewUrl.current =
        null;

      setError(
        "Could not read the uploaded image."
      );
    };

    img.src = localUrl;
  }

  /*
   * ---------------------------------------------------------
   * REMOVE ARTWORK
   * ---------------------------------------------------------
   */

  function removeDesign() {
    if (
      localPreviewUrl.current
    ) {
      URL.revokeObjectURL(
        localPreviewUrl.current
      );

      localPreviewUrl.current =
        null;
    }

    if (
      fabricCanvas.current
    ) {
      fabricCanvas.current.dispose();

      fabricCanvas.current =
        null;
    }

    backgroundImage.current =
      null;

    setDesignFile(null);
    setDesignUrl("");

    setOriginalWidth(1080);
    setOriginalHeight(1080);

    setEditorWidth(700);
    setEditorHeight(700);

    setSelectedField(null);
    setZoom(1);
  }

  /*
   * ---------------------------------------------------------
   * ADD PHOTO FIELD
   * ---------------------------------------------------------
   */

  function addPhotoField() {
    const canvas =
      fabricCanvas.current;

    if (!canvas) {
      setError(
        "Upload a design first."
      );
      return;
    }

    setError("");

    const existing =
      getField("photo");

    if (existing) {
      canvas.setActiveObject(
        existing
      );

      canvas.renderAll();

      setSelectedField(
        "photo"
      );

      return;
    }

    const size =
      Math.min(
        editorWidth * 0.3,
        editorHeight * 0.3,
        260
      );

    const photo =
      buildPhotoObject(
        "rectangle",
        {
          left:
            (editorWidth -
              size) /
            2,

          top:
            (editorHeight -
              size) /
            2,

          width: size,
          height: size,
          angle: 0,
        }
      );

    (
      photo as FieldObject
    ).data = {
      type: "photo",
      shape: "rectangle",
    };

    canvas.add(photo);
    canvas.bringObjectToFront(
      photo
    );

    canvas.setActiveObject(
      photo
    );

    canvas.renderAll();

    setPhotoShape(
      "rectangle"
    );

    setSelectedField(
      "photo"
    );
  }

  /*
   * ---------------------------------------------------------
   * CHANGE PHOTO SHAPE
   * ---------------------------------------------------------
   */

  function applyPhotoShape(
    shape: PhotoShape
  ) {
    const canvas =
      fabricCanvas.current;

    const object =
      getField("photo");

    if (
      !canvas ||
      !object
    ) {
      return;
    }

    if (
      (object.data?.shape ||
        "rectangle") ===
      shape
    ) {
      setPhotoShape(
        shape
      );
      return;
    }

    object.setCoords();

    const geometry = {
      left:
        object.left || 0,

      top:
        object.top || 0,

      width:
        object.getScaledWidth(),

      height:
        object.getScaledHeight(),

      angle:
        object.angle || 0,
    };

    const next =
      buildPhotoObject(
        shape,
        geometry
      );

    (
      next as FieldObject
    ).data = {
      type: "photo",
      shape,
    };

    canvas.remove(object);
    canvas.add(next);

    canvas.bringObjectToFront(
      next
    );

    canvas.setActiveObject(
      next
    );

    canvas.renderAll();

    setPhotoShape(
      shape
    );
  }

  /*
   * ---------------------------------------------------------
   * ADD NAME FIELD
   * ---------------------------------------------------------
   */

  function addNameField() {
    const canvas =
      fabricCanvas.current;

    if (!canvas) {
      setError(
        "Upload a design first."
      );
      return;
    }

    setError("");

    const existing =
      getField("name");

    if (existing) {
      canvas.setActiveObject(
        existing
      );

      canvas.renderAll();

      setSelectedField(
        "name"
      );

      setNameStyle(
        readNameStyleFromObject(
          existing
        )
      );

      return;
    }

    const style =
      DEFAULT_NAME_STYLE;

    const textbox =
      new Textbox(
        "ATTENDEE NAME",
        {
          left:
            editorWidth *
            0.12,

          top:
            editorHeight *
            0.72,

          originX: "left",
          originY: "top",

          width:
            editorWidth *
            0.76,

          fontSize:
            Math.max(
              18,
              Math.round(
                editorWidth *
                  0.045
              )
            ),

          fontFamily:
            style.fontFamily,

          fontWeight:
            style.bold
              ? "700"
              : "400",

          textAlign:
            style.textAlign,

          fill:
            style.color,

          backgroundColor:
            "rgba(255,255,255,0.35)",

          padding: 8,

          editable: false,

          transparentCorners:
            false,

          cornerColor:
            "#7c3aed",

          cornerStrokeColor:
            "#ffffff",

          cornerStyle:
            "circle",

          selectable: true,
          evented: true,
          objectCaching: false,
        }
      );

    (
      textbox as FieldObject
    ).data = {
      type: "name",
    };

    canvas.add(textbox);

    canvas.bringObjectToFront(
      textbox
    );

    canvas.setActiveObject(
      textbox
    );

    canvas.renderAll();

    setNameStyle(
      readNameStyleFromObject(
        textbox as FieldObject
      )
    );

    setSelectedField(
      "name"
    );
  }

  /*
   * ---------------------------------------------------------
   * UPDATE NAME FIELD
   * ---------------------------------------------------------
   */

  function updateNameField(
    patch: Partial<NameStyle>
  ) {
    const object =
      getField("name");

    const merged = {
      ...nameStyle,
      ...patch,
    };

    setNameStyle(
      merged
    );

    if (!object) return;

    (
      object as any
    ).set({
      fontFamily:
        merged.fontFamily,

      fontWeight:
        merged.bold
          ? "700"
          : "400",

      fill:
        merged.color,

      textAlign:
        merged.textAlign,

      fontSize:
        merged.fontSize,

      scaleY: 1,
    });

    object.setCoords();

    fabricCanvas.current?.renderAll();
  }

  /*
   * ---------------------------------------------------------
   * DELETE FIELD
   * ---------------------------------------------------------
   */

  function deleteSelectedField() {
    const canvas =
      fabricCanvas.current;

    if (!canvas) return;

    const object =
      canvas.getActiveObject() as
        | FieldObject
        | null;

    if (
      !object?.data?.type
    ) {
      return;
    }

    canvas.remove(object);
    canvas.discardActiveObject();
    canvas.renderAll();

    setSelectedField(null);
  }

  /*
   * ---------------------------------------------------------
   * CENTER FIELD
   * ---------------------------------------------------------
   */

  function centerSelectedField() {
    const canvas =
      fabricCanvas.current;

    if (!canvas) return;

    const object =
      canvas.getActiveObject();

    if (!object) return;

    object.set({
      left:
        (editorWidth -
          object.getScaledWidth()) /
        2,

      top:
        (editorHeight -
          object.getScaledHeight()) /
        2,
    });

    object.setCoords();

    canvas.renderAll();
  }

  /*
   * ---------------------------------------------------------
   * ZOOM
   * ---------------------------------------------------------
   */

  function changeZoom(
    amount: number
  ) {
    setZoom(
      Math.min(
        1.8,
        Math.max(
          0.6,
          Number(
            (
              zoom +
              amount
            ).toFixed(2)
          )
        )
      )
    );
  }

  /*
   * ---------------------------------------------------------
   * BUILD CANVAS CONFIG
   * ---------------------------------------------------------
   *
   * The saved config uses the original artwork's coordinate
   * system, not the scaled-down editor coordinate system.
   */

  function buildCanvasConfig() {
    const canvas =
      fabricCanvas.current;

    if (!canvas) {
      return null;
    }

    const ratioX =
      originalWidth /
      editorWidth;

    const ratioY =
      originalHeight /
      editorHeight;

    const photo =
      getField("photo");

    const name =
      getField("name");

    photo?.setCoords();
    name?.setCoords();

    const nameTextbox =
      name as unknown as
        Textbox | undefined;

    return {
      canvas: {
        width:
          originalWidth,

        height:
          originalHeight,
      },

      photo: photo
        ? {
            x:
              (photo.left || 0) *
              ratioX,

            y:
              (photo.top || 0) *
              ratioY,

            width:
              photo.getScaledWidth() *
              ratioX,

            height:
              photo.getScaledHeight() *
              ratioY,

            angle:
              photo.angle || 0,

            shape:
              photo.data
                ?.shape ||
              "rectangle",
          }
        : null,

      name: name
        ? {
            x:
              (name.left || 0) *
              ratioX,

            y:
              (name.top || 0) *
              ratioY,

            width:
              name.getScaledWidth() *
              ratioX,

            fontSize:
              (nameTextbox?.fontSize ||
                24) *
              (name.scaleY || 1) *
              ratioY,

            textAlign:
              nameTextbox?.textAlign ||
              "center",

            fontFamily:
              nameTextbox?.fontFamily ||
              "Arial",

            fontWeight:
              nameTextbox?.fontWeight ||
              "600",

            color:
              nameTextbox?.fill ||
              "#111111",

            angle:
              name.angle || 0,
          }
        : null,
    };
  }

  /*
   * ---------------------------------------------------------
   * SAVE CREATE
   * ---------------------------------------------------------
   */

  async function createCampaign() {
    if (!designFile) {
      throw new Error(
        "Upload a campaign design first."
      );
    }

    const {
      data: {
        user,
      },
    } =
      await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      throw new Error(
        "Please sign in to continue."
      );
    }

    const cleanTitle =
      title
        .toLowerCase()
        .trim()
        .replace(
          /[^a-z0-9]+/g,
          "-"
        )
        .replace(
          /(^-|-$)/g,
          ""
        );

    const slug = `${
      cleanTitle ||
      "campaign"
    }-${Date.now()}`;

    let createdCampaignId =
      "";

    let uploadedPath =
      "";

    try {
      /*
       * Campaign
       */

      const {
        data: createdCampaign,
        error: campaignError,
      } =
        await supabase
          .from("campaigns")
          .insert({
            event_id:
              eventId,

            creator_id:
              user.id,

            title:
              title.trim(),

            slug,

            description:
              description.trim() ||
              null,

            status:
              "draft",
          })
          .select("id")
          .single();

      if (
        campaignError ||
        !createdCampaign
      ) {
        throw new Error(
          campaignError?.message ||
            "Could not create campaign."
        );
      }

      createdCampaignId =
        createdCampaign.id;

      /*
       * Artwork
       */

      const extension =
        designFile.name
          .split(".")
          .pop()
          ?.toLowerCase() ||
        "jpg";

      uploadedPath = `${user.id}/${createdCampaign.id}/design.${extension}`;

      const {
        error: uploadError,
      } =
        await supabase.storage
          .from(
            "campaign-assets"
          )
          .upload(
            uploadedPath,
            designFile,
            {
              cacheControl:
                "3600",

              upsert: true,

              contentType:
                designFile.type,
            }
          );

      if (uploadError) {
        throw new Error(
          uploadError.message
        );
      }

      const {
        data: {
          publicUrl,
        },
      } =
        supabase.storage
          .from(
            "campaign-assets"
          )
          .getPublicUrl(
            uploadedPath
          );

      /*
       * Template
       */

      const {
        error: templateError,
      } =
        await supabase
          .from(
            "campaign_templates"
          )
          .insert({
            campaign_id:
              createdCampaign.id,

            name: `${title.trim()} Template`,

            asset_url:
              publicUrl,

            width:
              originalWidth,

            height:
              originalHeight,

            canvas_config:
              buildCanvasConfig() as any,

            version: 1,

            is_active: true,
          });

      if (templateError) {
        throw new Error(
          templateError.message
        );
      }

      router.push(
        `/events/${eventId}/campaigns/${createdCampaign.id}`
      );
    } catch (err) {
      /*
       * Cleanup partially-created
       * campaign.
       */

      if (createdCampaignId) {
        try {
          if (uploadedPath) {
            await supabase.storage
              .from(
                "campaign-assets"
              )
              .remove([
                uploadedPath,
              ]);
          }

          await supabase
            .from("campaigns")
            .delete()
            .eq(
              "id",
              createdCampaignId
            );
        } catch (
          cleanupError
        ) {
          console.error(
            "Campaign cleanup failed:",
            cleanupError
          );
        }
      }

      throw err;
    }
  }

  /*
   * ---------------------------------------------------------
   * SAVE EDIT
   * ---------------------------------------------------------
   */

  async function updateCampaign() {
    if (
      !campaign ||
      !template
    ) {
      throw new Error(
        "Campaign data is unavailable."
      );
    }

    const {
      data: {
        user,
      },
    } =
      await supabase.auth.getUser();

    if (!user) {
      router.push("/login");

      throw new Error(
        "Please sign in to continue."
      );
    }

    if (
      campaign.creator_id !==
      user.id
    ) {
      throw new Error(
        "You don't have permission to edit this campaign."
      );
    }

    /*
     * Update campaign details.
     *
     * Slug stays unchanged so the
     * public campaign URL remains
     * stable.
     */

    const {
      error: campaignError,
    } =
      await supabase
        .from("campaigns")
        .update({
          title:
            title.trim(),

          description:
            description.trim() ||
            null,

          updated_at:
            new Date().toISOString(),
        })
        .eq(
          "id",
          campaign.id
        )
        .eq(
          "creator_id",
          user.id
        );

    if (campaignError) {
      throw new Error(
        campaignError.message
      );
    }

    /*
     * Keep existing artwork unless
     * the creator selected a new one.
     */

    let assetUrl =
      template.asset_url;

    if (designFile) {
      const extension =
        designFile.name
          .split(".")
          .pop()
          ?.toLowerCase() ||
        "jpg";

      const uploadedPath = `${user.id}/${campaign.id}/design.${extension}`;

      const {
        error: uploadError,
      } =
        await supabase.storage
          .from(
            "campaign-assets"
          )
          .upload(
            uploadedPath,
            designFile,
            {
              cacheControl:
                "3600",

              upsert: true,

              contentType:
                designFile.type,
            }
          );

      if (uploadError) {
        throw new Error(
          uploadError.message
        );
      }

      const {
        data: {
          publicUrl,
        },
      } =
        supabase.storage
          .from(
            "campaign-assets"
          )
          .getPublicUrl(
            uploadedPath
          );

      assetUrl =
        publicUrl;
    }

    /*
     * Build the new layout.
     */

    const config =
      buildCanvasConfig();

    if (!config) {
      throw new Error(
        "Could not read the design layout."
      );
    }

    /*
     * Deactivate current template.
     */

    const {
      error: deactivateError,
    } =
      await supabase
        .from(
          "campaign_templates"
        )
        .update({
          is_active: false,
        })
        .eq(
          "campaign_id",
          campaign.id
        )
        .eq(
          "is_active",
          true
        );

    if (deactivateError) {
      throw new Error(
        deactivateError.message
      );
    }

    /*
     * Create a new version.
     */

    const nextVersion =
      (template.version ||
        0) + 1;

    const {
      error: templateError,
    } =
      await supabase
        .from(
          "campaign_templates"
        )
        .insert({
          campaign_id:
            campaign.id,

          name: `${title.trim()} Template`,

          asset_url:
            assetUrl,

          width:
            originalWidth,

          height:
            originalHeight,

          canvas_config:
            config as any,

          version:
            nextVersion,

          is_active: true,
        });

    if (templateError) {
      throw new Error(
        templateError.message
      );
    }

    router.push(
      `/events/${eventId}/campaigns/${campaign.id}`
    );
  }

  /*
   * ---------------------------------------------------------
   * SAVE
   * ---------------------------------------------------------
   */

  async function saveCampaign() {
    setError("");

    if (!title.trim()) {
      setError(
        "Enter a campaign name."
      );
      return;
    }

    if (!designUrl) {
      setError(
        "Upload a campaign design first."
      );
      return;
    }

    const canvas =
      fabricCanvas.current;

    if (!canvas) {
      setError(
        "Editor is not ready yet."
      );
      return;
    }

    const config =
      buildCanvasConfig();

    if (!config) {
      setError(
        "Could not read the design layout."
      );
      return;
    }

    if (!config.photo) {
      setError(
        "Add a Photo field before saving."
      );
      return;
    }

    if (!config.name) {
      setError(
        "Add a Name field before saving."
      );
      return;
    }

    setSaving(true);

    try {
      if (
        mode === "create"
      ) {
        await createCampaign();
      } else {
        await updateCampaign();
      }
    } catch (err: any) {
      console.error(
        "Save campaign error:",
        err
      );

      setError(
        err?.message ||
          "Something went wrong while saving."
      );
    } finally {
      setSaving(false);
    }
  }

  /*
   * ---------------------------------------------------------
   * CLEANUP LOCAL PREVIEW
   * ---------------------------------------------------------
   */

  useEffect(() => {
    return () => {
      if (
        localPreviewUrl.current
      ) {
        URL.revokeObjectURL(
          localPreviewUrl.current
        );

        localPreviewUrl.current =
          null;
      }
    };
  }, []);

  /*
   * ---------------------------------------------------------
   * LOADING
   * ---------------------------------------------------------
   */

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-neutral-50">
        <Loader2 className="h-6 w-6 animate-spin text-violet-600" />
      </main>
    );
  }

  /*
   * ---------------------------------------------------------
   * UI
   * ---------------------------------------------------------
   */

  const isEdit =
    mode === "edit";

  const backUrl = isEdit
    ? `/events/${eventId}/campaigns/${campaign?.id || ""}`
    : `/events/${eventId}`;

  return (
    <main className="min-h-screen bg-neutral-100">
      <div className="relative">
        <BuilderHeader 
          isEdit={isEdit} 
          backUrl={backUrl} 
          saveCampaign={saveCampaign} 
        />
        
        <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-[1600px] lg:grid-cols-[340px_1fr]">
          <BuilderSidebar
            isEdit={isEdit}
            handleDesignUpload={handleDesignUpload}
            removeDesign={removeDesign}
            addPhotoField={addPhotoField}
            addNameField={addNameField}
            deleteSelectedField={deleteSelectedField}
            applyPhotoShape={applyPhotoShape}
            centerSelectedField={centerSelectedField}
            updateNameField={updateNameField}
          />

          <section className="relative flex min-h-[calc(100vh-4rem)] flex-col overflow-hidden bg-neutral-100">
            <BuilderZoomControls changeZoom={changeZoom} />
            <BuilderCanvas 
              canvasElement={canvasElement} 
              handleDesignUpload={handleDesignUpload} 
            />
            
          </section>
        </div>
      </div>
    </main>
  );
}

/*
 * ---------------------------------------------------------
 * GET FIELD FROM A SPECIFIC CANVAS
 * ---------------------------------------------------------
 */

function getFieldFromCanvas(
  canvas: Canvas,
  type: FieldType
) {
  return canvas
    .getObjects()
    .find(
      (object: any) =>
        object?.data?.type ===
        type
    ) as
    | FieldObject
    | undefined;
}