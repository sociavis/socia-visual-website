// Main entry point — loads Three.js (tree-shaken), then site scripts
import './three-setup.js';

// Import grid-scene and script as side-effect modules
import '../grid-scene.js';
import '../script.js';

// Dark/light theme toggle
const themeToggle = document.getElementById('themeToggle');
if (themeToggle) {
  // Restore saved theme
  const saved = localStorage.getItem('sv-theme');
  if (saved) document.documentElement.setAttribute('data-theme', saved);

  themeToggle.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('sv-theme', next);
    themeToggle.setAttribute('aria-label', next === 'light' ? 'Toggle dark mode' : 'Toggle light mode');
  });
}

// Animated page transitions (View Transitions API)
if ('startViewTransition' in document) {
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a[href]');
    if (!link) return;
    const url = new URL(link.href, location.origin);
    // Only handle same-origin, non-hash, non-external links
    if (url.origin !== location.origin || url.pathname === location.pathname || link.target === '_blank') return;
    e.preventDefault();
    document.startViewTransition(() => {
      window.location.href = link.href;
    });
  });
}

// Register service worker for offline support
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}
