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

      {/* HEADER */}

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

      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-[1600px] lg:grid-cols-[340px_1fr]">

        {/* SIDEBAR */}

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

        {/* EDITOR */}

        <section className="relative flex min-h-[calc(100vh-4rem)] flex-col overflow-hidden bg-neutral-100">

          {/* ZOOM */}

          {designUrl && (
            <div className="absolute left-1/2 top-4 z-20 flex -translate-x-1/2 items-center gap-1 rounded-xl border border-neutral-200 bg-white p-1.5 shadow-lg">

              <button
                type="button"
                onClick={() =>
                  changeZoom(-0.1)
                }
                className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-900"
                title="Zoom out"
              >
                <ZoomOut className="h-4 w-4" />
              </button>

              <span className="min-w-[48px] text-center text-xs font-semibold text-neutral-600">
                {Math.round(
                  zoom * 100
                )}
                %
              </span>

              <button
                type="button"
                onClick={() =>
                  changeZoom(0.1)
                }
                className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-900"
                title="Zoom in"
              >
                <ZoomIn className="h-4 w-4" />
              </button>

              <div className="mx-1 h-5 w-px bg-neutral-200" />

              <button
                type="button"
                onClick={() =>
                  setZoom(1)
                }
                className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-900"
              >
                Fit
              </button>

            </div>
          )}

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

        </section>
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