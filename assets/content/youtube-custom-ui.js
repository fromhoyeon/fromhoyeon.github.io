/*
  Minimal YouTube controls for the portfolio prototype.
  Existing renderers can keep creating controls=0 YouTube iframes.
  This layer upgrades those iframes to the IFrame API and adds only:
  play/pause, seek timeline, and elapsed / duration.
*/

(function initYouTubeCustomUi(){
  if (window.__YOUTUBE_CUSTOM_UI_LOADED__) return;
  window.__YOUTUBE_CUSTOM_UI_LOADED__ = true;

  let apiPromise = null;

  function ensureStyles(){
    if (document.querySelector('#youtube-custom-ui-styles')) return;
    const style = document.createElement('style');
    style.id = 'youtube-custom-ui-styles';
    style.textContent = `
      .yt-custom-controls{
        display:grid;
        grid-template-columns:28px minmax(0,1fr) auto;
        align-items:center;
        gap:8px;
        min-height:28px;
        border-top:1px solid var(--line);
        background:var(--bg);
        color:var(--fg);
        font-size:9px;
        line-height:1;
      }
      .yt-custom-toggle{
        appearance:none;
        border:0;
        padding:0;
        width:28px;
        height:27px;
        background:transparent;
        color:inherit;
        cursor:pointer;
        font:inherit;
      }
      .yt-custom-toggle:focus-visible,
      .yt-custom-seek:focus-visible{outline:1px solid var(--fg);outline-offset:2px}
      .yt-custom-seek{
        width:100%;
        height:14px;
        margin:0;
        padding:0;
        accent-color:var(--fg);
        cursor:pointer;
        background:transparent;
      }
      .yt-custom-time{
        min-width:70px;
        padding-right:2px;
        text-align:right;
        color:var(--muted);
        font-variant-numeric:tabular-nums;
        white-space:nowrap;
      }
      @media (max-width:620px){
        .yt-custom-controls{grid-template-columns:26px minmax(0,1fr) auto;gap:6px;padding:0 7px}
        .yt-custom-toggle{width:26px}
        .yt-custom-time{min-width:62px}
      }
    `;
    document.head.appendChild(style);
  }

  function loadApi(){
    if (window.YT?.Player) return Promise.resolve(window.YT);
    if (apiPromise) return apiPromise;

    apiPromise = new Promise((resolve, reject) => {
      const previousReady = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = function onYouTubeIframeAPIReady(){
        if (typeof previousReady === 'function') previousReady();
        resolve(window.YT);
      };

      const existing = document.querySelector('script[src="https://www.youtube.com/iframe_api"]');
      if (!existing) {
        const script = document.createElement('script');
        script.src = 'https://www.youtube.com/iframe_api';
        script.async = true;
        script.onerror = () => reject(new Error('YouTube IFrame API failed to load.'));
        document.head.appendChild(script);
      }

      let checks = 0;
      const poll = window.setInterval(() => {
        checks += 1;
        if (window.YT?.Player) {
          window.clearInterval(poll);
          resolve(window.YT);
        } else if (checks > 100) {
          window.clearInterval(poll);
          reject(new Error('YouTube IFrame API timed out.'));
        }
      }, 100);
    });

    return apiPromise;
  }

  function videoIdFromIframe(iframe){
    try {
      const url = new URL(iframe.src, window.location.href);
      const parts = url.pathname.split('/').filter(Boolean);
      const embedIndex = parts.indexOf('embed');
      return embedIndex >= 0 ? parts[embedIndex + 1] || '' : '';
    } catch (error) {
      return '';
    }
  }

  function formatTime(seconds){
    const value = Number.isFinite(seconds) ? Math.max(0, Math.floor(seconds)) : 0;
    const hours = Math.floor(value / 3600);
    const minutes = Math.floor((value % 3600) / 60);
    const secs = value % 60;
    if (hours) return `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    return `${minutes}:${String(secs).padStart(2, '0')}`;
  }

  function ensureControls(stage){
    const parent = stage.parentElement;
    if (!parent) return null;

    let controls = parent.querySelector(':scope > .yt-custom-controls');
    if (!controls) {
      controls = document.createElement('div');
      controls.className = 'yt-custom-controls';
      controls.innerHTML = `
        <button class="yt-custom-toggle" type="button" aria-label="Play">▶</button>
        <input class="yt-custom-seek" type="range" min="0" max="1000" value="0" step="1" aria-label="Seek video">
        <span class="yt-custom-time">0:00 / 0:00</span>
      `;
      stage.insertAdjacentElement('afterend', controls);
    }
    return controls;
  }

  function removeControls(stage){
    const controls = stage.parentElement?.querySelector(':scope > .yt-custom-controls');
    controls?.remove();
  }

  async function upgradeIframe(iframe){
    const stage = iframe.closest('.yt-stage');
    if (!stage || iframe.dataset.customYoutubeManaged === 'true') return;
    if (stage.dataset.customYoutubeUi === 'loading') return;

    const videoId = videoIdFromIframe(iframe);
    if (!videoId) return;

    const originalSrc = iframe.src;
    const autoplay = new URL(originalSrc, window.location.href).searchParams.get('autoplay') === '1';
    stage.dataset.customYoutubeUi = 'loading';

    try {
      await loadApi();
      if (!iframe.isConnected || !stage.contains(iframe)) {
        stage.dataset.customYoutubeUi = '';
        return;
      }

      try {
        stage._ytCustomPlayer?.destroy?.();
      } catch (error) {
        // A prior player may already have been removed by a rerender.
      }

      const controls = ensureControls(stage);
      const toggle = controls?.querySelector('.yt-custom-toggle');
      const seek = controls?.querySelector('.yt-custom-seek');
      const time = controls?.querySelector('.yt-custom-time');
      if (!controls || !toggle || !seek || !time) throw new Error('Custom controls could not be created.');

      seek.value = '0';
      time.textContent = '0:00 / 0:00';
      toggle.textContent = '▶';
      toggle.setAttribute('aria-label', 'Play');

      const target = document.createElement('div');
      target.id = `yt-custom-${Math.random().toString(36).slice(2)}`;
      stage.replaceChildren(target);

      let seeking = false;
      let lastTick = 0;
      let player = null;

      const updateUi = () => {
        if (!player || stage._ytCustomPlayer !== player || !stage.isConnected) return;
        const duration = Number(player.getDuration?.()) || 0;
        const current = Number(player.getCurrentTime?.()) || 0;
        if (!seeking) seek.value = duration > 0 ? String(Math.round((current / duration) * 1000)) : '0';
        time.textContent = `${formatTime(current)} / ${formatTime(duration)}`;
      };

      const tick = (timestamp) => {
        if (!player || stage._ytCustomPlayer !== player || !stage.isConnected) return;
        if (timestamp - lastTick > 180) {
          updateUi();
          lastTick = timestamp;
        }
        window.requestAnimationFrame(tick);
      };

      player = new window.YT.Player(target, {
        host: 'https://www.youtube-nocookie.com',
        videoId,
        playerVars: {
          autoplay: autoplay ? 1 : 0,
          controls: 0,
          rel: 0,
          playsinline: 1,
          iv_load_policy: 3,
          disablekb: 1,
          fs: 0,
          enablejsapi: 1,
          origin: window.location.origin
        },
        events: {
          onReady: (event) => {
            stage._ytCustomPlayer = event.target;
            stage.dataset.customYoutubeUi = 'ready';
            event.target.getIframe().dataset.customYoutubeManaged = 'true';
            if (autoplay) event.target.playVideo();
            updateUi();
            window.requestAnimationFrame(tick);
          },
          onStateChange: (event) => {
            const playing = event.data === window.YT.PlayerState.PLAYING;
            toggle.textContent = playing ? 'Ⅱ' : '▶';
            toggle.setAttribute('aria-label', playing ? 'Pause' : 'Play');
            updateUi();
          },
          onError: () => {
            stage.dataset.customYoutubeUi = 'error';
          }
        }
      });

      toggle.addEventListener('click', () => {
        if (!player) return;
        const state = player.getPlayerState();
        if (state === window.YT.PlayerState.PLAYING) player.pauseVideo();
        else player.playVideo();
      });

      seek.addEventListener('pointerdown', () => { seeking = true; });
      seek.addEventListener('input', () => {
        if (!player) return;
        const duration = Number(player.getDuration()) || 0;
        const requested = duration * (Number(seek.value) / 1000);
        time.textContent = `${formatTime(requested)} / ${formatTime(duration)}`;
      });
      const commitSeek = () => {
        if (!player) return;
        const duration = Number(player.getDuration()) || 0;
        player.seekTo(duration * (Number(seek.value) / 1000), true);
        seeking = false;
        updateUi();
      };
      seek.addEventListener('change', commitSeek);
      seek.addEventListener('pointerup', commitSeek);
    } catch (error) {
      stage.dataset.customYoutubeUi = 'error';
      removeControls(stage);
      console.warn('[YouTube] Custom UI unavailable; keeping standard embed.', error);
    }
  }

  function inspect(root){
    if (root instanceof HTMLIFrameElement && root.closest('.yt-stage')) upgradeIframe(root);
    root.querySelectorAll?.('.yt-stage iframe').forEach(upgradeIframe);
  }

  ensureStyles();
  inspect(document);

  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node instanceof Element) inspect(node);
      });
    });
  });
  observer.observe(document.documentElement, {childList: true, subtree: true});
})();
