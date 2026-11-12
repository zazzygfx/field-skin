/*
 * FIELD — dev state panel (dev page only; not part of the skin)
 * Licensed under the Apache License, Version 2.0
 *
 * Shift+D toggles a panel that forces the player into each of the 20 states
 * in SPEC §10, so they can be checked quickly.
 */
import { STATES, createStateRunner, type Dev } from './runner';

export function mountDevPanel(root: HTMLElement): void {
  const dev = (root as HTMLElement & { fieldDev?: Dev }).fieldDev;
  if (!dev) return;

  const panel = document.createElement('aside');
  panel.className = 'dev-panel';
  panel.hidden = true;
  panel.setAttribute('aria-label', 'FIELD state panel');
  panel.innerHTML = `<header><strong>States</strong><span>Shift+D</span></header><div class="dev-grid"></div><button type="button" class="dev-reset">Reset</button><header class="dev-sub"><strong>Theme</strong></header><div class="dev-themes"></div><p class="dev-now">—</p>`;
  document.body.append(panel);
  const grid = panel.querySelector('.dev-grid')!;
  const now = panel.querySelector('.dev-now')!;

  const runner = createStateRunner(root)!;
  const reset = runner.reset;

  for (const [id, name] of STATES) {
    const b = document.createElement('button');
    b.type = 'button';
    b.innerHTML = `<span>${id}</span>${name}`;
    b.addEventListener('click', async () => {
      await runner.run(id);
      now.textContent = `${id} · ${name}`;
      grid.querySelectorAll('button').forEach((x) => x.toggleAttribute('data-on', x === b));
    });
    grid.append(b);
  }
  panel.querySelector('.dev-reset')!.addEventListener('click', async () => {
    await reset();
    now.textContent = '—';
    grid.querySelectorAll('button').forEach((x) => x.removeAttribute('data-on'));
  });

  // themes (data-field-theme) + a too-light accent to show the contrast guard
  const themes = panel.querySelector('.dev-themes')!;
  for (const t of ['putty', 'ink', 'liquid', 'holiday-snow', 'holiday-pine']) {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = t.replace('holiday-', 'holiday ');
    b.addEventListener('click', () => {
      root.dataset.fieldTheme = t;
      themes.querySelectorAll('button').forEach((x) => x.toggleAttribute('data-on', x === b));
    });
    themes.append(b);
  }
  const light = document.createElement('button');
  light.type = 'button';
  light.textContent = 'accent #FFE14D';
  light.addEventListener('click', () => {
    const on = !light.hasAttribute('data-on');
    light.toggleAttribute('data-on', on);
    if (on) root.style.setProperty('--field-accent', '#FFE14D');
    else {
      root.style.removeProperty('--field-accent');
      delete root.dataset.fieldAccentGuard;
      root.dataset.fieldTheme = root.dataset.fieldTheme ?? 'putty'; // re-run the guard
      root.setAttribute('data-field-theme', root.dataset.fieldTheme);
    }
  });
  themes.append(light);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'D' && e.shiftKey && !e.metaKey && !e.ctrlKey && !e.altKey) {
      const t = e.target as HTMLElement;
      if (t.matches?.('input, textarea, [contenteditable]')) return;
      panel.hidden = !panel.hidden;
    }
  });
}
