export const themes = {
  cyberpunk: {
    primary: '#00ffff',
    secondary: '#ff00ff',
    bg: '#000814',
    text: '#ffffff',
    accent: '#ffff00',
    font: "'Inter', system-ui, sans-serif",
    particleHue: 0.6,
  },
  reddead: {
    primary: '#c44b2c',
    secondary: '#d4a373',
    bg: '#2b1b0e',
    text: '#f0e6d2',
    accent: '#8b5a2b',
    font: "'Inter', system-ui, sans-serif",
    particleHue: 0.05,
  },
  ps4: {
    primary: '#003791',
    secondary: '#ffffff',
    bg: '#0a0a0a',
    text: '#ffffff',
    accent: '#8c8c8c',
    font: "'Inter', system-ui, sans-serif",
    particleHue: 0.6,
  },
  witcher: {
    primary: '#a3311d',
    secondary: '#c0a86a',
    bg: '#1c281b',
    text: '#e0d6b5',
    accent: '#5e8c6b',
    font: "'Inter', system-ui, sans-serif",
    particleHue: 0.03,
  },
  clair: {
    primary: '#6d28d9',
    secondary: '#fbbf24',
    bg: '#0f172a',
    text: '#f1f5f9',
    accent: '#a855f7',
    font: "'Inter', system-ui, sans-serif",
    particleHue: 0.75,
  },
  dark: {
    primary: '#3b82f6',
    secondary: '#60a5fa',
    bg: '#0f0f0f',
    text: '#e5e7eb',
    accent: '#9ca3af',
    font: "'Inter', system-ui, sans-serif",
    particleHue: 0.6,
  },
  light: {
    primary: '#2563eb',
    secondary: '#7c3aed',
    bg: '#f3f4f6',
    text: '#111827',
    accent: '#6b7280',
    font: "'Inter', system-ui, sans-serif",
    particleHue: 0.6,
  },
};

export function applyTheme(themeName, updateBackgroundCallback) {
  const theme = themes[themeName];
  if (!theme) return;

  const root = document.documentElement;
  root.style.setProperty('--color-primary', theme.primary);
  root.style.setProperty('--color-secondary', theme.secondary);
  root.style.setProperty('--color-bg', theme.bg);
  root.style.setProperty('--color-text', theme.text);
  root.style.setProperty('--color-accent', theme.accent);
  root.style.setProperty('--font-sans', theme.font);

  document.body.style.backgroundColor = theme.bg;
  document.body.style.color = theme.text;

  document.querySelectorAll('.ui-panel').forEach(el => {
    el.style.borderColor = theme.primary;
    el.style.boxShadow = `0 0 20px ${theme.primary}40`;
  });

  document.querySelectorAll('.text-cyan-400').forEach(el => {
    el.style.color = theme.primary;
  });

  if (updateBackgroundCallback) {
    updateBackgroundCallback(theme.particleHue);
  }

  localStorage.setItem('theme', themeName);
}