import { describe, expect, it } from 'vitest';
import { buildings } from '../src/content/buildings';
import { interiors } from '../src/content/interiors';
import { panels } from '../src/content/panels';
import { findProject, findResearch, site } from '../src/content/site';
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
    ];
    for (const a of actions) {
      if (a.type === 'panel') expect(panels[a.panel], a.panel).toBeDefined();
      if (a.type === 'enter') expect(buildings.some((b) => b.id === a.building), a.building).toBe(true);
    }
  });

  it('every building has an interior', () => {
    for (const b of buildings) expect(interiors[b.interior], b.id).toBeDefined();
  });
});
