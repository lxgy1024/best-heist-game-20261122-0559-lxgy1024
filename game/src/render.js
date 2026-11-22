// render.js — everything drawn: floor, cover, cones, actors, HUD, overlays.
// One job: draw the state. No rules, no input, no sound.
import { CFG } from './config.js';

function drawCone(ctx, x, y, angle, range, half, fill, edge) {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.arc(x, y, range, angle - half, angle + half);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = edge;
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

function drawRect(ctx, r, fill, stroke) {
  ctx.fillStyle = fill;
  ctx.fillRect(r.x, r.y, r.w, r.h);
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 2;
    ctx.strokeRect(r.x, r.y, r.w, r.h);
  }
}

function label(ctx, text, x, y, size, color) {
  ctx.font = `bold ${size}px system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
}

export function render(ctx, s) {
  const { level, thief, guards, cameras, smokes, alarm } = s;
  ctx.clearRect(0, 0, CFG.W, CFG.H);

  // Night gallery floor: dark boards with a faint checker and a warm rug.
  ctx.fillStyle = '#1d2333';
  ctx.fillRect(0, 0, CFG.W, CFG.H);
  ctx.fillStyle = '#202839';
  for (let y = 0; y < 720; y += 72) {
    for (let x = (y / 72) % 2 === 0 ? 0 : 72; x < 1280; x += 144) {
      ctx.fillRect(x, y, 72, 72);
    }
  }
  ctx.fillStyle = '#5a2e35';
  ctx.fillRect(520, 330, 240, 120);
  ctx.strokeStyle = '#7a3f47';
  ctx.lineWidth = 3;
  ctx.strokeRect(520, 330, 240, 120);

  // Outer walls.
  ctx.fillStyle = '#3a3f52';
  ctx.fillRect(0, 0, CFG.W, CFG.WALL);
  ctx.fillRect(0, CFG.H - CFG.WALL, CFG.W, CFG.WALL);
  ctx.fillRect(0, 0, CFG.WALL, CFG.H);
  ctx.fillRect(CFG.W - CFG.WALL, 0, CFG.WALL, CFG.H);
  label(ctx, 'THE AMBER VAULT  ·  MIDNIGHT', CFG.W / 2, 20, 15, '#c9b37e');

  // Exit door on the left wall — green, labelled, always visible.
  drawRect(ctx, level.exit, '#1f7a4d', '#37d67a');
  label(ctx, 'EXIT', level.exit.x + level.exit.w / 2, level.exit.y + level.exit.h / 2, 15, '#eafff1');

  // The vault: gold corner room with the Amber Star inside until it is taken.
  drawRect(ctx, level.vault, '#4a3410', '#e8b23a');
  label(ctx, 'VAULT', level.vault.x + 48, level.vault.y + 16, 13, '#e8b23a');
  if (!thief.loot) {
    ctx.save();
    ctx.translate(level.lootSpot.x, level.lootSpot.y);
    ctx.rotate(Math.PI / 4);
    ctx.fillStyle = '#ffd34d';
    ctx.fillRect(-13, -13, 26, 26);
    ctx.strokeStyle = '#fff3c4';
    ctx.lineWidth = 2;
    ctx.strokeRect(-13, -13, 26, 26);
    ctx.restore();
    label(ctx, '◆ THE AMBER STAR ◆', level.lootSpot.x, level.lootSpot.y + 34, 12, '#ffd34d');
    if (thief.crack > 0) {
      ctx.fillStyle = '#222';
      ctx.fillRect(level.lootSpot.x - 40, level.lootSpot.y + 52, 80, 9);
      ctx.fillStyle = '#37d67a';
      ctx.fillRect(level.lootSpot.x - 40, level.lootSpot.y + 52, 80 * thief.crack, 9);
      label(ctx, 'PICKING LOCK… hold E', level.lootSpot.x, level.lootSpot.y + 68, 11, '#eafff1');
    }
  } else {
    label(ctx, 'LOOT SECURED — RUN!', level.lootSpot.x, level.lootSpot.y, 12, '#37d67a');
  }

  // Cover: display cases, bushes, statues, crates — each labelled.
  for (const o of level.solids) {
    if (o.kind === 'bush') {
      ctx.fillStyle = '#2c5a34';
      ctx.beginPath();
      ctx.arc(o.x + o.w / 2, o.y + o.h / 2, 34, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#3f7a48';
      ctx.beginPath();
      ctx.arc(o.x + o.w / 2 - 10, o.y + o.h / 2 - 8, 18, 0, Math.PI * 2);
      ctx.fill();
      label(ctx, 'HIDE', o.x + o.w / 2, o.y + o.h / 2, 11, '#cfe8c9');
    } else if (o.kind === 'statue') {
      drawRect(ctx, o, '#6b6f82', '#9aa0b5');
      label(ctx, 'STATUE', o.x + o.w / 2, o.y + o.h / 2, 10, '#e8eaf2');
    } else if (o.kind === 'crate') {
      drawRect(ctx, o, '#6b4d2a', '#a67c44');
      label(ctx, 'CRATE', o.x + o.w / 2, o.y + o.h / 2, 10, '#f2e3c9');
    } else {
      drawRect(ctx, o, '#2f3a5c', '#7d8fc9');
      label(ctx, o.label || 'CASE', o.x + o.w / 2, o.y + o.h / 2, 11, '#c9d4f2');
    }
  }

  // Vision cones first (under the actors): guards amber-red, cameras orange.
  for (const g of guards) {
    drawCone(ctx, g.x, g.y, g.angle, CFG.GUARD_RANGE, CFG.GUARD_HALF_ANGLE,
      g.seenNow ? 'rgba(255,60,60,0.34)' : 'rgba(255,180,60,0.20)',
      g.seenNow ? 'rgba(255,60,60,0.6)' : 'rgba(255,180,60,0.35)');
  }
  for (const cam of cameras) {
    drawCone(ctx, cam.x, cam.y, cam.angle, CFG.CAM_RANGE, CFG.CAM_HALF_ANGLE,
      cam.seenNow ? 'rgba(255,60,60,0.30)' : 'rgba(255,140,40,0.16)',
      cam.seenNow ? 'rgba(255,60,60,0.55)' : 'rgba(255,140,40,0.3)');
  }

  // Smoke clouds.
  for (const sm of smokes) {
    ctx.fillStyle = 'rgba(200,200,210,0.45)';
    ctx.beginPath();
    ctx.arc(sm.x, sm.y, sm.r, 0, Math.PI * 2);
    ctx.fill();
    label(ctx, 'SMOKE', sm.x, sm.y, 12, '#3a3a44');
  }

  // Cameras: wall mounts with a lens dot.
  for (const cam of cameras) {
    ctx.fillStyle = '#222';
    ctx.beginPath();
    ctx.arc(cam.x, cam.y, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = cam.seenNow ? '#ff3c3c' : '#ffb13c';
    ctx.beginPath();
    ctx.arc(cam.x, cam.y, 6, 0, Math.PI * 2);
    ctx.fill();
  }

  // Guards: navy circle, facing tick, alert mark when they see you.
  for (const g of guards) {
    ctx.fillStyle = g.mode === 'chase' ? '#a11' : '#24365e';
    ctx.beginPath();
    ctx.arc(g.x, g.y, CFG.GUARD_R, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#dbe4ff';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.strokeStyle = '#dbe4ff';
    ctx.beginPath();
    ctx.moveTo(g.x, g.y);
    ctx.lineTo(g.x + Math.cos(g.angle) * 20, g.y + Math.sin(g.angle) * 20);
    ctx.stroke();
    if (g.seenNow) label(ctx, '!', g.x, g.y - 26, 20, '#ff5a5a');
    else if (g.mode === 'chase') label(ctx, '?', g.x, g.y - 26, 18, '#ffb13c');
  }

  // The thief: hooded circle with a direction tick; loot diamond when carried.
  ctx.fillStyle = thief.sneaking ? '#4d6b8a' : '#2e86ff';
  ctx.beginPath();
  ctx.arc(thief.x, thief.y, CFG.THIEF_R, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(thief.x, thief.y);
  ctx.lineTo(thief.x + Math.cos(thief.angle) * 19, thief.y + Math.sin(thief.angle) * 19);
  ctx.stroke();
  label(ctx, 'YOU', thief.x, thief.y - 24, 11, '#fff');
  if (thief.loot) {
    ctx.save();
    ctx.translate(thief.x + 20, thief.y - 16);
    ctx.rotate(Math.PI / 4);
    ctx.fillStyle = '#ffd34d';
    ctx.fillRect(-6, -6, 12, 12);
    ctx.restore();
  }

  // HUD: alarm meter top-right, loot + smoke bottom-left, hint bottom-right.
  const ax = 980;
  const ay = 48;
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.fillRect(ax - 14, ay - 18, 286, 44);
  label(ctx, 'ALARM', ax + 8, ay - 4, 13, '#fff');
  ctx.fillStyle = '#333';
  ctx.fillRect(ax + 62, ay - 10, 190, 16);
  const frac = alarm.value / CFG.ALARM_MAX;
  ctx.fillStyle = frac > 0.66 ? '#ff3c3c' : frac > 0.33 ? '#ffb13c' : '#37d67a';
  ctx.fillRect(ax + 62, ay - 10, 190 * frac, 16);
  ctx.strokeStyle = '#fff';
  ctx.strokeRect(ax + 62, ay - 10, 190, 16);
  label(ctx, `${Math.round(alarm.value)}%`, ax + 30, ay + 22, 12, alarm.hot ? '#ff8a8a' : '#dfe6ff');
  if (alarm.hot) label(ctx, 'SPOTTED!', ax + 205, ay + 22, 13, '#ff5a5a');

  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.fillRect(48, 660, 330, 40);
  label(ctx, `LOOT ${thief.loot ? '★ TAKEN' : '— vault, top right'}   SMOKE ×${thief.smokesLeft} (Q)`, 213, 680, 13, '#fff');
  label(ctx, 'WASD move · Shift sneak · E pick lock · R restart', 1050, 680, 12, '#c9d4f2');

  // Title / win / lose overlays.
  if (s.phase === 'title') {
    ctx.fillStyle = 'rgba(8,10,18,0.78)';
    ctx.fillRect(0, 0, CFG.W, CFG.H);
    label(ctx, 'AMBER VAULT', CFG.W / 2, 240, 64, '#ffd34d');
    label(ctx, '— The Midnight Heist —', CFG.W / 2, 300, 22, '#e8eaf2');
    label(ctx, 'Cross the gallery. Dodge the guards’ cones and the sweeping cameras.', CFG.W / 2, 360, 17, '#dfe6ff');
    label(ctx, 'Hold E at the vault to steal the Amber Star, then slip out the green EXIT.', CFG.W / 2, 390, 17, '#dfe6ff');
    label(ctx, 'Shift to sneak · Q drops a smoke bomb · if the alarm hits 100%, it’s over.', CFG.W / 2, 420, 17, '#ffb13c');
    label(ctx, 'Press Enter or click to begin', CFG.W / 2, 480, 20, '#37d67a');
  } else if (s.phase === 'win') {
    ctx.fillStyle = 'rgba(6,24,12,0.72)';
    ctx.fillRect(0, 0, CFG.W, CFG.H);
    label(ctx, 'CLEAN GETAWAY!', CFG.W / 2, 300, 56, '#37d67a');
    label(ctx, `The Amber Star is yours. Alarm finished at ${Math.round(alarm.value)}%.`, CFG.W / 2, 370, 18, '#eafff1');
    label(ctx, 'Press R or click to run it again', CFG.W / 2, 420, 18, '#fff');
  } else if (s.phase === 'lose') {
    ctx.fillStyle = 'rgba(28,6,6,0.72)';
    ctx.fillRect(0, 0, CFG.W, CFG.H);
    label(ctx, s.loseWhy === 'alarm' ? 'THE ALARM BLEW IT' : 'CAUGHT!', CFG.W / 2, 300, 56, '#ff5a5a');
    label(ctx, s.loseWhy === 'alarm'
      ? 'The alarm hit 100% — the vault sealed and the police were called.'
      : 'A guard got a hand on you in the gallery.', CFG.W / 2, 370, 18, '#ffe1e1');
    label(ctx, 'Press R or click to try again', CFG.W / 2, 420, 18, '#fff');
  }
}
