import { findBuilding } from '../content/buildings';
import { characterPresets } from '../content/characters';
import { collectibleKinds, funFacts } from '../content/collectibles';
import { musicKeyFor } from '../content/audio';
import type { RewardDef } from '../content/rewards';
import { panels } from '../content/panels';
import type { ActionDef, CharacterAppearance } from '../content/types';
import type { RenderEnv } from '../render/draw';
import type { InteriorScene } from '../scenes/InteriorScene';
import { StartScene } from '../scenes/StartScene';
import { TownScene } from '../scenes/TownScene';
import { AudioManager } from '../systems/AudioManager';
import { CollectibleSystem } from '../systems/CollectibleSystem';
import { createContactHandler } from '../systems/contact/ContactHandler';
import { InputManager } from '../systems/InputManager';
import { LightingSystem } from '../systems/LightingSystem';
import { RewardSystem } from '../systems/RewardSystem';
import { makeWish } from '../systems/wish';
import { Router, type Route } from '../systems/Router';
import { SeasonManager } from '../systems/SeasonManager';
import { SaveManager } from '../systems/SaveManager';
import { ThemeManager } from '../systems/ThemeManager';
import { CharacterSelect } from '../ui/CharacterSelect';
import { burstConfetti } from '../ui/Confetti';
import { DialogOverlay } from '../ui/DialogOverlay';
import { Hud } from '../ui/Hud';
import { TouchControls } from '../ui/TouchControls';
import { Camera } from './Camera';
import { EventBus } from './EventBus';
import type { GameContext } from './GameContext';
import type { GameEvents } from './events';
import { GameLoop } from './GameLoop';
import { SceneManager } from './SceneManager';
import { Viewport } from './Viewport';

/**
 * Composition root: creates every service, wires events between them, and
 * decides which scene is showing. Holds no content of its own.
 */
export class Game implements GameContext {
  readonly bus = new EventBus<GameEvents>();
  readonly save = new SaveManager();
  readonly input = new InputManager();
  readonly camera = new Camera();
  readonly lighting = new LightingSystem();
  readonly viewport: Viewport;
  readonly theme: ThemeManager;
  readonly seasons: SeasonManager;
  readonly audio: AudioManager;
  readonly collectibles: CollectibleSystem;
  readonly rewards: RewardSystem;
  /** Rewards waiting until no dialog is open, so they never cover a fun fact. */
  private rewardQueue: RewardDef[] = [];
  readonly env: RenderEnv = { time: 0, night: 0, reducedMotion: false, season: 'summer' };

  private readonly scenes: SceneManager;
  private readonly loop: GameLoop;
  private readonly router = new Router();
  private readonly hud: Hud;
  private readonly dialog: DialogOverlay;
  private readonly touch: TouchControls;
  private readonly select: CharacterSelect;
  private readonly town: TownScene;
  private interior: InteriorScene | null = null;
  private currentBuilding: string | null = null;
  private playing = false;
  private blocking = false;
  private miniGameOpen = false;
  /** Which mini game is open (it gets its own music). */
  private miniGameId: 'boba' | 'bouquet' | null = null;
  private readonly ui: HTMLElement;

  constructor(root: HTMLElement) {
    const canvas = root.querySelector<HTMLCanvasElement>('#game-canvas')!;
    const ui = root.querySelector<HTMLElement>('#ui-layer')!;
    this.ui = ui;
    this.viewport = new Viewport(canvas);

    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    this.env.reducedMotion = motion.matches;
    motion.addEventListener('change', () => (this.env.reducedMotion = motion.matches));
    document.documentElement.classList.toggle('reduced-motion', motion.matches);

    this.theme = new ThemeManager(this.save, this.bus);
    this.seasons = new SeasonManager(this.save, this.bus);
    this.env.season = this.seasons.season;
    this.audio = new AudioManager(this.save, this.bus);
    this.scenes = new SceneManager(() => this.env.reducedMotion);
    this.collectibles = new CollectibleSystem(this.save, this.bus);
    this.rewards = new RewardSystem(this.save, this.bus);

    this.hud = new Hud(ui, this.bus, {
      toggleTheme: () => this.theme.toggle(),
      cycleSeason: () => this.seasons.cycle(),
      openMap: () => this.runAction({ type: 'panel', panel: 'map' }),
      openWardrobe: () => this.runAction({ type: 'wardrobe' }),
      toggleMute: () => this.audio.toggleMute(),
      interact: () => this.input.queueInteract(),
      openCollection: () => this.runAction({ type: 'panel', panel: 'collection' }),
    });
    this.dialog = new DialogOverlay(ui, this.bus, {
      runAction: (a) => this.runAction(a),
      progress: () => this.collectibles.progress,
      unlockedRewards: () => this.rewards.unlocked(),
      pets: () => this.rewards.pets,
      contact: createContactHandler(),
    });
    this.touch = new TouchControls(ui, canvas, this.input, this.bus);

    const appearance = this.save.data.character ?? characterPresets[0].appearance;
    this.town = new TownScene(this, appearance);
    this.select = new CharacterSelect(
      ui,
      this.save.data.character,
      (a) => this.beginPlay(a),
      () => this.rewards.unlocked(),
    );

    this.wireEvents();
    this.hud.setTheme(this.theme.mode);
    this.hud.setSeason(this.seasons.season, this.seasons.isAuto);
    this.hud.setMuted(this.audio.muted);
    const p = this.collectibles.progress;
    this.hud.setCollected(p.found, p.total);
    this.viewport.onResize(() => this.scenes.resize());
    this.loop = new GameLoop(
      (dt) => this.update(dt),
      () => this.scenes.render(this.viewport.ctx),
    );
  }

  start(): void {
    this.scenes.switchTo(() => new StartScene(this, this.town, this.select), { instant: true });
    this.loop.start();
  }

  private wireEvents(): void {
    this.bus.on('action', ({ action }) => this.runAction(action));
    this.bus.on('theme:changed', (mode) => {
      this.hud.setTheme(mode);
      this.updateMusic();
    });
    this.bus.on('audio:muted', (m) => this.hud.setMuted(m));
    this.bus.on('season:changed', (s) => {
      this.env.season = s;
      this.updateMusic();
      this.hud.setSeason(s, this.seasons.isAuto);
      const name = s[0].toUpperCase() + s.slice(1);
      this.hud.toast(this.seasons.isAuto ? `${name}, to match today's date` : `It's ${name.toLowerCase()} in town`);
    });
    this.bus.on('ui:blocking', (b) => {
      this.hud.setInert(b);
      if (!b) window.setTimeout(() => this.flushRewards(), 500);
      this.blocking = b;
      this.syncInput();
    });
    this.router.onChange((r) => this.onRoute(r));
    this.bus.on('collected', (e) => this.onCollected(e));
    this.bus.on('cat:petted', ({ id, name }) => {
      this.audio.play('purr');
      this.hud.toast(`${name} purrs happily`);
      this.rewards.recordPet(id);
    });
    this.bus.on('reward:unlocked', (r) => {
      this.rewardQueue.push(r);
      window.setTimeout(() => this.flushRewards(), 900);
    });
  }

  /** Feedback for a found collectible: counter, toast or fun fact, unlocks, final reward. */
  private onCollected({ def, progress, galleryJustUnlocked, allJustFound }: GameEvents['collected']): void {
    this.hud.setCollected(progress.found, progress.total);
    const kind = collectibleKinds[def.kind];
    const { found, total } = progress.byKind[def.kind];
    if (def.kind === 'coffee' && funFacts[def.id]) {
      this.dialog.openSpeech(`${kind.icon} Coffee cup ${found}/${total}`, [funFacts[def.id]]);
    } else {
      this.hud.toast(`${kind.icon} Found a ${kind.singular}! (${found}/${total})`);
    }
    if (galleryJustUnlocked) {
      window.setTimeout(() => this.hud.toast('📷 Photo gallery unlocked! Visit the camera in the Cottage.'), 1800);
    }
    if (allJustFound) this.save.update({ rewardClaimed: true });
    this.rewards.check();
  }

  /** Shows the next earned reward, once nothing else is on screen. */
  private flushRewards(): void {
    if (this.blocking || !this.rewardQueue.length) return;
    const r = this.rewardQueue.shift()!;
    const big = r.goal.type === 'everything';
    if (big) burstConfetti(this.ui, this.env.reducedMotion);
    this.audio.play(big ? 'success' : 'collect');
    this.dialog.openSpeech(big ? '✦ You found everything!' : `✦ New look: ${r.label}`, [
      r.message,
      'Open the wardrobe (the hanger button, bottom left) to try it on.',
    ]);
  }

  /** Picks music for where you are: the open mini game, or the season and time of day. */
  private updateMusic(): void {
    if (!this.playing) return;
    this.audio.setMusic(musicKeyFor(this.miniGameId, this.seasons.season, this.theme.mode));
  }

  /** Reopens the character creator mid-game so new looks can be worn right away. */
  private openWardrobe(): void {
    if (!this.playing) return;
    this.dialog.close();
    this.bus.emit('ui:blocking', true);
    this.select.showWardrobe(this.town.player.appearance, (a) => {
      this.save.update({ character: a });
      this.town.setAppearance(a);
      if (this.interior) this.interior.player.appearance = a;
      this.bus.emit('ui:blocking', false);
    });
  }

  private syncInput(): void {
    const on = this.playing && !this.blocking;
    this.input.setEnabled(on);
    this.touch.setEnabled(on);
  }

  private update(dt: number): void {
    this.env.time += dt;
    this.theme.update(dt, this.env.reducedMotion);
    this.env.night = this.theme.night;
    this.env.season = this.seasons.season;
    this.scenes.update(dt);
    this.select.tick(this.env.time, this.env.reducedMotion);
  }

  /** Start button handler: runs inside the click, so audio may start here. */
  private beginPlay(appearance: CharacterAppearance): void {
    this.save.update({ character: appearance });
    this.audio.unlock();
    this.town.setAppearance(appearance);
    this.town.setAttract(false);
    this.town.placeAtSpawn();
    this.playing = true;
    this.updateMusic(); // after playing = true, still inside the Start click
    this.hud.setMode('play');
    this.syncInput();

    const route = this.router.current;
    if (route.name === 'building' && findBuilding(route.id)?.interior) {
      this.town.placeAtDoor(route.id);
      this.enterBuilding(route.id);
    } else {
      this.scenes.switchTo(() => this.town, { then: () => this.hud.setPlace('Town square') });
    }
  }

  private runAction(action: ActionDef): void {
    switch (action.type) {
      case 'panel': {
        const def = panels[action.panel];
        if (!def) return console.warn(`Unknown panel "${action.panel}"`);
        this.audio.play('open');
        this.dialog.openPanel(def, () => this.audio.play('close'));
        break;
      }
      case 'say':
        this.dialog.openSpeech(action.speaker, action.lines);
        break;
      case 'enter':
        this.enterBuilding(action.building);
        break;
      case 'exit':
        this.exitBuilding();
        break;
      case 'wardrobe':
        this.openWardrobe();
        break;
      case 'minigame':
        void this.openMiniGame(action.id);
        break;
      case 'wish': {
        const wish = makeWish(Math.random, this.save.data.wizardHatWon);
        if (wish.lucky) {
          this.save.update({ wizardHatWon: true });
          this.audio.play('success');
        }
        this.dialog.openSpeech(wish.lucky ? '✦ A lucky wish!' : undefined, [wish.line]);
        if (wish.lucky) this.rewards.check();
        break;
      }
    }
  }

  /** Lazy-loads and opens the Boba mini game over the current scene. */
  private async openMiniGame(id: 'boba' | 'bouquet'): Promise<void> {
    if (this.miniGameOpen) return;
    this.miniGameOpen = true;
    this.dialog.close();
    try {
      // Each game is its own lazy-loaded chunk.
      const Game = id === 'boba' ? (await import('../minigames/BobaGame')).BobaGame : (await import('../minigames/BouquetGame')).BouquetGame;
      this.bus.emit('ui:blocking', true);
      this.miniGameId = id;
      this.updateMusic();
      const game = new Game(this.ui, { audio: this.audio, save: this.save, reducedMotion: this.env.reducedMotion }, () => {
        this.miniGameOpen = false;
        this.miniGameId = null;
        this.updateMusic();
        this.bus.emit('ui:blocking', false);
      });
      game.open();
    } catch (err) {
      console.error(err);
      this.miniGameOpen = false;
      this.hud.toast('The mini game could not load. Please try again.');
    }
  }

  private enterBuilding(id: string): void {
    this.dialog.close(); // e.g. when travelling from the map
    const def = findBuilding(id);
    if (!def?.interior || this.scenes.transitioning) return;
    const interiorId = def.interior;
    this.audio.play('door');
    this.currentBuilding = id;
    this.router.set({ name: 'building', id });
    const appearance = this.town.player.appearance;
    this.scenes.switchTo(
      async () => {
        const { InteriorScene } = await import('../scenes/InteriorScene');
        this.interior = new InteriorScene(this, interiorId, appearance, () => this.exitBuilding());
        return this.interior;
      },
      { then: () => this.hud.setPlace(def.name) },
    );
  }

  private exitBuilding(): void {
    if (!this.currentBuilding || this.scenes.transitioning) return;
    const id = this.currentBuilding;
    this.currentBuilding = null;
    this.interior = null;
    this.audio.play('door');
    this.router.set({ name: 'town' });
    this.scenes.switchTo(
      () => {
        this.town.placeAtDoor(id);
        return this.town;
      },
      { then: () => this.hud.setPlace('Town square') },
    );
  }

  /** Back/forward or a hand-edited hash while playing. */
  private onRoute(r: Route): void {
    if (!this.playing) return;
    if (r.name === 'town' && this.interior) this.exitBuilding();
    else if (r.name === 'building' && !this.interior && findBuilding(r.id)?.interior) {
      this.town.placeAtDoor(r.id);
      this.enterBuilding(r.id);
    }
  }
}
