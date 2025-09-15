// Default extension settings
const defaultSettings = {
  youtubeShorts: false,
  youtubeVideo: false,
  facebookReels: false,
  facebookStories: false,
  facebookVideos: false,
  twitter: false,
  anyVideos: false
};

// Initialize settings with defaults if they don't exist
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.get(['settings'], (result) => {
    if (!result.settings) {
      chrome.storage.sync.set({ settings: defaultSettings });
    }
  });
});

// Listen for messages from content scripts or popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getSettings') {
    chrome.storage.sync.get(['settings'], (result) => {
      sendResponse({ settings: result.settings || defaultSettings });
    });
    return true; // Required for async sendResponse
  }

  if (request.action === 'updateSettings') {
    chrome.storage.sync.set({ settings: request.settings }, () => {
      // Notify all tabs to update
      chrome.tabs.query({}, (tabs) => {
        tabs.forEach(tab => {
          chrome.tabs.sendMessage(tab.id, {
            action: 'settingsUpdated',
            settings: request.settings
          });
        });
      });
      sendResponse({ success: true });
    });
    return true; // Required for async sendResponse
  }
});
