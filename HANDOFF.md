# FIELD — handoff

Status as of 12 Nov 2026. Deadline: **Mon 16 Nov 2026, 11:59 pm PST**.
Steps 1–8 of the build order in `CLAUDE.md` are done and committed (step 8 = showcase site, deployed as a draft). Step 9 is not started.

## Run it

```bash
npm install
npm run dev -- --host --port 5174
```

- Site: `index.html`. Dev player: `dev.html` — press **Shift+D** for the dev panel (20 states, themes, accent test).
- URL params on the dev page: `?theme=putty|ink|liquid|holiday-snow|holiday-pine`, `?accent=%23RRGGBB`, `?w=<px>` (stage width), `?ua=ios` (fake iOS).
- In-app browser testing tip: a hidden pane freezes animations, transitions and ResizeObserver. Inject `.field *{animation:none!important;transition:none!important}` and read values from JS.

## Netlify

- Site: **field-skin** (Netlify account "Zazzy Gfx"), site ID `266ea379-c86c-4914-b0b8-0c2d0d64460f`.
- Current **draft**: https://6af5eb1e5cfd32b4567b639b--field-skin.netlify.app (needs a Netlify login to view).
- So far drafts only: `npm run build && npx netlify-cli deploy --dir dist`. Production (`--prod`) waits for step 8.

## Figma

- File key: `AptFt28rnaOfcI9SlAZl8Q`. Rule: pull one listed node at a time, never the whole page, never refetch.
- Used: `169:3` (components) and children `169:6`, `169:51`, `169:164`, `169:149`, `178:886`; `174:338`, `174:333` (XL player); `174:1011`; `180:629` (wheel, screenshot); `180:861` (M); `180:968` (XS); `174:809`, `174:922` (pause shelf).
- Not yet used (for step 8 site): `182:559` (desktop), `186:642` (mobile).

## What's built (steps 1–7)

1. **Skeleton** — ejected Video.js 10.3.0 HTML skin (`@videojs/html`, `@videojs/mux-video`), Mux stream, tokens wired, XL layout from Figma.
2. **Core controls** — play key, tape strip slider with chapters, rolling counter, ±10, volume, captions, settings menu, fullscreen, tooltips, hotkeys, keyboard focus, idle fade (2 s, locked while hovering/focused/menu open).
3. **Signature motion** — thumb-wheel volume, transport press, speed label + tray, seek hover ghost needle + storyboard frame, menus grow from their key.
4. **Fluid + phone** — container-query sizes on `.field > *` (XL ≥900, M 600–899, S 400–599, XS <400), sheets, double-tap seek thirds.
5. **States** — all 20 states in SPEC §10 (incl. no chapters, no captions, live, behind live, error, calm, more contrast), desktop pause shelf, dev panel.
6. **PiP** — Document PiP (Chrome/Edge desktop) 400×225 window with FIELD keys via a captureStream mirror; native PiP elsewhere; state 17. Confirmed working in Chrome by the designer.
7. **Themes** — Putty, Ink, Liquid, Holiday Snow, Holiday Pine via `data-field-theme`, accent override with contrast guard, full Liquid reduced-transparency fallback.

Main files: `src/field/field.ts` (mount), `field.css` (single stylesheet), `volume.ts`, `speed.ts`, `scrub.ts`, `states.ts`, `pip.ts`, `theme.ts`, `sounds.ts`, `counter.ts`, `bubble.ts`, `src/dev/panel.ts`.

## Decisions changed from the original kit

All are recorded in `SPEC.md`; designer overrides beat Figma.

- **Play key** — no progress meter. Icon-only, icon at 44% of the key, truly centred, always fully opaque (never Video.js's disabled fade). Big centred play key (Ready style) when paused.
- **Speed key** — always shows its label, with 7 ticks underneath. Label follows `ratechange` (not `data-rate`, which Video.js rewrites constantly). Tray rates 0.5–2×; opens on 350 ms hold or `<` / `>`.
- **Volume wheel** — keeps the Figma thumb-wheel look (180:629); the level-meter redesign was rejected. Behaviour: ribs roll one rib per detent; click jumps to a level, then drag (24 px/detent); scroll and ↑/↓, PageUp/PageDown, Home/End, Esc. Desktop opens on 250 ms hold or 400 ms hover; closes 1.5 s after last input, 600 ms after leaving the pill, Esc or outside click. Pointer cursor, not ew-resize.
- **Mobile is simpler** — tap opens the wheel, tap while open mutes. **iOS has no wheel** (tap mutes) and shows a one-time hint "Use your side buttons for volume". Pause shows only the big centred key (no shelf). The More sheet is one short list, 52 px rows, max one level deep (drill-down with Back).
- **Phone sizes** — keys 40 px visual with 44 px hit areas; play key 48 px visual.
- **Focus rings** — keyboard only (`:focus-visible`).
- **Tap-out** — tapping the picture or a sheet's scrim closes sheets, trays and menus.
- **Pause shelf** — desktop only, no Resume card; shows chapters (or jumps), Esc dismisses.
- **Quality order** — Auto first, then high → low (actual list reordered); "Auto (720p)" shown as "Auto" in the More sheet.
- **Captions track** — the stream's "Unknown language CC" track is hidden in every captions menu. Cue styles are injected into mux-video's shadow root; captions lifted clear of the strip.
- **Key sounds** — new feature: Web Audio tick / clunk / detent / menu. **Off by default**, toggle in Settings, saved in localStorage `field:key-sounds`, never plays while muted.
- **Themes + guard** — if `--field-accent` is under 3:1 against the key colour it is darkened in 4% steps (lightened on dark keys); translucent keys are judged over a dark frame; the original request is remembered so theme switches re-check from it. Known effect: default `#FF4D00` is 2.75:1 on Putty, so it renders as `#F54A00`. **Decided: keep the guard; `#F54A00` on Putty is fine.** Re-picking the same colour now re-runs the guard (fix in `theme.ts`).
- **Assets** — chapters and captions VTT live in `public/` (not `assets/`).

## What's left

**Step 8 — showcase site (done as a draft)**
- The Apple-style restyle was reverted (designer decision); the site is the FIELD look from Figma.
- Hero autoplay: plays muted at 50% in view with a "Tap for sound" chip; pauses when fully out unless the visitor took it over (sound on / own play), in which case the mini player docks.
- Theme tour: first play of a visit cycles Putty → Ink → Liquid → Holiday Snow → Holiday Pine (~1s each, 200ms crossfade, name chip), then Putty. Any tap/click/key stops it; `sessionStorage` `field:tour`; skipped under reduced motion.
- `index.html` is now the site (`src/site/`); the player alone with Shift+D lives at `dev.html`.
- Players are generated from `src/site/player.ts` (made from `dev.html`, ids numbered per player); the state forcing is shared in `src/dev/runner.ts`.
- Not built from the Figma: the "Made for two thumbs" phone section (upright/sideways renders + QR) and the GitHub link (no repo yet).
- Production deploy (`--prod`) still waits for the designer.

**Step 9 — checks + submit**
- Run `CHECKLIST.md` end to end and fix everything.
- axe: target 0 violations. Keyboard-only and real-phone pass.
- Check caption timings against the film (`public/captions-en.vtt` note).
- Reduced-transparency Liquid fallback has not been seen running (couldn't emulate it) — check on a real device.
- Check Liquid's phone More sheet (48% black glass) on a phone.
- Package `field.js` / `field.css` / `field.html` so the site's install steps are literally true.
- Lighthouse: the Video.js + HLS bundle is ~264 kB gzipped; check Performance ≥ 90.
- Real-phone pass on the site: mini player, dock, sheet drag, swatch carousel, state cards, gesture ticks.
- Submit to the Contra × Mux challenge before the deadline.
