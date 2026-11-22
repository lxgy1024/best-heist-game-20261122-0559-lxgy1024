// level.js — the Amber Vault gallery: one room, its walls, cover and actors.
// One job: describe the room. Movement, vision and drawing live elsewhere.
export function buildLevel() {
  // Solids block movement and sight: display cases, planters, statues, crates.
  const solids = [
    // central display row — the long way round or the risky middle gap
    { x: 430, y: 210, w: 120, h: 46, kind: 'case', label: 'JADE' },
    { x: 640, y: 210, w: 120, h: 46, kind: 'case', label: 'GOLD' },
    { x: 850, y: 210, w: 120, h: 46, kind: 'case', label: 'SILK' },
    // lower hall furniture
    { x: 300, y: 470, w: 150, h: 52, kind: 'case', label: 'COINS' },
    { x: 700, y: 470, w: 150, h: 52, kind: 'case', label: 'MASKS' },
    // planters double as soft cover (hide in the bushes)
    { x: 110, y: 300, w: 70, h: 70, kind: 'bush' },
    { x: 1150, y: 380, w: 70, h: 70, kind: 'bush' },
    { x: 560, y: 560, w: 70, h: 70, kind: 'bush' },
    // statues and crates near the vault corridor
    { x: 1010, y: 120, w: 56, h: 56, kind: 'statue' },
    { x: 950, y: 560, w: 64, h: 64, kind: 'crate' },
    { x: 120, y: 130, w: 64, h: 64, kind: 'crate' },
  ];
  return {
    // Entrance bottom-left; vault top-right; exit door on the left wall.
    spawn: { x: 110, y: 640 },
    exit: { x: 36, y: 330, w: 30, h: 110 },
    vault: { x: 1130, y: 90, w: 96, h: 96 },
    lootSpot: { x: 1178, y: 138 },
    guards: [
      // Routes run in the open lanes between the furniture, never through it.
      {
        route: [
          { x: 600, y: 150 }, { x: 600, y: 420 }, { x: 340, y: 420 }, { x: 340, y: 150 },
        ],
        start: 0,
      },
      {
        route: [
          { x: 880, y: 330 }, { x: 880, y: 650 }, { x: 1080, y: 650 }, { x: 1080, y: 430 },
        ],
        start: 2,
      },
      {
        route: [
          { x: 200, y: 400 }, { x: 580, y: 400 }, { x: 580, y: 120 }, { x: 200, y: 120 },
        ],
        start: 1,
      },
    ],
    cameras: [
      { x: 640, y: 60, base: Math.PI / 2, sweep: 0.9, phase: 0 },
      // Watches the vault from below: its sweep leaves a ~4s safe window to crack the lock.
      { x: 1210, y: 300, base: -Math.PI / 2, sweep: 0.8, phase: 1.6 },
    ],
    solids,
  };
}

// True when the circle at (x, y, r) overlaps any solid or the outer wall.
export function hitsSolid(level, x, y, r) {
  const m = 36; // outer wall thickness, same as CFG.WALL
  if (x - r < m || x + r > 1280 - m || y - r < m || y + r > 720 - m) return true;
  for (const s of level.solids) {
    const cx = Math.max(s.x, Math.min(x, s.x + s.w));
    const cy = Math.max(s.y, Math.min(y, s.y + s.h));
    if ((x - cx) * (x - cx) + (y - cy) * (y - cy) < r * r) return true;
  }
  return false;
}
