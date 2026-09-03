/*
  Sanity work-gallery layout helper.
  Editors choose only rowCount. The browser preserves image ratios, keeps equal image
  heights inside each row, and automatically distributes images across the requested rows.
  Sparse rows are capped vertically instead of being stretched to fill the full width.
*/

(function initSanityGalleryLayout(){
  if (window.__SANITY_GALLERY_LAYOUT_LOADED__) return;
  window.__SANITY_GALLERY_LAYOUT_LOADED__ = true;
  if (!window.SANITY_CONTENT?.isEnabled()) return;

  let homepageWorks = [];
  let applyTimer = null;
  let galleryLightboxItems = [];
  let galleryLightboxIndex = -1;
  let gallerySwipeStartX = null;
  let gallerySwipeStartY = null;

  function clamp(value, min, max){
    return Math.max(min, Math.min(max, value));
  }

  function escaped(value){
    if (window.CSS?.escape) return CSS.escape(value);
    return String(value).replace(/(["\\])/g, '\\$1');
  }

  function gapSize(element){
    const styles = getComputedStyle(element);
    const gap = parseFloat(styles.columnGap || styles.gap);
    if (Number.isFinite(gap)) return gap;
    const rootGap = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--s'));
    return Number.isFinite(rootGap) ? rootGap : 8;
  }

  function maxRowHeight(width){
    const mobile = window.matchMedia('(max-width:620px)').matches;
    if (mobile) return clamp(width * 0.48, 145, 210);
    return clamp(width * 0.29, 195, 310);
  }

  function rowHeight(ratios, start, end, width, gap){
    let sum = 0;
    for (let i = start; i < end; i += 1) sum += ratios[i];
    const count = end - start;
    if (!sum || count < 1) return 0;
    return Math.max(1, (width - gap * (count - 1)) / sum);
  }

  function balancedPartitions(ratios, requestedRows, width, gap){
    const count = ratios.length;
    const rows = clamp(Math.round(Number(requestedRows) || 1), 1, count);
    if (rows === 1) return [[0, count]];

    const ratioTotal = ratios.reduce((sum, ratio) => sum + ratio, 0);
    const targetHeight = Math.max(1, (rows * width - gap * (count - rows)) / ratioTotal);
    const dp = Array.from({length: rows + 1}, () => Array(count + 1).fill(Infinity));
    const previous = Array.from({length: rows + 1}, () => Array(count + 1).fill(-1));
    dp[0][0] = 0;

    for (let row = 1; row <= rows; row += 1) {
      for (let end = row; end <= count; end += 1) {
        for (let start = row - 1; start < end; start += 1) {
          if (!Number.isFinite(dp[row - 1][start])) continue;
          const height = rowHeight(ratios, start, end, width, gap);
          const delta = height - targetHeight;
          const cost = dp[row - 1][start] + delta * delta;
          if (cost < dp[row][end]) {
            dp[row][end] = cost;
            previous[row][end] = start;
          }
        }
      }
    }

    const partitions = [];
    let end = count;
    for (let row = rows; row >= 1; row -= 1) {
      const start = previous[row][end];
      if (start < 0) return [[0, count]];
      partitions.unshift([start, end]);
      end = start;
    }
    return partitions;
  }

  function resetFigure(figure){
    figure.style.removeProperty('width');
    figure.style.removeProperty('flex');
    const image = figure.querySelector('img');
    if (image) {
      image.style.removeProperty('height');
      image.style.removeProperty('width');
      image.style.removeProperty('object-fit');
    }
  }

  function flattenFigures(grid){
    const figures = Array.from(grid.querySelectorAll('.sanity-gallery-item'));
    figures.forEach(resetFigure);
    grid.replaceChildren(...figures);
    return figures;
  }

  function ratioFor(figure, item){
    const width = Number(item?.width);
    const height = Number(item?.height);
    if (width > 0 && height > 0) return width / height;

    const image = figure.querySelector('img');
    if (image?.naturalWidth > 0 && image?.naturalHeight > 0) {
      return image.naturalWidth / image.naturalHeight;
    }
    return 0;
  }

  function gallerySource(item, full = false){
    if (item?.imageUrl) return window.SANITY_CONTENT.imageUrl(item.imageUrl, full ? 2600 : 1800);
    return item?.externalUrl || '';
  }

  function ensureGalleryLightbox(){
    let lightbox = document.querySelector('#work-gallery-lightbox');
    if (lightbox) return lightbox;

    lightbox = document.createElement('div');
    lightbox.className = 'lightbox';
    lightbox.id = 'work-gallery-lightbox';
    lightbox.setAttribute('role', 'dialog');
    lightbox.setAttribute('aria-modal', 'true');
    lightbox.setAttribute('aria-label', 'Expanded work image');
    lightbox.setAttribute('aria-hidden', 'true');

    const close = document.createElement('button');
    close.className = 'lightbox-close';
    close.type = 'button';
    close.textContent = 'Close';
    close.setAttribute('aria-label', 'Close expanded image');

    const image = document.createElement('img');
    image.alt = '';
    image.draggable = false;

    function showIndex(index){
      if (!galleryLightboxItems.length) return;
      galleryLightboxIndex = (index + galleryLightboxItems.length) % galleryLightboxItems.length;
      const item = galleryLightboxItems[galleryLightboxIndex];
      image.src = gallerySource(item, true);
      image.alt = item?.alt || item?.caption || '';

      const next = galleryLightboxItems[(galleryLightboxIndex + 1) % galleryLightboxItems.length];
      const prev = galleryLightboxItems[(galleryLightboxIndex - 1 + galleryLightboxItems.length) % galleryLightboxItems.length];
      [next, prev].forEach((neighbor) => {
        const src = gallerySource(neighbor, true);
        if (!src) return;
        const preload = new Image();
        preload.src = src;
      });
    }

    function closeLightbox(){
      lightbox.classList.remove('is-open');
      lightbox.setAttribute('aria-hidden', 'true');
      image.removeAttribute('src');
      document.body.classList.remove('lightbox-open');
      galleryLightboxItems = [];
      galleryLightboxIndex = -1;
    }

    function step(direction){
      if (!lightbox.classList.contains('is-open')) return;
      showIndex(galleryLightboxIndex + direction);
    }

    close.addEventListener('click', closeLightbox);
    lightbox.addEventListener('click', (event) => {
      if (event.target === lightbox) closeLightbox();
    });
    lightbox.addEventListener('touchstart', (event) => {
      const touch = event.changedTouches[0];
      gallerySwipeStartX = touch.clientX;
      gallerySwipeStartY = touch.clientY;
    }, {passive: true});
    lightbox.addEventListener('touchend', (event) => {
      if (gallerySwipeStartX === null || gallerySwipeStartY === null) return;
      const touch = event.changedTouches[0];
      const dx = touch.clientX - gallerySwipeStartX;
      const dy = touch.clientY - gallerySwipeStartY;
      gallerySwipeStartX = null;
      gallerySwipeStartY = null;
      if (Math.abs(dx) < 45 || Math.abs(dx) <= Math.abs(dy)) return;
      step(dx < 0 ? 1 : -1);
    }, {passive: true});
    document.addEventListener('keydown', (event) => {
      if (!lightbox.classList.contains('is-open')) return;
      if (event.key === 'Escape') closeLightbox();
      if (event.key === 'ArrowRight') step(1);
      if (event.key === 'ArrowLeft') step(-1);
    });

    lightbox.append(close, image);
    document.body.appendChild(lightbox);
    lightbox.__showGalleryIndex = showIndex;
    return lightbox;
  }

  function openGalleryLightbox(items, index){
    const validItems = items.filter((item) => gallerySource(item, true));
    if (!validItems.length) return;

    const requested = items[index];
    galleryLightboxItems = validItems;
    const resolvedIndex = Math.max(0, validItems.indexOf(requested));
    const lightbox = ensureGalleryLightbox();
    lightbox.__showGalleryIndex?.(resolvedIndex);
    lightbox.classList.add('is-open');
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.classList.add('lightbox-open');
    lightbox.querySelector('.lightbox-close')?.focus();
  }

  function bindGalleryLightbox(figures, items){
    figures.forEach((figure, index) => {
      const source = gallerySource(items[index], true);
      if (!source) return;
      figure.dataset.galleryLightbox = 'true';
      figure.tabIndex = 0;
      figure.setAttribute('role', 'button');
      figure.setAttribute('aria-label', `Enlarge ${items[index]?.alt || items[index]?.caption || `image ${index + 1}`}`);
      if (figure.dataset.galleryLightboxBound === 'true') return;
      figure.dataset.galleryLightboxBound = 'true';
      figure.addEventListener('click', () => openGalleryLightbox(items, index));
      figure.addEventListener('keydown', (event) => {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault();
        openGalleryLightbox(items, index);
      });
    });
  }

  function ensureGalleryStyles(){
    if (document.querySelector('#sanity-gallery-layout-styles')) return;
    const style = document.createElement('style');
    style.id = 'sanity-gallery-layout-styles';
    style.textContent = `
      .sanity-gallery-item[data-gallery-lightbox="true"]{cursor:zoom-in}
      .sanity-gallery-item[data-gallery-lightbox="true"]:focus-visible{outline:2px solid var(--fg);outline-offset:3px}
    `;
    document.head.appendChild(style);
  }

  function waitForRatios(grid, block, figures){
    grid.style.visibility = 'hidden';
    figures.forEach((figure) => {
      const image = figure.querySelector('img');
      if (!image || image.complete || image.dataset.galleryRatioWait === 'true') return;
      image.dataset.galleryRatioWait = 'true';
      image.addEventListener('load', () => {
        delete image.dataset.galleryRatioWait;
        layoutGallery(grid, block, true);
      }, {once: true});
    });
  }

  function layoutGallery(grid, block, force = false){
    if (!grid || !block) return;

    const directFigures = Array.from(grid.children).filter((child) => child.classList?.contains('sanity-gallery-item'));
    if (!force && directFigures.length === 0 && grid.dataset.galleryLayoutApplied === 'true') return;

    const figures = force ? flattenFigures(grid) : directFigures;
    if (!figures.length) return;

    const items = Array.isArray(block.images) ? block.images : [];
    const ratios = figures.map((figure, index) => ratioFor(figure, items[index]));
    if (ratios.some((ratio) => !(ratio > 0))) {
      waitForRatios(grid, block, figures);
      return;
    }

    const width = grid.clientWidth || grid.parentElement?.clientWidth || 0;
    if (!(width > 0)) {
      requestAnimationFrame(() => layoutGallery(grid, block, true));
      return;
    }

    bindGalleryLightbox(figures, items);

    const gap = gapSize(grid);
    const rowCount = clamp(Math.round(Number(block.rowCount) || 1), 1, figures.length);
    const partitions = balancedPartitions(ratios, rowCount, width, gap);
    const fragment = document.createDocumentFragment();
    const heightLimit = maxRowHeight(width);

    grid.style.display = 'grid';
    grid.style.gridTemplateColumns = '1fr';
    grid.style.gap = 'var(--s)';
    grid.style.alignItems = 'start';

    partitions.forEach(([start, end]) => {
      const row = document.createElement('div');
      row.className = 'sanity-gallery-row';
      row.style.display = 'flex';
      row.style.gap = 'var(--s)';
      row.style.width = '100%';
      row.style.alignItems = 'flex-start';
      row.style.justifyContent = 'flex-start';

      const justifiedHeight = rowHeight(ratios, start, end, width, gap);
      const height = Math.min(justifiedHeight, heightLimit);
      const isCapped = justifiedHeight > heightLimit + 0.5;
      row.dataset.galleryRowMode = isCapped ? 'capped' : 'justified';

      for (let index = start; index < end; index += 1) {
        const figure = figures[index];
        const image = figure.querySelector('img');
        const figureWidth = ratios[index] * height;
        figure.style.width = `${figureWidth}px`;
        figure.style.flex = `0 0 ${figureWidth}px`;
        if (image) {
          image.style.width = '100%';
          image.style.height = `${height}px`;
          image.style.objectFit = 'contain';
        }
        row.appendChild(figure);
      }
      fragment.appendChild(row);
    });

    grid.replaceChildren(fragment);
    grid.style.visibility = 'visible';
    grid.dataset.galleryLayoutApplied = 'true';
    grid.dataset.galleryLayoutWidth = String(Math.round(width * 10) / 10);
    grid.__sanityGalleryBlock = block;
    observeWidth(grid.parentElement || grid);
  }

  const resizeObserver = 'ResizeObserver' in window
    ? new ResizeObserver((entries) => {
        entries.forEach((entry) => {
          const grid = entry.target.querySelector?.('.sanity-gallery-grid') || (entry.target.classList?.contains('sanity-gallery-grid') ? entry.target : null);
          if (!grid?.__sanityGalleryBlock) return;
          const width = grid.clientWidth || 0;
          const previous = Number(grid.dataset.galleryLayoutWidth || 0);
          if (Math.abs(width - previous) > 0.5) layoutGallery(grid, grid.__sanityGalleryBlock, true);
        });
      })
    : null;

  function observeWidth(element){
    if (!resizeObserver || !element || element.dataset.galleryResizeObserved === 'true') return;
    element.dataset.galleryResizeObserved = 'true';
    resizeObserver.observe(element);
  }

  function applyKnownWorks(){
    homepageWorks.forEach((work) => {
      const blocks = Array.isArray(work.contentBlocks) ? work.contentBlocks : [];
      blocks.filter((block) => block?._type === 'workGalleryBlock').forEach((block) => {
        const section = document.querySelector(`[data-sanity-work-slug="${escaped(work.slug)}"]`) || document.getElementById(work.slug);
        if (!section) return;
        const wrapper = section.querySelector(`[data-block-key="${escaped(block._key || '')}"]`);
        const grid = wrapper?.querySelector('.sanity-gallery-grid');
        if (!grid) return;
        grid.__sanityGalleryBlock = block;
        const hasDirectFigures = Array.from(grid.children).some((child) => child.classList?.contains('sanity-gallery-item'));
        if (hasDirectFigures || grid.dataset.galleryLayoutApplied !== 'true') layoutGallery(grid, block, false);
      });
    });
  }

  function scheduleApply(){
    clearTimeout(applyTimer);
    applyTimer = setTimeout(applyKnownWorks, 0);
  }

  const mutationObserver = new MutationObserver((mutations) => {
    const hasFreshGallery = mutations.some((mutation) => Array.from(mutation.addedNodes || []).some((node) => (
      node.nodeType === 1 && (
        node.classList?.contains('sanity-gallery-grid') ||
        node.querySelector?.('.sanity-gallery-grid')
      )
    )));
    if (hasFreshGallery) scheduleApply();
  });

  async function start(){
    try {
      ensureGalleryStyles();
      homepageWorks = await window.SANITY_CONTENT.fetchHomePageWorks();
      applyKnownWorks();
      mutationObserver.observe(document.body, {childList: true, subtree: true});
    } catch (error) {
      console.warn('[Sanity] Gallery row layout unavailable.', error);
    }
  }

  start();
})();