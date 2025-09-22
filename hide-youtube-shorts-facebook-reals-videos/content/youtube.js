// Function to redirect to YouTube homepage if on Shorts page
function handleYouTubeShortsRedirect() {
  const shortsUrl = "https://www.youtube.com/shorts";
  if (window.location.href.startsWith(shortsUrl)) {
    window.location.href = 'https://www.youtube.com';
  }
}

function handleYouTubeRedirect() {
  const youtubeUrl = "https://www.youtube.com";
  if (window.location.href.startsWith(youtubeUrl)) {
    window.location.href = 'https://www.google.com';
  }
}

// Function to show YouTube Shorts elements
function showYouTubeShorts() {
  document.body.removeAttribute('hide-youtube-shorts');
}

// Function to hide YouTube Shorts
function hideYouTubeShorts() {
  document.body.setAttribute('hide-youtube-shorts', 'true');
  // Redirect if on Shorts page
  handleYouTubeShortsRedirect();
  
  // Hide Shorts in the sidebar
  const shortsLinks = document.querySelectorAll('a[href*="/shorts/"]');
  shortsLinks.forEach(link => {
    let parent = link.closest('ytd-rich-section-renderer, ytd-reel-shelf-renderer, ytd-reel-item-renderer, ytd-rich-shelf-renderer');
    if (parent) {
      parent.style.display = 'none';
    }
  });

  // Hide Shorts from the main content
  const shortsThumbnails = document.querySelectorAll('a[href*="/shorts/"] yt-img-shadow img');
  shortsThumbnails.forEach(img => {
    const videoContainer = img.closest('ytd-rich-item-renderer, ytd-grid-video-renderer');
    if (videoContainer) {
      videoContainer.style.display = 'none';
    }
  });

  // Hide Shorts from the navigation
  const navItems = document.querySelectorAll('ytd-guide-entry-renderer');
  navItems.forEach(item => {
    if (item.textContent.includes('Shorts')) {
      item.style.display = 'none';
    }
  });

  // Hide Shorts in the navigation
  const navShorts = document.querySelector('[aria-label="Shorts"]');
  if (navShorts) {
    navShorts.style.display = 'none';
  }
}
function hideYouTubeVideo() {
  // Hide main video player
  const mainVideo = document.querySelector('ytd-watch-flexy');
  if (mainVideo && window.location.pathname.startsWith('/watch')) {
    // Redirect to YouTube home if on a video page
    window.location.href = 'https://www.google.com';
    return;
  }

  // Hide video thumbnails in feed
  const videoThumbnails = [
    'ytd-video-renderer',
    'ytd-rich-item-renderer',
    'ytd-grid-video-renderer',
    'ytd-compact-video-renderer',
    'ytd-rich-grid-media',
    'ytd-video-preview',
    'ytd-item-section-renderer',
    'ytd-shelf-renderer',
    'ytd-expanded-shelf-contents-renderer',
    'ytd-reel-shelf-renderer'
  ];

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

  // Hide video thumbnails and containers
  videoThumbnails.forEach(selector => {
    document.querySelectorAll(selector).forEach(element => {
      element.style.display = 'none';
    });
  });

  // Hide video sections and recommendations
  const videoSections = [
    '#related',
    '#items',
    '#dismissible',
    '#contents',
    '#items',
    '#dismissible',
    '#contents',
    '#secondary',
    '#secondary-inner',
    '#related',
    '#items',
    '#dismissible',
    '#contents',
    '#secondary',
    '#secondary-inner',
    'ytd-watch-next-secondary-results-renderer',
    'ytd-item-section-renderer',
    'ytd-shelf-renderer',
    'ytd-expanded-shelf-contents-renderer',
    'ytd-reel-shelf-renderer'
  ];

  videoSections.forEach(selector => {
    document.querySelectorAll(selector).forEach(element => {
      element.style.display = 'none';
    });
  });
}

// Function to handle settings updates
function handleSettingsUpdate(settings={ youtubeShorts: false, youtubeVideo: false, photos: false, videos: false }) {
  commonSettingUpdate?.(settings);
  
  if (settings.youtubeShorts) {
    hideYouTubeShorts();
  } else {
    showYouTubeShorts();
  }
  
  if (settings.youtubeVideo) {
    handleYouTubeRedirect();
    hideYouTubeVideo();
  }
}

// The central bootstrap (content/bootstrap.js) now handles:
// - fetching host-specific settings
// - listening for updates
// - re-applying on DOM mutations