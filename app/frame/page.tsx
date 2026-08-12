import type { Metadata } from "next";
import Generator from "@/components/Generator";

export const metadata: Metadata = {
  title: "PFP Frame — HH Goa 2026",
  description: "Wrap your photo in the HH Goa 2026 frame and share it with #FrameInGoa.",
};

export default function FramePage() {
  return (
    <section className="mx-auto max-w-6xl px-5 pb-16 text-center">
      <h1 className="font-display text-4xl tracking-wide text-gold">PFP FRAME</h1>
      <p className="mx-auto mt-2 max-w-lg font-label text-sm text-cream/70">
        Perfectly square. Ready as your profile picture. Auto-crop keeps the shot on your face.
      </p>
      <div className="mt-8 text-left">
        <Generator format="frame" />
      </div>
    </section>
  );
}