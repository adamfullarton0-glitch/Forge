import { type SVGProps } from 'react';

/** The custom line-icon set. No emoji is used anywhere in FORGE. */
export type IconName =
  | 'home'
  | 'train'
  | 'plan'
  | 'eat'
  | 'recipes'
  | 'stats'
  | 'more'
  | 'sleep'
  | 'settings'
  | 'alert'
  | 'refresh'
  | 'flame'
  | 'chart'
  | 'target'
  | 'bolt'
  | 'moon'
  | 'star'
  | 'check'
  | 'trophy'
  | 'dumbbell';

const paths: Record<IconName, string> = {
  home: 'M3 11.5 12 4l9 7.5M5 10v9a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-9',
  train: 'M4 9v6M8 7v10M16 7v10M20 9v6M8 12h8',
  plan: 'M4 6h16M4 6v13a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V6M8 3v4M16 3v4M8 12h8M8 16h5',
  eat: 'M5 3v8a3 3 0 0 0 3 3v7M8 3v6M11 3v6M19 3c-1.5 0-3 2-3 6 0 2 1 3 2 3h1v9',
  recipes: 'M6 3h9a3 3 0 0 1 3 3v15H8a2 2 0 0 1-2-2zM6 17h12',
  stats: 'M4 20V10M10 20V4M16 20v-7M22 20H2',
  more: 'M5 12h.01M12 12h.01M19 12h.01',
  sleep: 'M21 12.8A8.5 8.5 0 1 1 11.2 3a6.6 6.6 0 0 0 9.8 9.8z',
  settings:
    'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 13.5a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-2.7 1.1V21a2 2 0 1 1-4 0v-.1a1.6 1.6 0 0 0-2.7-1.1l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0-1.1-2.7H3a2 2 0 1 1 0-4h.1a1.6 1.6 0 0 0 1.1-2.7l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3 1.6 1.6 0 0 0 .9-1.5V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 2.7 1.1l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8 1.6 1.6 0 0 0 1.5.9H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5.9z',
  alert:
    'M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z',
  refresh: 'M21 12a9 9 0 1 1-2.6-6.4M21 3v6h-6',
  flame:
    'M12 3c1.2 3.2 4.2 4.6 4.2 8.2A4.2 4.2 0 0 1 7.8 11C7.8 9.5 8.3 8.6 9 7.7c.2 1.1.9 1.8 1.7 2C10.2 8.2 10.8 5.6 12 3z',
  chart: 'M4 20V10M10 20V4M16 20v-7M22 20H2',
  target: 'M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16zM12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z',
  bolt: 'M13 2 4 14h6l-1 8 9-12h-6z',
  moon: 'M21 12.8A8.5 8.5 0 1 1 11.2 3a6.6 6.6 0 0 0 9.8 9.8z',
  star: 'M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 17l-5.2 2.6 1-5.8-4.3-4.1 5.9-.9z',
  check: 'M5 12.5l4.5 4.5L19 6.5',
  trophy:
    'M7 4h10v4a5 5 0 0 1-10 0zM7 6H4.5v1.5A3 3 0 0 0 7 10.4M17 6h2.5v1.5A3 3 0 0 1 17 10.4M9.5 17h5l.5 3h-6z',
  dumbbell: 'M4 9v6M8 7v10M16 7v10M20 9v6M8 12h8',
};

interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'name'> {
  name: IconName;
  size?: number;
  title?: string;
}

export function Icon({ name, size = 24, title, ...rest }: IconProps): JSX.Element {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      role={title ? 'img' : 'presentation'}
      aria-hidden={title ? undefined : true}
      {...rest}
    >
      {title ? <title>{title}</title> : null}
      <path d={paths[name]} />
    </svg>
  );
}
