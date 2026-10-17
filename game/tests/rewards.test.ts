import { describe, expect, it } from 'vitest';
import { collectibles } from '../src/content/collectibles';
import { rewards } from '../src/content/rewards';
import { computeProgress } from '../src/systems/CollectibleSystem';
import { allCatIds, unlockedRewards } from '../src/systems/RewardSystem';
import { sanitizeSave } from '../src/systems/SaveManager';

const idsOf = (kind: string) => collectibles.filter((c) => c.kind === kind).map((c) => c.id);
const cats = allCatIds();

describe('rewards', () => {
  it('starts with nothing unlocked', () => {
    expect(unlockedRewards(computeProgress([]), [], cats)).toEqual([]);
  });

  it('gives a camera for every polaroid, but not for some', () => {
    const polaroids = idsOf('polaroid');
    expect(unlockedRewards(computeProgress(polaroids.slice(1)), [], cats)).not.toContain('camera');
    expect(unlockedRewards(computeProgress(polaroids), [], cats)).toEqual(['camera']);
  });

  it('gives a flower crown for every flower and coffee to go for every cup', () => {
    expect(unlockedRewards(computeProgress(idsOf('flower')), [], cats)).toEqual(['flowerCrown']);
    expect(unlockedRewards(computeProgress(idsOf('coffee')), [], cats)).toEqual(['coffeeCup']);
  });

  it('gives cat ears only once every cat (indoors too) is petted', () => {
    expect(cats.length).toBeGreaterThan(1);
    expect(unlockedRewards(computeProgress([]), cats.slice(1), cats)).not.toContain('catEars');
    expect(unlockedRewards(computeProgress([]), cats, cats)).toEqual(['catEars']);
  });

  it('gives the crown (and every collect reward) when everything is found', () => {
    const all = unlockedRewards(computeProgress(collectibles.map((c) => c.id)), [], cats);
    expect(all).toEqual(expect.arrayContaining(['camera', 'flowerCrown', 'coffeeCup', 'crown']));
    expect(all).not.toContain('catEars');
  });

  it('has unique reward accessories; the wizard hat only comes from luck', () => {
    const acc = rewards.map((r) => r.accessory);
    expect(new Set(acc).size).toBe(acc.length);
    expect(rewards.find((r) => r.accessory === 'wizardHat')?.goal.type).toBe('luck');
    expect(unlockedRewards(computeProgress(collectibles.map((c) => c.id)), cats, cats, false)).not.toContain('wizardHat');
    expect(unlockedRewards(computeProgress([]), [], cats, true)).toEqual(['wizardHat']);
  });

  it('migrates the old crown flag into rewardsSeen', () => {
    expect(sanitizeSave({ rewardClaimed: true }).rewardsSeen).toEqual(['crown']);
    expect(sanitizeSave({ petted: ['mochi', 3, 'mochi'] }).petted).toEqual(['mochi']);
  });
});
