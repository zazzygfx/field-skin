/*
 * FIELD — a Video.js 10 skin
 * Copyright 2026 Zazzy (@zazzygfx)
 * Licensed under the Apache License, Version 2.0
 *
 * Reshaped from the ejected Video.js 10 default HTML skin (v10.3.0).
 * Registers the Video.js elements FIELD uses, plus the small bits of
 * behaviour CSS can't do: tape counter, play-key meter, chapter chip,
 * controls lock while hovered/focused, settings panel, key sounds.
 */
import './field.css';
import '@videojs/html/i18n';
import '@videojs/html/ui/container';
import '@videojs/html/ui/poster';
import '@videojs/html/ui/controls';
import '@videojs/html/ui/controls-backdrop';
import '@videojs/html/ui/controls-content';
import '@videojs/html/ui/controls-group';
import '@videojs/html/ui/play-button';
import '@videojs/html/ui/seek-button';
import '@videojs/html/ui/mute-button';
import '@videojs/html/ui/time-slider';
import '@videojs/html/ui/time-slider-chapters';
import '@videojs/html/ui/slider-track';
import '@videojs/html/ui/slider-fill';
import '@videojs/html/ui/slider-buffer';
import '@videojs/html/ui/slider-thumb';
import '@videojs/html/ui/captions-button';
import '@videojs/html/ui/playback-rate-button';
import '@videojs/html/ui/pip-button';
import '@videojs/html/ui/fullscreen-button';
import '@videojs/html/ui/hotkey';
import '@videojs/html/ui/gesture';
import '@videojs/html/ui/status-announcer';
import { KeySounds } from './sounds';

const pad = (n: number) => String(Math.floor(n)).padStart(2, '0');

/** Tape counter: always `HH MM SS`, so the width never jumps (SPEC §2). */
export function formatCounter(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '-- -- --';
  return `${pad(seconds / 3600)} ${pad((seconds % 3600) / 60)} ${pad(seconds % 60)}`;
}

type ControlsState = { requestControlsLock?: () => () => void };
type PlayerEl = HTMLElement & { store?: { state?: ControlsState } };

/**
 * Wire the parts of one FIELD player that need JavaScript.
 * `root` is the `media-container.field` element.
 */
export function mountField(root: HTMLElement): void {
  const media = root.querySelector<HTMLMediaElement>('[data-field-media]');
  if (!media) return;
  const player = root.closest<PlayerEl>('video-player');

  const counter = root.querySelector<HTMLElement>('.field-counter');
  const meter = root.querySelector<HTMLElement>('.field-meter');
  const chipBadge = root.querySelector<HTMLElement>('.field-chip-badge');
  const controls = root.querySelector<HTMLElement>('.field-controls-content');
  const settingsKey = root.querySelector<HTMLElement>('.field-settings');
  const settingsPanel = root.querySelector<HTMLElement>('.field-settings-panel');

  /* ---------- Counter, meter, chip ---------- */
  let chapters: { start: number; end: number }[] = [];

  const render = () => {
    const t = media.currentTime;
    const d = media.duration;
    const ready = media.readyState >= 1 && Number.isFinite(d) && d > 0;
    if (counter) counter.textContent = ready ? formatCounter(t) : '-- -- --';
    root.style.setProperty('--field-progress', ready ? `${(t / d) * 100}%` : '0%');
    if (chipBadge) {
      const i = chapters.findIndex((c) => t >= c.start && t < c.end);
      chipBadge.hidden = i < 0;
      if (i >= 0) chipBadge.textContent = `CH ${i + 1}`;
    }
  };

  /** Cut the play-key meter into chapter segments with 2px gaps (Figma 174:338). */
  const segmentMeter = () => {
    if (!meter) return;
    const d = media.duration;
    if (!chapters.length || !Number.isFinite(d) || d <= 0) {
      meter.style.removeProperty('mask-image');
      return;
    }
    const stops = chapters
      .slice(1)
      .map((c) => {
        const p = (c.start / d) * 100;
        return `#000 calc(${p}% - 1px), transparent calc(${p}% - 1px), transparent calc(${p}% + 1px), #000 calc(${p}% + 1px)`;
      })
      .join(', ');
    meter.style.maskImage = `linear-gradient(to right, #000 0, ${stops}, #000 100%)`;
  };

  const readChapters = () => {
    const track = Array.from(media.textTracks ?? []).find((tt) => tt.kind === 'chapters');
    if (!track) return;
    if (track.mode === 'disabled') track.mode = 'hidden';
    const cues = track.cues;
    if (!cues || !cues.length) return;
    chapters = Array.from(cues).map((c) => ({ start: c.startTime, end: c.endTime }));
    root.toggleAttribute('data-field-chapters', true);
    segmentMeter();
    render();
  };

  for (const ev of ['timeupdate', 'durationchange', 'loadedmetadata', 'seeking', 'emptied']) {
    media.addEventListener(ev, render);
  }
  media.addEventListener('loadedmetadata', readChapters);
  media.textTracks?.addEventListener?.('addtrack', () => setTimeout(readChapters));
  let tries = 0;
  const poll = setInterval(() => {
    readChapters();
    if (chapters.length || ++tries > 40) clearInterval(poll);
  }, 250);
  render();

  /* ---------- Controls never hide while hovered or focused (SPEC §4) ---------- */
  const locks = new Map<string, () => void>();
  const lock = (why: string, on: boolean) => {
    if (on && !locks.has(why)) {
      const release = player?.store?.state?.requestControlsLock?.();
      if (release) locks.set(why, release);
    } else if (!on && locks.has(why)) {
      locks.get(why)!();
      locks.delete(why);
    }
  };
  controls?.addEventListener('pointerenter', (e) => e.pointerType === 'mouse' && lock('hover', true));
  controls?.addEventListener('pointerleave', () => lock('hover', false));
  root.addEventListener('focusin', () => lock('focus', !!root.querySelector('.field-controls-content :focus-visible')));
  root.addEventListener('focusout', () => setTimeout(() => lock('focus', !!root.querySelector('.field-controls-content :focus-visible'))));

  /* ---------- Key sounds ---------- */
  const sounds = new KeySounds(media);
  let lastInput = 0;
  const markInput = () => (lastInput = performance.now());
  root.addEventListener('pointerdown', markInput, true);
  root.addEventListener('keydown', markInput, true);

  root.addEventListener('pointerdown', (e) => {
    const key = (e.target as Element).closest('.field-key');
    if (key && !key.matches('.field-play') && !key.matches('[aria-disabled="true"]')) sounds.play('tick');
  });
  root.addEventListener('keydown', (e) => {
    if (e.repeat || (e.key !== 'Enter' && e.key !== ' ')) return;
    const key = (e.target as Element).closest?.('.field-key');
    if (key && !key.matches('.field-play')) sounds.play('tick');
  });
  // Play/pause clunk only when a person caused it (click, tap, Space, K…), not autoplay or end.
  const clunk = () => performance.now() - lastInput < 400 && sounds.play('clunk');
  media.addEventListener('play', clunk);
  media.addEventListener('pause', clunk);

  /* ---------- Settings panel (grows from its key) ---------- */
  const segs = settingsPanel?.querySelectorAll<HTMLButtonElement>('[data-key-sounds]') ?? [];
  const syncSounds = () =>
    segs.forEach((b) => b.setAttribute('aria-checked', String((b.dataset.keySounds === 'on') === sounds.enabled)));
  segs.forEach((b) =>
    b.addEventListener('click', () => {
      sounds.set(b.dataset.keySounds === 'on');
      syncSounds();
      sounds.play('tick');
    }),
  );
  syncSounds();

  const setOpen = (open: boolean, focusKey = false) => {
    if (!settingsKey || !settingsPanel) return;
    if (open === !settingsPanel.hidden) return;
    settingsPanel.hidden = !open;
    settingsKey.setAttribute('aria-expanded', String(open));
    settingsKey.toggleAttribute('data-active', open);
    lock('menu', open);
    if (open) {
      sounds.play('menu');
      settingsPanel.querySelector<HTMLElement>('[aria-checked="true"]')?.focus({ preventScroll: true });
    } else if (focusKey) settingsKey.focus();
  };
  settingsKey?.addEventListener('click', () => setOpen(!!settingsPanel?.hidden));
  root.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && settingsPanel && !settingsPanel.hidden) {
      e.stopPropagation();
      setOpen(false, true);
    }
  });
  document.addEventListener('pointerdown', (e) => {
    const t = e.target as Node;
    if (settingsPanel && !settingsPanel.hidden && !settingsPanel.contains(t) && !settingsKey?.contains(t)) setOpen(false);
  });
}
