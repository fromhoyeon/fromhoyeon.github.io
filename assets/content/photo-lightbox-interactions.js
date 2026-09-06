/*
  Selected Photography lightbox interaction layer.
  - Desktop: provide an explicit close control without changing photo navigation.
  - Mobile: keep backdrop tap-to-close, add pinch zoom and free panning while zoomed.
  - Keep the recently closed thumbnail cue as a theme-matched fade.
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

  function ensureStyles(){
    if (document.querySelector('#photo-lightbox-interaction-styles')) return;
    const style = document.createElement('style');
    style.id = 'photo-lightbox-interaction-styles';
    style.textContent = `
      :root{--photo-recent-overlay:rgba(255,255,255,1)}
      :root[data-site-theme="white"]{--photo-recent-overlay:rgba(255,255,255,1)}
      :root[data-site-theme="black"]{--photo-recent-overlay:rgba(0,0,0,1)}
      #shuffle-photos{
        border-color:var(--fg)!important;
        background:var(--bg)!important;
        color:var(--fg)!important;
      }
      #shuffle-photos:hover,#shuffle-photos:focus-visible{
        border-color:var(--fg)!important;
        background:var(--fg)!important;
        color:var(--bg)!important;
      }
      #shuffle-photos:focus-visible{
        outline:2px solid var(--line)!important;
        outline-offset:2px;
      }
      .photo-cell.photo-recently-viewed::after{
        border:0!important;
        background:var(--photo-recent-overlay)!important;
        animation:photoRecentThemeFade 1100ms linear forwards!important;
      }
      @keyframes photoRecentThemeFade{
        0%,9.0909%{opacity:1}
        100%{opacity:0}
      }
      .photo-lightbox-close{
        position:fixed;
        top:18px;
        right:18px;
        z-index:106;
        width:42px;
        height:42px;
        display:none;
        place-items:center;
        appearance:none;
        border:1px solid var(--fg);
        border-radius:999px;
        padding:0;
        background:var(--bg);
        color:var(--fg);
        cursor:pointer;
        backdrop-filter:blur(6px);
        -webkit-backdrop-filter:blur(6px);
      }
      .photo-lightbox-close:hover,
      .photo-lightbox-close:focus-visible{
        border-color:var(--fg);
        background:var(--fg);
        color:var(--bg);
      }
      .photo-lightbox-close:focus-visible{
        outline:2px solid var(--line);
        outline-offset:3px;
      }
      .photo-lightbox-close svg{
        width:17px;
        height:17px;
        display:block;
        fill:none;
        stroke:currentColor;
        stroke-width:1.5;
        stroke-linecap:round;
      }
      @media (min-width:621px){
        .photo-lightbox-close{display:grid}
      }
      @media (max-width:620px){
        #lightbox-image{
          touch-action:none;
          transform-origin:center center;
          will-change:transform;
        }
        #photo-lightbox.is-zoomed #lightbox-image{cursor:grabbing}
      }
    `;
    document.head.appendChild(style);
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

  const previousShowLightboxIndex = showLightboxIndex;
  showLightboxIndex = function(index){
    resetZoom();
    previousShowLightboxIndex(index);
  };

  const previousCloseLightbox = closeLightbox;
  closeLightbox = function(){
    resetZoom();
    previousCloseLightbox();
  };

  window.addEventListener('resize', () => {
    if (zoomScale <= ZOOM_EPSILON) return;
    clampPan();
    applyZoom();
  });

  ensureStyles();
  installCloseButton();
})();
