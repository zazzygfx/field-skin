/*
 * FIELD — key bubble: a small accent label that grows out of a key
 * (SPEC §10 states 04 / 06, and the iOS volume hint).
 * Licensed under the Apache License, Version 2.0
 */
const timers = new WeakMap<HTMLElement, number>();

export function showKeyBubble(root: HTMLElement, anchor: HTMLElement | null, text: string, persist = false, ms = 1100): void {
  const bubble = root.querySelector<HTMLElement>('.field-keybubble');
  if (!bubble || !anchor || anchor.offsetParent === null) return;
  const pill = anchor.closest<HTMLElement>('.field-pill');
  if (!pill) return;
  const a = anchor.getBoundingClientRect();
  const p = pill.getBoundingClientRect();
  bubble.textContent = text;
  bubble.hidden = false;
  bubble.style.left = `${a.left - p.left + a.width / 2}px`;
  bubble.removeAttribute('data-show');
  void bubble.offsetWidth; // restart the grow
  bubble.setAttribute('data-show', '');
  clearTimeout(timers.get(root));
  if (!persist) timers.set(root, window.setTimeout(() => hideKeyBubble(root), ms));
}

export function hideKeyBubble(root: HTMLElement): void {
  clearTimeout(timers.get(root));
  const bubble = root.querySelector<HTMLElement>('.field-keybubble');
  if (!bubble) return;
  bubble.removeAttribute('data-show');
  bubble.hidden = true;
}
