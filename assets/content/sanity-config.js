/*
  Sanity runtime configuration
  ----------------------------
  This file contains public frontend configuration only. Never put write tokens here.

  Public website architecture:
  - GitHub Pages owns HTML / CSS / JS, layout, formatting and rendering.
  - Sanity supplies editable content values and, when explicitly enabled, assets.
  - If Sanity is unavailable or contains no matching content, the site keeps its local fallback.
*/

window.SANITY_CONFIG = {
  enabled: true,
  projectId: 'a707yvok',
  dataset: 'production',
  apiVersion: '2026-09-02',
  useCdn: true,
  features: {
    siteCopy: true,
    // Keep the current GitHub sample-photo pool until real Sanity assets are migrated.
    portfolioPhotos: false
  }
};
