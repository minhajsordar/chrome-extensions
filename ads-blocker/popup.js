// Get DOM elements
const statusElement = document.getElementById('status');
const toggleBtn = document.getElementById('toggleBtn');
const optionsBtn = document.getElementById('optionsBtn');
const adsBlockedElement = document.getElementById('adsBlocked');

// Get current tab's blocked ads count
function updateCurrentTabCount() {
  chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
    if (tabs[0]) {
      chrome.tabs.sendMessage(
        tabs[0].id, 
        {action: 'getAdCount'}
      ).then(response => {
        if (response && response.count !== undefined) {
          adsBlockedElement.textContent = response.count.toLocaleString();
        }
      }).catch(error => {
        console.error('Error getting ad count:', error);
      });
    }
  });
}

// Load the current state from storage and update UI
chrome.storage.sync.get(['adBlockerEnabled', 'adsBlocked']).then((data) => {
  const isEnabled = data.adBlockerEnabled !== false; // Default to true
  updateUI(isEnabled);
  
  // Set the ads blocked count
  if (data.adsBlocked) {
    adsBlockedElement.textContent = data.adsBlocked.toLocaleString();
  }
});

// Toggle ad blocker
function toggleAdBlocker() {
  chrome.storage.sync.get(['adBlockerEnabled'], (data) => {
    const newState = !(data.adBlockerEnabled !== false); // Toggle the state
    
    // Save the new state
    chrome.storage.sync.set({ adBlockerEnabled: newState }, () => {
      updateUI(newState);
      
      // Send message to all tabs to update the ad blocking state
      chrome.tabs.query({}, (tabs) => {
        tabs.forEach(tab => {
          chrome.tabs.sendMessage(tab.id, { 
            action: 'toggleAdBlocker', 
            enabled: newState 
          }).catch(() => {});
        });
      });
      
      // Reload the current active tab to apply changes
      chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
        if (tabs[0]) {
          chrome.tabs.reload(tabs[0].id);
        }
      });
    });
  });
}

// Update the UI based on the current state
function updateUI(isEnabled) {
  if (isEnabled) {
    statusElement.textContent = 'Ad Blocker: Active';
    statusElement.className = 'status enabled';
    toggleBtn.textContent = 'Disable Ad Blocker';
  } else {
    statusElement.textContent = 'Ad Blocker: Inactive';
    statusElement.className = 'status disabled';
    toggleBtn.textContent = 'Enable Ad Blocker';
  }
}

// Event listeners
toggleBtn.addEventListener('click', toggleAdBlocker);

optionsBtn.addEventListener('click', () => {
  chrome.runtime.openOptionsPage();
});

// Listen for updates to the ads blocked count
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (changes.adsBlocked) {
    adsBlockedElement.textContent = changes.adsBlocked.newValue.toLocaleString();
  }
});
