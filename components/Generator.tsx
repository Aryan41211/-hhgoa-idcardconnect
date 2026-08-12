"use client";

import { useState, useRef, ChangeEvent } from "react";
import CropModal from "./CropModal";
import { renderByFormat, type CropRect } from "@/lib/renderer";
import { builderTitle } from "@/lib/titles";
import { SIZE, HASHTAG, TEMPLATES } from "@/lib/theme";
import {
  prepareImageFile,
  fileToDataUrl,
  decodeAndDownscale,
  ensureFonts,
  canvasToPngBlob,
  blobToBase64,
  downloadBlob,
  xIntent,
  loadImage,
} from "@/lib/imageUtils";

type Props = { format: "frame" | "card" };

export default function Generator({ format }: Props) {
  const [photoImg, setPhotoImg] = useState<HTMLImageElement | null>(null);
  const [photoSrc, setPhotoSrc] = useState("");
  const [cropOpen, setCropOpen] = useState(false);
  const [crop, setCrop] = useState<CropRect | null>(null);
  const [name, setName] = useState("");
  const [stack, setStack] = useState("");
  const [title, setTitle] = useState("");
  const [preview, setPreview] = useState("");
  const [resultId, setResultId] = useState("");
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const templateRef = useRef<HTMLImageElement | null>(null);

  // the card's photo slot is 517x319 (measured from the template)
  const slotAspect = format === "card" ? TEMPLATES.solo.slot.w / TEMPLATES.solo.slot.h : 1;

  const onPickFile = (e: ChangeEvent<HTMLInputElement>) => void onFile(e.target.files?.[0]);

  async function onFile(file: File | undefined) {
    if (!file) return;
    try {
      setError("");
      const ready = await prepareImageFile(file);
      const dataUrl = await fileToDataUrl(ready);
      const img = await decodeAndDownscale(dataUrl);
      setPhotoImg(img);
      setPhotoSrc(img.src);
      setCrop(null);
      setPreview("");
      setResultId("");
      setCropOpen(true);
    } catch {
      setError("Couldn't read that image — please try a JPG or PNG.");
    }
  }

  const liveTitle = format === "card" && stack.trim() ? builderTitle(stack) : "";

  async function generate() {
    setBusy(true);
    setError("");
    try {
      await ensureFonts();
      const canvas = document.createElement("canvas");
      // card uses the solo template at 2x (1660x1134); frame stays square 1080
      if (format === "card") {
        canvas.width = TEMPLATES.solo.w * 2;
        canvas.height = TEMPLATES.solo.h * 2;
        if (!templateRef.current) {
          templateRef.current = await loadImage(TEMPLATES.solo.src);
        }
      } else {
        const s = SIZE.frame;
        canvas.width = s.w;
        canvas.height = s.h;
      }
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("ctx");

      const computedTitle = format === "card" ? builderTitle(stack || "builder") : "";
      const builderId = format === "card" ? String(Math.floor(100 + Math.random() * 900)) : "";
      const data =
        format === "card"
          ? {
              photo: { img: photoImg, crop },
              name,
              stack,
              title: computedTitle,
              id: builderId,
              template: templateRef.current!,
            }
          : { photo: { img: photoImg, crop } };

      renderByFormat(ctx, format, data);
      const blob = await canvasToPngBlob(canvas);

      const b64 = await blobToBase64(blob);
      const res = await fetch("/api/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: b64,
          format,
          name: format === "card" ? name : undefined,
          stack: format === "card" ? stack : undefined,
          title: format === "card" ? computedTitle : undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "save failed");

      setTitle(computedTitle);
      setResultId(json.id);
      setResultBlob(blob);
      setPreview(URL.createObjectURL(blob));
    } catch {
      setError("Generation failed — please retry.");
    } finally {
      setBusy(false);
    }
  }

  async function share() {
    if (!resultId) return;
    const url = new URL(`/r/${resultId}`, window.location.origin).toString();
    const caption =
      format === "card"
        ? `I'm "${title}" at HH Goa 2026 — the builders are here! ${HASHTAG}`
        : `My HH Goa 2026 PFP is ready — builders are here! ${HASHTAG}`;
    // Web Share API with the actual image where supported (mobile)
    if (navigator.share && resultBlob) {
      try {
        await navigator.share({
          title: "HH Goa 2026",
          text: caption,
          url,
          files: [new File([resultBlob], `hhgoa-${format}.png`, { type: "image/png" })],
        });
        return;
      } catch {
        /* fall through to link share */
      }
    }
    window.open(xIntent(caption, url), "_blank", "noopener");
  }
return (
    <div className="mx-auto grid w-full max-w-5xl gap-8 lg:grid-cols-2">
      {/* LEFT — builder form */}
      <div className="space-y-4">
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={onPickFile}
        />
        <button
          onClick={() => fileRef.current?.click()}
          className="flex w-full flex-col items-center rounded-2xl border-2 border-dashed border-gold/60 bg-forest-light/40 px-6 py-10 transition hover:border-gold hover:bg-forest-light/70"
        >
          <span className="text-4xl">📸</span>
          <span className="mt-2 font-display text-xl tracking-wide text-cream">
            {photoImg ? "CHANGE PHOTO" : "UPLOAD YOUR PHOTO"}
          </span>
          <span className="mt-1 font-label text-xs text-cream/70">
            JPG · PNG · HEIC (iPhone) — auto-size, auto-crop
          </span>
        </button>

        {photoImg && (
          <button
            onClick={() => setCropOpen(true)}
            className="w-full rounded-full bg-forest-light px-6 py-3 font-label text-sm text-cream ring-1 ring-cream/30 transition hover:bg-forest"
          >
            🖼 REPOSITION / ZOOM PHOTO
          </button>
        )}

        {format === "card" && (
          <div className="space-y-3 rounded-2xl bg-cream p-5 shadow-lg">
            <h3 className="font-display text-xl tracking-wide text-forest">CARD DETAILS</h3>
            <label className="block">
              <span className="font-label text-xs uppercase text-forest/70">Name</span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ada Builder"
                maxLength={24}
                className="mt-1 w-full rounded-xl border border-forest/20 bg-white px-4 py-3 font-display text-lg text-forest outline-none focus:border-punch"
              />
            </label>
            <label className="block">
              <span className="font-label text-xs uppercase text-forest/70">Stack / Role</span>
              <input
                value={stack}
                onChange={(e) => setStack(e.target.value)}
                placeholder="React / Solidity / Design…"
                maxLength={40}
                className="mt-1 w-full rounded-xl border border-forest/20 bg-white px-4 py-3 font-display text-lg text-forest outline-none focus:border-punch"
              />
            </label>
            {liveTitle && (
              <div className="rounded-xl bg-punch/10 px-4 py-3">
                <span className="font-label text-[11px] uppercase text-punch-dark">
                  Your builder title
                </span>
                <p className="font-display text-xl text-punch-dark">“{liveTitle}”</p>
              </div>
            )}
          </div>
        )}

        <button
          onClick={() => void generate()}
          disabled={!photoImg || busy}
          className="w-full rounded-full bg-punch px-8 py-4 font-display text-xl tracking-widest text-white shadow-lg shadow-punch/30 transition hover:bg-punch-dark disabled:cursor-not-allowed disabled:opacity-40"
        >
          {busy ? "GENERATING…" : "GENERATE FRAME →"}
        </button>
        {error && <p className="rounded-xl bg-punch/15 px-4 py-2 font-label text-sm text-cream">{error}</p>}
      </div>

      {/* RIGHT — preview + actions */}
      <div className="flex flex-col items-center justify-center gap-4">
        {preview ? (
          <>
            <div className="w-full max-w-sm overflow-hidden rounded-2xl shadow-2xl ring-1 ring-cream/30">
              <img src={preview} alt="Generated HH Goa frame" className="h-auto w-full" />
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={() => resultBlob && downloadBlob(resultBlob, `hhgoa-${format}-${resultId}.png`)}
                className="rounded-full bg-gold px-6 py-3 font-display tracking-wide text-forest transition hover:bg-gold-dark"
              >
                ⬇ DOWNLOAD PNG
              </button>
              <button
                onClick={() => void share()}
                className="rounded-full bg-white px-6 py-3 font-display tracking-wide text-black transition hover:bg-cream"
              >
                ✕ SHARE TO X
              </button>
            </div>
            <a
              href={`/r/${resultId}`}
              target="_blank"
              rel="noopener"
              className="font-label text-xs text-gold underline decoration-dotted underline-offset-4"
            >
              Open share page (link preview) →
            </a>
          </>
        ) : (
          <div className="flex aspect-square w-full max-w-sm items-center justify-center rounded-2xl border-2 border-dashed border-cream/25 bg-forest-light/30 text-center">
            <p className="px-8 font-label text-sm leading-relaxed text-cream/60">
              {busy
                ? "Compositing your frame…"
                : "Your framed HH Goa 2026 graphic will appear here. Share it with #FrameInGoa."}
            </p>
          </div>
        )}
      </div>

      <CropModal
        imageSrc={photoSrc}
        aspect={slotAspect}
        open={cropOpen}
        onCancel={() => setCropOpen(false)}
        onConfirm={(c) => {
          setCrop(c);
          setCropOpen(false);
        }}
      />
    </div>
  );
}
