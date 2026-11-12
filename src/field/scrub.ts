/*
 * FIELD — seek hover + scrub (SPEC §4, states 03)
 * Copyright 2026 Zazzy (@zazzygfx)
 * Licensed under the Apache License, Version 2.0
 *
 * Pointer over the strip: a ghost needle follows 1:1 with a counter tag on a
 * hairline above it, and a storyboard frame (Video.js thumbnail) with
 * "02:03 · Chapter". While dragging, the main counter rolls to the scrub time.
 */
import { formatCounter } from './counter';

export type Chapter = { start: number; end: number; title: string };

const mmss = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

export function mountScrub(
  root: HTMLElement,
  media: HTMLMediaElement,
  getChapters: () => Chapter[],
  onScrub: (time: number | null) => void,
): { showAt: (pct: number) => void } {
  const strip = root.querySelector<HTMLElement>('.field-strip');
  const slider = root.querySelector<HTMLElement>('.field-strip-slider');
  const tag = root.querySelector<HTMLElement>('.field-scrub-tag');
  const label = root.querySelector<HTMLElement>('.field-scrub-label');
  const frame = root.querySelector<HTMLElement>('.field-scrub-frame');
  if (!strip || !slider || !tag || !label || !frame) return { showAt: () => {} };

  let hovering = false;
  let dragging = false;

  const show = (clientX: number) => {
    const d = media.duration;
    if (!Number.isFinite(d) || d <= 0) return;
    const r = slider.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (clientX - r.left) / r.width));
    const t = pct * d;
    const x = pct * r.width;

    slider.style.setProperty('--field-hover-x', `${x}px`);
    // keep tag + frame inside the strip
    const clamp = (w: number) => Math.max(w / 2 - 12, Math.min(r.width + 13 - w / 2, x));
    slider.style.setProperty('--field-tag-x', `${clamp(tag.offsetWidth || 80)}px`);
    slider.style.setProperty('--field-frame-x', `${clamp(262)}px`);

    tag.textContent = formatCounter(t);
    const ch = getChapters().find((c) => t >= c.start && t < c.end);
    label.textContent = ch ? `${mmss(t)} · ${ch.title}` : mmss(t);
    root.setAttribute('data-field-scrubbing', '');
    if (dragging) onScrub(t);
  };

  const hide = () => {
    if (hovering || dragging || root.getAttribute('data-field-force') === 'scrub') return;
    root.removeAttribute('data-field-scrubbing');
    onScrub(null);
  };

  // Hover lives inside the slider's 44px hit band; leaving it, cancelling,
  // or the controls fading all hide the preview + tag at once.
  const hideNow = () => {
    hovering = false;
    dragging = false;
    hide();
  };
  slider.addEventListener('pointermove', (e) => {
    if (e.pointerType === 'mouse') hovering = true;
    if (hovering || dragging) show(e.clientX);
  });
  slider.addEventListener('pointerleave', () => {
    hovering = false;
    if (!slider.hasAttribute('data-dragging')) hideNow();
  });
  slider.addEventListener('pointercancel', hideNow);
  slider.addEventListener('pointerdown', (e) => {
    dragging = true;
    show(e.clientX);
  });
  // a click without a drag never sets data-dragging: end the press on release
  document.addEventListener('pointerup', () => {
    if (!dragging) return;
    dragging = slider.hasAttribute('data-dragging');
    if (!dragging) {
      onScrub(null);
      hide();
    }
  });
  document.addEventListener('pointercancel', () => dragging && hideNow());
  document.addEventListener('pointermove', (e) => dragging && show(e.clientX));

  // Video.js marks the slider data-dragging while a drag is in progress
  new MutationObserver(() => {
    const now = slider.hasAttribute('data-dragging');
    if (now) dragging = true;
    else if (dragging) {
      dragging = false;
      onScrub(null);
      hide();
    }
  }).observe(slider, { attributes: true, attributeFilter: ['data-dragging'] });

  // controls fading takes the preview with them
  new MutationObserver(() => {
    if (!root.hasAttribute('data-controls-visible')) hideNow();
  }).observe(root, { attributes: true, attributeFilter: ['data-controls-visible'] });

  // no storyboard → no frame (Video.js marks the thumbnail data-hidden / data-error)
  const syncFrame = () =>
    root.toggleAttribute('data-field-no-frame', frame.hasAttribute('data-hidden') || frame.hasAttribute('data-error'));
  new MutationObserver(syncFrame).observe(frame, { attributes: true, attributeFilter: ['data-hidden', 'data-error'] });
  syncFrame();
  return {
    showAt: (pct: number) => {
      const r = slider.getBoundingClientRect();
      show(r.left + pct * r.width);
    },
  };
}
