/*
  Portfolio media interaction layer
  ---------------------------------
  Visual styling lives in site.css. YouTube playback is owned by each renderer
  and is intentionally not rewritten here. This module only keeps gallery
  lightbox desktop closing behavior.
*/

(function initPortfolioUiOverrides(){
  if (window.__PORTFOLIO_UI_OVERRIDES_LOADED__) return;
  window.__PORTFOLIO_UI_OVERRIDES_LOADED__ = true;

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
