/*
 * FIELD — a Video.js 10 skin
 * Copyright 2026 Zazzy (@zazzygfx)
 * Licensed under the Apache License, Version 2.0
 *
 * Reshaped from the ejected Video.js 10 default HTML skin (v10.3.0).
 * Registers the Video.js elements FIELD uses, plus the small bits of
 * behaviour CSS can't do: tape counter, chapter chip, loading state,
 * controls lock while hovered/focused, key sounds, keyboard hint bar.
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
import '@videojs/html/ui/tooltip';
import '@videojs/html/ui/tooltip-group';
import '@videojs/html/ui/tooltip-label';
import '@videojs/html/ui/tooltip-shortcut';
import '@videojs/html/ui/menu';
import '@videojs/html/ui/menu-content';
import '@videojs/html/ui/menu-group';
import '@videojs/html/ui/menu-group-label';
import '@videojs/html/ui/menu-radio-group';
import '@videojs/html/ui/menu-radio-item';
import '@videojs/html/ui/menu-item-indicator';
import '@videojs/html/ui/quality-radio-group';
import '@videojs/html/ui/captions-radio-group';
import '@videojs/html/ui/slider-thumbnail';
import '@videojs/html/ui/menu-item';
import '@videojs/html/ui/playback-rate-radio-group';
import '@videojs/html/ui/seek-indicator';
import '@videojs/html/ui/seek-indicator-value';
import { KeySounds } from './sounds';
import { formatCounter, formatShort, renderCounter } from './counter';
import { mountVolume } from './volume';
import { mountSpeed } from './speed';
import { mountScrub, type Chapter } from './scrub';
import { mountStates, type StatesApi } from './states';
import { mountDocPip } from './pip';

export { formatCounter };

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
  const lengths = root.querySelectorAll<HTMLElement>('.field-ready-length');
  const chipBadge = root.querySelector<HTMLElement>('.field-chip-badge');
  const chipTitle = root.querySelector<HTMLElement>('.field-chip-title');
  const chipStatus = root.querySelector<HTMLElement>('.field-chip-status');
  const bigplay = root.querySelector<HTMLElement>('.field-bigplay');
  /** Dev panel can force a state (data-field-force); the skin reads it here. */
  const forced = () => root.getAttribute('data-field-force');
  let states: StatesApi | null = null;
  let counterOverride: string | null = null;
  const reduceMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches || root.hasAttribute('data-field-calm');
  const controls = root.querySelector<HTMLElement>('.field-controls-content');
  const menu = root.querySelector<HTMLElement>('.field-menu');
  const hints = root.querySelector<HTMLElement>('.field-hints');

  /* ---------- Caption cue box: ::cue can't cross mux-video's shadow root ---------- */
  const shadow = (media as HTMLElement).shadowRoot;
  if (shadow && !shadow.querySelector('style[data-field-cue]')) {
    const style = document.createElement('style');
    style.dataset.fieldCue = '';
    style.textContent = `video::cue {
      background: var(--field-cue-bg);
      color: var(--field-cue-text);
      font-family: var(--field-font);
      font-size: max(15px, 2.4cqw);
      line-height: 1.35;
    }`;
    shadow.append(style);
  }

  /* ---------- Size steps (SPEC §3): mirrors the container queries for the JS bits ---------- */
  type Size = 'xl' | 'm' | 's' | 'xs';
  let size: Size = 'xl';
  const settingsKey = root.querySelector<HTMLElement>('.field-settings');
  const sizeOf = (w: number): Size => (w >= 900 ? 'xl' : w >= 600 ? 'm' : w >= 400 ? 's' : 'xs');
  const applySize = (width: number) => {
    const next = sizeOf(width);
    if (next === size && root.hasAttribute('data-field-size')) return;
    size = next;
    root.setAttribute('data-field-size', size);
    // XS: the settings key becomes "More" (fullscreen moves inside it)
    settingsKey?.setAttribute('aria-label', size === 'xs' ? 'More' : 'Settings');
    // menu rows that only exist at smaller sizes (hidden attr so menu arrows skip them)
    const q = (sel: string) => root.querySelector<HTMLElement>(sel);
    const speedGroup = q('.field-group-speed');
    const pipRow = q('.field-more-pip');
    const fsRow = q('.field-more-fs');
    const moreGroup = q('.field-group-more');
    if (speedGroup) speedGroup.hidden = size === 'xl';
    if (pipRow) pipRow.hidden = size === 'xl';
    if (fsRow) fsRow.hidden = size !== 'xs';
    if (moreGroup) moreGroup.hidden = size === 'xl';
    const moreFs = q('.field-more-fsrow');
    if (moreFs) moreFs.hidden = size !== 'xs';
    render();
  };
  new ResizeObserver(([entry]) => applySize(entry.contentRect.width)).observe(root);

  /* ---------- Counter + chip ---------- */
  let chapters: Chapter[] = [];
  let scrubTime: number | null = null;
  let loading = false;

  const render = () => {
    const t = media.currentTime;
    const d = media.duration;
    const ready = media.readyState >= 1 && Number.isFinite(d) && d > 0;
    const short = size === 's' || size === 'xs'; // S size: MM:SS
    const live = states?.isLive() ?? false;
    const behind = live ? (states?.behindLive() ?? 0) : 0;
    let text =
      (ready || live) && (!loading || scrubTime !== null)
        ? short
          ? formatShort(scrubTime ?? t)
          : formatCounter(scrubTime ?? t)
        : short
          ? '--:--'
          : '-- -- --';
    if (loading && scrubTime === null && reduceMotion()) text = 'LOADING';          // calm: no sweep, a word
    if (live && scrubTime === null) text = behind > 10 ? `−${formatCounter(behind)}` : '● LIVE'; // states 14 / 15
    if (counterOverride) text = counterOverride;
    if (counter) renderCounter(counter, text, scrubTime !== null);
    if (ready) lengths.forEach((l) => (l.textContent = `${Math.floor(d / 60)}:${String(Math.floor(d % 60)).padStart(2, '0')}`));
    root.style.setProperty('--field-progress', live && behind <= 10 ? '100%' : ready ? `${(t / d) * 100}%` : '0%');

    /* chip: title (+ chapter badge), or what the player is doing */
    const started = bigplay?.hasAttribute('data-started') ?? false;
    const status = root.hasAttribute('data-field-error')
      ? 'Playback error'
      : root.hasAttribute('data-field-pip')
        ? 'Picture in picture'
        : live
          ? 'Live'
          : loading
            ? started && forced() !== 'loading'
              ? 'Buffering…'
              : 'Loading…'
            : root.hasAttribute('data-field-ended')
              ? 'Ended'
              : media.paused && started && !forced() && (size === 'xl' || size === 'm') && scrubTime === null
                ? `Paused at ${formatShort(t)}`
                : null;
    if (chipStatus) {
      chipStatus.hidden = !status;
      chipStatus.textContent = status ?? '';
    }
    if (chipTitle) chipTitle.hidden = !!status;
    if (chipBadge) {
      const i = root.hasAttribute('data-field-no-chapters') ? -1 : chapters.findIndex((c) => t >= c.start && t < c.end);
      chipBadge.hidden = i < 0 || !!status;
      if (i >= 0) chipBadge.textContent = `CH ${i + 1}`;
    }
  };

  const readChapters = () => {
    const track = Array.from(media.textTracks ?? []).find((tt) => tt.kind === 'chapters');
    if (!track) return;
    if (track.mode === 'disabled') track.mode = 'hidden';
    const cues = track.cues;
    if (!cues || !cues.length) return;
    chapters = Array.from(cues).map((c) => ({ start: c.startTime, end: c.endTime, title: (c as VTTCue).text ?? '' }));
    root.toggleAttribute('data-field-chapters', true);
    render();
  };

  for (const ev of ['timeupdate', 'durationchange', 'loadedmetadata', 'seeking', 'emptied', 'play', 'pause', 'ended']) {
    media.addEventListener(ev, render);
  }
  new MutationObserver(render).observe(root, {
    attributes: true,
    attributeFilter: ['data-field-error', 'data-field-pip', 'data-field-ended', 'data-field-force', 'data-field-no-chapters', 'data-field-calm'],
  });

  /* ---------- Loading / buffering (states 02 + 11): icon dims, counter reads -- -- -- ---------- */
  let loadingTimer = 0;
  const syncLoading = () => {
    const f = forced();
    const now = f === 'loading' || f === 'buffering' || (!media.paused && (media.readyState < 3 || media.seeking));
    clearTimeout(loadingTimer);
    if (now === loading) return;
    const apply = () => {
      loading = now;
      root.toggleAttribute('data-field-loading', now);
      render();
    };
    if (now) loadingTimer = window.setTimeout(apply, 250); // don't flicker on quick seeks
    else apply();
  };
  for (const ev of ['waiting', 'playing', 'canplay', 'canplaythrough', 'seeking', 'seeked', 'play', 'pause', 'loadstart', 'loadeddata', 'stalled', 'emptied']) {
    media.addEventListener(ev, syncLoading);
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

  /* ---------- Settings menu: key-sounds switch + menu click ---------- */
  const ksGroup = root.querySelector<HTMLElement & { value: string }>('[data-field-key-sounds]');
  if (ksGroup) {
    ksGroup.value = sounds.enabled ? 'on' : 'off';
    ksGroup.addEventListener('value-change', (e) => {
      sounds.set((e as CustomEvent<{ value: string }>).detail.value === 'on');
      sounds.play('tick');
    });
  }
  menu?.addEventListener('open-change', (e) => {
    const open = (e as CustomEvent<{ open: boolean }>).detail.open;
    root.toggleAttribute('data-field-menu-open', open);
    if (open) sounds.play('menu');
  });

  /* ---------- Quality: high → low, "Auto (720p)" → "Auto" + accent value (Figma 174:1088) ---------- */
  const qualities = Array.from(root.querySelectorAll('media-quality-radio-group'));
  const height = (el: Element) => parseInt(el.getAttribute('data-rendition') === 'auto' ? 'Infinity' : (el.textContent ?? ''), 10) || 0;
  const splitAuto = () => qualities.forEach(splitAutoIn);
  const splitAutoIn = (quality: Element) => {
    // Reverse the real DOM order (Auto first, then highest → lowest) so arrow keys follow the screen.
    const items = Array.from(quality.querySelectorAll<HTMLElement>(':scope > media-menu-radio-item'));
    const auto = items.filter((i) => /auto/i.test(i.getAttribute('data-rendition') ?? '') || /^auto/i.test(i.textContent?.trim() ?? ''));
    const rest = items.filter((i) => !auto.includes(i)).sort((a, b) => height(b) - height(a));
    const wanted = [...auto, ...rest];
    if (wanted.some((el, i) => items[i] !== el)) quality.append(...wanted);
    for (const item of items) {
      const label = item.querySelector<HTMLElement>('[data-part="label"]');
      const badge = item.querySelector<HTMLElement>('[data-part="badge"]');
      const m = label?.textContent?.match(/^(.+?)\s*\((.+)\)$/);
      if (!label || !badge || !m) continue;
      label.textContent = m[1];
      badge.textContent = m[2];
      badge.hidden = false;
    }
  };
  qualities.forEach((q) => new MutationObserver(() => splitAutoIn(q)).observe(q, { subtree: true, childList: true, characterData: true }));

  /* ---------- Captions: hide the stream's unlabelled in-manifest track ---------- */
  const captionsGroups = Array.from(root.querySelectorAll('media-captions-radio-group'));
  const hideUnknown = () => {
    for (const item of root.querySelectorAll<HTMLElement>('media-captions-radio-group > media-menu-radio-item')) {
      const unknown = /unknown language/i.test(item.textContent ?? '');
      if (unknown && !item.hidden) item.hidden = true;
    }
  };
  captionsGroups.forEach((g) => new MutationObserver(hideUnknown).observe(g, { childList: true, subtree: true }));
  hideUnknown();
  splitAuto();
  menu?.addEventListener('open-change', () => {
    hideUnknown();
    splitAuto();
  });

  /* ---------- Step 3: volume meter, speed tray, seek hover / scrub ---------- */
  const volume = mountVolume(root, media, sounds, lock);
  const speed = mountSpeed(root, media, sounds, lock);
  mountDocPip(root, media, sounds);
  states = mountStates(root, media, sounds, () => (root.hasAttribute('data-field-no-chapters') ? [] : chapters), lock, forced);
  const scrub = mountScrub(
    root,
    media,
    () => chapters,
    (t) => {
      scrubTime = t;
      render();
    },
  );

  /* ---------- More rows (M and smaller): PiP / fullscreen proxy the real keys ---------- */
  for (const row of root.querySelectorAll<HTMLElement>('[data-field-proxy]')) {
    row.addEventListener('click', () => {
      const target = document.getElementById(row.dataset.fieldProxy!);
      target?.click();
    });
  }

  /* ---------- Touch: the key opens the More sheet (one list, one level deep) ---------- */
  const more = root.querySelector<HTMLElement>('.field-more');
  const coarse = matchMedia('(pointer: coarse)');
  const pickMenu = () => settingsKey?.setAttribute('commandfor', coarse.matches && more ? more.id : (menu?.id ?? ''));
  pickMenu();
  coarse.addEventListener?.('change', pickMenu);
  more?.addEventListener('open-change', (e) => {
    if ((e as CustomEvent<{ open: boolean }>).detail.open) {
      sounds.play('menu');
      hideUnknown();
      splitAuto();
      syncChapterPage();
    }
  });
  // Back rows step out one level instead of closing the sheet
  more?.querySelectorAll<HTMLElement>('.field-more-back').forEach((b) =>
    b.addEventListener('select', (e) => {
      e.preventDefault();
      (b.closest('media-menu-content') as HTMLElement & { close?: () => void } | null)?.close?.();
    }),
  );
  // Key sounds toggles in place
  const ksRow = more?.querySelector<HTMLElement>('.field-more-ks');
  const ksValue = more?.querySelector<HTMLElement>('.field-more-ks-value');
  const syncKs = () => ksValue && (ksValue.textContent = sounds.enabled ? 'On' : 'Off');
  ksRow?.addEventListener('select', (e) => {
    e.preventDefault();
    sounds.set(!sounds.enabled);
    if (ksGroup) ksGroup.value = sounds.enabled ? 'on' : 'off';
    syncKs();
    sounds.play('tick');
  });
  syncKs();
  // "Auto (720p)" → "Auto" in the row values
  more?.querySelectorAll<HTMLElement>('[data-part="value"]').forEach((v) =>
    new MutationObserver(() => {
      const t = v.textContent ?? '';
      const trimmed = t.replace(/^(Auto)\s*\(.*\)$/i, '$1');
      if (trimmed !== t) v.textContent = trimmed;
    }).observe(v, { childList: true, characterData: true, subtree: true }),
  );
  // Chapters page: Start over, then one row per chapter
  const chPage = more?.querySelector<HTMLElement>('.field-more-chapters');
  const chRow = more?.querySelector<HTMLElement>('.field-more-chapters-row');
  let chBuilt = '';
  const syncChapterPage = () => {
    if (!chPage || !chRow) return;
    const list = root.hasAttribute('data-field-no-chapters') ? [] : chapters;
    // data-hidden (not hidden): Video.js re-applies a submenu trigger's initial `hidden`
    chRow.toggleAttribute('data-hidden', list.length < 2);
    const key = list.map((c) => c.start).join(',');
    if (key !== chBuilt) {
      chBuilt = key;
      chPage.querySelectorAll('.field-more-chapter').forEach((n) => n.remove());
      list.forEach((c, i) => {
        const item = document.createElement('media-menu-item');
        item.className = 'field-more-row field-more-chapter';
        item.innerHTML = `<span class="field-more-n">${i + 1}</span><span class="field-more-title"></span><span class="field-more-value">${formatShort(c.start)}</span>`;
        item.querySelector('.field-more-title')!.textContent = c.title || `Chapter ${i + 1}`;
        item.addEventListener('select', () => {
          media.currentTime = c.start;
          void media.play();
        });
        chPage.append(item);
      });
    }
    const t = media.currentTime;
    chPage.querySelectorAll<HTMLElement>('.field-more-chapter').forEach((n, i) => {
      const c = list[i];
      n.toggleAttribute('data-current', !!c && t >= c.start && t < c.end);
    });
  };
  more?.querySelector('.field-more-restart')?.addEventListener('select', () => {
    media.currentTime = 0;
    void media.play();
  });
  syncChapterPage();
  // build as soon as the chapters track loads; keep the current row in step
  let chTries = 0;
  const chPoll = setInterval(() => {
    syncChapterPage();
    if (chapters.length || ++chTries > 40) clearInterval(chPoll);
  }, 250);
  for (const ev of ['seeked', 'pause', 'play', 'loadedmetadata']) media.addEventListener(ev, syncChapterPage);
  settingsKey?.addEventListener('click', syncChapterPage, true);

  /* ---------- Tapping the picture closes an open sheet / menu (like Iris) ----------
     A tap on a sheet's scrim (::backdrop) targets the popover itself, which
     Video.js counts as "inside" — so close it when the point is outside its box. */
  type Closable = HTMLElement & { close?: (reason?: string) => void };
  for (const m of [menu, more] as (Closable | null)[]) {
    m?.addEventListener('pointerdown', (e) => {
      if (e.target !== m) return;
      const r = m.getBoundingClientRect();
      const inside = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
      if (!inside) m.close?.('outside-click');
    });
  }

  /* ---------- Hint bar: after the first keyboard action, 4 s (SPEC §9) ---------- */
  let hinted = false;
  root.addEventListener('keydown', (e) => {
    if (hinted || !hints || e.metaKey || e.ctrlKey || e.altKey) return;
    hinted = true;
    hints.hidden = false;
    requestAnimationFrame(() => hints.setAttribute('data-show', ''));
    setTimeout(() => {
      if (forced() === 'keyboard') return;
      hints.removeAttribute('data-show');
      setTimeout(() => (hints.hidden = true), 400);
    }, 4000);
  });

  /* ---------- Hooks for the dev state panel (dev page only; harmless elsewhere) ---------- */
  Object.assign(root, {
    fieldDev: {
      media,
      volume,
      speed,
      scrub,
      states,
      render,
      syncLoading,
      setCounter: (text: string | null) => {
        counterOverride = text;
        render();
      },
      showHints: () => {
        if (!hints) return;
        hinted = true;
        hints.hidden = false;
        hints.setAttribute('data-show', '');
      },
      hideHints: () => {
        if (!hints) return;
        hints.removeAttribute('data-show');
        hints.hidden = true;
      },
    },
  });

  applySize(root.getBoundingClientRect().width);
}
