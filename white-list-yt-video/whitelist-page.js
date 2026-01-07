let whitelist = {};
let videoNotes = {};
let categories = [];
let videoCategories = {};
let selectedCategory = 'all';
let searchQuery = '';

// Load data
chrome.storage.sync.get(['whitelist', 'videoNotes', 'categories', 'videoCategories'], (result) => {
  whitelist = result.whitelist || {};
  videoNotes = result.videoNotes || {};
  categories = Array.isArray(result.categories) ? result.categories : [];
  videoCategories = result.videoCategories || {};
  renderCategoryBar();
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
    videoCategories = {};
    chrome.storage.sync.set({ whitelist: {}, videoNotes: {}, videoCategories: {} }, () => {
      renderVideos();
      renderCategoryBar();
    });
  }
});

// Category bar interactions
document.getElementById('addCategoryBtn').addEventListener('click', () => {
  const input = document.getElementById('newCategoryName');
  const name = (input.value || '').trim();
  if (!name) return;
  if (categories.includes(name)) {
    alert('Category already exists');
    return;
  }
  categories.push(name);
  chrome.storage.sync.set({ categories }, () => {
    input.value = '';
    // auto-select the new category and refresh
    selectedCategory = name;
    renderCategoryBar();
    renderVideos();
  });
});

function renderCategoryBar() {
  const list = document.getElementById('categoryList');
  if (!list) return;

  // Update All/Uncategorized buttons
  const allBtn = document.getElementById('catAll');
  const uncatBtn = document.getElementById('catUncategorized');

  [allBtn, uncatBtn].forEach(btn => {
    if (!btn) return;
    const isActive = btn.dataset.category === selectedCategory;
    btn.style.background = isActive ? '#065fd4' : '#fff';
    btn.style.color = isActive ? '#fff' : '#333';
  });

  list.innerHTML = '';
  categories.forEach(cat => {
    const wrap = document.createElement('span');
    wrap.style.display = 'inline-flex';
    wrap.style.alignItems = 'center';
    wrap.style.gap = '4px';

    const btn = document.createElement('button');
    btn.className = 'cat-filter-btn';
    btn.textContent = cat;
    btn.dataset.category = cat;
    btn.style.padding = '8px 12px';
    btn.style.border = '1px solid #ddd';
    btn.style.background = (selectedCategory === cat) ? '#065fd4' : '#fff';
    btn.style.color = (selectedCategory === cat) ? '#fff' : '#333';
    btn.style.borderRadius = '18px';
    btn.style.cursor = 'pointer';
    btn.style.fontSize = '12px';
    btn.addEventListener('click', () => {
      selectedCategory = cat;
      renderCategoryBar();
      renderVideos();
    });

    const ren = document.createElement('button');
    ren.textContent = '✎';
    ren.title = `Rename category "${cat}"`;
    ren.style.padding = '4px 6px';
    ren.style.border = '1px solid #ddd';
    ren.style.background = '#fff';
    ren.style.color = '#666';
    ren.style.borderRadius = '50%';
    ren.style.cursor = 'pointer';
    ren.style.fontSize = '12px';
    ren.addEventListener('click', (e) => {
      e.stopPropagation();
      const newName = (prompt('Rename category to:', cat) || '').trim();
      if (!newName || newName === cat) return;
      if (categories.includes(newName)) {
        alert('A category with that name already exists.');
        return;
      }
      // update category list
      categories = categories.map(c => c === cat ? newName : c);
      // update assignments
      Object.keys(videoCategories).forEach(id => {
        if (videoCategories[id] === cat) {
          videoCategories[id] = newName;
        }
      });
      // update selection if needed
      if (selectedCategory === cat) selectedCategory = newName;
      chrome.storage.sync.set({ categories, videoCategories }, () => {
        renderCategoryBar();
        renderVideos();
      });
    });

    const del = document.createElement('button');
    del.textContent = '✕';
    del.title = `Delete category "${cat}"`;
    del.style.padding = '4px 6px';
    del.style.border = '1px solid #ddd';
    del.style.background = '#fff';
    del.style.color = '#666';
    del.style.borderRadius = '50%';
    del.style.cursor = 'pointer';
    del.style.fontSize = '12px';
    del.addEventListener('click', (e) => {
      e.stopPropagation();
      if (!confirm(`Delete category "${cat}"? Videos in this category will become Uncategorized.`)) return;
      // remove category and clear assignments
      categories = categories.filter(c => c !== cat);
      Object.keys(videoCategories).forEach(id => {
        if (videoCategories[id] === cat) {
          delete videoCategories[id];
        }
      });
      if (selectedCategory === cat) selectedCategory = 'all';
      chrome.storage.sync.set({ categories, videoCategories }, () => {
        renderCategoryBar();
        renderVideos();
      });
    });

    wrap.appendChild(btn);
    wrap.appendChild(ren);
    // wrap.appendChild(del);
    list.appendChild(wrap);
  });

  if (allBtn) {
    allBtn.onclick = () => {
      selectedCategory = 'all';
      renderCategoryBar();
      renderVideos();
    };
  }

  if (uncatBtn) {
    uncatBtn.onclick = () => {
      selectedCategory = 'uncategorized';
      renderCategoryBar();
      renderVideos();
    };
  }
}

function renderVideos() {
  const grid = document.getElementById('videoGrid');
  const countInfo = document.getElementById('countInfo');

  let videoIds = Object.keys(whitelist);

  // Filter by category
  if (selectedCategory === 'uncategorized') {
    videoIds = videoIds.filter(id => !videoCategories[id]);
  } else if (selectedCategory !== 'all') {
    videoIds = videoIds.filter(id => videoCategories[id] === selectedCategory);
  }

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
      <a href="https://www.youtube.com/watch?v=${videoId}" target="_blank" rel="noopener">
        <img class="video-thumbnail" data-videoid="${videoId}" src="https://i.ytimg.com/vi/${videoId}/hq720.jpg"/>
      </a>
      <div class="video-info">
        <a class="video-title"
          href="https://www.youtube.com/watch?v=${videoId}"
          target="_blank"
          rel="noopener"
        >${whitelist[videoId]}</a>
        <div class="notes-preview">${notesPreview}</div>
        <div style="display:flex; gap:8px; align-items:center; margin-bottom:8px;">
          <label style="font-size:12px; color:#666;">Category:</label>
          <select class="category-select" data-videoid="${videoId}" style="flex:1; padding:6px 8px; border:1px solid #ddd; border-radius:4px; font-size:12px;">
            <option value="">Uncategorized</option>
            ${categories.map(c => `<option value="${c}">${c}</option>`).join('')}
          </select>
        </div>
        <div class="video-actions">
          <button class="action-btn details-btn" data-videoid="${videoId}">Details & Notes</button>
          <button class="action-btn remove-btn" data-videoid="${videoId}">Remove</button>
        </div>
      </div>
    `;

    grid.appendChild(card);
  });

  // Add event listeners
  // document.querySelectorAll('.watch-btn').forEach(btn => {
  //   btn.addEventListener('click', (e) => {
  //     const videoId = e.target.getAttribute('data-videoid');
  //     window.open(`https://www.youtube.com/watch?v=${videoId}`, '_blank');
  //   });
  // });

  document.querySelectorAll('.video-thumbnail').forEach(thumb => {
    thumb.addEventListener('click', (e) => {
      const videoId = e.target.getAttribute('data-videoid');
      window.open(`https://www.youtube.com/watch?v=${videoId}`, '_blank');
    });
  });

  // Initialize category selects
  document.querySelectorAll('.category-select').forEach(sel => {
    const vid = sel.getAttribute('data-videoid');
    sel.value = videoCategories[vid] || '';
    sel.addEventListener('change', (e) => {
      const vId = e.target.getAttribute('data-videoid');
      const val = e.target.value;
      if (!val) {
        delete videoCategories[vId];
      } else {
        videoCategories[vId] = val;
      }
      chrome.storage.sync.set({ videoCategories }, () => {
        renderVideos();
      });
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
        if (videoCategories[videoId]) delete videoCategories[videoId];
        chrome.storage.sync.set({ whitelist, videoCategories }, () => {
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