# HH Goa 2026 — Frame Generator

Upload a photo → get a branded HH Goa 2026 frame (PFP) or Builder ID card → download or share to X with `#FrameInGoa`. Plus **Squad mode**: a single shareable link where up to 4 teammates drop their own photos into one combined frame.

Built for the HH Goa 2026 shortlisting task. Deadline: 11:59 PM, 13 Aug 2026.

## What this is

- **Format A — PFP Frame:** wraps an uploaded photo in the HH Goa frame, ready as an X profile picture.
- **Format B — Builder ID Card:** photo + name + stack/role + an auto-generated "builder title" (keyword → witty title rules table, not a random string — try typing "Rust"), laid out like an event badge.
- **Official ID Card — Connect:** photo + full name + institution + department/program/roll no/campus + a unique card number + validity + status, rendered as a proper 1050×675 ID card with live preview and download/share.
- **Squad mode:** create a squad link → teammates open it, drop their photo + name into the next open slot, no login. Any visitor sees and can download the combined frame.

No login. No signup wall. Upload → result in one pass.

## Stack

Next.js (App Router) + TypeScript + Tailwind. Client-side canvas compositing with `react-easy-crop` (drag/zoom crop), `heic2any` (iPhone HEIC photos), and a programmatic canvas renderer that draws the full HH Goa 2026 brand (deep forest green, hot pink, gold, cream, torn-paper cards, stamp badge, `#FRAMEINGOA` chip) — no external template PNGs needed, so the whole pipeline is self-contained.

## Routes

- `/` — format picker
- `/frame` — Format A flow
- `/card` — Format B flow
- `/idcard` — official HH Goa 2026 ID card (photo, institution, roll no, unique card number) with live canvas preview
- `/squad` — create a squad → `/squad/[squadId]` collaborative frame
- `/r/[resultId]` — per-generation share page; `generateMetadata()` sets the OG image so X shows the actual graphic in link previews (this is why link-sharing works)
- `/api/save` — stores a generated image (base64), returns a `resultId`
- `/api/image/[resultId]` — serves the stored PNG (also the OG image URL)
- `/api/squad` + `/api/squad/[squadId]` — squad create / read / add-member

## Storage

Generated images and squads are stored to `.data/` on disk (filesystem-backed, works in dev and on any single-instance Node host — fine for the hackathon review window). To switch to Vercel Blob later, replace the read/write calls in `lib/storage.ts` and `lib/squadStore.ts`; see `.env.example`.

## Run locally

```bash
npm install
npm run dev
```

## Repo docs

- `ARCHITECTURE.md` — how the app is structured, data flow, canvas pipeline
- `BRAND.md` — colors, type, layout notes
- `TESTING.md` — the checklist to run before submitting
- `TODO.md` — the original hour-by-hour build plan

## Submit

Live link → https://forms.gle/jM5hTaGvsrfEfixPA

Upload a photo → get a branded HH Goa 2026 frame (PFP) or Builder ID card → download or share to X with `#FrameInGoa`.

Built for the HH Goa 2026 shortlisting task. Deadline: 11:59 PM, 13 Aug 2026.

## What this is

- **Format A — PFP Frame:** wraps an uploaded photo in the HH Goa frame, ready as an X profile picture.
- **Format B — Builder ID Card:** photo + name + stack/role + an auto-generated "builder title", laid out like an event badge.
- **Squad mode (stretch):** a shareable link that lets teammates add themselves into one combined frame, no login.

No login. No signup wall. Upload → result in one pass.

## Stack

Next.js (App Router) + Vercel, client-side canvas compositing, `react-easy-crop` for crop/zoom, `heic2any` for iPhone photos, `next/og` (or a `/r/[id]` share-page route) for the X link-preview image.

## Repo docs

- `TODO.md` — hour-by-hour build plan and cut list
- `ARCHITECTURE.md` — how the app is structured, data flow, canvas pipeline
- `BRAND.md` — colors, type, layout notes pulled from the provided templates
- `SETUP.md` — local dev + deploy steps
- `TESTING.md` — the checklist to run before submitting the form

## Submit

Live link → https://forms.gle/jM5hTaGvsrfEfixPA
