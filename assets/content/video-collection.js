/*
  Playlist-driven Video Collection.
  Sanity stores one YouTube playlist URL; the browser resolves the playlist items
  through the YouTube IFrame API and renders the selectable thumbnail grid.
*/

(function initVideoCollection(){
  if (window.HOYEON_VIDEO_COLLECTION) return;

  let apiPromise = null;
  let instanceCount = 0;

  function extractPlaylistId(value){
    if (!value || typeof value !== 'string') return '';
    try {
      const url = new URL(value);
      const host = url.hostname.replace(/^www\./, '');
      if (host !== 'youtube.com' && host !== 'm.youtube.com' && host !== 'music.youtube.com' && host !== 'youtu.be') return '';
      return url.searchParams.get('list') || '';
    } catch (error) {
      return '';
    }
  }

  function loadYouTubeApi(){
    if (window.YT?.Player) return Promise.resolve(window.YT);
    if (apiPromise) return apiPromise;

    apiPromise = new Promise((resolve, reject) => {
      const previousReady = window.onYouTubeIframeAPIReady;
      let timeout = null;

      window.onYouTubeIframeAPIReady = () => {
        if (typeof previousReady === 'function') previousReady();
        if (timeout) window.clearTimeout(timeout);
        if (window.YT?.Player) resolve(window.YT);
        else reject(new Error('YouTube IFrame API loaded without Player.'));
      };

      const existing = document.querySelector('script[data-youtube-iframe-api]');
      if (!existing) {
        const script = document.createElement('script');
        script.src = 'https://www.youtube.com/iframe_api';
        script.async = true;
        script.dataset.youtubeIframeApi = 'true';
        script.onerror = () => reject(new Error('YouTube IFrame API failed to load.'));
        document.head.appendChild(script);
      }

      timeout = window.setTimeout(() => reject(new Error('YouTube IFrame API timed out.')), 12000);
    });

    return apiPromise;
  }

  function createMessage(text, href){
    const message = document.createElement(href ? 'a' : 'div');
    message.className = 'video-collection-message';
    message.textContent = text;
    if (href) {
      message.href = href;
      message.target = '_blank';
      message.rel = 'noopener';
    }
    return message;
  }

  function render(block, work){
    const breakout = document.createElement('div');
    breakout.className = 'video-collection-breakout';

    const collection = document.createElement('div');
    collection.className = 'video-collection';
    breakout.appendChild(collection);

    const playlistUrl = block.playlistUrl || '';
    const playlistId = extractPlaylistId(playlistUrl);
    if (!playlistId) {
      collection.appendChild(createMessage('YouTube playlist URL not set'));
      return breakout;
    }

    const stage = document.createElement('div');
    stage.className = 'video-collection-stage';
    stage.tabIndex = -1;

    const playerTarget = document.createElement('div');
    playerTarget.id = `video-collection-player-${++instanceCount}`;
    stage.appendChild(playerTarget);

    const meta = document.createElement('div');
    meta.className = 'video-collection-meta';

    const currentTitle = document.createElement('div');
    currentTitle.className = 'video-collection-current-title';
    currentTitle.textContent = 'Loading playlist…';

    const status = document.createElement('div');
    status.className = 'video-collection-status';

    meta.append(currentTitle, status);

    const grid = document.createElement('div');
    grid.className = 'video-collection-grid';
    grid.setAttribute('aria-label', `${block.title || work.title || 'Video'} playlist`);

    collection.append(stage, meta, grid);

    loadYouTubeApi().then((YT) => {
      let videoIds = [];
      let buttons = [];
      let activeIndex = 0;

      function syncActive(index){
        if (!Number.isInteger(index) || index < 0) return;
        activeIndex = index;
        buttons.forEach((button, buttonIndex) => {
          const active = buttonIndex === activeIndex;
          button.classList.toggle('is-active', active);
          button.setAttribute('aria-current', active ? 'true' : 'false');
        });
        if (videoIds.length) status.textContent = `${activeIndex + 1} / ${videoIds.length}`;
      }

      function syncTitle(player){
        const data = player?.getVideoData?.() || {};
        currentTitle.textContent = data.title || work.title || block.title || 'Video';
      }

      const player = new YT.Player(playerTarget.id, {
        width: '100%',
        height: '100%',
        playerVars: {
          listType: 'playlist',
          list: playlistId,
          autoplay: 0,
          controls: 1,
          rel: 0,
          playsinline: 1,
          modestbranding: 1
        },
        events: {
          onReady(event){
            videoIds = (event.target.getPlaylist?.() || []).filter(Boolean);
            if (!videoIds.length) {
              currentTitle.textContent = 'Playlist unavailable';
              grid.replaceChildren(createMessage('Open playlist ↗', playlistUrl));
              return;
            }

            buttons = videoIds.map((videoId, index) => {
              const button = document.createElement('button');
              button.className = 'video-collection-thumb';
              button.type = 'button';
              button.dataset.videoId = videoId;
              button.setAttribute('aria-label', `Play video ${index + 1} of ${videoIds.length}`);

              const image = document.createElement('img');
              image.src = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
              image.alt = '';
              image.loading = 'lazy';
              image.decoding = 'async';

              const number = document.createElement('span');
              number.className = 'video-collection-thumb-number';
              number.textContent = String(index + 1).padStart(2, '0');

              button.append(image, number);
              button.addEventListener('click', () => {
                event.target.playVideoAt(index);
                syncActive(index);
                if (window.matchMedia('(max-width:620px)').matches) {
                  stage.scrollIntoView({behavior:'smooth', block:'start'});
                }
              });
              return button;
            });

            grid.replaceChildren(...buttons);
            const initialIndex = Math.max(0, event.target.getPlaylistIndex?.() || 0);
            syncActive(initialIndex);
            window.setTimeout(() => syncTitle(event.target), 0);
          },
          onStateChange(event){
            const index = event.target.getPlaylistIndex?.();
            if (Number.isInteger(index) && index >= 0) syncActive(index);
            syncTitle(event.target);
          },
          onError(){
            currentTitle.textContent = 'Playlist unavailable';
            grid.replaceChildren(createMessage('Open playlist ↗', playlistUrl));
          }
        }
      });
    }).catch((error) => {
      console.warn('[Video Collection] YouTube playlist unavailable.', error);
      currentTitle.textContent = 'Playlist unavailable';
      status.textContent = '';
      grid.replaceChildren(createMessage('Open playlist ↗', playlistUrl));
    });

    return breakout;
  }

  window.HOYEON_VIDEO_COLLECTION = {render, extractPlaylistId};
})();