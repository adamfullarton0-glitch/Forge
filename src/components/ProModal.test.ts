import { describe, it, expect } from 'vitest';
import { PRO_RECIPE_COUNT } from './ProModal';
import { ALL_RECIPES } from '@/features/recipes/data';
import { canSee } from '@/features/recipes/filter';

describe('ProModal claims', () => {
  it('advertises no more PRO recipes than the library actually locks', () => {
    const locked = ALL_RECIPES.filter((r) => !canSee(r, false)).length;
    // "N+" must undersell, never oversell.
    expect(PRO_RECIPE_COUNT).toBeLessThanOrEqual(locked);
    // And stay in the right ballpark so the pitch doesn't drift stale.
    expect(PRO_RECIPE_COUNT).toBeGreaterThanOrEqual(locked - 50);
  });
});
