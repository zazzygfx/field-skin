/*
 * FIELD — states + fallbacks (SPEC §10)
 * Copyright 2026 Zazzy (@zazzygfx)
 * Licensed under the Apache License, Version 2.0
 *
 * Pause shelf (Figma 174:809 / 174:922) and phone pause sheet, seek / mute
 * bubbles from their key, ended, error, picture-in-picture, live / behind
 * live, no captions. Everything is driven by attributes on the player root.
 */
import type { Chapter } from './scrub';
import type { KeySounds } from './sounds';
import { showKeyBubble, hideKeyBubble } from './bubble';

const mmss = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

export type StatesApi = {
  seekBubble: (dir: 1 | -1, persist?: boolean) => void;
  muteBubble: (persist?: boolean) => void;
  hideBubble: () => void;
  syncShelf: () => void;
  isLive: () => boolean;
  behindLive: () => number;
};

export function mountStates(
  root: HTMLElement,
  media: HTMLMediaElement,
  sounds: KeySounds,
  getChapters: () => Chapter[],
  lock: (why: string, on: boolean) => void,
  forced: () => string | null,
): StatesApi {
  const $ = <T extends HTMLElement = HTMLElement>(s: string) => root.querySelector<T>(s);
  const bigplay = $('.field-bigplay');

  /* ---------- Key bubbles: +10s → 01:33 / Muted · tap to unmute (states 04, 06) ---------- */
  const showBubble = (anchor: HTMLElement | null, text: string, persist = false) => showKeyBubble(root, anchor, text, persist);
  const hideBubble = () => hideKeyBubble(root);
  const seekBubble = (dir: 1 | -1, persist = false) => {
    const d = Number.isFinite(media.duration) ? media.duration : Infinity;
    const to = Math.max(0, Math.min(d, media.currentTime + dir * 10));
    showBubble($(`media-seek-button[seconds="${dir > 0 ? 10 : -10}"]`), `${dir > 0 ? '+' : '−'}10s → ${mmss(to)}`, persist);
  };
  const muteBubble = (persist = false) => showBubble($('.field-vol'), 'Muted · tap to unmute', persist);

  // which seek did a person ask for? (click on ±10, or J / L / ← / →)
  root.addEventListener('click', (e) => {
    const k = (e.target as Element).closest?.('media-seek-button');
    if (k && root.contains(k)) seekBubble(Number(k.getAttribute('seconds')) > 0 ? 1 : -1);
  });
  root.addEventListener('keydown', (e) => {
    const t = e.target as HTMLElement;
    if (e.metaKey || e.ctrlKey || e.altKey || t.closest?.('[role="slider"], [role="menu"], .field-tray, .field-shelf')) return;
    if (e.key === 'l' || e.key === 'L' || e.key === 'ArrowRight') seekBubble(1);
    if (e.key === 'j' || e.key === 'J' || e.key === 'ArrowLeft') seekBubble(-1);
  });
  let lastInput = 0;
  root.addEventListener('pointerdown', () => (lastInput = performance.now()), true);
  root.addEventListener('keydown', () => (lastInput = performance.now()), true);
  let wasMuted = media.muted;
  media.addEventListener('volumechange', () => {
    const nowMuted = media.muted || media.volume === 0;
    if (nowMuted && !wasMuted && performance.now() - lastInput < 600 && !root.hasAttribute('data-field-wheel') && !root.hasAttribute('data-field-ios-hint')) muteBubble();
    if (!nowMuted && wasMuted) hideBubble();
    wasMuted = nowMuted;
  });

  /* ---------- Pause shelf (XL/M) + phone pause sheet ---------- */
  const shelf = $('.field-shelf');
  const chaptersBox = $('.field-shelf-chapters');
  const list = $('.field-shelf-list');
  const jumps = $('.field-shelf-jumps');
  let dismissed = false;
  let builtFor = '';

  const buildChapters = () => {
    const chapters = getChapters();
    const key = chapters.map((c) => c.start).join(',');
    if (!list || key === builtFor) return;
    builtFor = key;
    list.replaceChildren(
      ...chapters.map((c, i) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'field-shelf-chapter';
        b.dataset.start = String(c.start);
        b.innerHTML = `<span class="field-shelf-n">${i + 1}</span><span class="field-shelf-title"></span><span class="field-shelf-time">${mmss(c.start)}</span>`;
        b.querySelector('.field-shelf-title')!.textContent = c.title || `Chapter ${i + 1}`;
        b.addEventListener('click', () => {
          media.currentTime = c.start;
          void media.play();
        });
        return b;
      }),
    );
  };

  const syncShelf = () => {
    if (!shelf) return;
    const started = bigplay?.hasAttribute('data-started') ?? false;
    const paused = media.paused;
    const ended = media.ended || bigplay?.hasAttribute('data-ended');
    const size = root.getAttribute('data-field-size');
    const blocked =
      !!forced() || // a forced dev state shows only that state
      root.hasAttribute('data-field-error') ||
      root.hasAttribute('data-field-pip') ||
      root.hasAttribute('data-field-scrubbing');
    const want = paused && started && !ended && !dismissed && !blocked;
    // touch: pause shows only the big centred key; chapters live in the More sheet
    const touch = matchMedia('(pointer: coarse)').matches;
    const sheet = false;
    const show = want && !touch && (size === 'xl' || size === 'm');

    const chapters = getChapters();
    const hasChapters = chapters.length > 1 && !root.hasAttribute('data-field-no-chapters');
    if (hasChapters) buildChapters();
    if (chaptersBox) chaptersBox.hidden = !hasChapters;
    if (jumps) jumps.hidden = hasChapters;
    const t = media.currentTime;
    list?.querySelectorAll<HTMLElement>('.field-shelf-chapter').forEach((b, i) => {
      const c = chapters[i];
      b.toggleAttribute('data-current', !!c && t >= c.start && t < c.end);
    });

    root.toggleAttribute('data-field-shelf', show && !sheet);
    root.toggleAttribute('data-field-sheet', show && sheet);
    if (show && sheet && !shelf.matches(':popover-open')) shelf.showPopover?.();
    if (!(show && sheet) && shelf.matches(':popover-open')) shelf.hidePopover?.();
  };
  for (const ev of ['pause', 'play', 'playing', 'seeked', 'ended', 'loadedmetadata']) media.addEventListener(ev, syncShelf);
  media.addEventListener('play', () => (dismissed = false));
  new MutationObserver(syncShelf).observe(root, { attributes: true, attributeFilter: ['data-field-size', 'data-field-error', 'data-field-pip', 'data-field-scrubbing', 'data-field-no-chapters'] });

  $('.field-shelf-restart')?.addEventListener('click', () => {
    media.currentTime = 0;
    void media.play();
  });
  jumps?.querySelectorAll<HTMLButtonElement>('[data-jump]').forEach((b) =>
    b.addEventListener('click', () => {
      const d = Number.isFinite(media.duration) ? media.duration : Infinity;
      media.currentTime = Math.max(0, Math.min(d, media.currentTime + Number(b.dataset.jump)));
      sounds.play('tick');
      syncShelf();
    }),
  );
  const dismiss = () => {
    dismissed = true;
    syncShelf();
  };
  root.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape' || !(root.hasAttribute('data-field-shelf') || root.hasAttribute('data-field-sheet'))) return;
    if (root.hasAttribute('data-field-wheel') || document.querySelector('.field-menu:popover-open')) return;
    dismiss();
  });
  shelf?.addEventListener('keydown', (e) => e.key === 'Escape' && dismiss());
  // phone sheet: tap the scrim (outside the sheet) to hide it
  document.addEventListener('pointerdown', (e) => {
    if (root.hasAttribute('data-field-sheet') && shelf && !shelf.contains(e.target as Node)) dismiss();
  });

  /* ---------- Ended (12): "Watch again?" ---------- */
  const endedBox = $('.field-ended');
  const syncEnded = () => {
    const ended = media.ended || forced() === 'ended';
    if (endedBox) endedBox.hidden = !ended;
    root.toggleAttribute('data-field-ended', ended);
  };
  for (const ev of ['ended', 'play', 'seeking', 'emptied']) media.addEventListener(ev, syncEnded);

  /* ---------- Error (13): one action, controls dim ---------- */
  const errorBox = $('.field-error');
  const setError = (on: boolean) => {
    root.toggleAttribute('data-field-error', on);
    if (errorBox) errorBox.hidden = !on;
    if (on) $('.field-error-retry')?.focus({ preventScroll: true });
  };
  media.addEventListener('error', () => setError(true));
  $('.field-error-retry')?.addEventListener('click', () => {
    const t = media.currentTime;
    setError(false);
    if (forced() === 'error') return;
    const src = media.getAttribute('src');
    if (src) {
      media.removeAttribute('src');
      media.setAttribute('src', src);
    } else media.load();
    media.addEventListener('loadedmetadata', () => (media.currentTime = t), { once: true });
    void media.play();
  });

  /* ---------- Picture-in-picture (17) ---------- */
  const pipKey = $('media-pip-button');
  const pipNote = $('.field-pipnote');
  const syncPip = () => {
    const on = pipKey?.hasAttribute('data-pip') || root.hasAttribute('data-field-docpip') || forced() === 'pip';
    root.toggleAttribute('data-field-pip', !!on);
    if (pipNote) pipNote.hidden = !on;
  };
  if (pipKey) new MutationObserver(syncPip).observe(pipKey, { attributes: true, attributeFilter: ['data-pip'] });
  new MutationObserver(syncPip).observe(root, { attributes: true, attributeFilter: ['data-field-docpip'] });
  $('.field-pip-back')?.addEventListener('click', () => {
    if (root.hasAttribute('data-field-docpip')) root.dispatchEvent(new CustomEvent('field-pip-close'));
    else if (pipKey?.hasAttribute('data-pip')) pipKey.click();
    else if (forced() === 'pip') root.removeAttribute('data-field-pip'), pipNote && (pipNote.hidden = true);
  });

  /* ---------- Live (14) / behind live (15) ---------- */
  const isLive = () =>
    forced() === 'live' ||
    forced() === 'behind' ||
    media.duration === Infinity ||
    (media as HTMLMediaElement & { streamType?: string }).streamType === 'live';
  const liveEdge = () => (media.seekable?.length ? media.seekable.end(media.seekable.length - 1) : media.currentTime);
  const behindLive = () => (forced() === 'behind' ? 42 : forced() === 'live' ? 0 : Math.max(0, liveEdge() - media.currentTime));
  const golive = $('.field-golive');
  const syncLive = () => {
    const live = isLive();
    const behind = live && behindLive() > 10;
    root.toggleAttribute('data-field-live', live);
    root.toggleAttribute('data-field-behind', behind);
    if (golive) golive.hidden = !behind;
  };
  for (const ev of ['durationchange', 'timeupdate', 'seeked', 'loadedmetadata']) media.addEventListener(ev, syncLive);
  golive?.addEventListener('click', () => {
    if (forced() === 'behind') return;
    media.currentTime = liveEdge();
    void media.play();
  });

  /* ---------- No captions (09): key stays, dimmed, and says why ---------- */
  const syncCaptions = () => {
    const usable = Array.from(media.textTracks ?? []).some(
      (t) => (t.kind === 'captions' || t.kind === 'subtitles') && !/unknown language/i.test(t.label),
    );
    const none = forced() === 'no-captions' || !usable;
    root.toggleAttribute('data-field-no-captions', none);
    $('media-captions-button')?.setAttribute('aria-disabled', none ? 'true' : 'false');
  };
  media.textTracks?.addEventListener?.('addtrack', syncCaptions);
  media.textTracks?.addEventListener?.('removetrack', syncCaptions);
  media.addEventListener('loadedmetadata', syncCaptions);
  setTimeout(syncCaptions, 1500);

  const syncAll = () => {
    syncEnded();
    syncPip();
    syncLive();
    syncCaptions();
    syncShelf();
  };
  new MutationObserver(syncAll).observe(root, { attributes: true, attributeFilter: ['data-field-force'] });
  syncAll();

  // error forced from the dev panel
  new MutationObserver(() => {
    if (forced() === 'error') setError(true);
    else if (root.hasAttribute('data-field-error') && !media.error) setError(false);
  }).observe(root, { attributes: true, attributeFilter: ['data-field-force'] });

  return { seekBubble, muteBubble, hideBubble, syncShelf, isLive, behindLive };
}
