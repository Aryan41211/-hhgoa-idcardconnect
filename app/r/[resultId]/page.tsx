import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { loadMeta } from "@/lib/storage";

type Params = { params: { resultId: string } };

async function baseUrl() {
  const h = headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto")?.split(",")[0] ?? "http";
  return `${proto}://${host}`;
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const id = String(params?.resultId ?? "").replace(/[^a-f0-9]/g, "");
  const meta = id.length >= 6 ? await loadMeta(id) : null;
  const base = await baseUrl();
  const imageUrl = `${base}/api/image/${id}`;
  const title =
    meta?.format === "card"
      ? `I'm "${meta.title}" at HH Goa 2026`
      : meta?.format === "idcard"
        ? `${meta?.name ?? "My"} — HH Goa 2026 ID Card`
        : "HH Goa 2026 — Builders Are Here";
  const dims =
    meta?.format === "card"
      ? { width: 1660, height: 1134 }
      : meta?.format === "squad"
        ? { width: 2138, height: 1108 }
        : meta?.format === "idcard"
          ? { width: 1050, height: 675 }
          : { width: 1080, height: 1080 };
  return {
    title,
    description: "Generated with the HH Goa 2026 Frame Generator — #FrameInGoa",
    openGraph: {
      title,
      description: "HH Goa 2026 · GOA, INDIA · #FrameInGoa",
      images: [{ url: imageUrl, ...dims, alt: "HH Goa 2026 frame" }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: "HH Goa 2026 · GOA, INDIA · #FrameInGoa",
      images: [imageUrl],
    },
  };
}

export default async function ResultPage({ params }: Params) {
  const id = String(params?.resultId ?? "").replace(/[^a-f0-9]/g, "");
  const meta = id.length >= 6 ? await loadMeta(id) : null;
  if (!meta) {
    return (
      <div className="mx-auto max-w-lg px-5 py-20 text-center">
        <h1 className="font-display text-3xl text-gold">FRAME NOT FOUND</h1>
        <p className="mt-3 font-label text-sm text-cream/70">
          This share link is expired or mistyped.
        </p>
        <Link href="/" className="mt-6 inline-block rounded-full bg-punch px-6 py-3 font-display tracking-wide text-white">
          MAKE YOUR OWN →
        </Link>
      </div>
    );
  }

  const title =
    meta.format === "card"
      ? `I'm "${meta.title}" at HH Goa 2026`
      : meta.format === "idcard"
        ? `${meta.name ?? "My"} — HH Goa 2026 ID Card`
        : "My HH Goa 2026 frame is ready!";

  return (
    <div className="mx-auto max-w-3xl px-5 pb-16 text-center">
      <h1 className="font-display text-3xl tracking-wide text-gold">{title}</h1>
      <p className="mt-2 font-label text-xs text-teal">HH GOA 2026 · GOA, INDIA · #FrameInGoa</p>
      {/* Everything the X link-preview needs lives behind this <img> */}
      <img
        src={`/api/image/${id}`}
        alt="HH Goa 2026 generated frame"
        className="mx-auto mt-6 h-auto w-full max-w-md rounded-2xl shadow-2xl ring-1 ring-cream/25"
      />
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <a
          href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(
            `${title} #FrameInGoa`
          )}&url=${encodeURIComponent(`${await baseUrl()}/r/${id}`)}`}
          target="_blank"
          rel="noopener"
          className="rounded-full bg-white px-6 py-3 font-display tracking-wide text-black transition hover:bg-cream"
        >
          ✕ SHARE ON X
        </a>
        <a
          href={`/api/image/${id}`}
          download={`hhgoa-${meta.format}-${id}.png`}
          className="rounded-full bg-gold px-6 py-3 font-display tracking-wide text-forest transition hover:bg-gold-dark"
        >
          ⬇ DOWNLOAD PNG
        </a>
      </div>
      <p className="mt-6">
        <Link href="/" className="font-label text-sm text-gold underline decoration-dotted underline-offset-4">
          Make your own frame →
        </Link>
      </p>
    </div>
  );
}