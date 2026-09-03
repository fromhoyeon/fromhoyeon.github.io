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

  function renderYouTubeStage(stage, work){
    if (!stage) return;
    const videoId = extractYouTubeId(work.youtubeUrl || '');
    if (stage.dataset.sanityVideoId === videoId && stage.dataset.sanityWorkId === work._id) return;

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
    if (work.actionLabel) action.textContent = work.actionLabel;
    const url = work.externalUrl || work.youtubeUrl || '';
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

  function applyWorkToSection(section, work, index){
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

    if (work.mediaType === 'youtube') {
      renderYouTubeStage(section.querySelector('.yt-stage'), work);
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

    if (work.mediaType === 'youtube') {
      const breakout = document.createElement('div');
      breakout.className = 'video-breakout';
      const stage = document.createElement('div');
      stage.className = 'yt-stage';
      stage.setAttribute('aria-label', `${work.title || 'Work'} video`);
      breakout.appendChild(stage);
      section.appendChild(breakout);
    } else if (work.mediaType === 'webEmbed') {
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
            <button class="action" data-web-play type="button">여기서 재생</button>
            <a class="action" target="_blank" rel="noopener">새 창으로 재생 ↗</a>
          </div>
        </div>`;
      stage.appendChild(gate);
      breakout.appendChild(stage);
      section.appendChild(breakout);
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
    link.href = `#${work.slug}`;

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

  function applyHomepageWorks(works){
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
      let section = document.querySelector(LEGACY_SECTIONS[work.slug] || '');
      if (!section) section = createGenericWorkSection(work);
      section.hidden = false;
      section.id = work.slug;
      applyWorkToSection(section, work, position);
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
        if (currentHomepageWorks.length) applyHomepageWorks(currentHomepageWorks);
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
    if (works.length) applyHomepageWorks(works);
  } catch (error) {
    console.warn('[Sanity] Using hard-coded work order fallback.', error);
  }

  window.addEventListener('sitecopychange', () => {
    if (currentHomepageWorks.length) applyHomepageWorks(currentHomepageWorks);
  });

  connectRemotePhotoPool();
})();
