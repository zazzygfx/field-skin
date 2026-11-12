/*
 * FIELD — dev page entry
 * Licensed under the Apache License, Version 2.0
 */
import '@videojs/html/video/player';
import '@videojs/html/media/mux-video';
import { mountField } from './field/field';

document.querySelectorAll<HTMLElement>('media-container.field').forEach(mountField);
