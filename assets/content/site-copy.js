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
    .email-copy-row{appearance:none;width:100%;border:0;border-bottom:1px solid var(--line);padding:9px 0;background:transparent;color:inherit;display:grid;grid-template-columns:1fr auto;align-items:center;text-align:left;font:inherit;font-size:12px;cursor:pointer}
    .email-copy-row:hover .email-copy-label{text-decoration:underline;text-underline-offset:2px}
    .email-copy-row:focus-visible{outline:1px solid var(--fg);outline-offset:3px}
    .email-followup{display:none;align-items:center;justify-content:space-between;gap:12px;padding:8px 0;border-bottom:1px solid var(--line);font-size:10px;color:var(--muted)}
    .email-followup.is-visible{display:flex}
    .email-followup a{display:inline-block;border:1px solid var(--line);padding:5px 7px 4px;background:#f7f7f4;color:var(--fg);font-size:9px;text-transform:uppercase;white-space:nowrap}
    .email-followup a:hover,.email-followup a:focus-visible{border-color:var(--fg);background:var(--fg);color:var(--bg)}
    @media (max-width:620px){.email-followup{align-items:flex-start;flex-direction:column}.email-followup a{align-self:flex-start}}
  `;
  document.head.appendChild(style);
}

applyBasePalette();

// The old prototype shipped an inline Intro meta element. It is no longer part of the site.
document.querySelector('.intro-copy span')?.remove();

const CONTACT_EMAIL = 'fromhoyeon@gmail.com';

async function copyText(value){
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const fallback = document.createElement('textarea');
  fallback.value = value;
  fallback.setAttribute('readonly', '');
  fallback.style.position = 'fixed';
  fallback.style.opacity = '0';
  document.body.appendChild(fallback);
  fallback.select();
  document.execCommand('copy');
  fallback.remove();
}

function createEmailContact(){
  const wrapper = document.createElement('div');
  wrapper.className = 'email-contact';

  const copyButton = document.createElement('button');
  copyButton.className = 'email-copy-row';
  copyButton.type = 'button';
  copyButton.setAttribute('aria-describedby', 'email-copy-followup');

  const label = document.createElement('span');
  label.className = 'email-copy-label';
  label.textContent = `Email: ${CONTACT_EMAIL}`;

  const marker = document.createElement('span');
  marker.textContent = 'Copy';
  marker.setAttribute('aria-hidden', 'true');

  const followup = document.createElement('div');
  followup.className = 'email-followup';
  followup.id = 'email-copy-followup';
  followup.setAttribute('role', 'status');
  followup.setAttribute('aria-live', 'polite');

  const message = document.createElement('span');
  message.textContent = 'Email address copied. Open your mail app?';

  const compose = document.createElement('a');
  compose.href = `mailto:${CONTACT_EMAIL}`;
  compose.textContent = 'Open mail app ↗';

  followup.append(message, compose);
  copyButton.append(label, marker);
  wrapper.append(copyButton, followup);

  copyButton.addEventListener('click', async () => {
    try {
      await copyText(CONTACT_EMAIL);
      marker.textContent = 'Copied';
      followup.classList.add('is-visible');
    } catch (error) {
      marker.textContent = 'Copy failed';
      message.textContent = 'Could not copy automatically. Open your mail app?';
      followup.classList.add('is-visible');
    }
  });

  return wrapper;
}

function applyStaticExternalLinks(){
  const links = document.querySelector('#links .links');
  if (!links) return;

  const items = [
    {label: 'Instagram', href: 'https://www.instagram.com/hoyeon.choi/', external: true},
    {label: 'YouTube', href: '#'},
    {label: 'GitHub', href: '#'}
  ];

  const email = createEmailContact();
  const externalLinks = items.map((item) => {
    const link = document.createElement('a');
    link.href = item.href;
    if (item.external) {
      link.target = '_blank';
      link.rel = 'noopener';
    }

    const label = document.createElement('span');
    label.textContent = item.label;
    const arrow = document.createElement('span');
    arrow.textContent = '↗';
    link.append(label, arrow);
    return link;
  });

  links.replaceChildren(email, ...externalLinks);
}

applyStaticExternalLinks();

const SITE_COPY_BINDINGS = [
  ['site.brand', '.brand'],
  ['intro.title', '.intro h1'],
  ['intro.body', '.intro-copy p'],
  ['about.title', '#about > h2'],
  ['about.practiceLabel', '#about .about-grid > div:nth-child(1) .label'],
  ['about.practice', '#about .about-grid > div:nth-child(1) p:nth-child(2)'],
  ['about.ruleLabel', '#about .about-grid > div:nth-child(2) .label'],
  ['about.rule', '#about .about-grid > div:nth-child(2) p:nth-child(2)'],
  ['footer.copyright', '#links footer span:nth-child(1)'],
  ['footer.status', '#links footer span:nth-child(2)']
];

const MULTILINE_COPY_PATHS = new Set([
  'intro.title',
  'intro.body',
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
