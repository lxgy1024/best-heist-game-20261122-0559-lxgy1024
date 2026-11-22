// thief.js — the thief: movement, sneaking, smoke, and cracking the vault.
// One job: what the player controls. Guards, cameras and alarm live elsewhere.
import { CFG } from './config.js';
import { hitsSolid } from './level.js';

export function makeThief(spawn) {
  return {
    x: spawn.x,
    y: spawn.y,
    angle: 0,
    sneaking: false,
    moving: false,
    loot: false,
    crack: 0, // 0..1 progress on the vault lock
    smokesLeft: CFG.SMOKES_START,
    smokeUsedAt: -99,
  };
}

function nearVault(level, t) {
  return Math.hypot(t.x - level.lootSpot.x, t.y - level.lootSpot.y) < 78;
}

// Returns an event: 'loot' when the vault opens, 'smoke' when a bomb drops.
export function updateThief(t, dt, input, level, time) {
  let dx = 0;
  let dy = 0;
  if (input.keys.has('KeyW') || input.keys.has('ArrowUp')) dy -= 1;
  if (input.keys.has('KeyS') || input.keys.has('ArrowDown')) dy += 1;
  if (input.keys.has('KeyA') || input.keys.has('ArrowLeft')) dx -= 1;
  if (input.keys.has('KeyD') || input.keys.has('ArrowRight')) dx += 1;
  t.sneaking = input.keys.has('ShiftLeft') || input.keys.has('ShiftRight');
  t.moving = dx !== 0 || dy !== 0;
  if (t.moving) {
    const len = Math.hypot(dx, dy);
    const speed = t.sneaking ? CFG.SNEAK_SPEED : CFG.WALK_SPEED;
    const nx = t.x + (dx / len) * speed * dt;
    const ny = t.y + (dy / len) * speed * dt;
    t.angle = Math.atan2(dy, dx);
    // Slide along walls: try each axis on its own.
    if (!hitsSolid(level, nx, t.y, CFG.THIEF_R)) t.x = nx;
    if (!hitsSolid(level, t.x, ny, CFG.THIEF_R)) t.y = ny;
  }

  if (input.consume('KeyQ') && t.smokesLeft > 0 && time - t.smokeUsedAt > 0.5) {
    t.smokesLeft -= 1;
    t.smokeUsedAt = time;
    return 'smoke';
  }

  // Hold E beside the vault to pick its lock; step away and progress fades.
  if (!t.loot && nearVault(level, t) && input.keys.has('KeyE')) {
    t.crack += dt / CFG.VAULT_CRACK_SECONDS;
    if (t.crack >= 1) {
      t.crack = 1;
      t.loot = true;
      return 'loot';
    }
  } else if (!t.loot) {
    t.crack = Math.max(0, t.crack - dt * 0.8);
  }
  return 'none';
}
