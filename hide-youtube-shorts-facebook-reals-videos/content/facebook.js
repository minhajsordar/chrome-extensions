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

// Function to hide Facebook Reels
function hideFacebookReels() {
  console.log("hideFacebookReels", localStorage.getItem("Session"));
  document.body.setAttribute('hide-reels', 'true');
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
  document.body.setAttribute('hide-stories', 'true');
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

// Function to hide Facebook Videos
function hideFacebookVideos() {
  document.body.setAttribute('hide-videos', 'true');
  // Hide video elements
  document.querySelectorAll('video').forEach(video => {
    video.pause();
    let element = video;
    // Go up 3 levels to hide the video container
    for (let i = 0; i < 3; i++) {
      const parent = element.parentElement;
      if (!parent) break;
      element = parent;
    }
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
        element.style.display = 'none';
      });
    } catch (e) {
      console.error('Error hiding video sections:', e);
    }
  });
}

// Function to handle settings updates
function handleSettingsUpdate(settings) {
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
    facebookReels: true,
    facebookStories: true,
    facebookVideos: true
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
  facebookReels: true,
  facebookStories: true,
  facebookVideos: true }; // default

// Load once
try {
  chrome.storage.sync.get(['settings'], (result) => {
    settings = result?.settings || { facebookReels: true,
      facebookStories: true,
      facebookVideos: true };
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
window.addEventListener("unload", () => {
  observer.disconnect();
});

// Also run on page load
document.addEventListener('DOMContentLoaded', () => {
  chrome.storage.sync.get(['settings'], (result) => {
    const settings = result.settings || {
      facebookReels: true,
      facebookStories: true,
      facebookVideos: true
    };
    handleSettingsUpdate(settings);
  });
});
