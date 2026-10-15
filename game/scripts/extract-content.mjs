/**
 * Build-time content extraction.
 *
 * Reads the classic site's HTML (../index.html) and writes structured JSON to
 * src/content/generated/site.json, so the town always shows the same text as the
 * classic site. Edit index.html, rebuild, and the town updates.
 *
 * Fails loudly when an expected section is missing, so a markup change can never
 * silently ship an empty building.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'node-html-parser';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '..', '..');
const outFile = resolve(here, '..', 'src', 'content', 'generated', 'site.json');

const ALLOWED_TAGS = new Set(['strong', 'em', 'b', 'i', 'a', 'br', 'code', 'sub', 'sup']);

function fail(msg) {
  console.error(`\n[extract-content] ${msg}\n`);
  process.exit(1);
}

function one(root, selector, ctx) {
  const el = root.querySelector(selector);
  if (!el) fail(`Expected "${selector}" in ${ctx}, but it was not found. Did the markup change?`);
  return el;
}

function many(root, selector, ctx) {
  const els = root.querySelectorAll(selector);
  if (els.length === 0) fail(`Expected at least one "${selector}" in ${ctx}.`);
  return els;
}

const collapse = (s) => s.replace(/\s+/g, ' ').trim();
const text = (el) => (el ? collapse(el.text) : '');

function slug(s) {
  return s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/[\s_]+/g, '-')
    .slice(0, 60);
}

function escapeHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/** Keeps a small allowlist of inline tags; everything else is reduced to its text. */
function sanitize(el) {
  let out = '';
  for (const node of el.childNodes) {
    if (node.nodeType === 3) {
      out += escapeHtml(collapseKeepEdges(node.text));
    } else if (node.nodeType === 1) {
      const tag = node.rawTagName?.toLowerCase();
      const inner = sanitize(node);
      if (!ALLOWED_TAGS.has(tag)) {
        out += inner;
      } else if (tag === 'a') {
        const href = node.getAttribute('href') ?? '';
        out += `<a href="${escapeHtml(href)}">${inner}</a>`;
      } else if (tag === 'br') {
        out += '<br>';
      } else {
        out += `<${tag}>${inner}</${tag}>`;
      }
    }
  }
  return out.replace(/\s+/g, ' ').trim();
}

function collapseKeepEdges(s) {
  return s.replace(/\s+/g, ' ');
}

function link(el) {
  if (!el) return null;
  return { href: el.getAttribute('href') ?? '', label: collapse(el.text).replace(/\s*[→↗]\s*$/, '') };
}

function extractIndex(html) {
  const doc = parse(html);
  const ctx = 'index.html';

  const heroEl = one(doc, '#hero', ctx);
  const hero = {
    name: text(one(heroEl, 'h1', ctx)),
    role: text(one(heroEl, 'h2', ctx)),
    eyebrow: text(heroEl.querySelector('.eyebrow')),
    tagline: text(one(heroEl, '.tagline', ctx)),
    location: text(heroEl.querySelector('.hero-photo .tag')),
  };

  const aboutEl = one(doc, '#about', ctx);
  const about = {
    heading: text(aboutEl.querySelector('.section-head h2')),
    paragraphs: many(aboutEl, '.about-copy > p', ctx).map(sanitize).filter(Boolean),
    highlight: sanitize(one(aboutEl, '.highlight-box', ctx)),
    facts: [],
  };
  const facts = one(aboutEl, 'dl.facts', ctx);
  const dts = facts.querySelectorAll('dt');
  const dds = facts.querySelectorAll('dd');
  dts.forEach((dt, i) => about.facts.push({ label: text(dt), value: text(dds[i]) }));

  const research = many(doc, '#research .tl-item', ctx).map((el) => {
    const title = text(one(el, 'h3', ctx));
    return {
      id: slug(title),
      title,
      date: text(el.querySelector('.tl-date')),
      org: text(el.querySelector('.tl-org')),
      bullets: el.querySelectorAll('ul > li').map(sanitize),
      tags: el.querySelectorAll('.tag-row .tag').map(text),
      link: link(el.querySelector('a.tl-link')),
    };
  });

  const projects = many(doc, '#projects .project-card', ctx).map((el) => {
    const title = text(one(el, '.project-head h3', ctx));
    const inner = one(el, '.project-body-inner', ctx);
    const dateEl = inner.childNodes.find((n) => n.nodeType === 1 && n.rawTagName === 'p');
    return {
      id: slug(title),
      title,
      tagline: text(el.querySelector('.project-tagline')),
      date: dateEl ? text(dateEl) : '',
      bullets: inner.querySelectorAll('ul > li').map(sanitize),
      tags: inner.querySelectorAll('.tag-row .tag').map(text),
      link: link(inner.querySelector('a.tl-link')),
    };
  });

  const skills = many(doc, '#skills .skill-block', ctx).map((el) => ({
    group: text(one(el, 'h3', ctx)),
    items: el.querySelectorAll('.skill-pill').map(text),
  }));

  const resumeLink = one(doc, '#skills a[download]', ctx);
  const resume = {
    href: resumeLink.getAttribute('href') ?? 'resume.pdf',
    downloadName: resumeLink.getAttribute('download') || 'Resume.pdf',
  };

  const service = many(doc, '#service .service-card', ctx).map((el) => {
    const a = el.querySelector('h3 a');
    const title = text(one(el, 'h3', ctx));
    return { id: slug(title), title, href: a?.getAttribute('href') ?? null, text: sanitize(one(el, 'p', ctx)) };
  });

  const footer = one(doc, '#contact', ctx);
  const socials = many(footer, '.social-row a', ctx).map((a) => ({
    label: a.getAttribute('aria-label') || text(a) || 'Link',
    href: a.getAttribute('href') ?? '',
  }));
  const mail = socials.find((s) => s.href.startsWith('mailto:'));
  const contact = {
    heading: text(footer.querySelector('h2')),
    tagline: text(footer.querySelector('.tagline')),
    email: mail ? mail.href.replace(/^mailto:/, '') : null,
    links: socials.filter((s) => !s.href.startsWith('mailto:')),
  };

  return { hero, about, research, projects, skills, resume, service, contact };
}

const indexHtml = readFileSync(resolve(repoRoot, 'index.html'), 'utf8');
const data = {
  source: 'Generated from ../index.html by scripts/extract-content.mjs. Do not edit by hand.',
  ...extractIndex(indexHtml),
};

mkdirSync(dirname(outFile), { recursive: true });
writeFileSync(outFile, JSON.stringify(data, null, 2) + '\n');
console.log(
  `[extract-content] ${data.research.length} research, ${data.projects.length} projects, ` +
    `${data.skills.length} skill groups, ${data.service.length} service → src/content/generated/site.json`,
);
