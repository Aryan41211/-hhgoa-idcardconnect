# Setup

## Local

```bash
npx create-next-app@latest hhgoa-frame --typescript --tailwind --app
cd hhgoa-frame
npm install react-easy-crop heic2any
```

Drop the two template PNGs into `/public/templates/`. If they don't already have a transparent cutout where the photo goes, cut that window out once in an image editor (Photopea/Figma) and re-export before wiring up compositing — everything downstream depends on this.

```bash
npm run dev
```

## Deploy (do this in hour 1, before building features)

```bash
npm install -g vercel
vercel
```

Get the live URL working with an empty/placeholder page first. Confirms env vars, build config, and domain all work before you've built anything worth losing to a deploy surprise at hour 5.

## Env vars (if using Vercel Blob for image storage)

```
BLOB_READ_WRITE_TOKEN=...
```

Set in Vercel dashboard → Project → Settings → Environment Variables, then redeploy.

## Pre-submit

Test the deployed URL (not localhost) in an incognito window, on an actual phone, before filling the form at https://forms.gle/jM5hTaGvsrfEfixPA
