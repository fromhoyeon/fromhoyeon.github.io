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
  const FULL_PRELOAD_COUNT = 3;

  let remotePoolPromise = null;
  let deck = [];
  let currentBatchStart = 0;
  let preparedBatchStart = null;

  function ensureStyles(){
    if (document.querySelector('#photo-pool-offline-styles')) return;
    const style = document.createElement('style');
    style.id = 'photo-pool-offline-styles';
    style.textContent = `
      .photo-pool-offline{min-height:120px;display:grid;place-items:center;border:1px solid var(--line);color:var(--muted);font-size:10px;letter-spacing:.04em;text-transform:uppercase}
      .photo-actions{justify-content:center!important}
    `;
    document.head.appendChild(style);
  }

  function identity(item){
    if (!item) return '';
    return item._id || item.file || item.src || '';
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

    const anchorTop = preservePosition ? photoGrid.getBoundingClientRect().top : null;
    delete photoGrid.dataset.photoPoolState;
    layoutPhotos();
    restoreGalleryViewport(anchorTop);
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
    layoutPhotos();
    restoreGalleryViewport(anchorTop);
    saveState();

    if (lightbox.classList.contains('is-open')) {
      lightboxIndex = 0;
      showLightboxIndex(0);
    } else {
      lightboxIndex = -1;
    }
    return true;
  }

  const prototypeShowLightboxIndex = showLightboxIndex;
  showLightboxIndex = function(index){
    prototypeShowLightboxIndex(index);
    if (lightboxIndex === photos.length - 1) prepareNextBatch();
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
  shufflePhotos.textContent = 'Shuffle';

  clearLocalSelection();
  shufflePhotos.disabled = true;

  initializeDeck().catch((error) => {
    console.warn('[Photography] Could not load remote photo pool.', error);
    showUnavailable();
  });
})();
