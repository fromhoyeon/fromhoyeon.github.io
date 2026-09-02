/*
  Current prototype bridge.
  This is deliberately separate from the generic Sanity client so the website
  can later replace or remove this prototype without changing the data layer.
*/

(async function connectPrototypeToSanity(){
  if (!window.SANITY_CONTENT?.isEnabled()) return;

  function resolvePhotoDimensions(item){
    if (item.ratio && item.width && item.height) return Promise.resolve(item);

    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve({
        ...item,
        width: img.naturalWidth,
        height: img.naturalHeight,
        ratio: img.naturalWidth / img.naturalHeight
      });
      img.onerror = reject;
      img.src = item.src;
    });
  }

  try {
    const rawPhotos = await window.SANITY_CONTENT.fetchPortfolioPhotos();
    if (!rawPhotos.length) return;

    const loaded = await Promise.allSettled(rawPhotos.map(resolvePhotoDimensions));
    const remotePhotos = loaded
      .filter((item) => item.status === 'fulfilled')
      .map((item) => item.value);

    if (!remotePhotos.length) return;

    const renderRemoteSelection = () => {
      const count = Math.min(12, remotePhotos.length);
      photos = shuffled(remotePhotos).slice(0, count);

      const meta = document.querySelector('#photo .work-meta');
      if (meta) meta.innerHTML = `${count} / ${remotePhotos.length} IMAGES<br>NO CROP`;

      layoutPhotos();
    };

    if (typeof shufflePhotos !== 'undefined' && typeof createPhotoSet === 'function') {
      shufflePhotos.removeEventListener('click', createPhotoSet);
      shufflePhotos.addEventListener('click', renderRemoteSelection);
    }

    if (typeof openLightbox === 'function') {
      openLightbox = function openRemoteLightbox(item){
        lightboxImage.src = item.fullSrc || item.src;
        lightboxImage.alt = item.alt || item.title || item.file || '';
        lightbox.classList.add('is-open');
        lightbox.setAttribute('aria-hidden', 'false');
        document.body.classList.add('lightbox-open');
        lightboxClose.focus();
      };
    }

    renderRemoteSelection();
  } catch (error) {
    console.warn('[Sanity] Using local photo pool fallback.', error);
  }
})();
