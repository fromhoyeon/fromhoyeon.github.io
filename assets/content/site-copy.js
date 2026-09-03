/*
  Sanity-bound site text bridge
  ----------------------------
  Sanity is the source of truth for editable site text and navigation.
  Local content does not attempt to mirror remote copy.
  Any bound text that has not arrived from Sanity renders as OFFLINE.
*/

window.SITE_COPY = {};

function applyBasePalette(){
  if (document.querySelector('#site-palette-overrides')) return;
  const style = document.createElement('style');
  style.id = 'site-palette-overrides';
  style.textContent = `
    :root:not([data-site-theme]){--bg:#fff;--panel:#e6e6e6}
    .topbar{background:var(--topbar-bg,rgba(255,255,255,.96))}
    .photo-cell{background:var(--panel)}
  `;
  document.head.appendChild(style);
}

applyBasePalette();

const SITE_COPY_BINDINGS = [
  ['site.brand', '.brand'],
  ['intro.title', '.intro h1'],
  ['intro.body', '.intro-copy p'],
  ['intro.meta', '.intro-copy span', true],
  ['index.dual', '.index a[href="#dual"] span:nth-child(2)'],
  ['index.photo', '.index a[href="#photo"] span:nth-child(2)'],
  ['index.dodrei', '.index a[href="#dodrei"] span:nth-child(2)'],
  ['index.moving', '.index a[href="#moving"] span:nth-child(2)'],
  ['dual.title', '#dual .work-title'],
  ['dual.description', '#dual .description p'],
  ['dual.action', '#dual .description .action'],
  ['photo.title', '#photo .work-title'],
  ['photo.helper', '#photo .photo-actions p'],
  ['photo.shuffle', '#shuffle-photos'],
  ['photo.description', '#photo .description p'],
  ['photo.action', '#photo .description .action'],
  ['dodrei.title', '#dodrei .work-title'],
  ['dodrei.description', '#dodrei .description p'],
  ['dodrei.action', '#dodrei .description .action'],
  ['moving.title', '#moving .work-title'],
  ['moving.description', '#moving .description p'],
  ['moving.action', '#moving .description .action'],
  ['about.title', '#about > h2'],
  ['about.practiceLabel', '#about .about-grid > div:nth-child(1) .label'],
  ['about.practice', '#about .about-grid > div:nth-child(1) p:nth-child(2)'],
  ['about.ruleLabel', '#about .about-grid > div:nth-child(2) .label'],
  ['about.rule', '#about .about-grid > div:nth-child(2) p:nth-child(2)'],
  ['links.instagram', '#links .links a:nth-child(1) span:first-child'],
  ['links.youtube', '#links .links a:nth-child(2) span:first-child'],
  ['links.github', '#links .links a:nth-child(3) span:first-child'],
  ['footer.copyright', '#links footer span:nth-child(1)'],
  ['footer.status', '#links footer span:nth-child(2)'],
  ['ui.close', '#lightbox-close']
];

const MULTILINE_COPY_PATHS = new Set([
  'intro.title',
  'intro.body',
  'dual.description',
  'photo.description',
  'dodrei.description',
  'moving.description',
  'about.practice',
  'about.rule'
]);

function getCopyValue(source, path){
  return path.split('.').reduce((value, key) => value && value[key], source);
}

function deepMerge(target, patch){
  if (!patch || typeof patch !== 'object') return target;
  Object.entries(patch).forEach(([key, value]) => {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      if (!target[key] || typeof target[key] !== 'object') target[key] = {};
      deepMerge(target[key], value);
    } else if (value !== undefined && value !== null) {
      target[key] = value;
    }
  });
  return target;
}

window.applySiteCopy = function applySiteCopy(source = window.SITE_COPY){
  const brand = getCopyValue(source, 'site.brand');
  document.title = typeof brand === 'string' && brand ? brand : 'OFFLINE';

  SITE_COPY_BINDINGS.forEach(([path, selector, allowHtml]) => {
    const element = document.querySelector(selector);
    if (!element) return;

    const remoteValue = getCopyValue(source, path);
    const value = typeof remoteValue === 'string' && remoteValue.length ? remoteValue : 'OFFLINE';

    if (MULTILINE_COPY_PATHS.has(path)) element.style.whiteSpace = 'pre-line';
    if (allowHtml) element.innerHTML = value;
    else element.textContent = value;
  });
};

window.applySiteNavigation = function applySiteNavigation(items){
  const nav = document.querySelector('.nav');
  if (!nav) return;

  const validItems = Array.isArray(items)
    ? items.filter((item) => item && typeof item.label === 'string' && item.label && typeof item.href === 'string' && item.href)
    : [];

  if (!validItems.length) {
    const offline = document.createElement('span');
    offline.textContent = 'OFFLINE';
    offline.setAttribute('aria-label', 'Navigation offline');
    nav.replaceChildren(offline);
    return;
  }

  nav.replaceChildren(...validItems.map((item) => {
    const link = document.createElement('a');
    link.textContent = item.label;
    link.href = item.href;
    if (/^https?:\/\//i.test(item.href)) {
      link.target = '_blank';
      link.rel = 'noopener';
    }
    return link;
  }));
};

window.mergeSiteCopy = function mergeSiteCopy(patch){
  deepMerge(window.SITE_COPY, patch);
  window.applySiteCopy(window.SITE_COPY);
  window.dispatchEvent(new CustomEvent('sitecopychange', {detail: window.SITE_COPY}));
};

window.applySiteCopy(window.SITE_COPY);
window.applySiteNavigation([]);

function loadSiteScript(src){
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

async function bootOptionalSanityLayer(){
  try {
    await loadSiteScript('assets/content/sanity-config.js');
    await loadSiteScript('assets/content/sanity-runtime.js');
    await loadSiteScript('assets/content/intro-accent.js');
    await loadSiteScript('assets/content/sanity-prototype-bridge.js');
  } catch (error) {
    console.warn('[Sanity] Content layer did not load. OFFLINE state remains active.', error);
  }
}

if (document.readyState === 'complete') bootOptionalSanityLayer();
else window.addEventListener('load', bootOptionalSanityLayer, {once: true});
