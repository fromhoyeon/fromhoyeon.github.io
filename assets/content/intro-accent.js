/* Homepage intro accent image pool. */
(async function initIntroAccent(){
  if (window.__INTRO_ACCENT_LOADED__) return;
  window.__INTRO_ACCENT_LOADED__ = true;
  if (!window.SANITY_CONTENT?.isEnabled?.()) return;

  const intro = document.querySelector('.intro');
  const title = intro?.querySelector('h1');
  const copy = intro?.querySelector('.intro-copy');
  if (!intro || !title || !copy) return;

  if (!document.querySelector('#intro-accent-styles')) {
    const style = document.createElement('style');
    style.id = 'intro-accent-styles';
    style.textContent = `
      .intro-accent{width:var(--intro-accent-width,96px);max-width:min(80vw,320px);aspect-ratio:1/1;margin:0;padding:0;overflow:hidden;border:1px solid var(--media-black)}
      :root[data-site-theme="black"] .intro-accent{border-color:var(--media-white)}
      .intro-accent img{display:block;width:100%;height:100%;object-fit:cover}
      .intro-accent[data-interactive="true"]{cursor:pointer}
      .intro-accent[data-interactive="true"]:focus-visible{outline:1px solid var(--fg);outline-offset:3px}
      .intro-accent[data-align="left"]{justify-self:start}
      .intro-accent[data-align="center"]{justify-self:center}
      .intro-accent[data-align="right"]{justify-self:end}
      .intro-accent[data-position="beforeTitle"]{margin-bottom:calc(12px - var(--l))}
      .intro-accent[data-position="afterTitle"]{margin-top:calc(12px - var(--l));margin-bottom:calc(12px - var(--l))}
      .intro-accent[data-position="afterBody"]{margin-top:calc(12px - var(--l))}
    `;
    document.head.appendChild(style);
  }

  function placeAccent(figure, position){
    const resolved = ['beforeTitle', 'afterTitle', 'afterBody'].includes(position) ? position : 'beforeTitle';
    figure.dataset.position = resolved;
    if (resolved === 'beforeTitle') intro.insertBefore(figure, title);
    else if (resolved === 'afterTitle') intro.insertBefore(figure, copy);
    else intro.appendChild(figure);
  }

  function resolveWidth(value){
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return 96;
    return Math.min(320, Math.max(32, Math.round(parsed)));
  }

  function resolveAlign(value){
    return ['left', 'center', 'right'].includes(value) ? value : 'center';
  }

  function squareImageUrl(url, width){
    const output = new URL(url);
    const size = Math.min(1280, Math.max(384, Math.round(width * 4)));
    output.searchParams.set('w', String(size));
    output.searchParams.set('h', String(size));
    output.searchParams.set('fit', 'crop');
    output.searchParams.set('crop', 'center');
    output.searchParams.set('q', '80');
    output.searchParams.set('auto', 'format');
    return output.toString();
  }

  function randomIndex(length, current = -1){
    if (length <= 1) return 0;
    const offset = Math.floor(Math.random() * (length - 1)) + 1;
    return (current + offset) % length;
  }

  try {
    const data = await window.SANITY_CONTENT.query(`*[_type == "siteCopy"][0]{
      "accentImages": intro.accentImages[]{_key,alt,"url":asset->url},
      "legacyUrl": intro.accentImage.asset->url,
      "legacyAlt": intro.accentImageAlt,
      "enabled": intro.accentImageEnabled,
      "position": intro.accentImagePosition,
      "width": intro.accentImageWidth,
      "align": intro.accentImageAlign
    }`);

    if (data?.enabled === false) return;

    const pool = (data?.accentImages || [])
      .filter((item) => item?.url)
      .map((item) => ({url:item.url, alt:item.alt || ''}));

    if (!pool.length && data?.legacyUrl) pool.push({url:data.legacyUrl, alt:data.legacyAlt || ''});
    if (!pool.length) return;

    const width = resolveWidth(data.width);
    const figure = document.createElement('figure');
    figure.className = 'intro-accent';
    figure.dataset.align = resolveAlign(data.align);
    figure.style.setProperty('--intro-accent-width', `${width}px`);

    const image = document.createElement('img');
    image.decoding = 'async';
    image.draggable = false;
    figure.appendChild(image);

    let currentIndex = randomIndex(pool.length);
    function showImage(index){
      currentIndex = index;
      image.src = squareImageUrl(pool[index].url, width);
      image.alt = pool[index].alt;
    }
    showImage(currentIndex);

    if (pool.length > 1) {
      figure.dataset.interactive = 'true';
      figure.setAttribute('role', 'button');
      figure.setAttribute('tabindex', '0');
      figure.setAttribute('aria-label', 'Show another dog image');
      const showAnother = () => showImage(randomIndex(pool.length, currentIndex));
      figure.addEventListener('click', showAnother);
      figure.addEventListener('keydown', (event) => {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault();
        showAnother();
      });
    } else {
      figure.setAttribute('aria-label', 'Intro accent image');
    }

    placeAccent(figure, data.position);
  } catch (error) {
    console.warn('[Sanity] Intro accent image unavailable.', error);
  }
})();
