/*
  사이트 주요 텍스트 편집 파일
  --------------------------
  이 파일의 따옴표 안 문구만 수정하면 prototype-functional-onepage.html에 반영된다.
  HTML 구조, CSS, 사진 배치 코드와 분리하기 위한 편집용 source다.

  편집할 때:
  - 보통은 아래 SITE_COPY 안의 문장만 수정하면 된다.
  - 따옴표(' 또는 ")를 문장 안에 직접 쓸 때는 앞에 \\를 붙인다.
  - <br>은 화면 줄바꿈이다. intro.meta에서 사용한다.
  - 링크 주소 자체는 HTML에 남아 있고, 여기서는 화면에 보이는 링크 문구만 관리한다.
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

(function applySiteCopy(){
  const bindings = [
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

  function getValue(path){
    return path.split('.').reduce((value, key) => value && value[key], window.SITE_COPY);
  }

  bindings.forEach(([path, selector, allowHtml]) => {
    const element = document.querySelector(selector);
    const value = getValue(path);
    if (!element || typeof value !== 'string') return;

    if (allowHtml) element.innerHTML = value;
    else element.textContent = value;
  });
})();
