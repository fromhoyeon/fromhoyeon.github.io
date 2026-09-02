/*
  사이트 주요 텍스트 편집 파일
  --------------------------
  이 파일의 따옴표 안 문구만 수정하면 prototype-functional-onepage.html에 반영된다.
  HTML 구조, CSS, 사진 배치 코드와 분리하기 위한 편집용 source다.

  주의:
  - 따옴표(' 또는 ")를 문장 안에 직접 쓸 때는 앞에 \\를 붙인다.
  - <br>은 화면에서 줄바꿈을 뜻한다. meta처럼 data-copy-html을 쓰는 곳에서만 사용한다.
  - 링크 주소 자체는 현재 HTML에 남아 있고, 여기서는 화면에 보이는 링크 문구만 관리한다.
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
  function getValue(path){
    return path.split('.').reduce((value, key) => value && value[key], window.SITE_COPY);
  }

  document.querySelectorAll('[data-copy]').forEach((element) => {
    const value = getValue(element.dataset.copy);
    if (typeof value !== 'string') return;

    if (element.hasAttribute('data-copy-html')) element.innerHTML = value;
    else element.textContent = value;
  });
})();
