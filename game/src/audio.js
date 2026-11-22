// audio.js — tiny WebAudio bleeps, synthesized, no audio files.
// One job: sound effects. Created lazily on the first key press or click.
let ctx = null;

export function initAudio() {
  if (ctx) {
    if (ctx.state === 'suspended') ctx.resume();
    return;
  }
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
  } catch {
    ctx = null;
  }
}

function tone(freq, seconds, kind, gain) {
  if (!ctx) return;
  try {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = kind;
    osc.frequency.value = freq;
    g.gain.setValueAtTime(gain, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + seconds);
    osc.connect(g).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + seconds);
  } catch {
    // Sound is garnish: a failure here must never break the game.
  }
}

export function playPickup() { tone(880, 0.25, 'sine', 0.12); setTimeout(() => tone(1320, 0.3, 'sine', 0.1), 90); }
export function playAlarmBlip() { tone(220, 0.12, 'square', 0.05); }
export function playSmoke() { tone(160, 0.4, 'triangle', 0.1); }
export function playWin() { [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => tone(f, 0.3, 'sine', 0.1), i * 120)); }
export function playLose() { [330, 262, 196].forEach((f, i) => setTimeout(() => tone(f, 0.35, 'sawtooth', 0.07), i * 160)); }
