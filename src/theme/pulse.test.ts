import { describe, it, expect } from 'vitest';
import { applyTheme, themes, accents, readinessBands, sleepStageColors } from './pulse';

describe('pulse theme tokens', () => {
  it('applyTheme writes the expected CSS custom properties', () => {
    const root = document.createElement('div');
    applyTheme('dark', 'cyan', root);
    expect(root.dataset.theme).toBe('dark');
    expect(root.style.getPropertyValue('--bg')).toBe(themes.dark.bg);
    expect(root.style.getPropertyValue('--text')).toBe(themes.dark.text);
    expect(root.style.getPropertyValue('--accent')).toBe(accents.cyan);
  });

  it('applyTheme switches theme and accent independently', () => {
    const root = document.createElement('div');
    applyTheme('light', 'violet', root);
    expect(root.dataset.theme).toBe('light');
    expect(root.style.getPropertyValue('--bg')).toBe(themes.light.bg);
    expect(root.style.getPropertyValue('--accent')).toBe(accents.violet);
  });

  it('exposes the readiness bands in descending threshold order', () => {
    const mins = readinessBands.map((b) => b.min);
    const sorted = [...mins].sort((a, b) => b - a);
    expect(mins).toEqual(sorted);
    expect(readinessBands[0]?.name).toBe('Primed');
  });

  it('defines all four sleep stage colours', () => {
    expect(Object.keys(sleepStageColors)).toEqual(['deep', 'rem', 'light', 'awake']);
  });
});
