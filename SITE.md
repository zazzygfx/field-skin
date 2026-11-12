# FIELD — showcase site

Designs: `reference/11-site-desktop.png` (1440) and `reference/12-site-mobile.png` (7 phone screens + native rules). Figma: page ★ FIELD — Final → "FIELD · Showcase site · Desktop 1440" and "FIELD · Showcase site · Mobile (native)".

One page, hosted on **Netlify** (suggested name: `field-skin.netlify.app`). The judges score the skin, but this page is how they meet it. It must feel like the player: solid, quiet, made of real parts.

## Design plan

**Colour.** Page is a workbench, not paper, so the putty keys lift off it:
- Bench `#DEDBD2` (page background)
- Paper `#F4F2EC` (panels the player sits on)
- Putty `#EDEBE2` (the keys themselves)
- Ink `#17160F` (text)
- Orange `#FF4D00` (only where the player uses it)

**Type.** DM Sans for everything on the page. Space Mono appears only where the device would print it: inside the player's counter and in the install code. Headings are big, tight, sentence case. Body ≤ 72 characters a line.

**Layout.** Left-aligned, generous left margin, one column of text beside wide demos. Each section is one idea with one live thing to touch. No card grids, no eyebrow labels, no all-caps, no "A · B · C" meta strings, no arrows in link text.

**Motion.** The page itself doesn't animate on scroll. All motion belongs to the player and answers the visitor's hands.

**The one bold thing.** The hero is the live player, full width, already playing muted. Everything else is calm.

## Sections

1. **Hero.** Live FIELD player (Mux stream), muted autoplay with a clear unmute. Under it: `FIELD` as the heading, "A video player built like a field recorder." and one sentence. A quiet hint row: *Hold the volume key. Press K. Hover the strip.*
2. **Two things to touch.** Left: the volume key alone, big, with its thumb-wheel; roll it and the hero player's volume changes. Right: the play key alone at 3× size, showing the meter and the transport press. Short captions explaining each.
3. **Make it yours.** Controls that restyle a real player live: material (Putty, Ink, Liquid), accent swatches plus a colour picker (with the contrast guard visibly darkening a too-light pick), and a **Holiday** toggle (Snow / Pine). Show the 3-line CSS that produces the current look, updating as they click.
4. **Any size.** A player inside a frame with a drag handle. Drag from 1180 down to 320 and watch keys fold away, never shrink. Labels show the current size (XL / M / S / XS). This is FIELD's version of "at home anywhere", different from Iris's site switcher.
5. **Every state.** The 20 states, each rendered by the real skin forced into that state (not screenshots), with one line on *when* it happens and *how* it reads. Include the "any video" ones: no chapters, no captions, live, behind live, 3-hour file.
6. **On your phone.** Upright and sideways photos/renders plus a QR code to open the page on a phone. Note the iPhone volume rule plainly.
7. **Accessibility.** Interactive keyboard map: press a key on your keyboard and its row lights up. List the target sizes, contrast numbers, screen-reader labels and the axe result (0 violations, with date).
8. **Install.** Three numbered steps (this one really is a sequence): install Video.js 10, add FIELD's files, set the theme tokens. Copy buttons on each code block. Link to the repo.

**Footer:** *Caminandes 3: Llamigos* © Blender Foundation, CC BY 3.0 (link) · stream by Mux · built on Video.js 10 · FIELD is Apache 2.0 · designed by Zazzy (link to Contra/X).

## Quality floor

- Works from 320px up; demos stack on phones.
- Every demo is keyboard reachable with a visible focus ring.
- `prefers-reduced-motion` respected across the page.
- Lighthouse: Performance ≥ 90, Accessibility 100.
- Open Graph image: the hero player frame with the controls showing.

## Desktop specifics (match reference/11)

- Nav: logo · **scroll tape counter** ("You are at 00 00 00" — maps scroll position to the film's 2:30 so it reads like tape) · section links · "Get FIELD".
- States section is a **desk of 20 putty keys** in three rows (Playing / Any video / Your settings). Pressing one forces the big player above into that state; the two captions below update ("when it happens" / "how it reads").
- Keyboard section: a drawn keyboard; physical key presses light the matching cap.

## Phone (match reference/12) — must feel installed, not like a website

Seven screens: Hero, Touch, Style, States, Gestures, Install, Menu sheet.

- **Hero** `min-height: 100svh`, player full-bleed under the status bar.
- **Docked mini player**: once the hero player scrolls out, a sticky mini player sits under the status bar (`top: env(safe-area-inset-top)`), with thumbnail, counter and play key.
- **Floating dock** at thumb height: counter + Touch / Style / States + orange Get. Padded with `env(safe-area-inset-bottom)`. Active tab is a raised putty key.
- **Style**: segmented controls (44px) for Material and Season; accent swatches in a snap carousel that peeks.
- **States**: snap carousel of real player cards (one per swipe, next card peeking), filter chips that scroll sideways, a pager "11 of 20".
- **Gestures** replace the keyboard section: a try-it player with double-tap zones; each gesture ticks orange once done.
- **Install**: 44px Copy buttons, "Copied" toast just above the dock.
- **Menu**: bottom sheet with a handle (not a top dropdown); scrim tap or drag-down to close.

### Native rules (from the mobile-native guidance)

```html
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, interactive-widget=resizes-content">
<meta name="theme-color" content="#DEDBD2">
```
```css
html { -webkit-tap-highlight-color: transparent; -webkit-text-size-adjust: 100%; }
button, a, [role="button"] { touch-action: manipulation; user-select: none; -webkit-user-select: none; -webkit-touch-callout: none; }
input, select, textarea { font-size: 16px; }
.carousel { scroll-snap-type: x mandatory; touch-action: pan-y; }
.field-wheel, .field-strip { touch-action: none; }       /* only these own every axis */
.sheet { overscroll-behavior: contain; padding-bottom: calc(16px + env(safe-area-inset-bottom)); }
@media (hover: hover) and (pointer: fine) { /* every :hover rule lives here */ }
```
- Press feedback on `:active` / `pointerdown`, 100–160 ms ease-out.
- Never `user-scalable=no`. Keep normal pull-to-refresh on the page.
- While the player is fullscreen, switch `theme-color` to `#17160F`.
- Test on a real older iPhone and an Android: keyboard open, landscape once, Safari Web Inspector / chrome://inspect.
