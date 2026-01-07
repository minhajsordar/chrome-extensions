// Content Script: discovers assets, shows hover download, responds to popup

const STATE_KEY = 'asset_downloader_active';
let isActive = false;
let hoverButton = null;
let currentHoverTarget = null;
let debounceTimer = null;
let actionPopup = null;
let actionTarget = null;
let suppressNextClick = false;
let contextMenuEnabled = true;
let assetIndex = [];
let rebuildScheduled = false;
let mutationObserver = null;

function dpr() { return window.devicePixelRatio || 1; }


function createHoverButton() {
  if (hoverButton) return hoverButton;
  const btn = document.createElement('button');
  btn.textContent = 'Download';
  btn.style.position = 'fixed';
  btn.style.zIndex = 2147483647;
  btn.style.padding = '6px 10px';
  btn.style.fontSize = '12px';
  btn.style.color = '#fff';
  btn.style.background = '#1f2937';
  btn.style.border = '1px solid #111827';
  btn.style.borderRadius = '6px';
  btn.style.boxShadow = '0 2px 8px rgba(0,0,0,.25)';
  btn.style.cursor = 'pointer';
  btn.style.display = 'none';
  btn.style.pointerEvents = 'auto';
  btn.addEventListener('click', onHoverDownloadClick, { capture: true });
  document.documentElement.appendChild(btn);
  hoverButton = btn;
  return btn;
}

function showHoverButtonFor(el, x, y) {
  const btn = createHoverButton();
  currentHoverTarget = el;
  btn.style.left = `${Math.max(8, x + 8)}px`;
  btn.style.top = `${Math.max(8, y + 8)}px`;
  btn.style.display = 'block';
}

function hideHoverButton() {
  if (hoverButton) hoverButton.style.display = 'none';
  currentHoverTarget = null;
}

function createActionPopup() {
  if (actionPopup) return actionPopup;
  const wrap = document.createElement('div');
  wrap.style.position = 'fixed';
  wrap.style.zIndex = 2147483647;
  wrap.style.padding = '8px';
  wrap.style.background = '#111827';
  wrap.style.color = '#fff';
  wrap.style.border = '1px solid #1f2937';
  wrap.style.borderRadius = '8px';
  wrap.style.boxShadow = '0 4px 12px rgba(0,0,0,.35)';
  wrap.style.display = 'none';
  wrap.style.gap = '8px';
  wrap.style.alignItems = 'center';
  wrap.style.pointerEvents = 'auto';
  wrap.style.userSelect = 'none';
  const row = document.createElement('div');
  row.style.display = 'flex';
  row.style.gap = '8px';
  const btnDownload = document.createElement('button');
  btnDownload.textContent = 'Download';
  btnDownload.style.padding = '6px 10px';
  btnDownload.style.fontSize = '12px';
  btnDownload.style.borderRadius = '6px';
  btnDownload.style.border = '1px solid #2563eb';
  btnDownload.style.background = '#3b82f6';
  btnDownload.style.color = '#fff';
  btnDownload.style.cursor = 'pointer';
  btnDownload.addEventListener('click', async (e) => {
    e.preventDefault(); e.stopPropagation();
    if (!actionTarget) return;
    const info = await getBestAssetForElement(actionTarget);
    if (info?.url) await downloadUrlOrData(info.url, info.filename || 'download');
    hideActionPopup();
  }, { capture: true });
  const btnShot = document.createElement('button');
  btnShot.textContent = 'Screenshot';
  btnShot.style.padding = '6px 10px';
  btnShot.style.fontSize = '12px';
  btnShot.style.borderRadius = '6px';
  btnShot.style.border = '1px solid #4b5563';
  btnShot.style.background = '#374151';
  btnShot.style.color = '#fff';
  btnShot.style.cursor = 'pointer';
  btnShot.addEventListener('click', async (e) => {
    e.preventDefault(); e.stopPropagation();
    if (!actionTarget) return;
    await screenshotElementAndDownload(actionTarget);
    hideActionPopup();
  }, { capture: true });
  row.appendChild(btnDownload);
  row.appendChild(btnShot);
  wrap.appendChild(row);
  document.documentElement.appendChild(wrap);
  actionPopup = wrap;
  return wrap;
}

function showActionPopupAt(x, y, el) {
  const pop = createActionPopup();
  actionTarget = el;
  const nx = Math.min(window.innerWidth - 8 - 200, Math.max(8, x + 8));
  const ny = Math.min(window.innerHeight - 8 - 48, Math.max(8, y + 8));
  pop.style.left = `${nx}px`;
  pop.style.top = `${ny}px`;
  pop.style.display = 'block';
}

function hideActionPopup() {
  if (actionPopup) actionPopup.style.display = 'none';
  actionTarget = null;
}

function getExtFromMime(mime) {
  if (!mime) return 'bin';
  const map = {
    'image/png': 'png',
    'image/jpeg': 'jpg',
    'image/webp': 'webp',
    'image/gif': 'gif',
    'image/svg+xml': 'svg',
    'video/mp4': 'mp4',
    'video/webm': 'webm'
  };
  return map[mime] || mime.split('/').pop() || 'bin';
}

function filenameFromUrl(url, fallback = 'download') {
  try {
    const u = new URL(url, location.href);
    const name = u.pathname.split('/').pop() || fallback;
    return name.split('?')[0] || fallback;
  } catch {
    return fallback;
  }
}

// Disable default context menu when active, and show our action popup on right-click
function onContextMenuCapture(e) {
  if (!isActive) return;
  // Always disable default context menu while active
  e.preventDefault();
  e.stopPropagation();
  // Ignore our UI
  if (hoverButton && (e.target === hoverButton || hoverButton.contains(e.target))) return;
  if (actionPopup && (e.target === actionPopup || actionPopup.contains(e.target))) return;
  const els = document.elementsFromPoint(e.clientX, e.clientY);
  const assetEl = els.find(el => ['IMG','VIDEO','CANVAS','SVG'].includes(el.tagName)) ||
                   els.find(el => !!extractBackgroundImageUrl(getComputedStyle(el)));
  if (!assetEl) { hideActionPopup(); return; }
  showActionPopupAt(e.clientX, e.clientY, assetEl);
}

// Fallbacks for environments not emitting pointer events consistently
function onMouseDownCapture(e) {
  // Synthesize a PointerEvent-like object
  return onPointerDown(e);
}

function onTouchStartCapture(e) {
  if (!isActive) return;
  const t = e.touches && e.touches[0];
  if (!t) return;
  // Create a lightweight object carrying clientX/clientY
  const pseudo = { ...e, clientX: t.clientX, clientY: t.clientY, target: e.target, preventDefault: () => e.preventDefault(), stopPropagation: () => e.stopPropagation(), stopImmediatePropagation: () => e.stopImmediatePropagation && e.stopImmediatePropagation() };
  return onPointerDown(pseudo);
}

async function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function isDataUrl(u) { return typeof u === 'string' && u.startsWith('data:'); }
function isBlobUrl(u) { return typeof u === 'string' && u.startsWith('blob:'); }

function mimeFromDataUrl(u) {
  if (!isDataUrl(u)) return null;
  // data:[<mediatype>][;base64],
  const m = /^data:([^;]+);/i.exec(u);
  return m ? m[1].toLowerCase() : null;
}

function extractBackgroundImageUrl(style) {
  const val = style.backgroundImage || style.background;
  if (!val) return null;
  const match = /url\((['"]?)(.*?)\1\)/i.exec(val);
  return match ? match[2] : null;
}

function collectAssets() {
  const assets = [];

  // images
  document.querySelectorAll('img').forEach(img => {
    if (img.currentSrc || img.src) {
      assets.push({
        type: 'image',
        url: img.currentSrc || img.src,
        filename: img.alt ? `${img.alt}.png` : filenameFromUrl(img.currentSrc || img.src, 'image'),
        width: img.naturalWidth || img.width || undefined,
        height: img.naturalHeight || img.height || undefined
      });
    }
    const srcset = img.getAttribute('srcset');
    if (srcset) {
      const first = srcset.split(',').map(s => s.trim().split(' ')[0]).filter(Boolean)[0];
      if (first) assets.push({ type: 'image', url: first, filename: filenameFromUrl(first, 'image') });
    }
  });

  // videos and sources
  document.querySelectorAll('video').forEach(v => {
    if (v.currentSrc || v.src) {
      assets.push({ type: 'video', url: v.currentSrc || v.src, filename: filenameFromUrl(v.currentSrc || v.src, 'video'), width: v.videoWidth || undefined, height: v.videoHeight || undefined });
    }
    v.querySelectorAll('source').forEach(s => {
      if (s.src) assets.push({ type: 'video', url: s.src, filename: filenameFromUrl(s.src, 'video'), width: v.videoWidth || undefined, height: v.videoHeight || undefined });
    });
  });

  // audio sources (optional)
  document.querySelectorAll('audio source').forEach(s => {
    if (s.src) assets.push({ type: 'audio', url: s.src, filename: filenameFromUrl(s.src, 'audio') });
  });

  // svg inline
  document.querySelectorAll('svg').forEach(svg => {
    try {
      const serializer = new XMLSerializer();
      const str = serializer.serializeToString(svg);
      const dataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(str)}`;
      const r = svg.getBoundingClientRect();
      assets.push({ type: 'svg', url: dataUrl, filename: 'vector.svg', inline: true, width: Math.round(r.width) || undefined, height: Math.round(r.height) || undefined });
    } catch {}
  });

  // canvas snapshot candidates
  document.querySelectorAll('canvas').forEach((c, idx) => {
    try {
      const dataUrl = c.toDataURL('image/png');
      if (isDataUrl(dataUrl)) {
        assets.push({ type: 'canvas', url: dataUrl, filename: `canvas-${idx + 1}.png`, inline: true, width: c.width || Math.round(c.getBoundingClientRect().width) || undefined, height: c.height || Math.round(c.getBoundingClientRect().height) || undefined });
      }
    } catch {}
  });

  // background-image urls
  document.querySelectorAll('*').forEach(el => {
    const style = getComputedStyle(el);
    const bg = extractBackgroundImageUrl(style);
    if (bg) {
      const r = el.getBoundingClientRect();
      assets.push({ type: 'image', url: bg, filename: filenameFromUrl(bg, 'background'), width: Math.round(r.width) || undefined, height: Math.round(r.height) || undefined });
    }
  });

  // de-duplicate by url
  const seen = new Set();
  const unique = [];
  for (const a of assets) {
    const key = a.type + '|' + a.url;
    if (!seen.has(key)) { seen.add(key); unique.push(a); }
  }
  return unique;
}

// Build/maintain a position index of assets on the page
function collectAssetElements() {
  const elements = new Set();
  document.querySelectorAll('img, video, canvas, svg').forEach(el => elements.add(el));
  document.querySelectorAll('*').forEach(el => {
    const bg = extractBackgroundImageUrl(getComputedStyle(el));
    if (bg) elements.add(el);
  });
  return Array.from(elements);
}

function rebuildAssetIndex() {
  rebuildScheduled = false;
  const els = collectAssetElements();
  const index = [];
  for (const el of els) {
    const rect = el.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) continue;
    index.push({ el, rect });
  }
  assetIndex = index;
}

function scheduleRebuild() {
  if (rebuildScheduled) return;
  rebuildScheduled = true;
  requestAnimationFrame(rebuildAssetIndex);
}

function startObservingMutations() {
  if (mutationObserver) return;
  try {
    mutationObserver = new MutationObserver(() => scheduleRebuild());
    mutationObserver.observe(document.documentElement, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ['src', 'srcset', 'style', 'class']
    });
  } catch {}
  window.addEventListener('resize', scheduleRebuild, { passive: true });
  window.addEventListener('scroll', scheduleRebuild, { passive: true, capture: true });
  scheduleRebuild();
}

function stopObservingMutations() {
  try { mutationObserver && mutationObserver.disconnect(); } catch {}
  mutationObserver = null;
  window.removeEventListener('resize', scheduleRebuild, { passive: true });
  window.removeEventListener('scroll', scheduleRebuild, { passive: true, capture: true });
  assetIndex = [];
}

function hitTestAssets(clientX, clientY) {
  // quick filter using bounding boxes
  const hits = [];
  for (const item of assetIndex) {
    const r = item.rect;
    if (clientX >= r.left && clientX <= r.right && clientY >= r.top && clientY <= r.bottom) {
      hits.push(item);
    }
  }
  if (hits.length === 0) return null;
  // Prefer the topmost DOM element at the point among hits
  const stack = document.elementsFromPoint(clientX, clientY);
  for (const topEl of stack) {
    const found = hits.find(h => h.el === topEl || topEl.contains(h.el) || h.el.contains(topEl));
    if (found) return found.el;
  }
  // fallback to smallest area
  hits.sort((a,b) => (a.rect.width*a.rect.height) - (b.rect.width*b.rect.height));
  return hits[0]?.el || null;
}

async function onHoverDownloadClick(ev) {
  ev.preventDefault();
  ev.stopPropagation();
  const target = currentHoverTarget;
  hideHoverButton();
  if (!target) return;

  // Determine the best asset for target
  let url = null;
  let filename = 'download';
  let kind = 'file';

  if (target.tagName === 'IMG') {
    url = target.currentSrc || target.src;
    filename = filenameFromUrl(url, target.alt || 'image');
  } else if (target.tagName === 'VIDEO') {
    url = target.currentSrc || target.src;
    filename = filenameFromUrl(url, 'video');
  } else if (target.tagName === 'CANVAS') {
    try {
      const dataUrl = target.toDataURL('image/png');
      url = dataUrl; kind = 'data'; filename = 'canvas.png';
    } catch {}
  } else if (target.tagName === 'SVG') {
    try {
      const serializer = new XMLSerializer();
      const str = serializer.serializeToString(target);
      url = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(str)}`;
      kind = 'data'; filename = 'vector.svg';
    } catch {}
  } else {
    const bg = extractBackgroundImageUrl(getComputedStyle(target));
    if (bg) { url = bg; filename = filenameFromUrl(bg, 'background'); }
  }

  // If still null and user wants a visual element snapshot, fallback to tab capture crop
  if (!url) {
    try {
      const rect = target.getBoundingClientRect();
      const { ok, imageDataUrl } = await chrome.runtime.sendMessage({ type: 'CAPTURE_TAB' });
      if (ok && imageDataUrl) {
        const img = new Image();
        img.src = imageDataUrl;
        await img.decode().catch(() => {});
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(rect.width * dpr()));
        canvas.height = Math.max(1, Math.round(rect.height * dpr()));
        const ctx = canvas.getContext('2d');
        const sx = Math.max(0, Math.round(rect.left * dpr()));
        const sy = Math.max(0, Math.round(rect.top * dpr()));
        ctx.drawImage(img, sx, sy, canvas.width, canvas.height, 0, 0, canvas.width, canvas.height);
        url = canvas.toDataURL('image/png');
        kind = 'data';
        filename = 'element.png';
      }
    } catch {}
  }

  if (!url) return;

  await downloadUrlOrData(url, filename);
}

async function downloadUrlOrData(url, filename) {
  try {
    if (isDataUrl(url)) {
      const mime = mimeFromDataUrl(url);
      const ext = getExtFromMime(mime || '');
      const outName = ext ? withExt(filename || 'download', ext) : (filename || 'download');
      await chrome.runtime.sendMessage({ type: 'DOWNLOAD_DATA_URL', dataUrl: url, filename: outName });
      return;
    }
    if (isBlobUrl(url)) {
      // Fetch within page, convert to data URL to preserve cross-origin restrictions
      const res = await fetch(url);
      const blob = await res.blob();
      const ext = getExtFromMime(blob.type);
      const dataUrl = await blobToDataUrl(blob);
      await chrome.runtime.sendMessage({ type: 'DOWNLOAD_DATA_URL', dataUrl, filename: withExt(filename, ext) });
      return;
    }
    // Standard URL
    await chrome.runtime.sendMessage({ type: 'DOWNLOAD_BY_URL', url, filename });
  } catch (e) {
    console.warn('Download failed:', e);
  }
}

function withExt(name, ext) {
  if (!ext) return name;
  if (name.toLowerCase().endsWith('.' + ext.toLowerCase())) return name;
  const dot = name.lastIndexOf('.');
  if (dot > 0 && dot > name.length - 6) return name.slice(0, dot) + '.' + ext;
  return name + '.' + ext;
}

function onMouseMove(e) {
  if (!isActive) return;
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    const el = document.elementFromPoint(e.clientX, e.clientY);
    if (!el) { hideHoverButton(); return; }
    const isAssety = ['IMG','VIDEO','CANVAS','SVG'].includes(el.tagName) || extractBackgroundImageUrl(getComputedStyle(el));
    if (isAssety) {
      showHoverButtonFor(el, e.clientX, e.clientY);
    } else {
      hideHoverButton();
    }
  }, 10);
}

// Click-to-detect improvement: handle pointerdown in capture phase to preempt site handlers
async function onPointerDown(e) {
  if (!isActive) return;
  // Ignore our own UI
  if (hoverButton && (e.target === hoverButton || hoverButton.contains(e.target))) return;
  if (actionPopup && (e.target === actionPopup || actionPopup.contains(e.target))) return;
  // If left click/touch, try auto-download via position index
  const isLeft = (e.button === 0) || (e.button === undefined); // touch/mouse
  if (isLeft) {
    const targetEl = hitTestAssets(e.clientX, e.clientY);
    if (targetEl) {
      try { e.stopImmediatePropagation && e.stopImmediatePropagation(); } catch {}
      e.stopPropagation();
      e.preventDefault();
      suppressNextClick = true;
      const info = await getBestAssetForElement(targetEl);
      if (info?.url) await downloadUrlOrData(info.url, info.filename || 'download');
      return; // done
    }
  }
  const els = document.elementsFromPoint(e.clientX, e.clientY);
  const assetEl = els.find(el => ['IMG','VIDEO','CANVAS','SVG'].includes(el.tagName)) ||
                   els.find(el => !!extractBackgroundImageUrl(getComputedStyle(el)));
  if (!assetEl) return;
  // Intercept ASAP so page handlers don't run
  try { e.stopImmediatePropagation && e.stopImmediatePropagation(); } catch {}
  e.stopPropagation();
  e.preventDefault();
  suppressNextClick = true;
  showActionPopupAt(e.clientX, e.clientY, assetEl);
}

function onClickCapture(e) {
  if (!isActive) return;
  if (suppressNextClick) {
    // Swallow the click following our pointerdown interception
    try { e.stopImmediatePropagation && e.stopImmediatePropagation(); } catch {}
    e.stopPropagation();
    e.preventDefault();
    suppressNextClick = false;
  }
}

async function getBestAssetForElement(target) {
  let url = null; let filename = 'download';
  if (!target) return null;
  if (target.tagName === 'IMG') {
    url = target.currentSrc || target.src;
    filename = filenameFromUrl(url, target.alt || 'image');
  } else if (target.tagName === 'VIDEO') {
    url = target.currentSrc || target.src;
    filename = filenameFromUrl(url, 'video');
  } else if (target.tagName === 'CANVAS') {
    try { url = target.toDataURL('image/png'); filename = 'canvas.png'; } catch {}
  } else if (target.tagName === 'SVG') {
    try {
      const serializer = new XMLSerializer();
      const str = serializer.serializeToString(target);
      url = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(str)}`;
      filename = 'vector.svg';
    } catch {}
  }
  if (!url) {
    const bg = extractBackgroundImageUrl(getComputedStyle(target));
    if (bg) { url = bg; filename = filenameFromUrl(bg, 'background'); }
  }
  return url ? { url, filename } : null;
}

async function screenshotElementAndDownload(target) {
  try {
    const rect = target.getBoundingClientRect();
    const { ok, imageDataUrl } = await chrome.runtime.sendMessage({ type: 'CAPTURE_TAB' });
    if (!ok || !imageDataUrl) return;
    const img = new Image();
    img.src = imageDataUrl;
    await img.decode().catch(() => {});
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(rect.width * dpr()));
    canvas.height = Math.max(1, Math.round(rect.height * dpr()));
    const ctx = canvas.getContext('2d');
    const sx = Math.max(0, Math.round(rect.left * dpr()));
    const sy = Math.max(0, Math.round(rect.top * dpr()));
    ctx.drawImage(img, sx, sy, canvas.width, canvas.height, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/png');
    await chrome.runtime.sendMessage({ type: 'DOWNLOAD_DATA_URL', dataUrl, filename: 'element.png' });
  } catch {}
}

async function getActiveState() {
  try {
    const res = await chrome.runtime.sendMessage({ type: 'GET_ACTIVE_STATE' });
    isActive = !!res?.active;
  } catch {}
}

function enableHover() {
  document.addEventListener('mousemove', onMouseMove, true);
}
function disableHover() {
  document.removeEventListener('mousemove', onMouseMove, true);
  hideHoverButton();
}

function setActive(active) {
  isActive = !!active;
  if (isActive) {
    enableHover();
    startObservingMutations();
    document.addEventListener('pointerdown', onPointerDown, true);
    document.addEventListener('mousedown', onMouseDownCapture, true);
    document.addEventListener('touchstart', onTouchStartCapture, { capture: true, passive: false });
    document.addEventListener('click', onClickCapture, true);
    document.addEventListener('contextmenu', onContextMenuCapture, true);
  } else {
    disableHover();
    stopObservingMutations();
    document.removeEventListener('pointerdown', onPointerDown, true);
    document.removeEventListener('mousedown', onMouseDownCapture, true);
    document.removeEventListener('touchstart', onTouchStartCapture, { capture: true });
    document.removeEventListener('click', onClickCapture, true);
    document.removeEventListener('contextmenu', onContextMenuCapture, true);
    hideActionPopup();
  }
}

// Listen for popup messages
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  (async () => {
    if (msg?.type === 'ACTIVE_STATE_CHANGED') {
      setActive(!!msg.active);
      sendResponse({ ok: true });
    } else if (msg?.type === 'COLLECT_ASSETS') {
      const assets = collectAssets();
      sendResponse({ ok: true, assets });
    } else if (msg?.type === 'DOWNLOAD_URL') {
      await downloadUrlOrData(msg.url, msg.filename || filenameFromUrl(msg.url, 'download'));
      sendResponse({ ok: true });
    } else {
      // ignore
    }
  })();
  return true;
});

// Initialize from stored state
getActiveState().then(() => setActive(isActive));
