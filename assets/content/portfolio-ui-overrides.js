/*
  Portfolio media interaction overrides
  -------------------------------------
  - Keep YouTube clean before playback: thumbnail + play button only.
  - Never keep a YouTube iframe before an explicit user tap.
  - After playback starts, use the standard YouTube controls and fullscreen button.
  - Keep consecutive YouTube blocks visually close without merging them.
  - Keep Portfolio Item gallery image backgrounds unchanged in-page.
  - Use a theme-aware translucent backdrop for the Portfolio Item gallery lightbox.
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
      .sanity-content-block[data-block-type="workGalleryBlock"] .sanity-gallery-item img{
        background:var(--panel) !important;
      }
      #work-gallery-lightbox{
        background:rgba(255,255,255,.80) !important;
      }
      :root[data-site-theme="black"] #work-gallery-lightbox{
        background:rgba(0,0,0,.80) !important;
      }
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

  function createStandardIframe(stage, videoId, autoplay = true){
    const iframe = document.createElement('iframe');
    iframe.src = standardEmbedUrl(videoId, autoplay);
    iframe.title = stage.getAttribute('aria-label') || 'YouTube video player';
    iframe.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
    iframe.referrerPolicy = 'strict-origin-when-cross-origin';
    iframe.setAttribute('allowfullscreen', '');
    iframe.dataset.standardYoutubePlayer = 'true';
    return iframe;
  }

  function createCleanPoster(stage, videoId){
    const poster = document.createElement('button');
    poster.className = 'yt-poster';
    poster.type = 'button';
    poster.setAttribute('aria-label', stage.getAttribute('aria-label') || 'Play YouTube video');

    const image = document.createElement('img');
    image.src = `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`;
    image.alt = '';
    image.draggable = false;
    image.onerror = () => {
      image.onerror = null;
      image.src = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
    };

    const play = document.createElement('span');
    play.className = 'yt-play';
    play.setAttribute('aria-hidden', 'true');
    play.textContent = '▶';

    poster.append(image, play);
    poster.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopImmediatePropagation();
      stage.dataset.youtubeStarted = 'true';
      stage.replaceChildren(createStandardIframe(stage, videoId, true));
    }, true);
    return poster;
  }

  function markRendererPoster(stage){
    if (stage.dataset.posterStartBound === 'true') return;
    stage.dataset.posterStartBound = 'true';
    stage.addEventListener('click', (event) => {
      if (!event.target.closest?.('.yt-poster')) return;
      stage.dataset.youtubeStarted = 'true';
    }, true);
  }

  function normalizeYouTubeStage(stage){
    if (!(stage instanceof Element) || !stage.classList.contains('yt-stage')) return;

    const videoId = youtubeIdFromStage(stage);
    if (!videoId) return;

    const poster = stage.querySelector(':scope > .yt-poster');
    if (poster) {
      markRendererPoster(stage);
      return;
    }

    const currentIframe = stage.querySelector(':scope > iframe');
    if (!currentIframe) return;

    // Critical rule: an iframe is not allowed to exist before an explicit user tap.
    if (stage.dataset.youtubeStarted !== 'true') {
      stage.replaceChildren(createCleanPoster(stage, videoId));
      return;
    }

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
