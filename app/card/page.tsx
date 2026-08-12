import type { Metadata } from "next";
import Generator from "@/components/Generator";

export const metadata: Metadata = {
  title: "Builder ID Card — HH Goa 2026",
  description: "Photo + name + stack + auto-generated builder title on a branded HH Goa 2026 card.",
};

export default function CardPage() {
  return (
    <section className="mx-auto max-w-6xl px-5 pb-16 text-center">
      <h1 className="font-display text-4xl tracking-wide text-gold">BUILDER ID CARD</h1>
      <p className="mx-auto mt-2 max-w-lg font-label text-sm text-cream/70">
        Photo, name, stack — and a builder title generated from the stack you type. Go on, try
        &ldquo;Rust&rdquo;.
      </p>
      <div className="mt-8 text-left">
        <Generator format="card" />
      </div>
    </section>
  );
}