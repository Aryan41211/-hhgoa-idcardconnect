// Client-only canvas compositor. Composites the user's cropped photo + text
// into the provided HH Goa 2026 reference templates (solo card / squad frame),
// and draws the Format-A PFP frame programmatically. Pipeline:
// downscale photo -> react-easy-crop -> render() -> canvas.toBlob(png).

import {
  COLORS, SIZE, HASHTAG, FONT_DISPLAY, FONT_LABEL, FONT_SCRIPT, TEMPLATES,
  roundedRect, drawStar, drawDottedPath, drawPalm, drawStamp, drawWashiTape,
} from "./theme";

export type CropRect = { x: number; y: number; width: number; height: number };
export type PhotoInput = { img: HTMLImageElement | null; crop?: CropRect | null };
export type FrameOptions = { photo: PhotoInput };
export type CardOptions = {
  photo: PhotoInput;
  name: string;
  stack: string;
  title: string;
  id: string;
  template: HTMLImageElement; // public/templates/solo.png
};
export type SquadOptions = {
  photos: PhotoInput[];
  names: string[];
  stacks?: string[];
  team?: string;
  teamClass?: string;
  teamTagline?: string;
  template: HTMLImageElement; // public/templates/squad.png
};

function drawPhoto(ctx: CanvasRenderingContext2D, photo: PhotoInput, slot: { x: number; y: number; w: number; h: number }, radius = 0) {
  ctx.save();
  roundedRect(ctx, slot.x, slot.y, slot.w, slot.h, radius);
  ctx.clip();
  if (!photo.img) {
    const g = ctx.createLinearGradient(slot.x, slot.y, slot.x + slot.w, slot.y + slot.h);
    g.addColorStop(0, COLORS.punch);
    g.addColorStop(1, COLORS.teal);
    ctx.fillStyle = g;
    ctx.fillRect(slot.x, slot.y, slot.w, slot.h);
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.font = `${Math.round(slot.w * 0.06)}px ${FONT_LABEL}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("YOUR PHOTO", slot.x + slot.w / 2, slot.y + slot.h / 2);
    ctx.restore();
    return;
  }
  const img = photo.img;
  const iw = img.naturalWidth;
  const ih = img.naturalHeight;
  if (photo.crop) {
    const c = photo.crop;
    const sw = Math.min(c.width, iw);
    const sh = Math.min(c.height, ih);
    const sx = Math.max(0, Math.min(c.x, iw - sw));
    const sy = Math.max(0, Math.min(c.y, ih - sh));
    ctx.drawImage(img, sx, sy, sw, sh, slot.x, slot.y, slot.w, slot.h);
  } else {
    const scale = Math.max(slot.w / iw, slot.h / ih);
    const dw = iw * scale;
    const dh = ih * scale;
    ctx.drawImage(img, slot.x + (slot.w - dw) / 2, slot.y + (slot.h - dh) / 2, dw, dh);
  }
  ctx.restore();
}

function bgGradient(ctx: CanvasRenderingContext2D, w: number, h: number, from: string, to: string) {
  const g = ctx.createLinearGradient(0, 0, w, h);
  g.addColorStop(0, from);
  g.addColorStop(1, to);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}

function brandHeader(ctx: CanvasRenderingContext2D, cx: number, y: number, scale: number, yearOnly = false) {
  ctx.save();
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  if (!yearOnly) {
    ctx.fillStyle = COLORS.gold;
    ctx.font = `${Math.round(150 * scale)}px ${FONT_DISPLAY}`;
    ctx.fillText("HH GOA", cx, y);
    ctx.fillStyle = COLORS.cream;
    ctx.font = `${Math.round(48 * scale)}px ${FONT_LABEL}`;
    ctx.fillText("2 0 2 6   ·   GOA, INDIA", cx, y + 62 * scale);
  } else {
    ctx.fillStyle = COLORS.gold;
    ctx.font = `${Math.round(96 * scale)}px ${FONT_DISPLAY}`;
    ctx.fillText("2026", cx, y);
  }
  ctx.restore();
}

function corners(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, s: number, color: string, lw = 10) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = lw;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(x, y + s); ctx.lineTo(x, y); ctx.lineTo(x + s, y);
  ctx.moveTo(x + w - s, y); ctx.lineTo(x + w, y); ctx.lineTo(x + w, y + s);
  ctx.moveTo(x + w, y + h - s); ctx.lineTo(x + w, y + h); ctx.lineTo(x + w - s, y + h);
  ctx.moveTo(x + s, y + h); ctx.lineTo(x, y + h); ctx.lineTo(x, y + h - s);
  ctx.stroke();
  ctx.restore();
}

function hashtagChip(ctx: CanvasRenderingContext2D, x: number, y: number, scale = 1, color = COLORS.punch) {
  ctx.save();
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillStyle = color;
  const tw = ctx.measureText(HASHTAG).width;
  const w = tw + 44 * scale;
  const h = 62 * scale;
  roundedRect(ctx, x, y - h / 2, w, h, h / 2);
  ctx.fill();
  ctx.fillStyle = COLORS.white;
  ctx.font = `700 ${34 * scale}px ${FONT_LABEL}`;
  ctx.fillText(HASHTAG, x + 22 * scale, y);
  ctx.restore();
}

function scatterDecorations(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.save();
  drawStar(ctx, w * 0.08, h * 0.12, 5, 22, 9, COLORS.gold);
  drawStar(ctx, w * 0.92, h * 0.26, 5, 16, 7, COLORS.punch);
  drawStar(ctx, w * 0.85, h * 0.08, 5, 11, 5, COLORS.cream);
  drawStar(ctx, w * 0.15, h * 0.9, 5, 13, 6, COLORS.teal);
  drawDottedPath(ctx, [[w * 0.1, h * 0.3], [w * 0.2, h * 0.42], [w * 0.16, h * 0.55]], COLORS.gold, 6);
  drawPalm(ctx, w * 0.07, h * 0.8, 120, COLORS.gold);
  ctx.restore();
}

// Format A — PFP Frame (1080 x 1080) ---------------------------------------
export function renderFrame(ctx: CanvasRenderingContext2D, opts: FrameOptions) {
  const { w, h } = SIZE.frame;
  bgGradient(ctx, w, h, COLORS.forestDeep, COLORS.forest);

  const slot = { x: 170, y: 330, w: 740, h: 740 };
  drawPhoto(ctx, opts.photo, slot, 22);

  ctx.save();
  ctx.strokeStyle = COLORS.gold;
  ctx.lineWidth = 10;
  roundedRect(ctx, slot.x - 14, slot.y - 14, slot.w + 28, slot.h + 28, 28);
  ctx.stroke();
  ctx.restore();

  corners(ctx, 46, 46, w - 92, h - 92, 55, COLORS.punch, 12);
  drawWashiTape(ctx, slot.x + 40, slot.y + 40, 150, 54, -0.18, COLORS.punch);
  drawWashiTape(ctx, slot.x + slot.w - 40, slot.y + slot.h - 40, 150, 54, 0.16, COLORS.gold);
  scatterDecorations(ctx, w, h);
  drawStamp(ctx, w - 118, 168, 72, COLORS.gold, COLORS.gold);
  brandHeader(ctx, w / 2, 200, 0.86);
  hashtagChip(ctx, slot.x, h - 78, 0.9);
}


// Format B — Builder ID Card (from the provided `solo` template) -------------
const CARD_INK = "#16351F"; // template body-text green
const CARD_PINK = "#E3265B"; // template pink accent

export function renderCard(ctx: CanvasRenderingContext2D, opts: CardOptions) {
  const T = TEMPLATES.solo;
  const o = ctx.canvas.width / T.w; // scale so any canvas size works (2x typically)
  ctx.save();
  ctx.scale(o, o);

  // 1) template background (photo placeholder gradient + smiley + torn-paper card)
  ctx.drawImage(opts.template, 0, 0, T.w, T.h);

  // 2) user photo into the slot — expand a few px so no placeholder edge peeks
  const slot = { x: T.slot.x - 6, y: T.slot.y - 2, w: T.slot.w + 12, h: T.slot.h + 5 };
  drawPhoto(ctx, opts.photo, slot, 0);

  // 3) name + role (+ builder title) in the reserved blank cream area (x>265)
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";

  // NAME — big condensed display, auto-shrink to fit the blank width
  const name = (opts.name || "BUILDER").toUpperCase();
  let nameSize = 50;
  ctx.font = `400 ${nameSize}px ${FONT_DISPLAY}`;
  while (ctx.measureText(name).width > 340 && nameSize > 26) {
    nameSize -= 4;
    ctx.font = `400 ${nameSize}px ${FONT_DISPLAY}`;
  }
  ctx.fillStyle = CARD_INK;
  ctx.fillText(name, 268, 452);

  // thin pink rule under the name
  ctx.fillStyle = CARD_PINK;
  ctx.fillRect(268, 464, Math.min(ctx.measureText(name).width, 340), 5);

  // ROLE — mono bold, dark ink
  const role = (opts.stack || "YOUR ROLE").toUpperCase();
  ctx.font = `700 26px ${FONT_LABEL}`;
  ctx.fillStyle = CARD_INK;
  ctx.fillText(role, 268, 498);

  // BUILDER TITLE — small pink tag, the differentiator
  ctx.font = `700 20px ${FONT_LABEL}`;
  ctx.fillStyle = CARD_PINK;
  ctx.fillText("★ " + (opts.title || "THE BUILDER WHO SHIPS"), 268, 522);

  ctx.restore();
}

// Squad — from the provided `squad` template (3 top slots; the bottom band is
// redrawn in code so team class / tagline / #FRAMEINGOA reflow with no gap) -----
function drawBandBg(ctx: CanvasRenderingContext2D, band: { y: number; h: number }, w: number) {
  const g = ctx.createLinearGradient(0, band.y, 0, band.y + band.h);
  g.addColorStop(0, "#05281A"); // matches the dark template greens (#01230F area)
  g.addColorStop(1, "#01210F");
  ctx.fillStyle = g;
  ctx.fillRect(0, band.y, w, band.h);
}

// TEAM CLASS / TEAM TAGLINE — cream torn-paper-style sticker card with a washi
// tape corner, mono label + condensed display value (auto-shrunk to fit).
function teamCard(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  label: string,
  value: string,
  angle: number,
  tapeColor: string
) {
  ctx.save();
  ctx.translate(x + w / 2, y + h / 2);
  ctx.rotate(angle);
  ctx.translate(-w / 2, -h / 2);

  // torn-paper body
  roundedRect(ctx, 0, 0, w, h, 18);
  ctx.fillStyle = COLORS.cream;
  ctx.fill();
  ctx.strokeStyle = "rgba(27,42,35,0.14)";
  ctx.lineWidth = 3;
  ctx.stroke();

  drawWashiTape(ctx, 20, 18, 110, 40, -0.22, tapeColor);
  drawStar(ctx, w - 26, 34, 5, 12, 5, COLORS.gold, 0.3);

  // label
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = COLORS.goldDark;
  ctx.font = `700 18px ${FONT_LABEL}`;
  ctx.fillText(label, 28, 52);

  // value — condensed display, shrink to fit the card width
  ctx.fillStyle = COLORS.ink;
  const maxW = w - 56;
  let size = 44;
  ctx.font = `400 ${size}px ${FONT_DISPLAY}`;
  while (ctx.measureText(value).width > maxW && size > 20) {
    size -= 2;
    ctx.font = `400 ${size}px ${FONT_DISPLAY}`;
  }
  ctx.fillText(value, 28, 88);

  ctx.restore();
}

// STACK TAG — gold sticker tag with a concave V-notch cut into its right edge
// (like a punched shipping label), clearly distinct from the pink name pill.
// An empty stack renders a dashed cream outline placeholder instead.
function notchedTagPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  depth: number
) {
  ctx.beginPath();
  ctx.moveTo(x + 7, y);
  ctx.lineTo(x + w - 7, y);
  ctx.arcTo(x + w, y, x + w, y + 7, 7);
  ctx.lineTo(x + w, y + h / 2 - 4);
  ctx.lineTo(x + w - depth, y + h / 2);
  ctx.lineTo(x + w, y + h / 2 + 4);
  ctx.lineTo(x + w, y + h - 7);
  ctx.arcTo(x + w, y + h, x + w - 7, y + h, 7);
  ctx.lineTo(x + 7, y + h);
  ctx.arcTo(x, y + h, x, y + h - 7, 7);
  ctx.lineTo(x, y + 7);
  ctx.arcTo(x, y, x + w, y, 7);
  ctx.closePath();
}

function stackTag(
  ctx: CanvasRenderingContext2D,
  cx: number,
  y: number,
  maxW: number,
  stack?: string
) {
  const h = 30;
  const depth = 9;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `700 16px ${FONT_LABEL}`;
  if (!stack) {
    const w = ctx.measureText("STACK").width + 30;
    const x = cx - w / 2;
    ctx.save();
    ctx.strokeStyle = COLORS.cream;
    ctx.lineWidth = 2.5;
    ctx.setLineDash([6, 6]);
    notchedTagPath(ctx, x, y, w, h, depth);
    ctx.stroke();
    ctx.restore();
    ctx.fillStyle = COLORS.creamDark;
    ctx.fillText("STACK", cx, y + h / 2 + 1);
    return;
  }
  const label = stack.toUpperCase();
  const w = Math.min(Math.max(ctx.measureText(label).width + 40, 84), maxW);
  const x = cx - w / 2;
  ctx.save();
  ctx.fillStyle = COLORS.gold;
  notchedTagPath(ctx, x, y, w, h, depth);
  ctx.fill();
  ctx.restore();
  // punched hole (reads as a hole against the dark band) + label
  ctx.beginPath();
  ctx.arc(x + 15, y + h / 2, 3.5, 0, Math.PI * 2);
  ctx.fillStyle = COLORS.ink;
  ctx.fill();
  ctx.fillStyle = COLORS.ink;
  ctx.fillText(label, x + w / 2 + 4, y + h / 2 + 1);
}

export function renderSquad(ctx: CanvasRenderingContext2D, opts: SquadOptions) {
  const T = TEMPLATES.squad;
  const o = ctx.canvas.width / T.w;
  ctx.save();
  ctx.scale(o, o);

  // 1) template background
  ctx.drawImage(opts.template, 0, 0, T.w, T.h);

  // 2) photos into the 3 top slots (expand slightly so smiley is fully covered)
  T.slots.forEach((s, i) => {
    const slot = { x: s.x - 3, y: s.y - 3, w: s.w + 6, h: s.h + 6 };
    drawPhoto(ctx, opts.photos[i] ?? { img: null }, slot, 0);
  });

  // 3) redraw the bottom band: covers the baked 4th slot + torn-paper blocks +
  //    #FRAMEINGOA chip, then reflows TEAM CLASS / TEAM TAGLINE / stacks / chip
  drawBandBg(ctx, T.band, T.w);

  // team class + team tagline sticker cards
  teamCard(ctx, T.teamClass.x, T.teamClass.y, T.teamClass.w, T.teamClass.h, "TEAM CLASS",
    (opts.teamClass || "YOUR TEAM NAME").toUpperCase(), -0.02, COLORS.punch);
  teamCard(ctx, T.teamTagline.x, T.teamTagline.y, T.teamTagline.w, T.teamTagline.h, "TEAM TAGLINE",
    (opts.teamTagline || "BUILD · SHIP · REPEAT").toUpperCase(), 0.02, COLORS.gold);

  // #FRAMEINGOA chip, pinned bottom-right corner, clear of the tagline card
  hashtagChip(ctx, T.chip.x, T.chip.y, 0.5, COLORS.punch);

  // 4) name pills on each filled slot (bottom-inside)
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  T.slots.forEach((s, i) => {
    const has = i < opts.photos.length && opts.photos[i]?.img;
    if (!has) return;
    const label = (opts.names[i] ?? "MEMBER").toUpperCase();
    ctx.font = `700 20px ${FONT_LABEL}`;
    const lw = ctx.measureText(label).width + 34;
    const lx = s.x + s.w / 2 - lw / 2;
    const ly = s.y + s.h - 30;
    ctx.fillStyle = COLORS.punch;
    roundedRect(ctx, lx, ly, lw, 30, 15);
    ctx.fill();
    ctx.fillStyle = COLORS.white;
    ctx.fillText(label, lx + lw / 2, ly + 16);
  });

  ctx.restore();
}

export function renderByFormat(ctx: CanvasRenderingContext2D, format: "frame" | "card" | "squad", data: unknown) {
  if (format === "frame") renderFrame(ctx, data as FrameOptions);
  else if (format === "card") renderCard(ctx, data as CardOptions);
  else renderSquad(ctx, data as SquadOptions);
}
