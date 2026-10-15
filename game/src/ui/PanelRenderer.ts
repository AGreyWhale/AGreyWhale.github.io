import { classicUrl, findProject, findResearch, isExternal, site, type ProjectItem, type ResearchItem } from '../content/site';
import type { PanelBlock, PanelDef } from '../content/types';
import { h } from './dom';

/** Sets sanitized HTML from site.json and makes its links work from the game. */
function richHtml<K extends keyof HTMLElementTagNameMap>(tag: K, html: string, cls?: string): HTMLElementTagNameMap[K] {
  const el = h(tag, cls ? { class: cls } : null);
  el.innerHTML = html; // sanitized at build time by extract-content.mjs (allowlisted inline tags only)
  fixLinks(el);
  return el;
}

function fixLinks(root: ParentNode): void {
  root.querySelectorAll('a').forEach((a) => {
    const href = a.getAttribute('href') ?? '';
    a.setAttribute('href', classicUrl(href));
    if (isExternal(href)) {
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
    }
  });
}

function linkEl(href: string, label: string): HTMLAnchorElement {
  const a = h('a', { href: classicUrl(href), class: 'entry-link' }, label + ' ', h('span', { 'aria-hidden': 'true' }, '→'));
  if (isExternal(href)) {
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.append(h('span', { class: 'sr-only' }, ' (opens in a new tab)'));
  }
  return a;
}

function tags(list: string[]): HTMLElement | null {
  if (!list.length) return null;
  return h('ul', { class: 'chips', 'aria-label': 'Tags' }, ...list.map((t) => h('li', null, t)));
}

function entry(item: ResearchItem | ProjectItem, compact: boolean): HTMLElement {
  const meta = 'org' in item ? [item.date, item.org].filter(Boolean).join(' · ') : item.date;
  const tagline = 'tagline' in item ? item.tagline : '';
  const el = h(
    'article',
    { class: compact ? 'entry compact' : 'entry' },
    h('h3', null, item.title),
    meta ? h('p', { class: 'meta' }, meta) : null,
    tagline ? h('p', { class: 'tagline' }, tagline) : null,
  );
  if (compact) {
    if (!tagline && item.bullets[0]) el.append(richHtml('p', item.bullets[0]));
  } else {
    el.append(h('ul', { class: 'bullets' }, ...item.bullets.map((b) => richHtml('li', b))));
    const t = tags(item.tags);
    if (t) el.append(t);
  }
  if (item.link) el.append(linkEl(item.link.href, item.link.label || 'Read more'));
  return el;
}

function missing(what: string): HTMLElement {
  return h('p', { class: 'missing' }, `(Couldn't find "${what}" on the classic site.)`);
}

function renderBlock(b: PanelBlock): Node | null {
  switch (b.kind) {
    case 'aboutIntro':
      return h('div', { class: 'intro' }, h('p', { class: 'lead' }, site.hero.tagline), richHtml('div', site.about.highlight, 'highlight'));
    case 'aboutParagraphs': {
      const ps = site.about.paragraphs.filter((p) => !b.contains || b.contains.some((c) => p.toLowerCase().includes(c.toLowerCase())));
      if (!ps.length) return missing(b.contains?.join(', ') ?? 'about');
      const frag = document.createDocumentFragment();
      ps.forEach((p) => frag.append(richHtml('p', p)));
      return frag;
    }
    case 'facts': {
      const facts = site.about.facts.filter((f) => !b.labels || b.labels.includes(f.label));
      return h('dl', { class: 'facts' }, ...facts.flatMap((f) => [h('dt', null, f.label), h('dd', null, f.value)]));
    }
    case 'research': {
      const r = findResearch(b.match);
      return r ? entry(r, !!b.compact) : missing(b.match);
    }
    case 'project': {
      const p = findProject(b.match);
      return p ? entry(p, !!b.compact) : missing(b.match);
    }
    case 'researchBullet': {
      const r = findResearch(b.match);
      const bullet = r?.bullets.find((x) => x.toLowerCase().includes(b.contains.toLowerCase()));
      return bullet ? richHtml('blockquote', bullet, 'callout') : missing(b.contains);
    }
    case 'skills': {
      const groups = site.skills.filter((s) => !b.groups || b.groups.includes(s.group));
      return h('div', { class: 'skills' }, ...groups.map((s) => h('section', null, h('h3', null, s.group), tags(s.items))));
    }
    case 'service':
      return h(
        'div',
        { class: 'service' },
        ...site.service.map((s) =>
          h('article', { class: 'entry' }, h('h3', null, s.href ? linkEl(s.href, s.title) : s.title), richHtml('p', s.text)),
        ),
      );
    case 'heading':
      return h('h3', { class: 'block-heading' }, b.text);
    case 'note':
      return h('p', { class: 'note' }, b.text);
    case 'links':
      return h('ul', { class: 'link-list' }, ...b.items.map((l) => h('li', null, linkEl(l.href, l.label))));
  }
}

/** Builds the DOM for a content panel. */
export function renderPanel(def: PanelDef): DocumentFragment {
  const frag = document.createDocumentFragment();
  for (const b of def.blocks) {
    const node = renderBlock(b);
    if (node) frag.append(node);
  }
  if (def.hint) frag.append(h('p', { class: 'panel-hint' }, def.hint));
  return frag;
}
