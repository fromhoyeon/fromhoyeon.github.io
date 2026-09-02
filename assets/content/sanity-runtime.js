/*
  Optional Sanity content adapter for GitHub Pages.
  The site remains fully functional when Sanity is disabled or unavailable.
*/

(function initSanityRuntime(){
  const config = window.SANITY_CONFIG || {};

  function isEnabled(){
    return Boolean(
      config.enabled &&
      config.projectId &&
      config.dataset &&
      config.apiVersion
    );
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

  window.SANITY_CONTENT = {
    isEnabled,
    query,
    imageUrl,
    fetchSiteCopy,
    fetchPortfolioPhotos
  };

  if (isEnabled()) {
    fetchSiteCopy().catch((error) => {
      console.warn('[Sanity] Using local site-copy fallback.', error);
    });
  }
})();
