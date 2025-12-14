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
      if(["youtube.com","www.youtube.com"].includes(currentHost)) {
        youtubeShortsToggle.checked = settings.youtubeShorts !== false; // default true
        youtubeVideoToggle.checked = settings.youtubeVideo !== false;
        youtubeShortsToggle.closest(".platform").classList.remove("hidden");
        youtubeVideoToggle.closest(".platform").classList.remove("hidden");
      }else{
        youtubeShortsToggle.closest(".platform").classList.add("hidden");
        youtubeVideoToggle.closest(".platform").classList.add("hidden");
      }
      if([ "facebook.com","www.facebook.com", "m.facebook.com","www.m.facebook.com"].includes(currentHost)) {
        facebookReelsToggle.checked = settings.facebookReels !== false;
        facebookStoriesToggle.checked = settings.facebookStories !== false;
        facebookVideosToggle.checked = settings.facebookVideos !== false;
        facebookReelsToggle.closest(".platform").classList.remove("hidden");
        facebookStoriesToggle.closest(".platform").classList.remove("hidden");
        facebookVideosToggle.closest(".platform").classList.remove("hidden");
      }else{
        facebookReelsToggle.closest(".platform").classList.add("hidden");
        facebookStoriesToggle.closest(".platform").classList.add("hidden");
        facebookVideosToggle.closest(".platform").classList.add("hidden");
      }
      if(["twitter.com","www.twitter.com","x.com","www.x.com"].includes(currentHost)) {
        twitterToggle.checked = settings.twitter !== false;
        twitterToggle.closest(".platform").classList.remove("hidden");
      }else{
        twitterToggle.closest(".platform").classList.add("hidden");
      }
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
  const otherSettings = {
    photos: photosToggle.checked,
    videos: videosToggle.checked,
    // Single toggle controls both
    disableAudio: disableAudioToggle.checked,
    disableAutoplay: disableAudioToggle.checked,
  };
  const settings = { ...otherSettings }
  if (["youtube.com", "www.youtube.com"].includes(currentHost)) {
    settings.youtubeShorts = youtubeShortsToggle.checked;
    settings.youtubeVideo = youtubeVideoToggle.checked;
  }
  if (["facebook.com", "www.facebook.com"].includes(currentHost)) {
    settings.facebookReels = facebookReelsToggle.checked;
    settings.facebookStories = facebookStoriesToggle.checked;
    settings.facebookVideos = facebookVideosToggle.checked;
  }
  if (["twitter.com", "www.twitter.com", "x.com", "www.x.com"].includes(currentHost)) {
    settings.twitter = twitterToggle.checked;
  }
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
