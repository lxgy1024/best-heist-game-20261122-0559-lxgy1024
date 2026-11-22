// cameras.js — the wall cameras: fixed mounts sweeping a cone back and forth.
// One job: camera sweep and spotting. Guards and the alarm live elsewhere.
import { CFG } from './config.js';
import { inVisionCone } from './vision.js';

export function makeCamera(spec) {
  return {
    x: spec.x,
    y: spec.y,
    base: spec.base,
    sweep: spec.sweep,
    phase: spec.phase,
    angle: spec.base,
    t: spec.phase,
    seenNow: false,
  };
}

export function updateCamera(cam, dt, ctx) {
  cam.t += dt;
  // Sine sweep: slow at the edges, fastest in the middle — readable rhythm.
  cam.angle = cam.base + Math.sin(cam.t * CFG.CAM_SWEEP) * cam.sweep;
  cam.seenNow = inVisionCone(
    cam, cam.angle, CFG.CAM_RANGE, CFG.CAM_HALF_ANGLE,
    ctx.thief, ctx.solids, ctx.smokes,
  );
  return cam.seenNow;
}
