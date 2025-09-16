document.addEventListener('DOMContentLoaded', () => {
  // Get DOM elements
  const blockTrackers = document.getElementById('blockTrackers');
  const blockSocialWidgets = document.getElementById('blockSocialWidgets');
  const blockYoutubeAds = document.getElementById('blockYoutubeAds');
  const blockFacebookAds = document.getElementById('blockFacebookAds');
  const customFilters = document.getElementById('customFilters');
  const saveBtn = document.getElementById('saveBtn');
  const statusMessage = document.getElementById('statusMessage');

  // Load saved settings
  chrome.storage.sync.get(
    {
      blockTrackers: true,
      blockSocialWidgets: true,
      blockYoutubeAds: true,
      blockFacebookAds: true,
      customFilters: ''
    },
    (items) => {
      blockTrackers.checked = items.blockTrackers;
      blockSocialWidgets.checked = items.blockSocialWidgets;
      blockYoutubeAds.checked = items.blockYoutubeAds;
      blockFacebookAds.checked = items.blockFacebookAds;
      customFilters.value = items.customFilters || '';
    }
  );

  // Save settings
  saveBtn.addEventListener('click', () => {
    const settings = {
      blockTrackers: blockTrackers.checked,
      blockSocialWidgets: blockSocialWidgets.checked,
      blockYoutubeAds: blockYoutubeAds.checked,
      blockFacebookAds: blockFacebookAds.checked,
      customFilters: customFilters.value
    };

    chrome.storage.sync.set(settings, () => {
      // Show success message
      statusMessage.textContent = 'Settings saved successfully!';
      statusMessage.className = 'status success';
      statusMessage.style.display = 'block';
      
      // Hide message after 3 seconds
      setTimeout(() => {
        statusMessage.style.display = 'none';
      }, 3000);
      
      // Notify content scripts about the changes
      chrome.tabs.query({}, (tabs) => {
        tabs.forEach(tab => {
          chrome.tabs.sendMessage(tab.id, { 
            action: 'settingsUpdated',
            settings: settings
          }).catch(() => {});
        });
      });
    });
  });

  // Reset to default settings
  document.getElementById('resetBtn')?.addEventListener('click', () => {
    if (confirm('Are you sure you want to reset all settings to default?')) {
      chrome.storage.sync.set({
        blockTrackers: true,
        blockSocialWidgets: true,
        blockYoutubeAds: true,
        blockFacebookAds: true,
        customFilters: ''
      }, () => {
        // Reload the page to show default values
        window.location.reload();
      });
    }
  });
});
