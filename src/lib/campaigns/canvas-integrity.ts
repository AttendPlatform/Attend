import type { NamePosition, PhotoPosition } from "./types";
import { DEFAULT_ADJUSTMENT, type PhotoAdjustment } from "./image";

export const MIN_CANVAS_DIMENSION = 100;
export const MAX_CANVAS_DIMENSION = 8192;
export const DEFAULT_CANVAS_DIMENSION = 1080;

export const MIN_ZOOM = 1;
export const MAX_ZOOM = 5;

export interface CanvasDimensionValidation {
  width: number;
  height: number;
  isValid: boolean;
  error?: string;
}

export function validateCanvasDimensions(
  width: unknown,
  height: unknown
): CanvasDimensionValidation {
  const numWidth = typeof width === "number" ? width : Number(width);
  const numHeight = typeof height === "number" ? height : Number(height);

  if (!Number.isFinite(numWidth) || !Number.isFinite(numHeight)) {
    return {
      width: DEFAULT_CANVAS_DIMENSION,
      height: DEFAULT_CANVAS_DIMENSION,
      isValid: false,
      error: "Canvas dimensions must be finite numbers.",
    };
  }

  if (numWidth < MIN_CANVAS_DIMENSION || numHeight < MIN_CANVAS_DIMENSION) {
    return {
      width: Math.max(MIN_CANVAS_DIMENSION, Math.round(numWidth)),
      height: Math.max(MIN_CANVAS_DIMENSION, Math.round(numHeight)),
      isValid: false,
      error: `Canvas dimensions must be at least ${MIN_CANVAS_DIMENSION}px.`,
    };
  }

  if (numWidth > MAX_CANVAS_DIMENSION || numHeight > MAX_CANVAS_DIMENSION) {
    return {
      width: Math.min(MAX_CANVAS_DIMENSION, Math.round(numWidth)),
      height: Math.min(MAX_CANVAS_DIMENSION, Math.round(numHeight)),
      isValid: false,
      error: `Canvas dimensions exceed maximum limit of ${MAX_CANVAS_DIMENSION}px.`,
    };
  }

  return {
    width: Math.round(numWidth),
    height: Math.round(numHeight),
    isValid: true,
  };
}

export function validatePhotoAdjustment(
  adjustment: unknown
): PhotoAdjustment {
  if (!adjustment || typeof adjustment !== "object") {
    return { ...DEFAULT_ADJUSTMENT };
  }

  const candidate = adjustment as Record<string, unknown>;

  const rawZoom = Number(candidate.zoom);
  const rawOffsetX = Number(candidate.offsetX);
  const rawOffsetY = Number(candidate.offsetY);

  const zoom = Number.isFinite(rawZoom)
    ? Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, rawZoom))
    : DEFAULT_ADJUSTMENT.zoom;

  const offsetX = Number.isFinite(rawOffsetX)
    ? Math.min(5, Math.max(-5, rawOffsetX))
    : DEFAULT_ADJUSTMENT.offsetX;

  const offsetY = Number.isFinite(rawOffsetY)
    ? Math.min(5, Math.max(-5, rawOffsetY))
    : DEFAULT_ADJUSTMENT.offsetY;

  return { zoom, offsetX, offsetY };
}

export function validatePhotoPosition(
  position: unknown
): { isValid: boolean; error?: string; normalized?: PhotoPosition } {
  if (!position || typeof position !== "object") {
    return { isValid: false, error: "Photo position configuration missing." };
  }

  const p = position as Record<string, unknown>;
  const left = Number(p.left);
  const top = Number(p.top);
  const width = Number(p.width);
  const height = Number(p.height);
  const angle = Number(p.angle ?? 0);
  const shape = p.shape === "circle" ? "circle" : "rectangle";

  if (![left, top, width, height].every(Number.isFinite)) {
    return { isValid: false, error: "Photo metrics must be finite numbers." };
  }

  if (width <= 0 || width > 100 || height <= 0 || height > 100) {
    return { isValid: false, error: "Photo width and height must be between 1% and 100%." };
  }

  if (left < 0 || left > 100 || top < 0 || top > 100) {
    return { isValid: false, error: "Photo coordinates must be between 0% and 100%." };
  }

  return {
    isValid: true,
    normalized: {
      left,
      top,
      width,
      height,
      angle: Number.isFinite(angle) ? angle % 360 : 0,
      shape,
    },
  };
}

export function validateNamePosition(
  position: unknown
): { isValid: boolean; error?: string; normalized?: NamePosition } {
  if (!position || typeof position !== "object") {
    return { isValid: false, error: "Name position configuration missing." };
  }

  const n = position as Record<string, unknown>;
  const left = Number(n.left);
  const top = Number(n.top);
  const width = Number(n.width);
  const fontSize = Number(n.fontSize);
  const angle = Number(n.angle ?? 0);

  if (![left, top, width, fontSize].every(Number.isFinite)) {
    return { isValid: false, error: "Name metrics must be finite numbers." };
  }

  if (width <= 0 || width > 100) {
    return { isValid: false, error: "Name container width must be between 1% and 100%." };
  }

  if (fontSize < 8 || fontSize > 300) {
    return { isValid: false, error: "Font size must be between 8px and 300px." };
  }

  const textAlign =
    n.textAlign === "left" || n.textAlign === "right"
      ? n.textAlign
      : "center";

  const color =
    typeof n.color === "string" && n.color.trim()
      ? n.color.trim()
      : "#000000";

  const fontFamily =
    typeof n.fontFamily === "string" && n.fontFamily.trim()
      ? n.fontFamily.trim()
      : "Inter";

  const fontWeight =
    n.fontWeight === "bold" || n.fontWeight === "700" || n.fontWeight === 700
      ? "bold"
      : "normal";

  return {
    isValid: true,
    normalized: {
      left,
      top,
      width,
      fontSize,
      fontFamily,
      fontWeight,
      textAlign,
      color,
      angle: Number.isFinite(angle) ? angle % 360 : 0,
    },
  };
}

export function assertCanvasIntegrity(
  canvasWidth: number,
  canvasHeight: number,
  photoPosition: PhotoPosition,
  namePosition: NamePosition
): void {
  const dim = validateCanvasDimensions(canvasWidth, canvasHeight);
  if (!dim.isValid) {
    throw new Error(`Canvas integrity error: ${dim.error}`);
  }

  const photoCheck = validatePhotoPosition(photoPosition);
  if (!photoCheck.isValid) {
    throw new Error(`Photo position integrity error: ${photoCheck.error}`);
  }

  const nameCheck = validateNamePosition(namePosition);
  if (!nameCheck.isValid) {
    throw new Error(`Name position integrity error: ${nameCheck.error}`);
  }
}
