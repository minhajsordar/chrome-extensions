// Popup logic: activation toggle, list assets, trigger downloads

const activateToggle = document.getElementById('activateToggle');
const refreshBtn = document.getElementById('refreshBtn');
const assetList = document.getElementById('assetList');
const downloadAllBtn = document.getElementById('downloadAllBtn');
const statusEl = document.getElementById('status');

function setStatus(text) {
  statusEl.textContent = text;
}

async function getActiveState() {
  try {
    const res = await chrome.runtime.sendMessage({ type: 'GET_ACTIVE_STATE' });
    return !!res?.active;
  } catch {
    return false;
  }
}

async function setActiveState(active) {
  try {
    await chrome.runtime.sendMessage({ type: 'SET_ACTIVE_STATE', active: !!active });
  } catch (e) {
    console.warn('Failed to set active:', e);
  }
}

async function getActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

function makeThumb(item) {
  // Try to render an image thumbnail if possible
  if (item.type === 'image' || item.type === 'svg' || item.type === 'canvas') {
    const img = document.createElement('img');
    img.className = 'thumb';
    img.src = item.url;
    img.alt = item.filename || 'thumb';
    return img;
  }
  const div = document.createElement('div');
  div.className = 'thumb';
  div.textContent = (item.type || 'file').toUpperCase();
  return div;
}

function renderAssets(assets) {
  assetList.innerHTML = '';
  if (!assets || assets.length === 0) {
    const li = document.createElement('li');
    li.className = 'empty';
    li.textContent = 'No assets detected on this page.';
    assetList.appendChild(li);
    return;
  }
  for (const item of assets) {
    const li = document.createElement('li');
    li.className = 'item';

    const thumb = makeThumb(item);

    const meta = document.createElement('div');
    meta.className = 'meta';
    const type = document.createElement('div');
    const dims = (item.width && item.height) ? ` (${item.width}×${item.height})` : '';
    type.innerHTML = `<span class="type">${(item.type || 'file').toUpperCase()}${dims}</span>`;
    const name = document.createElement('div');
    name.textContent = item.filename || item.url || 'download';
    meta.appendChild(type);
    meta.appendChild(name);

    const btn = document.createElement('button');
    btn.className = 'download';
    btn.textContent = 'Download';
    btn.addEventListener('click', async () => {
      const tab = await getActiveTab();
      if (!tab?.id) return;
      setStatus('Downloading...');
      try {
        await chrome.tabs.sendMessage(tab.id, { type: 'DOWNLOAD_URL', url: item.url, filename: item.filename });
        setStatus('Downloaded (check your downloads)');
        setTimeout(() => setStatus('Ready'), 1500);
      } catch (e) {
        console.warn('Download failed:', e);
        setStatus('Download failed');
      }
    });

    li.appendChild(thumb);
    li.appendChild(meta);
    li.appendChild(btn);
    assetList.appendChild(li);
  }
}

async function refreshAssets() {
  setStatus('Scanning page...');
  try {
    const tab = await getActiveTab();
    if (!tab?.id) {
      setStatus('No active tab');
      return;
    }
    const res = await chrome.tabs.sendMessage(tab.id, { type: 'COLLECT_ASSETS' });
    if (res?.ok) {
      renderAssets(res.assets || []);
      setStatus(`Found ${res.assets?.length || 0} assets`);
    } else {
      setStatus('Unable to read assets on this page');
    }
  } catch (e) {
    console.warn('Collect assets failed:', e);
    setStatus('This page may not allow scripts');
  }
}

async function init() {
  const active = await getActiveState();
  activateToggle.checked = !!active;
  activateToggle.addEventListener('change', async (e) => {
    await setActiveState(e.target.checked);
  });
  refreshBtn.addEventListener('click', refreshAssets);
  downloadAllBtn.addEventListener('click', async () => {
    setStatus('Preparing downloads...');
    try {
      const tab = await getActiveTab();
      if (!tab?.id) { setStatus('No active tab'); return; }
      const res = await chrome.tabs.sendMessage(tab.id, { type: 'COLLECT_ASSETS' });
      const assets = (res?.ok && Array.isArray(res.assets)) ? res.assets : [];
      if (assets.length === 0) { setStatus('No assets to download'); return; }
      let done = 0;
      for (const item of assets) {
        try {
          await chrome.tabs.sendMessage(tab.id, { type: 'DOWNLOAD_URL', url: item.url, filename: item.filename });
        } catch {}
        done += 1;
        setStatus(`Downloading ${done}/${assets.length}...`);
      }
      setStatus(`Requested ${assets.length} downloads`);
      setTimeout(() => setStatus('Ready'), 1500);
    } catch (e) {
      console.warn('Download all failed:', e);
      setStatus('Download all failed');
    }
  });
}

init();

