/** What happens when the player presses E on something. */
export type InteractAction =
  | { kind: 'ink'; knot: string }
  | { kind: 'goto'; location: string; spawn: string };

/** Something on the map the player can press E on. */
export interface Interactable {
  id: string;
  /** Where the prompt is anchored (usually the tile centre). */
  x: number;
  y: number;
  /**
   * The footprint the player has to stand next to, in world pixels.
   * Reach is measured to its edge, so wide things (carts, beds, tables)
   * work from any side, not just from in front of their centre.
   */
  area: { left: number; top: number; right: number; bottom: number };
  /** Short verb for the on-screen prompt, e.g. "поговорити". */
  verb: string;
  /** Name shown above the prompt (characters). */
  label?: string;
  action: InteractAction;
}

/** Distance from a point to the nearest edge of an area (0 when inside it). */
function distanceTo(px: number, py: number, a: Interactable['area']): number {
  const dx = Math.max(a.left - px, 0, px - a.right);
  const dy = Math.max(a.top - py, 0, py - a.bottom);
  return Math.hypot(dx, dy);
}

/** The interactable whose footprint is closest to (px, py), within `range` pixels, or null. */
export function findNearest(
  px: number,
  py: number,
  items: readonly Interactable[],
  range: number,
): Interactable | null {
  let best: Interactable | null = null;
  let bestDist = range;
  for (const item of items) {
    const d = distanceTo(px, py, item.area);
    if (d <= bestDist) {
      best = item;
      bestDist = d;
    }
  }
  return best;
}
