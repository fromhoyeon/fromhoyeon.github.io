/*
  Portfolio media interaction overrides
  -------------------------------------
  - Normalize every YouTube stage to the standard YouTube player controls.
  - Keep consecutive YouTube blocks visually close without merging them.
  - Remove the work-gallery Close button. Desktop gallery lightboxes close with Esc;
    touch devices keep backdrop closing because they do not have an Escape key.
*/

(function initPortfolioUiOverrides(){
  if (window.__PORTFOLIO_UI_OVERRIDES_LOADED__) return;
  window.__PORTFOLIO_UI_OVERRIDES_LOADED__ = true;

  function ensureStyles(){
    if (document.querySelector('#portfolio-ui-overrides-styles')) return;
    const style = document.createElement('style');
    style.id = 'portfolio-ui-overrides-styles';
    style.textContent = `
      .sanity-content-block[data-block-type="workVideoBlock"] +
      .sanity-content-block[data-block-type="workVideoBlock"]{
        margin-top:calc(10px - var(--l));
      }
      #work-gallery-lightbox .lightbox-close{display:none !important}
      @media (max-width:620px){
        .sanity-content-block[data-block-type="workVideoBlock"] +
        .sanity-content-block[data-block-type="workVideoBlock"]{
          margin-top:calc(8px - var(--l));
        }
      }
    `;
    document.head.appendChild(style);
  }

  function youtubeIdFromStage(stage){
    const direct = stage?.dataset?.sanityVideoId || stage?.dataset?.videoId || '';
    if (direct) return direct;

    const iframe = stage?.querySelector('iframe');
    if (iframe?.src) {
      try {
        const url = new URL(iframe.src, window.location.href);
        const parts = url.pathname.split('/').filter(Boolean);
        const embedIndex = parts.indexOf('embed');
        if (embedIndex >= 0 && parts[embedIndex + 1]) return parts[embedIndex + 1];
      } catch (error) {
        // Fall through to the poster URL.
      }
    }

    const poster = stage?.querySelector('.yt-poster img, img[src*="i.ytimg.com/vi/"]');
    const match = poster?.src?.match(/\/vi\/([^/]+)\//);
    return match?.[1] || '';
  }

  function standardEmbedUrl(videoId, autoplay = false){
    const url = new URL(`https://www.youtube-nocookie.com/embed/${videoId}`);
    url.searchParams.set('controls', '1');
    url.searchParams.set('fs', '1');
    url.searchParams.set('playsinline', '1');
    url.searchParams.set('rel', '0');
    url.searchParams.set('iv_load_policy', '3');
    if (autoplay) url.searchParams.set('autoplay', '1');
    return url.toString();
  }

  function normalizeYouTubeStage(stage){
    if (!(stage instanceof Element) || !stage.classList.contains('yt-stage')) return;

    const videoId = youtubeIdFromStage(stage);
    if (!videoId) return;

    const currentIframe = stage.querySelector(':scope > iframe');
    if (currentIframe) {
      let autoplay = false;
      try {
        autoplay = new URL(currentIframe.src, window.location.href).searchParams.get('autoplay') === '1';
      } catch (error) {
        autoplay = false;
      }

      const desiredSrc = standardEmbedUrl(videoId, autoplay);
      if (currentIframe.src !== desiredSrc) currentIframe.src = desiredSrc;
      currentIframe.title ||= 'YouTube video player';
      currentIframe.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
      currentIframe.referrerPolicy = 'strict-origin-when-cross-origin';
      currentIframe.setAttribute('allowfullscreen', '');
      currentIframe.dataset.standardYoutubePlayer = 'true';
      return;
    }

    // Replace custom poster/play-button shells with the stable native YouTube player.
    const iframe = document.createElement('iframe');
    iframe.src = standardEmbedUrl(videoId, false);
    iframe.title = stage.getAttribute('aria-label') || 'YouTube video player';
    iframe.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
    iframe.referrerPolicy = 'strict-origin-when-cross-origin';
    iframe.loading = 'lazy';
    iframe.setAttribute('allowfullscreen', '');
    iframe.dataset.standardYoutubePlayer = 'true';
    stage.replaceChildren(iframe);
  }

  function tuneGalleryLightbox(lightbox){
    if (!(lightbox instanceof Element) || lightbox.id !== 'work-gallery-lightbox') return;

    lightbox.querySelector('.lightbox-close')?.remove();
    if (lightbox.dataset.desktopEscOnlyBound === 'true') return;
    lightbox.dataset.desktopEscOnlyBound = 'true';

    lightbox.addEventListener('click', (event) => {
      const desktopPointer = window.matchMedia('(pointer:fine)').matches;
      if (desktopPointer && event.target === lightbox) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    }, true);
  }

  function inspect(root){
    if (!(root instanceof Element) && root !== document) return;

    if (root instanceof Element && root.classList.contains('yt-stage')) {
      normalizeYouTubeStage(root);
    }
    root.querySelectorAll?.('.yt-stage').forEach(normalizeYouTubeStage);

    if (root instanceof Element && root.id === 'work-gallery-lightbox') {
      tuneGalleryLightbox(root);
    }
    root.querySelectorAll?.('#work-gallery-lightbox').forEach(tuneGalleryLightbox);
  }

  ensureStyles();
  inspect(document);

  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.target instanceof Element) inspect(mutation.target);
      mutation.addedNodes.forEach((node) => {
        if (node instanceof Element) inspect(node);
      });
    });
  });
  observer.observe(document.documentElement, {childList:true, subtree:true});
})();
