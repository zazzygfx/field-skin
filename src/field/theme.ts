/*
 * FIELD — themes + accent contrast guard (SPEC §13)
 * Copyright 2026 Zazzy (@zazzygfx)
 * Licensed under the Apache License, Version 2.0
 *
 * Themes are pure CSS (tokens.css): data-field-theme="putty|ink|liquid|
 * holiday-snow|holiday-pine". The guard runs at runtime: if --field-accent has
 * less than 3:1 contrast against --field-key, it is darkened in 4% steps until
 * it passes (or lightened, on dark keys where darkening can't help).
 */
export const THEMES = ['putty', 'ink', 'liquid', 'holiday-snow', 'holiday-pine'] as const;
export type Theme = (typeof THEMES)[number];

type RGBA = [number, number, number, number];

/** Resolve any CSS colour to rgba via the browser. */
function parse(color: string, probe: HTMLElement): RGBA | null {
  probe.style.color = '';
  probe.style.color = color;
  const c = getComputedStyle(probe).color;
  const m = c.match(/[\d.]+/g);
  if (!m || m.length < 3) return null;
  const [r, g, b, a = '1'] = m;
  return [Number(r), Number(g), Number(b), Number(a)];
}

const lin = (v: number) => {
  const s = v / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
};
const luminance = ([r, g, b]: RGBA) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
const contrast = (a: RGBA, b: RGBA) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};
/** Translucent keys (Liquid) sit over the picture: judge them over a dark frame. */
const over = ([r, g, b, a]: RGBA, [br, bg, bb]: RGBA): RGBA => [r * a + br * (1 - a), g * a + bg * (1 - a), b * a + bb * (1 - a), 1];
const hex = ([r, g, b]: RGBA) => '#' + [r, g, b].map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('');

export function guardAccent(root: HTMLElement): { accent: string; ratio: number; adjusted: boolean } | null {
  // measure the requested accent, not a previous correction
  if (root.dataset.fieldAccentGuard) {
    root.style.removeProperty('--field-accent');
    if (root.dataset.fieldAccentGuard !== 'theme') root.style.setProperty('--field-accent', root.dataset.fieldAccentGuard);
    delete root.dataset.fieldAccentGuard;
  }
  const cs = getComputedStyle(root);
  const probe = document.createElement('span');
  probe.hidden = true;
  root.append(probe);
  const accent = parse(cs.getPropertyValue('--field-accent').trim(), probe);
  const keyRaw = parse(cs.getPropertyValue('--field-key').trim(), probe);
  probe.remove();
  if (!accent || !keyRaw) return null;
  const key = keyRaw[3] < 1 ? over(keyRaw, [24, 24, 22, 1]) : keyRaw;

  let c = accent;
  let ratio = contrast(c, key);
  if (ratio >= 3) return { accent: hex(c), ratio, adjusted: false };
  const darken = luminance(key) > 0.18; // light keys: darken the accent; dark keys: lighten it
  for (let i = 0; i < 40 && ratio < 3; i++) {
    c = darken
      ? [c[0] * 0.96, c[1] * 0.96, c[2] * 0.96, 1]
      : [c[0] + (255 - c[0]) * 0.04, c[1] + (255 - c[1]) * 0.04, c[2] + (255 - c[2]) * 0.04, 1];
    ratio = contrast(c, key);
  }
  const requested = root.style.getPropertyValue('--field-accent').trim();
  root.dataset.fieldAccentGuard = requested || 'theme';
  root.style.setProperty('--field-accent', hex(c));
  return { accent: hex(c), ratio, adjusted: true };
}

/** Re-run the guard whenever the theme or the requested accent changes. */
export function mountTheme(root: HTMLElement): void {
  const rt = matchMedia('(prefers-reduced-transparency: reduce)');
  let last = '';
  let lastHex = '';
  const run = () => {
    // a new accent written over our correction is a new request
    if (root.dataset.fieldAccentGuard && root.style.getPropertyValue('--field-accent').trim() !== lastHex) {
      delete root.dataset.fieldAccentGuard;
    }
    const guard = root.dataset.fieldAccentGuard;
    const requested = guard ? (guard === 'theme' ? '' : guard) : root.style.getPropertyValue('--field-accent').trim();
    const sig = `${root.dataset.fieldTheme ?? 'putty'}|${requested}|${rt.matches}`;
    if (sig === last) return; // style also carries --field-progress: ignore those writes
    last = sig;
    const r = guardAccent(root);
    lastHex = r?.adjusted ? r.accent : '';
    root.toggleAttribute('data-field-accent-guarded', !!r?.adjusted);
  };
  new MutationObserver(run).observe(root, { attributes: true, attributeFilter: ['data-field-theme', 'style'] });
  rt.addEventListener?.('change', run);
  run();
}
