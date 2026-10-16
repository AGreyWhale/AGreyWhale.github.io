import { describe, expect, it } from 'vitest';
import { buildings } from '../src/content/buildings';
import { interiors } from '../src/content/interiors';
import { panels } from '../src/content/panels';
import { collectibles } from '../src/content/collectibles';
import { findCourseEntry, findProject, findResearch, site } from '../src/content/site';
import { town } from '../src/content/town';
import type { ActionDef } from '../src/content/types';

/**
 * Guards the link between content files and the classic site: if index.html
 * changes so a panel can no longer find its research/project, this fails in CI
 * instead of shipping an empty panel.
 */
describe('content integrity', () => {
  it('extracted the classic site', () => {
    expect(site.research.length).toBeGreaterThan(0);
    expect(site.projects.length).toBeGreaterThan(0);
    expect(site.about.paragraphs.length).toBeGreaterThan(0);
    expect(site.contact.email).toMatch(/@/);
  });

  for (const [id, panel] of Object.entries(panels)) {
    it(`panel "${id}" resolves every block`, () => {
      for (const b of panel.blocks) {
        if (b.kind === 'research') expect(findResearch(b.match), b.match).toBeDefined();
        if (b.kind === 'project') expect(findProject(b.match), b.match).toBeDefined();
        if (b.kind === 'researchBullet') {
          const r = findResearch(b.match);
          expect(r?.bullets.some((x) => x.toLowerCase().includes(b.contains.toLowerCase())), b.contains).toBe(true);
        }
        if (b.kind === 'aboutParagraphs' && b.contains) {
          const hit = site.about.paragraphs.some((p) => b.contains!.some((c) => p.toLowerCase().includes(c.toLowerCase())));
          expect(hit, b.contains.join()).toBe(true);
        }
        if (b.kind === 'courseEntry') expect(findCourseEntry(b.match), b.match).toBeDefined();
        if (b.kind === 'slideshow') expect(site.coursework.slideshows[b.set], b.set).toBeDefined();
        if (b.kind === 'image') expect(site.media[b.src], b.src).toBeDefined();
        if (b.kind === 'button' && b.action.type === 'panel') expect(panels[b.action.panel], b.action.panel).toBeDefined();
        if (b.kind === 'facts' && b.labels) {
          for (const l of b.labels) expect(site.about.facts.some((f) => f.label === l), l).toBe(true);
        }
      }
    });
  }

  it('every action points at something that exists', () => {
    const actions: ActionDef[] = [
      ...town.props.flatMap((p) => (p.interact ? [p.interact.action] : [])),
      ...town.npcs.map((n) => n.interact.action),
      ...Object.values(interiors).flatMap((r) => r.props.flatMap((p) => (p.interact ? [p.interact.action] : []))),
      ...Object.values(interiors).flatMap((r) => (r.npcs ?? []).map((n) => n.interact.action)),
    ];
    for (const a of actions) {
      if (a.type === 'panel') expect(panels[a.panel], a.panel).toBeDefined();
      if (a.type === 'enter') expect(buildings.some((b) => b.id === a.building), a.building).toBe(true);
    }
  });

  it('every building has exactly one valid destination (interior or panel)', () => {
    for (const b of buildings) {
      expect(!!b.interior !== !!b.panel, b.id).toBe(true);
      if (b.interior) expect(interiors[b.interior], b.id).toBeDefined();
      if (b.panel) expect(panels[b.panel], b.id).toBeDefined();
    }
  });

  it('collectibles have unique ids, valid places, and sit inside their room', () => {
    const ids = new Set(collectibles.map((c) => c.id));
    expect(ids.size).toBe(collectibles.length);
    for (const c of collectibles) {
      if (c.where === 'town') {
        expect(c.x > 50 && c.x < town.width - 50 && c.y > 110 && c.y < town.height - 50, c.id).toBe(true);
      } else {
        const room = interiors[c.where];
        expect(room, c.id).toBeDefined();
        expect(c.x > 14 && c.x < room.width - 14 && c.y > room.wallHeight && c.y < room.height - 6, c.id).toBe(true);
      }
    }
  });

  it('coursework was extracted from courses.html', () => {
    expect(site.coursework.html).toContain('file-tree');
    expect(site.coursework.html).not.toMatch(/\son\w+=/i);
    expect(site.coursework.entries.length).toBeGreaterThan(0);
  });
});
