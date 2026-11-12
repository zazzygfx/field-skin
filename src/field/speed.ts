/*
 * FIELD — speed key (SPEC §7, Figma 169:149)
 * Copyright 2026 Zazzy (@zazzygfx)
 * Licensed under the Apache License, Version 2.0
 *
 * Click cycles (Video.js `rates`), label crossfades. Hold ≥350 ms, or < / >,
 * opens a tray of 7 keys that grows out of the speed key. One tap each; Esc closes.
 */
import type { KeySounds } from './sounds';

export const TRAY_RATES = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
const HOLD_MS = 350;
const PEEK_MS = 1500;

export function mountSpeed(
  root: HTMLElement,
  media: HTMLMediaElement,
  sounds: KeySounds,
  lock: (why: string, on: boolean) => void,
): void {
  const key = root.querySelector<HTMLElement>('.field-speed');
  const tray = root.querySelector<HTMLElement>('.field-tray');
  if (!key || !tray) return;

  /* ---------- Label crossfade (140 ms) whenever data-rate changes ---------- */
  new MutationObserver(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    key.animate?.([{ opacity: 0 }, { opacity: 1 }], { duration: 140, easing: 'ease-out', pseudoElement: '::before' });
  }).observe(key, { attributes: true, attributeFilter: ['data-rate'] });

  /* ---------- Tray keys ---------- */
  const buttons = TRAY_RATES.map((r) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'field-tray-key';
    b.setAttribute('role', 'radio');
    b.dataset.rate = String(r);
    b.textContent = `${r}×`;
    b.tabIndex = -1;
    b.addEventListener('click', () => {
      media.playbackRate = r;
      sounds.play('tick');
      close(true);
    });
    tray.append(b);
    return b;
  });

  const syncTray = () => {
    const rate = media.playbackRate;
    for (const b of buttons) {
      const on = Number(b.dataset.rate) === rate;
      b.setAttribute('aria-checked', String(on));
      b.tabIndex = on ? 0 : -1;
    }
    if (!buttons.some((b) => b.tabIndex === 0)) buttons[2].tabIndex = 0;
  };
  media.addEventListener('ratechange', syncTray);
  syncTray();

  /* ---------- Open / close; grows from the key ---------- */
  let peekTimer = 0;
  const isOpen = () => !tray.hidden;

  const place = () => {
    // centre the tray on the speed key; keep it inside the player
    const pill = key.closest<HTMLElement>('.field-pill')!;
    const k = key.getBoundingClientRect();
    const p = pill.getBoundingClientRect();
    const r = root.getBoundingClientRect();
    const w = tray.offsetWidth;
    const inset = parseFloat(getComputedStyle(root).getPropertyValue('--field-inset')) || 0;
    const centre = k.left + k.width / 2;
    const left = Math.max(r.left + inset, Math.min(r.right - inset - w, centre - w / 2));
    tray.style.left = `${left - p.left}px`;
    tray.style.transformOrigin = `${centre - left}px 100%`;
  };

  const open = (focus: boolean) => {
    clearTimeout(peekTimer);
    if (!isOpen()) {
      tray.hidden = false;
      place();
      key.setAttribute('aria-expanded', 'true');
      lock('tray', true);
      sounds.play('menu');
    }
    if (focus) tray.querySelector<HTMLElement>('[tabindex="0"]')?.focus();
  };

  const close = (returnFocus: boolean) => {
    clearTimeout(peekTimer);
    if (!isOpen()) return;
    const hadFocus = tray.contains(document.activeElement);
    tray.hidden = true;
    key.setAttribute('aria-expanded', 'false');
    lock('tray', false);
    if (returnFocus || hadFocus) key.focus();
  };

  const peek = () => {
    open(false);
    peekTimer = window.setTimeout(() => {
      if (!tray.contains(document.activeElement)) close(false);
    }, PEEK_MS);
  };

  /* ---------- Hold the key ≥350 ms ---------- */
  let holdTimer = 0;
  let held = false;
  key.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    held = false;
    holdTimer = window.setTimeout(() => {
      held = true;
      open(true);
    }, HOLD_MS);
  });
  const cancel = () => clearTimeout(holdTimer);
  key.addEventListener('pointerup', cancel);
  key.addEventListener('pointerleave', cancel);
  key.addEventListener('pointercancel', cancel);
  root.addEventListener(
    'click',
    (e) => {
      if (held && key.contains(e.target as Node)) {
        e.stopPropagation();
        e.preventDefault();
        held = false;
      }
    },
    true,
  );

  /* ---------- < / > step the speed (Video.js hotkeys) and show the tray ---------- */
  root.addEventListener('keydown', (e) => {
    if (e.key === '<' || e.key === '>') peek();
  });

  /* ---------- Tray keyboard: ←/→ roving, Esc closes ---------- */
  tray.addEventListener('keydown', (e) => {
    const i = buttons.indexOf(document.activeElement as HTMLButtonElement);
    if (e.key === 'Escape') {
      e.stopPropagation();
      close(true);
    } else if (e.key === 'ArrowRight' || e.key === 'ArrowLeft' || e.key === 'Home' || e.key === 'End') {
      e.preventDefault();
      e.stopPropagation();
      const n =
        e.key === 'Home' ? 0 : e.key === 'End' ? buttons.length - 1 : (i + (e.key === 'ArrowRight' ? 1 : -1) + buttons.length) % buttons.length;
      buttons.forEach((b, j) => (b.tabIndex = j === n ? 0 : -1));
      buttons[n].focus();
    } else if (e.key === ' ' || e.key === 'k' || e.key === 'K') {
      e.stopPropagation(); // Space selects the speed, not play/pause
    }
  });
  tray.addEventListener('focusout', () =>
    setTimeout(() => {
      if (isOpen() && !tray.contains(document.activeElement) && document.activeElement !== key) close(false);
    }),
  );
  document.addEventListener('pointerdown', (e) => {
    const t = e.target as Node;
    if (isOpen() && !tray.contains(t) && !key.contains(t)) close(false);
  });
}
