"use client";

import { useState, useCallback, useEffect } from "react";
import dynamic from "next/dynamic";
import type { Area } from "react-easy-crop";
import type { CropRect } from "@/lib/renderer";

// react-easy-crop reads browser globals at load — never render it on the server.
const Cropper = dynamic(() => import("react-easy-crop"), {
  ssr: false,
}) as unknown as React.ComponentType<{
  image: string;
  crop: { x: number; y: number };
  zoom: number;
  aspect: number;
  onCropChange: (c: { x: number; y: number }) => void;
  onZoomChange: (z: number) => void;
  onCropComplete: (_: Area, areaPixels: Area) => void;
}>;

type Props = {
  imageSrc: string;
  aspect: number;
  open: boolean;
  onCancel: () => void;
  onConfirm: (crop: CropRect) => void;
};

export default function CropModal({ imageSrc, aspect, open, onCancel, onConfirm }: Props) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [pixels, setPixels] = useState<Area | null>(null);

  const onCropComplete = useCallback((_: Area, areaPixels: Area) => {
    setPixels(areaPixels);
  }, []);

  useEffect(() => {
    if (open) {
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setPixels(null);
    }
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/85 backdrop-blur-sm p-4 sm:p-8">
      <div className="mx-auto w-full max-w-xl rounded-2xl bg-forest-deep p-4 shadow-2xl ring-1 ring-punch/40">
        <h2 className="mb-3 text-center font-display text-2xl tracking-wide text-cream">
          FIT YOUR SHOT
        </h2>
        <div className="relative h-[52vh] overflow-hidden rounded-xl bg-black/40">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={aspect}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
          />
        </div>
        <div className="mt-4 flex items-center gap-3 text-cream">
          <span className="font-label text-xs">ZOOM</span>
          <input
            type="range"
            min={1}
            max={4}
            step={0.05}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="flex-1 accent-punch"
          />
        </div>
        <p className="mt-2 font-label text-xs text-cream/70">Drag to reposition · pinch/slider to zoom</p>
        <div className="mt-4 flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="rounded-full bg-transparent px-6 py-3 font-label text-sm text-cream ring-1 ring-cream/40 transition hover:bg-cream/10"
          >
            BACK
          </button>
          <button
            onClick={() => pixels && onConfirm(pixels)}
            disabled={!pixels}
            className="rounded-full bg-punch px-6 py-3 font-display tracking-wide text-white transition hover:bg-punch-dark disabled:opacity-40"
          >
            USE PHOTO →
          </button>
        </div>
      </div>
    </div>
  );
}
