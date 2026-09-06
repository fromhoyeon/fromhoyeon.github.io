/*
  Sanity-bound site text bridge
  ----------------------------
  Sanity is the source of truth for editable site text and navigation.
  Local structural shells are never used as public copy fallbacks.
  Visual styling is owned by site.css; runtime/module boot is owned by index.html.
*/

window.SITE_COPY = {};

function clearStructuralShellContent(){
  document.querySelector('.intro-copy span')?.remove();

  const index = document.querySelector('#work');
  index?.replaceChildren();

  document.querySelectorAll('main > section.work').forEach((section) => {
    section.hidden = true;

    const title = section.querySelector('.work-title');
    const meta = section.querySelector('.work-meta');
    const description = section.querySelector('.description p');
    const action = section.querySelector('.description .action');
    const strip = section.querySelector('.small-strip');

    if (title) title.textContent = '';
    if (meta) meta.textContent = '';
    if (description) description.textContent = '';
    if (action) {
      action.textContent = '';
      action.hidden = true;
      action.removeAttribute('target');
      action.removeAttribute('rel');
      action.href = '#';
    }
    if (strip) {
      strip.replaceChildren();
      strip.hidden = true;
    }
  });
}

clearStructuralShellContent();

const CONTACT_EMAIL = 'fromhoyeon@gmail.com';
const STATIC_EXTERNAL_LINKS = [
  {label:'Instagram', href:'https://www.instagram.com/hoyeon.choi/'}
];

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

  const hint = document.createElement('span');
  hint.className = 'email-copy-hint';
  hint.textContent = '(click to copy)';
  hint.setAttribute('aria-hidden', 'true');

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
  copyButton.append(label, hint);
  wrapper.append(copyButton, followup);

  copyButton.addEventListener('click', async () => {
    try {
      await copyText(CONTACT_EMAIL);
      hint.classList.add('is-hidden');
      followup.classList.add('is-visible');
    } catch (error) {
      hint.textContent = '(copy failed)';
      message.textContent = 'Could not copy automatically. Open your mail app?';
      followup.classList.add('is-visible');
      setTimeout(() => hint.classList.add('is-hidden'), 1600);
    }
  });

  return wrapper;
}

function createUnavailableYouTube(){
  const button = document.createElement('button');
  button.className = 'email-copy-row';
  button.type = 'button';
  button.setAttribute('aria-label', 'YouTube, temporarily unavailable');

  const label = document.createElement('span');
  label.className = 'email-copy-label';
  label.textContent = 'YouTube';

  const status = document.createElement('span');
  status.className = 'email-copy-hint is-hidden';
  status.textContent = 'Temporarily unavailable';
  status.setAttribute('role', 'status');
  status.setAttribute('aria-live', 'polite');

  let hideTimer = 0;
  button.append(label, status);
  button.addEventListener('click', () => {
    window.clearTimeout(hideTimer);
    status.classList.remove('is-hidden');
    hideTimer = window.setTimeout(() => status.classList.add('is-hidden'), 1800);
  });

  return button;
}

function applyStaticExternalLinks(){
  const links = document.querySelector('#links .links');
  if (!links) return;

  const email = createEmailContact();
  const externalLinks = STATIC_EXTERNAL_LINKS.map((item) => {
    const link = document.createElement('a');
    link.href = item.href;
    link.target = '_blank';
    link.rel = 'noopener';

    const label = document.createElement('span');
    label.textContent = item.label;
    const arrow = document.createElement('span');
    arrow.textContent = '↗';
    link.append(label, arrow);
    return link;
  });
  const youtube = createUnavailableYouTube();

  links.replaceChildren(email, ...externalLinks, youtube);
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

  SITE_COPY_BINDINGS.forEach(([path, selector]) => {
    const element = document.querySelector(selector);
    if (!element) return;

    const remoteValue = getCopyValue(source, path);
    const value = typeof remoteValue === 'string' && remoteValue.length ? remoteValue : 'OFFLINE';

    if (MULTILINE_COPY_PATHS.has(path)) element.style.whiteSpace = 'pre-line';
    element.textContent = value;
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
  window.dispatchEvent(new CustomEvent('sitecopychange', {detail:window.SITE_COPY}));
};

window.applySiteCopy(window.SITE_COPY);
window.applySiteNavigation([]);
