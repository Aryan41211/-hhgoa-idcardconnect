"use client";

// Official HH Goa ID Card builder. Collects the card fields + photo, shows a
// live canvas preview (IdCardPreview), and wires download + share-to-X the same
// way the other generators do (upload -> crop -> compose -> save -> share).

import { useMemo, useRef, useState, type ChangeEvent } from "react";
import IdCardPreview from "./IdCardPreview";
import CropModal from "@/components/CropModal";
import { drawIdCard, type RenderInput } from "@/lib/idcard/render";
import {
  ID_TYPES,
  CAMPUSES,
  DEFAULT_INSTITUTION,
  generateCardNumber,
  defaultValidUntil,
  type IdCardStatus,
} from "@/lib/idcard/model";
import type { CropRect } from "@/lib/renderer";
import {
  prepareImageFile,
  fileToDataUrl,
  decodeAndDownscale,
  canvasToPngBlob,
  blobToBase64,
  downloadBlob,
  xIntent,
} from "@/lib/imageUtils";
import { HASHTAG } from "@/lib/theme";

// photo frame on the card is 200 x 240 -> crop UI uses the same aspect
const PHOTO_ASPECT = 200 / 240;

export default function IdCardForm() {
  const [fullName, setFullName] = useState("");
  const [idTypeLabel, setIdTypeLabel] = useState<(typeof ID_TYPES)[number]>("BUILDER");
  const [institution, setInstitution] = useState(DEFAULT_INSTITUTION);
  const [department, setDepartment] = useState("");
  const [program, setProgram] = useState("");
  const [campus, setCampus] = useState<string>("GOA");
  const [cardNumber, setCardNumber] = useState(() => generateCardNumber());
  const [validUntil, setValidUntil] = useState(() => defaultValidUntil());
  const [status, setStatus] = useState<IdCardStatus>("active");
  const [photo, setPhoto] = useState<HTMLImageElement | null>(null);
  const [photoSrc, setPhotoSrc] = useState("");
  const [crop, setCrop] = useState<CropRect | null>(null);
  const [cropOpen, setCropOpen] = useState(false);
  const [preview, setPreview] = useState("");
  const [resultId, setResultId] = useState("");
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const input = useMemo<RenderInput>(
    () => ({
      fullName: fullName.trim() || "Card Holder",
      idTypeLabel,
      institution: institution.trim() || DEFAULT_INSTITUTION,
      department: department.trim() || undefined,
      program: program.trim() || undefined,
      campus: campus.trim() || undefined,
      cardNumber: cardNumber.trim() || generateCardNumber(),
      photo,
      crop,
      validUntil: validUntil || undefined,
      status,
    }),
    [fullName, idTypeLabel, institution, department, program, campus, cardNumber, photo, crop, validUntil, status]
  );

  const onPickFile = (e: ChangeEvent<HTMLInputElement>) => void onFile(e.target.files?.[0]);

  async function onFile(file: File | undefined) {
    if (!file) return;
    try {
      setError("");
      const ready = await prepareImageFile(file);
      const dataUrl = await fileToDataUrl(ready);
      const img = await decodeAndDownscale(dataUrl);
      setPhoto(img);
      setPhotoSrc(img.src);
      setCrop(null);
      setPreview("");
      setResultId("");
      setCropOpen(true);
    } catch {
      setError("Couldn't read that image — please try a JPG or PNG.");
    }
  }

  async function generate() {
    setBusy(true);
    setError("");
    try {
      const canvas = drawIdCard(input);
      const blob = await canvasToPngBlob(canvas);
      const b64 = await blobToBase64(blob);
      const res = await fetch("/api/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: b64,
          format: "idcard",
          name: fullName.trim(),
          stack: input.institution,
          title: input.cardNumber,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "save failed");
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
    const caption = `My HH Goa 2026 ID card is ready — ${HASHTAG}`;
    if (navigator.share && resultBlob) {
      try {
        await navigator.share({
          title: "HH Goa 2026 ID Card",
          text: caption,
          url,
          files: [new File([resultBlob], `hhgoa-idcard-${resultId}.png`, { type: "image/png" })],
        });
        return;
      } catch {
        /* fall through to link share */
      }
    }
    window.open(xIntent(caption, url), "_blank", "noopener");
  }

  const fieldCls =
    "mt-1 w-full rounded-xl border border-forest/20 bg-white px-4 py-3 font-label text-base text-forest outline-none focus:border-punch";
  const labelCls = "font-label text-xs uppercase text-forest/70";

  return (
    <div className="mx-auto grid w-full max-w-5xl gap-8 lg:grid-cols-2">
      {/* LEFT — card details */}
      <div className="space-y-4">
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onPickFile} />
        <button
          onClick={() => fileRef.current?.click()}
          className="flex w-full flex-col items-center rounded-2xl border-2 border-dashed border-gold/60 bg-forest-light/40 px-6 py-10 transition hover:border-gold hover:bg-forest-light/70"
        >
          <span className="text-4xl">📸</span>
          <span className="mt-2 font-display text-xl tracking-wide text-cream">
            {photo ? "CHANGE PHOTO" : "UPLOAD YOUR PHOTO"}
          </span>
          <span className="mt-1 font-label text-xs text-cream/70">
            JPG · PNG · HEIC (iPhone) — auto-size, auto-crop
          </span>
        </button>

        {photo && (
          <button
            onClick={() => setCropOpen(true)}
            className="w-full rounded-full bg-forest-light px-6 py-3 font-label text-sm text-cream ring-1 ring-cream/30 transition hover:bg-forest"
          >
            🖼 REPOSITION / ZOOM PHOTO
          </button>
        )}

        <div className="space-y-3 rounded-2xl bg-cream p-5 shadow-lg">
          <h3 className="font-display text-xl tracking-wide text-forest">CARD DETAILS</h3>

          <label className="block">
            <span className={labelCls}>Full name</span>
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Ada Builder"
              maxLength={32}
              className={fieldCls}
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className={labelCls}>ID type</span>
              <select
                value={idTypeLabel}
                onChange={(e) => setIdTypeLabel(e.target.value as (typeof ID_TYPES)[number])}
                className={fieldCls}
              >
                {ID_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className={labelCls}>Status</span>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as IdCardStatus)}
                className={fieldCls}
              >
                <option value="active">ACTIVE</option>
                <option value="expired">EXPIRED</option>
                <option value="revoked">REVOKED</option>
              </select>
            </label>
          </div>

          <label className="block">
            <span className={labelCls}>Institution</span>
            <input
              value={institution}
              onChange={(e) => setInstitution(e.target.value)}
              placeholder={DEFAULT_INSTITUTION}
              maxLength={40}
              className={fieldCls}
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className={labelCls}>Department</span>
              <input
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="Engineering"
                maxLength={24}
                className={fieldCls}
              />
            </label>
            <label className="block">
              <span className={labelCls}>Program</span>
              <input
                value={program}
                onChange={(e) => setProgram(e.target.value)}
                placeholder="Build Sprint"
                maxLength={24}
                className={fieldCls}
              />
            </label>
          </div>

          <label className="block">
            <span className={labelCls}>Campus</span>
            <select value={campus} onChange={(e) => setCampus(e.target.value)} className={fieldCls}>
              {CAMPUSES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className={labelCls}>Card number</span>
              <input
                value={cardNumber}
                onChange={(e) => setCardNumber(e.target.value.toUpperCase())}
                maxLength={18}
                className={fieldCls}
              />
              <button
                onClick={() => setCardNumber(generateCardNumber())}
                className="mt-1 font-label text-[11px] text-punch-dark underline decoration-dotted underline-offset-2"
              >
                re-generate
              </button>
            </label>
            <label className="block">
              <span className={labelCls}>Valid until</span>
              <input
                type="date"
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
                className={fieldCls}
              />
            </label>
          </div>
        </div>

        <button
          onClick={() => void generate()}
          disabled={busy}
          className="w-full rounded-full bg-punch px-8 py-4 font-display text-xl tracking-widest text-white shadow-lg shadow-punch/30 transition hover:bg-punch-dark disabled:cursor-not-allowed disabled:opacity-40"
        >
          {busy ? "GENERATING…" : "GENERATE ID CARD →"}
        </button>
        {error && <p className="rounded-xl bg-punch/15 px-4 py-2 font-label text-sm text-cream">{error}</p>}
      </div>

      {/* RIGHT — live preview + actions */}
      <div className="flex flex-col items-center justify-center gap-4">
        <div className="w-full max-w-xl overflow-hidden rounded-2xl shadow-2xl ring-1 ring-cream/30">
          <IdCardPreview input={input} className="block" />
        </div>

        {preview ? (
          <>
            <div className="w-full max-w-sm overflow-hidden rounded-2xl ring-1 ring-cream/30">
              <img src={preview} alt="Generated HH Goa ID card" className="h-auto w-full" />
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={async () => {
                  if (resultBlob) {
                    downloadBlob(resultBlob, `hhgoa-idcard-${resultId}.png`);
                  } else {
                    const b = await canvasToPngBlob(drawIdCard(input));
                    downloadBlob(b, "hhgoa-idcard.png");
                  }
                }}
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
          <p className="max-w-sm text-center font-label text-sm leading-relaxed text-cream/60">
            {busy ? "Compositing your card…" : "Your HH Goa 2026 ID card preview updates live as you type. Generate + share it with #FrameInGoa."}
          </p>
        )}
      </div>

      <CropModal
        imageSrc={photoSrc}
        aspect={PHOTO_ASPECT}
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
