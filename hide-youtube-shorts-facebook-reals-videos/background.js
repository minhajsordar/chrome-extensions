// Default settings for any host (all enabled by default)
const defaultSettings = {
  youtubeShorts: true,
  youtubeVideo: true,
  facebookReels: true,
  facebookStories: true,
  facebookVideos: true,
  twitter: true,
  photos: true,
  videos: true,
};

// Initialize settings with defaults if they don't exist
chrome.runtime.onInstalled.addListener(() => {
  // Initialize hostSettings if not present
  chrome.storage.local.get(['hostSettings'], (result) => {
    if (!result.hostSettings) {
      chrome.storage.local.set({ hostSettings: {} });
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

// Initialize badge on startup (no specific host context, just show defaults)
updateBadge(defaultSettings);

// Helper: update badge using settings for a given host
function updateBadgeForHost(host) {
  if (!host) {
    updateBadge(defaultSettings);
    return;
  }
  chrome.storage.local.get(['hostSettings', 'settings'], (result) => {
    const hostSettings = result.hostSettings || {};
    const settingsForHost = hostSettings[host] || result.settings || defaultSettings;
    updateBadge(settingsForHost);
  });
}

// Helper: update badge for currently active tab in the focused window
function updateBadgeForActiveTab() {
  try {
    chrome.tabs.query({ active: true, lastFocusedWindow: true }, (tabs) => {
      const tab = tabs && tabs[0];
      if (!tab || !tab.url) {
        updateBadge(defaultSettings);
        return;
      }
      try {
        const host = new URL(tab.url).hostname;
        updateBadgeForHost(host);
      } catch (e) {
        updateBadge(defaultSettings);
      }
    });
  } catch (e) {
    // In case tabs API is not available for some reason
    updateBadge(defaultSettings);
  }
}

// When active tab changes
try {
  chrome.tabs.onActivated.addListener(() => {
    updateBadgeForActiveTab();
  });
} catch {}

// When a tab's URL changes or finishes loading
try {
  chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.url || changeInfo.status === 'complete') {
      if (tab && tab.active) {
        try {
          const host = tab.url ? new URL(tab.url).hostname : null;
          updateBadgeForHost(host);
        } catch (e) {
          updateBadge(defaultSettings);
        }
      }
    }
  });
} catch {}

// When window focus changes, re-evaluate active tab
try {
  chrome.windows.onFocusChanged.addListener(() => {
    updateBadgeForActiveTab();
  });
} catch {}

// Also re-evaluate on startup
try {
  chrome.runtime.onStartup.addListener(() => {
    updateBadgeForActiveTab();
  });
} catch {}

// Listen for settings changes
chrome.storage.onChanged.addListener((changes) => {
  if (changes.hostSettings) {
    // When the map changes, we cannot know current host here; keep badge as-is
    // Optionally, you could compute for the active tab.
  }
});

// Listen for messages from content scripts or popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // Handle getSettings request for a specific host
  if (request.action === 'getSettings') {
    const host = request.host;
    chrome.storage.local.get(['hostSettings', 'settings'], (result) => {
      // Back-compat: if old global 'settings' exists and hostSettings not set for host, use it
      const hostSettings = result.hostSettings || {};
      const settingsForHost = hostSettings[host] || result.settings || defaultSettings;
      sendResponse({ host, settings: settingsForHost });
      // Update badge to reflect these settings
      updateBadge(settingsForHost);
    });
    return true; // async
  }

  // Handle updateSettings request for a specific host
  if (request.action === 'updateSettings') {
    const respond = sendResponse;
    const host = request.host;
    const newSettings = request.settings || defaultSettings;

    chrome.storage.local.get(['hostSettings'], (result) => {
      const hostSettings = result.hostSettings || {};
      hostSettings[host] = newSettings;
      chrome.storage.local.set({ hostSettings }, () => {
        // Update badge using the saved settings
        updateBadge(newSettings);

        // Notify only tabs from this host
        chrome.tabs.query({}, (tabs) => {
          const promises = [];
          const targetTabs = tabs.filter(tab => {
            try {
              const url = new URL(tab.url || '');
              return url.hostname === host;
            } catch (e) {
              return false;
            }
          });

          targetTabs.forEach(tab => {
            const p = chrome.tabs.sendMessage(tab.id, {
              action: 'settingsUpdated',
              settings: newSettings
            }).catch(() => null);
            promises.push(p);
          });

          Promise.allSettled(promises).then(() => {
            respond({ success: true });
          });
        });
      });
    });

    return true; // async
  }
});
