/**
 * API base URL
 * - Local: http://localhost:4000
 * - Production: set window.__API_BASE__ via Netlify inject, or edit below
 *
 * On Netlify, create env var API_BASE_URL and use netlify.toml snippet inject,
 * or replace the production fallback after deploying Render.
 */
(function () {
  const isLocal =
    location.hostname === 'localhost' ||
    location.hostname === '127.0.0.1' ||
    location.protocol === 'file:';

  // Injected at deploy time if present (see netlify.toml)
  const injected = typeof window.__API_BASE__ === 'string' ? window.__API_BASE__.trim() : '';

  window.APP_CONFIG = {
    API_BASE:
      injected ||
      (isLocal
        ? 'http://localhost:4000'
        // Production Render API (also set Netlify env API_BASE_URL)
        : 'https://gharseva-mcpc.onrender.com'),
  };
})();
