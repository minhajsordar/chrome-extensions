// Configuration
const config = {
  // Enable debug messages in console
  debug: true,
  // Enable YouTube ad skipping
  skipYouTubeAds: true,
  // Enable popup removal
  removePopups: true,
  // Video playback settings
  videoPlayback: {
    defaultSpeed: 1,
    adSpeed: 10,
    volume: 0
  },
  // Ad skipping settings
  adSkip: {
    maxAttempts: 10,
    skipButtonSelectors: [
      'ytp-ad-skip-button-container', 
      'ytp-ad-skip-button-modern', 
      '.videoAdUiSkipButton', 
      '.ytp-ad-skip-button',
      '.ytp-ad-skip-button-slot'
    ]
  }
};

// Debug logging function
function debugLog(message, level = 'log', ...args) {
  if (!config.debug) return;
  const prefix = '[AdBlocker]';
  const logMessage = `${prefix} ${message}`;
  
  switch(level.toLowerCase()) {
    case 'error':
    case 'err':
    case 'e':
      console.error(logMessage, ...args);
      break;
    case 'warn':
    case 'warning':
    case 'w':
      console.warn(logMessage, ...args);
      break;
    case 'info':
    case 'i':
      console.info(logMessage, ...args);
      break;
    case 'debug':
    case 'd':
      console.debug(logMessage, ...args);
      break;
    default:
      console.log(logMessage, ...args);
  }
}

// Common ad selectors for various websites
const adSelectors = {
  // General ad selectors
  general: [
    '[id*="google_ads"]', '.ad', '.ads', '.advertisement', '.ad-container',
    '.ad-wrapper', '.ad-banner', '.ad-box', '.ad-unit',
    '[class*="ad-"]', '[class*="Ad-"]', '[class*="_ad"]',
    '[id*="ad-"]', '[id*="Ad-"]', '[id*="_ad"]',
    'iframe[src*="ads"]', 'iframe[src*="adserver"]',
    'div[data-ad]', 'div[data-ad-unit]', 'div[data-ad-targeting]'
  ],

  // YouTube specific selectors
  youtube: [
    '.video-ads', '.ytp-ad-module', '.ytp-ad-overlay-container',
    '.ytp-ad-progress', '.ytp-ad-skip-button', '.ytp-ad-skip-button-modern',
    '.ytp-ad-text-overlay', '.ytp-ad-player-overlay', '.ytp-ad-message',
    '.ytp-ad-notification', '.ytp-ad-preview', '.ytp-ad-skip-button',
    '.ytp-ad-skip-button-container', '.ytp-ad-skip-button-slot',
    '.ytp-ad-text', '.ytp-ad-toggle-button', '.ytp-ad-visit-advertiser-button',
    '.ytp-banner-iframe', '.ytp-ce-element', '.ytp-ce-covering-overlay',
    '.ytp-ce-covering-image', '.ytp-ce-element-show', '.ytp-ce-element-shadow',
    '.ytp-ce-video', '.ytp-ce-playlist', '.ytp-ce-website', '.ytp-chrome-controls',
    '.ytp-pause-overlay', '.ytp-paid-content-overlay', '.ytp-ad-overlay-container',
    '.ytp-ad-player-overlay', '.ytp-ad-skip-button', '.ytp-ad-skip-button-modern',
    '.ytp-ad-text-overlay', '.ytp-ad-player-overlay', '.ytp-ad-message',
    '.ytp-ad-notification', '.ytp-ad-preview', '.ytp-ad-skip-button',
    '.ytp-ad-skip-button-container', '.ytp-ad-skip-button-slot',
    '.ytp-ad-text', '.ytp-ad-toggle-button', '.ytp-ad-visit-advertiser-button'
  ],

  // Facebook specific selectors
  facebook: [
    '[role="feed"] [role="article"]',
    '[role="main"] [role="article"]',
    '[data-pagelet*="Feed"]',
    '[data-pagelet*="feed"]',
    '[data-pagelet*="Stories"]',
    '[data-pagelet*="stories"]',
    '[data-pagelet*="Sponsored"]',
    '[data-pagelet*="sponsored"]',
    '[data-pagelet*="Marketplace"]',
    '[data-pagelet*="marketplace"]',
    '[data-pagelet*="Video"]',
    '[data-pagelet*="video"]',
    '[data-pagelet*="Watch"]',
    '[data-pagelet*="watch"]',
    '[data-pagelet*="Groups"]',
    '[data-pagelet*="groups"]',
    '[data-pagelet*="Events"]',
    '[data-pagelet*="events"]',
    '[data-pagelet*="Pages"]',
    '[data-pagelet*="pages"]',
    '[data-pagelet*="Gaming"]',
    '[data-pagelet*="gaming"]',
    '[data-pagelet*="Jobs"]',
    '[data-pagelet*="jobs"]',
    '[data-pagelet*="Weather"]',
    '[data-pagelet*="weather"]',
    '[data-pagelet*="Memories"]',
    '[data-pagelet*="memories"]',
    '[data-pagelet*="Saved"]',
    '[data-pagelet*="saved"]',
    '[data-pagelet*="Friend"]',
    '[data-pagelet*="friend"]',
    '[data-pagelet*="Group"]',
    '[data-pagelet*="group"]',
    '[data-pagelet*="Event"]',
    '[data-pagelet*="event"]',
    '[data-pagelet*="Page"]',
    '[data-pagelet*="page"]',
    '[data-pagelet*="Gaming"]',
    '[data-pagelet*="gaming"]',
    '[data-pagelet*="Job"]',
    '[data-pagelet*="job"]',
    '[data-pagelet*="Weather"]',
    '[data-pagelet*="weather"]',
    '[data-pagelet*="Memory"]',
    '[data-pagelet*="memory"]',
    '[data-pagelet*="Save"]',
    '[data-pagelet*="save"]',
    '[data-pagelet*="Friend"]',
    '[data-pagelet*="friend"]',
    '[data-pagelet*="Group"]',
    '[data-pagelet*="group"]',
    '[data-pagelet*="Event"]',
    '[data-pagelet*="event"]',
    '[data-pagelet*="Page"]',
    '[data-pagelet*="page"]',
    '[data-pagelet*="Gaming"]',
    '[data-pagelet*="gaming"]',
    '[data-pagelet*="Job"]',
    '[data-pagelet*="job"]',
    '[data-pagelet*="Weather"]',
    '[data-pagelet*="weather"]',
    '[data-pagelet*="Memory"]',
    '[data-pagelet*="memory"]',
    '[data-pagelet*="Save"]',
    '[data-pagelet*="save"]',
    '[data-pagelet*="Friend"]',
    '[data-pagelet*="friend"]',
    '[data-pagelet*="Group"]',
    '[data-pagelet*="group"]',
    '[data-pagelet*="Event"]',
    '[data-pagelet*="event"]',
    '[data-pagelet*="Page"]',
    '[data-pagelet*="page"]',
    '[data-pagelet*="Gaming"]',
    '[data-pagelet*="gaming"]',
    '[data-pagelet*="Job"]',
    '[data-pagelet*="job"]',
    '[data-pagelet*="Weather"]',
    '[data-pagelet*="weather"]',
    '[data-pagelet*="Memory"]',
    '[data-pagelet*="memory"]',
    '[data-pagelet*="Save"]',
    '[data-pagelet*="save"]',
    '[data-pagelet*="Friend"]',
    '[data-pagelet*="friend"]',
    '[data-pagelet*="Group"]',
    '[data-pagelet*="group"]',
    '[data-pagelet*="Event"]',
    '[data-pagelet*="event"]',
    '[data-pagelet*="Page"]',
    '[data-pagelet*="page"]',
    '[data-pagelet*="Gaming"]',
    '[data-pagelet*="gaming"]',
    '[data-pagelet*="Job"]',
    '[data-pagelet*="job"]',
    '[data-pagelet*="Weather"]',
    '[data-pagelet*="weather"]',
    '[data-pagelet*="Memory"]',
    '[data-pagelet*="memory"]',
    '[data-pagelet*="Save"]',
    '[data-pagelet*="save"]',
    '[data-pagelet*="Friend"]',
    '[data-pagelet*="friend"]',
    '[data-pagelet*="Group"]',
    '[data-pagelet*="group"]',
    '[data-pagelet*="Event"]',
    '[data-pagelet*="event"]',
    '[data-pagelet*="Page"]',
    '[data-pagelet*="page"]',
    '[data-pagelet*="Gaming"]',
    '[data-pagelet*="gaming"]',
    '[data-pagelet*="Job"]',
    '[data-pagelet*="job"]',
    '[data-pagelet*="Weather"]',
    '[data-pagelet*="weather"]',
    '[data-pagelet*="Memory"]',
    '[data-pagelet*="memory"]',
    '[data-pagelet*="Save"]',
    '[data-pagelet*="save"]',
    '[data-pagelet*="Friend"]',
    '[data-pagelet*="friend"]',
    '[data-pagelet*="Group"]',
    '[data-pagelet*="group"]',
    '[data-pagelet*="Event"]',
    '[data-pagelet*="event"]',
    '[data-pagelet*="Page"]',
    '[data-pagelet*="page"]',
    '[data-pagelet*="Gaming"]',
    '[data-pagelet*="gaming"]',
    '[data-pagelet*="Job"]',
    '[data-pagelet*="job"]',
    '[data-pagelet*="Weather"]',
    '[data-pagelet*="weather"]',
    '[data-pagelet*="Memory"]',
    '[data-pagelet*="memory"]',
    '[data-pagelet*="Save"]',
    '[data-pagelet*="save"]'
  ]
};

// Store the current state
let isAdBlockingEnabled = true;
let blockedCount = 0;
let currentPlaybackSpeed = config.videoPlayback.defaultSpeed;
let adLoopCount = 0;
let isAdPlaying = false;

// Handle YouTube video ads
function handleYouTubeAds() {
  if (!config.skipYouTubeAds || !window.location.hostname.includes('youtube.com')) return;
  
  const video = document.querySelector('video');
  const adShowing = document.querySelector('.ad-showing, .ad-interrupting, .video-ads');
  
  if (adShowing && video) {
    if (!isAdPlaying) {
      isAdPlaying = true;
      adLoopCount = 0;
      debugLog('Ad detected, attempting to skip...');
    }

    // Try to skip using various methods
    if (adLoopCount < config.adSkip.maxAttempts) {
      adLoopCount++;
      
      // Method 1: Click skip buttons
      config.adSkip.skipButtonSelectors.forEach(selector => {
        const buttons = document.querySelectorAll(selector);
        buttons.forEach(btn => {
          if (btn && btn.click) {
            btn.click();
            debugLog('Clicked skip button');
          }
        });
      });
      
      // Method 2: Speed up and mute the ad
      video.playbackRate = config.videoPlayback.adSpeed;
      video.volume = config.videoPlayback.volume;
      
      // Method 3: Try to skip to end
      if (video.duration > 0 && !isNaN(video.duration)) {
        video.currentTime = video.duration - 0.1;
      }
      
      // Try to play in case it was paused
      video.play().catch(e => debugLog('Error playing video:', 'error', e));
    } else {
      // If we've tried too many times, just play normally
      video.playbackRate = currentPlaybackSpeed;
      video.volume = 1;
    }
  } else if (isAdPlaying) {
    // Ad ended, reset state
    isAdPlaying = false;
    adLoopCount = 0;
    if (video) {
      video.playbackRate = currentPlaybackSpeed;
      video.volume = 1;
    }
  }
}

// Remove YouTube popups
function removePopups() {
  if (!config.removePopups) return;
  
  // YouTube popup overlays
  const popupSelectors = [
    'tp-yt-iron-overlay-backdrop',
    '.ytd-enforcement-message-view-model',
    '#dismiss-button',
    '.ytp-popup',
    '.ytp-ad-overlay-container',
    '.ytp-ad-player-overlay'
  ];
  
  popupSelectors.forEach(selector => {
    document.querySelectorAll(selector).forEach(el => {
      if (el.remove) {
        el.remove();
        debugLog(`Removed popup: ${selector}`);
      } else if (el.style) {
        el.style.display = 'none';
      }
    });
  });
  
  // Ensure video keeps playing
  const video = document.querySelector('video');
  if (video && video.paused) {
    video.play().catch(e => debugLog('Error resuming video:', 'error', e));
  }
}

// Function to block ads using CSS selectors
function blockAdsWithSelectors() {
  const hostname = window.location.hostname;
  let selectors = [...adSelectors.general];

  // Add specific selectors based on the current website
  if (hostname.includes('youtube.com')) {
    selectors = [...selectors, ...adSelectors.youtube];
  } else if (hostname.includes('facebook.com')) {
    selectors = [...selectors, ...adSelectors.facebook];
  }

  // Remove duplicates
  selectors = [...new Set(selectors)];

  // Block elements matching the selectors
  selectors.forEach(selector => {
    try {
      document.querySelectorAll(selector).forEach(el => {
        if (el.offsetParent !== null) { // Only count visible elements
          blockedCount++;
          chrome.runtime.sendMessage({ action: 'adBlocked' });
        }
        el.style.display = 'none';
        el.remove();
      });
    } catch (e) {
      console.error('Error blocking ads:', e);
    }
  });

  const sponsor = document.querySelectorAll("div#player-ads.style-scope.ytd-watch-flexy, div#panels.style-scope.ytd-watch-flexy");
  sponsor?.forEach((element) => {
    if (element.getAttribute("id") === "rendering-content") {
      element.childNodes?.forEach((childElement) => {
        if (childElement?.data.targetId && childElement?.data.targetId !== "engagement-panel-macro-markers-description-chapters") {
          //Skipping the Chapters section
          element.style.display = 'none';
        }
      });
    }
  });

}

// Function to update ad blocking state
function updateAdBlockingState() {
  if (isAdBlockingEnabled) {
    blockAdsWithSelectors();
  }
}

// Initialize with current state from storage
chrome.storage.sync.get(['adBlockerEnabled'], (data) => {
  isAdBlockingEnabled = data.adBlockerEnabled !== false; // Default to true
  if (isAdBlockingEnabled) {
    startAdBlocking();
  }
});

// Listen for messages from the background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'toggleAdBlocker') {
    isAdBlockingEnabled = request.enabled;
    if (isAdBlockingEnabled) {
      startAdBlocking();
    } else {
      stopAdBlocking();
      window.location.reload();
    }
  }
  return true;
});

// Main blocking intervals
let adBlockInterval = null;
let youtubeAdInterval = null;
let popupInterval = null;

function startAdBlocking() {
  if (!adBlockInterval) {
    // Run immediately
    updateAdBlockingState();
    // Then set up interval
    adBlockInterval = setInterval(updateAdBlockingState, 2000);
    debugLog('Ad blocking started');
  }
  
  // Start YouTube specific handlers if on YouTube
  if (window.location.hostname.includes('youtube.com')) {
    if (!youtubeAdInterval) {
      youtubeAdInterval = setInterval(handleYouTubeAds, 500);
      debugLog('YouTube ad handler started');
    }
    
    if (!popupInterval) {
      popupInterval = setInterval(removePopups, 1000);
      debugLog('Popup remover started');
    }
  }
}

function stopAdBlocking() {
  if (adBlockInterval) {
    clearInterval(adBlockInterval);
    adBlockInterval = null;
    debugLog('Ad blocking stopped');
  }
  
  if (youtubeAdInterval) {
    clearInterval(youtubeAdInterval);
    youtubeAdInterval = null;
  }
  
  if (popupInterval) {
    clearInterval(popupInterval);
    popupInterval = null;
  }
}

// Start blocking on page load
if (isAdBlockingEnabled) {
  startAdBlocking();
}

// Also block ads on dynamic content changes
const observer = new MutationObserver((mutations) => {
  if (isAdBlockingEnabled) {
    updateAdBlockingState();
  }
});

observer.observe(document, {
  childList: true,
  subtree: true
});
