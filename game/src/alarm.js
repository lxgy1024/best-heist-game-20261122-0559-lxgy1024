// alarm.js — the alarm meter: rises while anyone sees the thief, falls when hidden.
// One job: the alarm value and whether it has maxed out.
import { CFG } from './config.js';

export function makeAlarm() {
  return { value: 0, maxed: false, hot: false };
}

export function updateAlarm(alarm, dt, seenByGuard, seenByCam, sneaking) {
  let rate = 0;
  if (seenByGuard) rate += CFG.ALARM_PER_SEC_GUARD;
  if (seenByCam) rate += CFG.ALARM_PER_SEC_CAM;
  if (rate > 0 && sneaking) rate *= CFG.ALARM_SNEAK_DAMP;
  if (rate > 0) {
    alarm.value += rate * dt;
  } else {
    alarm.value -= CFG.ALARM_DECAY_PER_SEC * dt;
  }
  alarm.value = Math.max(0, Math.min(CFG.ALARM_MAX, alarm.value));
  alarm.hot = seenByGuard || seenByCam;
  if (alarm.value >= CFG.ALARM_MAX) alarm.maxed = true;
  return alarm.maxed;
}
