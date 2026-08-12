# Architecture

## Routes

- `/` — format picker (Frame vs Builder ID vs Squad)
- `/frame` — Format A flow
- `/card` — Format B flow
- `/squad/[squadId]` — collaborative squad frame (stretch goal)
- `/r/[resultId]` — per-generation share page; renders nothing but an `<img>` and exists so `generateMetadata()` can set an OG image X will actually preview. This route is the whole reason link-sharing works — don't skip it if you're doing link-based share instead of direct image attach.
- `/api/save` — accepts a generated image (base64/blob), stores it, returns a `resultId`

## Client pipeline (Format A & B, same core)

1. **Input** — `<input type="file" accept="image/*">`. If `file.type` indicates HEIC/HEIF, convert via `heic2any` before anything else touches it.
2. **Downscale** — draw to an offscreen canvas capped at ~1600px on the longest edge. Do this before crop UI, not after — keeps mobile memory and canvas.toBlob fast.
3. **Crop/position** — `react-easy-crop` constrained to the frame's photo-slot aspect ratio (measure this from the template PNG's actual cutout, not a guess).
4. **Composite** — draw order matters: background → cropped photo → frame/overlay PNG on top → (Format B only) text fields via `ctx.fillText`. The frame PNG needs a transparent cutout where the photo shows through; if the provided templates are flat PNGs without alpha in the photo area, you'll need to cut that out once in an image editor and re-export a transparent-window version — check this in hour 1, it blocks everything else.
5. **Text (Format B)** — name, stack/role, and the generated builder title. Match the template's font (bold condensed display face for headers) — if the exact font isn't licensed/available, pick the closest free equivalent (e.g., Anton, Archivo Black) rather than defaulting to a system sans, since "on-brand" is a stated requirement.
6. **Export** — `canvas.toBlob('image/png')`. This blob is used for both the download link and the `/api/save` upload.
7. **Share** — Web Share API with the file where supported (mobile Safari/Chrome); fallback to the `/r/[resultId]` link + X intent URL with pre-filled caption + `#FrameInGoa`.

## Builder Title generator (Format B differentiator)

A hardcoded lookup table, not randomness: keyword in the stack/role field → matched against ~20-30 entries → witty title. Fallback to a small fixed pool (5-8 solid generic titles) if no keyword matches, so the field is never empty or awkward.

## Squad mode (stretch)

- `/squad/[squadId]` created on first generation, returns a shareable link.
- Server holds squad state: array of up to N photo slots + names, keyed by `squadId`.
- Teammate opens the link, sees which slots are filled, drops their photo into the next open one — no auth, just the link acting as the credential (fine for a shortlisting task, not for production).
- Recomposite the full squad frame server-side (or client-side on load) once all slots are viewed, so any visitor sees the current combined state.

## Storage

Whatever is fastest to wire up tonight: Vercel Blob (simplest, free tier) for images, or even a Postgres/SQLite row storing base64 if Blob setup eats time. Don't over-engineer this — it only needs to survive the length of the hackathon review window.
