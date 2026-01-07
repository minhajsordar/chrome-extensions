// Background service worker (MV3)
// Handles activation state, downloads, and tab capture

const STATE_KEY = 'asset_downloader_active';

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get([STATE_KEY], (res) => {
    if (typeof res[STATE_KEY] !== 'boolean') {
      chrome.storage.local.set({ [STATE_KEY]: false });
    }
  });
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  (async () => {
    try {
      if (msg?.type === 'GET_ACTIVE_STATE') {
        const { [STATE_KEY]: active } = await chrome.storage.local.get(STATE_KEY);
        sendResponse({ ok: true, active: !!active });
      }
      else if (msg?.type === 'SET_ACTIVE_STATE') {
        await chrome.storage.local.set({ [STATE_KEY]: !!msg.active });
        // Inform all tabs so content script can react
        const tabs = await chrome.tabs.query({});
        await Promise.all(
          tabs.map((tab) => tab.id && chrome.tabs.sendMessage(tab.id, { type: 'ACTIVE_STATE_CHANGED', active: !!msg.active }).catch(() => {}))
        );
        sendResponse({ ok: true });
      }
      else if (msg?.type === 'DOWNLOAD_BY_URL') {
        // Try to download directly by URL
        const { url, filename } = msg;
        const id = await chrome.downloads.download({ url, filename, saveAs: false, conflictAction: 'uniquify' });
        sendResponse({ ok: true, id });
      }
      else if (msg?.type === 'DOWNLOAD_DATA_URL') {
        const { dataUrl, filename } = msg;
        const id = await chrome.downloads.download({ url: dataUrl, filename, saveAs: false, conflictAction: 'uniquify' });
        sendResponse({ ok: true, id });
      }
      else if (msg?.type === 'CAPTURE_TAB') {
        // Capture the visible area of the current window's active tab
        const imageDataUrl = await chrome.tabs.captureVisibleTab(undefined, { format: 'png' });
        sendResponse({ ok: true, imageDataUrl });
      }
      else {
        sendResponse({ ok: false, error: 'UNKNOWN_MESSAGE' });
      }
    } catch (e) {
      sendResponse({ ok: false, error: e?.message || String(e) });
    }
  })();
  // Return true to indicate we will respond asynchronously
  return true;
});

