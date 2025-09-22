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
  commonSettingUpdate?.(settings);
  if (settings.twitter) {
    hideTwitterVideos();
  }else{
    document.body.removeAttribute('hide-videos');
  }
}

// The central bootstrap (content/bootstrap.js) now handles:
// - fetching host-specific settings
// - listening for updates
// - re-applying on DOM mutations