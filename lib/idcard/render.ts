"use client";

// Programmatic canvas renderer for the HHGOA official ID card.
// Everything is drawn in code (no image assets) so the preview, the download
// and the generated card are always in lock-step. Mirrors the design tokens in
// lib/theme.ts and the field layout of the IdForm.

import { COLORS, FONT_DISPLAY, FONT_LABEL } from "@/lib/theme";
import type { IdCardStatus } from "./model";
import { ensureFonts } from "@/lib/imageUtils";

export const CARD_W = 1050;
export const CARD_H = 675;

// Numbered-edition seat badge — every card renders "#143 / 247" (fixed seat).
// TODO: confirm real total seat count for HH Goa 2026
export const SEAT_NUMBER = 143;
export const TOTAL_SEATS = 247;

export type CropRect = { x: number; y: number; width: number; height: number };

export type RenderInput = {
  fullName: string;
  idTypeLabel: string;
  institution: string;
  department?: string;
  program?: string;
  rollNumber?: string;
  campus?: string;
  cardNumber: string;
  photo?: HTMLImageElement | null;
  crop?: CropRect | null;
  issuedAt?: string;
  validUntil?: string;
  status?: IdCardStatus;
  email?: string;
};

const STATUS_COLOR: Record<IdCardStatus, string> = {
  active: "#0B6E4F",
  expired: "#B45309",
  revoked: "#B91C1C",
};

function fitCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  crop?: CropRect | null
) {
  const iw = img.naturalWidth;
  const ih = img.naturalHeight;
  let sx = 0;
  let sy = 0;
  let sw = iw;
  let sh = ih;
  if (crop) {
    sw = Math.min(crop.width, iw);
    sh = Math.min(crop.height, ih);
    sx = Math.max(0, Math.min(crop.x, iw - sw));
    sy = Math.max(0, Math.min(crop.y, ih - sh));
  }
  const scale = Math.max(w / sw, h / sh);
  const dw = sw * scale;
  const dh = sh * scale;
  ctx.save();
  ctx.beginPath();
  roundRectPath(ctx, x, y, w, h, r);
  ctx.clip();
  ctx.drawImage(img, sx, sy, sw, sh, x - (dw - w) / 2, y - (dh - h) / 2, dw, dh);
  ctx.restore();
}

function roundRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function rounded(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  roundRectPath(ctx, x, y, w, h, r);
}

/** Deterministic hash → an (x,width) pseudo-barcode pattern for a card number. */
function drawBarcode(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, w: number, h: number) {
  let seed = 0;
  for (let i = 0; i < text.length; i++) seed = (seed * 31 + text.charCodeAt(i)) >>> 0;
  ctx.fillStyle = COLORS.ink;
  const bars = 34;
  const step = w / bars;
  let px = x;
  for (let i = 0; i < bars; i++) {
    seed = (seed * 1103515245 + 12345) >>> 0;
    const bw = 1 + ((seed >>> 8) % 3) * (step * 0.35);
    if (i % 2 === 1) ctx.fillRect(px, y, bw, h);
    px += step;
  }
}

/**
 * Numbered-edition ticket stub pill: white rounded pill, gold border, dashed
 * pink perforation, "SEAT" left + "#143 / 247" right, with punched notches.
 */
function drawSeatStub(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  seat: number,
  total = TOTAL_SEATS
) {
  const h = 42;
  const label = "SEAT";
  const text = `#${seat} / ${total}`;
  ctx.save();
  ctx.font = `700 16px ${FONT_LABEL}`;
  const labelW = ctx.measureText(label).width;
  ctx.font = `700 20px ${FONT_LABEL}`;
  const textW = ctx.measureText(text).width;
  const w = Math.round(labelW + textW + 74);
  const perfX = x + 26 + labelW + 10;

  // pill body
  rounded(ctx, x, y, w, h, h / 2);
  ctx.fillStyle = "#FFFFFF";
  ctx.fill();
  ctx.strokeStyle = COLORS.gold;
  ctx.lineWidth = 2;
  ctx.stroke();

  // perforation + notches
  ctx.strokeStyle = COLORS.punch;
  ctx.lineWidth = 2;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(perfX, y + 6);
  ctx.lineTo(perfX, y + h - 6);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = "#F6EFE0";
  ctx.beginPath();
  ctx.arc(perfX, y + 6, 4, 0, Math.PI * 2);
  ctx.arc(perfX, y + h - 6, 4, 0, Math.PI * 2);
  ctx.fill();

  // labels
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillStyle = COLORS.goldDark;
  ctx.font = `700 16px ${FONT_LABEL}`;
  ctx.fillText(label, x + 14, y + h / 2);
  ctx.fillStyle = COLORS.punch;
  ctx.font = `700 20px ${FONT_LABEL}`;
  ctx.fillText(text, perfX + 12, y + h / 2);

  ctx.restore();
}

function fmt(s?: string) {
  if (!s) return "—";
  const d = new Date(`${s}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return s;
  return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(d);
}

/** Draw the card into a fresh canvas sized CARD_W×CARD_H. */
export function drawIdCard(input: RenderInput): HTMLCanvasElement {
  void ensureFonts();
  const canvas = document.createElement("canvas");
  canvas.width = CARD_W;
  canvas.height = CARD_H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("no-2d-context");
  renderCard(ctx, input);
  return canvas;
}

/** Render the card onto an existing 1050×675 context. */
export function renderCard(ctx: CanvasRenderingContext2D, input: RenderInput) {
  const W = CARD_W;
  const H = CARD_H;

  // --- Paper background ---
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, COLORS.cream);
  bg.addColorStop(1, COLORS.creamDark);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = "rgba(11,61,46,0.08)";
  ctx.lineWidth = 8;
  ctx.strokeRect(4, 4, W - 8, H - 8);

  // --- Left brand band ---
  const band = ctx.createLinearGradient(0, 0, 340, H);
  band.addColorStop(0, COLORS.forest);
  band.addColorStop(1, COLORS.forestDeep);
  ctx.fillStyle = band;
  rounded(ctx, 0, 0, 340, H, 0);
  ctx.fill();

  // brand wordmark
  ctx.fillStyle = COLORS.gold;
  ctx.font = `62px ${FONT_DISPLAY}`;
  ctx.fillText("HHGOA", 40, 78);
  ctx.fillStyle = COLORS.teal;
  ctx.font = `700 30px ${FONT_LABEL}`;
  ctx.fillText("ID CARD CONNECT", 42, 112);

  // photo frame
  const photoX = 70;
  const photoY = 150;
  const photoW = 200;
  const photoH = 240;
  ctx.fillStyle = COLORS.cream;
  rounded(ctx, photoX, photoY, photoW, photoH, 14);
  ctx.fill();
  if (input.photo) {
    fitCover(ctx, input.photo, photoX, photoY, photoW, photoH, 14, input.crop);
  } else {
    const initials = input.fullName
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((s) => s[0]?.toUpperCase() ?? "")
      .join("");
    ctx.fillStyle = COLORS.punch;
    ctx.font = `${Math.round(photoW * 0.24)}px ${FONT_DISPLAY}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(initials || "?", photoX + photoW / 2, photoY + photoH / 2);
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
  }

  // holo chip
  const holo = ctx.createLinearGradient(photoX, photoY + photoH + 16, photoX + photoW, photoY + photoH + 16);
  holo.addColorStop(0, COLORS.punch);
  holo.addColorStop(0.5, COLORS.gold);
  holo.addColorStop(1, COLORS.teal);
  ctx.fillStyle = holo;
  rounded(ctx, photoX, photoY + photoH + 16, photoW, 18, 9);
  ctx.fill();

  // validity
  const validityY = 470;
  ctx.fillStyle = "rgba(246,239,224,0.85)";
  ctx.font = `700 22px ${FONT_LABEL}`;
  ctx.fillText("VALID TILL", 42, validityY);
  ctx.fillStyle = COLORS.cream;
  ctx.font = `700 34px ${FONT_LABEL}`;
  ctx.fillText(fmt(input.validUntil), 42, validityY + 40);

  // status badge
  const status = input.status ?? "active";
  ctx.fillStyle = STATUS_COLOR[status];
  rounded(ctx, 42, validityY + 64, 168, 46, 23);
  ctx.fill();
  ctx.fillStyle = "#FFFFFF";
  ctx.font = `700 26px ${FONT_LABEL}`;
  ctx.fillText(status.toUpperCase(), 126, validityY + 94);

  // bottom stamp
  ctx.font = `700 22px ${FONT_LABEL}`;
  ctx.fillStyle = COLORS.gold;
  ctx.textAlign = "center";
  ctx.fillText("CHECK * HHGOA", 170, 604);
  ctx.textAlign = "left";

  // --- Right content ---
  const dataX = 380;
  const col = COLORS.ink;

  // card number top right
  ctx.font = `700 30px ${FONT_LABEL}`;
  ctx.fillStyle = COLORS.forestLight;
  ctx.fillText(input.cardNumber.toUpperCase(), dataX, 66);

  // hr
  ctx.strokeStyle = "rgba(27,42,35,0.25)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(dataX, 92);
  ctx.lineTo(W - 40, 92);
  ctx.stroke();

  // name
  ctx.fillStyle = col;
  ctx.font = `400 72px ${FONT_DISPLAY}`;
  const name = input.fullName || "Card Holder";
  let nameStr = name;
  while (nameStr.length > 2 && ctx.measureText(nameStr).width > dataX + 300) {
    nameStr = nameStr.slice(0, -1);
  }
  ctx.fillText(nameStr, dataX, 178);

  // id type badge
  const badge = input.idTypeLabel.toUpperCase();
  ctx.font = `700 26px ${FONT_LABEL}`;
  const bw = Math.min(220, ctx.measureText(badge).width + 40);
  ctx.fillStyle = status === "active" ? STATUS_COLOR.active : COLORS.punchDark;
  rounded(ctx, dataX, 200, bw, 44, 22);
  ctx.fill();
  ctx.fillStyle = "#FFFFFF";
  ctx.fillText(badge, dataX + 24, 230);

  // institution
  ctx.font = `700 30px ${FONT_LABEL}`;
  ctx.fillStyle = col;
  ctx.fillText((input.institution || "—").toUpperCase().slice(0, 46), dataX, 304);

  // detail rows — ROLL NO removed; the SEAT stub fills its old cell
  const rows: [string, string][] = [
    ["DEPARTMENT", input.department ?? "—"],
    ["PROGRAM", input.program ?? "—"],
    ["CAMPUS", input.campus ?? "—"],
  ];
  ctx.font = `700 22px ${FONT_LABEL}`;
  const cellW = (W - dataX - 40) / 2;
  rows.forEach(([k, v], i) => {
    const rx = dataX + (i % 2) * cellW;
    const ry = 356 + Math.floor(i / 2) * 62;
    ctx.fillStyle = COLORS.forestLight;
    ctx.fillText(k, rx, ry);
    ctx.fillStyle = col;
    ctx.font = `400 28px ${FONT_LABEL}`;
    const val = v.length > 24 ? `${v.slice(0, 23)}…` : v;
    ctx.fillText(val || "—", rx, ry + 30);
    ctx.font = `700 22px ${FONT_LABEL}`;
  });

  // SEAT — numbered-edition ticket stub (row 2, col 2)
  drawSeatStub(ctx, dataX + cellW, 418, SEAT_NUMBER);

  // barcode footer (pulled up now that the signature row is gone)
  drawBarcode(ctx, input.cardNumber, W - 330, 480, 280, 72);
  ctx.font = `700 22px ${FONT_LABEL}`;
  ctx.fillStyle = COLORS.forestLight;
  ctx.fillText("VERIFY AT hhgoa.dev/" + input.cardNumber.toUpperCase().replace(/[^A-Z0-9-]/g, ""), dataX, 572);
}