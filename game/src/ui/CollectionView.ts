import { collectibleKinds, funFacts, GALLERY_UNLOCK, type CollectibleKind } from '../content/collectibles';
import { galleryPhotos } from '../content/gallery';
import { rewards } from '../content/rewards';
import { mediaUrl, site } from '../content/site';
import type { Accessory, ActionDef } from '../content/types';
import type { Progress } from '../systems/CollectibleSystem';
import { h } from './dom';

/** The satchel: progress per collectible type, unlocked fun facts, gallery access. */
export function renderCollection(
  p: Progress,
  runAction: (a: ActionDef) => void,
  earned: Accessory[] = [],
  pets: { petted: number; total: number } = { petted: 0, total: 0 },
): HTMLElement {
  const rows = (Object.keys(collectibleKinds) as CollectibleKind[]).map((k) => {
    const { found, total } = p.byKind[k];
    const meta = collectibleKinds[k];
    return h(
      'li',
      { class: found === total ? 'done' : undefined },
      h('span', { class: 'col-icon', 'aria-hidden': 'true' }, meta.icon),
      h('span', { class: 'col-label' }, meta.label),
      h('progress', { max: String(total), value: String(found), 'aria-label': `${meta.label} found` }),
      h('span', { class: 'col-count' }, `${found}/${total}`),
    );
  });

  const root = h(
    'div',
    { class: 'collection' },
    h('p', { class: 'lead' }, p.allFound ? 'You found everything. Thank you for exploring!' : `Found ${p.found} of ${p.total} hidden things around town.`),
    h(
      'ul',
      { class: 'col-list' },
      ...rows,
      h(
        'li',
        { class: pets.total && pets.petted === pets.total ? 'done' : undefined },
        h('span', { class: 'col-icon', 'aria-hidden': 'true' }, '🐈'),
        h('span', { class: 'col-label' }, 'Cats petted'),
        h('progress', { max: String(pets.total), value: String(pets.petted), 'aria-label': 'Cats petted' }),
        h('span', { class: 'col-count' }, `${pets.petted}/${pets.total}`),
      ),
    ),
    h('h3', { class: 'block-heading' }, 'Wardrobe rewards'),
    h(
      'ul',
      { class: 'reward-list' },
      ...rewards.map((r) => {
        const have = earned.includes(r.accessory);
        return h(
          'li',
          { class: have ? 'have' : undefined },
          h('span', { class: 'reward-mark', 'aria-hidden': 'true' }, have ? '✦' : '·'),
          h('strong', null, r.label),
          h('span', null, have ? 'Unlocked! Wear it from the wardrobe.' : r.hint),
        );
      }),
    ),
    h('h3', { class: 'block-heading' }, 'Fun facts from coffee cups'),
  );
  const unlocked = Object.entries(funFacts).filter(([id]) => p.foundIds.has(id));
  root.append(
    unlocked.length
      ? h('ul', { class: 'facts-list' }, ...unlocked.map(([, f]) => h('li', null, f)))
      : h('p', { class: 'note' }, 'Find coffee cups to learn fun facts about me.'),
  );
  const btn = h('button', { type: 'button', class: 'btn btn-quiet panel-button' }, p.galleryUnlocked ? 'Open the photo gallery' : `Gallery unlocks at ${GALLERY_UNLOCK} polaroids`);
  if (p.galleryUnlocked) btn.addEventListener('click', () => runAction({ type: 'panel', panel: 'gallery' }));
  else btn.disabled = true;
  const wardrobe = h('button', { type: 'button', class: 'btn btn-primary panel-button' }, 'Open the wardrobe');
  wardrobe.addEventListener('click', () => runAction({ type: 'wardrobe' }));
  root.append(h('div', { class: 'panel-buttons' }, wardrobe, btn));
  return root;
}

/** Polaroid photo wall; locked until enough polaroids are found. */
export function renderGallery(p: Progress): HTMLElement {
  if (!p.galleryUnlocked) {
    const need = Math.max(0, GALLERY_UNLOCK - p.byKind.polaroid.found);
    return h(
      'div',
      { class: 'gallery-locked' },
      h('p', { class: 'lead' }, 'The camera roll is empty… for now.'),
      h('p', null, `Find ${need} more polaroid${need === 1 ? '' : 's'} around town to unlock the gallery (${p.byKind.polaroid.found}/${GALLERY_UNLOCK}).`),
    );
  }
  return h(
    'ul',
    { class: 'gallery' },
    ...galleryPhotos.map((photo, i) => {
      const key = photo.file ? `photos/${photo.file}` : null;
      const media = key ? site.media[key] : undefined;
      const pic = media
        ? h('img', { src: mediaUrl(key!), alt: photo.alt ?? photo.caption, loading: 'lazy', width: String(media.w), height: String(media.h) })
        : h('div', { class: 'gallery-empty', 'aria-hidden': 'true' });
      return h('li', { class: 'polaroid', style: `--tilt:${((i * 37) % 7) - 3}deg` }, pic, h('p', null, photo.caption));
    }),
  );
}
