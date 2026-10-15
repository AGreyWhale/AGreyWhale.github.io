/**
 * Site-wide links. EDIT HERE.
 *
 * - quickVersion: the fast, non-game portfolio (your classic site on GitHub Pages).
 * - oldSchoolSite: your older TAMU-hosted site. Set to null to hide the link everywhere.
 */
export const links = {
  quickVersion: __CLASSIC_URL__,
  oldSchoolSite: {
    label: 'My older site (TAMU)',
    href: 'https://people.tamu.edu/~gauriagrawal',
  } as { label: string; href: string } | null,
};
