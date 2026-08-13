"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SquadLanding() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function create() {
    setBusy(true);
    try {
      const res = await fetch("/api/squad", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ team: "My Goa Crew" }),
      });
      const json = await res.json();
      if (json.id) router.push(`/squad/${json.id}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mx-auto max-w-3xl px-5 pb-16 text-center">
      <h1 className="font-display text-5xl leading-none tracking-wide text-gold">
        SQUAD MODE
      </h1>
      <p className="mx-auto mt-4 max-w-lg font-label text-sm leading-relaxed text-cream/70">
        One link. Three teammates. No login — everyone drops their own photo into the
        next empty slot of the <em>same</em> combined frame.
      </p>

      <button
        onClick={() => void create()}
        disabled={busy}
        className="mt-8 rounded-full bg-punch px-8 py-4 font-display text-xl tracking-widest text-white transition hover:bg-punch-dark disabled:opacity-40"
      >
        {busy ? "MAKING YOUR LINK…" : "CREATE YOUR SQUAD FRAME →"}
      </button>

      <div className="mt-10 grid gap-4 text-left sm:grid-cols-3">
        {[
          ["1", "Create", "Get a shareable link — the link is the invite, nothing to sign up for."],
          ["2", "Share", "Send it to up to 3 teammates. They add their own photo + name."],
          ["3", "Generate", "Any visitor see the combined frame and can download the PNG."],
        ].map(([n, t, d]) => (
          <div key={n} className="rounded-2xl bg-forest/70 p-5 ring-1 ring-cream/10">
            <div className="font-display text-3xl text-punch">{n}</div>
            <div className="mt-1 font-display text-lg text-gold">{t}</div>
            <p className="mt-2 font-label text-xs leading-relaxed text-cream/70">{d}</p>
          </div>
        ))}
      </div>

      <p className="mt-10">
        <Link href="/" className="font-label text-sm text-cream/60 underline decoration-dotted underline-offset-4">
          ← back to formats
        </Link>
      </p>
    </section>
  );
}