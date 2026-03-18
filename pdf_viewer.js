/* pdf_viewer.js - PDF viewer using PDF.js with zoom, pagination, print */
'use strict';

const PDFViewer = (() => {
  let pdfDoc = null;
  let currentPage = 1;
  let totalPages = 0;
  let scale = 1.5;
  let currentPath = '';
  let renderTask = null;

  // Configure PDF.js worker
  if (typeof pdfjsLib !== 'undefined') {
    pdfjsLib.GlobalWorkerOptions.workerSrc =
      'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  }

  function open(filePath, fileName) {
    currentPath = filePath;
    document.getElementById('pdf-title').textContent = fileName || filePath.split('/').pop();
    document.getElementById('pdf-modal').classList.remove('hidden');
    document.getElementById('pdf-loading').classList.remove('hidden');
    document.getElementById('pdf-container').innerHTML = '';

    const url = `/api/stream?path=${encodeURIComponent(filePath)}`;
    loadPDF(url);

    document.getElementById('pdf-download').onclick = () => {
      Download.download(filePath, fileName);
    };
  }

  async function loadPDF(url) {
    try {
      const loadingTask = pdfjsLib.getDocument({ url, enableXfa: true });
      pdfDoc = await loadingTask.promise;
      totalPages = pdfDoc.numPages;

      document.getElementById('pdf-total-pages').textContent = totalPages;
      document.getElementById('pdf-page-input').max = totalPages;
      document.getElementById('pdf-loading').classList.add('hidden');

      currentPage = 1;
      await renderAllPages();
    } catch (err) {
      document.getElementById('pdf-loading').classList.add('hidden');
      document.getElementById('pdf-container').innerHTML = `
        <div class="text-center text-red-400 p-8 font-mono">
          <p>Failed to load PDF</p>
          <p class="text-sm mt-2 text-muted">${err.message}</p>
        </div>
      `;
      Toast.error('PDF load error: ' + err.message);
    }
  }

  async function renderAllPages() {
    const container = document.getElementById('pdf-container');
    container.innerHTML = '';

    for (let i = 1; i <= totalPages; i++) {
      const wrapper = document.createElement('div');
      wrapper.id = `pdf-page-wrapper-${i}`;
      wrapper.className = 'pdf-page-wrapper';
      wrapper.style.cssText = 'position:relative;margin-bottom:12px;';

      const canvas = document.createElement('canvas');
      canvas.id = `pdf-canvas-${i}`;
      wrapper.appendChild(canvas);

      // Text layer for copy support
      const textLayer = document.createElement('div');
      textLayer.className = 'pdf-text-layer';
      textLayer.id = `pdf-text-${i}`;
      wrapper.appendChild(textLayer);

      container.appendChild(wrapper);
    }

    // Render pages with IntersectionObserver for lazy loading
    const observer = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          const pageNum = parseInt(e.target.id.split('-').pop());
          renderPage(pageNum);
          observer.unobserve(e.target);
        }
      });
    }, { threshold: 0.1 });

    container.querySelectorAll('.pdf-page-wrapper').forEach(w => observer.observe(w));

    // Always render first page
    await renderPage(1);
  }

  async function renderPage(num) {
    if (!pdfDoc) return;
    try {
      const page = await pdfDoc.getPage(num);
      const viewport = page.getViewport({ scale });

      const canvas = document.getElementById(`pdf-canvas-${num}`);
      if (!canvas) return;

      canvas.width = viewport.width;
      canvas.height = viewport.height;
      canvas.style.width = viewport.width + 'px';
      canvas.style.height = viewport.height + 'px';

      const ctx = canvas.getContext('2d');

      const renderContext = {
        canvasContext: ctx,
        viewport,
        enableWebGL: false,
      };

      await page.render(renderContext).promise;

      // Render text layer for copy support
      const textContent = await page.getTextContent();
      const textLayerDiv = document.getElementById(`pdf-text-${num}`);
      if (textLayerDiv) {
        textLayerDiv.innerHTML = '';
        textLayerDiv.style.cssText = `
          position: absolute;
          left: 0; top: 0;
          width: ${viewport.width}px;
          height: ${viewport.height}px;
          overflow: hidden;
          color: transparent;
          cursor: text;
          user-select: text;
        `;

        // Use pdfjsLib renderTextLayer if available
        if (pdfjsLib.renderTextLayer) {
          await pdfjsLib.renderTextLayer({
            textContentSource: textContent,
            container: textLayerDiv,
            viewport,
            textDivs: [],
          }).promise;
        }
      }

      page.cleanup();
    } catch (err) {
      console.warn('Page render error:', err);
    }
  }

  async function goToPage(num) {
    if (!pdfDoc) return;
    num = Math.max(1, Math.min(totalPages, num));
    currentPage = num;
    document.getElementById('pdf-page-input').value = num;

    // Scroll to page
    const wrapper = document.getElementById(`pdf-page-wrapper-${num}`);
    if (wrapper) {
      wrapper.scrollIntoView({ behavior: 'smooth', block: 'start' });
      // Render if not yet rendered
      if (!document.getElementById(`pdf-canvas-${num}`)?.width) {
        await renderPage(num);
      }
    }
  }

  function changeZoom(delta) {
    scale = Math.max(0.5, Math.min(4, scale + delta));
    document.getElementById('pdf-zoom-level').textContent = Math.round(scale * 100) + '%';
    if (pdfDoc) {
      document.getElementById('pdf-container').innerHTML = '';
      renderAllPages();
    }
  }

  function fitToWidth() {
    const container = document.getElementById('pdf-container');
    if (!pdfDoc) return;
    pdfDoc.getPage(1).then(page => {
      const defaultViewport = page.getViewport({ scale: 1 });
      scale = (container.clientWidth - 32) / defaultViewport.width;
      scale = Math.round(scale * 100) / 100;
      document.getElementById('pdf-zoom-level').textContent = Math.round(scale * 100) + '%';
      document.getElementById('pdf-container').innerHTML = '';
      renderAllPages();
    });
  }

  function print() {
    if (!currentPath) return;
    const url = `/api/stream?path=${encodeURIComponent(currentPath)}`;
    const win = window.open(url, '_blank');
    if (win) {
      win.addEventListener('load', () => win.print());
    }
  }

  function close() {
    if (pdfDoc) {
      pdfDoc.destroy();
      pdfDoc = null;
    }
    document.getElementById('pdf-modal').classList.add('hidden');
    document.getElementById('pdf-container').innerHTML = '';
    currentPage = 1;
    totalPages = 0;
  }

  // Init event listeners
  function initControls() {
    document.getElementById('pdf-prev').addEventListener('click', () => goToPage(currentPage - 1));
    document.getElementById('pdf-next').addEventListener('click', () => goToPage(currentPage + 1));
    document.getElementById('pdf-zoom-in').addEventListener('click', () => changeZoom(0.2));
    document.getElementById('pdf-zoom-out').addEventListener('click', () => changeZoom(-0.2));
    document.getElementById('pdf-fit').addEventListener('click', fitToWidth);
    document.getElementById('pdf-print').addEventListener('click', print);
    document.getElementById('pdf-close').addEventListener('click', close);

    document.getElementById('pdf-page-input').addEventListener('keydown', e => {
      if (e.key === 'Enter') goToPage(parseInt(e.target.value));
    });
    document.getElementById('pdf-page-input').addEventListener('blur', e => {
      goToPage(parseInt(e.target.value));
    });

    document.getElementById('pdf-modal').addEventListener('click', e => {
      if (e.target === document.getElementById('pdf-modal')) close();
    });

    // Track scroll to update current page indicator
    document.getElementById('pdf-container').addEventListener('scroll', () => {
      const container = document.getElementById('pdf-container');
      const wrappers = container.querySelectorAll('.pdf-page-wrapper');
      let visible = 1;
      wrappers.forEach((w, i) => {
        const rect = w.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        if (rect.top >= containerRect.top - 50) {
          visible = i + 1;
          return;
        }
      });
      currentPage = visible;
      document.getElementById('pdf-page-input').value = visible;
    }, { passive: true });

    // Keyboard shortcuts
    document.addEventListener('keydown', e => {
      if (document.getElementById('pdf-modal').classList.contains('hidden')) return;
      if (document.activeElement === document.getElementById('pdf-page-input')) return;
      switch (e.code) {
        case 'ArrowRight':
        case 'ArrowDown': goToPage(currentPage + 1); break;
        case 'ArrowLeft':
        case 'ArrowUp': goToPage(currentPage - 1); break;
        case 'Equal':
        case 'NumpadAdd': changeZoom(0.2); break;
        case 'Minus':
        case 'NumpadSubtract': changeZoom(-0.2); break;
        case 'Digit0': fitToWidth(); break;
        case 'KeyP': if (e.ctrlKey || e.metaKey) { e.preventDefault(); print(); } break;
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