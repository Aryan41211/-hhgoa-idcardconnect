# HH Goa 2026 — Frame Generator: Build Plan (Ship Tonight)

**Deadline: 11:59 PM, 13 Aug 2026 (TODAY).** This plan assumes 4–8 hours. No detours.

## 0. Decision — what you're building (5 min, no debate)

Build **both formats, one app, two tabs** — you already have both templates (solo PFP frame + squad frame), so the marginal cost of Format A vs A+B is small and "both" signals more shipped. If time runs short past hour 3, **cut Format B fields down to just name + stack**, never cut the share flow.

- **Format A (PFP frame):** upload → auto-crop into the frame → download/share.
- **Format B (Builder ID):** upload + name + stack/role + auto-generated "builder title" → card → download/share.

## 1. Stack (lock this in, don't relitigate later)

- **Next.js (App Router) + Vercel** — free, instant deploy, gives you a live link in one command, handles OG image generation natively via `next/og` (critical for the link-preview requirement).
- **Canvas rendering:** HTML5 `<canvas>` in the browser for compositing photo + frame PNG. No backend image processing needed — keeps it instant, works on mobile.
- **react-easy-crop** (or plain canvas pointer events) for the drag/zoom-to-fit-frame step — this is what makes "handles real photos: portrait, landscape, off-center crops" actually true instead of a hope.
- **HEIC support:** convert client-side with `heic2any` on upload before drawing to canvas (iPhone photos are HEIC — this will bite you if skipped).
- **Share to X:** `web-intent` URL (`https://twitter.com/intent/tweet?text=...&url=...`) pointing to a per-generation share page (`/r/[id]`) whose OG image IS the generated graphic — Twitter/X cards need a real URL, not a raw blob, so this is non-negotiable, see step 4.

## 2. The unique angle (don't skip — this is what separates you from 200 identical badge tools)

Everyone will submit "upload photo → slap frame → download." Differentiate with ONE of these (pick one, execute it well, don't try all three):

- **"Builder Title" generator with actual personality** — instead of a random title, parse the stack/role field and generate a title that's genuinely funny/specific ("Rust / Solidity" → "Chaos Engineer, Borrow-Checker Division") using a small hardcoded rules table (20–30 stack keywords → witty title), not a lorem-ipsum random picker. Judges will notice a static random string vs. something that reacts to their input.
- **Live "recruiting card" feel** — subtle canvas-based parallax/tilt on the result preview (CSS `transform` on mousemove, cheap, no library) so it feels like a real product, not a static export.
- **Squad mode that's actually collaborative** — a shareable link where a teammate opens it, drops their own photo into the next empty slot of the *same* squad frame, no login. This directly answers the site's own instruction ("use the generator to bring your teammates into one combined frame") and almost nobody else will build the collaborative version — most will make you screenshot 3 separate solo frames into one.

Recommendation given your timeline: do the **Builder Title rules table** (1 hour, guaranteed differentiation) and the **squad collaborative link** only if Format A+B core is done with 90+ min to spare. Skip the tilt effect unless you have leftover time — it's cosmetic.

## 3. Hour-by-hour

| Time | Task |
|---|---|
| Hr 1 | `npx create-next-app`, deploy empty shell to Vercel immediately (get a live URL working end-to-end before building anything — de-risks deploy surprises). Load both template PNGs as static assets. |
| Hr 2 | Upload + crop UI: file input (accept image/*, HEIC via heic2any) → react-easy-crop inside the frame's photo-slot aspect ratio → canvas composite of (frame PNG on top, cropped photo underneath). |
| Hr 3 | Format B fields (name, stack/role) rendered onto canvas via `ctx.fillText` with the event's font — check the PDF/template for font family, match weight/case (template uses a bold condensed display font for headers). Wire the Builder Title rules table. |
| Hr 4 | Download button (`canvas.toBlob` → `<a download>`). Share-to-X flow: generate a share page per result (see step 4) + intent link with caption pre-filled + `#FrameInGoa`. |
| Hr 5 | Mobile pass: test on an actual phone (not devtools emulation) — upload from camera roll, check touch drag-crop works, check canvas doesn't exceed mobile memory limits (downscale source image to ~1600px longest side before compositing). |
| Hr 6 (buffer) | Squad collaborative link if time allows. Otherwise: polish, fix the one ugliest bug, re-test the full upload→download→share loop 3 times end to end. Submit the form. |

## 4. The part people screw up: OG image / link preview

If you share via link (not direct image attach):
1. On generate, POST the canvas image (as base64 or blob) to a Next.js API route that stores it (Vercel Blob storage, free tier, or just base64 in a short-lived KV/DB row) and returns an id.
2. Create `/r/[id]/page.tsx` with `generateMetadata()` returning `openGraph.images = [imageUrl]`.
3. Test the actual OG output with a real validator before submitting — X's own card validator is currently unreliable/gone, so use **https://www.opengraph.xyz/** or paste the link straight into an X reply/DM to yourself and check the preview renders your image, not a blank card.
4. The intent link's `url` param points to `/r/[id]`, not your homepage.

If you'd rather skip all of this: attach the image directly via the Web Share API (`navigator.share({ files: [file] })`) on mobile where supported, with a manual "or download + attach it yourself" fallback on desktop — much less infra, slightly worse UX. Given your timeline, **this fallback is a legitimate choice** if hour 4 is running long.

## 5. Non-negotiable checklist before you submit the form

- [ ] Works with zero prior context — no login, no signup wall, first-visit stranger can complete the whole flow
- [ ] Upload → result feels instant (under ~3s), not a spinner screen
- [ ] Tested with a portrait phone photo AND a landscape photo AND an off-center/badly-cropped photo
- [ ] Tested on an actual phone browser, not just resized desktop window
- [ ] Download produces a real PNG file you can open outside the browser
- [ ] Share-to-X opens with caption + #FrameInGoa pre-filled, and the preview (if link-based) shows the real graphic
- [ ] Deployed URL works in an incognito window (catches auth/env-var leaks)
- [ ] Submitted at https://forms.gle/jM5hTaGvsrfEfixPA with the live link

## 6. Cut list if you're at hour 5 and behind

Cut, in this order: squad collaborative mode → Builder Title rules table (fall back to a short fixed list of 5 solid titles) → Format B entirely (ship Format A only, it's still a complete, valid submission) → mobile tilt/polish. **Never cut:** mobile usability, the share flow, or testing on a real photo instead of a clean square headshot.
