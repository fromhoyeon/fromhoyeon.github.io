/*
  Sanity content adapter for GitHub Pages.
  Sanity owns editable copy, navigation, portfolio items and homepage curation.
  Missing remote content remains explicitly OFFLINE instead of mirroring stale local copy.
*/

(function initSanityRuntime(){
  if (window.__SANITY_RUNTIME_LOADED__) return;
  window.__SANITY_RUNTIME_LOADED__ = true;

  const config = window.SANITY_CONFIG || {};

  function isEnabled(){
    return Boolean(
      config.enabled &&
      config.projectId &&
      config.dataset &&
      config.apiVersion
    );
  }

  function showInitialWorkOfflineState(){
    const index = document.querySelector('#work');
    if (!index) return;

    document.querySelectorAll('main > section.work').forEach((section) => {
      section.hidden = true;
    });

    if (!document.querySelector('#sanity-offline-state-styles')) {
      const style = document.createElement('style');
      style.id = 'sanity-offline-state-styles';
      style.textContent = `
        .sanity-offline-row{display:grid;grid-template-columns:32px 1fr auto;gap:var(--m);align-items:center;padding:10px 0;border-bottom:1px solid var(--line);font-size:12px}
        .sanity-offline-row .num{color:var(--muted);font-size:10px}
        .sanity-offline-row .offline-word{font-weight:500;letter-spacing:.01em}
        @media (max-width:620px){.sanity-offline-row{grid-template-columns:24px 1fr auto;gap:10px}}
      `;
      document.head.appendChild(style);
    }

    const row = document.createElement('div');
    row.className = 'sanity-offline-row';
    row.setAttribute('role', 'status');
    row.setAttribute('aria-live', 'polite');

    const number = document.createElement('span');
    number.className = 'num';
    number.textContent = '00';

    const label = document.createElement('span');
    label.className = 'offline-word';
    label.textContent = 'OFFLINE';

    const spacer = document.createElement('span');
    spacer.setAttribute('aria-hidden', 'true');

    row.append(number, label, spacer);
    index.replaceChildren(row);
    index.dataset.contentState = 'offline';
  }

  function apiHost(){
    return config.useCdn
      ? `${config.projectId}.apicdn.sanity.io`
      : `${config.projectId}.api.sanity.io`;
  }

  async function query(groq, params = {}){
    if (!isEnabled()) throw new Error('Sanity is not configured.');

    const url = new URL(`https://${apiHost()}/v${config.apiVersion}/data/query/${config.dataset}`);
    url.searchParams.set('query', groq);
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(`$${key}`, JSON.stringify(value));
    });

    const response = await fetch(url.toString(), {headers: {Accept: 'application/json'}});
    if (!response.ok) throw new Error(`Sanity query failed: ${response.status}`);
    const payload = await response.json();
    return payload.result;
  }

  function imageUrl(url, width, quality){
    if (!url) return '';
    const output = new URL(url);
    if (width) output.searchParams.set('w', String(width));
    if (quality) output.searchParams.set('q', String(quality));
    output.searchParams.set('fit', 'max');
    output.searchParams.set('auto', 'format');
    return output.toString();
  }

  async function fetchSiteCopy(){
    if (!isEnabled() || config.features?.siteCopy === false) return null;

    const copy = await query(`*[_type == "siteCopy"][0]{
      site,
      intro,
      presentation,
      index,
      dual,
      photo,
      dodrei,
      moving,
      about,
      links,
      footer,
      ui
    }`);

    if (copy && typeof window.mergeSiteCopy === 'function') {
      window.mergeSiteCopy(copy);
    }
    return copy;
  }

  async function fetchNavigation(){
    if (!isEnabled()) return [];
    const navigation = await query(`*[_type == "siteNavigation" && _id == "primary-navigation"][0]{
      items[]{_key,label,href}
    }`);
    return (navigation?.items || []).filter((item) => item?.label && item?.href);
  }

  async function fetchHomePageWorks(){
    if (!isEnabled() || config.features?.workEntries === false) return [];

    const home = await query(`*[_type == "homePage" && _id == "home-page"][0]{
      "works": featuredWorks[]->{
        _id,
        title,
        "slug": slug.current,
        enabled,
        yearLabel,
        metaLines,
        summary,
        "tags": tags[]->label,
        contentBlocks[]{
          _key,
          _type,
          title,
          text,
          youtubeUrl,
          embedUrl,
          externalUrl,
          rowCount,
          maxRowHeightDesktop,
          maxRowHeightMobile,
          _type == "workGalleryBlock" => {
            images[]{
              _key,
              alt,
              caption,
              externalUrl,
              "imageUrl": image.asset->url,
              "width": image.asset->metadata.dimensions.width,
              "height": image.asset->metadata.dimensions.height
            }
          }
        },
        mediaType,
        youtubeUrl,
        embedUrl,
        externalUrl,
        actionLabel,
        photoCount
      }
    }`);

    return (home?.works || []).filter((work) => (
      work && work.enabled !== false && work.slug && work.title
    ));
  }

  async function fetchPortfolioPhotos(){
    if (!isEnabled() || config.features?.portfolioPhotos === false) return [];

    const rows = await query(`*[
      _type == "portfolioPhoto" &&
      enabled != false &&
      defined(image.asset)
    ]{
      _id,
      title,
      alt,
      featured,
      "tags": tags[]->{label,"slug":slug.current},
      "url": image.asset->url,
      "filename": image.asset->originalFilename,
      "width": image.asset->metadata.dimensions.width,
      "height": image.asset->metadata.dimensions.height,
      "ratio": image.asset->metadata.dimensions.aspectRatio
    }`);

    return (rows || [])
      .filter((item) => item.url && item.ratio)
      .map((item) => ({
        ...item,
        file: item.filename || item.title || item._id,
        src: imageUrl(item.url, 1200, 75),
        fullSrc: imageUrl(item.url, 2400, 82)
      }));
  }

  function loadScriptOnce(src, dataAttribute){
    if (document.querySelector(`script[${dataAttribute}]`)) return;
    const script = document.createElement('script');
    script.src = src;
    script.setAttribute(dataAttribute, 'true');
    document.head.appendChild(script);
  }

  function loadGalleryLayout(){
    if (!isEnabled() || config.features?.workEntries === false) return;
    loadScriptOnce('assets/content/sanity-gallery-layout.js?v=20260903-4', 'data-sanity-gallery-layout');
  }

  function loadPortfolioUiOverrides(){
    loadScriptOnce('assets/content/portfolio-ui-overrides.js?v=20260905-1', 'data-portfolio-ui-overrides');
  }

  function loadPresentationControls(){
    loadScriptOnce('assets/content/presentation-controls.js?v=20260903-2', 'data-presentation-controls');
  }

  function loadPhotoPoolControls(){
    if (!isEnabled() || config.features?.portfolioPhotos === false) return;
    loadScriptOnce('assets/content/photo-pool-controls.js?v=20260905-1', 'data-photo-pool-controls');
  }

  function observePhotoGridWidth(){
    if (typeof ResizeObserver !== 'function') return;
    const grid = document.querySelector('#photo-grid');
    if (!grid) return;

    let lastWidth = -1;
    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect?.width || 0;
      if (!width || Math.abs(width - lastWidth) < 0.5) return;
      lastWidth = width;
      if (typeof window.layoutPhotos === 'function') window.layoutPhotos();
    });
    observer.observe(grid);
  }

  showInitialWorkOfflineState();

  window.SANITY_CONTENT = {
    isEnabled,
    query,
    imageUrl,
    fetchSiteCopy,
    fetchNavigation,
    fetchHomePageWorks,
    fetchPortfolioPhotos
  };

  if (isEnabled()) {
    fetchSiteCopy().catch((error) => {
      console.warn('[Sanity] Site copy unavailable.', error);
    });
    fetchNavigation()
      .then((items) => window.applySiteNavigation?.(items))
      .catch((error) => {
        console.warn('[Sanity] Navigation unavailable. OFFLINE state remains active.', error);
      });
  }

  const loadEnhancements = () => {
    loadGalleryLayout();
    loadPortfolioUiOverrides();
    loadPresentationControls();
    loadPhotoPoolControls();
    observePhotoGridWidth();
  };

  if (document.readyState === 'complete') loadEnhancements();
  else window.addEventListener('load', loadEnhancements, {once: true});
})();
