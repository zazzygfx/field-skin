/*
 * FIELD — player markup as a template (generated from dev.html).
 * Every id gets the player number so several players can share a page.
 * Licensed under the Apache License, Version 2.0
 */
export type PlayerOpts = { theme?: string; preload?: 'auto' | 'none' };

export function playerMarkup(n: number, o: PlayerOpts = {}): string {
  return `<video-player>
  <media-container class="field" data-field-theme="${o.theme ?? 'putty'}" data-field-player="${n}">
    <mux-video
      data-field-media
      src="https://stream.mux.com/xg9MkUaGPFpyU2KzNVDjS71fXdFNW1tEesnbzEBwkDU.m3u8"
      playsinline
      crossorigin="anonymous"
      preload="${o.preload ?? 'none'}" muted>
      <track kind="chapters" src="/chapters.vtt" srclang="en" label="Chapters" default>
      <track kind="captions" src="/captions-en.vtt" srclang="en" label="English">
    </mux-video>

    <media-poster class="field-poster">
      <img alt="" decoding="async" src="https://image.mux.com/xg9MkUaGPFpyU2KzNVDjS71fXdFNW1tEesnbzEBwkDU/thumbnail.webp?time=21&width=1280">
    </media-poster>

    <div class="field-chip">
      <span class="field-chip-badge" hidden></span>
      <span class="field-chip-title">Caminandes 3: Llamigos</span>
      <span class="field-chip-status" hidden></span>
    </div>
    <button type="button" class="field-golive" hidden><span class="field-golive-dot" aria-hidden="true"></span>Go to live</button>

    <div class="field-rail" aria-hidden="true"></div>

    <div class="field-hints" aria-hidden="true" hidden>
      <span><kbd>K</kbd>Play</span>
      <span><kbd>J</kbd><kbd>L</kbd>10s</span>
      <span><kbd>↑</kbd><kbd>↓</kbd>Volume</span>
      <span><kbd>M</kbd>Mute</span>
      <span><kbd>C</kbd>Captions</span>
      <span><kbd>&lt;</kbd><kbd>&gt;</kbd>Speed</span>
      <span><kbd>P</kbd>PiP</span>
      <span><kbd>F</kbd>Full</span>
    </div>

    <div class="field-center">
      <media-play-button class="field-key field-play field-bigplay" id="field-bigplay-${n}">
        <span class="field-icon" data-icon="pause"></span>
        <span class="field-icon" data-icon="play"></span>
        <span class="field-icon" data-icon="replay"></span>
      </media-play-button>
      <div class="field-ready">
        <p class="field-ready-title">Caminandes 3: Llamigos</p>
        <p class="field-ready-meta"><span class="field-ready-length">2:30</span> · Blender Foundation</p>
      </div>
    </div>

    <div class="field-ended" hidden>
      <media-play-button class="field-again">Watch again?</media-play-button>
      <p class="field-ended-meta">Caminandes 3: Llamigos · <span class="field-ready-length">2:30</span></p>
    </div>

    <div class="field-error" role="alertdialog" aria-labelledby="field-error-title-${n}" aria-describedby="field-error-text-${n}" hidden>
      <div class="field-error-card">
        <p class="field-error-title" id="field-error-title-${n}">Can’t play this video</p>
        <p class="field-error-text" id="field-error-text-${n}">The stream stopped responding. Check your connection and try again.</p>
        <button type="button" class="field-error-retry">Try again</button>
      </div>
    </div>

    <div class="field-pipnote" hidden>
      <p>Playing in picture-in-picture</p>
      <button type="button" class="field-pip-back">Bring it back here</button>
    </div>

    <div class="field-shelf" popover="manual" role="dialog" aria-label="Paused">
      <button type="button" class="field-shelf-row field-shelf-restart"><span>Start over</span><span class="field-shelf-time">00:00</span></button>
      <div class="field-shelf-chapters" hidden>
        <p class="field-shelf-label">Chapters · from the video</p>
        <div class="field-shelf-list"></div>
      </div>
      <div class="field-shelf-jumps">
        <button type="button" data-jump="-30">−30s</button>
        <button type="button" data-jump="-10">−10s</button>
        <button type="button" data-jump="10">+10s</button>
        <button type="button" data-jump="30">+30s</button>
      </div>
      <p class="field-shelf-esc" aria-hidden="true"><kbd>Esc</kbd>hide</p>
    </div>

    <media-controls class="field-controls">
      <media-controls-backdrop class="field-scrim"></media-controls-backdrop>
      <media-controls-content class="field-controls-content">
        <media-tooltip-group delay="600" close-delay="0" class="field-tooltip-group">

        <div class="field-strip">
          <media-time-slider class="field-strip-slider" label="Seek">
            <media-time-slider-chapters class="field-strip-chapters">
              <template>
                <div class="field-strip-chapter">
                  <media-slider-track class="field-strip-track">
                    <media-slider-buffer class="field-strip-buffer"></media-slider-buffer>
                  </media-slider-track>
                </div>
              </template>
            </media-time-slider-chapters>
            <media-slider-fill class="field-strip-fill"></media-slider-fill>
            <media-slider-thumb class="field-needle"></media-slider-thumb>
            <div class="field-scrub" aria-hidden="true">
              <div class="field-scrub-ghost"></div>
              <div class="field-scrub-tag"></div>
              <div class="field-scrub-preview">
                <media-slider-thumbnail class="field-scrub-frame"><img alt="" decoding="async"></media-slider-thumbnail>
                <div class="field-scrub-label"></div>
              </div>
            </div>
          </media-time-slider>
        </div>

        <div class="field-row">
          <media-controls-group class="field-pill field-pill-left" aria-label="Position and volume">
            <span class="field-keybubble" aria-hidden="true" hidden></span>
            <span class="field-counter" aria-hidden="true">-- -- --</span>
            <media-seek-button class="field-key" id="field-back-${n}" seconds="-10" label="Back 10 seconds" aria-keyshortcuts="J">−10</media-seek-button>
            <media-tooltip trigger="field-back-${n}" side="top" class="field-tooltip"><media-tooltip-label></media-tooltip-label><media-tooltip-shortcut class="field-tooltip-key"></media-tooltip-shortcut></media-tooltip>
            <media-mute-button class="field-key field-key-icon field-vol" id="field-mute-${n}" aria-keyshortcuts="M">
              <span class="field-icon" data-icon="volume"></span>
              <span class="field-vol-num" aria-hidden="true"></span>
            </media-mute-button>
            <media-tooltip trigger="field-mute-${n}" side="top" class="field-tooltip"><media-tooltip-label></media-tooltip-label><media-tooltip-shortcut class="field-tooltip-key"></media-tooltip-shortcut></media-tooltip>
            <div class="field-wheel" role="slider" tabindex="-${n}" aria-label="Volume" aria-valuemin="0" aria-valuemax="10" hidden>
              <div class="field-wheel-slot"><div class="field-wheel-drum"></div><div class="field-wheel-ribs"></div></div>
              <div class="field-wheel-index"></div>
              <div class="field-wheel-detents" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div>
            </div>
            <media-seek-button class="field-key" id="field-fwd-${n}" seconds="10" label="Forward 10 seconds" aria-keyshortcuts="L">+10</media-seek-button>
            <media-tooltip trigger="field-fwd-${n}" side="top" class="field-tooltip"><media-tooltip-label></media-tooltip-label><media-tooltip-shortcut class="field-tooltip-key"></media-tooltip-shortcut></media-tooltip>
          </media-controls-group>

          <div class="field-row-gap"></div>

          <media-controls-group class="field-pill field-pill-right" aria-label="Playback options">
            <media-captions-button class="field-key field-key-icon" id="field-cc-${n}" aria-keyshortcuts="C">
              <span class="field-icon" data-icon="captions"></span>
            </media-captions-button>
            <media-tooltip trigger="field-cc-${n}" side="top" class="field-tooltip field-tooltip-cc"><media-tooltip-label></media-tooltip-label><media-tooltip-shortcut class="field-tooltip-key"></media-tooltip-shortcut><span class="field-tooltip-alt">No captions for this video</span></media-tooltip>
            <media-playback-rate-button class="field-key field-speed" id="field-speed-${n}" rates="1 1.25 1.5 2 0.5" aria-haspopup="true" aria-expanded="false">
              <span class="field-speed-label" aria-hidden="true">1×</span>
              <span class="field-speed-ticks" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i><i></i></span>
            </media-playback-rate-button>
            <div class="field-tray" role="radiogroup" aria-label="Playback speed" hidden></div>
            <media-tooltip trigger="field-speed-${n}" side="top" class="field-tooltip"><media-tooltip-label></media-tooltip-label><media-tooltip-shortcut class="field-tooltip-key"></media-tooltip-shortcut></media-tooltip>
            <media-pip-button class="field-key field-key-icon" id="field-pip-${n}" aria-keyshortcuts="P">
              <span class="field-icon" data-icon="pip"></span>
            </media-pip-button>
            <media-tooltip trigger="field-pip-${n}" side="top" class="field-tooltip"><media-tooltip-label></media-tooltip-label><media-tooltip-shortcut class="field-tooltip-key"></media-tooltip-shortcut></media-tooltip>
            <button type="button" class="field-key field-key-icon field-settings" id="field-settings-key-${n}" commandfor="field-settings-${n}" aria-label="Settings">
              <span class="field-icon" data-icon="settings"></span>
            </button>
            <media-tooltip trigger="field-settings-key-${n}" side="top" class="field-tooltip"><span>Settings</span></media-tooltip>
            <media-fullscreen-button class="field-key field-key-icon" id="field-fs-${n}" aria-keyshortcuts="F">
              <span class="field-icon" data-icon="fullscreen"></span>
              <span class="field-icon" data-icon="fullscreen-exit"></span>
            </media-fullscreen-button>
            <media-tooltip trigger="field-fs-${n}" side="top" class="field-tooltip"><media-tooltip-label></media-tooltip-label><media-tooltip-shortcut class="field-tooltip-key"></media-tooltip-shortcut></media-tooltip>
          </media-controls-group>

          <media-play-button class="field-key field-play" id="field-play-${n}" aria-keyshortcuts="K">
            <span class="field-icon" data-icon="pause"></span>
            <span class="field-icon" data-icon="play"></span>
            <span class="field-icon" data-icon="replay"></span>
              </media-play-button>
          <media-tooltip trigger="field-play-${n}" side="top" class="field-tooltip"><media-tooltip-label></media-tooltip-label><media-tooltip-shortcut class="field-tooltip-key"></media-tooltip-shortcut></media-tooltip>
        </div>

        <media-menu id="field-settings-${n}" class="field-menu" side="top" align="end">
          <media-menu-content class="field-menu-content">
            <media-menu-group class="field-group field-group-speed">
              <media-menu-group-label class="field-group-label">Speed</media-menu-group-label>
              <media-playback-rate-radio-group class="field-chips">
                <template>
                  <media-menu-radio-item class="field-chip-option"><span data-part="label"></span></media-menu-radio-item>
                </template>
              </media-playback-rate-radio-group>
            </media-menu-group>
            <media-menu-group class="field-group field-group-quality">
              <media-menu-group-label class="field-group-label">Quality · from the stream</media-menu-group-label>
              <media-quality-radio-group class="field-options">
                <template>
                  <media-menu-radio-item class="field-option">
                    <span data-part="label"></span>
                    <span class="field-option-value"><span data-part="badge"></span><media-menu-item-indicator class="field-check">✓</media-menu-item-indicator></span>
                  </media-menu-radio-item>
                </template>
              </media-quality-radio-group>
            </media-menu-group>
            <media-menu-group class="field-group field-group-captions">
              <media-menu-group-label class="field-group-label">Captions · from the stream</media-menu-group-label>
              <media-captions-radio-group class="field-options">
                <template>
                  <media-menu-radio-item class="field-option">
                    <span data-part="label"></span>
                    <span class="field-option-value"><span data-part="badge"></span><media-menu-item-indicator class="field-check">✓</media-menu-item-indicator></span>
                  </media-menu-radio-item>
                </template>
              </media-captions-radio-group>
            </media-menu-group>
            <media-menu-group class="field-group field-group-more">
              <media-menu-item class="field-option field-more-pip" data-field-proxy="field-pip-${n}"><span>Picture-in-picture</span><span class="field-option-value">P</span></media-menu-item>
              <media-menu-item class="field-option field-more-fs" data-field-proxy="field-fs-${n}"><span>Fullscreen</span><span class="field-option-value">F</span></media-menu-item>
            </media-menu-group>
            <media-menu-group class="field-group">
              <media-menu-group-label class="field-group-label">Key sounds</media-menu-group-label>
              <div class="field-row-item">
                <span>Tape clicks on keys</span>
                <media-menu-radio-group class="field-seg" value="off" aria-label="Tape clicks on keys" data-field-key-sounds>
                  <media-menu-radio-item value="off">Off</media-menu-radio-item>
                  <media-menu-radio-item value="on">On</media-menu-radio-item>
                </media-menu-radio-group>
              </div>
            </media-menu-group>
          </media-menu-content>
        </media-menu>

        <!-- Touch: one short list, 52px rows, value on the right; › opens one level of choices -->
        <media-menu id="field-more-${n}" class="field-menu field-more" side="top" align="end">
          <media-menu-content class="field-more-page">
            <media-menu-item commandfor="field-more-speed-${n}" class="field-more-row"><span>Speed</span><span class="field-more-value" data-part="value"></span><span class="field-chev" aria-hidden="true">›</span></media-menu-item>
            <media-menu-item commandfor="field-more-quality-${n}" class="field-more-row"><span>Quality</span><span class="field-more-value" data-part="value"></span><span class="field-chev" aria-hidden="true">›</span></media-menu-item>
            <media-menu-item commandfor="field-more-cc-${n}" class="field-more-row"><span>Captions</span><span class="field-more-value" data-part="value"></span><span class="field-chev" aria-hidden="true">›</span></media-menu-item>
            <media-menu-item commandfor="field-more-ch-${n}" class="field-more-row field-more-chapters-row"><span>Chapters</span><span class="field-more-value"></span><span class="field-chev" aria-hidden="true">›</span></media-menu-item>
            <media-menu-item class="field-more-row" data-field-proxy="field-pip-${n}"><span>Picture-in-picture</span></media-menu-item>
            <media-menu-item class="field-more-row field-more-fsrow" data-field-proxy="field-fs-${n}"><span>Fullscreen</span></media-menu-item>
            <media-menu-item class="field-more-row field-more-ks"><span>Key sounds</span><span class="field-more-value field-more-ks-value">Off</span></media-menu-item>
          </media-menu-content>

          <media-menu-content id="field-more-speed-${n}" class="field-more-page">
            <media-menu-item class="field-more-back"><span class="field-chev" aria-hidden="true">‹</span><span>Speed</span></media-menu-item>
            <media-playback-rate-radio-group class="field-more-options">
              <template><media-menu-radio-item class="field-more-row field-more-option"><span data-part="label"></span><media-menu-item-indicator force-mount class="field-check">✓</media-menu-item-indicator></media-menu-radio-item></template>
            </media-playback-rate-radio-group>
          </media-menu-content>

          <media-menu-content id="field-more-quality-${n}" class="field-more-page">
            <media-menu-item class="field-more-back"><span class="field-chev" aria-hidden="true">‹</span><span>Quality</span></media-menu-item>
            <media-quality-radio-group class="field-more-options">
              <template><media-menu-radio-item class="field-more-row field-more-option"><span data-part="label"></span><media-menu-item-indicator force-mount class="field-check">✓</media-menu-item-indicator></media-menu-radio-item></template>
            </media-quality-radio-group>
          </media-menu-content>

          <media-menu-content id="field-more-cc-${n}" class="field-more-page">
            <media-menu-item class="field-more-back"><span class="field-chev" aria-hidden="true">‹</span><span>Captions</span></media-menu-item>
            <media-captions-radio-group class="field-more-options">
              <template><media-menu-radio-item class="field-more-row field-more-option"><span data-part="label"></span><media-menu-item-indicator force-mount class="field-check">✓</media-menu-item-indicator></media-menu-radio-item></template>
            </media-captions-radio-group>
          </media-menu-content>

          <media-menu-content id="field-more-ch-${n}" class="field-more-page field-more-chapters">
            <media-menu-item class="field-more-back"><span class="field-chev" aria-hidden="true">‹</span><span>Chapters</span></media-menu-item>
            <media-menu-item class="field-more-row field-more-restart"><span>Start over</span><span class="field-more-value">00:00</span></media-menu-item>
          </media-menu-content>
        </media-menu>
        </media-tooltip-group>
      </media-controls-content>
    </media-controls>

    <media-hotkey keys="Space" action="togglePaused"></media-hotkey>
    <media-hotkey keys="k" action="togglePaused"></media-hotkey>
    <media-hotkey keys="m" action="toggleMuted"></media-hotkey>
    <media-hotkey keys="ArrowRight" action="seekStep" value="10"></media-hotkey>
    <media-hotkey keys="ArrowLeft" action="seekStep" value="-10"></media-hotkey>
    <media-hotkey keys="l" action="seekStep" value="10"></media-hotkey>
    <media-hotkey keys="j" action="seekStep" value="-10"></media-hotkey>
    <media-hotkey keys="0-9" action="seekToPercent"></media-hotkey>
    <media-hotkey keys=">" action="speedUp"></media-hotkey>
    <media-hotkey keys="<" action="speedDown"></media-hotkey>
    <media-hotkey keys="f" action="toggleFullscreen"></media-hotkey>
    <media-hotkey keys="c" action="toggleSubtitles"></media-hotkey>
    <media-hotkey keys="p" action="togglePictureInPicture"></media-hotkey>
    <media-gesture type="tap" action="togglePaused" pointer="mouse" region="center"></media-gesture>
    <media-gesture type="tap" action="toggleControls" pointer="touch"></media-gesture>
    <media-gesture type="doubletap" action="seekStep" value="-10" region="left" pointer="touch"></media-gesture>
    <media-gesture type="doubletap" action="seekStep" value="10" region="right" pointer="touch"></media-gesture>
    <media-seek-indicator class="field-seek-ripple" aria-hidden="true"><media-seek-indicator-value class="field-seek-bubble"></media-seek-indicator-value></media-seek-indicator>
    <media-status-announcer class="field-sr"></media-status-announcer>
  </media-container>
</video-player>`;
}
