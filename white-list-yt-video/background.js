// Initialize default settings
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.get(['mode', 'whitelist'], (result) => {
    if (!result.mode) {
      chrome.storage.sync.set({ mode: 'unrestricted' });
    }
    if (!result.whitelist) {
      chrome.storage.sync.set({ whitelist: {} });
    }
  });
});

// Listen for tab updates to inject content script on YouTube pages
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url && tab.url.includes('youtube.com')) {
    chrome.storage.sync.get(['mode'], (result) => {
      chrome.tabs.sendMessage(tabId, { 
        action: 'modeChanged', 
        mode: result.mode || 'unrestricted' 
      }).catch(() => {
        // Ignore errors if content script not ready
      });
    });
  }
});