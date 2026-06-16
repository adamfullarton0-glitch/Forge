/**
 * Pulse design tokens — the single source of truth for FORGE's look.
 * Screens and components must read from here (or the CSS variables derived
 * from here) rather than hard-coding colours, so theming stays consistent.
 */

export type ThemeName = 'dark' | 'light';
export type AccentName = 'cyan' | 'violet' | 'emerald' | 'amber';

export const accents: Record<AccentName, string> = {
  cyan: '#22D3EE',
  violet: '#A855F7',
  emerald: '#34D399',
  amber: '#F5A623',
};

/** Sleep stage colours (Part F of the brief). */
export const sleepStageColors = {
  deep: '#22D3EE',
  rem: '#A855F7',
  light: '#3B82F6',
  awake: '#56627A',
} as const;

/** Readiness band colours + thresholds (Part B / F of the brief). */
export const readinessBands = [
  { name: 'Primed', min: 85, color: '#34D399' },
  { name: 'Ready', min: 70, color: '#22D3EE' },
  { name: 'Moderate', min: 55, color: '#F5A623' },
  { name: 'Low', min: 0, color: '#FF5C5C' },
] as const;

interface ThemeTokens {
  bg: string;
  bgElevated: string;
  glass: string;
  glassBorder: string;
  text: string;
  muted: string;
  shadow: string;
}

export const themes: Record<ThemeName, ThemeTokens> = {
  dark: {
    bg: '#0A0E14',
    bgElevated: '#111722',
    glass: 'rgba(255, 255, 255, 0.04)',
    glassBorder: 'rgba(255, 255, 255, 0.08)',
    text: '#EAF2FF',
    muted: '#7E8CA3',
    shadow: 'rgba(0, 0, 0, 0.45)',
  },
  light: {
    bg: '#F4F7FB',
    bgElevated: '#FFFFFF',
    glass: 'rgba(10, 14, 20, 0.03)',
    glassBorder: 'rgba(10, 14, 20, 0.10)',
    text: '#0A0E14',
    muted: '#5A6B82',
    shadow: 'rgba(10, 14, 20, 0.12)',
  },
};

/**
 * Apply a theme + accent by writing CSS custom properties onto the root
 * element. All component styles reference these variables.
 */
export function applyTheme(
  theme: ThemeName,
  accent: AccentName,
  root: HTMLElement = document.documentElement,
): void {
  const t = themes[theme];
  const a = accents[accent];
  root.dataset.theme = theme;
  root.style.setProperty('--bg', t.bg);
  root.style.setProperty('--bg-elevated', t.bgElevated);
  root.style.setProperty('--glass', t.glass);
  root.style.setProperty('--glass-border', t.glassBorder);
  root.style.setProperty('--text', t.text);
  root.style.setProperty('--muted', t.muted);
  root.style.setProperty('--shadow', t.shadow);
  root.style.setProperty('--accent', a);
}
