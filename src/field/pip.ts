/*
 * FIELD — Document Picture-in-Picture (SPEC §11, Figma reference/08-pip.png)
 * Copyright 2026 Zazzy (@zazzygfx)
 * Licensed under the Apache License, Version 2.0
 *
 * Chrome / Edge desktop: the PiP key (and P) opens a 400 × 225 window with
 * FIELD keys — back to tab, close, −10, play, +10 — and a 4px progress rail.
 * The window shows a live mirror of the player (captureStream), so the real
 * <video> and Video.js stay where they are and keep the audio. Everywhere
 * else (Safari, Firefox, phones) the browser's own PiP is used.
 */
import type { KeySounds } from './sounds';

type DocPiP = { requestWindow: (o: { width: number; height: number }) => Promise<Window>; window: Window | null };

export function mountDocPip(root: HTMLElement, media: HTMLMediaElement, sounds: KeySounds): void {
  const dpip = (window as unknown as { documentPictureInPicture?: DocPiP }).documentPictureInPicture;
  const pipKey = root.querySelector<HTMLElement>('media-pip-button');
  const inner = (media as HTMLElement).shadowRoot?.querySelector('video') ?? (media instanceof HTMLVideoElement ? media : null);
  const canMirror = !!inner && typeof (inner as HTMLVideoElement & { captureStream?: unknown }).captureStream === 'function';
  if (!dpip || !pipKey || !canMirror) return; // native PiP (Video.js) handles it
  const usable = () => matchMedia('(pointer: fine)').matches;

  let win: Window | null = null;
  let stream: MediaStream | null = null;

  const close = () => win?.close();

  const open = async () => {
    if (win) return;
    const w = await dpip.requestWindow({ width: 400, height: 225 });
    win = w;
    const doc = w.document;

    // same styles as the page (FIELD + tokens + fonts); relative URLs resolve against the page
    const base = doc.createElement('base');
    base.href = location.href;
    doc.head.append(base);
    for (const sheet of Array.from(document.styleSheets)) {
      try {
        const style = doc.createElement('style');
        style.textContent = Array.from(sheet.cssRules)
          .map((r) => r.cssText)
          .join('\n');
        doc.head.append(style);
      } catch {
        if (sheet.href) {
          const link = doc.createElement('link');
          link.rel = 'stylesheet';
          link.href = sheet.href;
          doc.head.append(link);
        }
      }
    }
    doc.title = 'FIELD';
    doc.body.style.margin = '0';
    doc.body.style.background = '#000';

    const wrap = doc.createElement('div');
    wrap.className = 'field field-pipwin';
    wrap.dataset.fieldTheme = root.dataset.fieldTheme ?? 'putty';
    wrap.setAttribute('style', root.getAttribute('style') ?? '');
    wrap.innerHTML = `
      <video class="field-pipwin-video" muted playsinline autoplay></video>
      <button type="button" class="field-key field-key-icon field-pipwin-back" aria-label="Back to tab"><span class="field-icon" data-icon="pip"></span></button>
      <button type="button" class="field-key field-key-icon field-pipwin-close" aria-label="Close"><span class="field-icon" data-icon="close"></span></button>
      <div class="field-pipwin-row">
        <button type="button" class="field-key" data-seek="-10" aria-label="Back 10 seconds">−10</button>
        <button type="button" class="field-key field-play" aria-label="Play">
          <span class="field-icon" data-icon="pause"></span>
          <span class="field-icon" data-icon="play"></span>
          <span class="field-icon" data-icon="replay"></span>
        </button>
        <button type="button" class="field-key" data-seek="10" aria-label="Forward 10 seconds">+10</button>
      </div>
      <div class="field-pipwin-rail" aria-hidden="true"></div>`;
    doc.body.append(wrap);

    // live mirror of the player
    const video = wrap.querySelector<HTMLVideoElement>('.field-pipwin-video')!;
    stream = (inner as HTMLVideoElement & { captureStream: () => MediaStream }).captureStream();
    video.srcObject = stream;
    void video.play().catch(() => {});

    const play = wrap.querySelector<HTMLElement>('.field-play')!;
    const sync = () => {
      play.toggleAttribute('data-paused', media.paused);
      play.toggleAttribute('data-ended', media.ended);
      play.setAttribute('aria-label', media.ended ? 'Replay' : media.paused ? 'Play' : 'Pause');
      const d = media.duration;
      wrap.style.setProperty('--field-progress', Number.isFinite(d) && d > 0 ? `${(media.currentTime / d) * 100}%` : '0%');
    };
    const events = ['play', 'pause', 'ended', 'timeupdate', 'seeked'];
    events.forEach((ev) => media.addEventListener(ev, sync));
    sync();

    const toggle = () => {
      if (media.paused || media.ended) void media.play();
      else media.pause();
      sounds.play('clunk');
    };
    const seek = (d: number) => {
      const dur = Number.isFinite(media.duration) ? media.duration : Infinity;
      media.currentTime = Math.max(0, Math.min(dur, media.currentTime + d));
      sounds.play('tick');
    };
    play.addEventListener('click', toggle);
    wrap.querySelectorAll<HTMLElement>('[data-seek]').forEach((b) => b.addEventListener('click', () => seek(Number(b.dataset.seek))));
    wrap.querySelector('.field-pipwin-back')!.addEventListener('click', () => {
      sounds.play('tick');
      close(); // back to the tab, still playing
    });
    wrap.querySelector('.field-pipwin-close')!.addEventListener('click', () => {
      media.pause();
      close();
    });
    doc.addEventListener('keydown', (e) => {
      if (e.key === ' ' || e.key === 'k' || e.key === 'K') (e.preventDefault(), toggle());
      else if (e.key === 'j' || e.key === 'J' || e.key === 'ArrowLeft') seek(-10);
      else if (e.key === 'l' || e.key === 'L' || e.key === 'ArrowRight') seek(10);
      else if (e.key === 'Escape') close();
    });

    // keys show on pointer movement, fade after 2 s (opacity only)
    let idle = 0;
    const wake = () => {
      wrap.setAttribute('data-awake', '');
      clearTimeout(idle);
      idle = w.setTimeout(() => wrap.removeAttribute('data-awake'), 2000);
    };
    doc.addEventListener('pointermove', wake);
    doc.addEventListener('keydown', wake);
    wake();

    root.setAttribute('data-field-docpip', '');
    w.addEventListener('pagehide', () => {
      events.forEach((ev) => media.removeEventListener(ev, sync));
      stream?.getVideoTracks().forEach((t) => t.stop());
      stream = null;
      win = null;
      root.removeAttribute('data-field-docpip');
      window.focus();
    });
  };

  const toggleWindow = () => (win ? close() : void open().catch(() => pipKey.click()));

  // PiP key (and the More / Settings row that proxies it): open the FIELD window instead
  root.addEventListener(
    'click',
    (e) => {
      if (!usable() || !pipKey.contains(e.target as Node)) return;
      if (pipKey.hasAttribute('data-pip')) return; // native PiP already on: let Video.js exit it
      e.stopPropagation();
      e.preventDefault();
      toggleWindow();
    },
    true,
  );
  // P
  root.addEventListener(
    'keydown',
    (e) => {
      if ((e.key !== 'p' && e.key !== 'P') || e.metaKey || e.ctrlKey || e.altKey || !usable()) return;
      if ((e.target as HTMLElement).closest?.('input, textarea, [contenteditable]')) return;
      e.stopPropagation();
      e.preventDefault();
      toggleWindow();
    },
    true,
  );
  // state 17 "Bring it back here"
  root.addEventListener('field-pip-close', close);
}
