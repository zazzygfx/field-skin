# FIELD — skin specification

> A video player built like a field recorder. Putty keys with real weight over the picture. Time is a tape counter, volume is a thumb-wheel, and while you watch it all disappears except one orange needle.

Reference images live in `reference/`. Numbers here are CSS pixels at 1×.

---

## 1. Principles

1. **Hardware, not glass.** Solid keys, 1px edge, a 2px hard shadow (`0 2px 0`). No blur in the default material.

> **Overrides (designer, 12 Nov 2026):** these supersede Figma where they differ — the play keys are icon-only (no progress meter); the speed key always shows its label with 7 ticks under it.
2. **One accent.** It marks played time and the active choice. Nothing else is accent-coloured.
3. **Left = where, right = what.** Left pill: counter, −10, volume, +10. Right pill: captions, speed, PiP, settings, fullscreen. Play key far right, under the right thumb.
4. **Feedback at the source.** Bubbles, the wheel, the tray and menus grow out of the key that was pressed.
5. **Any video.** Chapters, captions, quality and live come from the stream. Every one has a designed fallback.
6. **Calm.** Controls disappear while watching. Motion is short and only answers a person's action.

---

## 2. Anatomy (XL, 1180 × 664 reference)

```
┌──────────────────────────────────────────────────────────────────────┐
│ [CH 4  Caminandes 3: Llamigos]  ← title chip (top-left, 28px inset)  │
│                                                                      │
│                         (picture stays clear)                        │
│                                                                      │
│ ╭────────────────────── tape strip (26px) ─────────────────────────╮ │
│ ╰──────────────────────────────────────────────────────────────────╯ │
│ ╭ 00 01 23 │ −10 │ 🔊 │ +10 ╮          ╭ CC │ 1.5× │ PiP │ ⚙ │ ⛶ ╮ ┌──┐│
│ ╰──────── left pill ───────╯          ╰────── right pill ───────╯ │▶ ││
│                                                                   └──┘│
└──────────────────────────────────────────────────────────────────────┘
```

| Part | Size | Notes |
|---|---|---|
| Inset from player edge | 28 (XL) · 20 (M) · 14 (S) · 10 (XS) | |
| Key | **48 × 48**, radius 10 | M3 minimum target. Label keys (−10, +10, 1.5×) min-width 48, padding 0 10 |
| Pill | padding 5 6, gap 6, radius 14 | background `--field-pill`, 1px `--field-edge`, hard shadow |
| Counter | height 48, padding 0 10, radius 8 | `--field-counter` bg, mono 15px, tracking 4%, **always `HH MM SS`** so width never jumps (S size: `MM:SS`) |
| Play key | **58 × 58**, radius 15 | icon only — see §5 |
| Pill ↔ play key gap | 8 | |
| Tape strip | height 26, radius 13, sits 12px above the key row, full inner width | **44px hit band** (invisible padding) |
| Title chip | padding 6 12 6 8, radius 9 | chapter badge only when chapters exist |
| Scrim | bottom 170px, linear transparent → `rgba(18,18,15,.62)` | only while controls are shown |

### Tape strip (the timeline)
- Inner padding 14px each side.
- **Track:** 4px, `--field-ink` at 18%. Split into chapter segments with 2px gaps when the stream has chapters; one continuous track when it doesn't.
- **Played:** 6px, `--field-accent`, radius 3.
- **Ticks:** every 5% of the inner width; every 5th tick is 6px tall, others 3px; `--field-ink` at 35%.
- **Needle (handle):** 3 × 20, `--field-ink`. Focus ring goes on the whole strip.
- Buffered range: `--field-ink` at 30% between played and buffered end (subtle).
- `role="slider"`, `aria-valuetext="1 minute 23 seconds of 2 minutes 30 seconds, chapter 4"`.

---

## 3. Fluid sizes (container queries on the player)

| Size | Player width | Left pill | Right pill | Notes |
|---|---|---|---|---|
| **XL** | ≥ 900 | counter · −10 · volume · +10 | captions · speed · PiP · settings · fullscreen | everything visible |
| **M** | 600–899 | counter · −10 · volume · +10 | captions · settings · fullscreen | speed + PiP move into Settings |
| **S** | 400–599 | counter (`MM:SS`) · volume | captions · settings · fullscreen | ±10 become double-tap left/right thirds |
| **XS** | < 400 | volume | captions · more | play key 52px; fullscreen moves into More |

Keys never shrink below 48px on desktop. They fold away instead. **Phone (touch, player < 600):** keys draw at a native 40px (play key 48px, icons 18px, pill padding 4 / gap 4, counter 13px) but every key keeps a 44px hit area through invisible padding. See `reference/05-fluid-sizes.png`, Figma 180:861 (phone sideways, M) and 180:968 (phone upright, XS).

- Thumb-wheel width: 300 (XL) · 240 (M ≥ 800, phone sideways) · 220 (M) · 180 (S, XS). At S and XS the right pill steps aside (fades out) while the wheel is open.
- Strip → key row gap: 13 (XL) · 11 (M) · 10 (S) · 8 (XS). Chip hidden at S and XS.
- At M and smaller, Settings gains a **Speed** chip row and a **Picture-in-picture** row; at XS the key is labelled **More** and also holds **Fullscreen**.
- The size steps are container queries on the player; they are set on the player's children (a container can't query itself).

---

## 4. Show / hide and seek hover

- **Watching (idle):** after **2 s** without input, controls, chip and scrim fade out (300 ms). Left behind: a **4px rail** at the very bottom — track `--field-key` 40%, played `--field-accent`. Cursor hides in fullscreen.
- **Wake:** pointer move, tap, or any key → fade in **180 ms**. Opacity only.
- Controls never hide while paused, while a menu is open, while focus is inside the controls, or while the pointer is over them.
- **Seek hover (pointer):** a **ghost needle** (2px, `--field-ink` 40%) follows the pointer on the strip, with a **counter tag** (ink bg, cream mono `00 01 47`) on a 1px hairline above it. When a storyboard exists, show a **frame preview** 256 × 144 (radius 12, 3px `--field-key` border) above the tag with `02:03 · Chapter 5`.
- **Scrub (drag):** same preview; the main counter **rolls** to the scrub time. Each counter character sits in its own fixed-width, clipped cell (tabular numbers), so a rolling digit never overlaps its neighbours.
- The preview + tag hide as soon as the pointer leaves the strip's 44px hit band, on `pointercancel`, and when the controls fade.

---

## 5. Play key (icon only — no ring, no meter)

- 58 × 58, radius 15, `--field-key`, 1px edge, hard shadow. Icon only: **44% of the key** (≈26px on 58), truly centred — no nudge. Same rule on the big centred key. Progress is shown by the strip and the idle rail, not the key.
- The right glyph is always rendered at full opacity (no crossfade through blank); play keys never take the 38% disabled look.
- States: Pause · Play · Replay (ended) · Loading/Buffering (the icon dims to 40%; the counter reads `-- -- --`) · Focus.
- **Big centred key:** 96 × 96 with the same icons, centred on the picture whenever the video is paused (not ended). Before the first play (Ready) it also shows the title and length under it, and nothing else is on the picture.
- **Press (tape-transport):**
  1. 0–80 ms: key sinks 2px (`translateY(2px)`, shadow → 0, 12% ink layer); pause bars slide together.
  2. 80–180 ms: bars become the triangle as the key rises. Easing `cubic-bezier(.2,0,0,1)`.
- Hover: lift 1px, 8% layer. Reduced motion: no translate, instant icon swap.

---

## 6. Volume thumb-wheel (signature)

Figma 178:886 (component) and 180:629 (open in place).

- **Where:** it opens **inside the left pill, at the volume key**. While open, −10 and +10 fold away; the counter stays; the pill widens to the right into the empty middle. Right pill and play key never move.
- **Open (desktop):** hold the volume key ≥ 250 ms, **or** press ↑/↓, **or** hover 400 ms. A plain click = **mute / unmute**.
- **Open (touch):** **tap** the volume key (no long-press). While the wheel is open the key shows the level, and tapping the key then mutes / unmutes.
- **Wheel:** 300 × 48 at XL (220 at M, 180 at XS). Ink slot (radius 9, inner shadow) holding a **drum**: horizontal gradient `--field-drum-lo → --field-drum-hi → --field-drum-lo`, with 26 ribs whose spacing follows a cylinder (dense at the edges, fading out). Accent **index line** in the centre. **10 detent bars** under the slot, filled with accent up to the level. Normal pointer cursor (no resize arrows).
- **Input:** click anywhere on the wheel to jump to that level; drag sideways to roll it (1 detent per 24px); mouse wheel / trackpad and ↑/↓ step by 1; on the focused wheel also ←/→ (±1), PageUp/PageDown (±3), Home/End. Each detent: the ribs roll by one rib (120 ms), the key does a 1-frame sink and shows the new number, a tiny tick plays (if Key sounds are on), optional 8 ms vibration on Android.
- **Key shows the level:** while open, the volume key turns accent and shows the number `0–10` in mono 18px. At 0 the key turns `--field-counter` (muted).
- **Close:** 1.5 s after the last input, 600 ms after the pointer leaves the pill, on Esc, or on a click outside. The wheel rolls back into the key (220 ms) and −10/+10 return; the number stays 600 ms, then the speaker icon returns.
- `role="slider"`, `aria-valuemin=0`, `aria-valuemax=10`, `aria-valuetext="Volume 7 of 10"`.
- **iPhone / iPad:** iOS can't set video volume (detected by user agent, including iPadOS reporting as a Mac — newer iOS accepts a value but ignores it, so a probe can't be trusted). No wheel at all: tap = mute / unmute. The first tap shows a bubble once: `Use your side buttons for volume`. Desktop + Android get the wheel.

---

## 7. Speed

- **Click/tap** cycles: 1 → 1.25 → 1.5 → 2 → 0.5 → 1. The label (`1×`, `1.25×`, …) is **always visible**; it crossfades (140 ms) only when the speed actually changes. A row of **7 tiny ticks** sits under the label inside the key (accent up to the current speed's position in 0.5–2); the ticks never cover the label.
- **Hold (≥ 350 ms) or `<` `>`** opens the **tray**: 7 keys (0.5, 0.75, 1, 1.25, 1.5, 1.75, 2) growing out of the speed key, active one in accent. One tap each. Esc closes.
- At M and smaller, speed lives in Settings / More as chips.

---

## 8. Menus, shelf and sheets

All grow from the key that opened them. Tapping the picture or a sheet's scrim closes an open sheet, tray or menu. `transform-origin` = that key, `scale(.92) → 1` + fade, 180 ms. Esc closes and returns focus to the key.

- **Settings (XL/M):** 340 wide, radius 18, `--field-pill` 97%. Groups: **Quality** (from the stream; hidden on single-rendition files) and **Captions** (from the stream). Rows 44px high, radius 9, selected row `--field-counter` with accent value text.
- **Pause shelf (XL/M, desktop only):** top-right, 300 wide. **Start over** · then either **Chapters** (titles + times from the chapters track, current one highlighted) **or**, with no chapters, quick jumps −30s −10s +10s +30s. Small `Esc hide` hint below. See `reference/06-pause-settings.png`. Figma 174:809 (chapters) / 174:922 (quick jumps). The title chip reads `Paused at 01:23` while the shelf shows; the 96px centred play key shows too. The shelf only appears after playback has started, never while ended, scrubbing, in error or in PiP. Esc hides it until the next pause.
- **Touch (pointer: coarse):** pausing shows **only the big centred play key** over the picture — no shelf, no sheet opens by itself. The centre key is resume (there is no Resume card anywhere).
- **More sheet (touch):** M3 bottom sheet (upright) or side sheet (sideways) — 28px top radius, 32 × 4 handle, safe-area padding, scrim 40%. **One short list, 52px rows, current value on the right:** `Speed 1× ›` · `Quality Auto ›` · `Captions English ›` · `Chapters ›` · `Picture-in-picture` · `Key sounds Off` (plus `Fullscreen` at XS, where the fullscreen key folds away). A row with › slides to its choices with a **Back** row at the top; **Chapters** holds `Start over` first, then the chapters. Max one level deep. 44px+ targets, no tap highlight, `:active` press feedback.
- **Phone sideways:** M3 side sheet from the right, 300 wide, left radius 24.

---

## 9. Keyboard

| Key | Action |
|---|---|
| Space / K | play / pause |
| J / L or ← / → | −10 s / +10 s |
| ↑ / ↓ | volume ±1 (opens wheel) |
| M | mute |
| C | captions |
| < / > | speed down / up |
| P | picture-in-picture |
| F | fullscreen |
| 0–9 | jump to 0–90% |
| Esc | close menu / sheet / shelf |

- **Focus ring:** 2px `--field-ink` + 3px `--field-paper` halo (inverted on dark materials). Only for `:focus-visible` — never for a tap or click (menu rows included).
- **Hint bar:** after the first keyboard action, a small bar at top centre lists the keys for 4 s. Never shown for mouse/touch users.
- Tooltips on hover/focus: label + key cap (`Pause  K`), M3 plain tooltip, 24px tall, ink background.

---

## 10. States (see `reference/07-every-state.png`)

| # | State | What it looks like |
|---|---|---|
| 01 | Ready | Big play key (96px) centred, title + length under it. Nothing else. |
| 02 | Loading | Play-key icon dims to 40%; counter reads `-- -- --`. |
| 03 | Scrubbing | Frame preview + time + chapter; counter rolls. |
| 04 | Seek ±10 | Accent bubble grows from the pressed key: `+10s → 01:33`. Double-tap sides on touch. |
| 05 | Volume | Wheel open in place (§6). |
| 06 | Muted | Volume key turns `--field-counter`; bubble `Muted · tap to unmute`. |
| 07 | Speed | Tray open from the speed key. |
| 08 | Captions on | Captions key accent. Cue box: ink 86%, cream text, sits **above the strip** and rises when controls show. |
| 09 | No captions | Captions key at 38% + tooltip `No captions for this video`. |
| 10 | Keyboard | Focus ring + tooltip + hint bar. |
| 11 | Buffering | Play-key icon dims to 40%, counter `-- -- --`; strip keeps the real position. |
| 12 | Ended | Key = Replay icon, `Watch again?` centred. |
| 13 | Error | Card: `Can’t play this video` / `The stream stopped responding. Check your connection and try again.` / **Try again**. Controls dim to 30%. |
| 14 | Live | Counter shows ● `LIVE`; strip = DVR window, needle at the edge; +10 disabled at the edge. |
| 15 | Behind live | Counter `−00 00 42`; accent **Go to live** chip next to the title chip. |
| 16 | Long video | Counter stays `HH MM SS` (e.g. `01 47 09`). |
| 17 | PiP active | Picture dims; `Playing in picture-in-picture` + **Bring it back here**. |
| 18 | More contrast | Solid white pills, 2px ink edges on keys and strip. |
| 19 | No chapters | Strip becomes a single line; chip shows title only. |
| 20 | Calm | Reduced motion / transparency / contrast / forced colours — see §13. |

---

## 11. Picture-in-picture

- **PiP key** (XL) or More → Picture-in-picture. `P` key.
- Use **Document Picture-in-Picture** where supported (Chrome/Edge desktop, pointer: fine): a 400 × 225 window with FIELD keys — back-to-tab (top-left), close (top-right), −10 · play key · +10 (centre) — and a 4px progress rail. The window shows a live mirror of the player (`captureStream`), so the real video and Video.js stay in the page and keep the audio; keys fade after 2 s idle; Space/K, J/L, ←/→, Esc work inside it. Back-to-tab closes the window and keeps playing; close also pauses. Elsewhere (Safari, Firefox, phones) the browser's native video PiP is used.
- Main player shows state 17 while PiP is active.
- **Optional sticky mini player** (site setting): when the player scrolls out of view while playing, dock a 320 × 180 mini player bottom-right with play key, close and counter. Draggable to any corner. Off by default in the skin, on for the showcase site.

---

## 12. Phone (see `reference/09-phone.png`)

- **Upright (XS):** inside the page, keys = volume (mute only on iPhone) · captions · more · play. Double-tap left/right third = ∓10 s with a ripple on that side. Drag anywhere on the strip to scrub; preview rides above the thumb.
- **Sideways / fullscreen:** full-bleed, M layout, keys under both thumbs, middle stays picture.
- Respect safe areas (`env(safe-area-inset-*)`).

---

## 13. Themes and accessibility modes

Tokens in `tokens.css`. Set on the player: `data-field-theme="putty|ink|liquid|holiday-snow|holiday-pine"`, accent via `--field-accent`.

- **Accent guard:** at runtime, if `--field-accent` has < 3:1 contrast against `--field-key`, darken it in 4% steps until it passes (on dark keys — Ink, Pine — where darkening can't help, lighten in 4% steps instead). Translucent keys (Liquid) are judged over a dark frame. The requested accent is remembered, so switching theme re-checks it from the original. Note: the default orange `#FF4D00` is 2.75:1 on Putty keys, so the guard renders it as `#F54A00` (3.0:1) — designer decision (12 Nov): keep the guard, no exemption for the brand orange. Text on accent uses `--field-on-accent`.
- **Switching:** set `data-field-theme` on the player at any time; the guard re-runs. The dev page also takes `?theme=ink|liquid|holiday-snow|holiday-pine` and `?accent=%23FFE14D`, and the Shift+D panel has theme buttons.
- `prefers-reduced-motion`: no translate, no roll, no scale; fades only; loading sweep → `LOADING` in the counter.
- `prefers-reduced-transparency`: Liquid → Putty (every surface solid: keys, pills, panels, counter, drum); pill alpha → 1.
- `prefers-contrast: more`: state 18.
- `forced-colors: active`: keys `ButtonFace`/`ButtonText`, needle and focus `Highlight`.

---

## 14. Motion table

| Element | Trigger | What moves | Time · easing | Reduced motion |
|---|---|---|---|---|
| Controls show/hide | pointer, tap, key · 2 s idle | opacity | 180 in · 300 out · ease-out | same |
| Key press | pointer / touch / Space | translateY 2px, shadow 0, 12% layer | 90 down · 140 up | layer only |
| Play ↔ pause | click, K, Space | bars → triangle | 180 · `cubic-bezier(.2,0,0,1)` | instant swap |
| Volume wheel | hold volume, ↑↓, scroll, click | pill width + wheel clip; ribs roll one rib per detent | 220 open/close · 120 per detent · 1.5 s idle · 600 ms after leave | opens in place, no roll |
| Speed | click / hold | label crossfade (on change only), ticks; tray grows | 140 · tray 200 | instant |
| Menus & sheets | settings, more, pause | scale .92→1 from key + fade; sheets slide 24px | 180 · 220 | fade only |
| Seek hover / scrub | pointer, drag, J/L | ghost needle + tag; counter digits roll | 1:1 with pointer | digits change |

Animate only `transform` and `opacity`.

---

## 15. Dev state panel

On the dev page, **Shift+D** opens a panel that forces the player into each of the 20 states above (and Reset). It sets `data-field-force` on the player; it is not part of the skin.

## 16. Copy

Sentence case everywhere in the player. Action names stay the same through a flow ("Try again" → retries).
