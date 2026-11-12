# FIELD — submission checklist

Deadline: **Mon Nov 16, 2026, 11:59 pm PST** (Tue Nov 17, 8:59 am Lagos). Aim to submit by Sunday night.

## Contest minimums (all required)

- [ ] Public working URL, built on **Video.js 10**
- [ ] Play / pause
- [ ] Seek (strip drag, click, keyboard)
- [ ] Current time + duration visible (counter; remaining on hover/tag)
- [ ] Volume + mute
- [ ] Fullscreen
- [ ] Responsive: desktop **and** mobile (upright + sideways tested on a real phone)
- [ ] Keyboard operable, **visible focus** on every control
- [ ] Readable over any video (solid pills, scrim, captions box)
- [ ] Touch targets ≥ 44px (FIELD uses 48)
- [ ] `prefers-reduced-motion` is calm
- [ ] Apache 2.0 licence in the repo

## Bonus points

- [ ] **+1 Mux** — stream plays from playback ID `xg9MkUaGPFpyU2KzNVDjS71fXdFNW1tEesnbzEBwkDU`
- [ ] **+1 live real site** — Netlify showcase page is public

## FIELD-specific

- [ ] Play key icon only (no ring, no meter); dims while loading; big 96px key when paused
- [ ] Volume thumb-wheel opens **in place** in the left pill; tap = mute; closes on idle/leave/Esc/outside; iPhone = mute only
- [ ] Speed click-cycle + hold tray
- [ ] Seek hover ghost needle + tag + storyboard preview
- [ ] Pause shelf with chapters / quick-jump fallback
- [ ] Settings shows only what the stream offers
- [ ] All 20 states from SPEC §10 reachable
- [ ] PiP (native + Document PiP where supported)
- [ ] Container-query sizes XL / M / S / XS
- [ ] Themes: Putty, Ink, Liquid, Holiday Snow, Holiday Pine + accent guard
- [ ] Captions file checked against the film

## Quality

- [ ] axe DevTools: 0 violations (screenshot the result for the site)
- [ ] Lighthouse Accessibility 100, Performance ≥ 90
- [ ] Keyboard-only run: start to end without a mouse
- [ ] Screen reader smoke test (VoiceOver): play, seek, volume, captions announce properly
- [ ] Chrome, Safari, Firefox desktop; Safari iOS; Chrome Android
- [ ] Slow network (Fast 3G throttle): loading + buffering states look right
- [ ] Forced colours (Windows high contrast or emulation) still usable

## Credits on the site

- [ ] *Caminandes 3: Llamigos* © Blender Foundation, CC BY 3.0, with link
- [ ] Mux, Video.js 10
- [ ] Designer: Zazzy (@zazzygfx)

## Contra post

- [ ] Title + one-line idea ("A video player built like a field recorder")
- [ ] Live site URL + repo URL
- [ ] 4–6 images: hero, volume wheel, play key, Make it yours, phone, states
- [ ] 20–30 s screen recording: wake controls → roll volume → press play → change theme → phone
- [ ] Short write-up: the idea, left = where / right = what, any-video fallbacks, accessibility
