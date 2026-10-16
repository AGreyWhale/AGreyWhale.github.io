const COLORS = ['#f49cb0', '#f7d36b', '#87b48b', '#6ea2d6', '#e58aa2', '#b9a3e3'];
const MAX_PIECES = 60;

/** A short, capped confetti burst for big moments. Skipped under reduced motion. */
export function burstConfetti(host: HTMLElement, reducedMotion: boolean): void {
  if (reducedMotion) return;
  const layer = document.createElement('div');
  layer.className = 'confetti-layer';
  layer.setAttribute('aria-hidden', 'true');
  for (let i = 0; i < MAX_PIECES; i++) {
    const p = document.createElement('span');
    p.className = 'confetti';
    p.style.left = `${Math.random() * 100}%`;
    p.style.background = COLORS[i % COLORS.length];
    p.style.animationDuration = `${2 + Math.random() * 1.6}s`;
    p.style.animationDelay = `${Math.random() * 0.4}s`;
    p.style.setProperty('--drift', `${(Math.random() - 0.5) * 160}px`);
    p.style.setProperty('--spin', `${(Math.random() - 0.5) * 900}deg`);
    layer.append(p);
  }
  host.append(layer);
  window.setTimeout(() => layer.remove(), 4200);
}
