/* background.js - Three.js animated particle background */
(function () {
  'use strict';

  let scene, camera, renderer, particles, lines;
  let animFrame, time = 0;
  let currentTheme = 'dark';
  const PARTICLE_COUNT = 120;
  const LINE_DIST = 120;

  const themeColors = {
    dark:      { primary: 0x00d4ff, secondary: 0x7c3aed, bg: 0x07090f },
    light:     { primary: 0x2563eb, secondary: 0x7c3aed, bg: 0xf0f4f8 },
    kuromi:    { primary: 0xc084fc, secondary: 0xf472b6, bg: 0x0d001a },
    cyberpunk: { primary: 0xf9e41c, secondary: 0x00ffff, bg: 0x000000 },
  };

  function init() {
    const canvas = document.getElementById('bg-canvas');
    if (!canvas || typeof THREE === 'undefined') return;

    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 2000);
    camera.position.z = 600;

    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setClearColor(0x000000, 0);

    buildParticles();
    buildLines();

    window.addEventListener('resize', onResize);
    document.addEventListener('themechange', onThemeChange);

    animate();
  }

  function buildParticles() {
    if (particles) scene.remove(particles);

    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(PARTICLE_COUNT * 3);
    const velocities = [];
    const sizes = new Float32Array(PARTICLE_COUNT);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      positions[i * 3]     = (Math.random() - 0.5) * 1200;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 800;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 400;
      velocities.push({
        x: (Math.random() - 0.5) * 0.3,
        y: (Math.random() - 0.5) * 0.3,
        z: (Math.random() - 0.5) * 0.1,
      });
      sizes[i] = Math.random() * 3 + 1;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    geo._velocities = velocities;

    const colors = themeColors[currentTheme];
    const mat = new THREE.PointsMaterial({
      color: colors.primary,
      size: 2.5,
      transparent: true,
      opacity: 0.6,
      sizeAttenuation: true,
    });

    particles = new THREE.Points(geo, mat);
    scene.add(particles);
  }

  function buildLines() {
    if (lines) scene.remove(lines);

    const colors = themeColors[currentTheme];
    const mat = new THREE.LineBasicMaterial({
      color: colors.primary,
      transparent: true,
      opacity: 0.08,
    });

    lines = new THREE.Group();
    lines._mat = mat;
    scene.add(lines);
  }

  function updateLines() {
    // Remove old lines
    while (lines.children.length) lines.remove(lines.children[0]);

    const pos = particles.geometry.attributes.position.array;
    const pts = [];
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      pts.push(new THREE.Vector3(pos[i*3], pos[i*3+1], pos[i*3+2]));
    }

    for (let i = 0; i < pts.length; i++) {
      for (let j = i + 1; j < pts.length; j++) {
        const dist = pts[i].distanceTo(pts[j]);
        if (dist < LINE_DIST) {
          const geo = new THREE.BufferGeometry().setFromPoints([pts[i], pts[j]]);
          const mat = lines._mat.clone();
          mat.opacity = 0.12 * (1 - dist / LINE_DIST);
          const line = new THREE.Line(geo, mat);
          lines.add(line);
        }
      }
    }
  }

  let lineUpdateCounter = 0;

  function animate() {
    animFrame = requestAnimationFrame(animate);
    time += 0.005;

    if (!particles) return;

    const pos = particles.geometry.attributes.position.array;
    const vels = particles.geometry._velocities;

    // Move particles
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      pos[i*3]     += vels[i].x;
      pos[i*3+1]   += vels[i].y;
      pos[i*3+2]   += vels[i].z;

      // Wrap around
      if (pos[i*3] > 700) pos[i*3] = -700;
      if (pos[i*3] < -700) pos[i*3] = 700;
      if (pos[i*3+1] > 500) pos[i*3+1] = -500;
      if (pos[i*3+1] < -500) pos[i*3+1] = 500;
    }
    particles.geometry.attributes.position.needsUpdate = true;

    // Slowly rotate the whole scene
    particles.rotation.y = Math.sin(time * 0.1) * 0.05;
    particles.rotation.x = Math.cos(time * 0.07) * 0.03;

    // Update particle color with RGB shift
    const hue = (time * 20) % 360;
    const col = new THREE.Color(`hsl(${hue},80%,60%)`);
    if (currentTheme === 'dark' || currentTheme === 'cyberpunk') {
      particles.material.color.lerpColors(
        new THREE.Color(themeColors[currentTheme].primary),
        col,
        0.3 + Math.sin(time) * 0.15
      );
    }

    // Update connecting lines every 6 frames
    lineUpdateCounter++;
    if (lineUpdateCounter % 6 === 0) updateLines();

    renderer.render(scene, camera);
  }

  function onResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }

  function onThemeChange(e) {
    currentTheme = e.detail?.theme || 'dark';
    if (particles) {
      particles.material.color.set(themeColors[currentTheme].primary);
    }
    if (lines && lines._mat) {
      lines._mat.color.set(themeColors[currentTheme].primary);
    }
  }

  // Init when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.CypherBG = { init, setTheme: t => { currentTheme = t; } };
})();