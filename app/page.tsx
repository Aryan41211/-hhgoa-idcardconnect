export default function HomePage() {
  return (
    <section className="mx-auto max-w-4xl px-5 pb-16">
      <div className="pt-10 text-center">
        <p className="font-label text-xs uppercase tracking-[0.3em] text-teal">Hacker House Goa · 2026</p>
        <h1 className="mt-3 font-display text-6xl leading-none tracking-wide text-gold sm:text-7xl">
          THE BUILDERS<br />ARE HERE.
        </h1>
        <p className="mx-auto mt-4 max-w-xl font-label text-sm leading-relaxed text-cream/70">
          Drop in your photo, pick a format, and ship a branded HH Goa 2026 frame in
          seconds. Share it with <span className="text-punch">#FrameInGoa</span> — no login, no signup.
        </p>
      </div>

      <div className="mt-12 grid gap-6 sm:grid-cols-2">
        <a
          href="/idcard"
          className="group rounded-3xl bg-forest/80 p-8 ring-1 ring-cream/15 transition hover:-translate-y-1 hover:ring-gold/60"
        >
          <div className="text-4xl">🎫</div>
          <h2 className="mt-4 font-display text-3xl tracking-wide text-cream group-hover:text-gold">
            OFFICIAL ID CARD
          </h2>
          <p className="mt-2 font-label text-xs text-cream/65">
            Photo, institution, roll no and a unique card number on a proper event badge.
          </p>
          <span className="mt-6 inline-block rounded-full bg-punch px-5 py-2 font-display text-sm tracking-widest text-white">
            START →
          </span>
        </a>

        <a
          href="/squad"
          className="group rounded-3xl bg-forest/80 p-8 ring-1 ring-cream/15 transition hover:-translate-y-1 hover:ring-gold/60"
        >
          <div className="text-4xl">👥</div>
          <h2 className="mt-4 font-display text-3xl tracking-wide text-cream group-hover:text-gold">
            SQUAD ID CARD
          </h2>
          <p className="mt-2 font-label text-xs text-cream/65">
            One link. Three teammates. No login — everyone drops their own photo into the
            same combined frame.
          </p>
          <span className="mt-6 inline-block rounded-full bg-punch px-5 py-2 font-display text-sm tracking-widest text-white">
            START →
          </span>
        </a>
      </div>
    </section>
  );
}
