/*
 * FIELD — icons that differ from the Video.js defaults
 * Licensed under the Apache License, Version 2.0
 */
const svg = (body: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" aria-hidden="true" viewBox="0 0 18 18" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;

/** Settings: two sliders (reference/00-components) */
export const fieldSettingsIcon = svg(
  '<path d="M3 6h7M14 6h1M3 12h1M8 12h7"/><circle cx="12" cy="6" r="1.8"/><circle cx="6" cy="12" r="1.8"/>',
);

/** Fullscreen: four corner brackets */
export const fieldFullscreenEnterIcon = svg(
  '<path d="M3 6.5V4a1 1 0 0 1 1-1h2.5M11.5 3H14a1 1 0 0 1 1 1v2.5M15 11.5V14a1 1 0 0 1-1 1h-2.5M6.5 15H4a1 1 0 0 1-1-1v-2.5"/>',
);
export const fieldFullscreenExitIcon = svg(
  '<path d="M6.5 3v2.5a1 1 0 0 1-1 1H3M15 6.5h-2.5a1 1 0 0 1-1-1V3M11.5 15v-2.5a1 1 0 0 1 1-1H15M3 11.5h2.5a1 1 0 0 1 1 1V15"/>',
);
