# FIELD build kit

Everything Claude Code needs to build FIELD on Video.js 10 and ship it on Netlify.

## What's inside

| File | What it is |
|---|---|
| `CLAUDE.md` | Instructions Claude Code reads first: build order, rules, media links |
| `SPEC.md` | The full skin spec: sizes, behaviour, states, keyboard, motion |
| `tokens.css` | Every colour and size, including Putty, Ink, Liquid and Holiday Snow / Pine |
| `SITE.md` | Plan for the showcase page |
| `CHECKLIST.md` | Contest minimums, bonus points and pre-submit checks |
| `assets/chapters.vtt` | Chapter track for the demo film (titles are data — rename freely) |
| `assets/captions-en.vtt` | Sound captions — **timings are placeholders, check them against the film** |
| `netlify.toml` | Netlify build + headers |
| `reference/` | 11 images exported from the Figma board |

## How to use it (step by step)

1. **Make a folder** on your computer called `field-skin` and unzip this kit into it.
2. **Open Claude Code** in that folder (terminal: `cd field-skin` then `claude`, or open the folder in the Claude desktop app's Code tab).
3. **Paste this as your first message:**
   > Read CLAUDE.md, then SPEC.md, tokens.css and the reference images. Then do step 1 of the build order only and show me the result running locally.
4. **Check each step** in your browser before saying "next step". If something doesn't match the reference image, tell it which image and what's off.
5. **Deploy to Netlify** at step 8:
   - Push the folder to a new GitHub repo (Claude Code can do this for you).
   - On netlify.com → Add new site → Import from GitHub → pick the repo. The `netlify.toml` already has the build settings.
   - Rename the site to `field-skin` (Site settings → Change site name).
6. **Run CHECKLIST.md** top to bottom, then post on Contra.

## Figma

Design file: Skins file, page **★ FIELD — Final** → board **FIELD · Final Board v2** (components panel on the left).
