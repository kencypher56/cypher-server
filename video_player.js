/* video_player.js - Advanced video player with multi-track, subtitle support */
'use strict';

const VideoPlayer = (() => {
  let currentPath = '';
  let currentName = '';
  let isDragging = false;
  let hideControlsTimer = null;

  function open(filePath, fileName) {
    currentPath = filePath;
    currentName = fileName || filePath.split('/').pop();

    const modal = document.getElementById('video-modal');
    const video = document.getElementById('video-el');
    const title = document.getElementById('video-title');

    title.textContent = currentName;
    modal.classList.remove('hidden');

    const url = `/api/stream?path=${encodeURIComponent(filePath)}`;
    video.src = url;
    video.load();
    video.play().catch(() => {});

    document.getElementById('video-download').onclick = () => {
      Download.download(filePath, currentName);
    };

    loadSubtitles(filePath);
    updatePlayPauseBtn();
  }

  function close() {
    const video = document.getElementById('video-el');
    video.pause();
    video.src = '';
    // Remove all tracks
    while (video.firstChild) video.removeChild(video.firstChild);
    document.getElementById('video-modal').classList.add('hidden');
    document.getElementById('sub-menu').classList.add('hidden');
    document.getElementById('audio-track-menu').classList.add('hidden');
  }

  // ── SUBTITLES ──
  async function loadSubtitles(filePath) {
    const menu = document.getElementById('sub-menu');
    menu.innerHTML = '';

    // Add "Off" option
    addSubOption(menu, 'Off', null, true);

    try {
      const res = await fetch(`/api/subtitles?path=${encodeURIComponent(filePath)}`);
      const subs = await res.json();

      subs.forEach(sub => {
        addSubOption(menu, sub.label || sub.name, sub.path, false);
      });

      if (subs.length > 0) {
        Toast.info(`Found ${subs.length} subtitle track${subs.length > 1 ? 's' : ''}`);
      }
    } catch {}

    // Audio tracks
    checkAudioTracks();
  }

  function addSubOption(menu, label, subPath, isOff) {
    const item = document.createElement('button');
    item.className = 'track-item' + (isOff ? ' active' : '');
    item.innerHTML = `<i data-lucide="${isOff ? 'x' : 'subtitles'}" class="w-3 h-3"></i> ${label}`;
    item.addEventListener('click', () => {
      menu.querySelectorAll('.track-item').forEach(i => i.classList.remove('active'));
      item.classList.add('active');
      if (isOff) {
        disableAllTracks();
      } else {
        loadSubTrack(subPath);
      }
      menu.classList.add('hidden');
    });
    menu.appendChild(item);
    lucide.createIcons({ nodes: [item] });
  }

  function loadSubTrack(subPath) {
    const video = document.getElementById('video-el');
    // Remove existing text tracks
    const tracks = video.querySelectorAll('track[kind="subtitles"], track[kind="captions"]');
    tracks.forEach(t => t.remove());

    const track = document.createElement('track');
    track.kind = 'subtitles';
    track.label = 'Subtitles';
    track.src = `/api/stream?path=${encodeURIComponent(subPath)}`;
    track.default = true;
    video.appendChild(track);

    // Enable when loaded
    setTimeout(() => {
      if (video.textTracks[0]) {
        video.textTracks[0].mode = 'showing';
      }
    }, 300);
    Toast.success('Subtitle loaded');
  }

  function disableAllTracks() {
    const video = document.getElementById('video-el');
    Array.from(video.textTracks).forEach(t => { t.mode = 'hidden'; });
  }

  // Upload external subtitle
  function initSubUpload() {
    document.getElementById('sub-upload').addEventListener('change', async function () {
      const file = this.files[0];
      if (!file) return;

      const ext = file.name.split('.').pop().toLowerCase();
      let src;

      if (ext === 'vtt') {
        src = URL.createObjectURL(file);
      } else if (ext === 'srt') {
        // Convert SRT to VTT
        const text = await file.text();
        const vtt = srtToVtt(text);
        const blob = new Blob([vtt], { type: 'text/vtt' });
        src = URL.createObjectURL(blob);
      } else {
        Toast.warn('Only SRT and VTT subtitles supported for upload');
        return;
      }

      const video = document.getElementById('video-el');
      const existing = video.querySelectorAll('track');
      existing.forEach(t => t.remove());

      const track = document.createElement('track');
      track.kind = 'subtitles';
      track.label = file.name;
      track.src = src;
      track.default = true;
      video.appendChild(track);

      setTimeout(() => {
        if (video.textTracks[0]) video.textTracks[0].mode = 'showing';
      }, 200);

      // Add to menu
      const menu = document.getElementById('sub-menu');
      addSubOption(menu, `📎 ${file.name}`, null, false);
      Toast.success('Custom subtitle loaded: ' + file.name);
      this.value = '';
    });
  }

  function srtToVtt(srt) {
    return 'WEBVTT\n\n' + srt
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .replace(/(\d+)\n(\d{2}:\d{2}:\d{2}),(\d{3}) --> (\d{2}:\d{2}:\d{2}),(\d{3})/g,
        '$2.$3 --> $4.$5')
      .replace(/^\d+\n/gm, '');
  }

  // ── AUDIO TRACKS ──
  function checkAudioTracks() {
    const video = document.getElementById('video-el');
    const menu = document.getElementById('audio-track-menu');
    menu.innerHTML = '';

    video.addEventListener('loadedmetadata', () => {
      const tracks = video.audioTracks;
      if (!tracks || tracks.length <= 1) {
        menu.innerHTML = '<div class="track-item text-muted">No extra tracks</div>';
        return;
      }
      for (let i = 0; i < tracks.length; i++) {
        const t = tracks[i];
        const item = document.createElement('button');
        item.className = 'track-item' + (t.enabled ? ' active' : '');
        item.innerHTML = `<i data-lucide="mic" class="w-3 h-3"></i> ${t.label || ('Track ' + (i+1))}`;
        const idx = i;
        item.addEventListener('click', () => {
          for (let j = 0; j < tracks.length; j++) tracks[j].enabled = j === idx;
          menu.querySelectorAll('.track-item').forEach(el => el.classList.remove('active'));
          item.classList.add('active');
          menu.classList.add('hidden');
          Toast.info('Audio track changed');
        });
        menu.appendChild(item);
      }
      lucide.createIcons({ nodes: [menu] });
    });
  }

  // ── CUSTOM CONTROLS ──
  function initControls() {
    const video = document.getElementById('video-el');
    video.controls = false;

    // Progress
    const progressBg = document.getElementById('video-progress-bar');
    const progressFill = document.getElementById('video-progress-fill');
    const tooltip = document.getElementById('time-tooltip');

    video.addEventListener('timeupdate', () => {
      if (isDragging) return;
      const pct = video.duration ? (video.currentTime / video.duration) * 100 : 0;
      progressFill.style.width = pct + '%';
      document.getElementById('vc-time').textContent =
        `${Design.formatDuration(video.currentTime)} / ${Design.formatDuration(video.duration)}`;
    });

    // Seek
    progressBg.addEventListener('click', e => {
      const rect = progressBg.getBoundingClientRect();
      const pct = (e.clientX - rect.left) / rect.width;
      video.currentTime = pct * video.duration;
    });

    progressBg.addEventListener('mousemove', e => {
      const rect = progressBg.getBoundingClientRect();
      const pct = (e.clientX - rect.left) / rect.width;
      const t = pct * (video.duration || 0);
      tooltip.textContent = Design.formatDuration(t);
      tooltip.style.left = `${e.clientX - rect.left - 20}px`;
      tooltip.style.display = 'block';
    });
    progressBg.addEventListener('mouseleave', () => { tooltip.style.display = 'none'; });

    // Play/Pause
    document.getElementById('vc-play').addEventListener('click', togglePlay);
    video.addEventListener('click', togglePlay);
    video.addEventListener('play', updatePlayPauseBtn);
    video.addEventListener('pause', updatePlayPauseBtn);
    video.addEventListener('ended', updatePlayPauseBtn);

    // Skip
    document.getElementById('vc-skip-back').addEventListener('click', () => { video.currentTime -= 10; });
    document.getElementById('vc-skip-fwd').addEventListener('click', () => { video.currentTime += 10; });

    // Volume
    document.getElementById('vc-mute').addEventListener('click', () => {
      video.muted = !video.muted;
      const icon = document.getElementById('vc-mute').querySelector('[data-lucide]');
      icon.setAttribute('data-lucide', video.muted ? 'volume-x' : 'volume-2');
      lucide.createIcons({ nodes: [document.getElementById('vc-mute')] });
    });
    document.getElementById('vc-vol').addEventListener('input', e => { video.volume = e.target.value; });

    // Speed
    document.getElementById('vc-speed').addEventListener('change', e => { video.playbackRate = parseFloat(e.target.value); });

    // Fullscreen
    document.getElementById('vc-fullscreen').addEventListener('click', () => {
      const container = video.closest('.video-container');
      if (!document.fullscreenElement) {
        container.requestFullscreen?.();
      } else {
        document.exitFullscreen?.();
      }
    });

    // PiP
    document.getElementById('video-pip').addEventListener('click', () => {
      if (document.pictureInPictureElement) {
        document.exitPictureInPicture();
      } else {
        video.requestPictureInPicture?.();
      }
    });

    // Subtitle menu toggle
    document.getElementById('vc-sub').addEventListener('click', e => {
      e.stopPropagation();
      const menu = document.getElementById('sub-menu');
      const audioMenu = document.getElementById('audio-track-menu');
      audioMenu.classList.add('hidden');
      menu.classList.toggle('hidden');
    });

    document.getElementById('vc-audio-track').addEventListener('click', e => {
      e.stopPropagation();
      const menu = document.getElementById('audio-track-menu');
      const subMenu = document.getElementById('sub-menu');
      subMenu.classList.add('hidden');
      menu.classList.toggle('hidden');
    });

    // Close menus when clicking outside
    document.addEventListener('click', () => {
      document.getElementById('sub-menu').classList.add('hidden');
      document.getElementById('audio-track-menu').classList.add('hidden');
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', e => {
      const modal = document.getElementById('video-modal');
      if (modal.classList.contains('hidden')) return;
      switch (e.code) {
        case 'Space': e.preventDefault(); togglePlay(); break;
        case 'ArrowRight': video.currentTime += 5; break;
        case 'ArrowLeft': video.currentTime -= 5; break;
        case 'ArrowUp': video.volume = Math.min(1, video.volume + 0.1); break;
        case 'ArrowDown': video.volume = Math.max(0, video.volume - 0.1); break;
        case 'KeyF': document.getElementById('vc-fullscreen').click(); break;
        case 'KeyM': document.getElementById('vc-mute').click(); break;
      }
    });

    // Close modal
    document.getElementById('video-close').addEventListener('click', close);
    document.getElementById('video-modal').addEventListener('click', e => {
      if (e.target === document.getElementById('video-modal')) close();
    });
  }

  function togglePlay() {
    const video = document.getElementById('video-el');
    if (video.paused) video.play();
    else video.pause();
  }

  function updatePlayPauseBtn() {
    const video = document.getElementById('video-el');
    const btn = document.getElementById('vc-play');
    if (!btn) return;
    const icon = btn.querySelector('[data-lucide]');
    if (icon) {
      icon.setAttribute('data-lucide', video.paused ? 'play' : 'pause');
      lucide.createIcons({ nodes: [btn] });
    }
  }

  // Init
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { initControls(); initSubUpload(); });
  } else {
    initControls();
    initSubUpload();
  }

  return { open, close };
})();