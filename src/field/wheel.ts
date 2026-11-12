/*
 * FIELD — volume thumb-wheel (SPEC §6, Figma 178:886 / 180:629)
 * Copyright 2026 Zazzy (@zazzygfx)
 * Licensed under the Apache License, Version 2.0
 *
 * Opens in place inside the left pill, at the volume key. Tap the key = mute.
 * Hold ≥250 ms, hover 400 ms or ↑/↓ = open. Drag sideways (24 px per detent),
 * scroll, ↑/↓ (±1), PageUp/PageDown (±3). Closes 1.5 s after the last input.
 */
import type { KeySounds } from './sounds';

const RIBS = 26;
const DETENT_PX = 24;
const HOLD_MS = 250;
const HOVER_MS = 400;
const IDLE_CLOSE_MS = 1500;
const NUMBER_LINGER_MS = 600;

/** iPhone/iPad can't set media volume from script: the key only mutes there. */
export function canSetVolume(): boolean {
  try {
    const v = document.createElement('video');
    v.volume = 0.5;
    return v.volume === 0.5;
  } catch {
    return false;
  }
}

export function mountWheel(
  root: HTMLElement,
  media: HTMLMediaElement,
  sounds: KeySounds,
  lock: (why: string, on: boolean) => void,
): void {
  const key = root.querySelector<HTMLElement>('.field-vol');
  const wheel = root.querySelector<HTMLElement>('.field-wheel');
  const ribsEl = wheel?.querySelector<HTMLElement>('.field-wheel-ribs');
  const num = key?.querySelector<HTMLElement>('.field-vol-num');
  const pill = key?.closest<HTMLElement>('.field-pill');
  if (!key || !wheel || !ribsEl || !num || !pill) return;

  if (!canSetVolume()) {
    root.setAttribute('data-field-no-volume', '');
    return; // the Video.js mute button keeps working on its own
  }

  /* ---------- Ribs: spaced like a cylinder seen side-on ---------- */
  const ribs = Array.from({ length: RIBS }, () => {
    const r = document.createElement('i');
    ribsEl.append(r);
    return r;
  });
  const STEP = (83 / 12) * (Math.PI / 180); // Figma: 12 ribs from the centre reach ~83°

  const level = () => (media.muted ? 0 : Math.round(media.volume * 10));
  let phase = 0; // continuous drum rotation in detents (fractional while dragging)

  const drawRibs = () => {
    const frac = phase - Math.floor(phase);
    ribs.forEach((r, i) => {
      const a = (i - 13 + frac) * STEP;
      const visible = Math.abs(a) < Math.PI / 2;
      r.style.opacity = visible ? String(0.3 + 0.4 * Math.cos(a)) : '0';
      r.style.left = `calc(50% + ${Math.sin(a).toFixed(4)} * (50% - 5px) - 0.75px)`;
    });
  };

  const sync = () => {
    const l = level();
    wheel.setAttribute('aria-valuenow', String(l));
    wheel.setAttribute('aria-valuetext', `Volume ${l} of 10`);
    wheel.style.setProperty('--field-vol', String(l));
    num.textContent = String(l);
    root.toggleAttribute('data-field-vol-zero', l === 0);
  };

  /* ---------- Open / close ---------- */
  let closeTimer = 0;
  let lingerTimer = 0;
  let hovering = false;
  const isOpen = () => root.hasAttribute('data-field-wheel');

  const scheduleClose = () => {
    clearTimeout(closeTimer);
    closeTimer = window.setTimeout(() => {
      if (hovering || dragging) return scheduleClose();
      close();
    }, IDLE_CLOSE_MS);
  };

  const open = () => {
    clearTimeout(lingerTimer);
    if (!isOpen()) {
      phase = level();
      drawRibs();
      sync();
      wheel.hidden = false;
      wheel.tabIndex = 0;
      root.setAttribute('data-field-wheel', '');
      root.setAttribute('data-field-vol-number', '');
      lock('wheel', true);
    }
    scheduleClose();
  };

  const close = () => {
    clearTimeout(closeTimer);
    if (!isOpen()) return;
    const hadFocus = wheel.contains(document.activeElement);
    root.setAttribute('data-field-wheel-closing', '');
    // roll back into the key (220 ms), then hide
    window.setTimeout(() => {
      root.removeAttribute('data-field-wheel');
      root.removeAttribute('data-field-wheel-closing');
      wheel.hidden = true;
      wheel.tabIndex = -1;
      if (hadFocus) key.focus();
      lock('wheel', false);
      lingerTimer = window.setTimeout(() => root.removeAttribute('data-field-vol-number'), NUMBER_LINGER_MS);
    }, prefersReducedMotion() ? 0 : 220);
  };

  /* ---------- Setting the level, one detent at a time ---------- */
  const setLevel = (next: number) => {
    const l = Math.max(0, Math.min(10, Math.round(next)));
    const prev = level();
    if (l === prev) return;
    media.volume = l / 10;
    media.muted = l === 0;
    const steps = Math.abs(l - prev);
    for (let s = 0; s < Math.min(steps, 3); s++) window.setTimeout(detentFeedback, s * 30);
  };

  const detentFeedback = () => {
    sounds.play('detent');
    if ('vibrate' in navigator && /Android/i.test(navigator.userAgent)) navigator.vibrate?.(8);
    key.setAttribute('data-field-sink', '');
    requestAnimationFrame(() => requestAnimationFrame(() => key.removeAttribute('data-field-sink')));
  };

  const step = (delta: number) => {
    open();
    setLevel(level() + delta);
    phase = level();
    drawRibs();
  };

  media.addEventListener('volumechange', () => {
    sync();
    if (!dragging) {
      phase = level();
      drawRibs();
    }
  });

  /* ---------- Key: tap = mute, hold = open (then drag to roll) ---------- */
  let holdTimer = 0;
  let heldOpen = false;
  let dragging = false;
  let dragStartX = 0;
  let dragStartLevel = 0;

  const beginDrag = (x: number) => {
    dragging = true;
    dragStartX = x;
    dragStartLevel = level();
    root.setAttribute('data-field-wheel-drag', '');
  };
  const moveDrag = (x: number) => {
    if (!dragging) return;
    const d = (x - dragStartX) / DETENT_PX;
    setLevel(dragStartLevel + d);
    phase = dragStartLevel + Math.max(-dragStartLevel, Math.min(10 - dragStartLevel, d));
    drawRibs();
    scheduleClose();
  };
  const endDrag = () => {
    if (!dragging) return;
    dragging = false;
    root.removeAttribute('data-field-wheel-drag');
    phase = level();
    drawRibs();
    scheduleClose();
  };

  key.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    heldOpen = false;
    clearTimeout(holdTimer);
    holdTimer = window.setTimeout(() => {
      heldOpen = true;
      open();
      key.setPointerCapture?.(e.pointerId);
      beginDrag(e.clientX);
    }, HOLD_MS);
  });
  key.addEventListener('pointermove', (e) => heldOpen && moveDrag(e.clientX));
  const release = () => {
    clearTimeout(holdTimer);
    if (heldOpen) endDrag();
  };
  key.addEventListener('pointerup', release);
  key.addEventListener('pointercancel', release);
  // A hold must not also toggle mute: swallow the click that follows it.
  root.addEventListener(
    'click',
    (e) => {
      if (heldOpen && key.contains(e.target as Node)) {
        e.stopPropagation();
        e.preventDefault();
        heldOpen = false;
      }
    },
    true,
  );

  /* ---------- Hover 400 ms opens (mouse only); pointer over the pill keeps it open ---------- */
  let hoverTimer = 0;
  key.addEventListener('pointerenter', (e) => {
    if (e.pointerType !== 'mouse') return;
    hoverTimer = window.setTimeout(open, HOVER_MS);
  });
  key.addEventListener('pointerleave', () => clearTimeout(hoverTimer));
  pill.addEventListener('pointerenter', (e) => e.pointerType === 'mouse' && (hovering = true));
  pill.addEventListener('pointerleave', () => {
    hovering = false;
    if (isOpen()) scheduleClose();
  });

  /* ---------- Wheel: drag sideways, scroll ---------- */
  wheel.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    e.preventDefault();
    wheel.setPointerCapture(e.pointerId);
    beginDrag(e.clientX);
  });
  wheel.addEventListener('pointermove', (e) => moveDrag(e.clientX));
  wheel.addEventListener('pointerup', endDrag);
  wheel.addEventListener('pointercancel', endDrag);

  let wheelAcc = 0;
  const onWheel = (e: WheelEvent) => {
    if (!isOpen()) return;
    e.preventDefault();
    const d = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : -e.deltaY;
    wheelAcc += e.deltaMode === 1 ? d * 16 : d;
    while (Math.abs(wheelAcc) >= 40) {
      step(Math.sign(wheelAcc));
      wheelAcc -= Math.sign(wheelAcc) * 40;
    }
  };
  wheel.addEventListener('wheel', onWheel, { passive: false });
  key.addEventListener('wheel', onWheel, { passive: false });

  /* ---------- Keyboard: ↑/↓ anywhere in the player; PageUp/Down, Home/End on the wheel ---------- */
  root.addEventListener('keydown', (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const t = e.target as HTMLElement;
    const onWheelEl = wheel.contains(t);
    // other sliders and menus keep their own arrow keys
    if (!onWheelEl && t.closest?.('[role="slider"], [role="menu"], [role="menuitemradio"], .field-tray')) return;
    let delta = 0;
    if (e.key === 'ArrowUp' || (onWheelEl && e.key === 'ArrowRight')) delta = 1;
    else if (e.key === 'ArrowDown' || (onWheelEl && e.key === 'ArrowLeft')) delta = -1;
    else if (onWheelEl && e.key === 'PageUp') delta = 3;
    else if (onWheelEl && e.key === 'PageDown') delta = -3;
    else if (onWheelEl && e.key === 'Home') delta = -10;
    else if (onWheelEl && e.key === 'End') delta = 10;
    else if (onWheelEl && e.key === 'Escape') {
      e.stopPropagation();
      close();
      return;
    } else return;
    e.preventDefault();
    e.stopPropagation();
    step(delta);
  });

  sync();
  drawRibs();
}

function prefersReducedMotion(): boolean {
  return matchMedia('(prefers-reduced-motion: reduce)').matches;
}
