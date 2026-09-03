/*
  Optional intro accent image
  ---------------------------
  The image and its placement are managed in Sanity Site Copy > Intro.
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
      .intro-accent{width:64px;max-width:18vw;margin:0;padding:0}
      .intro-accent img{display:block;width:100%;height:auto;max-height:96px;object-fit:contain;object-position:left center}
      .intro-accent[data-position="beforeTitle"]{margin-bottom:calc(12px - var(--l))}
      .intro-accent[data-position="afterTitle"]{margin-top:calc(12px - var(--l));margin-bottom:calc(12px - var(--l))}
      .intro-accent[data-position="afterBody"]{margin-top:calc(12px - var(--l))}
      @media (max-width:620px){
        .intro-accent{width:56px;max-width:20vw}
        .intro-accent img{max-height:84px}
      }
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

  try {
    const data = await window.SANITY_CONTENT.query(`*[_type == "siteCopy"][0]{
      "accentImageUrl": intro.accentImage.asset->url,
      "accentImageAlt": intro.accentImageAlt,
      "accentImageEnabled": intro.accentImageEnabled,
      "accentImagePosition": intro.accentImagePosition
    }`);

    if (!data?.accentImageUrl || data.accentImageEnabled === false) return;

    const figure = document.createElement('figure');
    figure.className = 'intro-accent';
    figure.setAttribute('aria-label', 'Intro accent image');

    const image = document.createElement('img');
    image.src = window.SANITY_CONTENT.imageUrl(data.accentImageUrl, 320);
    image.alt = data.accentImageAlt || '';
    image.decoding = 'async';
    figure.appendChild(image);

    placeAccent(figure, data.accentImagePosition);
  } catch (error) {
    console.warn('[Sanity] Intro accent image unavailable.', error);
  }
})();
