// Brand palette + type (from BRAND.md, pulled from the provided templates)
export const COLORS = {
  forest: "#0B3D2E",
  forestDeep: "#072A20",
  forestLight: "#10513D",
  punch: "#FF3E9D", // hot pink / magenta accent
  punchDark: "#C8157A",
  gold: "#FFC53D",
  goldDark: "#E8A800",
  cream: "#F6EFE0",
  creamDark: "#E6D8BE",
  teal: "#2EC4B6",
  ink: "#1B2A23",
  white: "#FFFFFF",
  black: "#0B0B0B",
} as const;

// Photo slot placeholder gradient (pink -> teal) before a real photo loads
export const SLOT_GRADIENT: [string, string] = [COLORS.punch, COLORS.teal];

// Fonts loaded in the <head> via Google Fonts and used on canvas.
export const FONT_DISPLAY = "Anton";
export const FONT_LABEL = "Space Mono";
export const FONT_SCRIPT = "Caveat";

export const HASHTAG = "#FRAMEINGOA";

export type SlotRect = { x: number; y: number; w: number; h: number };

// Geometry for the provided reference templates (measured programmatically).
export const TEMPLATES = {
  solo: {
    src: "/templates/solo.png",
    w: 830,
    h: 567,
    // photo placeholder (pink->teal gradient) — left/top measured from the
    // largest gradient connected-component bbox
    slot: { x: 201, y: 82, w: 517, h: 319 } as SlotRect,
    // blank cream area reserved for the name + role
    text: { x: 265, y: 425 }, // text-left/top anchor in template px
  },
  squad: {
    src: "/templates/squad.png",
    w: 1069,
    h: 554,
    // 3 photo slots in the top row, measured from gradient components (each
    // slot contains a smiley placeholder). The bottom band (below the slots)
    // is redrawn programmatically — see renderSquad.
    slots: [
      { x: 165, y: 205, w: 200, h: 135 },
      { x: 420, y: 215, w: 215, h: 130 },
      { x: 700, y: 215, w: 218, h: 135 },
    ] as SlotRect[],
    // template px regions composited in code (slot-4 + baked text were covered
    // with the bg fill so the band reflows without leftover gaps)
    band: { y: 352, h: 202 },
    stacks: [
      { x: 165, y: 396, w: 200 },
      { x: 420, y: 396, w: 215 },
      { x: 700, y: 396, w: 218 },
    ],
    teamClass: { x: 60, y: 436, w: 455, h: 98 },
    teamTagline: { x: 560, y: 444, w: 455, h: 98 },
    chip: { x: 915, y: 518, w: 134, h: 31 },
  },
} as const;

// Output canvas dimensions
export const SIZE = {
  frame: { w: 1080, h: 1080 }, // Format A — square PFP
  card: { w: 1080, h: 1350 }, // Format B — 3:4 builder ID card
  squad: { w: 1200, h: 1200 }, // Squad — 3-slot grid
} as const;

export type Format = "frame" | "card" | "squad";

export function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// Small hand-drawn-style doodles reused across frames
export function drawStar(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  spikes: number,
  outer: number,
  inner: number,
  color: string,
  rotation = 0
) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rotation);
  ctx.beginPath();
  for (let i = 0; i < spikes * 2; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = (i * Math.PI) / spikes;
    ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  ctx.restore();
}

export function drawDottedPath(
  ctx: CanvasRenderingContext2D,
  pts: [number, number][],
  color: string,
  dot = 6
) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = dot;
  ctx.setLineDash([0, dot * 2.4]);
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  ctx.stroke();
  ctx.restore();
}

export function drawPalm(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  color: string
) {
  // simple silhouette palm for the stamp / decoration
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = Math.max(2, size * 0.06);
  ctx.lineCap = "round";
  // trunk
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.quadraticCurveTo(x + size * 0.1, y - size * 0.55, x + size * 0.18, y - size);
  ctx.stroke();
  // fronds
  const frond = (ang: number, len: number) => {
    const ex = x + size * 0.18 + Math.cos(ang) * len;
    const ey = y - size + Math.sin(ang) * len;
    ctx.beginPath();
    ctx.moveTo(x + size * 0.18, y - size);
    ctx.quadraticCurveTo(x + size * 0.18 + Math.cos(ang) * len * 0.5, y - size + Math.sin(ang) * len * 0.5 - len * 0.28, ex, ey);
    ctx.stroke();
  };
  frond(-0.5, size * 0.7);
  frond(-0.2, size * 0.95);
  frond(0.15, size * 0.95);
  frond(0.5, size * 0.7);
  ctx.restore();
}

export function drawStamp(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  ringColor: string,
  textColor: string
) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.strokeStyle = ringColor;
  ctx.lineWidth = r * 0.12;
  ctx.setLineDash([r * 0.1, r * 0.07]);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.strokeStyle = ringColor;
  ctx.lineWidth = r * 0.05;
  ctx.setLineDash([]);
  ctx.stroke();
  ctx.setLineDash([]);
  drawPalm(ctx, cx + 4, cy - 6, r * 0.5, textColor);
  ctx.font = `700 ${Math.round(r * 0.22)}px ${FONT_LABEL}`;
  ctx.fillStyle = textColor;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("HACKER HOUSE", cx, cy + r * 0.42);
  ctx.fillText("GOA", cx, cy + r * 0.65);
  ctx.restore();
}

export function drawWashiTape(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  angle: number,
  color: string
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.globalAlpha = 0.75;
  ctx.fillStyle = color;
  roundedRect(ctx, -w / 2, -h / 2, w, h, 3);
  ctx.fill();
  ctx.globalAlpha = 0.9;
  ctx.fillStyle = "rgba(255,255,255,0.18)";
  roundedRect(ctx, -w / 2, -h / 2 + h * 0.1, w, h * 0.18, 2);
  ctx.fill();
  ctx.restore();
}
