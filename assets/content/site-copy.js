/*
  사이트 주요 텍스트 편집 파일
  --------------------------
  Sanity가 꺼져 있거나 연결되지 않았을 때 사용하는 local fallback source다.
  Sanity가 활성화되면 remote 값만 이 객체 위에 덮어쓴다.
*/

window.SITE_COPY = {
  site: {
    brand: 'HOYEON CHOI',
    navWork: 'Work',
    navAbout: 'About',
    navLinks: 'Links'
  },

  intro: {
    title: 'Selected work across image, sound, performance and code.',
    body: 'This prototype keeps the information column narrow and lets media expand only when the content benefits from it.',
    meta: 'SEOUL / 2026<br>SELECTED WORKS'
  },

  index: {
    dual: 'Dual Conversation',
    photo: 'Selected Photography',
    dodrei: 'DODREI',
    moving: 'Moving Image'
  },

  dual: {
    title: 'Dual Conversation',
    description: 'A long-running audiovisual work built from accumulated moving-image fragments, playback systems and changing relationships between image and sound.',
    action: 'View project ↗'
  },

  photo: {
    title: 'Selected Photography',
    helper: 'Original ratios · click image to enlarge',
    shuffle: 'Shuffle selection',
    description: 'Twelve images are picked from the sample pool on each shuffle. Their real dimensions determine the justified rows, without cropping the source ratio.',
    action: 'More photographs ↗'
  },

  dodrei: {
    title: 'DODREI',
    description: 'The actual browser work is embedded here as a live viewport. The surrounding portfolio stays narrow; only the work itself occupies a larger field.',
    action: 'Open work ↗'
  },

  moving: {
    title: 'Moving Image',
    description: 'The initial view uses the unmodified YouTube thumbnail plus a play control. After playback starts, the official embedded player loads with its standard controls hidden where YouTube currently allows.',
    action: 'YouTube ↗'
  },

  about: {
    title: 'About',
    practiceLabel: 'Practice',
    practice: 'Jazz guitar, moving image, photography, performance, browser-based work and interactive systems.',
    ruleLabel: 'Rule',
    rule: 'Use space because the content needs it. Keep the number of visual elements small, then repeat them consistently.'
  },

  links: {
    instagram: 'Instagram / Photography',
    youtube: 'YouTube / Moving Image + Performance',
    github: 'GitHub / Web + Code'
  },

  footer: {
    copyright: '© 2026 Hoyeon Choi',
    status: 'PROTOTYPE / NOT FINAL'
  },

  ui: {
    close: 'Close'
  }
};

const SITE_COPY_BINDINGS = [
  ['site.brand', '.brand'],
  ['site.navWork', '.nav a[href="#work"]'],
  ['site.navAbout', '.nav a[href="#about"]'],
  ['site.navLinks', '.nav a[href="#links"]'],
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
  SITE_COPY_BINDINGS.forEach(([path, selector, allowHtml]) => {
    const element = document.querySelector(selector);
    const value = getCopyValue(source, path);
    if (!element || typeof value !== 'string') return;
    if (allowHtml) element.innerHTML = value;
    else element.textContent = value;
  });
};

window.mergeSiteCopy = function mergeSiteCopy(patch){
  deepMerge(window.SITE_COPY, patch);
  window.applySiteCopy(window.SITE_COPY);
};

window.applySiteCopy(window.SITE_COPY);
