function showPhotos() {
    document.body.removeAttribute('hide-any-photos');
    // console.log('showPhotos');
}
function hidePhotos() {
    document.body.setAttribute('hide-any-photos', 'true');
}
function showVideos() {
    document.body.removeAttribute('hide-any-videos');
}
function hideVideos() {
    document.body.setAttribute('hide-any-videos', 'true');
}

// Audio control across any site
function muteAllMedia() {
  try {
    const media = document.querySelectorAll('video, audio');
    media.forEach(el => {
      try {
        // Save previous state once
        if (el.__focusPrevVolume === undefined && typeof el.volume === 'number') {
          el.__focusPrevVolume = el.volume;
        }
        if (el.__focusPrevMuted === undefined) {
          el.__focusPrevMuted = !!el.muted;
        }
        el.muted = true;
        if (typeof el.volume === 'number') el.volume = 0;
      } catch (_) {}
      // Ensure future play remains muted
      if (!el.__focusMuteListener) {
        el.__focusMuteListener = () => {
          try { el.muted = true; if (typeof el.volume === 'number') el.volume = 0; } catch (_) {}
        };
        el.addEventListener('play', el.__focusMuteListener, { capture: true });
      }
    });
  } catch (_) {}
}

function unmuteAllMedia() {
  try {
    const media = document.querySelectorAll('video, audio');
    media.forEach(el => {
      try {
        el.muted = false;
        // Restore previous volume if we saved it, else set to 1 as a sensible default
        if (el.__focusPrevVolume !== undefined && typeof el.volume === 'number') {
          el.volume = el.__focusPrevVolume;
        } else if (typeof el.volume === 'number' && el.volume === 0) {
          el.volume = 1;
        }
      } catch (_) {}
      if (el.__focusMuteListener) {
        el.removeEventListener('play', el.__focusMuteListener, { capture: true });
        el.__focusMuteListener = null;
      }
      // Clear saved state so future toggles can capture again
      el.__focusPrevVolume = undefined;
      el.__focusPrevMuted = undefined;
    });
  } catch (_) {}
}

// Track recent user interactions to differentiate autoplay vs user-initiated play
if (typeof window.__focusLastUserInteraction === 'undefined') {
  window.__focusLastUserInteraction = 0;
  const markInteraction = () => { window.__focusLastUserInteraction = Date.now(); };
  ['click', 'mousedown', 'keydown', 'touchstart', 'pointerdown'].forEach(evt => {
    window.addEventListener(evt, markInteraction, { capture: true, passive: true });
  });
}

// Autoplay control
function disableAutoplayAllMedia() {
  try {
    const media = document.querySelectorAll('video, audio');
    media.forEach(el => {
      try {
        el.autoplay = false;
        el.removeAttribute('autoplay');
        // Pause if it started playing
        if (!el.paused) {
          el.pause();
        }
      } catch (_) {}
      if (!el.__focusAutoplayBlocker) {
        el.__focusAutoplayBlocker = () => {
          try {
            // If a user interaction occurred very recently, allow play
            const sinceInteraction = Date.now() - (window.__focusLastUserInteraction || 0);
            if (sinceInteraction < 1200) {
              return; // allow user-initiated play
            }
            // Otherwise, treat as autoplay and prevent it
            el.autoplay = false;
            el.removeAttribute('autoplay');
            if (!el.paused) el.pause();
          } catch (_) {}
        };
        el.addEventListener('play', el.__focusAutoplayBlocker, { capture: true });
      }
    });
  } catch (_) {}
}

function enableAutoplayAllMedia() {
  try {
    const media = document.querySelectorAll('video, audio');
    media.forEach(el => {
      if (el.__focusAutoplayBlocker) {
        el.removeEventListener('play', el.__focusAutoplayBlocker, { capture: true });
        el.__focusAutoplayBlocker = null;
      }
      // Do not force play; just allow site default behavior now
    });
  } catch (_) {}
}

function commonSettingUpdate(settings={ photos: false, videos: false, disableAudio: false, disableAutoplay: false }) {
  if (settings.photos) {
    hidePhotos?.();
  }else{
    showPhotos?.();
  }
  
  if (settings.videos) {
    hideVideos?.();
  }else{
    showVideos?.();
  }

  // Disable audio across the page if requested
  if (settings.disableAudio) {
    muteAllMedia?.();
  } else {
    unmuteAllMedia?.();
  }

  // Disable autoplay across the page if requested
  if (settings.disableAutoplay) {
    disableAutoplayAllMedia?.();
  } else {
    enableAutoplayAllMedia?.();
  }
}
