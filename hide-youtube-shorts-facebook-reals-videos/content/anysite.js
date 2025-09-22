
// Function to handle settings updates (site-agnostic controllers)
function handleSettingsUpdate(settings={ photos: false, videos: false }) {
  commonSettingUpdate?.(settings);
}

// The central bootstrap (content/bootstrap.js) now handles:
// - fetching host-specific settings
// - listening for updates
// - re-applying on DOM mutations