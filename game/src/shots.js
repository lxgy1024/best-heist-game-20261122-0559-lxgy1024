// shots.js — staged scenes for reproducible screenshots (?shot=...).
// One job: place the actors for a screenshot. Never used during real play.
import { CFG } from './config.js';

export function applyShot(kind, s) {
  const { level, thief, guards, cameras } = s;
  if (kind === 'start') {
    s.phase = 'title';
    return;
  }
  s.phase = 'play';
  s.frozen = true; // hold the frame still for the camera
  if (kind === 'patrol') {
    thief.x = 430; thief.y = 600; thief.angle = -Math.PI / 2;
    guards[0].x = 420; guards[0].y = 380; guards[0].angle = Math.PI / 2;
    guards[1].x = 980; guards[1].y = 470; guards[1].angle = -Math.PI / 2;
    guards[2].x = 250; guards[2].y = 260; guards[2].angle = 0;
    cameras[0].angle = Math.PI / 2 + 0.5;
    cameras[1].angle = -1.9;
  } else if (kind === 'loot') {
    thief.x = level.lootSpot.x - 62; thief.y = level.lootSpot.y + 26; thief.angle = Math.PI / 4;
    thief.crack = 0.72;
    guards[0].x = 700; guards[0].y = 300; guards[0].angle = Math.PI;
    guards[1].x = 1050; guards[1].y = 560; guards[1].angle = -Math.PI / 2;
    guards[2].x = 420; guards[2].y = 150; guards[2].angle = Math.PI / 2;
    cameras[0].angle = Math.PI / 2 - 0.4;
    cameras[1].angle = -1.75;
  } else if (kind === 'alarm') {
    s.alarm.value = 88;
    s.alarm.hot = true;
    thief.x = 640; thief.y = 430; thief.angle = Math.PI;
    thief.loot = true;
    guards[0].x = 560; guards[0].y = 360; guards[0].angle = Math.PI / 4;
    guards[0].seenNow = true; guards[0].mode = 'chase';
    guards[1].x = 900; guards[1].y = 520; guards[1].angle = -Math.PI * 0.75;
    guards[2].x = 300; guards[2].y = 300; guards[2].angle = Math.PI / 2;
    cameras[0].angle = Math.PI / 2 + 0.7;
    cameras[1].angle = -1.3;
    s.smokes.push({ x: 700, y: 470, r: CFG.SMOKE_RADIUS, t: 5 });
  }
}
