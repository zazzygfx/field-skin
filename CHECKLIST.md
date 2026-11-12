# FIELD — submission checklist

Deadline: **Mon Nov 16, 2026, 11:59 pm PST** (Tue Nov 17, 8:59 am Lagos). Aim to submit by Sunday night.

## Contest minimums (all required)

- [x] Public working URL, built on **Video.js 10**
- [x] Play / pause
- [x] Seek (strip drag, click, keyboard)
- [x] Current time + duration visible (counter; remaining on hover/tag)
- [x] Volume + mute
- [x] Fullscreen
- [ ] Responsive: desktop **and** mobile (upright + sideways tested on a real phone)
- [x] Keyboard operable, **visible focus** on every control
- [x] Readable over any video (solid pills, scrim, captions box)
- [x] Touch targets ≥ 44px (FIELD uses 48)
- [x] `prefers-reduced-motion` is calm
- [x] Apache 2.0 licence in the repo

## Bonus points

- [x] **+1 Mux** — stream plays from playback ID `xg9MkUaGPFpyU2KzNVDjS71fXdFNW1tEesnbzEBwkDU`
- [x] **+1 live real site** — Netlify showcase page is public

## FIELD-specific

- [x] Play key icon only (no ring, no meter); dims while loading; big 96px key when paused
- [x] Volume thumb-wheel opens **in place** in the left pill; tap = mute; closes on idle/leave/Esc/outside; iPhone = mute only
- [x] Speed click-cycle + hold tray
- [x] Seek hover ghost needle + tag + storyboard preview
- [x] Pause shelf with chapters / quick-jump fallback
- [x] Settings shows only what the stream offers
- [x] All 20 states from SPEC §10 reachable
- [x] PiP (native + Document PiP where supported)
- [x] Container-query sizes XL / M / S / XS
- [x] Themes: Putty, Ink, Liquid, Holiday Snow, Holiday Pine + accent guard
- [x] Captions file checked against the film

## Quality

- [x] axe DevTools: 0 violations (screenshot the result for the site)
- [x] Lighthouse Accessibility 100, Performance ≥ 90
- [x] Keyboard-only run: start to end without a mouse
- [ ] Screen reader smoke test (VoiceOver): play, seek, volume, captions announce properly
- [ ] Chrome, Safari, Firefox desktop; Safari iOS; Chrome Android
- [ ] Slow network (Fast 3G throttle): loading + buffering states look right
- [x] Forced colours (Windows high contrast or emulation) still usable

## Credits on the site

- [x] *Caminandes 3: Llamigos* © Blender Foundation, CC BY 3.0, with link
- [x] Mux, Video.js 10
- [x] Designer: Zazzy (@zazzygfx)

## Contra post

- [ ] Title + one-line idea ("A video player built like a field recorder")
- [ ] Live site URL + repo URL
- [ ] 4–6 images: hero, volume wheel, play key, Make it yours, phone, states
- [ ] 20–30 s screen recording: wake controls → roll volume → press play → change theme → phone
- [ ] Short write-up: the idea, left = where / right = what, any-video fallbacks, accessibility


## Step 9 results (12 Nov 2026)

- **axe-core 4:** 0 violations on the site (desktop 1440 with all players mounted, phone 390 touch) and on the player page. Screenshots: `docs/audit/axe-*.png`; raw results: `docs/audit/audit.json`.
- **Live:** https://field-skin.netlify.app (public) · **Repo:** https://github.com/zazzygfx/field-skin (public, Apache 2.0). Lighthouse on the live site: mobile 93 / desktop 90 performance, 100 accessibility, best practices and SEO.
- **Lighthouse 12** (local production build): mobile Performance 98, desktop 97; Accessibility, Best Practices and SEO 100 on both. Reports: `docs/audit/lighthouse-*.html`.
- **Keyboard-only:** 79 Tab stops through the whole site, every one with a visible focus ring (the seek needle's ring is drawn on the whole strip); K plays, L skips 10 s on the focused player.
- **Reduced motion:** no theme tour, transitions cut to ~0. **Reduced transparency:** Liquid turns solid (no backdrop blur). **Forced colours:** keys and desk stay drawn (`docs/audit/forced-colors-*.png`).
- **Captions:** cue times set from the soundtrack's loudness (0.25 s steps), the storyboard frame at each moment and Mux's auto-generated track. Not listened to by ear — worth one watch with sound before the Contra post.
- **Still to do by hand:** real-phone pass (upright + sideways, iPhone Safari, Android Chrome), Safari / Firefox desktop, VoiceOver smoke test, Fast 3G throttle, and the Contra post.
