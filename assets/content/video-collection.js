/*
  Sanity-curated Video Collection.
  Each video is managed independently in Sanity with a YouTube URL, title and description.
  Playlist-driven legacy blocks delegate to the archived playlist renderer.
*/

(function initVideoCollection(){
  if (window.HOYEON_VIDEO_COLLECTION) return;

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

  function render(block, work){
    if (block?.playlistUrl && window.HOYEON_PLAYLIST_VIDEO_COLLECTION?.render) {
      return window.HOYEON_PLAYLIST_VIDEO_COLLECTION.render(block, work);
    }

    const videos = (Array.isArray(block.videos) ? block.videos : [])
      .map((item) => ({...item, videoId: extractYouTubeId(item?.youtubeUrl || '')}))
      .filter((item) => item.videoId);

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
    stage.className = 'video-collection-stage';
    stage.tabIndex = -1;

    const info = document.createElement('div');
    info.className = 'video-collection-info';

    const infoHead = document.createElement('div');
    infoHead.className = 'video-collection-meta';

    const currentTitle = document.createElement('div');
    currentTitle.className = 'video-collection-current-title';

    const status = document.createElement('div');
    status.className = 'video-collection-status';

    const currentDescription = document.createElement('div');
    currentDescription.className = 'video-collection-description';

    infoHead.append(currentTitle, status);
    info.append(infoHead, currentDescription);

    const grid = document.createElement('div');
    grid.className = 'video-collection-grid';
    grid.setAttribute('aria-label', `${block.title || work.title || 'Video'} collection`);

    const buttons = [];
    let activeIndex = 0;

    function renderStage(index){
      const item = videos[index];
      if (!item) return;
      activeIndex = index;

      stage.replaceChildren();
      const poster = document.createElement('button');
      poster.className = 'video-collection-poster';
      poster.type = 'button';
      poster.setAttribute('aria-label', `Play ${item.title || 'video'}`);

      const image = document.createElement('img');
      image.src = thumbnailUrl(item.videoId);
      image.alt = '';

      const play = document.createElement('span');
      play.className = 'yt-play';
      play.setAttribute('aria-hidden', 'true');
      play.textContent = '▶';

      poster.append(image, play);
      poster.addEventListener('click', () => {
        const iframe = document.createElement('iframe');
        iframe.title = `${item.title || 'YouTube'} video player`;
        iframe.src = `https://www.youtube-nocookie.com/embed/${item.videoId}?autoplay=1&controls=1&rel=0&playsinline=1&iv_load_policy=3`;
        iframe.allow = 'autoplay; encrypted-media; picture-in-picture';
        iframe.referrerPolicy = 'strict-origin-when-cross-origin';
        iframe.setAttribute('allowfullscreen', '');
        stage.replaceChildren(iframe);
      });
      stage.appendChild(poster);

      currentTitle.textContent = item.title || 'Untitled video';
      currentDescription.textContent = item.description || '';
      currentDescription.hidden = !String(item.description || '').trim();
      status.textContent = `${index + 1} / ${videos.length}`;

      buttons.forEach((button, buttonIndex) => {
        const active = buttonIndex === index;
        button.classList.toggle('is-active', active);
        button.setAttribute('aria-current', active ? 'true' : 'false');
      });
    }

    videos.forEach((item, index) => {
      const button = document.createElement('button');
      button.className = 'video-collection-thumb';
      button.type = 'button';
      button.setAttribute('aria-label', `Select ${item.title || `video ${index + 1}`}`);

      const image = document.createElement('img');
      image.src = thumbnailUrl(item.videoId);
      image.alt = '';
      image.loading = 'lazy';
      image.decoding = 'async';

      const number = document.createElement('span');
      number.className = 'video-collection-thumb-number';
      number.textContent = String(index + 1).padStart(2, '0');

      button.append(image, number);
      button.addEventListener('click', () => {
        if (index === activeIndex && stage.querySelector('iframe')) return;
        renderStage(index);
        if (window.matchMedia('(max-width:620px)').matches) {
          stage.scrollIntoView({behavior:'smooth', block:'start'});
        }
      });

      buttons.push(button);
      grid.appendChild(button);
    });

    collection.append(stage, info, grid);
    renderStage(0);
    return breakout;
  }

  window.HOYEON_VIDEO_COLLECTION = {render, extractYouTubeId};
})();
