/*
  Sanity-curated Video Collection.
  Each video is managed independently in Sanity with a YouTube URL, title and description.
  Playlist-driven legacy blocks delegate to the archived playlist renderer.
*/

(function initVideoCollection(){
  if (window.HOYEON_VIDEO_COLLECTION) return;

  const PAGE_SIZE = 4;
  const INITIAL_VIDEO_ID = 'VvSIj9rhanA';

  function extractYouTubeId(value){
    if (!value || typeof value !== 'string') return '';
    try {
      const url = new URL(value);
      const host = url.hostname.replace(/^www\./, '');
      if (host === 'youtu.be') return url.pathname.split('/').filter(Boolean)[0] || '';
      if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'music.youtube.com') {
        if (url.searchParams.get('v')) return url.searchParams.get('v') || '';
        const parts = url.pathname.split('/').filter(Boolean);
        const marker = parts.findIndex((part) => part === 'embed' || part === 'shorts' || part === 'live');
        if (marker >= 0 && parts[marker + 1]) return parts[marker + 1];
      }
    } catch (error) {
      return '';
    }
    return '';
  }

  function thumbnailUrl(videoId){
    return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
  }

  function shuffled(items){
    const output = items.slice();
    for (let i = output.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [output[i], output[j]] = [output[j], output[i]];
    }
    return output;
  }

  function fastScrollTo(element, duration = 180){
    if (!element) return;
    const headerOffset = window.matchMedia('(max-width:620px)').matches ? 44 : 50;
    const startY = window.scrollY;
    const targetY = Math.max(0, startY + element.getBoundingClientRect().top - headerOffset);
    const distance = targetY - startY;
    if (Math.abs(distance) < 2) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      window.scrollTo(0, targetY);
      return;
    }
    const startedAt = performance.now();
    const step = (now) => {
      const progress = Math.min(1, (now - startedAt) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      window.scrollTo(0, startY + distance * eased);
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  function render(block, work){
    if (block?.playlistUrl && window.HOYEON_PLAYLIST_VIDEO_COLLECTION?.render) {
      return window.HOYEON_PLAYLIST_VIDEO_COLLECTION.render(block, work);
    }

    let videos = (Array.isArray(block.videos) ? block.videos : [])
      .map((item) => ({...item, videoId: extractYouTubeId(item?.youtubeUrl || '')}))
      .filter((item) => item.videoId);
    const initialVideo = videos.find((item) => item.videoId === INITIAL_VIDEO_ID);
    const remainingVideos = videos.filter((item) => item.videoId !== INITIAL_VIDEO_ID);
    videos = initialVideo ? [initialVideo, ...shuffled(remainingVideos)] : shuffled(videos);

    const breakout = document.createElement('div');
    breakout.className = 'video-collection-breakout';

    const collection = document.createElement('div');
    collection.className = 'video-collection';
    breakout.appendChild(collection);

    if (!videos.length) {
      const empty = document.createElement('div');
      empty.className = 'video-collection-message';
      empty.textContent = 'Video collection is empty';
      collection.appendChild(empty);
      return breakout;
    }

    const stage = document.createElement('div');
    stage.className = 'video-collection-stage yt-stage';
    stage.tabIndex = -1;

    const info = document.createElement('div');
    info.className = 'video-collection-info';

    const meta = document.createElement('div');
    meta.className = 'video-collection-meta';

    const currentTitle = document.createElement('div');
    currentTitle.className = 'video-collection-current-title';

    const status = document.createElement('div');
    status.className = 'video-collection-status';

    const currentDescription = document.createElement('div');
    currentDescription.className = 'video-collection-description';

    meta.append(currentTitle, status);
    info.append(meta, currentDescription);

    const tray = document.createElement('div');
    tray.className = 'video-collection-tray';

    const grid = document.createElement('div');
    grid.className = 'video-collection-grid';
    grid.setAttribute('aria-label', `${block.title || work.title || 'Video'} collection`);

    const pagination = document.createElement('div');
    pagination.className = 'video-collection-pagination';

    const previousPage = document.createElement('button');
    previousPage.className = 'video-collection-page-button';
    previousPage.type = 'button';
    previousPage.textContent = '‹';
    previousPage.setAttribute('aria-label', 'Previous video page');

    const pageStatus = document.createElement('span');
    pageStatus.className = 'video-collection-page-status';

    const nextPage = document.createElement('button');
    nextPage.className = 'video-collection-page-button';
    nextPage.type = 'button';
    nextPage.textContent = '›';
    nextPage.setAttribute('aria-label', 'Next video page');

    pagination.append(previousPage, pageStatus, nextPage);

    const actions = document.createElement('div');
    actions.className = 'video-collection-actions';

    const shuffleButton = document.createElement('button');
    shuffleButton.className = 'video-collection-shuffle';
    shuffleButton.type = 'button';
    shuffleButton.textContent = 'Shuffle order';
    actions.appendChild(shuffleButton);

    tray.append(grid, pagination, actions);

    let activeIndex = 0;
    let currentPage = 0;

    function pageCount(){
      return Math.max(1, Math.ceil(videos.length / PAGE_SIZE));
    }

    function renderStage(index){
      const item = videos[index];
      if (!item) return;
      activeIndex = index;

      stage.replaceChildren();
      const iframe = document.createElement('iframe');
      iframe.title = `${item.title || 'YouTube'} video player`;
      iframe.src = `https://www.youtube.com/embed/${item.videoId}`;
      iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
      iframe.referrerPolicy = 'strict-origin-when-cross-origin';
      iframe.setAttribute('allowfullscreen', '');
      stage.appendChild(iframe);

      currentTitle.textContent = item.title || 'Untitled video';
      currentDescription.textContent = item.description || '';
      currentDescription.hidden = !String(item.description || '').trim();
      status.textContent = `${index + 1} / ${videos.length}`;
      renderGrid();
    }

    function renderGrid(){
      const totalPages = pageCount();
      currentPage = Math.min(Math.max(0, currentPage), totalPages - 1);
      const start = currentPage * PAGE_SIZE;
      const pageItems = videos.slice(start, start + PAGE_SIZE);

      grid.replaceChildren();
      pageItems.forEach((item, pageIndex) => {
        const index = start + pageIndex;
        const button = document.createElement('button');
        button.className = 'video-collection-thumb';
        button.type = 'button';
        button.setAttribute('aria-label', `Select ${item.title || `video ${index + 1}`}`);

        const image = document.createElement('img');
        image.src = thumbnailUrl(item.videoId);
        image.alt = '';

        const thumbTitle = document.createElement('span');
        thumbTitle.className = 'video-collection-thumb-title';
        thumbTitle.textContent = item.title || 'Untitled video';
        thumbTitle.title = item.title || 'Untitled video';

        button.append(image, thumbTitle);
        const active = index === activeIndex;
        button.classList.toggle('is-active', active);
        button.setAttribute('aria-current', active ? 'true' : 'false');

        button.addEventListener('click', () => {
          renderStage(index);
          if (window.matchMedia('(max-width:620px)').matches) fastScrollTo(stage);
        });
        grid.appendChild(button);
      });

      pageStatus.textContent = `PAGE ${currentPage + 1} / ${totalPages}`;
      previousPage.disabled = currentPage === 0;
      nextPage.disabled = currentPage >= totalPages - 1;
    }

    previousPage.addEventListener('click', () => {
      if (currentPage <= 0) return;
      currentPage -= 1;
      renderGrid();
    });

    nextPage.addEventListener('click', () => {
      if (currentPage >= pageCount() - 1) return;
      currentPage += 1;
      renderGrid();
    });

    shuffleButton.addEventListener('click', () => {
      const previousFirstId = videos[0]?.videoId;
      videos = shuffled(videos);
      if (videos.length > 1 && videos[0]?.videoId === previousFirstId) {
        const swapIndex = 1 + Math.floor(Math.random() * (videos.length - 1));
        [videos[0], videos[swapIndex]] = [videos[swapIndex], videos[0]];
      }
      activeIndex = 0;
      currentPage = 0;
      renderStage(0);
      if (window.matchMedia('(max-width:620px)').matches) fastScrollTo(stage);
    });

    collection.append(stage, info, tray);
    renderStage(0);
    return breakout;
  }

  window.HOYEON_VIDEO_COLLECTION = {render, extractYouTubeId};
})();