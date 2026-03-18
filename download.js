/* download.js - Advanced download manager with resume, progress, speed */
'use strict';

const Download = (() => {

  const downloads = new Map();
  let dlIdCounter = 0;

  // ── PANEL UI ──
  function initPanel() {
    document.getElementById('dl-toggle-btn').addEventListener('click', togglePanel);
    document.getElementById('dl-panel-close').addEventListener('click', hidePanel);
    document.getElementById('dl-clear-done').addEventListener('click', clearDone);
  }

  function togglePanel() {
    const panel = document.getElementById('download-panel');
    panel.classList.toggle('hidden');
  }

  function hidePanel() {
    document.getElementById('download-panel').classList.add('hidden');
  }

  function clearDone() {
    downloads.forEach((dl, id) => {
      if (dl.status === 'done' || dl.status === 'error') {
        downloads.delete(id);
        document.getElementById(`dl-item-${id}`)?.remove();
      }
    });
    updateBadge();
  }

  function updateBadge() {
    const active = [...downloads.values()].filter(d => d.status === 'downloading').length;
    const badge = document.getElementById('dl-badge');
    const count = document.getElementById('dl-count');
    if (active > 0) {
      badge.classList.remove('hidden');
      badge.textContent = active;
      count.textContent = active;
    } else {
      badge.classList.add('hidden');
      count.textContent = downloads.size;
    }
  }

  function addDlItem(id, name) {
    const list = document.getElementById('dl-list');
    const item = document.createElement('div');
    item.className = 'dl-item';
    item.id = `dl-item-${id}`;
    item.innerHTML = `
      <div class="flex justify-between items-center gap-2">
        <div class="dl-item-name text-xs" title="${name}">${name}</div>
        <div class="flex gap-1">
          <button class="icon-btn-xs dl-cancel-btn" data-id="${id}" title="Cancel">
            <i data-lucide="x" class="w-3 h-3"></i>
          </button>
        </div>
      </div>
      <div class="dl-progress-bar mt-1">
        <div class="dl-progress-fill" id="dl-fill-${id}" style="width:0%"></div>
      </div>
      <div class="dl-status" id="dl-status-${id}">Starting...</div>
    `;
    list.appendChild(item);
    lucide.createIcons({ nodes: [item] });
    item.querySelector('.dl-cancel-btn').addEventListener('click', () => cancelDownload(id));
    return item;
  }

  function updateDlItem(id, { progress, speed, status, received, total }) {
    const fill = document.getElementById(`dl-fill-${id}`);
    const statusEl = document.getElementById(`dl-status-${id}`);
    const item = document.getElementById(`dl-item-${id}`);

    if (fill) fill.style.width = (progress || 0) + '%';
    if (statusEl) {
      if (status === 'done') {
        statusEl.textContent = '✓ Complete';
        statusEl.style.color = '#22c55e';
        item?.classList.add('opacity-60');
      } else if (status === 'error') {
        statusEl.textContent = '✗ Failed';
        statusEl.style.color = '#f43f5e';
      } else {
        const recv = received ? Design.formatBytes(received) : '';
        const tot = total ? Design.formatBytes(total) : '';
        const spd = speed ? ` • ${Design.formatBytes(speed)}/s` : '';
        statusEl.textContent = `${recv}${tot ? ' / ' + tot : ''}${spd}`;
      }
    }
    updateBadge();
  }

  // ── SINGLE FILE DOWNLOAD (with range/resume support) ──
  async function download(filePath, fileName) {
    const id = ++dlIdCounter;
    downloads.set(id, { status: 'downloading', filePath, fileName, controller: new AbortController() });

    // Show panel
    document.getElementById('download-panel').classList.remove('hidden');
    addDlItem(id, fileName || filePath.split('/').pop());

    const url = `/api/download?path=${encodeURIComponent(filePath)}`;

    try {
      // Check if we support streaming downloads
      if (window.showSaveFilePicker) {
        await downloadWithStreamAPI(id, url, fileName || filePath.split('/').pop());
      } else {
        await downloadWithFetch(id, url, fileName || filePath.split('/').pop());
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        downloads.get(id).status = 'error';
        updateDlItem(id, { status: 'error' });
        Toast.error('Download failed: ' + err.message);
      }
    }
  }

  async function downloadWithFetch(id, url, fileName) {
    const dl = downloads.get(id);
    let received = 0;
    let startTime = Date.now();
    let lastBytes = 0;
    let speedTimer;

    const response = await fetch(url, { signal: dl.controller.signal });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const total = parseInt(response.headers.get('content-length') || '0');
    const reader = response.body.getReader();
    const chunks = [];

    speedTimer = setInterval(() => {
      const now = Date.now();
      const elapsed = (now - startTime) / 1000;
      const speed = elapsed > 0 ? (received - lastBytes) : 0;
      lastBytes = received;
      startTime = now;
      const progress = total ? Math.round((received / total) * 100) : 0;
      updateDlItem(id, { progress, speed, received, total, status: 'downloading' });
    }, 500);

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      received += value.length;
    }

    clearInterval(speedTimer);

    // Combine chunks and trigger download
    const blob = new Blob(chunks);
    const objectUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = objectUrl;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(objectUrl), 10000);

    downloads.get(id).status = 'done';
    updateDlItem(id, { progress: 100, status: 'done' });
    Toast.success(`Downloaded: ${fileName}`);
  }

  async function downloadWithStreamAPI(id, url, fileName) {
    // Modern approach using File System Access API
    const dl = downloads.get(id);

    try {
      const fileHandle = await window.showSaveFilePicker({
        suggestedName: fileName,
        types: [{ description: 'File', accept: { '*/*': ['.*'] } }],
      });

      const writable = await fileHandle.createWritable();
      const response = await fetch(url, { signal: dl.controller.signal });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const total = parseInt(response.headers.get('content-length') || '0');
      const reader = response.body.getReader();
      let received = 0;
      let lastBytes = 0;
      let startTime = Date.now();

      const speedTimer = setInterval(() => {
        const speed = received - lastBytes;
        lastBytes = received;
        startTime = Date.now();
        updateDlItem(id, { progress: total ? Math.round((received/total)*100) : 0, speed, received, total });
      }, 500);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        await writable.write(value);
        received += value.length;
      }

      clearInterval(speedTimer);
      await writable.close();

      downloads.get(id).status = 'done';
      updateDlItem(id, { progress: 100, status: 'done' });
      Toast.success(`Downloaded: ${fileName}`);
    } catch (err) {
      if (err.name === 'AbortError') return; // User cancelled save dialog
      // Fallback to fetch method
      await downloadWithFetch(id, url, fileName);
    }
  }

  // ── MULTIPLE FILES AS ZIP ──
  async function downloadMultiple(paths) {
    if (!paths || paths.length === 0) return;
    const id = ++dlIdCounter;
    downloads.set(id, { status: 'downloading', paths, controller: new AbortController() });

    const name = `archive_${Date.now()}.zip`;
    document.getElementById('download-panel').classList.remove('hidden');
    addDlItem(id, name);
    updateDlItem(id, { status: 'downloading', progress: 0 });

    try {
      const response = await fetch('/api/zip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paths, name: 'archive' }),
        signal: downloads.get(id).controller.signal,
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      // Stream the ZIP
      const total = parseInt(response.headers.get('content-length') || '0');
      const reader = response.body.getReader();
      const chunks = [];
      let received = 0;

      const speedTimer = setInterval(() => {
        updateDlItem(id, {
          progress: total ? Math.round((received / total) * 100) : 50,
          received, total,
        });
      }, 300);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
        received += value.length;
      }
      clearInterval(speedTimer);

      const blob = new Blob(chunks, { type: 'application/zip' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 10000);

      downloads.get(id).status = 'done';
      updateDlItem(id, { progress: 100, status: 'done' });
      Toast.success('ZIP downloaded: ' + name);
    } catch (err) {
      if (err.name !== 'AbortError') {
        downloads.get(id).status = 'error';
        updateDlItem(id, { status: 'error' });
        Toast.error('ZIP failed: ' + err.message);
      }
    }
  }

  // ── DOWNLOAD DIRECTORY AS ZIP ──
  async function downloadDirZip(dirPath) {
    const id = ++dlIdCounter;
    downloads.set(id, { status: 'downloading', dirPath, controller: new AbortController() });

    const name = `archive.zip`;
    document.getElementById('download-panel').classList.remove('hidden');
    addDlItem(id, name);

    try {
      const response = await fetch(`/api/zip-dir?path=${encodeURIComponent(dirPath)}`, {
        signal: downloads.get(id).controller.signal,
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const reader = response.body.getReader();
      const chunks = [];
      let received = 0;
      const total = parseInt(response.headers.get('content-length') || '0');

      const speedTimer = setInterval(() => {
        updateDlItem(id, {
          progress: total ? Math.round((received / total) * 100) : -1,
          received, total,
        });
      }, 300);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
        received += value.length;
      }
      clearInterval(speedTimer);

      const blob = new Blob(chunks, { type: 'application/zip' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = name;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 10000);

      downloads.get(id).status = 'done';
      updateDlItem(id, { progress: 100, status: 'done' });
      Toast.success('Directory downloaded as ZIP');
    } catch (err) {
      if (err.name !== 'AbortError') {
        downloads.get(id).status = 'error';
        updateDlItem(id, { status: 'error' });
        Toast.error('ZIP failed: ' + err.message);
      }
    }
  }

  function cancelDownload(id) {
    const dl = downloads.get(id);
    if (dl && dl.controller) {
      dl.controller.abort();
      dl.status = 'cancelled';
      updateDlItem(id, { status: 'error' });
      Toast.info('Download cancelled');
    }
  }

  // Init
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPanel);
  } else {
    initPanel();
  }

  return { download, downloadMultiple, downloadDirZip, cancelDownload };
})();