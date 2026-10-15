/**
 * Typed access to the content extracted from the classic site (index.html).
 * The JSON is regenerated on every dev/build/test run by scripts/extract-content.mjs.
 */
import raw from './generated/site.json';

export interface SiteLink {
  href: string;
  label: string;
}

export interface ResearchItem {
  id: string;
  title: string;
  date: string;
  org: string;
  /** Sanitized inline HTML. */
  bullets: string[];
  tags: string[];
  link: SiteLink | null;
}

export interface ProjectItem {
  id: string;
  title: string;
  tagline: string;
  date: string;
  bullets: string[];
  tags: string[];
  link: SiteLink | null;
}

export interface SiteData {
  hero: { name: string; role: string; eyebrow: string; tagline: string; location: string };
  about: { heading: string; paragraphs: string[]; highlight: string; facts: Array<{ label: string; value: string }> };
  research: ResearchItem[];
  projects: ProjectItem[];
  skills: Array<{ group: string; items: string[] }>;
  resume: { href: string; downloadName: string };
  service: Array<{ id: string; title: string; href: string | null; text: string }>;
  contact: { heading: string; tagline: string; email: string | null; links: Array<{ label: string; href: string }> };
}

export const site: SiteData = raw as SiteData;

const norm = (s: string) => s.toLowerCase();

/** Finds a research entry whose title contains `match` (case-insensitive). */
export function findResearch(match: string, data: SiteData = site): ResearchItem | undefined {
  return data.research.find((r) => norm(r.title).includes(norm(match)));
}

/** Finds a project whose title contains `match` (case-insensitive). */
export function findProject(match: string, data: SiteData = site): ProjectItem | undefined {
  return data.projects.find((p) => norm(p.title).includes(norm(match)));
}

/**
 * Turns a link from the classic site into a URL that works from the game.
 * Relative links (e.g. "courses.html#x", "resume.pdf") are resolved against the
 * classic site's path; absolute ones pass through.
 */
export function classicUrl(href: string): string {
  if (/^([a-z]+:|#|\/)/i.test(href)) return href;
  return __CLASSIC_URL__ + href;
}

/** True for links that leave the site (open in a new tab). */
export function isExternal(href: string): boolean {
  return /^https?:\/\//i.test(href);
}
