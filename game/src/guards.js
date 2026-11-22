// guards.js — the patrolling guards: walk the route, watch, chase, catch.
// One job: guard behaviour. The thief, the alarm and the drawing live elsewhere.
import { CFG } from './config.js';
import { inVisionCone, angleLerp, hasLineOfSight } from './vision.js';

export function makeGuard(spec) {
  const start = spec.route[spec.start % spec.route.length];
  return {
    route: spec.route,
    wp: (spec.start + 1) % spec.route.length,
    x: start.x,
    y: start.y,
    angle: Math.PI / 2,
    mode: 'patrol', // patrol | chase | search
    lastSeen: null,
    seenNow: false,
    pauseT: 0,
  };
}

export function updateGuard(g, dt, ctx) {
  const { thief, solids, smokes, alarm } = ctx;
  g.seenNow = inVisionCone(
    g, g.angle, CFG.GUARD_RANGE, CFG.GUARD_HALF_ANGLE, thief, solids, smokes,
  );
  if (g.seenNow) {
    g.lastSeen = { x: thief.x, y: thief.y };
    if (alarm >= CFG.CHASE_AT_ALARM) g.mode = 'chase';
  }

  if (g.mode === 'chase' && g.lastSeen) {
    const dx = g.lastSeen.x - g.x;
    const dy = g.lastSeen.y - g.y;
    const d = Math.hypot(dx, dy);
    const targetAngle = Math.atan2(dy, dx);
    g.angle = angleLerp(g.angle, targetAngle, Math.min(1, dt * 8));
    if (d > 12) {
      const step = Math.min(d, CFG.CHASE_SPEED * dt);
      g.x += (dx / d) * step;
      g.y += (dy / d) * step;
    } else if (!g.seenNow) {
      g.mode = 'search';
      g.pauseT = 2.5;
    }
    if (!g.seenNow && !hasLineOfSight(solids, g.x, g.y, g.lastSeen.x, g.lastSeen.y)) {
      g.mode = 'search';
      g.pauseT = 2.5;
    }
  } else if (g.mode === 'search') {
    g.pauseT -= dt;
    g.angle += dt * 2.2; // look around, then give up and resume the route
    if (g.pauseT <= 0) g.mode = 'patrol';
  } else {
    const wp = g.route[g.wp];
    const dx = wp.x - g.x;
    const dy = wp.y - g.y;
    const d = Math.hypot(dx, dy);
    if (d < 8) {
      g.wp = (g.wp + 1) % g.route.length;
      g.pauseT = 0.9; // a beat at each corner: the fair moment to slip past
    } else if (g.pauseT > 0) {
      g.pauseT -= dt;
    } else {
      const targetAngle = Math.atan2(dy, dx);
      g.angle = angleLerp(g.angle, targetAngle, Math.min(1, dt * 6));
      const step = Math.min(d, CFG.PATROL_SPEED * dt);
      g.x += (dx / d) * step;
      g.y += (dy / d) * step;
    }
  }

  // Caught: a guard gets a hand on the thief.
  if (Math.hypot(thief.x - g.x, thief.y - g.y) < CFG.CAUGHT_DIST) return 'caught';
  return g.seenNow ? 'seen' : 'ok';
}
