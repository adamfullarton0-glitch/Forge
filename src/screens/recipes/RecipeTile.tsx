import { useState } from 'react';
import { photoFor } from '@/features/recipes/filter';
import { gradOf, type Recipe } from '@/features/recipes/data';

function GradTile({ r, size }: { r: Recipe; size: number }): JSX.Element {
  const g = gradOf(r.grad ?? 0);
  return (
    <div
      style={{
        width: size,
        height: size,
        minWidth: size,
        borderRadius: 14,
        background: `linear-gradient(135deg, ${g[0]}, ${g[1]})`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: 'inset 0 0 0 1px rgba(255,255,255,.15)',
      }}
    >
      <span style={{ fontSize: size * 0.4, fontWeight: 800, color: 'rgba(255,255,255,.92)' }}>
        {(r.name || '?').trim().charAt(0).toUpperCase()}
      </span>
    </div>
  );
}

/** A recipe thumbnail — a real photo when available, else a gradient initial. */
export function RecipeTile({
  r,
  photos,
  size = 70,
}: {
  r: Recipe;
  photos: Record<string, string[]> | null;
  size?: number;
}): JSX.Element {
  const [err, setErr] = useState(false);
  const url = photoFor(r, photos);
  if (!url || err) return <GradTile r={r} size={size} />;
  return (
    <img
      src={url}
      alt={r.name}
      loading="lazy"
      onError={() => setErr(true)}
      style={{
        width: size,
        height: size,
        minWidth: size,
        borderRadius: 14,
        objectFit: 'cover',
        boxShadow: 'inset 0 0 0 1px rgba(255,255,255,.12)',
      }}
    />
  );
}
