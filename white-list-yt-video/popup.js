let currentMode = 'unrestricted';
let whitelist = {};

// Load initial state
chrome.storage.sync.get(['mode', 'whitelist'], (result) => {
  currentMode = result.mode || 'unrestricted';
  whitelist = result.whitelist || {};
  updateUI();
});

// Toggle mode
document.getElementById('modeToggle').addEventListener('click', () => {
  currentMode = currentMode === 'restricted' ? 'unrestricted' : 'restricted';
  chrome.storage.sync.set({ mode: currentMode }, () => {
    updateUI();
    // Notify content script
    chrome.tabs.query({ url: '*://*.youtube.com/*' }, (tabs) => {
      tabs.forEach(tab => {
        chrome.tabs.sendMessage(tab.id, { action: 'modeChanged', mode: currentMode });
      });
    });
  });
});

// Open whitelist management page
document.getElementById('manageWhitelist').addEventListener('click', () => {
  chrome.tabs.create({ url: chrome.runtime.getURL('whitelist.html') });
});

// Update UI
function updateUI() {
  const modeBtn = document.getElementById('modeToggle');
  const count = document.getElementById('videoCount');
  
  // Update mode button
  if (currentMode === 'restricted') {
    modeBtn.textContent = 'RESTRICTED';
    modeBtn.className = 'toggle-btn restricted';
  } else {
    modeBtn.textContent = 'UNRESTRICTED';
    modeBtn.className = 'toggle-btn unrestricted';
  }
  
  // Update count
  const videoIds = Object.keys(whitelist);
  count.textContent = `Whitelisted Videos: ${videoIds.length}`;
}