(function () {
  // Central bootstrap for per-site content scripts
  const host = location.hostname;

  // Sites should define this to apply settings
  const apply = (settings) => {
    try {
      if (typeof window.handleSettingsUpdate === 'function') {
        window.handleSettingsUpdate(settings);
      } else {
        // No site handler yet
        console.warn('handleSettingsUpdate not defined for this site.');
      }
    } catch (err) {
      console.error('handleSettingsUpdate failed:', err);
    }
  };

  // Cache
  let settingsCache = {};

  // Fetch settings once and apply
  function fetchAndApply() {
    try {
      chrome.runtime.sendMessage({ action: 'getSettings', host }, (response) => {
        if (chrome.runtime.lastError) {
          console.warn('getSettings error:', chrome.runtime.lastError);
        }
        settingsCache = (response && response.settings) || settingsCache || {};
        apply(settingsCache);
      });
    } catch (e) {
      console.warn('Failed to request settings:', e);
    }
  }

  // Listen for direct settings updates from background
  chrome.runtime.onMessage.addListener((request) => {
    if (request && request.action === 'settingsUpdated') {
      settingsCache = request.settings || settingsCache;
      apply(settingsCache);
    }
  });

  // Update cache when storage map changes for this host
  try {
    chrome.storage.onChanged.addListener((changes) => {
      if (changes.hostSettings) {
        const map = changes.hostSettings.newValue || {};
        if (map[host]) {
          settingsCache = map[host];
        }
      }
    });
  } catch (e) {
    console.warn('Extension context not available:', e);
  }

  // Decide whether to apply repeatedly on DOM mutations
  function shouldObserve(settings) {
    try {
      if (typeof window.shouldObserveSettings === 'function') {
        return !!window.shouldObserveSettings(settings);
      }
    } catch (e) {
      // ignore
    }
    // Default: re-apply on mutations only if any truthy key in settings
    return settings && Object.values(settings).some(Boolean);
  }

  // Mutation observer
  const observer = new MutationObserver(() => {
    if (shouldObserve(settingsCache)) {
      apply(settingsCache);
    }
  });

  function startObserver() {
    if (!document.body) return;
    observer.observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      fetchAndApply();
      startObserver();
    });
  } else {
    fetchAndApply();
    startObserver();
  }

  // Cleanup
  window.addEventListener('unload', () => {
    observer.disconnect();
  });
})();
