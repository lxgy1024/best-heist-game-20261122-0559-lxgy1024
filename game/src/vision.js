// vision.js — what a watcher can see: cone test plus line-of-sight.
// One job: answer "is the thief visible from here?" Nothing else.
import { CFG } from './config.js';

function segmentHitsRect(x1, y1, x2, y2, r) {
  // Slab test: does the segment cross the rectangle?
  const dx = x2 - x1;
  const dy = y2 - y1;
  let t0 = 0;
  let t1 = 1;
  for (const [p, q] of [
    [-dx, x1 - r.x],
    [dx, r.x + r.w - x1],
    [-dy, y1 - r.y],
    [dy, r.y + r.h - y1],
  ]) {
    if (p === 0) {
      // Parallel to this slab and outside it: the segment cannot cross.
      if (q < 0) return false;
    } else {
      const t = q / p;
      if (p < 0) t0 = Math.max(t0, t);
      else t1 = Math.min(t1, t);
      if (t0 > t1) return false;
    }
  }
  return true;
}

// Line of sight: no solid between watcher and target.
export function hasLineOfSight(solids, ax, ay, bx, by) {
  for (const s of solids) {
    if (segmentHitsRect(ax, ay, bx, by, s)) return false;
  }
  return true;
}

// Full cone test: in range, inside the half-angle, line of sight clear,
// and not hidden inside a smoke cloud.
export function inVisionCone(eye, dirAngle, range, halfAngle, target, solids, smokes) {
  const dx = target.x - eye.x;
  const dy = target.y - eye.y;
  const dist = Math.hypot(dx, dy);
  if (dist > range) return false;
  let diff = Math.atan2(dy, dx) - dirAngle;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  if (Math.abs(diff) > halfAngle) return false;
  for (const sm of smokes) {
    if (Math.hypot(target.x - sm.x, target.y - sm.y) < sm.r) return false;
  }
  return hasLineOfSight(solids, eye.x, eye.y, target.x, target.y);
}

export function angleLerp(a, b, t) {
  let d = b - a;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return a + d * t;
}

export { CFG };
