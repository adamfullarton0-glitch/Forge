import { NavLink } from 'react-router-dom';
import { Icon, type IconName } from './Icon';

interface NavItem {
  to: string;
  label: string;
  icon: IconName;
}

/** The 7-section bottom navigation (Part B of the brief). */
const NAV_ITEMS: readonly NavItem[] = [
  { to: '/', label: 'Home', icon: 'home' },
  { to: '/train', label: 'Train', icon: 'train' },
  { to: '/plan', label: 'Plan', icon: 'plan' },
  { to: '/eat', label: 'Eat', icon: 'eat' },
  { to: '/recipes', label: 'Recipes', icon: 'recipes' },
  { to: '/stats', label: 'Stats', icon: 'stats' },
  { to: '/more', label: 'More', icon: 'more' },
];

export function NavBar(): JSX.Element {
  return (
    <nav className="navbar" aria-label="Primary">
      {NAV_ITEMS.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === '/'}
          className={({ isActive }) =>
            `navbar__item ${isActive ? 'navbar__item--active' : ''}`.trim()
          }
        >
          <Icon name={item.icon} size={22} />
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
