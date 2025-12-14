let whitelist = {};
let videoNotes = {};
let searchQuery = '';

// Load data
chrome.storage.sync.get(['whitelist', 'videoNotes'], (result) => {
  whitelist = result.whitelist || {};
  videoNotes = result.videoNotes || {};
  renderVideos();
});

// Search functionality
document.getElementById('searchBox').addEventListener('input', (e) => {
  searchQuery = e.target.value.toLowerCase();
  renderVideos();
});

// Clear all
document.getElementById('clearAll').addEventListener('click', () => {
  if (confirm('Are you sure you want to remove all whitelisted videos?')) {
    whitelist = {};
    videoNotes = {};
    chrome.storage.sync.set({ whitelist: {}, videoNotes: {} }, () => {
      renderVideos();
    });
  }
});

function renderVideos() {
  const grid = document.getElementById('videoGrid');
  const countInfo = document.getElementById('countInfo');
  
  let videoIds = Object.keys(whitelist);
  
  // Filter by search
  if (searchQuery) {
    videoIds = videoIds.filter(id => 
      whitelist[id].toLowerCase().includes(searchQuery)
    );
  }
  
  countInfo.textContent = `Total: ${videoIds.length} video${videoIds.length !== 1 ? 's' : ''}`;
  
  if (videoIds.length === 0) {
    grid.innerHTML = `
      <div class="empty-state" style="grid-column: 1/-1;">
        <h2>${searchQuery ? 'No videos found' : 'No whitelisted videos yet'}</h2>
        <p>${searchQuery ? 'Try a different search term' : 'Start adding videos in Unrestricted mode'}</p>
      </div>
    `;
    return;
  }
  
  grid.innerHTML = '';
  
  videoIds.forEach(videoId => {
    const card = document.createElement('div');
    card.className = 'video-card';
    
    const notesCount = videoNotes[videoId] ? videoNotes[videoId].length : 0;
    const notesPreview = notesCount > 0 
      ? `📝 ${notesCount} note${notesCount !== 1 ? 's' : ''}` 
      : 'No notes yet';
    
    card.innerHTML = `
      <div class="video-thumbnail" data-videoid="${videoId}">
        ▶️
      </div>
      <div class="video-info">
        <div class="video-title">${whitelist[videoId]}</div>
        <div class="video-id">ID: ${videoId}</div>
        <div class="notes-preview">${notesPreview}</div>
        <div class="video-actions">
          <button class="action-btn watch-btn" data-videoid="${videoId}">Watch Now</button>
          <button class="action-btn details-btn" data-videoid="${videoId}">Details & Notes</button>
          <button class="action-btn remove-btn" data-videoid="${videoId}">Remove</button>
        </div>
      </div>
    `;
    
    grid.appendChild(card);
  });
  
  // Add event listeners
  document.querySelectorAll('.watch-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const videoId = e.target.getAttribute('data-videoid');
      window.open(`https://www.youtube.com/watch?v=${videoId}`, '_blank');
    });
  });
  
  document.querySelectorAll('.video-thumbnail').forEach(thumb => {
    thumb.addEventListener('click', (e) => {
      const videoId = e.target.getAttribute('data-videoid');
      window.open(`https://www.youtube.com/watch?v=${videoId}`, '_blank');
    });
  });
  
  document.querySelectorAll('.details-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const videoId = e.target.getAttribute('data-videoid');
      openVideoDetails(videoId);
    });
  });
  
  document.querySelectorAll('.remove-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const videoId = e.target.getAttribute('data-videoid');
      if (confirm(`Remove "${whitelist[videoId]}" from whitelist?`)) {
        delete whitelist[videoId];
        chrome.storage.sync.set({ whitelist }, () => {
          renderVideos();
        });
      }
    });
  });
}

function openVideoDetails(videoId) {
  const url = chrome.runtime.getURL(`video-details.html?videoId=${videoId}`);
  window.open(url, '_blank', 'width=800,height=600');
}