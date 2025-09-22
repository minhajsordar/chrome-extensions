// Get DOM elements
const youtubeShortsToggle = document.getElementById('youtube-shorts-toggle');
const youtubeVideoToggle = document.getElementById('youtube-video-toggle');
const facebookReelsToggle = document.getElementById('facebook-reels-toggle');
const facebookStoriesToggle = document.getElementById('facebook-stories-toggle');
const facebookVideosToggle = document.getElementById('facebook-videos-toggle');
const twitterToggle = document.getElementById('twitter-toggle');
const photosToggle = document.getElementById('photos-toggle');
const videosToggle = document.getElementById('videos-toggle');
const disableAudioToggle = document.getElementById('disable-audio-toggle');

let currentHost = null;

// Load saved settings for the active tab's host
function loadSettings() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const activeTab = tabs && tabs[0];
    if (!activeTab || !activeTab.url) return;
    try {
      currentHost = new URL(activeTab.url).hostname;
    } catch (e) {
      return;
    }

    chrome.runtime.sendMessage({ action: 'getSettings', host: currentHost }, (response) => {
      if (chrome.runtime.lastError) {
        console.error('Error getting settings:', chrome.runtime.lastError);
        return;
      }
      const settings = (response && response.settings) || {
        youtubeShorts: true,
        youtubeVideo: false,
        facebookReels: true,
        facebookStories: true,
        facebookVideos: true,
        twitter: true,
        photos: true,
        videos: true,
        disableAudio: true,
        disableAutoplay: true,
      };

      youtubeShortsToggle.checked = settings.youtubeShorts !== false; // default true
      youtubeVideoToggle.checked = settings.youtubeVideo !== false;
      facebookReelsToggle.checked = settings.facebookReels !== false;
      facebookStoriesToggle.checked = settings.facebookStories !== false;
      facebookVideosToggle.checked = settings.facebookVideos !== false;
      twitterToggle.checked = settings.twitter !== false;
      photosToggle.checked = settings.photos !== false;
      videosToggle.checked = settings.videos !== false;
      // Single toggle controls both: consider enabled if either is true
      disableAudioToggle.checked = !!(settings.disableAudio || settings.disableAutoplay);
    });
  });
}

// Save settings
function saveSettings() {
  if (!currentHost) return;
  const settings = {
    youtubeShorts: youtubeShortsToggle.checked,
    youtubeVideo: youtubeVideoToggle.checked,
    facebookReels: facebookReelsToggle.checked,
    facebookStories: facebookStoriesToggle.checked,
    facebookVideos: facebookVideosToggle.checked,
    twitter: twitterToggle.checked,
    photos: photosToggle.checked,
    videos: videosToggle.checked,
    // Single toggle controls both
    disableAudio: disableAudioToggle.checked,
    disableAutoplay: disableAudioToggle.checked,
  };

  chrome.runtime.sendMessage({
    action: 'updateSettings',
    host: currentHost,
    settings
  }, (response) => {
    if (chrome.runtime.lastError) {
      console.error('Error saving settings:', chrome.runtime.lastError);
    } else if (response && response.success) {
      // console.log('Settings saved successfully');
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
disableAudioToggle.addEventListener('change', saveSettings);

// Also trigger an initial load when popup opens
document.addEventListener('DOMContentLoaded', loadSettings);
