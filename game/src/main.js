// main.js — the loop and the rules that tie the game together.
// One job: own the state machine (title → play → win/lose), read input,
// step thief, guards, cameras and alarm, and draw every frame.
import { CFG } from './config.js';
import { buildLevel } from './level.js';
import { makeGuard, updateGuard } from './guards.js';
import { makeCamera, updateCamera } from './cameras.js';
import { makeThief, updateThief } from './thief.js';
import { makeAlarm, updateAlarm } from './alarm.js';
import { render } from './render.js';
import { applyShot } from './shots.js';
import { initAudio, playPickup, playAlarmBlip, playWin, playLose, playSmoke } from './audio.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const level = buildLevel();
const state = {
  level,
  thief: makeThief(level.spawn),
  guards: level.guards.map(makeGuard),
  cameras: level.cameras.map(makeCamera),
  smokes: [],
  alarm: makeAlarm(),
  phase: 'title', // title | play | win | lose
  loseWhy: null, // 'alarm' | 'caught'
  time: 0,
  frozen: false,
  blipT: 0,
};

const input = {
  keys: new Set(),
  pressed: new Set(),
  consume(code) {
    if (this.pressed.has(code)) {
      this.pressed.delete(code);
      return true;
    }
    return false;
  },
};

function startGame() {
  state.thief = makeThief(level.spawn);
  state.guards = level.guards.map(makeGuard);
  state.cameras = level.cameras.map(makeCamera);
  state.smokes = [];
  state.alarm = makeAlarm();
  state.phase = 'play';
  state.loseWhy = null;
  state.time = 0;
  state.frozen = false;
}

window.addEventListener('keydown', (e) => {
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault();
  initAudio();
  if (!e.repeat) input.pressed.add(e.code);
  input.keys.add(e.code);
  if (e.code === 'Enter' && state.phase === 'title') startGame();
  if (e.code === 'KeyR' && (state.phase === 'win' || state.phase === 'lose')) startGame();
});
window.addEventListener('keyup', (e) => input.keys.delete(e.code));
canvas.addEventListener('click', () => {
  initAudio();
  if (state.phase === 'title' || state.phase === 'win' || state.phase === 'lose') startGame();
});

function inRect(x, y, r) {
  return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
}

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;

  if (state.phase === 'play' && !state.frozen) {
    state.time += dt;
    for (const sm of state.smokes) sm.t -= dt;
    state.smokes = state.smokes.filter((sm) => sm.t > 0);

    const event = updateThief(state.thief, dt, input, level, state.time);
    if (event === 'loot') playPickup();
    else if (event === 'smoke') {
      state.smokes.push({ x: state.thief.x, y: state.thief.y, r: CFG.SMOKE_RADIUS, t: CFG.SMOKE_SECONDS });
      playSmoke();
    }

    let seenByGuard = false;
    let seenByCam = false;
    let caught = false;
    const watch = { thief: state.thief, solids: level.solids, smokes: state.smokes, alarm: state.alarm.value };
    for (const g of state.guards) {
      if (updateGuard(g, dt, watch) === 'caught') caught = true;
      if (g.seenNow) seenByGuard = true;
    }
    for (const cam of state.cameras) {
      if (updateCamera(cam, dt, watch)) seenByCam = true;
    }
    const blown = updateAlarm(state.alarm, dt, seenByGuard, seenByCam, state.thief.sneaking);
    if ((seenByGuard || seenByCam) && state.time - state.blipT > 0.9) {
      state.blipT = state.time;
      playAlarmBlip();
    }

    if (state.thief.loot && inRect(state.thief.x, state.thief.y, level.exit)) {
      state.phase = 'win';
      playWin();
    } else if (caught || blown) {
      state.phase = 'lose';
      state.loseWhy = blown ? 'alarm' : 'caught';
      playLose();
    }
  }

  input.pressed.clear();
  render(ctx, state);
  requestAnimationFrame(frame);
}

// Screenshot staging: ?shot=start|patrol|loot|alarm freezes one frame.
const shot = new URLSearchParams(window.location.search).get('shot');
if (shot) applyShot(shot, state);
// Test hook: lets an automated play-test inspect and drive the live state.
window.__game = state;
requestAnimationFrame(frame);
