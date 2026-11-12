/*
 * FIELD — tape counter
 * Copyright 2026 Zazzy (@zazzygfx)
 * Licensed under the Apache License, Version 2.0
 */
const pad = (n: number) => String(Math.floor(n)).padStart(2, '0');

/** Always `HH MM SS`, so the width never jumps (SPEC §2). */
export function formatCounter(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '-- -- --';
  return `${pad(seconds / 3600)} ${pad((seconds % 3600) / 60)} ${pad(seconds % 60)}`;
}

/** S size: `MM:SS`. */
export function formatShort(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '--:--';
  return `${pad(seconds / 60)}:${pad(seconds % 60)}`;
}

/**
 * Writes the counter one character per span. With `roll`, digits that change
 * roll in from above like a tape counter (off under reduced motion).
 */
export function renderCounter(el: HTMLElement, text: string, roll: boolean): void {
  // one fixed-width, clipped cell per character; the glyph rolls inside its cell
  if (el.childElementCount !== text.length) {
    el.replaceChildren(
      ...Array.from(text, () => {
        const cell = document.createElement('span');
        cell.className = 'field-digit';
        cell.append(document.createElement('span'));
        return cell;
      }),
    );
  }
  const reduce = roll && matchMedia('(prefers-reduced-motion: reduce)').matches;
  Array.from(el.children).forEach((cell, i) => {
    const glyph = cell.firstElementChild as HTMLElement;
    const c = text[i];
    if (glyph.textContent === c) return;
    glyph.getAnimations?.().forEach((a) => a.cancel());
    glyph.textContent = c;
    if (roll && !reduce && c !== ' ') {
      glyph.animate?.(
        [
          { transform: 'translateY(-100%)', opacity: 0.2 },
          { transform: 'translateY(0)', opacity: 1 },
        ],
        { duration: 140, easing: 'cubic-bezier(.2,0,0,1)' },
      );
    }
  });
  el.setAttribute('aria-label', text);
}
