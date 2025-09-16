// Get DOM elements
const youtubeShortsToggle = document.getElementById('youtube-shorts-toggle');
const youtubeVideoToggle = document.getElementById('youtube-video-toggle');
const facebookReelsToggle = document.getElementById('facebook-reels-toggle');
const facebookStoriesToggle = document.getElementById('facebook-stories-toggle');
const facebookVideosToggle = document.getElementById('facebook-videos-toggle');
const twitterToggle = document.getElementById('twitter-toggle');
const photosToggle = document.getElementById('photos-toggle');
const videosToggle = document.getElementById('videos-toggle');

// Load saved settings
function loadSettings() {
  chrome.storage.sync.get(['settings'], (result) => {
    const settings = result.settings || {
      youtubeShorts: false,
      youtubeVideo: false,
      facebookReels: false,
      facebookStories: false,
      facebookVideos: false,
      twitter: false,
      photos: false,
      videos: false,
    };
    
    // Update toggle states
    youtubeShortsToggle.checked = settings.youtubeShorts !== false; // Default to true if not set
    youtubeVideoToggle.checked = settings.youtubeVideo !== false;
    facebookReelsToggle.checked = settings.facebookReels !== false;
    facebookStoriesToggle.checked = settings.facebookStories !== false;
    facebookVideosToggle.checked = settings.facebookVideos !== false;
    twitterToggle.checked = settings.twitter !== false;
    photosToggle.checked = settings.photos !== false;
    videosToggle.checked = settings.videos !== false;
  });
}

// Save settings
function saveSettings() {
  const settings = {
    youtubeShorts: youtubeShortsToggle.checked,
    youtubeVideo: youtubeVideoToggle.checked,
    facebookReels: facebookReelsToggle.checked,
    facebookStories: facebookStoriesToggle.checked,
    facebookVideos: facebookVideosToggle.checked,
    twitter: twitterToggle.checked,
    photos: photosToggle.checked,
    videos: videosToggle.checked,
  };
  
  chrome.runtime.sendMessage({
    action: 'updateSettings',
    settings: settings
  }, (response) => {
    if (chrome.runtime.lastError) {
      console.error('Error saving settings:', chrome.runtime.lastError);
    } else if (response && response.success) {
      console.log('Settings saved successfully');
    }
  });
}

// Add event listeners
document.addEventListener('DOMContentLoaded', loadSettings);

youtubeShortsToggle.addEventListener('change', saveSettings);
youtubeVideoToggle.addEventListener('change', saveSettings);
facebookReelsToggle.addEventListener('change', saveSettings);
facebookStoriesToggle.addEventListener('change', saveSettings);
facebookVideosToggle.addEventListener('change', saveSettings);
twitterToggle.addEventListener('change', saveSettings);
photosToggle.addEventListener('change', saveSettings);
videosToggle.addEventListener('change', saveSettings);

// Request settings from background script
chrome.runtime.sendMessage({action: 'getSettings'}, (response) => {
  if (chrome.runtime.lastError) {
    console.error('Error getting settings:', chrome.runtime.lastError);
    return;
  }
  
  if (response && response.settings) {
    youtubeShortsToggle.checked = response.settings.youtubeShorts !== false;
    youtubeVideoToggle.checked = response.settings.youtubeVideo !== false;
    facebookReelsToggle.checked = response.settings.facebookReels !== false;
    facebookStoriesToggle.checked = response.settings.facebookStories !== false;
    facebookVideosToggle.checked = response.settings.facebookVideos !== false;
    twitterToggle.checked = response.settings.twitter !== false;
    photosToggle.checked = response.settings.photos !== false;
    videosToggle.checked = response.settings.videos !== false;
  }
});
