/*
  Sanity runtime configuration
  ----------------------------
  This file contains public frontend configuration only. Never put write tokens here.

  Public website architecture:
  - GitHub Pages owns HTML / CSS / JS, layout, formatting and rendering.
  - Sanity supplies editable content values, navigation and, when explicitly enabled, assets.
  - Sanity-bound text/navigation does not mirror stale local copy; unavailable remote content remains OFFLINE.
*/

window.SANITY_CONFIG = {
  enabled: true,
  projectId: 'a707yvok',
  dataset: 'production',
  apiVersion: '2026-09-02',
  // During active prototyping, read published content directly so Homepage
  // reorder/add/remove edits appear immediately instead of waiting on CDN cache.
  useCdn: false,
  features: {
    siteCopy: true,
    workEntries: true,
    // Keep the current GitHub sample-photo pool until real Sanity assets are migrated.
    portfolioPhotos: false
  }
};
