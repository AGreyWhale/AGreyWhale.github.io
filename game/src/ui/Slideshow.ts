import { mediaUrl, site } from '../content/site';
import { h } from './dom';

function imgFor(path: string, alt: string): HTMLImageElement {
  const m = site.media[path];
  return h('img', {
    src: mediaUrl(path),
    alt,
    loading: 'lazy',
    decoding: 'async',
    width: m ? String(m.w) : undefined,
    height: m ? String(m.h) : undefined,
  });
}

/**
 * Accessible photo carousel: one image at a time, prev/next buttons, a live
 * counter, and arrow keys when focused. Images are the compressed copies.
 */
export function createSlideshow(paths: string[], label: string): HTMLElement {
  let index = 0;
  const frame = h('div', { class: 'slides-frame' });
  const counter = h('span', { class: 'slides-counter', 'aria-live': 'polite' });
  const prev = h('button', { type: 'button', class: 'icon-btn', 'aria-label': 'Previous photo' }, '←');
  const next = h('button', { type: 'button', class: 'icon-btn', 'aria-label': 'Next photo' }, '→');

  const render = () => {
    if (!paths.length) {
      frame.replaceChildren(h('p', { class: 'slides-empty' }, 'Photos coming soon'));
      counter.textContent = '';
      return;
    }
    frame.replaceChildren(imgFor(paths[index], `${label}: photo ${index + 1} of ${paths.length}`));
    counter.textContent = `${index + 1} / ${paths.length}`;
  };
  const go = (d: number) => {
    if (!paths.length) return;
    index = (index + d + paths.length) % paths.length;
    render();
  };
  prev.addEventListener('click', () => go(-1));
  next.addEventListener('click', () => go(1));

  const root = h(
    'section',
    { class: 'slides', 'aria-roledescription': 'carousel', 'aria-label': label },
    h('p', { class: 'slides-label' }, label),
    frame,
    paths.length > 1 ? h('div', { class: 'slides-controls' }, prev, counter, next) : null,
  );
  root.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      e.preventDefault();
      e.stopPropagation();
      go(e.key === 'ArrowLeft' ? -1 : 1);
    }
  });
  render();
  return root;
}

/**
 * Brings the slideshows inside the extracted coursework markup to life
 * (courses.html wires them with inline script, which the extractor strips).
 */
export function wireCourseworkSlideshows(root: HTMLElement): void {
  for (const show of root.querySelectorAll<HTMLElement>('[data-slideshow]')) {
    const set = show.dataset.slideshow!;
    const paths = site.coursework.slideshows[set] ?? [];
    const counter = root.querySelector<HTMLElement>(`[data-counter="${set}"]`);
    let index = 0;
    const render = () => {
      if (!paths.length) return; // keep the "Photos coming soon" placeholder
      const slide = h('div', { class: 'slide active' }, imgFor(paths[index], `${set} photo ${index + 1} of ${paths.length}`));
      show.replaceChildren(slide);
      if (counter) counter.textContent = `${index + 1} / ${paths.length}`;
    };
    root.querySelectorAll<HTMLButtonElement>(`[data-set="${set}"]`).forEach((btn) =>
      btn.addEventListener('click', () => {
        if (!paths.length) return;
        index = (index + (btn.dataset.slide === 'prev' ? -1 : 1) + paths.length) % paths.length;
        render();
      }),
    );
    render();
  }
}
