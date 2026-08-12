"use client";

import { useEffect, useRef, useState, ChangeEvent, useCallback } from "react";
import Link from "next/link";
import CropModal from "./CropModal";
import { renderSquad, type CropRect } from "@/lib/renderer";
import {
  prepareImageFile,
  fileToDataUrl,
  decodeAndDownscale,
  ensureFonts,
  blobToBase64,
  downloadBlob,
  xIntent,
  loadImage,
} from "@/lib/imageUtils";
import { HASHTAG, TEMPLATES } from "@/lib/theme";

type Member = {
  has: boolean;
  name?: string;
  photoBase64?: string | null;
  crop?: CropRect | null;
};

function imageFromBase64(b64: string, type: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = `data:${type};base64,${b64}`;
  });
}

export default function SquadClient({ squadId }: { squadId: string }) {
  const id = squadId.replace(/[^a-z0-9]/g, "");
  const [status, setStatus] = useState<"loading" | "ready" | "missing">("loading");
  const [members, setMembers] = useState<Member[]>([]);
  const [preview, setPreview] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [candidate, setCandidate] = useState<HTMLImageElement | null>(null);
  const [candidateSrc, setCandidateSrc] = useState("");
  const [cropOpen, setCropOpen] = useState(false);
  const [crop, setCrop] = useState<CropRect | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const refresh = useCallback(async () => {
    const res = await fetch(`/api/squad/${id}`);
    if (!res.ok) return setStatus("missing");
    const json = await res.json();
    if (!Array.isArray(json.members)) return setStatus("missing");
    setMembers(json.members as Member[]);
    setStatus("ready");
  }, [id]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  // Re-composite the full combined frame whenever members change.
  useEffect(() => {
    if (status !== "ready") return;
    let cancelled = false;
    (async () => {
      try {
        await ensureFonts();
        const canvas = document.createElement("canvas");
        // use the squad template at 2x for a crisp export
        canvas.width = TEMPLATES.squad.w * 2;
        canvas.height = TEMPLATES.squad.h * 2;
        const ctx = canvas.getContext("2d")!;
        const template = await loadImage(TEMPLATES.squad.src);
        const photos = [];
        for (const m of members) {
          if (m?.has && m.photoBase64) {
            photos.push({ img: await imageFromBase64(m.photoBase64, "image/jpeg"), crop: m.crop ?? null });
          } else {
            photos.push({ img: null });
          }
        }
        renderSquad(ctx, { photos, names: members.map((m) => m?.name ?? ""), template });
        if (!cancelled) setPreview(canvas.toDataURL("image/png"));
      } catch {
        /* keep previous preview */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [status, members]);
const openIndex = members.findIndex((m) => !m?.has);
  const filled = members.filter((m) => m?.has).length;

  async function onPickFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setError("");
      const ready = await prepareImageFile(file);
      const dataUrl = await fileToDataUrl(ready);
      const img = await decodeAndDownscale(dataUrl);
      setCandidate(img);
      setCandidateSrc(img.src);
      setCrop(null);
      setCropOpen(true);
    } catch {
      setError("Couldn't read that image.");
    }
  }

  async function addMe() {
    if (!candidate || openIndex === -1) return;
    setBusy(true);
    setError("");
    try {
      const b64 = await new Promise<string>((resolve, reject) => {
        const c = document.createElement("canvas");
        c.width = candidate.naturalWidth;
        c.height = candidate.naturalHeight;
        c.getContext("2d")!.drawImage(candidate, 0, 0);
        c.toBlob(async (b) => {
          if (!b) return reject(new Error("encode"));
          resolve(await blobToBase64(b));
        }, "image/jpeg");
      });
      const res = await fetch(`/api/squad/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photoBase64: b64, name, crop }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "add failed");
      setCandidate(null);
      setCandidateSrc("");
      setCrop(null);
      setName("");
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to add you.");
    } finally {
      setBusy(false);
    }
  }

  const shareUrl = typeof window !== "undefined" ? `${window.location.origin}/squad/${id}` : `/squad/${id}`;
if (status === "loading") {
    return <p className="py-20 text-center font-label text-sm text-cream/60">Loading squad…</p>;
  }

  if (status === "missing") {
    return (
      <div className="mx-auto max-w-lg px-5 py-20 text-center">
        <h1 className="font-display text-3xl text-gold">SQUAD NOT FOUND</h1>
        <p className="mt-3 font-label text-sm text-cream/70">This squad link doesn&apos;t exist (yet).</p>
        <Link href="/squad" className="mt-6 inline-block rounded-full bg-punch px-6 py-3 font-display tracking-wide text-white">
          CREATE A SQUAD →
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-5 pb-16">
      <h1 className="text-center font-display text-4xl tracking-wide text-gold">SQUAD FRAME</h1>
      <p className="mt-2 text-center font-label text-sm text-teal">
        {filled}/4 builders in · {openIndex !== -1 ? `slot ${openIndex + 1} is open` : "squad is full"}
      </p>

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <div>
          {preview ? (
            <img src={preview} alt="Combined squad frame" className="h-auto w-full rounded-2xl shadow-2xl ring-1 ring-cream/25" />
          ) : (
            <div className="flex aspect-square items-center justify-center rounded-2xl border-2 border-dashed border-cream/25 font-label text-sm text-cream/50">
              Composing…
            </div>
          )}
          <div className="mt-3 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={async () => {
                const b = await (await fetch(preview)).blob();
                downloadBlob(b, `hhgoa-squad-${id}.png`);
              }}
              disabled={!preview}
              className="rounded-full bg-gold px-6 py-3 font-display tracking-wide text-forest transition hover:bg-gold-dark"
            >
              ⬇ DOWNLOAD PNG
            </button>
            <button
              onClick={() => window.open(xIntent(`Our HH Goa 2026 squad is here! ${HASHTAG}`, shareUrl), "_blank")}
              className="rounded-full bg-white px-6 py-3 font-display tracking-wide text-black transition hover:bg-cream"
            >
              ✕ SHARE TO X
            </button>
          </div>
        </div>

        <div className="rounded-2xl bg-forest/70 p-6 ring-1 ring-cream/15">
          <h2 className="font-display text-2xl text-gold">{openIndex !== -1 ? "JUMP IN" : "SQUAD FULL 🎉"}</h2>
          {openIndex !== -1 ? (
            <>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onPickFile} />
              <button
                onClick={() => fileRef.current?.click()}
                className="mt-4 w-full rounded-2xl border-2 border-dashed border-gold/60 bg-forest-light/40 px-6 py-8 text-center transition hover:border-gold"
              >
                <span className="text-3xl">📸</span>
                <p className="mt-2 font-display text-lg text-cream">{candidate ? "CHANGE PHOTO" : "DROP YOUR PHOTO"}</p>
              </button>
              {candidate && (
                <button onClick={() => setCropOpen(true)} className="mt-3 w-full rounded-full bg-forest-light px-6 py-3 font-label text-sm text-cream ring-1 ring-cream/30">
                  🖼 REPOSITION
                </button>
              )}
              <label className="mt-4 block">
                <span className="font-label text-xs uppercase text-cream/70">Your name</span>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ada Builder"
                  maxLength={18}
                  className="mt-1 w-full rounded-xl border border-cream/20 bg-forest-deep px-4 py-3 font-display text-lg text-cream outline-none focus:border-gold"
                />
              </label>
              <button
                onClick={() => void addMe()}
                disabled={!candidate || busy}
                className="mt-5 w-full rounded-full bg-punch px-6 py-4 font-display text-lg tracking-widest text-white transition hover:bg-punch-dark disabled:opacity-40"
              >
                {busy ? "ADDING…" : "ADD ME TO THE SQUAD →"}
              </button>
            </>
          ) : (
            <p className="mt-3 font-label text-sm text-cream/70">
              All four slots are taken. Grab the PNG and keep the wave going.
            </p>
          )}
          {error && <p className="mt-3 rounded-xl bg-punch/15 px-4 py-2 font-label text-sm text-cream">{error}</p>}

          <div className="mt-6">
            <span className="font-label text-xs uppercase text-cream/60">Share this link</span>
            <div className="mt-2 flex gap-2">
              <input readOnly value={shareUrl} className="min-w-0 flex-1 rounded-lg border border-cream/20 bg-forest-deep px-3 py-2 font-label text-xs text-cream" />
              <button
                onClick={() => void navigator.clipboard?.writeText(shareUrl)}
                className="rounded-lg bg-cream px-4 py-2 font-label text-xs font-bold text-forest"
              >
                COPY
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between font-label text-xs text-cream/60">
        <span>{HASHTAG}</span>
        <Link href="/" className="underline decoration-dotted underline-offset-4">← back</Link>
      </div>

      <CropModal
        imageSrc={candidateSrc}
        aspect={1}
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