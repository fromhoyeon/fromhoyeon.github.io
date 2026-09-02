/*
  Sanity runtime configuration
  ----------------------------
  This file contains public frontend configuration only. Never put write tokens here.

  After creating the Sanity project:
  1. set projectId
  2. keep dataset public (recommended for this public portfolio)
  3. add https://fromhoyeon.github.io to Sanity CORS origins
  4. set enabled: true
*/

window.SANITY_CONFIG = {
  enabled: false,
  projectId: '',
  dataset: 'production',
  apiVersion: '2026-09-02',
  useCdn: true,
  features: {
    siteCopy: true,
    portfolioPhotos: true
  }
};
