/*
 * FIELD — key sounds
 * Copyright 2026 Zazzy (@zazzygfx)
 * Licensed under the Apache License, Version 2.0
 *
 * Small tape-deck clicks synthesised with the Web Audio API (no audio files).
 * Off by default. The choice is remembered in localStorage. Never plays while
 * the player is muted, and follows the player's volume.
 */
export type KeySound = 'tick' | 'clunk' | 'detent' | 'menu';

const STORAGE_KEY = 'field:key-sounds';

export function readKeySoundsPref(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'on';
  } catch {
    return false;
  }
}

export function writeKeySoundsPref(on: boolean): void {
  try {
    localStorage.setItem(STORAGE_KEY, on ? 'on' : 'off');
  } catch {
    /* private mode etc. — the choice just won't persist */
  }
}

let ctx: AudioContext | null = null;
let noise: AudioBuffer | null = null;

function audio(): AudioContext | null {
  if (!ctx) {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

function noiseBuffer(ac: AudioContext): AudioBuffer {
  if (noise && noise.sampleRate === ac.sampleRate) return noise;
  const len = Math.floor(ac.sampleRate * 0.08);
  noise = ac.createBuffer(1, len, ac.sampleRate);
  const data = noise.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  return noise;
}

/** A filtered noise burst — the "mechanical" part of every click. */
function burst(ac: AudioContext, out: AudioNode, t: number, opts: { freq: number; q: number; dur: number; gain: number; type?: BiquadFilterType }) {
  const src = ac.createBufferSource();
  src.buffer = noiseBuffer(ac);
  const filter = ac.createBiquadFilter();
  filter.type = opts.type ?? 'bandpass';
  filter.frequency.value = opts.freq;
  filter.Q.value = opts.q;
  const g = ac.createGain();
  g.gain.setValueAtTime(opts.gain, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + opts.dur);
  src.connect(filter).connect(g).connect(out);
  src.start(t);
  src.stop(t + opts.dur + 0.01);
}

/** A short pitched body — gives the clunk its weight. */
function thump(ac: AudioContext, out: AudioNode, t: number, from: number, to: number, dur: number, gain: number) {
  const osc = ac.createOscillator();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(from, t);
  osc.frequency.exponentialRampToValueAtTime(to, t + dur);
  const g = ac.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(gain, t + 0.004);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(g).connect(out);
  osc.start(t);
  osc.stop(t + dur + 0.01);
}

export function playKeySound(kind: KeySound, volume = 1): void {
  const ac = audio();
  if (!ac || volume <= 0) return;
  const t = ac.currentTime + 0.001;
  const out = ac.createGain();
  out.gain.value = Math.min(1, volume);
  out.connect(ac.destination);

  switch (kind) {
    case 'tick': // soft key press
      burst(ac, out, t, { freq: 3200, q: 1.2, dur: 0.018, gain: 0.12 });
      break;
    case 'clunk': // play / pause: latch + transport thud
      burst(ac, out, t, { freq: 1800, q: 0.9, dur: 0.025, gain: 0.14 });
      thump(ac, out, t + 0.006, 140, 55, 0.09, 0.32);
      burst(ac, out, t + 0.05, { freq: 900, q: 1.5, dur: 0.03, gain: 0.06 });
      break;
    case 'detent': // tiny wheel tick
      burst(ac, out, t, { freq: 5200, q: 2.5, dur: 0.008, gain: 0.08 });
      break;
    case 'menu': // light click
      burst(ac, out, t, { freq: 2400, q: 1.8, dur: 0.012, gain: 0.07 });
      thump(ac, out, t, 900, 600, 0.02, 0.03);
      break;
  }
  setTimeout(() => out.disconnect(), 250);
}

/**
 * Per-player controller: knows the preference and the media element,
 * and refuses to make a sound while the player is muted.
 */
export class KeySounds {
  enabled = readKeySoundsPref();

  constructor(private media: HTMLMediaElement) {}

  set(on: boolean) {
    this.enabled = on;
    writeKeySoundsPref(on);
  }

  play(kind: KeySound) {
    if (!this.enabled) return;
    const m = this.media;
    if (m.muted || m.volume === 0) return;
    playKeySound(kind, 0.4 + 0.6 * m.volume);
  }
}
