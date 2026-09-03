/*
  Lightweight presentation controls
  ---------------------------------
  White/black color-set switch lives in the footer area.
  Enlarged-image spacing is read from Sanity Site Copy > Presentation.
  Desktop lightboxes gain side click zones and mouse swipe navigation.
*/

(function initPresentationControls(){
  if (window.__PRESENTATION_CONTROLS_LOADED__) return;
  window.__PRESENTATION_CONTROLS_LOADED__ = true;

  const root = document.documentElement;
  const STORAGE_KEY = 'hoyeon-site-color-set';

  function clamp(value, min, max){
    return Math.max(min, Math.min(max, value));
  }

  function ensureStyles(){
    if (document.querySelector('#presentation-controls-styles')) return;
    const style = document.createElement('style');
    style.id = 'presentation-controls-styles';
    style.textContent = `
      :root{
        --xl:84px;
        --lightbox-pad:24px;
        --lightbox-pad-double:48px;
      }
      :root[data-site-theme="white"]{
        --bg:#fff;
        --fg:#111;
        --muted:#6a6a66;
        --line:#bdbdb7;
        --panel:#e6e6e6;
        --topbar-bg:rgba(255,255,255,.96);
      }
      :root[data-site-theme="black"]{
        --bg:#0b0b0b;
        --fg:#f2f2ef;
        --muted:#9a9a95;
        --line:#41413f;
        --panel:#20201f;
        --topbar-bg:rgba(11,11,11,.96);
      }
      .topbar{background:var(--topbar-bg)!important}
      .photo-cell{background:var(--panel)!important}
      .lightbox{background:var(--bg)!important;color:var(--fg)!important;padding:var(--lightbox-pad)!important}
      .lightbox img{max-width:calc(100vw - var(--lightbox-pad-double))!important;max-height:calc(100svh - var(--lightbox-pad-double))!important}
      .lightbox-close{background:var(--bg)!important;color:var(--fg)!important;border-color:var(--fg)!important}
      .theme-compare{padding:10px 0 var(--m);display:flex;justify-content:space-between;align-items:center;gap:var(--m);border-top:1px solid var(--line);font-size:10px;color:var(--muted);text-transform:uppercase}
      .theme-compare-actions{display:flex;gap:6px}
      .theme-compare button{appearance:none;border:1px solid var(--line);background:transparent;color:var(--fg);padding:5px 7px 4px;cursor:pointer;font:inherit;text-transform:uppercase}
      .theme-compare button[aria-pressed="true"]{background:var(--fg);color:var(--bg);border-color:var(--fg)}
      .sanity-content-blocks{gap:40px!important}
      .description{padding-top:20px}
      .lightbox-nav-zone{display:none;position:absolute;top:0;bottom:0;width:28%;z-index:100;appearance:none;border:0;background:transparent;color:var(--fg);padding:0;cursor:pointer}
      .lightbox-nav-zone[data-direction="prev"]{left:0;cursor:w-resize}
      .lightbox-nav-zone[data-direction="next"]{right:0;cursor:e-resize}
      .lightbox-nav-zone::after{position:absolute;top:50%;transform:translateY(-50%);font-size:22px;font-weight:300;opacity:0;transition:opacity .12s ease}
      .lightbox-nav-zone[data-direction="prev"]::after{content:'‹';left:18px}
      .lightbox-nav-zone[data-direction="next"]::after{content:'›';right:18px}
      .lightbox-nav-zone:hover::after,.lightbox-nav-zone:focus-visible::after{opacity:.55}
      .lightbox-nav-zone:focus-visible{outline:1px solid var(--line);outline-offset:-1px}
      @media (min-width:800px){.lightbox-nav-zone{display:block}}
      @media (max-width:620px){
        :root{--xl:60px}
        .theme-compare{padding-bottom:12px}
        .sanity-content-blocks{gap:30px!important}
        .description{padding-top:var(--m)}
      }
    `;
    document.head.appendChild(style);
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
    document.dispatchEvent(new KeyboardEvent('keydown', {key, bubbles: true}));
  }

  function enhanceLightbox(lightbox){
    if (!lightbox || lightbox.dataset.desktopNavEnhanced === 'true') return;
    lightbox.dataset.desktopNavEnhanced = 'true';

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
      lightbox.appendChild(button);
    });

    let pointerStartX = null;
    let pointerStartY = null;
    let suppressClick = false;

    lightbox.addEventListener('pointerdown', (event) => {
      if (event.pointerType !== 'mouse' || event.button !== 0) return;
      pointerStartX = event.clientX;
      pointerStartY = event.clientY;
    }, true);

    lightbox.addEventListener('pointerup', (event) => {
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

    lightbox.addEventListener('click', (event) => {
      if (!suppressClick) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      suppressClick = false;
    }, true);
  }

  function enhanceKnownLightboxes(){
    document.querySelectorAll('.lightbox').forEach(enhanceLightbox);
  }

  ensureStyles();
  makeThemeControls();
  applyLightboxPadding();
  enhanceKnownLightboxes();

  let savedTheme = 'black';
  try { savedTheme = localStorage.getItem(STORAGE_KEY) || 'black'; } catch (error) {}
  setTheme(savedTheme, false);

  window.addEventListener('sitecopychange', (event) => applyLightboxPadding(event.detail || window.SITE_COPY));
  window.addEventListener('resize', () => applyLightboxPadding(window.SITE_COPY));

  const lightboxObserver = new MutationObserver((mutations) => {
    if (mutations.some((mutation) => mutation.addedNodes.length)) enhanceKnownLightboxes();
  });
  lightboxObserver.observe(document.body, {childList: true, subtree: true});
})();
