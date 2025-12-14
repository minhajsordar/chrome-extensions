// Get video ID from URL
const urlParams = new URLSearchParams(window.location.search);
const videoId = urlParams.get('videoId');

let whitelist = {};
let videoNotes = {};

if (!videoId) {
  document.body.innerHTML = '<div style="text-align:center;padding:50px;">Invalid video ID</div>';
} else {
  loadData();
}

function loadData() {
  chrome.storage.sync.get(['whitelist', 'videoNotes'], (result) => {
    whitelist = result.whitelist || {};
    videoNotes = result.videoNotes || {};
    
    if (!whitelist[videoId]) {
      document.body.innerHTML = '<div style="text-align:center;padding:50px;">Video not found in whitelist</div>';
      return;
    }
    
    renderPage();
  });
}

function renderPage() {
  document.getElementById('videoTitle').textContent = whitelist[videoId];
  document.getElementById('videoId').textContent = `Video ID: ${videoId}`;
  
  renderNotes();
  
  // Watch button
  document.getElementById('watchBtn').addEventListener('click', () => {
    window.open(`https://www.youtube.com/watch?v=${videoId}`, '_blank');
  });
  
  // Remove button
  document.getElementById('removeBtn').addEventListener('click', () => {
    if (confirm(`Remove "${whitelist[videoId]}" from whitelist?`)) {
      delete whitelist[videoId];
      if (videoNotes[videoId]) {
        delete videoNotes[videoId];
      }
      chrome.storage.sync.set({ whitelist, videoNotes }, () => {
        window.close();
      });
    }
  });
}

function renderNotes() {
  const notesList = document.getElementById('notesList');
  const notes = videoNotes[videoId] || [];
  
  if (notes.length === 0) {
    notesList.innerHTML = `
      <div class="empty-notes">
        No notes yet. Add notes while watching the video!
      </div>
    `;
    return;
  }
  
  notesList.innerHTML = '';
  
  notes.forEach((note, index) => {
    const noteDiv = document.createElement('div');
    noteDiv.className = 'note-item';
    
    noteDiv.innerHTML = `
      <div class="note-timestamp" data-timestamp="${note.timestamp}">
        ⏱️ ${formatTimestamp(note.timestamp)}
      </div>
      <div class="note-text">${escapeHtml(note.text)}</div>
      <button class="note-delete" data-index="${index}">Delete</button>
    `;
    
    notesList.appendChild(noteDiv);
  });
  
  // Add click handler for timestamps
  document.querySelectorAll('.note-timestamp').forEach(el => {
    el.addEventListener('click', () => {
      const timestamp = el.getAttribute('data-timestamp');
      window.open(`https://www.youtube.com/watch?v=${videoId}&t=${timestamp}s`, '_blank');
    });
  });
  
  // Add delete handlers
  document.querySelectorAll('.note-delete').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const index = parseInt(e.target.getAttribute('data-index'));
      deleteNote(index);
    });
  });
}

function deleteNote(index) {
  if (confirm('Delete this note?')) {
    videoNotes[videoId].splice(index, 1);
    if (videoNotes[videoId].length === 0) {
      delete videoNotes[videoId];
    }
    chrome.storage.sync.set({ videoNotes }, () => {
      renderNotes();
    });
  }
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

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}