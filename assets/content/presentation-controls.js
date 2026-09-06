/*
  Presentation controls
  ---------------------
  Theme state, lightbox spacing and desktop lightbox navigation live here.
  All visual colors and component styling live in site.css.
*/

(function initPresentationControls(){
  if (window.__PRESENTATION_CONTROLS_LOADED__) return;
  window.__PRESENTATION_CONTROLS_LOADED__ = true;

  const root = document.documentElement;
  const STORAGE_KEY = 'hoyeon-site-color-set';

  function clamp(value, min, max){
    return Math.max(min, Math.min(max, value));
  }

  function setTheme(theme, persist = true){
    const resolved = theme === 'black' ? 'black' : 'white';
    root.dataset.siteTheme = resolved;
    document.querySelectorAll('[data-site-theme-choice]').forEach((button) => {
      button.setAttribute('aria-pressed', button.dataset.siteThemeChoice === resolved ? 'true' : 'false');
    });
    if (persist) {
      try { localStorage.setItem(STORAGE_KEY, resolved); } catch (error) {}
    }
  }

  function makeThemeControls(){
    if (document.querySelector('.theme-compare')) return;
    const links = document.querySelector('#links');
    const footer = links?.querySelector('footer');
    if (!links || !footer) return;

    const controls = document.createElement('div');
    controls.className = 'theme-compare';
    controls.setAttribute('aria-label', 'Color set preview');

    const label = document.createElement('span');
    label.textContent = 'Color set';

    const actions = document.createElement('div');
    actions.className = 'theme-compare-actions';

    ['white', 'black'].forEach((theme) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.dataset.siteThemeChoice = theme;
      button.textContent = theme;
      button.addEventListener('click', () => setTheme(theme));
      actions.appendChild(button);
    });

    controls.append(label, actions);
    links.insertBefore(controls, footer);
  }

  function applyLightboxPadding(source = window.SITE_COPY){
    const parsed = Number(source?.presentation?.lightboxPadding);
    const desktop = Number.isFinite(parsed) ? clamp(Math.round(parsed), 8, 64) : 24;
    const mobile = clamp(Math.round(desktop * 0.6), 8, 36);
    const isMobile = window.matchMedia('(max-width:620px)').matches;
    const padding = isMobile ? mobile : desktop;
    root.style.setProperty('--lightbox-pad', `${padding}px`);
    root.style.setProperty('--lightbox-pad-double', `${padding * 2}px`);
  }

  function dispatchLightboxStep(direction){
    const key = direction < 0 ? 'ArrowLeft' : 'ArrowRight';
    document.dispatchEvent(new KeyboardEvent('keydown', {key, bubbles:true}));
  }

  function enhanceLightbox(target){
    if (!target || target.dataset.desktopNavEnhanced === 'true') return;
    target.dataset.desktopNavEnhanced = 'true';

    ['prev', 'next'].forEach((direction) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'lightbox-nav-zone';
      button.dataset.direction = direction;
      button.setAttribute('aria-label', direction === 'prev' ? 'Previous image' : 'Next image');
      button.addEventListener('click', (event) => {
        event.stopPropagation();
        dispatchLightboxStep(direction === 'prev' ? -1 : 1);
      });
      target.appendChild(button);
    });

    let pointerStartX = null;
    let pointerStartY = null;
    let suppressClick = false;

    target.addEventListener('pointerdown', (event) => {
      if (event.pointerType !== 'mouse' || event.button !== 0) return;
      pointerStartX = event.clientX;
      pointerStartY = event.clientY;
    }, true);

    target.addEventListener('pointerup', (event) => {
      if (event.pointerType !== 'mouse' || pointerStartX === null || pointerStartY === null) return;
      const dx = event.clientX - pointerStartX;
      const dy = event.clientY - pointerStartY;
      pointerStartX = null;
      pointerStartY = null;
      if (Math.abs(dx) < 70 || Math.abs(dx) <= Math.abs(dy)) return;
      suppressClick = true;
      dispatchLightboxStep(dx < 0 ? 1 : -1);
      setTimeout(() => { suppressClick = false; }, 0);
    }, true);

    target.addEventListener('click', (event) => {
      if (!suppressClick) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      suppressClick = false;
    }, true);
  }

  function enhanceKnownLightboxes(){
    document.querySelectorAll('.lightbox').forEach(enhanceLightbox);
  }

  makeThemeControls();
  applyLightboxPadding();
  enhanceKnownLightboxes();

  let savedTheme = 'white';
  try { savedTheme = localStorage.getItem(STORAGE_KEY) || 'white'; } catch (error) {}
  setTheme(savedTheme, false);

  window.addEventListener('sitecopychange', (event) => applyLightboxPadding(event.detail || window.SITE_COPY));
  window.addEventListener('resize', () => applyLightboxPadding(window.SITE_COPY));

  const lightboxObserver = new MutationObserver((mutations) => {
    if (mutations.some((mutation) => mutation.addedNodes.length)) enhanceKnownLightboxes();
  });
  lightboxObserver.observe(document.body, {childList:true, subtree:true});
})();
