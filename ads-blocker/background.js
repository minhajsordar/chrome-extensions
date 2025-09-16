// List of ad server domains to block
const adServers = [
  '*.doubleclick.net',
  '*.googlesyndication.com',
  '*.googleadservices.com',
  '*.googletagservices.com',
  '*.g.doubleclick.net',
  '*.adnxs.com',
  '*.adsrvr.org',
  '*.advertising.com',
  '*.amazon-adsystem.com',
  '*.facebook.com/ads',
  '*.facebook.com/tr/',
  '*.fbcdn.net',
  '*.youtube.com/api/stats/ads',
  '*.youtube.com/ptracking',
  '*.youtube.com/pagead',
  '*.youtube.com/get_midroll_',
  '*.youtube.com/get_video_info*adformat=',
  '*.youtube.com/youtubei/v1/player*'
];

// Convert wildcard patterns to regex
function createRegexPattern(pattern) {
  const escaped = pattern
    .replace(/[.+?^${}()|[\]\\]/g, '\\$&')
    .replace(/\*\*/g, '.*')
    .replace(/\*/g, '[^\\/]*');
  return new RegExp('^' + escaped + '$');
}

// Track blocked ads count per tab
const tabAdCounts = {};

// Initialize badge for a tab
function initBadge(tabId) {
  if (tabAdCounts[tabId] === undefined) {
    tabAdCounts[tabId] = 0;
    updateBadge(tabId);
  }
}

// Update the badge for a specific tab
function updateBadge(tabId) {
  const count = tabAdCounts[tabId] || 0;
  const text = count > 0 ? count.toString() : '';
  
  try {
    chrome.action.setBadgeText({
      tabId: tabId,
      text: text
    });
    
    chrome.action.setBadgeBackgroundColor({
      tabId: tabId,
      color: '#1a73e8'
    });
  } catch (e) {
    console.error('Error updating badge:', e);
  }
}

// Convert ad servers to declarativeNetRequest rules
function createRules() {
  const rules = [];
  let ruleId = 1;
  
  // Add a rule for each ad server pattern
  adServers.forEach(adServer => {
    try {
      // Convert wildcard pattern to regex
      const regex = createRegexPattern(adServer);
      
      rules.push({
        id: ruleId++,
        priority: 1,
        action: { 
          type: 'block'
        },
        condition: {
          regexFilter: regex.source,
          resourceTypes: ['main_frame', 'sub_frame', 'script', 'image', 'stylesheet', 'font', 'media', 'websocket']
        }
      });
    } catch (e) {
      console.error('Error creating rule for:', adServer, e);
    }
  });
  
  return rules;
}

// Initialize the extension
function initializeExtension() {
  // Initialize rules
  const rules = createRules();
  
  // Update dynamic rules
  chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: rules.map(rule => rule.id),
    addRules: rules
  }).then(() => {
    console.log('Ad blocking rules updated successfully');
  }).catch(error => {
    console.error('Error updating rules:', error);
  });
  
  // Set up tab tracking
  chrome.tabs.onActivated.addListener(activeInfo => {
    initBadge(activeInfo.tabId);
  });
  
  // Clean up when tab is closed
  chrome.tabs.onRemoved.addListener(tabId => {
    delete tabAdCounts[tabId];
  });
  
  // Track page navigation to reset counters
  chrome.webNavigation.onCommitted.addListener((details) => {
    if (details.frameId === 0) { // Only process main frame
      tabAdCounts[details.tabId] = 0;
      updateBadge(details.tabId);
    }
  });
  
  console.log('Ad Blocker extension initialized');
}

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'adBlocked' && sender.tab) {
    const tabId = sender.tab.id;
    
    // Initialize counter if it doesn't exist
    if (tabAdCounts[tabId] === undefined) {
      tabAdCounts[tabId] = 0;
    }
    
    // Increment counter
    tabAdCounts[tabId]++;
    
    // Update badge
    updateBadge(tabId);
    
    // Send response with updated count
    sendResponse({ count: tabAdCounts[tabId] });
    return true; // Keep the message channel open for the response
  }
});

// Initialize the extension when installed or updated
chrome.runtime.onInstalled.addListener(initializeExtension);

// Also initialize when the service worker starts
initializeExtension();

// Initialize badge for the active tab when extension is loaded
chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
  if (tabs[0]) {
    initBadge(tabs[0].id);
  }
});

// Listen for messages from content scripts and popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'blockElement') {
    blockElement(request.selector);
  } else if (request.action === 'getAdCount') {
    const tabId = request.tabId || sender.tab?.id;
    if (tabId) {
      const count = tabAdCounts[tabId] || 0;
      sendResponse({ count });
      return true; // Required for async response
    }
  }
  return false;
});

// Initialize badge for the active tab when extension is loaded
chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
  if (tabs[0]) {
    initBadge(tabs[0].id);
  }
});

// Block elements on the page
function blockElement(selector) {
  chrome.scripting.executeScript({
    target: { tabId: tabId },
    function: (selector) => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(el => {
        el.style.display = 'none';
        el.remove();
      });
    },
    args: [selector]
  });
}
