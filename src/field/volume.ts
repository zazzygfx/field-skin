/*
 * FIELD — volume thumb-wheel (SPEC §6, Figma 178:886 / 180:629)
 * Copyright 2026 Zazzy (@zazzygfx)
 * Licensed under the Apache License, Version 2.0
 *
 * Opens in place inside the left pill, at the volume key. Tap the key = mute.
 * Hold ≥250 ms, hover 400 ms or ↑/↓ = open. Click anywhere on the wheel to
 * jump to that level, drag sideways to roll it (24 px per detent), scroll,
 * ↑/↓ (±1), PageUp/PageDown (±3), Home/End. The ribs roll one rib per detent.
 * Closes 1.5 s after the last input, 600 ms after the pointer leaves the pill,
 * on Esc, or on a click outside.
 */
import type { KeySounds } from './sounds';

const STEPS = 10;
const HOLD_MS = 250;
const HOVER_MS = 400;
const IDLE_CLOSE_MS = 1500;
const LEAVE_CLOSE_MS = 600;
const NUMBER_LINGER_MS = 600;
const SLIDE_MS = 220;
const DETENT_PX = 24;
const RIBS = 26;
const RIB_STEP = (83 / 12) * (Math.PI / 180); // Figma: 12 ribs from the centre reach ~83°
const ROLL_MS = 120;

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

const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

export function mountVolume(
  root: HTMLElement,
  media: HTMLMediaElement,
  sounds: KeySounds,
  lock: (why: string, on: boolean) => void,
): { open: () => void; close: () => void } {
  const noop = { open: () => {}, close: () => {} };
  const key = root.querySelector<HTMLElement>('.field-vol');
  const meter = root.querySelector<HTMLElement>('.field-wheel');
  const slot = meter?.querySelector<HTMLElement>('.field-wheel-slot');
  const ribsEl = meter?.querySelector<HTMLElement>('.field-wheel-ribs');
  const num = key?.querySelector<HTMLElement>('.field-vol-num');
  const pill = key?.closest<HTMLElement>('.field-pill');
  if (!key || !meter || !slot || !ribsEl || !num || !pill) return noop;

  if (!canSetVolume()) {
    root.setAttribute('data-field-no-volume', '');
    return noop; // the Video.js mute button keeps working on its own
  }

  const level = () => (media.muted ? 0 : Math.round(media.volume * STEPS));

  /* ---------- Ribs: spaced like a cylinder; `phase` is the drum rotation in detents ---------- */
  const ribs = Array.from({ length: RIBS }, () => {
    const r = document.createElement('i');
    ribsEl.append(r);
    return r;
  });
  let phase = level();
  const drawRibs = () => {
    const frac = phase - Math.floor(phase);
    ribs.forEach((r, i) => {
      const a = (i - 13 + frac) * RIB_STEP;
      const visible = Math.abs(a) < Math.PI / 2;
      r.style.opacity = visible ? String(0.3 + 0.4 * Math.cos(a)) : '0';
      r.style.left = `calc(50% + ${Math.sin(a).toFixed(4)} * (50% - 5px) - 0.75px)`;
    });
  };
  /** Roll the drum to `target` so every detent visibly moves the ribs by one. */
  let rollFrame = 0;
  const rollTo = (target: number) => {
    cancelAnimationFrame(rollFrame);
    if (reducedMotion()) {
      phase = target;
      return drawRibs();
    }
    const from = phase;
    const t0 = performance.now();
    const tick = (now: number) => {
      const k = Math.min(1, (now - t0) / ROLL_MS);
      phase = from + (target - from) * (1 - (1 - k) ** 3);
      drawRibs();
      rollFrame = k < 1 ? requestAnimationFrame(tick) : 0;
    };
    rollFrame = requestAnimationFrame(tick);
  };
  drawRibs();

  const sync = () => {
    const l = level();
    meter.setAttribute('aria-valuenow', String(l));
    meter.setAttribute('aria-valuetext', `Volume ${l} of ${STEPS}`);
    meter.style.setProperty('--field-vol', String(l));
    if (!dragging && !rollFrame) phase = l;
    num.textContent = String(l);
    root.toggleAttribute('data-field-vol-zero', l === 0);
  };
  media.addEventListener('volumechange', sync);

  /* ---------- Open / close ---------- */
  let closeTimer = 0;
  let lingerTimer = 0;
  let closingTimer = 0;
  let dragging = false;
  const isOpen = () => root.hasAttribute('data-field-wheel') && !root.hasAttribute('data-field-wheel-closing');

  const closeIn = (ms: number) => {
    clearTimeout(closeTimer);
    closeTimer = window.setTimeout(() => (dragging ? closeIn(IDLE_CLOSE_MS) : close()), ms);
  };
  /** Any input on the meter keeps it open for another 1.5 s. */
  const touch = () => isOpen() && closeIn(IDLE_CLOSE_MS);

  const open = () => {
    clearTimeout(lingerTimer);
    clearTimeout(closingTimer);
    root.removeAttribute('data-field-wheel-closing');
    if (!root.hasAttribute('data-field-wheel')) {
      sync();
      meter.hidden = false;
      meter.tabIndex = 0;
      root.setAttribute('data-field-wheel', '');
      root.setAttribute('data-field-vol-number', '');
      lock('wheel', true);
    }
    closeIn(IDLE_CLOSE_MS);
  };

  const close = () => {
    clearTimeout(closeTimer);
    if (!isOpen() || root.getAttribute('data-field-force') === 'volume') return;
    dragging = false;
    const hadFocus = meter.contains(document.activeElement);
    root.setAttribute('data-field-wheel-closing', ''); // meter slides back into the key
    closingTimer = window.setTimeout(
      () => {
        root.removeAttribute('data-field-wheel');
        root.removeAttribute('data-field-wheel-closing');
        meter.hidden = true;
        meter.tabIndex = -1;
        if (hadFocus) key.focus();
        lock('wheel', false);
        lingerTimer = window.setTimeout(() => root.removeAttribute('data-field-vol-number'), NUMBER_LINGER_MS);
      },
      reducedMotion() ? 0 : SLIDE_MS,
    );
  };

  /* ---------- Setting the level, one step at a time ---------- */
  const setLevel = (next: number) => {
    const l = Math.max(0, Math.min(STEPS, Math.round(next)));
    const prev = level();
    touch();
    if (l === prev) return;
    media.volume = l / STEPS;
    media.muted = l === 0;
    sync();
    rollTo(l);
    sounds.play('detent');
    key.setAttribute('data-field-sink', ''); // 1-frame key sink per detent
    requestAnimationFrame(() => requestAnimationFrame(() => key.removeAttribute('data-field-sink')));
    if ('vibrate' in navigator && /Android/i.test(navigator.userAgent)) navigator.vibrate?.(8);
  };
  const step = (delta: number) => {
    open();
    setLevel(level() + delta);
  };
  /** Pointer x → level: click anywhere on the wheel to jump there; the far-left edge is 0. */
  const levelAt = (clientX: number) => {
    const r = slot.getBoundingClientRect();
    const pct = (clientX - r.left) / r.width;
    return pct < 0.03 ? 0 : Math.ceil(Math.min(1, pct) * STEPS);
  };

  /* ---------- Wheel: click jumps to that level, then drag sideways rolls it ---------- */
  let dragX = 0;
  let dragLevel = 0;
  meter.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    e.preventDefault();
    meter.setPointerCapture(e.pointerId);
    dragging = true;
    setLevel(levelAt(e.clientX));
    dragX = e.clientX;
    dragLevel = level();
  });
  meter.addEventListener('pointermove', (e) => {
    if (dragging) setLevel(dragLevel + (e.clientX - dragX) / DETENT_PX);
  });
  const endDrag = () => {
    if (!dragging) return;
    dragging = false;
    touch();
  };
  meter.addEventListener('pointerup', endDrag);
  meter.addEventListener('pointercancel', endDrag);
  meter.addEventListener('lostpointercapture', endDrag);

  /* ---------- Key: tap = mute, hold = open (then slide onto the meter) ---------- */
  let holdTimer = 0;
  let held = false;
  key.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    held = false;
    clearTimeout(holdTimer);
    holdTimer = window.setTimeout(() => {
      held = true;
      open();
      key.setPointerCapture?.(e.pointerId);
    }, HOLD_MS);
  });
  let holdX = 0;
  let holdLevel = 0;
  key.addEventListener('pointerdown', (e) => {
    holdX = e.clientX;
    holdLevel = level();
  });
  // after a hold, keep the finger down and slide sideways to roll
  key.addEventListener('pointermove', (e) => {
    if (held) setLevel(holdLevel + (e.clientX - holdX) / DETENT_PX);
  });
  const release = () => {
    clearTimeout(holdTimer);
    if (held) touch();
  };
  key.addEventListener('pointerup', release);
  key.addEventListener('pointercancel', release);
  // A hold must not also toggle mute: swallow the click that follows it.
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

  /* ---------- Hover: 400 ms on the key opens; leaving the pill closes after 600 ms ---------- */
  let hoverTimer = 0;
  key.addEventListener('pointerenter', (e) => {
    if (e.pointerType === 'mouse') hoverTimer = window.setTimeout(open, HOVER_MS);
  });
  key.addEventListener('pointerleave', () => clearTimeout(hoverTimer));
  pill.addEventListener('pointerleave', (e) => {
    clearTimeout(hoverTimer);
    if (isOpen() && !dragging && e.pointerType === 'mouse') closeIn(LEAVE_CLOSE_MS);
  });
  pill.addEventListener('pointermove', (e) => {
    if (e.pointerType === 'mouse' && meter.contains(e.target as Node)) touch();
  });

  /* ---------- Click outside closes ---------- */
  document.addEventListener('pointerdown', (e) => {
    if (isOpen() && !pill.contains(e.target as Node)) close();
  });

  /* ---------- Scroll ---------- */
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
  meter.addEventListener('wheel', onWheel, { passive: false });
  key.addEventListener('wheel', onWheel, { passive: false });

  /* ---------- Keyboard: ↑/↓ anywhere in the player; more keys on the meter; Esc closes ---------- */
  root.addEventListener('keydown', (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.key === 'Escape' && isOpen()) {
      e.stopPropagation();
      close();
      return;
    }
    const t = e.target as HTMLElement;
    const onMeter = meter.contains(t);
    // other sliders and menus keep their own arrow keys
    if (!onMeter && t.closest?.('[role="slider"], [role="menu"], [role="menuitemradio"], .field-tray')) return;
    let delta = 0;
    if (e.key === 'ArrowUp' || (onMeter && e.key === 'ArrowRight')) delta = 1;
    else if (e.key === 'ArrowDown' || (onMeter && e.key === 'ArrowLeft')) delta = -1;
    else if (onMeter && e.key === 'PageUp') delta = 3;
    else if (onMeter && e.key === 'PageDown') delta = -3;
    else if (onMeter && e.key === 'Home') delta = -STEPS;
    else if (onMeter && e.key === 'End') delta = STEPS;
    else return;
    e.preventDefault();
    e.stopPropagation();
    step(delta);
  });

  sync();
  return { open, close };
}
