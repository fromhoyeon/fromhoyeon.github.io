/*
  Optional intro accent image
  ---------------------------
  The image, placement, size and alignment are managed in Sanity Site Copy > Intro.
  Layout remains owned by GitHub; missing or disabled image content stays hidden.
*/

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
      .intro-accent{width:var(--intro-accent-width,96px);max-width:min(80vw,320px);margin:0;padding:0;border:1px solid var(--fg)}
      .intro-accent img{display:block;width:100%;height:auto;object-fit:contain}
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
    const resolved = ['beforeTitle', 'afterTitle', 'afterBody'].includes(position)
      ? position
      : 'beforeTitle';

    figure.dataset.position = resolved;
    if (resolved === 'beforeTitle') {
      intro.insertBefore(figure, title);
    } else if (resolved === 'afterTitle') {
      intro.insertBefore(figure, copy);
    } else {
      intro.appendChild(figure);
    }
  }

  function resolveWidth(value){
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return 96;
    return Math.min(320, Math.max(32, Math.round(parsed)));
  }

  function resolveAlign(value){
    return ['left', 'center', 'right'].includes(value) ? value : 'center';
  }

  try {
    const data = await window.SANITY_CONTENT.query(`*[_type == "siteCopy"][0]{
      "accentImageUrl": intro.accentImage.asset->url,
      "accentImageAlt": intro.accentImageAlt,
      "accentImageEnabled": intro.accentImageEnabled,
      "accentImagePosition": intro.accentImagePosition,
      "accentImageWidth": intro.accentImageWidth,
      "accentImageAlign": intro.accentImageAlign
    }`);

    if (!data?.accentImageUrl || data.accentImageEnabled === false) return;

    const width = resolveWidth(data.accentImageWidth);
    const align = resolveAlign(data.accentImageAlign);

    const figure = document.createElement('figure');
    figure.className = 'intro-accent';
    figure.dataset.align = align;
    figure.style.setProperty('--intro-accent-width', `${width}px`);
    figure.setAttribute('aria-label', 'Intro accent image');

    const image = document.createElement('img');
    const sourceWidth = Math.min(1200, Math.max(320, width * 3));
    image.src = window.SANITY_CONTENT.imageUrl(data.accentImageUrl, sourceWidth);
    image.alt = data.accentImageAlt || '';
    image.decoding = 'async';
    figure.appendChild(image);

    placeAccent(figure, data.accentImagePosition);
  } catch (error) {
    console.warn('[Sanity] Intro accent image unavailable.', error);
  }
})();
