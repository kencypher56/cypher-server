/* picture_viewer.js - Gallery image viewer with navigation, zoom, pan */
'use strict';

const PictureViewer = (() => {
  let gallery = [];
  let currentIndex = 0;
  let zoom = 1;
  let rotation = 0;
  let isPanning = false;
  let panStart = { x: 0, y: 0 };
  let panOffset = { x: 0, y: 0 };
  let lastPanOffset = { x: 0, y: 0 };

  function open(filePath, fileName, imageList) {
    gallery = imageList || [{ path: filePath, name: fileName }];
    currentIndex = gallery.findIndex(i => i.path === filePath);
    if (currentIndex < 0) currentIndex = 0;

    document.getElementById('picture-modal').classList.remove('hidden');
    loadImage(currentIndex);
    renderThumbs();
  }

  function close() {
    document.getElementById('picture-modal').classList.add('hidden');
    resetTransform();
  }

  function loadImage(idx) {
    if (idx < 0 || idx >= gallery.length) return;
    currentIndex = idx;
    const item = gallery[idx];
    const img = document.getElementById('picture-img');
    const url = `/api/stream?path=${encodeURIComponent(item.path)}`;

    // Fade transition
    img.style.opacity = '0';
    img.style.transition = 'opacity 0.2s ease';

    img.onload = () => {
      img.style.opacity = '1';
    };
    img.src = url;

    document.getElementById('picture-title').textContent = item.name || item.path.split('/').pop();
    document.getElementById('pic-counter').textContent = `${idx + 1} / ${gallery.length}`;

    resetTransform();
    updateThumbs();

    document.getElementById('pic-download').onclick = () => {
      Download.download(item.path, item.name);
    };
  }

  function prev() {
    const idx = (currentIndex - 1 + gallery.length) % gallery.length;
    loadImage(idx);
  }

  function next() {
    const idx = (currentIndex + 1) % gallery.length;
    loadImage(idx);
  }

  function applyTransform() {
    const wrap = document.getElementById('picture-img-wrap');
    wrap.style.transform = `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom}) rotate(${rotation}deg)`;
  }

  function resetTransform() {
    zoom = 1; rotation = 0;
    panOffset = { x: 0, y: 0 };
    lastPanOffset = { x: 0, y: 0 };
    applyTransform();
  }

  function zoomIn() {
    zoom = Math.min(zoom * 1.3, 8);
    applyTransform();
  }

  function zoomOut() {
    zoom = Math.max(zoom / 1.3, 0.2);
    applyTransform();
  }

  function rotate() {
    rotation = (rotation + 90) % 360;
    applyTransform();
  }

  // ── THUMBNAILS ──
  function renderThumbs() {
    const container = document.getElementById('pic-thumbs');
    container.innerHTML = '';
    if (gallery.length <= 1) {
      container.style.display = 'none';
      return;
    }
    container.style.display = 'flex';
    gallery.forEach((item, i) => {
      const img = document.createElement('img');
      img.className = 'pic-thumb' + (i === currentIndex ? ' active' : '');
      img.src = `/api/stream?path=${encodeURIComponent(item.path)}`;
      img.alt = item.name;
      img.loading = 'lazy';
      img.addEventListener('click', () => loadImage(i));
      container.appendChild(img);
    });
  }

  function updateThumbs() {
    document.querySelectorAll('.pic-thumb').forEach((el, i) => {
      el.classList.toggle('active', i === currentIndex);
    });
    // Scroll active thumb into view
    const active = document.querySelector('.pic-thumb.active');
    active?.scrollIntoView({ block: 'nearest', inline: 'center' });
  }

  // ── INIT CONTROLS ──
  function initControls() {
    document.getElementById('pic-prev').addEventListener('click', prev);
    document.getElementById('pic-next').addEventListener('click', next);
    document.getElementById('pic-zoom-in').addEventListener('click', zoomIn);
    document.getElementById('pic-zoom-out').addEventListener('click', zoomOut);
    document.getElementById('pic-reset').addEventListener('click', resetTransform);
    document.getElementById('pic-rotate').addEventListener('click', rotate);
    document.getElementById('pic-close').addEventListener('click', close);

    document.getElementById('picture-modal').addEventListener('click', e => {
      if (e.target === document.getElementById('picture-modal')) close();
    });

    // Mouse wheel zoom
    document.getElementById('picture-viewer-area').addEventListener('wheel', e => {
      e.preventDefault();
      if (e.deltaY < 0) zoomIn();
      else zoomOut();
    }, { passive: false });

    // Pan (mouse)
    const wrap = document.getElementById('picture-img-wrap');
    wrap.addEventListener('mousedown', e => {
      if (zoom <= 1) return;
      isPanning = true;
      panStart = { x: e.clientX - panOffset.x, y: e.clientY - panOffset.y };
      wrap.style.cursor = 'grabbing';
    });
    document.addEventListener('mousemove', e => {
      if (!isPanning) return;
      panOffset = { x: e.clientX - panStart.x, y: e.clientY - panStart.y };
      applyTransform();
    });
    document.addEventListener('mouseup', () => {
      isPanning = false;
      wrap.style.cursor = zoom > 1 ? 'grab' : 'default';
    });

    // Touch swipe
    let touchStartX = 0;
    let touchStartY = 0;
    let pinchStartDist = 0;
    let pinchStartZoom = 1;

    document.getElementById('picture-viewer-area').addEventListener('touchstart', e => {
      if (e.touches.length === 2) {
        pinchStartDist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        pinchStartZoom = zoom;
      } else {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
      }
    }, { passive: true });

    document.getElementById('picture-viewer-area').addEventListener('touchend', e => {
      if (e.changedTouches.length === 1 && e.touches.length === 0) {
        const dx = e.changedTouches[0].clientX - touchStartX;
        const dy = e.changedTouches[0].clientY - touchStartY;
        if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 50) {
          if (dx < 0) next(); else prev();
        }
      }
    }, { passive: true });

    document.getElementById('picture-viewer-area').addEventListener('touchmove', e => {
      if (e.touches.length === 2) {
        e.preventDefault();
        const dist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        zoom = Math.max(0.2, Math.min(8, pinchStartZoom * (dist / pinchStartDist)));
        applyTransform();
      }
    }, { passive: false });

    // Double click to zoom
    wrap.addEventListener('dblclick', () => {
      if (zoom > 1) resetTransform();
      else { zoom = 2.5; applyTransform(); }
    });

    // Keyboard
    document.addEventListener('keydown', e => {
      if (document.getElementById('picture-modal').classList.contains('hidden')) return;
      switch (e.code) {
        case 'ArrowLeft': prev(); break;
        case 'ArrowRight': next(); break;
        case 'Equal': case 'NumpadAdd': zoomIn(); break;
        case 'Minus': case 'NumpadSubtract': zoomOut(); break;
        case 'Digit0': resetTransform(); break;
        case 'KeyR': rotate(); break;
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initControls);
  } else {
    initControls();
  }

  return { open, close };
})();