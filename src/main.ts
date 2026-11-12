/*
 * FIELD — dev page entry
 * Licensed under the Apache License, Version 2.0
 */
import '@videojs/html/video/player';
import '@videojs/html/media/mux-video';
import { mountField } from './field/field';
import { mountDevPanel } from './dev/panel';

// dev: ?theme=ink|liquid|holiday-snow|holiday-pine and ?accent=%23ffd400 for quick testing
const params = new URLSearchParams(location.search);
document.querySelectorAll<HTMLElement>('media-container.field').forEach((root) => {
  const theme = params.get('theme');
  if (theme) root.dataset.fieldTheme = theme;
  const accent = params.get('accent');
  if (accent) root.style.setProperty('--field-accent', accent);
  mountField(root);
  mountDevPanel(root); // Shift+D

  // dev: ?og renders the Open Graph frame (player edge to edge, keys showing, mid-film)
  if (params.has('og')) {
    document.documentElement.classList.add('og');
    const media = root.querySelector<HTMLMediaElement>('[data-field-media]')!;
    // headless capture blends frames; show Mux's clean still for the same moment instead
    const still = root.querySelector<HTMLImageElement>('.field-poster img');
    if (still) still.src = 'https://image.mux.com/xg9MkUaGPFpyU2KzNVDjS71fXdFNW1tEesnbzEBwkDU/thumbnail.webp?time=37&width=1200';
    media.preload = 'auto';
    media.addEventListener(
      'loadedmetadata',
      () => {
        media.currentTime = 37;
        root.setAttribute('data-field-force', 'demo');
        (root as HTMLElement & { fieldDev?: { render: () => void } }).fieldDev?.render();
      },
      { once: true },
    );
  }
});
