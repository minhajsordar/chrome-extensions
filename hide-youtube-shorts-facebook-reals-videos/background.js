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

// Helper to build per-host storage key
function hostKey(host) {
  return `hostSettings:${host}`;
}

// Migrate from monolithic 'hostSettings' object to per-host keys to avoid QUOTA_BYTES_PER_ITEM
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.get(['hostSettings'], (result) => {
    const map = result && result.hostSettings;
    if (map && typeof map === 'object') {
      const entries = Object.entries(map);
      if (entries.length > 0) {
        const toSet = {};
        for (const [host, settings] of entries) {
          toSet[hostKey(host)] = settings;
        }
        // Write all per-host items, then remove the big object
        chrome.storage.sync.set(toSet, () => {
          chrome.storage.sync.remove('hostSettings');
        });
      } else {
        // Nothing to migrate; remove empty container
        chrome.storage.sync.remove('hostSettings');
      }
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
  const key = hostKey(host);
  chrome.storage.sync.get([key, 'settings'], (result) => {
    // Back-compat: if old global 'settings' exists, prefer it if per-host missing
    const settingsForHost = result[key] || result.settings || defaultSettings;
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
    const key = hostKey(host);
    chrome.storage.sync.get([key, 'settings'], (result) => {
      // Back-compat: use old global 'settings' if present and per-host missing
      const settingsForHost = result[key] || result.settings || defaultSettings;
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

    const key = hostKey(host);
    chrome.storage.sync.set({ [key]: newSettings }, () => {
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

    return true; // async
  }
});
