import type {
  NamePosition,
  PhotoPosition,
} from "./types";
import {
  drawContain,
  loadImage,
  coverSize,
} from "./image";
import { assertCanvasIntegrity } from "./canvas-integrity";

type GenerateCampaignImageParams = {
  templateUrl: string;
  photoUrl: string;
  name: string;
  canvasWidth: number;
  canvasHeight: number;
  photoPosition: PhotoPosition;
  namePosition: NamePosition;
  nameHeightPct: number;
  zoom: number;
  offsetX: number;
  offsetY: number;
};

export async function generateCampaignImage({
  templateUrl,
  photoUrl,
  name,
  canvasWidth,
  canvasHeight,
  photoPosition,
  namePosition,
  nameHeightPct,
  zoom,
  offsetX,
  offsetY,
}: GenerateCampaignImageParams): Promise<string> {
  assertCanvasIntegrity(
    canvasWidth,
    canvasHeight,
    photoPosition,
    namePosition
  );

  const canvas = document.createElement("canvas");

  canvas.width = canvasWidth;
  canvas.height = canvasHeight;

  const ctx = canvas.getContext("2d", {
    alpha: true,
  });

  if (!ctx) {
    throw new Error(
      "Your browser could not prepare the image."
    );
  }

  ctx.clearRect(
    0,
    0,
    canvasWidth,
    canvasHeight
  );

  ctx.fillStyle = "#ffffff";

  ctx.fillRect(
    0,
    0,
    canvasWidth,
    canvasHeight
  );

  const design = await loadImage(templateUrl);

  drawContain(
    ctx,
    design,
    0,
    0,
    canvasWidth,
    canvasHeight
  );

  const attendeePhoto = await loadImage(photoUrl);

  const px =
    (photoPosition.left / 100) *
    canvasWidth;

  const py =
    (photoPosition.top / 100) *
    canvasHeight;

  const pw =
    (photoPosition.width / 100) *
    canvasWidth;

  const ph =
    (photoPosition.height / 100) *
    canvasHeight;

  const {
    width: drawW,
    height: drawH,
  } = coverSize(
    pw,
    ph,
    attendeePhoto.width,
    attendeePhoto.height,
    zoom
  );

  const drawX =
    px +
    (pw - drawW) / 2 +
    offsetX * pw;

  const drawY =
    py +
    (ph - drawH) / 2 +
    offsetY * ph;

  ctx.save();

  if (photoPosition.angle) {
    const centerX = px + pw / 2;
    const centerY = py + ph / 2;

    ctx.translate(centerX, centerY);

    ctx.rotate(
      (photoPosition.angle * Math.PI) /
        180
    );

    ctx.translate(-centerX, -centerY);
  }

  ctx.beginPath();

  if (photoPosition.shape === "circle") {
    ctx.ellipse(
      px + pw / 2,
      py + ph / 2,
      pw / 2,
      ph / 2,
      0,
      0,
      Math.PI * 2
    );
  } else {
    ctx.rect(px, py, pw, ph);
  }

  ctx.clip();

  ctx.drawImage(
    attendeePhoto,
    drawX,
    drawY,
    drawW,
    drawH
  );

  ctx.restore();

  const nx =
    (namePosition.left / 100) *
    canvasWidth;

  const ny =
    (namePosition.top / 100) *
    canvasHeight;

  const nw =
    (namePosition.width / 100) *
    canvasWidth;

  const nh =
    (nameHeightPct / 100) *
    canvasHeight;

  ctx.save();

  if (namePosition.angle) {
    const centerX = nx + nw / 2;
    const centerY = ny + nh / 2;

    ctx.translate(centerX, centerY);

    ctx.rotate(
      (namePosition.angle * Math.PI) /
        180
    );

    ctx.translate(-centerX, -centerY);
  }

  const textAlign =
    namePosition.textAlign === "left"
      ? "left"
      : namePosition.textAlign === "right"
        ? "right"
        : "center";

  ctx.textAlign = textAlign;
  ctx.textBaseline = "middle";
  ctx.fillStyle = namePosition.color;

  let fontSize = Math.max(
    10,
    namePosition.fontSize
  );

  const text = name.trim();

  ctx.font = `${namePosition.fontWeight} ${fontSize}px ${namePosition.fontFamily}, Arial, sans-serif`;

  let textWidth =
    ctx.measureText(text).width;

  while (
    textWidth > nw &&
    fontSize > 10
  ) {
    fontSize -= 1;

    ctx.font = `${namePosition.fontWeight} ${fontSize}px ${namePosition.fontFamily}, Arial, sans-serif`;

    textWidth =
      ctx.measureText(text).width;
  }

  let textX = nx + nw / 2;

  if (textAlign === "left") {
    textX = nx;
  }

  if (textAlign === "right") {
    textX = nx + nw;
  }

  ctx.fillText(
    text,
    textX,
    ny + nh / 2
  );

  ctx.restore();

  try {
    return canvas.toDataURL(
      "image/png",
      1
    );
  } catch (error) {
    console.error(
      "Canvas export failed:",
      error
    );

    throw new Error(
      "The campaign design could not be exported. Please refresh the page and try again."
    );
  }
}