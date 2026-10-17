import '../content/generated/coursework.css';
import { buildings } from '../content/buildings';
import { links } from '../content/links';
import {
  classicUrl,
  findCourseEntry,
  findProject,
  findResearch,
  isExternal,
  mediaUrl,
  site,
  type ProjectItem,
  type ResearchItem,
} from '../content/site';
import type { Accessory, ActionDef, PanelBlock, PanelDef } from '../content/types';
import type { Progress } from '../systems/CollectibleSystem';
import type { ContactHandler } from '../systems/contact/ContactHandler';
import { renderCollection, renderGallery } from './CollectionView';
import { createContactForm } from './ContactForm';
import { h } from './dom';
import { createSlideshow, wireCourseworkSlideshows } from './Slideshow';

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

function figure(path: string, alt: string, caption?: string): HTMLElement {
  const m = site.media[path];
  return h(
    'figure',
    { class: 'panel-figure' },
    h('img', { src: mediaUrl(path), alt, loading: 'lazy', decoding: 'async', width: m ? String(m.w) : undefined, height: m ? String(m.h) : undefined }),
    caption ? h('figcaption', null, caption) : null,
  );
}

function coursework(open?: string): HTMLElement {
  const root = h('div', { class: 'cw' });
  root.innerHTML = site.coursework.html; // extracted from courses.html at build time (scripts and inline handlers stripped)
  fixLinks(root);
  wireCourseworkSlideshows(root);
  if (open) {
    const entry = findCourseEntry(open);
    const el = entry ? root.querySelector<HTMLDetailsElement>(`#${CSS.escape(entry.id)}`) : null;
    for (let d: HTMLElement | null = el; d; d = d.parentElement?.closest('details') ?? null) (d as HTMLDetailsElement).open = true;
  }
  return root;
}

function courseEntry(match: string): HTMLElement {
  const e = findCourseEntry(match);
  if (!e) return missing(match);
  return h(
    'article',
    { class: 'entry' },
    h('h3', { class: 'mono' }, e.name),
    e.attrs.length ? tags(e.attrs.map((a) => `${a.key}: ${a.value}`)) : null,
    ...e.paragraphs.map((p) => richHtml('p', p)),
  );
}

function resumeLetter(): HTMLElement {
  const href = classicUrl(site.resume.href);
  // The PDF preview only loads on request (it's large, and some browsers steal scroll/focus for embedded PDFs).
  const preview = h('button', { type: 'button', class: 'btn btn-quiet resume-preview-btn' }, 'Preview here');
  const letter = h(
    'div',
    { class: 'letter' },
    h('p', { class: 'letter-greeting' }, 'Dear visitor,'),
    h('p', null, 'Thanks for stopping by the post office! Here is my resume. Open it to read, or take a copy with you.'),
    h('p', { class: 'letter-sign' }, `Warmly, ${site.hero.name}`),
    h(
      'div',
      { class: 'letter-actions' },
      h('a', { class: 'btn btn-primary', href, target: '_blank', rel: 'noopener' }, 'Open resume (PDF)', h('span', { class: 'sr-only' }, ' (opens in a new tab)')),
      h('a', { class: 'btn btn-quiet', href, download: site.resume.downloadName }, 'Download'),
      preview,
    ),
  );
  preview.addEventListener('click', () => {
    preview.replaceWith(h('iframe', { class: 'resume-frame', src: `${href}#view=FitH`, title: `${site.hero.name}'s resume` }));
  });
  return letter;
}

function socialLinks(): HTMLElement {
  const items = [...site.contact.links, { label: 'Resume (PDF)', href: site.resume.href }];
  if (links.oldSchoolSite) items.push(links.oldSchoolSite);
  return h('ul', { class: 'social-list' }, ...items.map((l) => h('li', null, linkEl(l.href, l.label))));
}

function renderBlock(b: PanelBlock, ctx: PanelContext): Node | null {
  switch (b.kind) {
    case 'coursework':
      return coursework(b.open);
    case 'courseEntry':
      return courseEntry(b.match);
    case 'image':
      return figure(b.src, b.alt, b.caption);
    case 'slideshow':
      return createSlideshow(site.coursework.slideshows[b.set] ?? [], b.label);
    case 'resume':
      return resumeLetter();
    case 'contact':
      return createContactForm(ctx.contact);
    case 'socialLinks':
      return socialLinks();
    case 'gallery':
      return renderGallery(ctx.progress());
    case 'collection':
      return renderCollection(ctx.progress(), ctx.runAction, ctx.unlockedRewards(), ctx.pets());
    case 'directory':
      return h(
        'ul',
        { class: 'directory' },
        ...buildings.map((bd) => {
          const btn = h('button', { type: 'button', class: 'directory-btn' }, h('strong', null, bd.name), h('span', null, bd.blurb));
          btn.addEventListener('click', () =>
            ctx.runAction(bd.interior ? { type: 'enter', building: bd.id } : { type: 'panel', panel: bd.panel! }),
          );
          return h('li', null, btn);
        }),
      );
    case 'button': {
      const btn = h('button', { type: 'button', class: 'btn btn-primary panel-button' }, b.label);
      btn.addEventListener('click', () => ctx.runAction(b.action));
      return btn;
    }
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

/** What interactive blocks (buttons, contact form, collection) need from the game. */
export interface PanelContext {
  runAction(action: ActionDef): void;
  progress(): Progress;
  unlockedRewards(): Accessory[];
  pets(): { petted: number; total: number };
  contact: ContactHandler | null;
}

/** Builds the DOM for a content panel. */
export function renderPanel(def: PanelDef, ctx: PanelContext): DocumentFragment {
  const frag = document.createDocumentFragment();
  for (const b of def.blocks) {
    const node = renderBlock(b, ctx);
    if (node) frag.append(node);
  }
  if (def.hint) frag.append(h('p', { class: 'panel-hint' }, def.hint));
  return frag;
}
