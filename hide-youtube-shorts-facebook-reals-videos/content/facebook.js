// Function to redirect to home if on watch page
const linkofVideoPages = [
  "https://www.facebook.com/watch",
  "https://www.facebook.com/videos"
]
function handleFbVideoPageRedirect() {
  for (const videoPageLinks of linkofVideoPages) {
    if (window.location.href.startsWith(videoPageLinks)) {
      window.location.href = 'https://www.facebook.com';
    }
  }
}

function toggleAttribute(settings) {
  document.body.setAttribute('hide-reels', settings.facebookReels);
  document.body.setAttribute('hide-stories', settings.facebookStories);
  document.body.setAttribute('hide-videos', settings.facebookVideos);
}

// Function to hide Facebook Reels
function hideFacebookReels() {
  const reelsSelectors = [
    '[aria-label*="Reels" i]',
    '[href*="/reel/"]',
    '[href*="/reels/"]',
    'div[data-pagelet*="reel" i]',
    'div[data-pagelet*="Reel"]',
    'a[href*="/reels/"]',
    'a[href*="/reel/"]',
    '[aria-label="Reel"]'
  ];

  reelsSelectors.forEach(selector => {
    try {
      document.querySelectorAll(selector).forEach(element => {
        element.style.display = 'none';
      });
    } catch (e) {
      console.error('Error hiding reels:', e);
    }
  });
}

// Function to hide Facebook Stories
function hideFacebookStories() {
  const storiesSelectors = [
    '[aria-label*="Stories" i]',
    '[aria-label*="Story" i]',
    '[role*="region"] [role*="button"][aria-label*="story" i]',
    'div[role*="feed"] [role*="article"]',
    'div[data-pagelet*="Stories"]',
    'div[data-pagelet*="stories"]'
  ];

  storiesSelectors.forEach(selector => {
    try {
      document.querySelectorAll(selector).forEach(element => {
        element.style.display = 'none';
      });
    } catch (e) {
      console.error('Error hiding stories:', e);
    }
  });
}

function replaceVideoElement() {
  const videoElements = document.querySelectorAll('video');
  videoElements?.classList?.add('custom-debug5');
  videoElements.forEach(video => {
    const videoParent = video.parentElement;
    const videoDiv = document.createElement('div');
    videoDiv.style.height = video.clientHeight + 'px';
    videoParent.replaceChild(videoDiv, video);
  });
}

// Function to hide Facebook Videos
function hideFacebookVideos() {
  // Hide video elements
  document.querySelectorAll('video').forEach(video => {
    video.pause();
    let element = video;

    // Go up 3 levels to hide the video container
    for (let i = 0; i < 14; i++) {
      const parent = element.parentElement;
      if (!parent) break;
      element = parent;
    }
    element?.classList?.add('custom-debug1');
    element.style.display = 'none';
  });
  // Hide video elements
  document.querySelectorAll('[href="https://www.facebook.com/watch/"]').forEach(videoLinkElement => {
    let element = videoLinkElement;
    // Go up 3 levels to hide the video container
    for (let i = 0; i < 4; i++) {
      const parent = element.parentElement;
      if (!parent) break;
      element = parent;
    }
    element.style.display = 'none';
    element?.classList?.add('custom-debug2');
  });

  // Hide video navigation buttons
  document.querySelectorAll('[aria-label="Video"], [aria-label*="video" i]').forEach(button => {
    let element = button;
    // Go up 3 levels to hide the button container
    for (let i = 0; i < 3; i++) {
      const parent = element.parentElement;
      if (!parent) break;
      element = parent;
    }
    element.style.display = 'none';
    element?.classList?.add('custom-debug3');
  });

  // Hide watch page and video sections
  const videoSectionSelectors = [
    '[data-pagelet*="Video" i]',
    '[data-pagelet*="video"]',
    '[data-pagelet*="Watch"]',
    '[data-pagelet*="watch"]',
    'div[role="feed"] > div > div > div[role="article"]',
    'div[data-ad-preview*="video"]',
    'div[data-video*="true"]',
    'div[data-store*="video"]'
  ];

  videoSectionSelectors.forEach(selector => {
    try {
      document.querySelectorAll(selector).forEach(element => {
        element?.classList?.add('custom-debug4');
        element.style.display = 'none';
      });
    } catch (e) {
      console.error('Error hiding video sections:', e);
    }
  });
  replaceVideoElement();
}

// Function to handle settings updates
function handleSettingsUpdate(settings) {
  commonSettingUpdate?.(settings);
  setTimeout(() => {
    toggleAttribute(settings);
  }, 100);
  if (settings.facebookReels) {
    hideFacebookReels();
  }else{
    document.body.removeAttribute('hide-reels');
  }
  if (settings.facebookStories) {
    hideFacebookStories();
  }else{
    document.body.removeAttribute('hide-stories');
  }
  if (settings.facebookVideos) {
    hideFacebookVideos();
    handleFbVideoPageRedirect();
  }else{
    document.body.removeAttribute('hide-videos');
  }
}

// Initial run
chrome.storage.sync.get(['settings'], (result) => {
  const settings = result.settings || {
    facebookReels: false,
    facebookStories: false,
    facebookVideos: false,
    photos: false,
    videos: false
  };
  
  handleFbVideoPageRedirect();
  
  handleSettingsUpdate(settings);
});

// Listen for settings updates
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'settingsUpdated') {
    handleSettingsUpdate(request.settings);
  }
});


let settings = { 
  facebookReels: false,
  facebookStories: false,
  facebookVideos: false,
  photos: false, videos: false
}; // default

// Load once
try {
  chrome.storage.sync.get(['settings'], (result) => {
    settings = result?.settings || { facebookReels: false,
      facebookStories: false,
      facebookVideos: false,
      photos: false, videos: false };
  });

  // Watch for updates from popup/options
  chrome.storage.onChanged.addListener((changes) => {
    if (changes.settings) {
      settings = changes.settings.newValue;
    }
  });
} catch (e) {
  console.warn("Extension context not available:", e);
}

// MutationObserver only uses the cached settings
const observer = new MutationObserver(() => {
  if (settings?.facebookReels || settings?.facebookStories || settings?.facebookVideos) {
    try {
      handleSettingsUpdate(settings);
    } catch (err) {
      console.error("handleSettingsUpdate failed:", err);
    }
  }
});

// Start observing the document with the configured parameters
observer.observe(document.body, {
  childList: true,
  subtree: true
});


// Clean up when navigating away
if (window.addEventListener && typeof window.addEventListener === 'function' && typeof window.addEventListener.unload === 'function') {
  window.addEventListener("unload", () => {
    observer.disconnect();
  });
}

// Also run on page load
document.addEventListener('DOMContentLoaded', () => {
  chrome.storage.sync.get(['settings'], (result) => {
    const settings = result.settings || {
      facebookReels: false,
      facebookStories: false,
      facebookVideos: false,
      photos: false,
      videos: false
    };
    handleSettingsUpdate(settings);
  });
});
