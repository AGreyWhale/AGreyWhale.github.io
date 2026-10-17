/** Tiny DOM builder: h('p', { class: 'x' }, 'text', child). Strings become text nodes (safe). */
export function h<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs: Record<string, string | boolean | undefined> | null = null,
  ...children: Array<Node | string | null | undefined | false>
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  if (attrs) {
    for (const [k, v] of Object.entries(attrs)) {
      if (v === undefined || v === false) continue;
      el.setAttribute(k, v === true ? '' : v);
    }
  }
  for (const c of children) {
    if (c === null || c === undefined || c === false) continue;
    el.append(c);
  }
  return el;
}

/** Inline SVG icons (stroke-based, inherit currentColor). */
export const icons = {
  sun: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4.5"/><path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M5.3 18.7l1.6-1.6M17.1 6.9l1.6-1.6"/></svg>',
  moon: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/></svg>',
  music: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 18V5l11-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="17" cy="16" r="3"/></svg>',
  mute: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4z"/><path d="m16 9 5 5M21 9l-5 5"/></svg>',
  close: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>',
  hand: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 13V5.5a1.5 1.5 0 0 1 3 0V11m0-1V4.5a1.5 1.5 0 0 1 3 0V11m0-5.5a1.5 1.5 0 0 1 3 0V12m0-3.5a1.5 1.5 0 0 1 3 0V15a7 7 0 0 1-7 7h-1.2a7 7 0 0 1-5.6-2.8L3.5 15.6a1.6 1.6 0 0 1 2.5-2l2 2.4"/></svg>',
  map: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 4 3 6.5v13L9 17l6 2.5 6-2.5v-13L15 6.5 9 4z"/><path d="M9 4v13M15 6.5v13"/></svg>',
  spring: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="7.5" r="3"/><circle cx="16.3" cy="10.6" r="3"/><circle cx="14.6" cy="15.6" r="3"/><circle cx="9.4" cy="15.6" r="3"/><circle cx="7.7" cy="10.6" r="3"/><circle cx="12" cy="12" r="1.6"/></svg>',
  summer: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 9a9 9 0 0 0 18 0z"/><path d="M6.5 9a5.5 5.5 0 0 0 11 0"/><path d="M9 12.5v.01M12 13.5v.01M15 12.5v.01"/></svg>',
  autumn: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 19C5 11 10 5 19 5c0 9-6 14-14 14z"/><path d="M5 19 13 11"/></svg>',
  winter: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2v20M3.3 7l17.4 10M3.3 17 20.7 7"/><path d="m9 4 3 2 3-2M9 20l3-2 3 2"/></svg>',
  hanger: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 7.5a2 2 0 1 1 2-2c0 1.2-2 1.6-2 3.2"/><path d="M12 8.7 3 15.5a1.3 1.3 0 0 0 .8 2.3h16.4a1.3 1.3 0 0 0 .8-2.3z"/></svg>',
  arrow: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
};

export function iconSpan(svg: string, cls = 'icon'): HTMLSpanElement {
  const s = document.createElement('span');
  s.className = cls;
  s.innerHTML = svg;
  return s;
}
