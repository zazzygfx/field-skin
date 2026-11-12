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
});
