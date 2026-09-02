/** Fixed effort-point scale (docs/prd.md R17, ADR-0001). */
export const EFFORT_POINTS = [1, 2, 3, 5, 8, 13] as const;

export type EffortPoints = (typeof EFFORT_POINTS)[number];

export function isEffortPoints(value: number): value is EffortPoints {
  return (EFFORT_POINTS as readonly number[]).includes(value);
}
