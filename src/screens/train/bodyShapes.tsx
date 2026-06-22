/* This module shares static SVG shape fragments (not components) between the
   body map and the per-exercise muscle diagram, so the react-refresh
   component-only rule doesn't apply. */
/* eslint-disable react-refresh/only-export-components */
import { type ReactNode } from 'react';
import { type MuscleGroup } from '@/features/workouts/muscles';

/** The SVG viewBox shared by the body map and the per-exercise muscle diagram. */
export const BODY_VIEWBOX = '0 0 260 215';

/** SVG shapes per muscle region (front figure ~x66, back figure ~x194). */
export const SHAPES: Record<MuscleGroup, ReactNode> = {
  shoulders: (
    <>
      <ellipse cx={46} cy={45} rx={10} ry={8} />
      <ellipse cx={86} cy={45} rx={10} ry={8} />
    </>
  ),
  chest: <rect x={50} y={40} width={32} height={20} rx={6} />,
  biceps: (
    <>
      <rect x={33} y={50} width={9} height={22} rx={4} />
      <rect x={90} y={50} width={9} height={22} rx={4} />
    </>
  ),
  core: <rect x={54} y={62} width={24} height={28} rx={6} />,
  quads: (
    <>
      <rect x={53} y={102} width={12} height={44} rx={6} />
      <rect x={67} y={102} width={12} height={44} rx={6} />
    </>
  ),
  calves: (
    <>
      <rect x={54} y={150} width={10} height={38} rx={5} />
      <rect x={68} y={150} width={10} height={38} rx={5} />
    </>
  ),
  back: <rect x={178} y={40} width={32} height={46} rx={8} />,
  triceps: (
    <>
      <rect x={161} y={50} width={9} height={22} rx={4} />
      <rect x={218} y={50} width={9} height={22} rx={4} />
    </>
  ),
  glutes: <rect x={180} y={88} width={28} height={18} rx={8} />,
  hamstrings: (
    <>
      <rect x={181} y={106} width={12} height={42} rx={6} />
      <rect x={195} y={106} width={12} height={42} rx={6} />
    </>
  ),
};

const fillerProps = { fill: 'var(--panel-2)', stroke: 'var(--glass-border)', strokeWidth: 1 };

/** Non-interactive silhouette filler (head, neck, forearms, feet, hips). */
export const FILLER: ReactNode = (
  <g aria-hidden="true">
    {/* Front */}
    <circle cx={66} cy={20} r={11} {...fillerProps} />
    <rect x={62} y={29} width={8} height={7} {...fillerProps} />
    <rect x={33} y={72} width={8} height={20} rx={4} {...fillerProps} />
    <rect x={91} y={72} width={8} height={20} rx={4} {...fillerProps} />
    <rect x={52} y={90} width={28} height={13} rx={4} {...fillerProps} />
    <rect x={54} y={188} width={10} height={8} rx={2} {...fillerProps} />
    <rect x={68} y={188} width={10} height={8} rx={2} {...fillerProps} />
    {/* Back */}
    <circle cx={194} cy={20} r={11} {...fillerProps} />
    <rect x={190} y={29} width={8} height={7} {...fillerProps} />
    <rect x={161} y={72} width={9} height={20} rx={4} {...fillerProps} />
    <rect x={218} y={72} width={9} height={20} rx={4} {...fillerProps} />
    <rect x={181} y={148} width={12} height={40} rx={6} {...fillerProps} />
    <rect x={195} y={148} width={12} height={40} rx={6} {...fillerProps} />
    <rect x={181} y={188} width={12} height={8} rx={2} {...fillerProps} />
    <rect x={195} y={188} width={12} height={8} rx={2} {...fillerProps} />
  </g>
);
