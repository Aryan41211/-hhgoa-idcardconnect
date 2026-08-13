import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "HH Goa 2026 — Frame Generator",
  description:
    "Upload a photo → get a branded HH Goa 2026 PFP frame or Builder ID card → download or share to X with #FrameInGoa.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Anton&family=Space+Mono:wght@400;700&family=Caveat:wght@400;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-forest-deep text-cream antialiased">
        <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
          <a href="/" className="font-display text-2xl tracking-widest text-gold">
            HH GOA <span className="font-label text-sm text-teal">2026</span>
          </a>
          <nav className="flex gap-4 font-label text-xs">
            <a href="/card" className="transition hover:text-gold">BUILDER ID</a>
            <a href="/idcard" className="transition hover:text-gold">ID CARD</a>
            <a href="/squad" className="transition hover:text-gold">SQUAD</a>
          </nav>
        </header>
        <main>{children}</main>
        <footer className="mx-auto mt-16 max-w-6xl border-t border-cream/10 px-5 py-8 text-center font-label text-xs text-cream/50">
          HACKER HOUSE GOA 2026 · MADE FOR BUILDERS · <span className="text-punch">{`#FrameInGoa`}</span>
        </footer>
      </body>
    </html>
  );
}
