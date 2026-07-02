import { useState } from 'react';
import { Icon } from '@/components/Icon';
import { gradOf, type Recipe } from '@/features/recipes/data';

interface RecipeCardProps {
  r: Recipe;
  photoUrl: string | null;
  saved: boolean;
  onOpen: () => void;
  onToggleSave: () => void;
}

/** A photo card for the recipe carousels: image, title, calories + bookmark. */
export function RecipeCard({
  r,
  photoUrl,
  saved,
  onOpen,
  onToggleSave,
}: RecipeCardProps): JSX.Element {
  const [err, setErr] = useState(false);
  const g = gradOf(r.grad ?? 0);
  return (
    <div className="rc-card">
      <div className="rc-card__media">
        {photoUrl && !err ? (
          <img
            className="rc-card__img"
            src={photoUrl}
            alt=""
            loading="lazy"
            onError={() => setErr(true)}
          />
        ) : (
          <div
            className="rc-card__grad"
            style={{ background: `linear-gradient(135deg, ${g[0]}, ${g[1]})` }}
          >
            {(r.name || '?').trim().charAt(0).toUpperCase()}
          </div>
        )}
        <button
          type="button"
          className="rc-card__open"
          onClick={onOpen}
          aria-label={`View ${r.name}`}
        />
        <button
          type="button"
          className="rc-card__save"
          aria-pressed={saved}
          aria-label={saved ? `Remove ${r.name} from saved` : `Save ${r.name}`}
          onClick={onToggleSave}
        >
          <Icon name={saved ? 'check' : 'star'} size={17} />
        </button>
      </div>
      <button type="button" className="rc-card__info" onClick={onOpen}>
        <span className="rc-card__title">{r.name}</span>
        <span className="rc-card__meta">
          <span className="rc-card__kcal">{r.kcal} cal</span>
          <span>·</span>
          <span className="rc-card__pro">{r.p}g protein</span>
        </span>
      </button>
    </div>
  );
}
