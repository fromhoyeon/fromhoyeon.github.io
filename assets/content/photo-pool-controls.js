/*
  Selected Photography remote deck controller.
  One randomized Sanity-backed deck is kept for a limited session and rendered
  12 photographs at a time without repeats until the deck is exhausted.
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
  const RECENT_THUMBNAIL_MS = 1100;

  let remotePoolPromise = null;
  let deck = [];
  let currentBatchStart = 0;
  let preparedBatchStart = null;
  let pageStatus = null;
  let pagePrevButton = null;
  let pageNextButton = null;
  let recentThumbnailTimer = null;

  function installInterface(){
    const actions = shufflePhotos?.parentElement;
    if (!actions) return;

    let pagination = actions.querySelector('.photo-pagination');
    if (!pagination) {
      pagination = document.createElement('div');
      pagination.className = 'photo-pagination';
      pagination.setAttribute('role', 'navigation');
      pagination.setAttribute('aria-label', 'Photography thumbnail pages');

      pagePrevButton = document.createElement('button');
      pagePrevButton.type = 'button';
      pagePrevButton.className = 'photo-page-button photo-page-button-prev';
      pagePrevButton.setAttribute('aria-label', 'Previous photography page');
      pagePrevButton.title = 'Previous page';
      pagePrevButton.textContent = '‹';

      pageStatus = document.createElement('span');
      pageStatus.id = 'photo-page-status';
      pageStatus.className = 'photo-page-status';
      pageStatus.setAttribute('aria-live', 'polite');
      pageStatus.textContent = 'PAGE <1 / 1>';

      pageNextButton = document.createElement('button');
      pageNextButton.type = 'button';
      pageNextButton.className = 'photo-page-button photo-page-button-next';
      pageNextButton.setAttribute('aria-label', 'Next photography page');
      pageNextButton.title = 'Next page';
      pageNextButton.textContent = '›';

      pagination.append(pagePrevButton, pageStatus, pageNextButton);
      actions.insertBefore(pagination, shufflePhotos);
    } else {
      pageStatus = pagination.querySelector('#photo-page-status');
      pagePrevButton = pagination.querySelector('.photo-page-button-prev');
      pageNextButton = pagination.querySelector('.photo-page-button-next');
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

    pagePrevButton?.addEventListener('click', () => moveThumbnailPage(-1));
    pageNextButton?.addEventListener('click', () => moveThumbnailPage(1));
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
    if (pageStatus) pageStatus.textContent = `PAGE <${currentPage()} / ${totalPages()}>`;
    if (pagePrevButton) pagePrevButton.disabled = !deck.length || currentBatchStart <= 0 || photoShuffleInProgress;
    if (pageNextButton) pageNextButton.disabled = !deck.length || currentBatchStart + BATCH_SIZE >= deck.length || photoShuffleInProgress;
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
    if (pagePrevButton) pagePrevButton.disabled = true;
    if (pageNextButton) pageNextButton.disabled = true;
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

  function preparePreviousImage(){
    const previousItem = deck[currentBatchStart - 1];
    if (!previousItem) return false;
    preloadImage(previousItem.fullSrc || previousItem.src);
    return true;
  }

  function renderBatch(start, {preservePosition = false} = {}){
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

  function moveThumbnailPage(direction){
    if (!deck.length || photoShuffleInProgress || !direction) return false;
    const targetStart = currentBatchStart + Math.sign(direction) * BATCH_SIZE;
    if (targetStart < 0 || targetStart >= deck.length) return false;
    return renderBatch(targetStart, {preservePosition:true});
  }

  async function initializeDeck({preservePosition = false, forceShuffle = false} = {}){
    const pool = await remotePool();
    if (!pool.length) {
      showUnavailable();
      return false;
    }
    if (photoShuffleInProgress) return true;

    photoShuffleInProgress = true;
    shufflePhotos.disabled = true;
    updatePageStatus();
    if (preservePosition) shufflePhotos.blur();

    try {
      const restored = forceShuffle ? null : readSavedState(pool);
      deck = restored?.deck || shuffled(pool);
      currentBatchStart = restored?.batchStart || 0;
      return renderBatch(currentBatchStart, {preservePosition});
    } finally {
      shufflePhotos.disabled = false;
      photoShuffleInProgress = false;
      updatePageStatus();
    }
  }

  async function shuffleFromBeginning({preservePosition = true} = {}){
    const pool = await remotePool();
    if (!pool.length) {
      showUnavailable();
      return false;
    }
    if (photoShuffleInProgress) return true;

    photoShuffleInProgress = true;
    shufflePhotos.disabled = true;
    updatePageStatus();
    shufflePhotos.blur();

    try {
      deck = shuffled(pool);
      currentBatchStart = 0;
      return renderBatch(0, {preservePosition});
    } finally {
      shufflePhotos.disabled = false;
      photoShuffleInProgress = false;
      updatePageStatus();
    }
  }

  function moveLightboxToBatch(start, index){
    if (start < 0 || start >= deck.length) return false;

    const anchorTop = photoGrid.getBoundingClientRect().top;
    currentBatchStart = start;
    photos = deck.slice(currentBatchStart, currentBatchStart + BATCH_SIZE);
    preparedBatchStart = null;
    clearRecentThumbnail();
    layoutPhotos();
    restoreGalleryViewport(anchorTop);
    updatePageStatus();
    saveState();

    if (lightbox.classList.contains('is-open')) {
      const targetIndex = Math.max(0, Math.min(index, photos.length - 1));
      lightboxIndex = targetIndex;
      showLightboxIndex(targetIndex);
      showLightboxMessage(`Page ${currentPage()} / ${totalPages()}`, 1500, 'info');
    } else {
      lightboxIndex = -1;
    }
    return true;
  }

  function advanceFromLightboxEnd(){
    if (!photos.length || lightboxIndex < photos.length - 1) return false;

    const nextStart = currentBatchStart + BATCH_SIZE;
    if (nextStart >= deck.length) {
      showLightboxMessage('Last image', 1400);
      return false;
    }

    return moveLightboxToBatch(nextStart, 0);
  }

  function retreatFromLightboxStart(){
    if (!photos.length || lightboxIndex > 0) return false;

    const previousStart = currentBatchStart - BATCH_SIZE;
    if (previousStart < 0) {
      showLightboxMessage(`First image · 1 / ${deck.length}`);
      return false;
    }

    const previousLength = Math.min(BATCH_SIZE, deck.length - previousStart);
    return moveLightboxToBatch(previousStart, previousLength - 1);
  }

  const baseLayoutPhotos = layoutPhotos;
  layoutPhotos = function(){
    baseLayoutPhotos();
    annotateThumbnailCells();
  };

  const baseShowLightboxIndex = showLightboxIndex;
  showLightboxIndex = function(index){
    clearRecentThumbnail();
    baseShowLightboxIndex(index);
    if (lightboxIndex === photos.length - 1) prepareNextBatch();
    if (lightboxIndex === 0) preparePreviousImage();
  };

  const baseCloseLightbox = closeLightbox;
  closeLightbox = function(){
    const closedItem = lightboxIndex >= 0 ? photos[lightboxIndex] : null;
    baseCloseLightbox();
    if (closedItem) requestAnimationFrame(() => markRecentThumbnail(closedItem));
  };

  stepLightbox = function(direction){
    if (!lightbox.classList.contains('is-open') || !photos.length) return;

    if (direction < 0) {
      if (lightboxIndex <= 0) {
        retreatFromLightboxStart();
        return;
      }
      const nextIndex = lightboxIndex - 1;
      showLightboxIndex(nextIndex);
      if (nextIndex === 0 && currentBatchStart === 0) {
        showLightboxMessage(`First image · 1 / ${deck.length}`);
      }
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

  createPhotoSet = async function(options = {}){
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

  // Capture first so the base click handler does not perform a second reset.
  shufflePhotos.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopImmediatePropagation();
    createPhotoSet({preservePosition:true, forceShuffle:true});
  }, {capture:true});

  installInterface();
  clearLocalSelection();
  shufflePhotos.disabled = true;
  updatePageStatus();

  initializeDeck().catch((error) => {
    console.warn('[Photography] Could not load remote photo pool.', error);
    showUnavailable();
  });
})();
