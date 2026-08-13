import type { Metadata } from "next";
import IdCardForm from "@/components/ids/IdCardForm";

export const metadata: Metadata = {
  title: "Official ID Card — HH Goa 2026",
  description:
    "Photo + name + institution + card number on an official HH Goa 2026 ID card. Download or share with #FrameInGoa.",
};

export default function IdCardPage() {
  return (
    <section className="mx-auto max-w-6xl px-5 pb-16 text-center">
      <h1 className="font-display text-4xl tracking-wide text-gold">OFFICIAL ID CARD</h1>
      <p className="mx-auto mt-2 max-w-lg font-label text-sm text-cream/70">
        A real event badge — photo, institution, department, roll no and a unique card number.
        Preview updates live, then download or share the PNG.
      </p>
      <div className="mt-8 text-left">
        <IdCardForm />
      </div>
    </section>
  );
}
