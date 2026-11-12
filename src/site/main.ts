/*
 * FIELD — showcase site
 * Copyright 2026 Zazzy (@zazzygfx)
 * Licensed under the Apache License, Version 2.0
 *
 * Every demo is a real FIELD player (or drives one). The page itself doesn't
 * animate on scroll; motion belongs to the player and answers your hands.
 */
import '@videojs/html/video/player';
import '@videojs/html/media/mux-video';
import { mountField, formatCounter } from '../field/field';
import { renderCounter } from '../field/counter';
import { isIOS } from '../field/volume';
import { createStateRunner, type Runner } from '../dev/runner';
import { playerMarkup } from './player';
import { DESK, ROWS, type DeskState } from './copy';
import './site.css';

const $ = <T extends Element = HTMLElement>(sel: string, el: ParentNode = document) => el.querySelector<T>(sel);
const $$ = <T extends Element = HTMLElement>(sel: string, el: ParentNode = document) => Array.from(el.querySelectorAll<T>(sel));
const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const coarse = matchMedia('(hover: none) and (pointer: coarse)');
const DURATION = 150; // the film is 2:30

/* ------------------------------------------------------------------ players */
type Player = { n: number; root: HTMLElement; media: HTMLMediaElement; runner: Runner | null; displaced?: boolean };
const players = new Map<number, Player>();
const waiting = new Map<number, ((p: Player) => void)[]>();

function mountSlot(slot: HTMLElement): Player | null {
  const n = Number(slot.dataset.player);
  if (players.has(n)) return players.get(n)!;
  slot.innerHTML = playerMarkup(n, { theme: slot.dataset.theme, autoplay: 'autoplay' in slot.dataset });
  const root = $('media-container.field', slot);
  if (!root) return null;
  mountField(root);
  const media = $<HTMLMediaElement>('[data-field-media]', root)!;
  const p: Player = { n, root, media, runner: createStateRunner(root) };
  players.set(n, p);
  // one picture with sound at a time: starting one pauses the others
  media.addEventListener('play', () => {
    if (parking.has(p)) return;
    if (root.getAttribute('data-field-force') === 'demo') root.removeAttribute('data-field-force');
    p.displaced = false;
    for (const o of players.values())
      if (o !== p && !o.media.paused) {
        o.displaced = true; // another player took over (the mini player steps away)
        o.media.pause();
      }
  });
  if ('park' in slot.dataset) void park(p);
  waiting.get(n)?.forEach((cb) => cb(p));
  waiting.delete(n);
  return p;
}

/** Demo players wait paused mid-film with their keys showing (no pause shelf). */
const parking = new Set<Player>();
async function park(p: Player) {
  parking.add(p);
  await p.media.play().catch(() => {});
  p.media.pause();
  p.media.currentTime = 83.4;
  parking.delete(p);
  p.root.setAttribute('data-field-force', 'demo');
  (p.root as HTMLElement & { fieldDev?: { render: () => void } }).fieldDev?.render();
}

function whenPlayer(n: number): Promise<Player> {
  const p = players.get(n);
  if (p) return Promise.resolve(p);
  return new Promise((res) => waiting.set(n, [...(waiting.get(n) ?? []), res]));
}

/** Mount a player now (e.g. a desk key was pressed before it scrolled near). */
function ensurePlayer(n: number): Player | null {
  const slot = $(`[data-player="${n}"]`);
  return slot ? mountSlot(slot) : null;
}

// hero mounts at once; the rest when they come near the viewport
const lazy = new IntersectionObserver(
  (entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      lazy.unobserve(e.target);
      mountSlot(e.target as HTMLElement);
    }
  },
  { rootMargin: '600px 0px' },
);
for (const slot of $$('[data-player]')) {
  if ('autoplay' in slot.dataset) mountSlot(slot);
  else if ('coarseOnly' in slot.dataset && !coarse.matches) continue;
  else lazy.observe(slot);
}
const hero = players.get(1)!;

/* ------------------------------------------------------- hero: clear unmute */
{
  const btns = $$<HTMLButtonElement>('.unmute');
  const sync = () => btns.forEach((b) => (b.hidden = !hero.media.muted));
  hero.media.addEventListener('volumechange', sync);
  btns.forEach((b) =>
    b.addEventListener('click', () => {
      hero.media.muted = false;
      if (hero.media.volume < 0.4) hero.media.volume = 0.7;
      if (hero.media.paused) void hero.media.play();
    }),
  );
  sync();
}

/* -------------------------------------------------- scroll tape counter */
{
  const tapes = $$('[data-tape]');
  let raf = 0;
  const draw = () => {
    raf = 0;
    const max = document.documentElement.scrollHeight - innerHeight;
    const t = max > 0 ? (scrollY / max) * DURATION : 0;
    const text = formatCounter(Math.min(DURATION, t));
    tapes.forEach((el) => renderCounter(el, text, true));
  };
  addEventListener('scroll', () => (raf ||= requestAnimationFrame(draw)), { passive: true });
  addEventListener('resize', draw);
  draw();
}

/* ------------------------------------------------------ docked mini player */
{
  const mini = $('[data-mini]')!;
  const c = $('[data-mini-c]', mini)!;
  const play = $('.mini-play', mini)!;
  const m = hero.media;
  let heroOut = false;
  const sync = () => {
    const started = m.currentTime > 0 || !m.paused;
    mini.hidden = !(heroOut && started && !hero.displaced);
    mini.toggleAttribute('data-paused', m.paused);
    play.setAttribute('aria-label', m.paused ? 'Play' : 'Pause');
    renderCounter(c, formatCounter(m.currentTime), false);
  };
  ['play', 'pause', 'timeupdate', 'seeked'].forEach((ev) => m.addEventListener(ev, sync));
  new IntersectionObserver(([e]) => {
    heroOut = !e.isIntersecting;
    sync();
  }).observe($('.hero-paper')!);
  play.addEventListener('click', () => (m.paused ? void m.play() : m.pause()));
  $('.mini-thumb', mini)!.addEventListener('click', () => {
    $('.hero-paper')!.scrollIntoView({ block: 'center', behavior: reduced() ? 'auto' : 'smooth' });
    hero.root.querySelector<HTMLElement>('.field-play:not(.field-bigplay)')?.focus({ preventScroll: true });
  });
  sync();
}

/* --------------------------------------------- two things: the wheel demo */
{
  const el = $('[data-demo-wheel]')!;
  const key = $<HTMLButtonElement>('.dw-key', el)!;
  const wheel = $('.dw-wheel', el)!;
  const ribs = $('.dw-ribs', el)!;
  const detents = $('.dw-detents', el)!;
  const m = hero.media;
  const N = 26;
  const ribEls = Array.from({ length: N + 2 }, () => ribs.appendChild(document.createElement('i')));
  const detEls = Array.from({ length: 10 }, () => detents.appendChild(document.createElement('i')));
  let level = Math.round(m.volume * 10);
  let phase = 0; // ribs roll one rib per detent
  let anim = 0;

  const drawRibs = (p: number) => {
    const f = ((p % 1) + 1) % 1;
    ribEls.forEach((r, i) => {
      const a = ((i - 1 + f) / N) * Math.PI;
      const vis = a > 0 && a < Math.PI;
      r.style.opacity = vis ? String(0.3 + 0.4 * Math.sin(a)) : '0';
      r.style.left = `${((1 - Math.cos(Math.max(0, Math.min(Math.PI, a)))) / 2) * 100}%`;
    });
  };
  const roll = (delta: number) => {
    if (!delta) return;
    const from = phase;
    phase += delta;
    cancelAnimationFrame(anim);
    if (reduced()) return drawRibs(phase);
    const t0 = performance.now();
    const step = (t: number) => {
      const k = Math.min(1, (t - t0) / 120);
      drawRibs(from + (phase - from) * (1 - (1 - k) ** 3));
      if (k < 1) anim = requestAnimationFrame(step);
    };
    anim = requestAnimationFrame(step);
  };
  const paint = () => {
    const shown = m.muted ? 0 : level;
    key.textContent = m.muted ? '–' : String(level);
    key.toggleAttribute('data-muted', m.muted);
    key.setAttribute('aria-label', m.muted ? 'Unmute' : 'Mute');
    detEls.forEach((d, i) => d.toggleAttribute('data-on', i < shown));
    wheel.setAttribute('aria-valuenow', String(shown));
    wheel.setAttribute('aria-valuetext', m.muted ? 'Muted' : `${level} of 10`);
  };
  const set = (next: number) => {
    next = Math.max(0, Math.min(10, next));
    const was = m.muted ? 0 : level;
    level = next;
    m.volume = next / 10;
    m.muted = next === 0;
    roll(next - was);
    paint();
  };
  m.addEventListener('volumechange', () => {
    const lv = Math.round(m.volume * 10);
    if (lv !== level) roll(lv - level);
    level = lv;
    paint();
  });
  key.addEventListener('click', () => {
    m.muted = !m.muted;
    if (!m.muted && level === 0) set(5);
  });

  // drag rolls one detent per 36px; a click without a drag jumps to that level
  const STEP = 36;
  let down = false;
  let moved = false;
  let lastX = 0;
  let acc = 0;
  let total = 0;
  wheel.addEventListener('pointerdown', (e) => {
    down = true;
    moved = false;
    lastX = e.clientX;
    acc = total = 0;
    wheel.setPointerCapture(e.pointerId);
  });
  wheel.addEventListener('pointermove', (e) => {
    if (!down) return;
    const dx = e.clientX - lastX;
    lastX = e.clientX;
    acc += dx;
    total += Math.abs(dx);
    if (total > 4) moved = true;
    while (acc >= STEP) (set((m.muted ? 0 : level) + 1), (acc -= STEP));
    while (acc <= -STEP) (set((m.muted ? 0 : level) - 1), (acc += STEP));
  });
  const up = (e: PointerEvent) => {
    if (!down) return;
    down = false;
    if (!moved) {
      const r = wheel.getBoundingClientRect();
      set(Math.round(((e.clientX - r.left) / r.width) * 10));
    }
  };
  wheel.addEventListener('pointerup', up);
  wheel.addEventListener('pointercancel', () => (down = false));
  wheel.addEventListener('keydown', (e) => {
    const cur = m.muted ? 0 : level;
    const map: Record<string, number> = { ArrowUp: cur + 1, ArrowRight: cur + 1, ArrowDown: cur - 1, ArrowLeft: cur - 1, PageUp: cur + 3, PageDown: cur - 3, Home: 0, End: 10 };
    if (!(e.key in map)) return;
    e.preventDefault();
    set(map[e.key]);
  });
  if (isIOS()) {
    const p = $('.touch-wheel figcaption p')!;
    p.textContent = 'On iPhone and iPad the side buttons set the level, so the player’s key mutes. This wheel shows how it rolls everywhere else.';
  }
  drawRibs(0);
  paint();
}

/* ------------------------------------------------ two things: the play key */
{
  const key = $('.dp-key')!;
  const m = hero.media;
  const sync = () => {
    key.toggleAttribute('data-paused', m.paused);
    key.setAttribute('aria-label', m.paused ? 'Play the player above' : 'Pause the player above');
  };
  ['play', 'pause', 'ended'].forEach((ev) => m.addEventListener(ev, sync));
  key.addEventListener('click', () => (m.paused ? void m.play() : m.pause()));
  sync();
}

/* ------------------------------------------------------------ make it yours */
{
  const state = { material: 'ink', season: 'off', accent: '#FF4D00', picked: false };
  const code = $('[data-style-code]')!;
  const note = $('[data-guard-note]')!;
  const baseNote = note.textContent ?? '';
  const pick = $<HTMLInputElement>('[data-pick]')!;

  const theme = () => (state.season === 'off' ? state.material : `holiday-${state.season}`);
  const writeCode = () => {
    const lines = ['<media-container class="field"', `  data-field-theme="${theme()}"`];
    if (state.picked) lines.push(`  style="--field-accent: ${state.accent.toUpperCase()}">`);
    else lines[lines.length - 1] += '>';
    code.textContent = lines.join('\n');
  };
  let version = 0;
  const apply = async () => {
    const mine = ++version; // the latest click wins
    writeCode();
    $$('[data-seg="material"] .key').forEach((b) => b.setAttribute('aria-pressed', String(state.season === 'off' && b.dataset.v === state.material)));
    $$('[data-seg="season"] .key').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.v === state.season)));
    const p = players.get(2) ?? ensurePlayer(2) ?? (await whenPlayer(2));
    if (mine !== version) return;
    p.root.dataset.fieldTheme = theme();
    if (state.picked) p.root.style.setProperty('--field-accent', state.accent);
    else p.root.style.removeProperty('--field-accent');
    await new Promise((r) => setTimeout(r, 0)); // the guard runs from a MutationObserver
    if (mine !== version) return;
    const shown = p.root.style.getPropertyValue('--field-accent').trim();
    if (p.root.hasAttribute('data-field-accent-guarded') && shown) {
      note.innerHTML = `<b>${state.picked ? state.accent.toUpperCase() : 'This accent'}</b> doesn’t read well on these keys, so FIELD shows it as <b>${shown.toUpperCase()}</b>.`;
      note.setAttribute('data-guarded', '');
    } else {
      note.textContent = baseNote;
      note.removeAttribute('data-guarded');
    }
  };
  for (const seg of $$('[data-seg]')) {
    seg.addEventListener('click', (e) => {
      const b = (e.target as HTMLElement).closest<HTMLElement>('[data-v]');
      if (!b) return;
      if (seg.dataset.seg === 'material') (state.material = b.dataset.v!), (state.season = 'off');
      else state.season = b.dataset.v!;
      void apply();
    });
  }
  const sws = $$('[data-swatches] .sw');
  const pressSwatch = (el: HTMLElement) => sws.forEach((s) => s.setAttribute('aria-pressed', String(s === el)));
  $('[data-swatches]')!.addEventListener('click', (e) => {
    const b = (e.target as HTMLElement).closest<HTMLElement>('[data-c]');
    if (!b) return;
    state.accent = b.dataset.c!;
    state.picked = true;
    pressSwatch(b);
    void apply();
  });
  pick.addEventListener('input', () => {
    state.accent = pick.value;
    state.picked = true;
    pressSwatch(pick.closest('.sw')!);
    void apply();
  });
  writeCode();
}

/* ------------------------------------------------------------- any size */
{
  const lane = $('[data-lane]');
  const box = $('[data-lane-player]');
  const handle = $('[data-handle]');
  const badge = $('[data-size-badge]');
  const text = $('[data-size-text]');
  const ruler = $('[data-ruler]');
  const now = $('[data-ruler-now]');
  if (lane && box && handle && badge && text && ruler && now) {
    const PAD = 14; // paper around the player
    const MIN = 320;
    const ticks: [number, string][] = [
      [320, 'XS 320'],
      [400, 'S 400'],
      [600, 'M 600'],
      [900, 'XL 900'],
    ];
    const tickEls = ticks.map(([px, label]) => {
      const t = document.createElement('span');
      t.className = 'rtick';
      t.dataset.px = String(px);
      t.innerHTML = `<i></i><em>${label}</em>`;
      ruler.append(t);
      return t;
    });
    const maxEl = document.createElement('span');
    maxEl.className = 'rtick rtick-end';
    maxEl.innerHTML = '<i></i><em></em>';
    ruler.append(maxEl);

    const NOTES: Record<string, string> = {
      XL: 'every key on the row',
      M: 'speed and PiP moved into Settings',
      S: '±10 became double-tap; the chip stepped aside',
      XS: 'fullscreen moved into More',
    };
    const readout = text.parentElement!;
    const max = () => Math.max(MIN, lane.clientWidth - 2 * PAD - 2 - 12 - 28 - 24); // room for the handle
    let w = 820;
    const draw = () => {
      w = Math.round(Math.max(MIN, Math.min(max(), w)));
      box.style.width = `${w + 2 * PAD + 2}px`; // + the paper's 1px border each side
      const s = w >= 900 ? 'XL' : w >= 600 ? 'M' : w >= 400 ? 'S' : 'XS';
      badge.textContent = s;
      text.textContent = `${w} px — ${NOTES[s]}`;
      handle.setAttribute('aria-valuenow', String(w));
      handle.setAttribute('aria-valuemax', String(max()));
      handle.setAttribute('aria-valuetext', `${w} pixels, size ${s}`);
      now.style.width = `${w}px`;
      tickEls.forEach((t) => {
        const px = Number(t.dataset.px);
        t.hidden = px > max();
        t.style.left = `${PAD + 2 + px}px`;
      });
      maxEl.style.left = `${PAD + 2 + max()}px`;
      maxEl.querySelector('em')!.textContent = String(max());
      // the readout rides above the handle, kept inside the lane
      const hx = w + 2 * PAD + 2 + 12 + 14;
      readout.style.left = `${Math.max(14, Math.min(lane.clientWidth - readout.offsetWidth - 14, hx - readout.offsetWidth / 2))}px`;
    };
    let startX = 0;
    let startW = 0;
    handle.addEventListener('pointerdown', (e) => {
      startX = e.clientX;
      startW = w;
      handle.setPointerCapture(e.pointerId);
      handle.setAttribute('data-drag', '');
    });
    handle.addEventListener('pointermove', (e) => {
      if (!handle.hasPointerCapture(e.pointerId)) return;
      w = startW + (e.clientX - startX);
      draw();
    });
    const end = () => handle.removeAttribute('data-drag');
    handle.addEventListener('pointerup', end);
    handle.addEventListener('pointercancel', end);
    handle.addEventListener('keydown', (e) => {
      const d: Record<string, number> = { ArrowLeft: -20, ArrowDown: -20, ArrowRight: 20, ArrowUp: 20, PageDown: -100, PageUp: 100 };
      if (e.key === 'Home') w = MIN;
      else if (e.key === 'End') w = max();
      else if (e.key in d) w += d[e.key];
      else return;
      e.preventDefault();
      draw();
    });
    new ResizeObserver(draw).observe(lane);
    draw();
  }
}

/* ------------------------------------------------------------ the key desk */
{
  const desk = $('[data-desk]')!;
  const cards = $('[data-cards]')!;
  const dots = $('[data-dots]')!;
  const pager = $('[data-pager]')!;
  let current: DeskState | null = null;

  const press = async (s: DeskState) => {
    current = s;
    $$('.dkey', desk).forEach((k) => k.setAttribute('aria-pressed', String(k.dataset.n === s.n)));
    $('[data-when-h]', desk)!.textContent = `${s.name} — when it happens`;
    $('[data-when]', desk)!.textContent = s.when;
    $('[data-how]', desk)!.textContent = s.how;
    const p = players.get(4) ?? ensurePlayer(4);
    await p?.runner?.run(s.id);
  };

  // desktop: three rows of putty keys
  desk.innerHTML =
    ROWS.map(
      (r) =>
        `<div class="drow" role="group" aria-label="${r.label}"><p class="drow-h" aria-hidden="true">${r.label}</p>${DESK.filter((s) => s.row === r.key)
          .map((s) => `<button type="button" class="key dkey" data-n="${s.n}" aria-pressed="false"><span>${s.n}</span>${s.name}</button>`)
          .join('')}</div>`,
    ).join('') +
    `<div class="explain" aria-live="polite"><div><h3 data-when-h>Press a key — when it happens</h3><p data-when>Each key forces the player above into one of its twenty states.</p></div><div><h3>How it reads</h3><p data-how>What you would see, and why it reads that way.</p></div></div>`;
  desk.addEventListener('click', (e) => {
    const b = (e.target as HTMLElement).closest<HTMLElement>('.dkey');
    const s = b && DESK.find((x) => x.n === b.dataset.n);
    if (s) void press(s);
  });

  // phone: snap carousel of cards, filter chips, pager
  let list = DESK;
  const renderCards = () => {
    cards.innerHTML = list
      .map((s) => `<button type="button" class="card" data-n="${s.n}"><span class="card-h"><b class="card-n">${s.n}</b>${s.name}</span><span class="card-p">${s.how}</span></button>`)
      .join('');
    dots.innerHTML = list.map(() => '<i></i>').join('');
    cards.scrollLeft = 0;
    setPage(0);
  };
  const setPage = (i: number) => {
    pager.textContent = `${i + 1} of ${list.length}`;
    $$('i', dots).forEach((d, k) => d.toggleAttribute('data-on', k === i));
    $$('.card', cards).forEach((c, k) => c.toggleAttribute('data-on', k === i));
  };
  const nearest = () => {
    const mid = cards.scrollLeft + cards.clientWidth / 2;
    let best = 0;
    let dist = Infinity;
    $$('.card', cards).forEach((c, i) => {
      const d = Math.abs(c.offsetLeft + c.offsetWidth / 2 - mid);
      if (d < dist) (dist = d), (best = i);
    });
    return best;
  };
  let settle = 0;
  cards.addEventListener(
    'scroll',
    () => {
      setPage(nearest());
      clearTimeout(settle);
      settle = window.setTimeout(() => {
        const s = list[nearest()];
        if (s && s !== current) void press(s);
      }, 220);
    },
    { passive: true },
  );
  cards.addEventListener('click', (e) => {
    const c = (e.target as HTMLElement).closest<HTMLElement>('.card');
    const s = c && list.find((x) => x.n === c.dataset.n);
    if (!c || !s) return;
    c.scrollIntoView({ inline: 'center', block: 'nearest', behavior: reduced() ? 'auto' : 'smooth' });
    void press(s);
  });
  $('[data-chips]')!.addEventListener('click', (e) => {
    const b = (e.target as HTMLElement).closest<HTMLElement>('[data-f]');
    if (!b) return;
    $$('[data-chips] .key').forEach((k) => k.setAttribute('aria-pressed', String(k === b)));
    const f = b.dataset.f;
    list = f === 'all' ? DESK : DESK.filter((s) => s.row === f);
    renderCards();
  });
  renderCards();
}

/* --------------------------------------------------- keyboard map (desktop) */
{
  const kb = $('[data-kb]')!;
  const rows: [string, string, number?][][] = [
    '0123456789'.split('').map((k) => [k, k] as [string, string]),
    [['p', 'P'], ['c', 'C'], ['f', 'F'], ['j', 'J'], ['k', 'K', 120], ['l', 'L'], ['m', 'M']],
    [['<', '<'], ['>', '>'], ['escape', 'Esc', 82], [' ', 'Space', 286]],
    [['arrowleft', '←'], ['arrowup', '↑'], ['arrowdown', '↓'], ['arrowright', '→']],
  ];
  kb.innerHTML = rows
    .map((r) => `<div class="kb-row">${r.map(([id, label, w]) => `<span class="key cap" data-k="${id === ' ' ? 'space' : id}"${w ? ` style="width:${w}px"` : ''}>${label}</span>`).join('')}</div>`)
    .join('');
  const cap = (e: KeyboardEvent) => {
    const k = e.key === ' ' ? 'space' : e.key.toLowerCase();
    return kb.querySelector<HTMLElement>(`[data-k="${CSS.escape(k)}"]`);
  };
  addEventListener('keydown', (e) => cap(e)?.setAttribute('data-on', ''));
  addEventListener('keyup', (e) => cap(e)?.removeAttribute('data-on'));
  addEventListener('blur', () => $$('[data-on]', kb).forEach((c) => c.removeAttribute('data-on')));
}

/* ------------------------------------------------------ gestures (touch) */
if (coarse.matches) {
  void whenPlayer(5).then(({ root, media }) => {
    const list = $('[data-gest]')!;
    const done = (g: string) => list.querySelector(`[data-g="${g}"]`)?.setAttribute('data-done', '');
    // double-tap a side third (outside the keys)
    let last = 0;
    let lastSide = '';
    root.addEventListener('pointerup', (e) => {
      if (e.pointerType !== 'touch') return;
      if ((e.target as HTMLElement).closest('.field-pill, .field-strip, .field-play, media-menu, .field-center')) return;
      const r = root.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width;
      const side = x < 1 / 3 ? 'l' : x > 2 / 3 ? 'r' : '';
      const t = performance.now();
      if (side && side === lastSide && t - last < 350) done('tap2');
      last = t;
      lastSide = side;
    });
    const watch = (el: Element | null, attr: string, test: (el: Element) => boolean, g: string) =>
      el && new MutationObserver(() => test(el) && done(g)).observe(el, { attributes: true, attributeFilter: [attr] });
    watch($('.field-strip-slider', root), 'data-dragging', (el) => el.hasAttribute('data-dragging'), 'strip');
    watch($('.field-tray', root), 'hidden', (el) => !el.hasAttribute('hidden'), 'speed');
    if (isIOS()) {
      $('[data-vol-sub]')!.textContent = 'Mutes; the side buttons set the level';
      media.addEventListener('volumechange', () => done('vol'));
    } else watch($('.field-wheel', root), 'hidden', (el) => !el.hasAttribute('hidden'), 'vol');
  });
}

/* ------------------------------------------------------------- install */
{
  const toast = $('[data-toast]')!;
  let tt = 0;
  for (const btn of $$('.copy')) {
    btn.addEventListener('click', async () => {
      const text = btn.parentElement!.querySelector('code')!.textContent ?? '';
      let ok = true;
      try {
        await navigator.clipboard.writeText(text);
      } catch {
        // older browsers / blocked clipboard: select the code and copy it the old way
        const sel = getSelection();
        const range = document.createRange();
        range.selectNodeContents(btn.parentElement!.querySelector('code')!);
        sel?.removeAllRanges();
        sel?.addRange(range);
        ok = document.execCommand?.('copy') ?? false;
      }
      if (!ok) return; // the code stays selected for a manual copy
      btn.textContent = 'Copied';
      toast.hidden = false;
      clearTimeout(tt);
      tt = window.setTimeout(() => {
        toast.hidden = true;
        btn.textContent = 'Copy';
      }, 1600);
    });
  }
}

/* ------------------------------------------- phone: dock tabs + menu sheet */
{
  const tabs = $$('[data-tab]');
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        tabs.forEach((t) => (t.dataset.tab === e.target.id ? t.setAttribute('aria-current', 'true') : t.removeAttribute('aria-current')));
      }
    },
    { rootMargin: '-45% 0px -45% 0px' },
  );
  ['top', 'touch', 'style', 'sizes', 'states', 'keys', 'gestures', 'install'].forEach((id) => {
    const el = document.getElementById(id);
    if (el) io.observe(el);
  });

  const wrap = $('[data-sheet]')!;
  const sheet = $('.sheet', wrap)!;
  const opener = $<HTMLButtonElement>('.menu-key')!;
  const open = () => {
    wrap.hidden = false;
    void wrap.offsetWidth; // start the slide from the closed position
    wrap.setAttribute('data-open', '');
    opener.setAttribute('aria-expanded', 'true');
    $<HTMLElement>('.sheet-row', sheet)?.focus();
  };
  const close = (focus = true) => {
    wrap.removeAttribute('data-open');
    sheet.style.transform = '';
    opener.setAttribute('aria-expanded', 'false');
    window.setTimeout(() => (wrap.hidden = true), reduced() ? 0 : 200);
    if (focus) opener.focus({ preventScroll: true });
  };
  opener.addEventListener('click', open);
  $('[data-close]', wrap)!.addEventListener('click', () => close());
  $$('a', sheet).forEach((a) => a.addEventListener('click', () => close(false)));
  wrap.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') close();
    if (e.key !== 'Tab') return;
    const f = $$<HTMLElement>('a, button', sheet);
    const i = f.indexOf(document.activeElement as HTMLElement);
    if (e.shiftKey && i <= 0) (e.preventDefault(), f[f.length - 1].focus());
    else if (!e.shiftKey && i === f.length - 1) (e.preventDefault(), f[0].focus());
  });
  // drag the handle (or the title) down to close
  let y0 = 0;
  let dy = 0;
  let t0 = 0;
  const grab = $$('[data-drag], .sheet-h', sheet);
  grab.forEach((g) => {
    g.addEventListener('pointerdown', (e) => {
      y0 = e.clientY;
      dy = 0;
      t0 = performance.now();
      g.setPointerCapture(e.pointerId);
      sheet.setAttribute('data-dragging', '');
    });
    g.addEventListener('pointermove', (e) => {
      if (!g.hasPointerCapture(e.pointerId)) return;
      dy = Math.max(0, e.clientY - y0);
      sheet.style.transform = `translateY(${dy}px)`;
    });
    const end = () => {
      sheet.removeAttribute('data-dragging');
      const v = dy / Math.max(1, performance.now() - t0);
      if (dy > 90 || v > 0.6) close();
      else sheet.style.transform = '';
    };
    g.addEventListener('pointerup', end);
    g.addEventListener('pointercancel', end);
  });
}

/* ----------------------------------- status bar colour while fullscreen */
{
  const meta = $<HTMLMetaElement>('meta[name="theme-color"]')!;
  const sync = () => (meta.content = document.fullscreenElement ? '#17160F' : '#DEDBD2');
  document.addEventListener('fullscreenchange', sync);
  document.addEventListener('webkitfullscreenchange', sync);
}
