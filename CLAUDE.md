# FIELD — build instructions for Claude Code

You are building **FIELD**, a custom skin for **Video.js 10**, entered in the Video.js v10 Skins Design Challenge (Contra × Mux). Designer: Zazzy (@zazzygfx).

Deadline: **Monday Nov 16, 2026, 11:59 pm PST**. Ship something solid early, then polish.

## Read these first, in this order

1. `SPEC.md` — every behaviour, state and measurement. It is the source of truth.
2. `tokens.css` — all colours, sizes and themes. Never hard-code a colour in a component.
3. `reference/*.png` — the Figma board. Match it.
4. `CHECKLIST.md` — the contest minimums. Every box must be ticked before submitting.
5. `SITE.md` — the showcase page that wraps the player.
6. Video.js 10 docs: **https://videojs.org/llms.txt** (AI-ready index). Read the pages on skins, customize skins (ejecting), components, data attributes, accessibility and "Build with AI" before writing player code. Video.js 10 is in beta — trust the docs over memory.

## How to build the skin

- Start from an **ejected** Video.js 10 skin (HTML + CSS variant), then reshape it into FIELD. Do not fight a packaged skin with overrides.
- Drive visual state from the **`data-*` attributes** Video.js puts on its elements (`data-paused`, `data-muted`, `data-fullscreen`, …). Use JavaScript only where CSS cannot do it (thumb-wheel, speed cycle, pause shelf, counter roll).
- Layout reflows by the **player's own width** with CSS container queries, not the viewport (sizes XL / M / S / XS in SPEC §3).
- One stylesheet, themed entirely by the tokens in `tokens.css`.
- Licence: **Apache 2.0** (add `LICENSE` and headers).

## Media

- Mux playback ID: `xg9MkUaGPFpyU2KzNVDjS71fXdFNW1tEesnbzEBwkDU`
- HLS: `https://stream.mux.com/xg9MkUaGPFpyU2KzNVDjS71fXdFNW1tEesnbzEBwkDU.m3u8`
- Poster: `https://image.mux.com/xg9MkUaGPFpyU2KzNVDjS71fXdFNW1tEesnbzEBwkDU/thumbnail.webp?time=21`
- Scrub previews (storyboard): `https://image.mux.com/xg9MkUaGPFpyU2KzNVDjS71fXdFNW1tEesnbzEBwkDU/storyboard.vtt`
- Use the Video.js 10 HLS / Mux media element from the docs. Quality list comes from the stream's renditions.
- Film: *Caminandes 3: Llamigos* © Blender Foundation, CC BY 3.0 — **credit must appear on the site**.
- Chapters: `assets/chapters.vtt`. Captions: `assets/captions-en.vtt` (see note inside — must be checked against the film).

## Build order (stop and show the designer after each step)

1. **Skeleton** — ejected skin, Mux stream plays, tokens wired, XL layout matches `reference/01-player.png`.
2. **Core controls** — play key (meter inside), tape strip (slider), counter, ±10, volume key, captions, settings, fullscreen. Keyboard + focus. Idle fade.
3. **Signature motion** — thumb-wheel volume (SPEC §6), play-key transport press (§5), speed cycle + tray (§7), seek hover ghost needle (§4), menus grow from their key.
4. **Fluid + phone** — container-query sizes, upright and sideways phone, sheets, double-tap seek.
5. **States + fallbacks** — all 20 states in SPEC §10, including no chapters, no captions, live, error.
6. **PiP** — browser PiP + Document PiP window where supported; optional sticky mini player.
7. **Themes** — Putty, Ink, Liquid, Holiday Snow, Holiday Pine, plus accent override with contrast guard.
8. **Showcase site** (SITE.md) and deploy to **Netlify**.
9. Run CHECKLIST.md end to end. Fix everything. Run axe — target 0 violations.

## Working rules

- Small commits, each one runnable.
- After each step, take a screenshot and compare with the matching `reference/` image. Fix differences before moving on.
- Test with keyboard only and on a real phone at every step, not just at the end.
- If the docs and SPEC disagree on an API, follow the docs and tell the designer what changed.
- Do not add features that are not in SPEC. Calm beats clever.
