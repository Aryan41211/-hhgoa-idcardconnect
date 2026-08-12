"use client";

import { FONT_DISPLAY, FONT_LABEL, FONT_SCRIPT } from "./theme";

const MAX_EDGE = 1600; // downscale longest edge to keep canvas fast on mobile

/** Convert a HEIC/HEIF File to a viewable image if needed, else return as-is. */
export async function prepareImageFile(file: File): Promise<File> {
  const isHeic = /heic|heif|avif/i.test(file.type) || /\.(heic|heif)$/i.test(file.name);
  if (!isHeic) return file;
  // imported lazily — heic2any reads browser globals at load, breaking SSR
  const heic2any = (await import("heic2any")).default;
  const converted = (await heic2any({
    blob: file as Blob,
    toType: "image/jpeg",
    quality: 0.92,
  })) as Blob | Blob[];
  const blob = Array.isArray(converted) ? converted[0] : converted;
  return new File([blob], file.name.replace(/\.(heic|heif)$/i, ".jpg"), {
    type: "image/jpeg",
  });
}

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

/** Decode an image and downscale to MAX_EDGE. Returns a fresh HTMLImageElement. */
export function decodeAndDownscale(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, MAX_EDGE / Math.max(img.naturalWidth, img.naturalHeight));
      const w = Math.round(img.naturalWidth * scale);
      const h = Math.round(img.naturalHeight * scale);
      const c = document.createElement("canvas");
      c.width = w;
      c.height = h;
      const ctx = c.getContext("2d");
      if (!ctx) return reject(new Error("no canvas 2d"));
      ctx.drawImage(img, 0, 0, w, h);
      c.toBlob(
        (blob) => {
          if (!blob) return reject(new Error("toBlob failed"));
          const url = URL.createObjectURL(blob);
          const out = new Image();
          out.onload = () => resolve(out);
          out.onerror = reject;
          out.src = url;
        },
        "image/jpeg",
        0.92
      );
    };
    img.onerror = reject;
    img.src = dataUrl;
  });
}

/** Decode an image URL (blob/data/http) into an HTMLImageElement. */
export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/** Ensure brand fonts are parsed before we draw text to canvas. */
export async function ensureFonts(): Promise<void> {
  const wanted = [
    `700 64px ${FONT_DISPLAY}`,
    `400 64px ${FONT_DISPLAY}`,
    `700 32px ${FONT_LABEL}`,
    `700 64px ${FONT_SCRIPT}`,
  ];
  try {
    await Promise.all(wanted.map((f) => (document as unknown as { fonts: FontFaceSet }).fonts.load(f)));
  } catch {
    /* fonts may fail offline; canvas falls back gracefully */
  }
}

export function canvasToPngBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("export failed"))), "image/png");
  });
}

export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => {
      const s = r.result as string;
      resolve(s.split(",")[1] ?? s);
    };
    r.onerror = reject;
    r.readAsDataURL(blob);
  });
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export function xIntent(text: string, url: string) {
  return `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
}
