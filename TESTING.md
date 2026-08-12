# Testing Checklist — run before submitting

## Functional

- [ ] Upload a jpg — works
- [ ] Upload a png — works
- [ ] Upload a HEIC (real iPhone photo, not a renamed jpg) — converts and works
- [ ] Upload a portrait photo — crop UI doesn't clip the subject weirdly
- [ ] Upload a landscape photo — same
- [ ] Upload a badly off-center photo — crop lets you actually fix it, not just auto-center-crop blindly
- [ ] Generate result — feels near-instant, no long spinner
- [ ] Download button — produces an openable PNG file, not a broken/empty file
- [ ] Format B: name + stack/role fields render on the card, legible, not clipped
- [ ] Builder title generator — produces a real title reacting to the entered stack, not a placeholder

## Share flow

- [ ] Share-to-X button opens X with caption pre-filled
- [ ] `#FrameInGoa` is in the caption
- [ ] If link-based: paste the `/r/[id]` link somewhere (a DM to yourself, or opengraph.xyz) and confirm the preview image is the actual generated graphic, not blank/default
- [ ] If Web-Share-API-based: confirm the actual image file attaches on a real mobile browser, not just a link

## Environment

- [ ] Test the deployed Vercel URL, not localhost
- [ ] Test in an incognito window (catches auth/session assumptions you didn't mean to add)
- [ ] Test on an actual phone browser (not just a resized desktop window)
- [ ] No login wall or signup gate appears anywhere in the flow

## Before hitting submit

- [ ] Live link loads instantly and correctly on first visit
- [ ] Form filled at https://forms.gle/jM5hTaGvsrfEfixPA with the correct live URL
