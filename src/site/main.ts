/*
 * FIELD — showcase site entry
 * Copyright 2026 Zazzy (@zazzygfx)
 * Licensed under the Apache License, Version 2.0
 *
 * The page paints from plain HTML + CSS (the hero shows a still poster).
 * The players and every demo load right after the page has loaded, so the
 * Video.js + HLS bundle never holds up the first paint.
 */
import './site.css';

const start = () => void import('./app');
if (document.readyState === 'complete') start();
else addEventListener('load', start, { once: true });
