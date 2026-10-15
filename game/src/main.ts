import './styles/theme.css';
import './styles/ui.css';
import { Game } from './core/Game';

async function boot(): Promise<void> {
  const root = document.getElementById('app');
  if (!root) return;
  // Canvas text needs the web font; don't wait forever if it's blocked.
  await Promise.race([document.fonts?.ready, new Promise((r) => setTimeout(r, 1500))]);
  try {
    new Game(root).start();
  } catch (err) {
    console.error(err);
    document.body.classList.add('boot-failed');
  }
}

void boot();
