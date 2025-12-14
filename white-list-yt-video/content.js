let mode = 'unrestricted';
let whitelist = {};
let videoNotes = {};
let currentVideoId = null;

// Load initial state
chrome.storage.sync.get(['mode', 'whitelist', 'videoNotes'], (result) => {
  mode = result.mode || 'unrestricted';
  whitelist = result.whitelist || {};
  videoNotes = result.videoNotes || {};
  init();
});

// Listen for mode changes
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'modeChanged') {
    mode = request.mode;
    init();
  }
});

function init() {
  if (mode === 'restricted') {
    handleRestrictedMode();
  } else {
    handleUnrestrictedMode();
  }
  currentVideoId = getCurrentVideoId();

  // Add whitelist button and note button on watch page
  if (window.location.pathname === '/watch' && currentVideoId) {
    waitForElementAndAddButtons(currentVideoId);
  }
}

function getCurrentVideoId() {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('v');
}

function handleRestrictedMode() {
  const videoId = getCurrentVideoId();

  // Check if on watch page
  if (window.location.pathname === '/watch' && videoId) {
    if (!whitelist[videoId]) {
      // Not whitelisted, redirect to home
      window.location.href = 'https://www.youtube.com';
      return;
    }
  }

  // Filter home page and search results
  filterNonWhitelistedVideos();

  // Observer for dynamic content
  const observer = new MutationObserver(() => {
    filterNonWhitelistedVideos();
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}

function handleUnrestrictedMode() {
  currentVideoId = getCurrentVideoId();

  // Add whitelist button and note button on watch page
  // if (window.location.pathname === '/watch' && currentVideoId) {
  //   waitForElementAndAddButtons(currentVideoId);
  // }

  // Add hover tooltips to video links
  addHoverTooltips();

  // Observer for URL changes
  let lastUrl = location.href;
  const observer = new MutationObserver(() => {
    const url = location.href;
    if (url !== lastUrl) {
      lastUrl = url;
      const newVideoId = getCurrentVideoId();
      if (window.location.pathname === '/watch' && newVideoId) {
        if (newVideoId !== currentVideoId) {
          currentVideoId = newVideoId;
          waitForElementAndAddButtons(currentVideoId);
        }
      }
    }
    addHoverTooltips();
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}

function waitForElementAndAddButtons(videoId) {
  // Remove any existing buttons first
  const existingContainer = document.getElementById('ytwhitelist-controls');
  if (existingContainer) existingContainer.remove();

  // Wait for the title element to be stable
  let attempts = 0;
  const maxAttempts = 20;

  const checkAndAdd = () => {
    const titleDiv = document.querySelector('#above-the-fold #title');
    const h1Element = titleDiv?.querySelector('h1.style-scope.ytd-watch-metadata');

    if (titleDiv && h1Element && !document.getElementById('ytwhitelist-controls')) {
      // Wait a bit more to ensure DOM is stable
      setTimeout(() => {
        addControlButtons(videoId, titleDiv);
      }, 500);
    } else if (attempts < maxAttempts) {
      attempts++;
      setTimeout(checkAndAdd, 200);
    }
  };

  checkAndAdd();
}

function addControlButtons(videoId, titleDiv) {
  // Remove existing buttons
  const existingContainer = document.getElementById('ytwhitelist-controls');
  if (existingContainer) existingContainer.remove();

  const isWhitelisted = whitelist[videoId];

  // Create container
  const container = document.createElement('div');
  container.id = 'ytwhitelist-controls';
  container.className = 'ytwhitelist-controls';

  // Whitelist button
  const whitelistBtn = document.createElement('button');
  whitelistBtn.className = 'ytwhitelist-btn';
  whitelistBtn.textContent = isWhitelisted ? '✓ Whitelisted' : 'Add to Whitelist';
  whitelistBtn.style.background = isWhitelisted ? '#44ff44' : '#065fd4';
  whitelistBtn.style.color = isWhitelisted ? 'black' : 'white';
  whitelistBtn.addEventListener('click', () => toggleWhitelist(videoId, "watch-page"));

  // Note button
  const noteBtn = document.createElement('button');
  noteBtn.className = 'ytwhitelist-btn';
  noteBtn.textContent = '📝 Add Note';
  noteBtn.style.background = '#ff9800';
  noteBtn.style.color = 'white';
  noteBtn.addEventListener('click', () => addNote(videoId));

  // Details button
  const detailsBtn = document.createElement('button');
  detailsBtn.className = 'ytwhitelist-btn';
  detailsBtn.textContent = '📋 Details';
  detailsBtn.style.background = '#9c27b0';
  detailsBtn.style.color = 'white';
  detailsBtn.addEventListener('click', () => openDetails(videoId));

  container.appendChild(whitelistBtn);
  container.appendChild(noteBtn);
  container.appendChild(detailsBtn);

  // Insert after the h1 element inside #title div
  const h1Element = titleDiv.querySelector('h1.style-scope.ytd-watch-metadata');
  if (h1Element) {
    h1Element.parentNode.insertBefore(container, h1Element.nextSibling);
  }
}

function addHoverTooltips() {
  const videoLinks = document.querySelectorAll('a[href*="/watch?v="]');

  videoLinks.forEach(link => {
    if (link.hasAttribute('data-ytwhitelist')) return;
    link.setAttribute('data-ytwhitelist', 'true');

    link.addEventListener('mouseenter', (e) => {
      const href = link.getAttribute('href');
      const match = href.match(/v=([^&]+)/);
      if (match) {
        const videoId = match[1];
        showTooltip(e, videoId, link);
      }
    });
  });
}

function showTooltip(e, videoId, linkElement) {
  // Remove existing tooltip
  const existingTooltip = document.querySelector('.ytwhitelist-tooltip');
  if (existingTooltip) existingTooltip.remove();

  const isWhitelisted = whitelist[videoId];

  const tooltip = document.createElement('div');
  tooltip.className = 'ytwhitelist-tooltip';
  tooltip.innerHTML = `
    <button class="ytwhitelist-tooltip-btn" data-videoid="${videoId}">
      ${isWhitelisted ? '✓ Whitelisted' : 'Add to Whitelist'}
    </button>
  `;

  document.body.appendChild(tooltip);

  const rect = linkElement.getBoundingClientRect();
  tooltip.style.top = `${rect.top + window.scrollY - 40}px`;
  tooltip.style.left = `${rect.left + window.scrollX}px`;

  const btn = tooltip.querySelector('.ytwhitelist-tooltip-btn');
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWhitelist(videoId, "list");
    tooltip.remove();
  });

  linkElement.addEventListener('mouseleave', () => {
    setTimeout(() => {
      if (!tooltip.matches(':hover')) {
        tooltip.remove();
      }
    }, 200);
  });

  tooltip.addEventListener('mouseleave', () => {
    tooltip.remove();
  });
}

function toggleWhitelist(videoId, type) {
  let title
  if (type === "watch-page") {
    const titleElement = document.querySelector('h1.ytd-watch-metadata yt-formatted-string') ||
      document.querySelector('h1.title');
    title = titleElement ? titleElement.textContent.trim() : 'Unknown Title';
  }

  if (type === "list") {
    const allATags = document.querySelectorAll("a#video-title");

    for (const element of allATags) {
      if (!element.href) continue;

      let url;
      try {
        url = new URL(element.href, location.origin);
      } catch {
        continue;
      }

      if (url.pathname === "/watch" && url.searchParams.get("v") === videoId) {
        title = element.textContent.trim();
        break;
      }
    }
  }
  console.log(videoId,title);

  if (whitelist[videoId]) {
    delete whitelist[videoId];
  } else {
    whitelist[videoId] = title;
  }

  chrome.storage.sync.set({ whitelist }, () => {
    // Refresh buttons with the titleDiv
    const titleDiv = document.querySelector('#above-the-fold #title');
    if (titleDiv) {
      addControlButtons(videoId, titleDiv);
    }
  });
}

function addNote(videoId) {
  const video = document.querySelector('video');
  const currentTime = video ? Math.floor(video.currentTime) : 0;

  const noteText = prompt(`Add a note at ${formatTimestamp(currentTime)}:`);

  if (noteText && noteText.trim()) {
    if (!videoNotes[videoId]) {
      videoNotes[videoId] = [];
    }

    videoNotes[videoId].push({
      timestamp: currentTime,
      text: noteText.trim(),
      createdAt: Date.now()
    });

    chrome.storage.sync.set({ videoNotes }, () => {
      alert('Note added successfully!');
    });
  }
}

function openDetails(videoId) {
  const url = chrome.runtime.getURL(`video-details.html?videoId=${videoId}`);
  window.open(url, '_blank', 'width=800,height=600');
}

function filterNonWhitelistedVideos() {
  // Check if we're on the home page
  const isHomePage = window.location.pathname === '/' || window.location.pathname === '/feed/explore';

  if (isHomePage) {
    replaceHomePageWithWhitelist();
    hideNonWhitelistedVideos();
  } else {
    // For other pages (search, subscriptions, etc.), just hide non-whitelisted videos
  }
  hideNonWhitelistedVideos();
}

function hideNonWhitelistedVideos() {
  const videoLinks = document.querySelectorAll('a[href*="/watch?v="]');
  const whitelistedIds = Object.keys(whitelist);


  videoLinks.forEach(link => {
    const href = link.getAttribute('href');
    const match = href.match(/v=([^&]+)/);

    if (match) {
      const videoId = match[1];
      const videoContainer = link.closest('ytd-video-renderer') ||
        link.closest('yt-lockup-view-model') ||
        link.closest('ytd-grid-video-renderer') ||
        link.closest('ytd-compact-video-renderer') ||
        link.closest('ytd-watch-next-secondary-results-renderer') ||
        link.closest('.ytp-fullscreen-grid-main-content') ||
        link.closest('ytd-rich-item-renderer');

      if (videoContainer) {
        if (!whitelistedIds.includes(videoId)) {
          videoContainer.style.display = 'none';
        } else {
          videoContainer.style.display = '';
        }
      }
    }
  });
}

function replaceHomePageWithWhitelist() {
  const richGridRenderer = document.querySelector('ytd-rich-grid-renderer');

  if (!richGridRenderer || richGridRenderer.hasAttribute('data-whitelist-replaced')) {
    return;
  }

  richGridRenderer.setAttribute('data-whitelist-replaced', 'true');

  // Find the content container
  const contents = richGridRenderer.querySelector('#contents');

  if (!contents) return;

  // Clear existing content
  contents.innerHTML = '';

  const whitelistedIds = Object.keys(whitelist);

  if (whitelistedIds.length === 0) {
    // Show empty state
    const emptyState = document.createElement('div');
    emptyState.className = 'ytwhitelist-empty-state';
    emptyState.innerHTML = `
      <div style="text-align: center; padding: 60px 20px; color: #666;">
        <h2 style="font-size: 24px; margin-bottom: 10px;">No Whitelisted Videos</h2>
        <p style="font-size: 16px; margin-bottom: 20px;">Switch to Unrestricted mode to add videos to your whitelist</p>
        <p style="font-size: 14px; color: #999;">Click the extension icon to change mode</p>
      </div>
    `;
    contents.appendChild(emptyState);
    return;
  }

  // Create video cards for each whitelisted video
  whitelistedIds.forEach(videoId => {
    const videoTitle = whitelist[videoId];
    const richItemRenderer = createWhitelistVideoCard(videoId, videoTitle);
    contents.appendChild(richItemRenderer);
  });
}

function createWhitelistVideoCard(videoId, videoTitle) {
  const richItem = document.createElement('ytd-rich-item-renderer');
  richItem.className = 'style-scope ytd-rich-grid-renderer';
  richItem.setAttribute('items-per-row', '2');
  richItem.setAttribute('lockup', 'true');

  const notesCount = videoNotes[videoId] ? videoNotes[videoId].length : 0;
  const noteBadge = notesCount > 0 ? `<div style="position: absolute; top: 8px; right: 8px; background: rgba(0,0,0,0.8); color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold;">📝 ${notesCount}</div>` : '';

  richItem.innerHTML = `
    <div id="content" class="style-scope ytd-rich-item-renderer">
      <div class="ytwhitelist-video-card" style="position: relative;">
        ${noteBadge}
        <a href="/watch?v=${videoId}" class="ytwhitelist-video-link" style="text-decoration: none; color: inherit; display: block;">
          <div class="ytwhitelist-thumbnail" style="position: relative; width: 100%; padding-bottom: 56.25%; background: #000; border-radius: 12px; overflow: hidden; margin-bottom: 12px;">
            <img src="https://i.ytimg.com/vi/${videoId}/hq720.jpg" 
                 style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"
                 onerror="this.style.display='none'; this.parentElement.innerHTML='<div style=&quot;position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); font-size: 48px; color: white;&quot;>▶️</div>'">
          </div>
          <div style="padding: 0 4px;">
            <h3 style="font-size: 14px; font-weight: 500; line-height: 1.4; margin: 0 0 4px 0; max-height: 2.8em; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; color: var(--yt-spec-text-primary);">
              ${escapeHtml(videoTitle)}
            </h3>
            <div style="font-size: 12px; color: var(--yt-spec-text-secondary); margin-top: 4px;">
              <span>✓ Whitelisted</span>
            </div>
          </div>
        </a>
        <div class="ytwhitelist-card-actions" style="padding: 8px 4px; display: flex; gap: 6px; margin-top: 8px;">
          <button class="ytwhitelist-mini-btn ytwhitelist-details-btn" data-videoid="${videoId}" 
                  style="flex: 1; padding: 6px 8px; background: #065fd4; color: white; border: none; border-radius: 18px; cursor: pointer; font-size: 12px; font-weight: 500;">
            📋 Details
          </button>
          <button class="ytwhitelist-mini-btn ytwhitelist-remove-btn" data-videoid="${videoId}"
                  style="flex: 1; padding: 6px 8px; background: #ff4444; color: white; border: none; border-radius: 18px; cursor: pointer; font-size: 12px; font-weight: 500;">
            🗑️ Remove
          </button>
        </div>
      </div>
    </div>
  `;

  // Add event listeners after element is created
  setTimeout(() => {
    const detailsBtn = richItem.querySelector('.ytwhitelist-details-btn');
    const removeBtn = richItem.querySelector('.ytwhitelist-remove-btn');

    if (detailsBtn) {
      detailsBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        openDetails(videoId);
      });
    }

    if (removeBtn) {
      removeBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (confirm(`Remove "${videoTitle}" from whitelist?`)) {
          delete whitelist[videoId];
          chrome.storage.sync.set({ whitelist }, () => {
            richItem.remove();
            // If no more videos, show empty state
            const contents = document.querySelector('ytd-rich-grid-renderer #contents');
            if (contents && contents.children.length === 0) {
              const richGridRenderer = document.querySelector('ytd-rich-grid-renderer');
              richGridRenderer.removeAttribute('data-whitelist-replaced');
              replaceHomePageWithWhitelist();
            }
          });
        }
      });
    }
  }, 100);

  return richItem;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function formatTimestamp(seconds) {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}