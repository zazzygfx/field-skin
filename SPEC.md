# FIELD — skin specification

> A video player built like a field recorder. Putty keys with real weight over the picture. Time is a tape counter, volume is a thumb-wheel, and while you watch it all disappears except one orange needle.

Reference images live in `reference/`. Numbers here are CSS pixels at 1×.

---

## 1. Principles

1. **Hardware, not glass.** Solid keys, 1px edge, a 2px hard shadow (`0 2px 0`). No blur in the default material.
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
| Play key | **58 × 58**, radius 25% (≈14) | progress meter inside — see §5 |
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

Keys never shrink below 48px. They fold away instead. See `reference/05-fluid-sizes.png`.

---

## 4. Show / hide and seek hover

- **Watching (idle):** after **2 s** without input, controls, chip and scrim fade out (300 ms). Left behind: a **4px rail** at the very bottom — track `--field-key` 40%, played `--field-accent`. Cursor hides in fullscreen.
- **Wake:** pointer move, tap, or any key → fade in **180 ms**. Opacity only.
- Controls never hide while paused, while a menu is open, while focus is inside the controls, or while the pointer is over them.
- **Seek hover (pointer):** a **ghost needle** (2px, `--field-ink` 40%) follows the pointer on the strip, with a **counter tag** (ink bg, cream mono `00 01 47`) on a 1px hairline above it. When a storyboard exists, show a **frame preview** 256 × 144 (radius 12, 3px `--field-key` border) above the tag with `02:03 · Chapter 5`.
- **Scrub (drag):** same preview; the main counter **rolls** to the scrub time.

---

## 5. Play key (no ring — progress lives inside the key)

- 58 × 58, radius 14, `--field-key`, 1px edge, hard shadow. Icon 40% of key, centred, nudged up 6%.
- **Meter:** 56% of key width, 3px tall, 20% from the bottom. Chapter segments (1px gaps) filled with `--field-accent` up to current time. No chapters → one continuous line. See `reference/02-play-key.png`.
- States: Pause · Play · Replay (meter full) · Loading (meter shows a sweeping segment) · Focus.
- **Press (tape-transport):**
  1. 0–80 ms: key sinks 2px (`translateY(2px)`, shadow → 0, 12% ink layer); pause bars slide together.
  2. 80–180 ms: bars become the triangle as the key rises. Easing `cubic-bezier(.2,0,0,1)`.
  3. On pause: the meter flashes once (white 60% → 0, 300 ms) so you see where you stopped.
- Hover: lift 1px, 8% layer. Reduced motion: no translate, instant icon swap.

---

## 6. Volume thumb-wheel (signature)

See `reference/03-motion.png` (A) and `reference/04-volume-in-place.png`.

- **Where:** it opens **inside the left pill, at the volume key**. While open, −10 and +10 fold away; the counter stays; the pill widens to the right into the empty middle. Right pill and play key never move.
- **Open:** click/tap the volume key and hold ≥ 250 ms, **or** press ↑/↓, **or** hover 400 ms (pointer). Plain tap = **mute / unmute**.
- **Wheel:** 300 × 48 at XL (220 at M, 180 at XS). Ink slot (radius 9, inner shadow) holding a **drum**: horizontal gradient `--field-drum-lo → --field-drum-hi → --field-drum-lo`, with ~26 ribs whose spacing follows a cylinder (dense at the edges, fading out). Accent **index line** in the centre. **10 detent bars** under the slot, filled with accent up to the level.
- **Input:** drag sideways on the wheel (1 detent per 24px), mouse wheel / trackpad, ↑/↓ (±1), PageUp/PageDown (±3). Each detent: ribs shift by one, key does a 1-frame sink, optional 8 ms vibration on Android.
- **Key shows the level:** while open, the volume key turns accent and shows the number `0–10` in mono 18px. At 0 the key turns `--field-counter` (muted).
- **Close:** 1.5 s after the last input the wheel rolls back into the key (220 ms); the number stays 600 ms, then the speaker icon returns.
- `role="slider"`, `aria-valuemin=0`, `aria-valuemax=10`, `aria-valuetext="Volume 7 of 10"`.
- **iPhone:** browsers can't set volume. Hide the wheel; the key only mutes. Desktop + Android get the wheel.

---

## 7. Speed

- **Click/tap** cycles: 1 → 1.25 → 1.5 → 2 → 0.5 → 1. Label crossfades (140 ms). A row of **7 tiny ticks** inside the key shows the position.
- **Hold (≥ 350 ms) or `<` `>`** opens the **tray**: 7 keys (0.5, 0.75, 1, 1.25, 1.5, 1.75, 2) growing out of the speed key, active one in accent. One tap each. Esc closes.
- At M and smaller, speed lives in Settings / More as chips.

---

## 8. Menus, shelf and sheets

All grow from the key that opened them: `transform-origin` = that key, `scale(.92) → 1` + fade, 180 ms. Esc closes and returns focus to the key.

- **Settings (XL/M):** 340 wide, radius 18, `--field-pill` 97%. Groups: **Quality** (from the stream; hidden on single-rendition files) and **Captions** (from the stream). Rows 44px high, radius 9, selected row `--field-counter` with accent value text.
- **Pause shelf (XL/M):** top-right, 300 wide. **Resume** (accent, shows `from 01:23`) · **Start over** · then either **Chapters** (titles + times from the chapters track, current one highlighted) **or**, with no chapters, quick jumps −30s −10s +10s +30s. Small `Esc hide` hint below. See `reference/06-pause-settings.png`.
- **Phone upright:** M3 bottom sheet — 28px top radius, 32 × 4 handle, 48px rows, scrim 40%. *More* sheet = speed chips, captions chips, quality, PiP, fullscreen. *Pause* sheet = Resume, Start over, chapters.
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

- **Focus ring:** 2px `--field-ink` + 3px `--field-paper` halo (inverted on dark materials). Only for `:focus-visible`.
- **Hint bar:** after the first keyboard action, a small bar at top centre lists the keys for 4 s. Never shown for mouse/touch users.
- Tooltips on hover/focus: label + key cap (`Pause  K`), M3 plain tooltip, 24px tall, ink background.

---

## 10. States (see `reference/07-every-state.png`)

| # | State | What it looks like |
|---|---|---|
| 01 | Ready | Big play key (120px) centred, title + length under it. Nothing else. |
| 02 | Loading | Meter sweep inside the play key; counter reads `-- -- --`. |
| 03 | Scrubbing | Frame preview + time + chapter; counter rolls. |
| 04 | Seek ±10 | Accent bubble grows from the pressed key: `+10s → 01:33`. Double-tap sides on touch. |
| 05 | Volume | Wheel open in place (§6). |
| 06 | Muted | Volume key turns `--field-counter`; bubble `Muted · tap to unmute`. |
| 07 | Speed | Tray open from the speed key. |
| 08 | Captions on | Captions key accent. Cue box: ink 86%, cream text, sits **above the strip** and rises when controls show. |
| 09 | No captions | Captions key at 38% + tooltip `No captions for this video`. |
| 10 | Keyboard | Focus ring + tooltip + hint bar. |
| 11 | Buffering | Meter sweep; strip keeps the real position. |
| 12 | Ended | Meter full, key = Replay, `Watch again?` centred. |
| 13 | Error | Card: `Can’t play this video` / `The stream stopped responding. Check your connection and try again.` / **Try again**. Controls dim to 30%. |
| 14 | Live | Counter shows ● `LIVE`; strip = DVR window, needle at the edge; +10 disabled at the edge. |
| 15 | Behind live | Counter `−00 00 42`; accent **Go to live** chip next to the title chip. |
| 16 | Long video | Counter stays `HH MM SS` (e.g. `01 47 09`). |
| 17 | PiP active | Picture dims; `Playing in picture-in-picture` + **Bring it back here**. |
| 18 | More contrast | Solid white pills, 2px ink edges on keys and strip. |
| 19 | No chapters | Strip + key meter become single lines; chip shows title only. |
| 20 | Calm | Reduced motion / transparency / contrast / forced colours — see §13. |

---

## 11. Picture-in-picture

- **PiP key** (XL) or More → Picture-in-picture. `P` key.
- Use **Document Picture-in-Picture** where supported (Chrome/Edge): a 400 × 225 window with FIELD keys — −10, play key, +10, back-to-tab, close — and a 4px progress rail. Elsewhere use the browser's native video PiP.
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

- **Accent guard:** at runtime, if `--field-accent` has < 3:1 contrast against `--field-key`, darken it in 4% steps until it passes. Text on accent uses `--field-on-accent`.
- `prefers-reduced-motion`: no translate, no roll, no scale; fades only; loading sweep → `LOADING` in the counter.
- `prefers-reduced-transparency`: Liquid → Putty; pill alpha → 1.
- `prefers-contrast: more`: state 18.
- `forced-colors: active`: keys `ButtonFace`/`ButtonText`, needle and focus `Highlight`.

---

## 14. Motion table

| Element | Trigger | What moves | Time · easing | Reduced motion |
|---|---|---|---|---|
| Controls show/hide | pointer, tap, key · 2 s idle | opacity | 180 in · 300 out · ease-out | same |
| Key press | pointer / touch / Space | translateY 2px, shadow 0, 12% layer | 90 down · 140 up | layer only |
| Play ↔ pause | click, K, Space | bars → triangle, meter flash | 180 · `cubic-bezier(.2,0,0,1)` | instant swap |
| Volume wheel | hold volume, ↑↓, scroll | pill width + wheel clip; ribs per detent | 220 open · 1.5 s idle close | opens in place |
| Speed | click / hold | label crossfade, ticks; tray grows | 140 · tray 200 | instant |
| Menus & sheets | settings, more, pause | scale .92→1 from key + fade; sheets slide 24px | 180 · 220 | fade only |
| Seek hover / scrub | pointer, drag, J/L | ghost needle + tag; counter digits roll | 1:1 with pointer | digits change |

Animate only `transform` and `opacity`.

---

## 15. Copy

Sentence case everywhere in the player. Action names stay the same through a flow ("Try again" → retries).
