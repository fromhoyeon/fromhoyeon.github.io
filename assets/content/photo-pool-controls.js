/*
  Keep Selected Photography on one randomized Sanity-backed deck for a limited session.
  Only the current 12-photo batch is rendered. Reaching the final image prepares the
  next batch, so a deck does not repeat photos before it is exhausted.
*/

(function installRemotePhotoPoolControls(){
  if (window.__REMOTE_PHOTO_POOL_CONTROLS__) return;
  window.__REMOTE_PHOTO_POOL_CONTROLS__ = true;

  if (!window.SANITY_CONTENT?.isEnabled?.() || typeof window.SANITY_CONTENT.fetchPortfolioPhotos !== 'function') return;
  if (typeof createPhotoSet !== 'function' || typeof reshuffleFromLightboxEnd !== 'function') return;

  const BATCH_SIZE = 12;
  const SESSION_KEY = 'hoyeon-selected-photography-deck-v1';
  const SESSION_TTL_MS = 2 * 60 * 60 * 1000;
  const FULL_PRELOAD_COUNT = 1;
  const RECENT_THUMBNAIL_MS = 2600;

  let remotePoolPromise = null;
  let deck = [];
  let currentBatchStart = 0;
  let preparedBatchStart = null;
  let pageStatus = null;
  let recentThumbnailTimer = null;

  function ensureStyles(){
    if (document.querySelector('#photo-pool-offline-styles')) return;
    const style = document.createElement('style');
    style.id = 'photo-pool-offline-styles';
    style.textContent = `
      .photo-pool-offline{min-height:120px;display:grid;place-items:center;border:1px solid var(--line);color:var(--muted);font-size:10px;letter-spacing:.04em;text-transform:uppercase}
      .photo-actions{display:flex!important;flex-direction:column;justify-content:center!important;align-items:center!important;gap:9px!important;margin-top:18px!important}
      .photo-page-status{font-size:10px;line-height:1;letter-spacing:.08em;text-transform:uppercase;color:var(--muted);font-variant-numeric:tabular-nums;user-select:none}
      #shuffle-photos{display:inline-flex!important;align-items:center;justify-content:center;gap:7px;padding:7px 10px 6px!important;border:1px solid var(--fg)!important;background:#fff!important;color:var(--fg)!important;font-size:10px!important;font-weight:500!important;letter-spacing:.06em!important;text-transform:uppercase}
      #shuffle-photos:hover,#shuffle-photos:focus-visible{border-color:var(--fg)!important;background:var(--fg)!important;color:#fff!important}
      #shuffle-photos:focus-visible{outline:2px solid var(--accent-blue-soft)!important;outline-offset:2px}
      #shuffle-photos:disabled{opacity:.4;cursor:wait}
      .photo-shuffle-icon{width:13px;height:13px;display:inline-flex;flex:0 0 auto}
      .photo-shuffle-icon svg{width:13px;height:13px;display:block;fill:none;stroke:currentColor;stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round}
      .photo-cell.photo-recently-viewed::after{content:'';position:absolute;inset:0;z-index:2;pointer-events:none;border:2px solid var(--accent-blue);background:rgba(36,88,211,.07);animation:photoRecentViewed ${RECENT_THUMBNAIL_MS}ms ease-out forwards}
      @keyframes photoRecentViewed{0%,72%{opacity:1}100%{opacity:0}}
    `;
    document.head.appendChild(style);
  }

  function installInterface(){
    const actions = shufflePhotos?.parentElement;
    if (!actions) return;

    pageStatus = document.querySelector('#photo-page-status');
    if (!pageStatus) {
      pageStatus = document.createElement('div');
      pageStatus.id = 'photo-page-status';
      pageStatus.className = 'photo-page-status';
      pageStatus.setAttribute('aria-live', 'polite');
      pageStatus.textContent = 'PAGE <1 / 1>';
      actions.insertBefore(pageStatus, shufflePhotos);
    }

    shufflePhotos.innerHTML = `
      <span class="photo-shuffle-icon" aria-hidden="true">
        <svg viewBox="0 0 16 16" focusable="false">
          <path d="M2 4h2.1c3.8 0 3.8 8 7.8 8H14"/>
          <path d="m11.8 9.8 2.2 2.2-2.2 2.2"/>
          <path d="M2 12h2.1c1.6 0 2.5-1.4 3.3-3"/>
          <path d="M8.7 6.2C9.5 4.9 10.4 4 11.9 4H14"/>
          <path d="m11.8 1.8 2.2 2.2-2.2 2.2"/>
        </svg>
      </span>
      <span>Shuffle order</span>
    `;
    shufflePhotos.setAttribute('aria-label', 'Shuffle the full photography order and return to page 1');
    shufflePhotos.title = 'Shuffle the full photography order and return to page 1';
  }

  function identity(item){
    if (!item) return '';
    return item._id || item.file || item.src || '';
  }

  function totalPages(){
    return Math.max(1, Math.ceil(deck.length / BATCH_SIZE));
  }

  function currentPage(){
    return Math.min(totalPages(), Math.floor(currentBatchStart / BATCH_SIZE) + 1);
  }

  function updatePageStatus(){
    if (!pageStatus) return;
    pageStatus.textContent = `PAGE <${currentPage()} / ${totalPages()}>`;
  }

  function annotateThumbnailCells(){
    const cells = Array.from(photoGrid?.querySelectorAll('.photo-cell') || []);
    cells.forEach((cell, index) => {
      const item = photos[index];
      if (item) cell.dataset.photoId = identity(item);
      else delete cell.dataset.photoId;
    });
  }

  function clearRecentThumbnail(){
    if (recentThumbnailTimer) {
      clearTimeout(recentThumbnailTimer);
      recentThumbnailTimer = null;
    }
    photoGrid?.querySelectorAll('.photo-recently-viewed').forEach((cell) => {
      cell.classList.remove('photo-recently-viewed');
    });
  }

  function markRecentThumbnail(item){
    const itemId = identity(item);
    if (!itemId) return;
    clearRecentThumbnail();
    const cell = Array.from(photoGrid?.querySelectorAll('.photo-cell') || [])
      .find((candidate) => candidate.dataset.photoId === itemId);
    if (!cell) return;
    cell.classList.add('photo-recently-viewed');
    recentThumbnailTimer = setTimeout(() => {
      cell.classList.remove('photo-recently-viewed');
      recentThumbnailTimer = null;
    }, RECENT_THUMBNAIL_MS);
  }

  async function remotePool(){
    if (!remotePoolPromise) {
      remotePoolPromise = window.SANITY_CONTENT.fetchPortfolioPhotos()
        .then((items) => (items || []).filter((item) => item?.src && item?.ratio))
        .catch((error) => {
          remotePoolPromise = null;
          throw error;
        });
    }
    return remotePoolPromise;
  }

  function clearLocalSelection(){
    photos = [];
    lightboxIndex = -1;
    clearRecentThumbnail();
    photoGrid?.replaceChildren();
    if (lightbox?.classList.contains('is-open')) closeLightbox?.();
  }

  function showUnavailable(){
    clearLocalSelection();
    if (shufflePhotos) shufflePhotos.disabled = true;
    if (!photoGrid) return;
    const offline = document.createElement('div');
    offline.className = 'photo-pool-offline';
    offline.textContent = 'OFFLINE';
    photoGrid.replaceChildren(offline);
    photoGrid.dataset.photoPoolState = 'offline';
    if (pageStatus) pageStatus.textContent = 'PAGE <– / –>';
  }

  function readSavedState(pool){
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (!raw) return null;
      const saved = JSON.parse(raw);
      if (!saved?.savedAt || Date.now() - saved.savedAt > SESSION_TTL_MS) {
        localStorage.removeItem(SESSION_KEY);
        return null;
      }

      const poolById = new Map(pool.map((item) => [identity(item), item]));
      const orderedIds = Array.isArray(saved.order) ? saved.order : [];
      if (orderedIds.length !== pool.length) return null;

      const restoredDeck = orderedIds.map((id) => poolById.get(id));
      if (restoredDeck.some((item) => !item)) return null;

      const maxStart = Math.max(0, Math.floor((restoredDeck.length - 1) / BATCH_SIZE) * BATCH_SIZE);
      const batchStart = Math.max(0, Math.min(Number(saved.batchStart) || 0, maxStart));
      return {deck: restoredDeck, batchStart};
    } catch (error) {
      console.warn('[Photography] Could not restore saved deck.', error);
      return null;
    }
  }

  function saveState(){
    if (!deck.length) return;
    try {
      localStorage.setItem(SESSION_KEY, JSON.stringify({
        savedAt: Date.now(),
        order: deck.map(identity),
        batchStart: currentBatchStart
      }));
    } catch (error) {
      console.warn('[Photography] Could not save deck state.', error);
    }
  }

  function preloadImage(src){
    if (!src) return;
    const img = new Image();
    img.decoding = 'async';
    img.src = src;
  }

  function prepareNextBatch(){
    const nextStart = currentBatchStart + BATCH_SIZE;
    if (nextStart >= deck.length) {
      preparedBatchStart = null;
      return false;
    }
    if (preparedBatchStart === nextStart) return true;

    const nextBatch = deck.slice(nextStart, nextStart + BATCH_SIZE);
    nextBatch.forEach((item) => preloadImage(item.src));
    nextBatch.slice(0, FULL_PRELOAD_COUNT).forEach((item) => preloadImage(item.fullSrc || item.src));
    preparedBatchStart = nextStart;
    return true;
  }

  function renderBatch(start, {preservePosition=false}={}){
    if (!deck.length) return false;

    const maxStart = Math.max(0, Math.floor((deck.length - 1) / BATCH_SIZE) * BATCH_SIZE);
    currentBatchStart = Math.max(0, Math.min(start, maxStart));
    photos = deck.slice(currentBatchStart, currentBatchStart + BATCH_SIZE);
    preparedBatchStart = null;
    lightboxIndex = -1;
    clearRecentThumbnail();

    const anchorTop = preservePosition ? photoGrid.getBoundingClientRect().top : null;
    delete photoGrid.dataset.photoPoolState;
    layoutPhotos();
    restoreGalleryViewport(anchorTop);
    updatePageStatus();
    saveState();
    return true;
  }

  async function initializeDeck({preservePosition=false, forceShuffle=false}={}){
    const pool = await remotePool();
    if (!pool.length) {
      showUnavailable();
      return false;
    }
    if (photoShuffleInProgress) return true;

    photoShuffleInProgress = true;
    shufflePhotos.disabled = true;
    if (preservePosition) shufflePhotos.blur();

    try {
      const restored = forceShuffle ? null : readSavedState(pool);
      deck = restored?.deck || shuffled(pool);
      currentBatchStart = restored?.batchStart || 0;
      return renderBatch(currentBatchStart, {preservePosition});
    } finally {
      shufflePhotos.disabled = false;
      photoShuffleInProgress = false;
    }
  }

  async function shuffleFromBeginning({preservePosition=true}={}){
    const pool = await remotePool();
    if (!pool.length) {
      showUnavailable();
      return false;
    }
    if (photoShuffleInProgress) return true;

    photoShuffleInProgress = true;
    shufflePhotos.disabled = true;
    shufflePhotos.blur();

    try {
      deck = shuffled(pool);
      currentBatchStart = 0;
      return renderBatch(0, {preservePosition});
    } finally {
      shufflePhotos.disabled = false;
      photoShuffleInProgress = false;
    }
  }

  function advanceFromLightboxEnd(){
    if (!photos.length || lightboxIndex < photos.length - 1) return false;

    const nextStart = currentBatchStart + BATCH_SIZE;
    if (nextStart >= deck.length) {
      showLightboxMessage('Last image', 1400);
      return false;
    }

    const anchorTop = photoGrid.getBoundingClientRect().top;
    currentBatchStart = nextStart;
    photos = deck.slice(currentBatchStart, currentBatchStart + BATCH_SIZE);
    preparedBatchStart = null;
    clearRecentThumbnail();
    layoutPhotos();
    restoreGalleryViewport(anchorTop);
    updatePageStatus();
    saveState();

    if (lightbox.classList.contains('is-open')) {
      lightboxIndex = 0;
      showLightboxIndex(0);
      showLightboxMessage(`Page ${currentPage()} / ${totalPages()}`, 1500, 'info');
    } else {
      lightboxIndex = -1;
    }
    return true;
  }

  const prototypeLayoutPhotos = layoutPhotos;
  layoutPhotos = function(){
    prototypeLayoutPhotos();
    annotateThumbnailCells();
  };

  const prototypeShowLightboxIndex = showLightboxIndex;
  showLightboxIndex = function(index){
    clearRecentThumbnail();
    prototypeShowLightboxIndex(index);
    if (lightboxIndex === photos.length - 1) prepareNextBatch();
  };

  const prototypeCloseLightbox = closeLightbox;
  closeLightbox = function(){
    const closedItem = lightboxIndex >= 0 ? photos[lightboxIndex] : null;
    prototypeCloseLightbox();
    if (closedItem) requestAnimationFrame(() => markRecentThumbnail(closedItem));
  };

  stepLightbox = function(direction){
    if (!lightbox.classList.contains('is-open') || !photos.length) return;

    if (direction < 0) {
      if (lightboxIndex <= 0) {
        showLightboxMessage(`First image · 1 / ${photos.length}`);
        return;
      }
      const nextIndex = lightboxIndex - 1;
      showLightboxIndex(nextIndex);
      if (nextIndex === 0) showLightboxMessage(`First image · 1 / ${photos.length}`);
      return;
    }

    if (direction > 0) {
      if (lightboxIndex >= photos.length - 1) {
        advanceFromLightboxEnd();
        return;
      }
      showLightboxIndex(lightboxIndex + 1);
    }
  };

  createPhotoSet = async function(options={}){
    try {
      if (options.forceShuffle) return await shuffleFromBeginning(options);
      return await initializeDeck(options);
    } catch (error) {
      console.warn('[Photography] Remote photo pool unavailable.', error);
      showUnavailable();
      return false;
    }
  };

  reshuffleFromLightboxEnd = async function(){
    try {
      advanceFromLightboxEnd();
    } catch (error) {
      console.warn('[Photography] Could not advance photo deck.', error);
    }
  };

  // The prototype and the Sanity bridge both registered click handlers historically.
  // Capture first so only this explicit deck reset runs once.
  shufflePhotos.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopImmediatePropagation();
    createPhotoSet({preservePosition:true, forceShuffle:true});
  }, {capture:true});

  ensureStyles();
  installInterface();

  clearLocalSelection();
  shufflePhotos.disabled = true;

  initializeDeck().catch((error) => {
    console.warn('[Photography] Could not load remote photo pool.', error);
    showUnavailable();
  });
})();