/*
 * FIELD — state runner: forces a player into each of the 20 states in SPEC §10.
 * Shared by the Shift+D dev panel and the showcase site's key desk.
 * Licensed under the Apache License, Version 2.0
 */
export type Dev = {
  media: HTMLMediaElement;
  volume: { open: () => void; close: () => void };
  speed: { open: () => void };
  scrub: { showAt: (pct: number) => void };
  states: { seekBubble: (d: 1 | -1, persist?: boolean) => void; muteBubble: (persist?: boolean) => void; hideBubble: () => void; syncShelf: () => void };
  render: () => void;
  syncLoading: () => void;
  setCounter: (t: string | null) => void;
  showHints: () => void;
  hideHints: () => void;
};

/** SPEC §10 ids and names */
export const STATES: [string, string][] = [
  ['01', 'Ready'],
  ['02', 'Loading'],
  ['03', 'Scrubbing'],
  ['04', 'Seek ±10'],
  ['05', 'Volume'],
  ['06', 'Muted'],
  ['07', 'Speed'],
  ['08', 'Captions on'],
  ['09', 'No captions'],
  ['10', 'Keyboard'],
  ['11', 'Buffering'],
  ['12', 'Ended'],
  ['13', 'Error'],
  ['14', 'Live'],
  ['15', 'Behind live'],
  ['16', 'Long video'],
  ['17', 'PiP active'],
  ['18', 'More contrast'],
  ['19', 'No chapters'],
  ['20', 'Calm'],
];

const FLAGS = ['data-field-force', 'data-field-contrast', 'data-field-calm', 'data-field-no-chapters'];
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

export type Runner = { run: (id: string) => Promise<void>; reset: () => Promise<void> };

export function createStateRunner(root: HTMLElement): Runner | null {
  const dev = (root as HTMLElement & { fieldDev?: Dev }).fieldDev;
  if (!dev) return null;
  const { media } = dev;

  const reset = async () => {
    for (const f of FLAGS) root.removeAttribute(f);
    dev.setCounter(null);
    dev.states.hideBubble();
    dev.hideHints();
    dev.volume.close();
    media.muted = true; // demo-friendly: states play silently
    for (const t of Array.from(media.textTracks)) if (t.kind === 'captions' || t.kind === 'subtitles') t.mode = 'disabled';
    root.querySelector<HTMLElement>('.field-tray')?.setAttribute('hidden', '');
    root.querySelector('.field-speed')?.setAttribute('aria-expanded', 'false');
    root.removeAttribute('data-field-scrubbing');
    root.removeAttribute('data-field-ended');
    dev.syncLoading();
    dev.render();
  };

  const pausedAt = async (t: number) => {
    if (media.paused) await media.play().catch(() => {});
    media.pause();
    media.currentTime = t;
    await wait(300);
  };

  const force = (name: string) => root.setAttribute('data-field-force', name);

  const steps: Record<string, () => Promise<void>> = {
    '01': async () => {
      media.pause();
      media.currentTime = 0;
      force('ready');
    },
    '02': async () => {
      await pausedAt(5);
      force('loading');
      await media.play().catch(() => {});
      dev.syncLoading();
      await wait(300);
    },
    '03': async () => {
      await pausedAt(83.4);
      force('scrub');
      dev.scrub.showAt(0.82);
    },
    '04': async () => {
      await pausedAt(83.4);
      force('seek');
      dev.states.seekBubble(1, true);
    },
    '05': async () => {
      await pausedAt(83.4);
      media.muted = false;
      media.volume = 0.7;
      force('volume');
      dev.volume.open();
    },
    '06': async () => {
      await pausedAt(83.4);
      media.muted = true;
      force('muted');
      dev.states.muteBubble(true);
    },
    '07': async () => {
      await pausedAt(83.4);
      force('speed');
      dev.speed.open();
    },
    '08': async () => {
      await pausedAt(31);
      const t = Array.from(media.textTracks).find((x) => x.kind === 'captions' && !/unknown/i.test(x.label));
      if (t) t.mode = 'showing';
      force('captions');
      media.currentTime = 31;
    },
    '09': async () => {
      await pausedAt(83.4);
      force('no-captions');
    },
    '10': async () => {
      await pausedAt(83.4);
      force('keyboard');
      const key = root.querySelector<HTMLElement>('.field-play:not(.field-bigplay)');
      key?.focus({ focusVisible: true, preventScroll: true } as FocusOptions);
      dev.showHints();
    },
    '11': async () => {
      await pausedAt(60);
      force('buffering');
      await media.play().catch(() => {});
      dev.syncLoading();
      await wait(300);
    },
    '12': async () => {
      await pausedAt(Math.max(0, (media.duration || 150) - 0.4));
      await media.play().catch(() => {});
    },
    '13': async () => {
      await pausedAt(83.4);
      force('error');
    },
    '14': async () => {
      await pausedAt(media.duration ? media.duration - 1 : 140);
      force('live');
    },
    '15': async () => {
      await pausedAt(120);
      force('behind');
    },
    '16': async () => {
      await pausedAt(83.4);
      force('long');
      dev.setCounter('01 47 09');
    },
    '17': async () => {
      await pausedAt(83.4);
      force('pip');
    },
    '18': async () => {
      await pausedAt(83.4);
      force('contrast');
      root.setAttribute('data-field-contrast', '');
    },
    '19': async () => {
      await pausedAt(83.4);
      force('no-chapters');
      root.setAttribute('data-field-no-chapters', '');
    },
    '20': async () => {
      await pausedAt(83.4);
      force('calm');
      root.setAttribute('data-field-calm', '');
    },
  };

  let token = 0;
  return {
    reset,
    run: async (id: string) => {
      const mine = ++token; // a newer press wins
      await reset();
      if (mine !== token) return;
      await steps[id]?.();
      if (mine === token) dev.render();
    },
  };
}
