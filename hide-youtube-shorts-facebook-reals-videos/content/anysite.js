
// Function to handle settings updates
function handleSettingsUpdate(settings={ photos: false, videos: false }) {
  commonSettingUpdate?.(settings);
}

// Initial run
chrome.storage.sync.get(['settings'], (result) => {
  handleSettingsUpdate(result.settings);
});

// Listen for settings updates
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'settingsUpdated') {
    handleSettingsUpdate(request.settings);
  }
  return true;
});

// Use MutationObserver to handle dynamic content

let settings = { photos: true, videos: true }; // default

// Load once
try {
  chrome.storage.sync.get(['settings'], (result) => {
    settings = result?.settings || { photos: true, videos: true };
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
  if (settings?.photos || settings?.videos) {
    try {
      handleSettingsUpdate(settings);
    } catch (err) {
      console.error("handleSettingsUpdate failed:", err);
    }
  }
});

// Start observing the document with the configured parameters
if (document.body) {
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}

// Clean up when navigating away
if (window.addEventListener && typeof window.addEventListener === 'function' && typeof window.addEventListener.unload === 'function') {
  window.addEventListener("unload", () => {
    observer.disconnect();
  });
}