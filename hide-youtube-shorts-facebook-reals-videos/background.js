// Default extension settings
const defaultSettings = {
  youtubeShorts: false,
  youtubeVideo: false,
  facebookReels: false,
  facebookStories: false,
  facebookVideos: false,
  twitter: false,
  photos: false,
  videos: false,
};

// Initialize settings with defaults if they don't exist
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.get(['settings'], (result) => {
    if (!result.settings) {
      chrome.storage.sync.set({ settings: defaultSettings });
    }
  });
});

// Function to update the badge with the count of enabled features
function updateBadge(settings) {
  if (!settings) return;
  
  const enabledCount = Object.values(settings).filter(Boolean).length;
  
  chrome.action.setBadgeText({
    text: enabledCount > 0 ? enabledCount.toString() : ''
  });
  
  chrome.action.setBadgeBackgroundColor({ color: '#4CAF50' });
}

// Initialize badge on startup
chrome.storage.sync.get(['settings'], (result) => {
  updateBadge(result.settings);
});

// Listen for settings changes
chrome.storage.onChanged.addListener((changes) => {
  if (changes.settings) {
    updateBadge(changes.settings.newValue);
  }
});

// Listen for messages from content scripts or popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // Handle getSettings request
  if (request.action === 'getSettings') {
    chrome.storage.sync.get(['settings'], (result) => {
      sendResponse({ settings: result.settings || defaultSettings });
    });
    return true; // Required for async sendResponse
  }

  // Handle updateSettings request
  if (request.action === 'updateSettings') {
    // Store a reference to sendResponse
    const respond = sendResponse;
    
    chrome.storage.sync.set({ settings: request.settings }, () => {
      // Only notify tabs that match our content script patterns
      const contentScriptPatterns = [
        '*://*.youtube.com/*',
        '*://*.facebook.com/*',
        '*://*.twitter.com/*',
        '*://*.x.com/*',
        '*://*/*',
      ];
      
      // Get all tabs and filter them
      chrome.tabs.query({}, (tabs) => {
        const promises = [];
        const filteredTabs = tabs.filter(tab => 
          tab.url && contentScriptPatterns.some(pattern => 
            new RegExp('^' + pattern.replace(/\*/g, '.*') + '$').test(tab.url)
          )
        );

        // Send messages to all matching tabs
        filteredTabs.forEach(tab => {
          const promise = chrome.tabs.sendMessage(tab.id, {
            action: 'settingsUpdated',
            settings: request.settings
          }).catch(error => {
            // Ignore errors from tabs that don't have our content script
            if (!error.message.includes('Receiving end does not exist')) {
              console.error('Error sending message to tab:', error);
            }
          });
          promises.push(promise);
        });

        // Wait for all messages to complete before responding
        Promise.allSettled(promises).then(() => {
          respond({ success: true });
        });
      });
    });
    
    return true; // Required for async sendResponse
  }
});
