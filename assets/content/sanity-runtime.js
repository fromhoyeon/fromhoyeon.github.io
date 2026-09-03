/*
  Optional Sanity content adapter for GitHub Pages.
  The work area starts in an explicit OFFLINE state and is replaced only when
  published Sanity homepage content arrives successfully.
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

  function imageUrl(url, width){
    if (!url) return '';
    const output = new URL(url);
    if (width) output.searchParams.set('w', String(width));
    output.searchParams.set('fit', 'max');
    output.searchParams.set('auto', 'format');
    return output.toString();
  }

  async function fetchSiteCopy(){
    if (!isEnabled() || config.features?.siteCopy === false) return null;

    const copy = await query(`*[_type == "siteCopy"][0]{
      site,
      intro,
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
        tags,
        contentBlocks[]{
          _key,
          _type,
          title,
          text,
          youtubeUrl,
          embedUrl,
          externalUrl,
          rowCount,
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
      series,
      year,
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
        src: imageUrl(item.url, 1600),
        fullSrc: imageUrl(item.url, 2600)
      }));
  }

  function loadGalleryLayout(){
    if (!isEnabled() || config.features?.workEntries === false) return;
    if (document.querySelector('script[data-sanity-gallery-layout]')) return;
    const script = document.createElement('script');
    script.src = 'assets/content/sanity-gallery-layout.js?v=20260903-1';
    script.dataset.sanityGalleryLayout = 'true';
    document.head.appendChild(script);
  }

  showInitialWorkOfflineState();

  window.SANITY_CONTENT = {
    isEnabled,
    query,
    imageUrl,
    fetchSiteCopy,
    fetchHomePageWorks,
    fetchPortfolioPhotos
  };

  if (isEnabled()) {
    fetchSiteCopy().catch((error) => {
      console.warn('[Sanity] Site copy unavailable.', error);
    });
  }

  if (document.readyState === 'complete') loadGalleryLayout();
  else window.addEventListener('load', loadGalleryLayout, {once: true});
})();