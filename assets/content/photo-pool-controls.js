/*
  Keep every photography shuffle path on the active Sanity photo pool.
  The inline prototype still contains a small local sample list as an offline fallback,
  so this layer overrides shuffle behavior only when the remote pool is available.
*/

(function installRemotePhotoPoolControls(){
  if (window.__REMOTE_PHOTO_POOL_CONTROLS__) return;
  window.__REMOTE_PHOTO_POOL_CONTROLS__ = true;

  if (!window.SANITY_CONTENT?.isEnabled?.() || typeof window.SANITY_CONTENT.fetchPortfolioPhotos !== 'function') return;
  if (typeof createPhotoSet !== 'function' || typeof reshuffleFromLightboxEnd !== 'function') return;

  const localCreatePhotoSet = createPhotoSet;
  const localReshuffleFromLightboxEnd = reshuffleFromLightboxEnd;
  let remotePoolPromise = null;

  function identity(item){
    if (!item) return '';
    return item._id || item.file || item.src || '';
  }

  function resolvePhotoDimensions(item){
    if (item?.ratio && item?.width && item?.height) return Promise.resolve(item);
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve({
        ...item,
        width: img.naturalWidth,
        height: img.naturalHeight,
        ratio: img.naturalWidth / img.naturalHeight
      });
      img.onerror = reject;
      img.src = item?.src || '';
    });
  }

  async function remotePool(){
    if (!remotePoolPromise) {
      remotePoolPromise = window.SANITY_CONTENT.fetchPortfolioPhotos()
        .then(async (items) => {
          const loaded = await Promise.allSettled((items || []).map(resolvePhotoDimensions));
          return loaded
            .filter((result) => result.status === 'fulfilled')
            .map((result) => result.value)
            .filter((item) => item?.src && item?.ratio);
        })
        .catch((error) => {
          remotePoolPromise = null;
          throw error;
        });
    }
    return remotePoolPromise;
  }

  function requestedCount(poolLength){
    const currentCount = Array.isArray(photos) && photos.length ? photos.length : 12;
    return Math.max(1, Math.min(currentCount, poolLength));
  }

  async function renderRemoteSelection({preservePosition=false}={}){
    const pool = await remotePool();
    if (!pool.length) return false;
    if (photoShuffleInProgress) return true;

    photoShuffleInProgress = true;
    shufflePhotos.disabled = true;
    if (preservePosition) shufflePhotos.blur();
    const anchorTop = preservePosition ? photoGrid.getBoundingClientRect().top : null;

    try {
      const count = requestedCount(pool.length);
      photos = shuffled(pool).slice(0, count);
      lightboxIndex = -1;
      layoutPhotos();
      restoreGalleryViewport(anchorTop);
      return true;
    } finally {
      shufflePhotos.disabled = false;
      photoShuffleInProgress = false;
    }
  }

  createPhotoSet = async function(options={}){
    try {
      const handled = await renderRemoteSelection(options);
      if (handled) return;
    } catch (error) {
      console.warn('[Photography] Remote shuffle unavailable; using local fallback.', error);
    }
    return localCreatePhotoSet(options);
  };

  reshuffleFromLightboxEnd = async function(){
    if (photoShuffleInProgress || !photos.length) return;
    const current = photos[lightboxIndex];
    if (!current) return;

    let pool;
    try {
      pool = await remotePool();
    } catch (error) {
      console.warn('[Photography] Remote end shuffle unavailable; using local fallback.', error);
      return localReshuffleFromLightboxEnd();
    }
    if (!pool.length) return localReshuffleFromLightboxEnd();

    photoShuffleInProgress = true;
    shufflePhotos.disabled = true;
    const anchorTop = photoGrid.getBoundingClientRect().top;
    showLightboxMessage('Last image\nShuffling selection…', 2200, 'info');

    try {
      const count = requestedCount(pool.length);
      const currentId = identity(current);
      const candidates = pool.filter((item) => identity(item) !== currentId);
      const nextPhotos = [current, ...shuffled(candidates).slice(0, Math.max(0, count - 1))];

      if (nextPhotos.length < 2) {
        showLightboxMessage('Last image\nShuffle unavailable', 1800);
        return;
      }

      photos = nextPhotos;
      layoutPhotos();
      restoreGalleryViewport(anchorTop);

      if (lightbox.classList.contains('is-open')) {
        lightboxIndex = 0;
        showLightboxIndex(0);
        showLightboxMessage(`Last image\nSelection shuffled · 1 / ${photos.length}`, 1800, 'success');
      } else {
        lightboxIndex = -1;
      }
    } finally {
      shufflePhotos.disabled = false;
      photoShuffleInProgress = false;
    }
  };

  // The prototype and the Sanity bridge both registered click handlers historically.
  // Capture the click first so only the unified createPhotoSet path runs once.
  shufflePhotos.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopImmediatePropagation();
    createPhotoSet({preservePosition:true});
  }, {capture:true});

  // Warm the pool so the first user shuffle is immediate in normal conditions.
  remotePool().catch((error) => {
    console.warn('[Photography] Could not warm remote photo pool.', error);
  });
})();
