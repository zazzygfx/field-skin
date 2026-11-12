/*
 * FIELD — a Video.js 10 skin
 * Copyright 2026 Zazzy (@zazzygfx)
 * Licensed under the Apache License, Version 2.0
 *
 * Reshaped from the ejected Video.js 10 default HTML skin (v10.3.0).
 * Registers the Video.js elements FIELD uses, its icons, and the small
 * bits of behaviour CSS can't do (tape counter, play-key meter, chapter chip).
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
import {
  registerIcons,
  captionsOffIcon,
  captionsOnIcon,
  pauseIcon,
  pipEnterIcon,
  pipExitIcon,
  playIcon,
  restartIcon,
  volumeHighIcon,
  volumeLowIcon,
  volumeOffIcon,
} from '@videojs/html/icons';
import { fieldFullscreenEnterIcon, fieldFullscreenExitIcon, fieldSettingsIcon } from './icons';

registerIcons('default', {
  'captions-off': captionsOffIcon,
  'captions-on': captionsOnIcon,
  'fullscreen-enter': fieldFullscreenEnterIcon,
  'fullscreen-exit': fieldFullscreenExitIcon,
  pause: pauseIcon,
  'pip-enter': pipEnterIcon,
  'pip-exit': pipExitIcon,
  play: playIcon,
  restart: restartIcon,
  settings: fieldSettingsIcon,
  'volume-high': volumeHighIcon,
  'volume-low': volumeLowIcon,
  'volume-off': volumeOffIcon,
});

const pad = (n: number) => String(Math.floor(n)).padStart(2, '0');

/** Tape counter: always `HH MM SS`, so the width never jumps (SPEC §2). */
export function formatCounter(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '-- -- --';
  return `${pad(seconds / 3600)} ${pad((seconds % 3600) / 60)} ${pad(seconds % 60)}`;
}

/**
 * Wire the parts of one FIELD player that need JavaScript.
 * `root` is the `media-container.field` element.
 */
export function mountField(root: HTMLElement): void {
  const media = root.querySelector<HTMLMediaElement>('[data-field-media]');
  if (!media) return;

  const counter = root.querySelector<HTMLElement>('.field-counter');
  const meter = root.querySelector<HTMLElement>('.field-meter');
  const chipBadge = root.querySelector<HTMLElement>('.field-chip-badge');

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

  /** Cut the play-key meter into chapter segments with 1px gaps (SPEC §5). */
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
        return `#000 calc(${p}% - 0.5px), transparent calc(${p}% - 0.5px), transparent calc(${p}% + 0.5px), #000 calc(${p}% + 0.5px)`;
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
  media.querySelector('track[kind="chapters"]')?.addEventListener('load', readChapters);
  // Cues can land a moment after metadata; poll briefly until they do.
  let tries = 0;
  const poll = setInterval(() => {
    readChapters();
    if (chapters.length || ++tries > 40) clearInterval(poll);
  }, 250);

  render();
}
