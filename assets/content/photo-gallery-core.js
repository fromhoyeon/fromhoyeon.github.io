/*
  Selected Photography base gallery behavior.
  Remote pool/deck state and advanced lightbox interactions are layered on top by
  photo-pool-controls.js and photo-lightbox-interactions.js.
*/

const photoGrid = document.querySelector('#photo-grid');
const shufflePhotos = document.querySelector('#shuffle-photos');
const lightbox = document.querySelector('#photo-lightbox');
const lightboxImage = document.querySelector('#lightbox-image');
const lightboxStatus = document.querySelector('#lightbox-status');
let photos = [];
let resizeTimer = null;
let lightboxIndex = -1;
let swipeStartX = null;
let swipeStartY = null;
let lightboxStatusTimer = null;
let photoShuffleInProgress = false;

function shuffled(items){
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function restoreGalleryViewport(anchorTop){
  if (anchorTop === null || anchorTop === undefined) return;
  requestAnimationFrame(() => {
    const delta = photoGrid.getBoundingClientRect().top - anchorTop;
    if (Math.abs(delta) < .5) return;
    const root = document.documentElement;
    const previousBehavior = root.style.scrollBehavior;
    root.style.scrollBehavior = 'auto';
    window.scrollBy(0, delta);
    requestAnimationFrame(() => { root.style.scrollBehavior = previousBehavior; });
  });
}

function showLightboxMessage(message, duration = 1500, tone = 'neutral'){
  if (!lightboxStatus) return;
  clearTimeout(lightboxStatusTimer);
  lightboxStatus.textContent = message;
  lightboxStatus.classList.remove('is-info', 'is-success');
  if (tone === 'info') lightboxStatus.classList.add('is-info');
  if (tone === 'success') lightboxStatus.classList.add('is-success');
  lightboxStatus.classList.add('is-visible');
  lightboxStatusTimer = setTimeout(() => {
    lightboxStatus.classList.remove('is-visible');
  }, duration);
}

function clearLightboxMessage(){
  clearTimeout(lightboxStatusTimer);
  lightboxStatusTimer = null;
  if (!lightboxStatus) return;
  lightboxStatus.classList.remove('is-visible', 'is-info', 'is-success');
  lightboxStatus.textContent = '';
}

// Replaced by photo-pool-controls.js once the canonical Sanity pool is available.
async function createPhotoSet(){ return false; }

function desiredRowHeight(width){
  if (width < 420) return 118;
  if (width < 620) return 150;
  if (width < 900) return 205;
  return 250;
}

function makeRows(items, width, gap, targetHeight){
  const rows = [];
  let current = [];
  let ratioSum = 0;
  items.forEach((item, index) => {
    current.push(item);
    ratioSum += item.ratio;
    const estimatedWidth = ratioSum * targetHeight + gap * (current.length - 1);
    const isLast = index === items.length - 1;
    if (estimatedWidth >= width * .94 || isLast) {
      rows.push(current);
      current = [];
      ratioSum = 0;
    }
  });
  return rows;
}

function makeMobileRows(items, rowCount = 4){
  const rows = [];
  const base = Math.floor(items.length / rowCount);
  const remainder = items.length % rowCount;
  let cursor = 0;
  for (let i = 0; i < rowCount; i += 1) {
    const count = base + (i < remainder ? 1 : 0);
    if (count <= 0) continue;
    rows.push(items.slice(cursor, cursor + count));
    cursor += count;
  }
  return rows;
}

function layoutPhotos(){
  const width = photoGrid.clientWidth;
  if (!width || !photos.length) return;
  const gap = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--s')) || 8;
  const targetHeight = desiredRowHeight(width);
  const isMobile = window.matchMedia('(max-width:620px)').matches;
  const rows = isMobile ? makeMobileRows(photos, 4) : makeRows(photos, width, gap, targetHeight);
  photoGrid.innerHTML = '';

  rows.forEach((row, rowIndex) => {
    const isLast = rowIndex === rows.length - 1;
    const ratioSum = row.reduce((sum, item) => sum + item.ratio, 0);
    const usableWidth = width - gap * (row.length - 1);
    const justifiedHeight = usableWidth / ratioSum;
    let rowHeight = justifiedHeight;
    if (!isMobile && isLast && justifiedHeight > targetHeight * 1.18) rowHeight = targetHeight;
    if (!isMobile) rowHeight = Math.max(82, Math.min(rowHeight, 330));

    const rowEl = document.createElement('div');
    rowEl.className = 'photo-row';
    row.forEach((item) => {
      const cell = document.createElement('button');
      cell.className = 'photo-cell';
      cell.type = 'button';
      cell.style.width = `${item.ratio * rowHeight}px`;
      cell.style.height = `${rowHeight}px`;
      cell.setAttribute('aria-label', `Enlarge ${item.file || item.title || 'photograph'}`);

      const img = document.createElement('img');
      img.src = item.src;
      img.alt = item.alt || '';
      img.loading = 'lazy';
      img.decoding = 'async';
      cell.appendChild(img);
      cell.addEventListener('click', () => openLightbox(item));
      rowEl.appendChild(cell);
    });
    photoGrid.appendChild(rowEl);
  });
}

function showLightboxIndex(index){
  if (!photos.length) return;
  lightboxIndex = Math.max(0, Math.min(index, photos.length - 1));
  const item = photos[lightboxIndex];
  lightboxImage.src = item.fullSrc || item.src;
  lightboxImage.alt = item.alt || item.title || item.file || '';

  const next = photos[lightboxIndex + 1];
  const prev = photos[lightboxIndex - 1];
  [next, prev].forEach((neighbor) => {
    if (!neighbor) return;
    const preload = new Image();
    preload.src = neighbor.fullSrc || neighbor.src;
  });
}

function openLightbox(item){
  const index = Math.max(0, photos.indexOf(item));
  clearLightboxMessage();
  showLightboxIndex(index);
  lightbox.classList.add('is-open');
  lightbox.setAttribute('aria-hidden', 'false');
  document.body.classList.add('lightbox-open');
}

// Replaced by photo-pool-controls.js when the remote deck is ready.
async function reshuffleFromLightboxEnd(){ return false; }

function stepLightbox(direction){
  if (!lightbox.classList.contains('is-open') || !photos.length) return;

  if (direction < 0) {
    if (lightboxIndex <= 0) {
      showLightboxMessage(`First image · 1 / ${photos.length}`);
      return;
    }
    const nextIndex = lightboxIndex - 1;
    showLightboxIndex(nextIndex);
    if (nextIndex === 0) showLightboxMessage(`First image · 1 / ${photos.length}`);
    return;
  }

  if (direction > 0) {
    if (lightboxIndex >= photos.length - 1) {
      reshuffleFromLightboxEnd();
      return;
    }
    showLightboxIndex(lightboxIndex + 1);
  }
}

function closeLightbox(){
  lightbox.classList.remove('is-open');
  lightbox.setAttribute('aria-hidden', 'true');
  lightboxImage.removeAttribute('src');
  document.body.classList.remove('lightbox-open');
  clearLightboxMessage();
  lightboxIndex = -1;
}

shufflePhotos.addEventListener('click', () => createPhotoSet({preservePosition:true}));
lightbox.addEventListener('click', (event) => {
  if (event.target === lightbox) closeLightbox();
});
lightbox.addEventListener('touchstart', (event) => {
  const touch = event.changedTouches[0];
  swipeStartX = touch.clientX;
  swipeStartY = touch.clientY;
}, {passive:true});
lightbox.addEventListener('touchend', (event) => {
  if (swipeStartX === null || swipeStartY === null) return;
  const touch = event.changedTouches[0];
  const dx = touch.clientX - swipeStartX;
  const dy = touch.clientY - swipeStartY;
  swipeStartX = null;
  swipeStartY = null;
  if (Math.abs(dx) < 45 || Math.abs(dx) <= Math.abs(dy)) return;
  stepLightbox(dx < 0 ? 1 : -1);
}, {passive:true});
document.addEventListener('keydown', (event) => {
  if (!lightbox.classList.contains('is-open')) return;
  if (event.key === 'Escape') closeLightbox();
  if (event.key === 'ArrowRight') stepLightbox(1);
  if (event.key === 'ArrowLeft') stepLightbox(-1);
});
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(layoutPhotos, 90);
});
