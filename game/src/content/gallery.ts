/**
 * Photography gallery (unlocked by finding polaroids). EDIT HERE.
 *
 * To add a photo: drop the file in game/src/assets/photos/ (any size; it's
 * auto-compressed to WebP at build time) and set `file` to its file name.
 * Entries without a file show as empty polaroid frames.
 */
export const galleryPhotos: Array<{ file?: string; caption: string; alt?: string }> = [
  { caption: 'Photo 1: add yours!' },
  { caption: 'Photo 2' },
  { caption: 'Photo 3' },
  { caption: 'Photo 4' },
  { caption: 'Photo 5' },
  { caption: 'Photo 6' },
];
