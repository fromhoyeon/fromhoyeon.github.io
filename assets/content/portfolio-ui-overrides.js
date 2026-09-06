/*
  Portfolio media interaction layer
  ---------------------------------
  Visual styling lives in site.css. This module owns only media behavior:
  poster-first YouTube playback and gallery lightbox desktop closing rules.
*/

(function initPortfolioUiOverrides(){
  if (window.__PORTFOLIO_UI_OVERRIDES_LOADED__) return;
  window.__PORTFOLIO_UI_OVERRIDES_LOADED__ = true;

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
      } catch (error) {}
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

    if (stage.dataset.youtubeStarted !== 'true') {
      stage.replaceChildren(createCleanPoster(stage, videoId));
      return;
    }

    let autoplay = false;
    try {
      autoplay = new URL(currentIframe.src, window.location.href).searchParams.get('autoplay') === '1';
    } catch (error) {}

    const desiredSrc = standardEmbedUrl(videoId, autoplay);
    if (currentIframe.src !== desiredSrc) currentIframe.src = desiredSrc;
    currentIframe.title ||= 'YouTube video player';
    currentIframe.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
    currentIframe.referrerPolicy = 'strict-origin-when-cross-origin';
    currentIframe.setAttribute('allowfullscreen', '');
    currentIframe.dataset.standardYoutubePlayer = 'true';
  }

  function tuneGalleryLightbox(target){
    if (!(target instanceof Element) || target.id !== 'work-gallery-lightbox') return;

    target.querySelector('.lightbox-close')?.remove();
    if (target.dataset.desktopEscOnlyBound === 'true') return;
    target.dataset.desktopEscOnlyBound = 'true';

    target.addEventListener('click', (event) => {
      const desktopPointer = window.matchMedia('(pointer:fine)').matches;
      if (desktopPointer && event.target === target) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    }, true);
  }

  function inspect(root){
    if (!(root instanceof Element) && root !== document) return;

    if (root instanceof Element && root.classList.contains('yt-stage')) normalizeYouTubeStage(root);
    root.querySelectorAll?.('.yt-stage').forEach(normalizeYouTubeStage);

    if (root instanceof Element && root.id === 'work-gallery-lightbox') tuneGalleryLightbox(root);
    root.querySelectorAll?.('#work-gallery-lightbox').forEach(tuneGalleryLightbox);
  }

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
