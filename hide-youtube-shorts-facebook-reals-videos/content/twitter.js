// Function to hide Twitter videos and reels
function hideTwitterVideos() {
  document.body.setAttribute('hide-videos', 'true');
  // Hide video posts in the timeline
  const videoTweets = document.querySelectorAll('div[data-testid="videoComponent"], div[data-testid="tweetPhoto"], div[aria-label="Embedded video"], video');
  videoTweets.forEach(video => {
    const tweet = video.closest('article[role="article"]') ||
      video.closest('[data-testid="tweet"], [data-testid="tweetDetail"], [data-testid="tweetPhoto"]');
    if (tweet) {
      tweet.style.display = 'none';
      const cellInnerDiv = tweet.closest('[data-testid="cellInnerDiv"]');
      if (cellInnerDiv) {
        cellInnerDiv.style.display = 'none';
      }
    }
  });

  // Hide the "For You" tab which often contains videos
  const forYouTab = document.querySelector('a[href*="home"][role="tab"]');
  if (forYouTab && (forYouTab.textContent.includes('For you') || forYouTab.textContent.includes('Following'))) {
    const tabList = forYouTab.closest('[role="tablist"]');
    if (tabList) {
      tabList.style.display = 'none';
    }
  }

  // Hide the "What's happening" section which often contains video content
  const exploreBtn = document.querySelector('a[href*="explore"]');
  if (exploreBtn) {
    exploreBtn.style.display = 'none';
  }
  // Hide the "What's happening" section which often contains video content
  const whatsHappening = document.querySelector('[aria-label="Timeline: Trending now"], [aria-label*="What\'s happening"], [data-testid="sidebarColumn"]');
  if (whatsHappening) {
    whatsHappening.style.display = 'none';
  }
}

// Function to handle settings updates
function handleSettingsUpdate(settings) {
  if (settings.twitter) {
    hideTwitterVideos();
  }else{
    document.body.removeAttribute('hide-videos');
  }
}

// Initial run
chrome.storage.sync.get(['settings'], (result) => {
  const settings = result.settings || { twitter: true };
  if (settings.twitter) {
    hideTwitterVideos();
  }else{
    document.body.removeAttribute('hide-videos');
  }
});

// Listen for settings updates
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request?.action === 'settingsUpdated') {
    handleSettingsUpdate(request.settings);
  }
});


let settings = { twitter: true }; // default

// Load once
try {
  chrome.storage.sync.get(['settings'], (result) => {
    settings = result?.settings || { twitter: true };
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
  if (settings?.twitter) {
    try {
      hideTwitterVideos();
    } catch (err) {
      console.error("hideTwitterVideos failed:", err);
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