/*
  Sanity runtime configuration
  ----------------------------
  This file contains public frontend configuration only. Never put write tokens here.

  Public website architecture:
  - GitHub Pages owns HTML / CSS / JS and rendering.
  - Sanity is used only as a content, database, image and file source.
  - If Sanity is unavailable or contains no matching content, the prototype keeps its local fallback.
*/

window.SANITY_CONFIG = {
  enabled: true,
  projectId: 'a707yvok',
  dataset: 'production',
  apiVersion: '2026-09-02',
  useCdn: true,
  features: {
    siteCopy: true,
    portfolioPhotos: true
  }
};
