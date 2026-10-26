'use strict';

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const saveData = navigator.connection?.saveData === true;
const players = [];

document.querySelectorAll('video[data-video]').forEach(video => {
  const key = video.dataset.video;
  const button = document.querySelector(`[data-video-toggle="${key}"]`);
  const status = document.querySelector(`[data-video-status="${key}"]`);
  const name = key === 'hero' ? 'diagnóstico' : 'Fusio-Dose';
  let manualPause = false;
  let inView = false;
  let failed = false;
  video.muted = true;
  button.hidden = false;

  function update() {
    const playing = !video.paused;
    button.querySelector('span').textContent = playing ? 'Pausar' : 'Reproducir';
    button.querySelector('path').setAttribute('d', playing ? 'M9 5v14M15 5v14' : 'm9 5 10 7-10 7V5Z');
    button.setAttribute('aria-label', `${playing ? 'Pausar' : 'Reproducir'} video de ${name}`);
    button.setAttribute('aria-pressed', String(playing));
  }
  function load() {
    if (!video.getAttribute('src')) {
      video.src = video.dataset.src;
      video.load();
    }
  }
  async function play() {
    if (failed) return;
    load();
    try { await video.play(); } catch { update(); }
  }
  button.addEventListener('click', () => {
    if (video.paused) { manualPause = false; void play(); }
    else { manualPause = true; video.pause(); }
  });
  video.addEventListener('play', update);
  video.addEventListener('pause', update);
  video.addEventListener('error', () => {
    failed = true;
    button.hidden = true;
    status.textContent = 'El video no pudo cargar. Podés seguir viendo su imagen de portada.';
    status.hidden = false;
    video.removeAttribute('src');
    video.load();
  });
  const observer = new IntersectionObserver(entries => {
    inView = entries[0].isIntersecting;
    if (inView && !manualPause && !reducedMotion.matches && !saveData && !document.hidden) void play();
    else if (!inView) video.pause();
  }, { threshold: 0.25 });
  observer.observe(video);
  players.push({ video, resume() { if (inView && !manualPause && !reducedMotion.matches && !saveData) void play(); } });
  update();
});

reducedMotion.addEventListener('change', () => {
  if (reducedMotion.matches) players.forEach(({video}) => video.pause());
});
document.addEventListener('visibilitychange', () => {
  players.forEach(player => { if (document.hidden) player.video.pause(); else player.resume(); });
});

const photoLinks = [...document.querySelectorAll('[data-photo]')];
const dialog = document.querySelector('#photo-dialog');
const image = document.querySelector('#photo-image');
const caption = document.querySelector('#photo-caption');
const counter = document.querySelector('#photo-counter');
let current = 0;
let origin;

function showPhoto(index) {
  current = (index + photoLinks.length) % photoLinks.length;
  const link = photoLinks[current];
  const original = link.querySelector('img');
  image.src = link.href;
  image.alt = original.alt;
  image.width = original.width;
  image.height = original.height;
  caption.textContent = link.dataset.caption;
  counter.textContent = `${current + 1} de ${photoLinks.length}`;
}
photoLinks.forEach((link, index) => link.addEventListener('click', event => {
  if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || !dialog.showModal) return;
  event.preventDefault();
  origin = link;
  showPhoto(index);
  players.forEach(({video}) => video.pause());
  dialog.showModal();
}));
document.querySelector('#photo-prev').addEventListener('click', () => showPhoto(current - 1));
document.querySelector('#photo-next').addEventListener('click', () => showPhoto(current + 1));
document.querySelector('#photo-close').addEventListener('click', () => dialog.close());
dialog.addEventListener('keydown', event => {
  if (event.key === 'ArrowRight') { event.preventDefault(); showPhoto(current + 1); }
  if (event.key === 'ArrowLeft') { event.preventDefault(); showPhoto(current - 1); }
});
dialog.addEventListener('close', () => { origin?.focus({preventScroll:true}); players.forEach(player => player.resume()); });
