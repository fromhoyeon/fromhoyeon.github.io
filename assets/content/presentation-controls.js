/*
  Lightweight presentation controls
  ---------------------------------
  White/black color-set switch is a temporary comparison tool rendered just before About.
  Photo row spacing is read from Sanity Site Copy > Presentation.
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
      .lightbox{background:var(--bg)!important;color:var(--fg)!important}
      .lightbox-close{background:var(--bg)!important;color:var(--fg)!important;border-color:var(--fg)!important}
      .photo-row{margin-bottom:var(--photo-row-gap,12px)!important}
      .photo-row:last-child{margin-bottom:0!important}
      .sanity-gallery-grid{row-gap:var(--photo-row-gap,12px)!important}
      .theme-compare{padding:0 0 var(--l);display:flex;justify-content:space-between;align-items:center;gap:var(--m);font-size:10px;color:var(--muted);text-transform:uppercase}
      .theme-compare-actions{display:flex;gap:6px}
      .theme-compare button{appearance:none;border:1px solid var(--line);background:transparent;color:var(--fg);padding:5px 7px 4px;cursor:pointer;font:inherit;text-transform:uppercase}
      .theme-compare button[aria-pressed="true"]{background:var(--fg);color:var(--bg);border-color:var(--fg)}
      @media (max-width:620px){.theme-compare{padding-bottom:var(--m)}}
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
    const about = document.querySelector('#about');
    if (!about?.parentNode) return;

    const controls = document.createElement('div');
    controls.className = 'shell theme-compare';
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
    about.parentNode.insertBefore(controls, about);
  }

  function applyPhotoSpacing(source = window.SITE_COPY){
    const parsed = Number(source?.presentation?.photoRowGap);
    const gap = Number.isFinite(parsed) ? clamp(Math.round(parsed), 4, 40) : 12;
    root.style.setProperty('--photo-row-gap', `${gap}px`);
  }

  ensureStyles();
  makeThemeControls();
  applyPhotoSpacing();

  let savedTheme = 'black';
  try { savedTheme = localStorage.getItem(STORAGE_KEY) || 'black'; } catch (error) {}
  setTheme(savedTheme, false);

  window.addEventListener('sitecopychange', (event) => applyPhotoSpacing(event.detail || window.SITE_COPY));
})();
