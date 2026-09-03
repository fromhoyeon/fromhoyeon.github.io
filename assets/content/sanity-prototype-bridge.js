/*
  Current prototype bridge.
  Sanity owns work records and homepage curation; GitHub keeps layout and interaction.
  If the remote layer fails, the original hard-coded page remains intact as fallback.
*/

(async function connectPrototypeToSanity(){
  if (window.__SANITY_PROTOTYPE_BRIDGE_LOADED__) return;
  window.__SANITY_PROTOTYPE_BRIDGE_LOADED__ = true;
  if (!window.SANITY_CONTENT?.isEnabled()) return;

  const LEGACY_SECTIONS = {
    'dual-conversation': '#dual',
    photography: '#photo',
    dodrei: '#dodrei',
    music: '#moving'
  };

  let currentHomepageWorks = [];
  let currentPhotoPoolTotal = null;

  function ensureBlockStyles(){
    if (document.querySelector('#sanity-work-block-styles')) return;
    const style = document.createElement('style');
    style.id = 'sanity-work-block-styles';
    style.textContent = `
      .sanity-content-blocks{display:grid;gap:var(--l)}
      .sanity-content-block{min-width:0}
      .sanity-block-label{margin:0 0 8px;font-size:9px;line-height:1.3;color:var(--muted);text-transform:uppercase;letter-spacing:.02em}
      .sanity-text-block{max-width:560px;font-size:13px;white-space:pre-line}
      .sanity-gallery-breakout{width:min(calc(100vw - 24px),var(--wide));margin-left:50%;transform:translateX(-50%)}
      .sanity-gallery-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:var(--s);align-items:start}
      .sanity-gallery-item{margin:0;min-width:0}
      .sanity-gallery-item img{display:block;width:100%;height:auto;background:var(--panel)}
      .sanity-gallery-item figcaption{padding-top:5px;font-size:9px;color:var(--muted)}
      @media (max-width:620px){
        .sanity-content-blocks{gap:var(--l)}
        .sanity-gallery-breakout{width:100vw}
      }
    `;
    document.head.appendChild(style);
  }

  ensureBlockStyles();

  function anchorForWork(work){
    const selector = LEGACY_SECTIONS[work.slug];
    return selector ? selector.slice(1) : work.slug;
  }

  function extractYouTubeId(value){
    if (!value || typeof value !== 'string') return '';
    try {
      const url = new URL(value);
      const host = url.hostname.replace(/^www\./, '');
      if (host === 'youtu.be') return url.pathname.split('/').filter(Boolean)[0] || '';
      if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'music.youtube.com') {
        if (url.searchParams.get('v')) return url.searchParams.get('v');
        const parts = url.pathname.split('/').filter(Boolean);
        const marker = parts.findIndex((part) => part === 'embed' || part === 'shorts' || part === 'live');
        if (marker >= 0 && parts[marker + 1]) return parts[marker + 1];
      }
    } catch (error) {
      return '';
    }
    return '';
  }

  function renderYouTubeStage(stage, work, force = false){
    if (!stage) return;
    const videoId = extractYouTubeId(work.youtubeUrl || '');
    if (!force && stage.dataset.sanityVideoId === videoId && stage.dataset.sanityWorkId === work._id && stage.childElementCount) return;

    stage.dataset.sanityVideoId = videoId;
    stage.dataset.sanityWorkId = work._id || '';
    stage.innerHTML = '';

    if (!videoId) {
      const empty = document.createElement('div');
      empty.className = 'yt-empty';
      empty.textContent = 'YouTube URL not set';
      stage.appendChild(empty);
      return;
    }

    const poster = document.createElement('button');
    poster.className = 'yt-poster';
    poster.type = 'button';
    poster.setAttribute('aria-label', `Play ${work.title || 'video'}`);

    const image = document.createElement('img');
    image.src = `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`;
    image.alt = 'YouTube video thumbnail';
    image.onerror = () => {
      image.onerror = null;
      image.src = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
    };

    const play = document.createElement('span');
    play.className = 'yt-play';
    play.setAttribute('aria-hidden', 'true');
    play.textContent = '▶';
    poster.append(image, play);

    poster.addEventListener('click', () => {
      const iframe = document.createElement('iframe');
      iframe.title = `${work.title || 'YouTube'} video player`;
      iframe.src = `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&controls=0&rel=0&playsinline=1&iv_load_policy=3&disablekb=1&fs=0`;
      iframe.allow = 'autoplay; encrypted-media; picture-in-picture';
      iframe.referrerPolicy = 'strict-origin-when-cross-origin';
      stage.replaceChildren(iframe);
    });

    stage.appendChild(poster);
  }

  function setAction(action, work){
    if (!action) return;
    const url = work.externalUrl || work.youtubeUrl || '';
    const hasAction = Boolean(url || work.actionLabel);
    action.hidden = !hasAction;
    if (!hasAction) return;

    if (work.actionLabel) action.textContent = work.actionLabel;
    action.href = url || '#';
    if (url) {
      action.target = '_blank';
      action.rel = 'noopener';
      action.removeAttribute('aria-disabled');
    } else {
      action.removeAttribute('target');
      action.removeAttribute('rel');
      action.setAttribute('aria-disabled', 'true');
    }
  }

  function photoPoolTotal(){
    if (Number.isFinite(currentPhotoPoolTotal)) return currentPhotoPoolTotal;
    if (typeof photoFiles !== 'undefined' && Array.isArray(photoFiles)) return photoFiles.length;
    return 0;
  }

  function applyHeader(section, work, index){
    const number = String(index + 1).padStart(2, '0');
    const num = section.querySelector('.work-head .num');
    const title = section.querySelector('.work-title');
    const meta = section.querySelector('.work-meta');
    if (num) num.textContent = number;
    if (title) title.textContent = work.title || '';

    if (meta) {
      let lines = Array.isArray(work.metaLines) ? [...work.metaLines] : [];
      if (work.mediaType === 'photoCollection') {
        const total = photoPoolTotal();
        const count = Math.min(Number(work.photoCount) || 12, total || Number(work.photoCount) || 12);
        lines = [`${count} / ${total || '?'} IMAGES`, ...lines];
      }
      meta.innerHTML = lines.map((line) => String(line)).join('<br>');
    }
  }

  function createWebStage(title, embedUrl, externalUrl){
    const breakout = document.createElement('div');
    breakout.className = 'live-breakout';

    const stage = document.createElement('div');
    stage.className = 'live-stage';

    const gate = document.createElement('div');
    gate.className = 'live-gate';
    gate.innerHTML = `
      <div class="live-gate-inner">
        <div class="live-gate-label">Interactive browser work / touch to choose playback</div>
        <div class="live-gate-title"></div>
        <div class="live-gate-actions">
          <button class="action" type="button">여기서 재생</button>
          <a class="action" target="_blank" rel="noopener">새 창으로 재생 ↗</a>
        </div>
      </div>`;

    const gateTitle = gate.querySelector('.live-gate-title');
    if (gateTitle) gateTitle.textContent = title || '';

    const button = gate.querySelector('button.action');
    button?.addEventListener('click', () => {
      if (!embedUrl || stage.querySelector('iframe')) return;
      const iframe = document.createElement('iframe');
      iframe.className = 'live-frame';
      iframe.src = embedUrl;
      iframe.title = `${title || 'Interactive work'} live browser work`;
      iframe.allow = 'autoplay; fullscreen';
      iframe.setAttribute('allowfullscreen', '');
      stage.replaceChildren(iframe);
    });

    const external = gate.querySelector('a.action');
    if (external) {
      external.href = externalUrl || embedUrl || '#';
      external.hidden = !(externalUrl || embedUrl);
    }

    stage.appendChild(gate);
    breakout.appendChild(stage);
    return breakout;
  }

  function bindWebEmbed(section, work){
    const stage = section.querySelector('.live-stage');
    if (!stage) return;

    const gateTitle = section.querySelector('.live-gate-title');
    if (gateTitle) gateTitle.textContent = work.title || '';

    let button = section.querySelector('#dodrei-play-here, [data-web-play]');
    if (button && !button.dataset.sanityWebBound) {
      const replacement = button.cloneNode(true);
      replacement.dataset.sanityWebBound = 'true';
      replacement.dataset.webPlay = '';
      button.replaceWith(replacement);
      button = replacement;
      button.addEventListener('click', () => {
        const embedUrl = button.dataset.embedUrl || '';
        if (!embedUrl || stage.querySelector('iframe')) return;
        const iframe = document.createElement('iframe');
        iframe.className = 'live-frame';
        iframe.src = embedUrl;
        iframe.title = `${work.title || 'Interactive work'} live browser work`;
        iframe.allow = 'autoplay; fullscreen';
        iframe.setAttribute('allowfullscreen', '');
        stage.replaceChildren(iframe);
      });
    }
    if (button) button.dataset.embedUrl = work.embedUrl || work.externalUrl || '';

    section.querySelectorAll('.live-gate a.action').forEach((link) => {
      if (work.externalUrl) {
        link.href = work.externalUrl;
        link.target = '_blank';
        link.rel = 'noopener';
      }
    });
  }

  function renderContentBlock(block, work){
    const wrapper = document.createElement('div');
    wrapper.className = 'sanity-content-block';
    wrapper.dataset.blockType = block._type || '';
    wrapper.dataset.blockKey = block._key || '';

    if (block.title) {
      const label = document.createElement('p');
      label.className = 'sanity-block-label';
      label.textContent = block.title;
      wrapper.appendChild(label);
    }

    if (block._type === 'workVideoBlock') {
      const breakout = document.createElement('div');
      breakout.className = 'video-breakout';
      const stage = document.createElement('div');
      stage.className = 'yt-stage';
      stage.setAttribute('aria-label', `${block.title || work.title || 'Work'} video`);
      breakout.appendChild(stage);
      wrapper.appendChild(breakout);
      renderYouTubeStage(stage, {
        _id: `${work._id || work.slug}:${block._key || 'video'}`,
        title: block.title || work.title,
        youtubeUrl: block.youtubeUrl
      }, true);
      return wrapper;
    }

    if (block._type === 'workTextBlock') {
      const text = document.createElement('p');
      text.className = 'sanity-text-block';
      text.textContent = block.text || '';
      wrapper.appendChild(text);
      return wrapper;
    }

    if (block._type === 'workGalleryBlock') {
      const breakout = document.createElement('div');
      breakout.className = 'sanity-gallery-breakout';
      const grid = document.createElement('div');
      grid.className = 'sanity-gallery-grid';

      (block.images || []).forEach((item) => {
        const source = item.imageUrl
          ? window.SANITY_CONTENT.imageUrl(item.imageUrl, 1800)
          : item.externalUrl;
        if (!source) return;

        const figure = document.createElement('figure');
        figure.className = 'sanity-gallery-item';
        const image = document.createElement('img');
        image.src = source;
        image.alt = item.alt || item.caption || '';
        image.loading = 'lazy';
        image.decoding = 'async';
        figure.appendChild(image);

        if (item.caption) {
          const caption = document.createElement('figcaption');
          caption.textContent = item.caption;
          figure.appendChild(caption);
        }
        grid.appendChild(figure);
      });

      breakout.appendChild(grid);
      wrapper.appendChild(breakout);
      return wrapper;
    }

    if (block._type === 'workWebEmbedBlock') {
      wrapper.appendChild(createWebStage(block.title || work.title, block.embedUrl, block.externalUrl));
      return wrapper;
    }

    return wrapper;
  }

  function renderContentBlocks(section, work){
    const blocks = Array.isArray(work.contentBlocks) ? work.contentBlocks : [];
    let container = section.querySelector(':scope > .sanity-content-blocks');

    if (!blocks.length) {
      container?.remove();
      return false;
    }

    section.querySelectorAll(':scope > .video-breakout, :scope > .live-breakout, :scope > .photo-breakout, :scope > .photo-actions, :scope > .media').forEach((element) => {
      element.hidden = true;
    });

    if (!container) {
      container = document.createElement('div');
      container.className = 'sanity-content-blocks';
      const header = section.querySelector(':scope > .work-head');
      if (header?.nextSibling) section.insertBefore(container, header.nextSibling);
      else section.appendChild(container);
    }

    container.replaceChildren(...blocks.map((block) => renderContentBlock(block, work)));
    return true;
  }

  function applyWorkToSection(section, work, index, forceMedia = false){
    section.dataset.sanityWorkId = work._id || '';
    section.dataset.sanityWorkSlug = work.slug || '';
    applyHeader(section, work, index);

    const description = section.querySelector('.description p');
    if (description && typeof work.summary === 'string') {
      description.textContent = work.summary;
      description.style.whiteSpace = 'pre-line';
    }

    setAction(section.querySelector('.description .action'), work);

    const strip = section.querySelector('.small-strip');
    if (strip) {
      strip.replaceChildren();
      (work.tags || []).forEach((tag) => {
        const item = document.createElement('span');
        item.className = 'tag';
        item.textContent = tag;
        strip.appendChild(item);
      });
      strip.hidden = !(work.tags || []).length;
    }

    const hasBlocks = renderContentBlocks(section, work);
    if (hasBlocks) return;

    if (work.mediaType === 'youtube') {
      renderYouTubeStage(section.querySelector('.yt-stage'), work, forceMedia);
    } else if (work.mediaType === 'webEmbed') {
      bindWebEmbed(section, work);
    }
  }

  function createGenericWorkSection(work){
    const section = document.createElement('section');
    section.className = 'shell work';
    section.id = work.slug;
    section.dataset.sanityGenericWork = 'true';

    const header = document.createElement('header');
    header.className = 'work-head';
    header.innerHTML = '<span class="num"></span><h2 class="work-title"></h2><div class="work-meta"></div>';
    section.appendChild(header);

    const hasBlocks = Array.isArray(work.contentBlocks) && work.contentBlocks.length;
    if (hasBlocks) {
      const content = document.createElement('div');
      content.className = 'sanity-content-blocks';
      section.appendChild(content);
    } else if (work.mediaType === 'youtube') {
      const breakout = document.createElement('div');
      breakout.className = 'video-breakout';
      const stage = document.createElement('div');
      stage.className = 'yt-stage';
      stage.setAttribute('aria-label', `${work.title || 'Work'} video`);
      breakout.appendChild(stage);
      section.appendChild(breakout);
    } else if (work.mediaType === 'webEmbed') {
      section.appendChild(createWebStage(work.title, work.embedUrl, work.externalUrl));
    } else if (work.mediaType === 'photoCollection') {
      const placeholder = document.createElement('div');
      placeholder.className = 'media landscape';
      placeholder.dataset.label = 'Photography collection';
      section.appendChild(placeholder);
    }

    const description = document.createElement('div');
    description.className = 'description';
    description.innerHTML = '<p></p><a class="action" href="#"></a>';
    section.appendChild(description);

    const strip = document.createElement('div');
    strip.className = 'small-strip';
    section.appendChild(strip);
    return section;
  }

  function createIndexLink(work, index){
    const link = document.createElement('a');
    link.href = `#${anchorForWork(work)}`;

    const num = document.createElement('span');
    num.className = 'num';
    num.textContent = String(index + 1).padStart(2, '0');

    const title = document.createElement('span');
    title.textContent = work.title || '';

    const year = document.createElement('span');
    year.className = 'year';
    year.textContent = work.yearLabel || '';

    link.append(num, title, year);
    return link;
  }

  function applyHomepageWorks(works, forceMedia = false){
    if (!Array.isArray(works) || !works.length) return;
    currentHomepageWorks = works;

    const index = document.querySelector('#work');
    const about = document.querySelector('#about');
    const parent = about?.parentElement;
    if (!index || !about || !parent) return;

    document.querySelectorAll('[data-sanity-generic-work="true"]').forEach((section) => section.remove());
    Object.values(LEGACY_SECTIONS).forEach((selector) => {
      const section = document.querySelector(selector);
      if (section) section.hidden = true;
    });
    index.replaceChildren();

    works.forEach((work, position) => {
      const selector = LEGACY_SECTIONS[work.slug];
      let section = selector ? document.querySelector(selector) : null;
      if (!section) section = createGenericWorkSection(work);
      section.hidden = false;
      applyWorkToSection(section, work, position, forceMedia);
      parent.insertBefore(section, about);
      index.appendChild(createIndexLink(work, position));
    });
  }

  function resolvePhotoDimensions(item){
    if (item.ratio && item.width && item.height) return Promise.resolve(item);
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve({
        ...item,
        width: img.naturalWidth,
        height: img.naturalHeight,
        ratio: img.naturalWidth / img.naturalHeight
      });
      img.onerror = reject;
      img.src = item.src;
    });
  }

  async function connectRemotePhotoPool(){
    try {
      const rawPhotos = await window.SANITY_CONTENT.fetchPortfolioPhotos();
      if (!rawPhotos.length) return;

      const loaded = await Promise.allSettled(rawPhotos.map(resolvePhotoDimensions));
      const remotePhotos = loaded
        .filter((item) => item.status === 'fulfilled')
        .map((item) => item.value);
      if (!remotePhotos.length) return;

      currentPhotoPoolTotal = remotePhotos.length;
      const renderRemoteSelection = () => {
        const photoWork = currentHomepageWorks.find((work) => work.mediaType === 'photoCollection');
        const requested = Number(photoWork?.photoCount) || 12;
        const count = Math.min(requested, remotePhotos.length);
        photos = shuffled(remotePhotos).slice(0, count);
        lightboxIndex = -1;
        layoutPhotos();
        if (currentHomepageWorks.length) applyHomepageWorks(currentHomepageWorks, false);
      };

      if (typeof shufflePhotos !== 'undefined' && typeof createPhotoSet === 'function') {
        shufflePhotos.removeEventListener('click', createPhotoSet);
        shufflePhotos.addEventListener('click', renderRemoteSelection);
      }
      renderRemoteSelection();
    } catch (error) {
      console.warn('[Sanity] Using local photo pool fallback.', error);
    }
  }

  try {
    const works = await window.SANITY_CONTENT.fetchHomePageWorks();
    if (works.length) applyHomepageWorks(works, true);
  } catch (error) {
    console.warn('[Sanity] Using hard-coded work order fallback.', error);
  }

  window.addEventListener('sitecopychange', () => {
    if (!currentHomepageWorks.length) return;
    setTimeout(() => applyHomepageWorks(currentHomepageWorks, true), 0);
  });

  connectRemotePhotoPool();
})();