/* audio_player.js - Advanced audio player with visualizer and playlist */
'use strict';

const AudioPlayer = (() => {
  let playlist = [];
  let currentIndex = 0;
  let isPlaying = false;
  let isShuffle = false;
  let isRepeat = false; // 0=off 1=all 2=one
  let repeatMode = 0;
  let audioCtx = null;
  let analyser = null;
  let source = null;
  let animFrame = null;
  let currentPath = '';

  function open(filePath, fileName, mediaList) {
    currentPath = filePath;
    playlist = mediaList || [{ path: filePath, name: fileName }];
    currentIndex = playlist.findIndex(i => i.path === filePath) ?? 0;
    if (currentIndex < 0) currentIndex = 0;

    document.getElementById('audio-modal').classList.remove('hidden');
    loadTrack(currentIndex);
    renderPlaylist();
  }

  function close() {
    const audio = document.getElementById('audio-el');
    audio.pause();
    audio.src = '';
    if (animFrame) cancelAnimationFrame(animFrame);
    document.getElementById('audio-modal').classList.add('hidden');
    document.getElementById('audio-modal').classList.remove('playing');
  }

  function loadTrack(idx) {
    if (idx < 0 || idx >= playlist.length) return;
    currentIndex = idx;
    const track = playlist[idx];
    const audio = document.getElementById('audio-el');

    document.getElementById('audio-name').textContent = track.name || track.path.split('/').pop();
    document.getElementById('audio-ext').textContent = (track.path.split('.').pop() || '').toUpperCase();
    document.getElementById('audio-title').textContent = track.name || track.path.split('/').pop();

    audio.src = `/api/stream?path=${encodeURIComponent(track.path)}`;
    audio.load();

    if (isPlaying) {
      audio.play().then(() => {
        initVisualizer();
      }).catch(() => {});
    }

    updatePlaylistHighlight();

    // Update download btn
    document.getElementById('ac-download').onclick = () => {
      Download.download(track.path, track.name);
    };
  }

  // ── WEB AUDIO VISUALIZER ──
  function initVisualizer() {
    const audio = document.getElementById('audio-el');
    const canvas = document.getElementById('audio-visualizer');
    const ctx = canvas.getContext('2d');

    if (!audioCtx) {
      try {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        analyser = audioCtx.createAnalyser();
        analyser.fftSize = 256;
        source = audioCtx.createMediaElementSource(audio);
        source.connect(analyser);
        analyser.connect(audioCtx.destination);
      } catch (e) { return; }
    }
    if (audioCtx.state === 'suspended') audioCtx.resume();

    if (animFrame) cancelAnimationFrame(animFrame);
    drawVisualizer(canvas, ctx);
  }

  function drawVisualizer(canvas, ctx) {
    if (!analyser) return;
    const buf = new Uint8Array(analyser.frequencyBinCount);

    function draw() {
      animFrame = requestAnimationFrame(draw);
      analyser.getByteFrequencyData(buf);

      canvas.width = canvas.offsetWidth;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const barW = canvas.width / buf.length * 2.5;
      let x = 0;
      const theme = Design.getTheme();
      const colors = {
        dark:      ['#00d4ff', '#7c3aed', '#f43f5e'],
        light:     ['#2563eb', '#7c3aed', '#f43f5e'],
        kuromi:    ['#c084fc', '#f472b6', '#67e8f9'],
        cyberpunk: ['#f9e41c', '#00ffff', '#ff003c'],
      };
      const [c1, c2, c3] = colors[theme] || colors.dark;

      for (let i = 0; i < buf.length; i++) {
        const barH = (buf[i] / 255) * canvas.height * 0.9;
        const pct = i / buf.length;
        // Gradient color
        const r = parseInt(c1.slice(1,3),16) + Math.round((parseInt(c2.slice(1,3),16) - parseInt(c1.slice(1,3),16)) * pct);
        const g = parseInt(c1.slice(3,5),16) + Math.round((parseInt(c2.slice(3,5),16) - parseInt(c1.slice(3,5),16)) * pct);
        const b = parseInt(c1.slice(5,7),16) + Math.round((parseInt(c2.slice(5,7),16) - parseInt(c1.slice(5,7),16)) * pct);

        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.beginPath();
        ctx.roundRect?.(x, canvas.height - barH, barW - 1, barH, [2]);
        ctx.fill?.();
        if (!ctx.roundRect) {
          ctx.fillRect(x, canvas.height - barH, barW - 1, barH);
        }
        x += barW + 1;
      }
    }
    draw();
  }

  // ── CONTROLS ──
  function initControls() {
    const audio = document.getElementById('audio-el');

    // Play/Pause
    document.getElementById('ac-play').addEventListener('click', togglePlay);

    audio.addEventListener('play', () => {
      isPlaying = true;
      updatePlayBtn();
      document.getElementById('audio-modal').classList.add('playing');
      initVisualizer();
    });
    audio.addEventListener('pause', () => {
      isPlaying = false;
      updatePlayBtn();
      document.getElementById('audio-modal').classList.remove('playing');
    });
    audio.addEventListener('ended', onTrackEnd);

    // Progress
    audio.addEventListener('timeupdate', () => {
      const pct = audio.duration ? (audio.currentTime / audio.duration) * 100 : 0;
      document.getElementById('audio-progress-fill').style.width = pct + '%';
      document.getElementById('audio-current').textContent = Design.formatDuration(audio.currentTime);
      document.getElementById('audio-total').textContent = Design.formatDuration(audio.duration);
    });

    const progressBg = document.getElementById('audio-progress-bar');
    progressBg.addEventListener('click', e => {
      const rect = progressBg.getBoundingClientRect();
      audio.currentTime = ((e.clientX - rect.left) / rect.width) * audio.duration;
    });

    // Volume
    document.getElementById('ac-vol').addEventListener('input', e => { audio.volume = e.target.value; });

    // Speed
    document.getElementById('ac-speed').addEventListener('change', e => { audio.playbackRate = parseFloat(e.target.value); });

    // Prev/Next
    document.getElementById('ac-prev').addEventListener('click', prevTrack);
    document.getElementById('ac-next').addEventListener('click', nextTrack);

    // Shuffle
    document.getElementById('ac-shuffle').addEventListener('click', () => {
      isShuffle = !isShuffle;
      document.getElementById('ac-shuffle').classList.toggle('active', isShuffle);
      Toast.info(isShuffle ? 'Shuffle on' : 'Shuffle off');
    });

    // Repeat
    document.getElementById('ac-repeat').addEventListener('click', () => {
      repeatMode = (repeatMode + 1) % 3;
      const btn = document.getElementById('ac-repeat');
      btn.classList.toggle('active', repeatMode > 0);
      const icons = ['repeat', 'repeat-1', 'repeat'];
      const icon = btn.querySelector('[data-lucide]');
      if (icon) { icon.setAttribute('data-lucide', icons[repeatMode]); lucide.createIcons({nodes:[btn]}); }
      Toast.info(['Repeat off', 'Repeat all', 'Repeat one'][repeatMode]);
    });

    // Playlist toggle
    document.getElementById('ac-playlist-toggle').addEventListener('click', () => {
      const pl = document.getElementById('audio-playlist');
      pl.classList.toggle('hidden');
    });

    // Close
    document.getElementById('audio-close').addEventListener('click', close);
    document.getElementById('audio-modal').addEventListener('click', e => {
      if (e.target === document.getElementById('audio-modal')) close();
    });

    // Keyboard
    document.addEventListener('keydown', e => {
      if (document.getElementById('audio-modal').classList.contains('hidden')) return;
      switch (e.code) {
        case 'Space': e.preventDefault(); togglePlay(); break;
        case 'ArrowRight': audio.currentTime += 5; break;
        case 'ArrowLeft': audio.currentTime -= 5; break;
        case 'ArrowUp': audio.volume = Math.min(1, audio.volume + 0.05); break;
        case 'ArrowDown': audio.volume = Math.max(0, audio.volume - 0.05); break;
        case 'KeyN': nextTrack(); break;
        case 'KeyP': prevTrack(); break;
      }
    });
  }

  function togglePlay() {
    const audio = document.getElementById('audio-el');
    if (audio.paused) {
      audio.play();
    } else {
      audio.pause();
    }
  }

  function updatePlayBtn() {
    const btn = document.getElementById('ac-play');
    if (!btn) return;
    const icon = btn.querySelector('[data-lucide]');
    if (icon) {
      icon.setAttribute('data-lucide', isPlaying ? 'pause' : 'play');
      lucide.createIcons({ nodes: [btn] });
    }
  }

  function prevTrack() {
    const audio = document.getElementById('audio-el');
    if (audio.currentTime > 3) { audio.currentTime = 0; return; }
    let idx = currentIndex - 1;
    if (idx < 0) idx = playlist.length - 1;
    loadTrack(idx);
    audio.play().then(initVisualizer).catch(() => {});
  }

  function nextTrack() {
    let idx;
    if (isShuffle) {
      idx = Math.floor(Math.random() * playlist.length);
    } else {
      idx = (currentIndex + 1) % playlist.length;
    }
    loadTrack(idx);
    const audio = document.getElementById('audio-el');
    audio.play().then(initVisualizer).catch(() => {});
  }

  function onTrackEnd() {
    if (repeatMode === 2) {
      // Repeat one
      const audio = document.getElementById('audio-el');
      audio.currentTime = 0;
      audio.play();
      return;
    }
    if (repeatMode === 1 || currentIndex < playlist.length - 1) {
      nextTrack();
    } else {
      isPlaying = false;
      updatePlayBtn();
    }
  }

  function renderPlaylist() {
    const container = document.getElementById('playlist-items');
    container.innerHTML = '';
    playlist.forEach((track, i) => {
      const item = document.createElement('div');
      item.className = 'playlist-item' + (i === currentIndex ? ' active' : '');
      item.innerHTML = `
        <span class="pl-num">${i + 1}</span>
        <i data-lucide="${i === currentIndex ? 'music-2' : 'music'}" class="w-3 h-3 text-accent flex-shrink-0"></i>
        <span class="flex-1 truncate">${track.name || track.path.split('/').pop()}</span>
      `;
      item.addEventListener('click', () => {
        loadTrack(i);
        const audio = document.getElementById('audio-el');
        audio.play().then(initVisualizer).catch(() => {});
      });
      container.appendChild(item);
    });
    lucide.createIcons({ nodes: [container] });
  }

  function updatePlaylistHighlight() {
    document.querySelectorAll('.playlist-item').forEach((el, i) => {
      el.classList.toggle('active', i === currentIndex);
    });
  }

  // Init
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initControls);
  } else {
    initControls();
  }

  return { open, close };
})();