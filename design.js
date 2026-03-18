/* design.js - Theme management, animations, UI microinteractions */
'use strict';

const Design = (() => {

  const THEMES = ['dark', 'light', 'kuromi', 'cyberpunk'];

  function setTheme(theme) {
    if (!THEMES.includes(theme)) theme = 'dark';
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('cypher-theme', theme);

    // Notify Three.js background
    document.dispatchEvent(new CustomEvent('themechange', { detail: { theme } }));

    // Update active theme button
    document.querySelectorAll('.theme-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.theme === theme);
    });

    // Animate theme transition
    document.body.style.transition = 'background 0.4s ease, color 0.4s ease';
    setTimeout(() => { document.body.style.transition = ''; }, 500);
  }

  function getTheme() {
    return document.documentElement.getAttribute('data-theme') || 'dark';
  }

  // Spin animation for refresh button
  function animateSpin(btnId) {
    const btn = document.getElementById(btnId);
    if (!btn) return;
    const icon = btn.querySelector('[data-lucide]');
    if (icon) {
      icon.style.transition = 'transform 0.6s ease';
      icon.style.transform = 'rotate(360deg)';
      setTimeout(() => { icon.style.transform = ''; }, 700);
    }
  }

  // Ripple effect on click
  function addRipple(el, e) {
    const rect = el.getBoundingClientRect();
    const ripple = document.createElement('span');
    const size = Math.max(rect.width, rect.height);
    ripple.style.cssText = `
      position:absolute; border-radius:50%;
      width:${size}px; height:${size}px;
      left:${e.clientX - rect.left - size/2}px;
      top:${e.clientY - rect.top - size/2}px;
      background: rgba(255,255,255,0.15);
      transform: scale(0); animation: ripple-anim 0.5s linear forwards;
      pointer-events:none;
    `;
    el.style.position = 'relative';
    el.style.overflow = 'hidden';
    el.appendChild(ripple);
    setTimeout(() => ripple.remove(), 500);
  }

  // Inject ripple keyframes once
  (function injectRippleCSS() {
    if (document.getElementById('ripple-style')) return;
    const style = document.createElement('style');
    style.id = 'ripple-style';
    style.textContent = `@keyframes ripple-anim { to { transform: scale(2.5); opacity: 0; } }`;
    document.head.appendChild(style);
  })();

  // Add ripple to all buttons
  document.addEventListener('click', e => {
    const btn = e.target.closest('.action-btn, .action-btn-primary, .cat-btn');
    if (btn) addRipple(btn, e);
  }, { passive: true });

  // Stagger animate items in a container
  function staggerIn(container, selector = '.file-card, .file-row') {
    const items = container.querySelectorAll(selector);
    items.forEach((el, i) => {
      el.style.animationDelay = `${i * 20}ms`;
    });
  }

  // Hover tilt effect on file cards
  document.addEventListener('mousemove', e => {
    const card = e.target.closest('.file-card');
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = (e.clientX - cx) / (rect.width / 2);
    const dy = (e.clientY - cy) / (rect.height / 2);
    card.style.transform = `translateY(-3px) scale(1.02) rotateX(${-dy * 4}deg) rotateY(${dx * 4}deg)`;
  }, { passive: true });

  document.addEventListener('mouseleave', e => {
    const card = e.target.closest('.file-card');
    if (!card) return;
    card.style.transform = '';
  }, { passive: true, capture: true });

  // Format bytes
  function formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Format duration
  function formatDuration(sec) {
    if (isNaN(sec) || !isFinite(sec)) return '0:00';
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = Math.floor(sec % 60);
    if (h > 0) return `${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
    return `${m}:${String(s).padStart(2,'0')}`;
  }

  // Init theme from storage
  function init() {
    const saved = localStorage.getItem('cypher-theme') || 'dark';
    setTheme(saved);
  }

  init();

  return { setTheme, getTheme, animateSpin, staggerIn, formatBytes, formatDuration };
})();