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
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'node-html-parser';
import postcss from 'postcss';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '..', '..');
const outFile = resolve(here, '..', 'src', 'content', 'generated', 'site.json');
const cssOutFile = resolve(here, '..', 'src', 'content', 'generated', 'coursework.css');
const mediaDir = resolve(here, '..', 'public', 'generated');
const photosDir = resolve(here, '..', 'src', 'assets', 'photos');

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


/**
 * Coursework (courses.html): keeps the file-tree markup, but strips inline
 * handlers/scripts, namespaces ids (cw-…), and turns the slideshows into
 * data-attribute hooks the game wires up itself.
 */
function extractCourses(html) {
  const doc = parse(html);
  const ctx = 'courses.html';
  const win = one(doc, '.ide-window', ctx);
  win.querySelectorAll('script').forEach((s) => s.remove());

  for (const el of win.querySelectorAll('*')) {
    for (const [name, value] of Object.entries(el.attributes)) {
      if (!name.toLowerCase().startsWith('on')) continue;
      const m = /(prev|next)Slide\('(\w+)'\)/.exec(value);
      if (m) {
        el.setAttribute('data-slide', m[1]);
        el.setAttribute('data-set', m[2]);
        el.setAttribute('type', 'button');
        el.setAttribute('aria-label', m[1] === 'prev' ? 'Previous photo' : 'Next photo');
      }
      el.removeAttribute(name);
    }
    const id = el.getAttribute('id');
    if (id) {
      const show = /^slideshow-(\w+)$/.exec(id);
      const counter = /^counter-(\w+)$/.exec(id);
      if (show) el.setAttribute('data-slideshow', show[1]);
      if (counter) el.setAttribute('data-counter', counter[1]);
      el.setAttribute('id', 'cw-' + id);
    }
  }

  // Slideshow image lists from the inline script.
  const slideshows = {};
  const block = /slideshowImages\s*=\s*\{([\s\S]*?)\};/.exec(html);
  if (block) {
    for (const m of block[1].matchAll(/(\w+)\s*:\s*\[([^\]]*)\]/g)) {
      slideshows[m[1]] = [...m[2].matchAll(/["']([^"']+)["']/g)].map((x) => x[1]);
    }
  }

  // Display-friendly titles of expandable entries, e.g. "floral_design.svg".
  const entries = win.querySelectorAll('details[id]').map((d) => ({
    id: d.getAttribute('id'),
    name: text(d.querySelector('.file-name')),
    attrs: d.querySelectorAll(':scope > .file-body > .file-attrs > span').map((sp) => ({
      key: text(sp.querySelector('.attr-key')),
      value: text(sp.querySelector('.attr-val')),
    })),
    paragraphs: d.querySelectorAll('.code-view > p').map(sanitize),
  }));

  return { html: win.outerHTML, slideshows, entries };
}

/** Scopes the classic site's coursework CSS under `.cw` so it can't leak into the game. */
async function extractCourseworkCss(css) {
  const marker = css.indexOf('Coursework page');
  if (marker < 0) fail('Could not find the "Coursework page" section in style.css.');
  const start = css.lastIndexOf('/*', marker);
  const slice = css.slice(start);
  const tokens = /:root\s*\{([\s\S]*?)\}/.exec(css);

  const root = postcss.parse(slice);
  root.walkRules((rule) => {
    if (rule.parent?.type === 'atrule' && /keyframes/i.test(rule.parent.name)) return;
    rule.selectors = rule.selectors.map((sel) => `.cw ${sel.trim()}`);
  });
  root.walkAtRules(/keyframes/i, (at) => {
    at.params = `cw-${at.params}`;
  });
  root.walkDecls(/^animation/, (d) => {
    d.value = d.value.replace(/\b(caretBlink|\w+Blink|\w+Pulse)\b/g, 'cw-$1');
  });
  const header = `/* Generated from ../style.css by scripts/extract-content.mjs. Do not edit. */\n`;
  return header + (tokens ? `.cw {${tokens[1]}}\n` : '') + root.toString();
}

/**
 * Compresses images to small WebP copies in public/generated (originals are
 * never touched). Falls back to a plain copy if sharp isn't available.
 * Returns { sourcePath: { src, w, h } } with src relative to the game's base URL.
 */
async function optimizeImages(list) {
  let sharp = null;
  try {
    sharp = (await import('sharp')).default;
  } catch {
    console.warn('[extract-content] sharp unavailable; images will be linked uncompressed.');
  }
  mkdirSync(mediaDir, { recursive: true });
  const media = {};
  for (const { key, file, max } of list) {
    if (!existsSync(file)) {
      console.warn(`[extract-content] missing image ${key}, skipping`);
      continue;
    }
    const name = key.replace(/[^\w.-]+/g, '-').replace(/\.\w+$/, '') + '.webp';
    const out = resolve(mediaDir, name);
    if (!sharp) continue;
    const fresh = existsSync(out) && statSync(out).mtimeMs >= statSync(file).mtimeMs;
    const img = sharp(file).rotate().resize({ width: max, height: max, fit: 'inside', withoutEnlargement: true });
    if (!fresh) await img.clone().webp({ quality: 76 }).toFile(out);
    const meta = await sharp(out).metadata();
    media[key] = { src: `generated/${name}`, w: meta.width, h: meta.height };
  }
  return media;
}

const indexHtml = readFileSync(resolve(repoRoot, 'index.html'), 'utf8');
const coursesHtml = readFileSync(resolve(repoRoot, 'courses.html'), 'utf8');
const styleCss = readFileSync(resolve(repoRoot, 'style.css'), 'utf8');

const coursework = extractCourses(coursesHtml);

/** Extra classic-site images the town uses directly. */
const EXTRA_IMAGES = ['images/cs312/MainCircuit.png'];
const classicImages = [...new Set([...Object.values(coursework.slideshows).flat(), ...EXTRA_IMAGES])];
const photoFiles = existsSync(photosDir) ? readdirSync(photosDir).filter((f) => /\.(jpe?g|png|webp)$/i.test(f)) : [];

const media = await optimizeImages([
  ...classicImages.map((p) => ({ key: p, file: resolve(repoRoot, p), max: 1100 })),
  ...photoFiles.map((f) => ({ key: `photos/${f}`, file: resolve(photosDir, f), max: 1200 })),
]);

const data = {
  source: 'Generated from ../index.html and ../courses.html by scripts/extract-content.mjs. Do not edit by hand.',
  ...extractIndex(indexHtml),
  coursework,
  media,
};

mkdirSync(dirname(outFile), { recursive: true });
writeFileSync(outFile, JSON.stringify(data, null, 2) + '\n');
writeFileSync(cssOutFile, await extractCourseworkCss(styleCss));
console.log(
  `[extract-content] ${data.research.length} research, ${data.projects.length} projects, ` +
    `${data.skills.length} skill groups, ${data.service.length} service, ` +
    `${coursework.entries.length} coursework entries, ${Object.keys(media).length} images → src/content/generated/`,
);
