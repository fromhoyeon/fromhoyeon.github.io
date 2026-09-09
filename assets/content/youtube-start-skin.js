/*
  Minimal YouTube start skin
  --------------------------
  Before playback, show only the YouTube thumbnail and centered play button.
  After click, replace the poster with the standard YouTube embed using autoplay=1.
  The active YouTube player is not rewritten or customized after playback starts.
*/

(function initYouTubeStartSkin(){
  if (window.__YOUTUBE_START_SKIN_LOADED__) return;
  window.__YOUTUBE_START_SKIN_LOADED__ = true;

  function videoIdFromIframe(iframe){
    if (!iframe?.src) return '';
    try {
      const url = new URL(iframe.src, window.location.href);
      if (url.hostname.replace(/^www\./, '') !== 'youtube.com') return '';
      const parts = url.pathname.split('/').filter(Boolean);
      const embedIndex = parts.indexOf('embed');
      return embedIndex >= 0 ? (parts[embedIndex + 1] || '') : '';
    } catch (error) {
      return '';
    }
  }

  function hasStarted(iframe){
    try {
      return new URL(iframe.src, window.location.href).searchParams.get('autoplay') === '1';
    } catch (error) {
      return false;
    }
  }

  function createPoster(stage, videoId, title){
    const poster = document.createElement('button');
    poster.className = 'yt-poster';
    poster.type = 'button';
    poster.setAttribute('aria-label', stage.getAttribute('aria-label') || `Play ${title || 'YouTube video'}`);

    const image = document.createElement('img');
    image.src = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
    image.alt = '';

    const play = document.createElement('span');
    play.className = 'yt-play';
    play.setAttribute('aria-hidden', 'true');
    play.textContent = '▶';

    poster.append(image, play);
    poster.addEventListener('click', () => {
      const iframe = document.createElement('iframe');
      iframe.title = title || 'YouTube video player';
      iframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1`;
      iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
      iframe.referrerPolicy = 'strict-origin-when-cross-origin';
      iframe.setAttribute('allowfullscreen', '');
      stage.replaceChildren(iframe);
    });

    return poster;
  }

  function normalizeStage(stage){
    if (!(stage instanceof Element) || !stage.classList.contains('yt-stage')) return;
    const iframe = stage.querySelector(':scope > iframe');
    if (!iframe || hasStarted(iframe)) return;

    const videoId = videoIdFromIframe(iframe);
    if (!videoId) return;

    stage.replaceChildren(createPoster(stage, videoId, iframe.title));
  }

  function inspect(root){
    if (!(root instanceof Element) && root !== document) return;
    if (root instanceof Element && root.classList.contains('yt-stage')) normalizeStage(root);
    root.querySelectorAll?.('.yt-stage').forEach(normalizeStage);
  }

  inspect(document);

  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.target instanceof Element) normalizeStage(mutation.target.closest?.('.yt-stage'));
      mutation.addedNodes.forEach((node) => {
        if (node instanceof Element) inspect(node);
      });
    });
  });

  observer.observe(document.documentElement, {childList:true, subtree:true});
})();
