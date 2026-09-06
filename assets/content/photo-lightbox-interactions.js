/*
  Selected Photography lightbox interaction layer.
  - Desktop: explicit close control without changing photo navigation.
  - Mobile: backdrop tap-to-close, pinch zoom and free panning while zoomed.
  - Thumbnail return cue and loading states are styled only by site.css.
*/

(function installPhotoLightboxInteractions(){
  if (window.__PHOTO_LIGHTBOX_INTERACTIONS__) return;
  window.__PHOTO_LIGHTBOX_INTERACTIONS__ = true;

  if (typeof lightbox === 'undefined' || typeof lightboxImage === 'undefined') return;

  const MAX_ZOOM = 5;
  const ZOOM_EPSILON = 1.01;

  let zoomScale = 1;
  let zoomX = 0;
  let zoomY = 0;
  let touchMode = null;
  let pinchStartDistance = 0;
  let pinchStartScale = 1;
  let pinchStartX = 0;
  let pinchStartY = 0;
  let pinchFocusX = 0;
  let pinchFocusY = 0;
  let panStartTouchX = 0;
  let panStartTouchY = 0;
  let panStartX = 0;
  let panStartY = 0;

  function isMobile(){
    return window.matchMedia('(max-width:620px)').matches;
  }

  function clamp(value, min, max){
    return Math.max(min, Math.min(max, value));
  }

  function touchDistance(a, b){
    return Math.hypot(b.clientX - a.clientX, b.clientY - a.clientY);
  }

  function touchMidpoint(a, b){
    return {
      x: (a.clientX + b.clientX) / 2,
      y: (a.clientY + b.clientY) / 2
    };
  }

  function clampPan(){
    if (zoomScale <= ZOOM_EPSILON) {
      zoomX = 0;
      zoomY = 0;
      return;
    }

    const availableWidth = Math.max(1, window.innerWidth - 12);
    const availableHeight = Math.max(1, window.innerHeight - 12);
    const scaledWidth = lightboxImage.clientWidth * zoomScale;
    const scaledHeight = lightboxImage.clientHeight * zoomScale;
    const maxX = Math.max(0, (scaledWidth - availableWidth) / 2);
    const maxY = Math.max(0, (scaledHeight - availableHeight) / 2);

    zoomX = clamp(zoomX, -maxX, maxX);
    zoomY = clamp(zoomY, -maxY, maxY);
  }

  function applyZoom(){
    const zoomed = zoomScale > ZOOM_EPSILON;
    lightbox.classList.toggle('is-zoomed', zoomed);
    lightboxImage.style.transform = zoomed
      ? `translate3d(${zoomX}px, ${zoomY}px, 0) scale(${zoomScale})`
      : '';
  }

  function resetZoom(){
    zoomScale = 1;
    zoomX = 0;
    zoomY = 0;
    touchMode = null;
    applyZoom();
  }

  function beginPan(touch){
    touchMode = 'pan';
    panStartTouchX = touch.clientX;
    panStartTouchY = touch.clientY;
    panStartX = zoomX;
    panStartY = zoomY;
  }

  function installCloseButton(){
    if (lightbox.querySelector('.photo-lightbox-close')) return;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'photo-lightbox-close';
    button.setAttribute('aria-label', 'Close enlarged photograph');
    button.title = 'Close';
    button.innerHTML = `
      <svg viewBox="0 0 18 18" aria-hidden="true" focusable="false">
        <path d="M4 4l10 10M14 4 4 14"/>
      </svg>
    `;
    button.addEventListener('pointerdown', (event) => event.stopPropagation());
    button.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      closeLightbox();
    });
    lightbox.appendChild(button);
  }

  function bindThumbnailLoading(root = document){
    const images = root instanceof HTMLImageElement
      ? [root]
      : Array.from(root.querySelectorAll?.('.photo-cell img') || []);

    images.forEach((img) => {
      if (img.dataset.photoLoadingBound === 'true') return;
      const cell = img.closest('.photo-cell');
      if (!cell) return;
      img.dataset.photoLoadingBound = 'true';

      const finish = () => cell.classList.remove('is-image-loading');
      if (img.complete && img.naturalWidth > 0) {
        finish();
        return;
      }

      cell.classList.add('is-image-loading');
      img.addEventListener('load', finish, {once:true});
      img.addEventListener('error', finish, {once:true});
    });
  }

  function finishLightboxLoading(){
    lightbox.classList.remove('is-image-loading');
  }

  lightboxImage.addEventListener('load', finishLightboxLoading);
  lightboxImage.addEventListener('error', finishLightboxLoading);

  lightboxImage.addEventListener('touchstart', (event) => {
    if (!isMobile()) return;

    if (event.touches.length >= 2) {
      const a = event.touches[0];
      const b = event.touches[1];
      const midpoint = touchMidpoint(a, b);
      touchMode = 'pinch';
      pinchStartDistance = Math.max(1, touchDistance(a, b));
      pinchStartScale = zoomScale;
      pinchStartX = zoomX;
      pinchStartY = zoomY;
      pinchFocusX = midpoint.x - window.innerWidth / 2;
      pinchFocusY = midpoint.y - window.innerHeight / 2;
      swipeStartX = null;
      swipeStartY = null;
      event.preventDefault();
      event.stopPropagation();
      return;
    }

    if (event.touches.length === 1 && zoomScale > ZOOM_EPSILON) {
      beginPan(event.touches[0]);
      swipeStartX = null;
      swipeStartY = null;
      event.preventDefault();
      event.stopPropagation();
      return;
    }

    touchMode = 'swipe';
  }, {passive:false});

  lightboxImage.addEventListener('touchmove', (event) => {
    if (!isMobile()) return;

    if (touchMode === 'pinch' && event.touches.length >= 2) {
      const a = event.touches[0];
      const b = event.touches[1];
      const nextDistance = Math.max(1, touchDistance(a, b));
      const nextScale = clamp(pinchStartScale * (nextDistance / pinchStartDistance), 1, MAX_ZOOM);
      const ratio = nextScale / pinchStartScale;

      zoomScale = nextScale;
      zoomX = pinchFocusX - ratio * (pinchFocusX - pinchStartX);
      zoomY = pinchFocusY - ratio * (pinchFocusY - pinchStartY);
      clampPan();
      applyZoom();
      event.preventDefault();
      event.stopPropagation();
      return;
    }

    if (touchMode === 'pan' && event.touches.length === 1) {
      const touch = event.touches[0];
      zoomX = panStartX + (touch.clientX - panStartTouchX);
      zoomY = panStartY + (touch.clientY - panStartTouchY);
      clampPan();
      applyZoom();
      event.preventDefault();
      event.stopPropagation();
    }
  }, {passive:false});

  lightboxImage.addEventListener('touchend', (event) => {
    if (!isMobile()) return;

    if (touchMode === 'pinch') {
      event.preventDefault();
      event.stopPropagation();
      if (zoomScale <= ZOOM_EPSILON) {
        resetZoom();
        return;
      }
      if (event.touches.length === 1) {
        beginPan(event.touches[0]);
      } else {
        touchMode = null;
        clampPan();
        applyZoom();
      }
      return;
    }

    if (touchMode === 'pan') {
      event.preventDefault();
      event.stopPropagation();
      if (event.touches.length === 0) touchMode = null;
      return;
    }

    touchMode = null;
  }, {passive:false});

  lightboxImage.addEventListener('touchcancel', (event) => {
    if (!isMobile()) return;
    if (touchMode === 'pinch' || touchMode === 'pan') {
      event.preventDefault();
      event.stopPropagation();
    }
    touchMode = null;
  }, {passive:false});

  const baseShowLightboxIndex = showLightboxIndex;
  showLightboxIndex = function(index){
    resetZoom();
    lightbox.classList.add('is-image-loading');
    baseShowLightboxIndex(index);
    if (lightboxImage.complete && lightboxImage.naturalWidth > 0) {
      requestAnimationFrame(finishLightboxLoading);
    }
  };

  const baseCloseLightbox = closeLightbox;
  closeLightbox = function(){
    resetZoom();
    finishLightboxLoading();
    baseCloseLightbox();
  };

  window.addEventListener('resize', () => {
    if (zoomScale <= ZOOM_EPSILON) return;
    clampPan();
    applyZoom();
  });

  const thumbnailObserver = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (!(node instanceof Element)) return;
        bindThumbnailLoading(node);
      });
    });
  });

  installCloseButton();
  bindThumbnailLoading(document);
  if (typeof photoGrid !== 'undefined' && photoGrid) {
    thumbnailObserver.observe(photoGrid, {childList:true, subtree:true});
  }
})();
