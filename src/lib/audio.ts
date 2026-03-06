/**
 * Web Audio API utilities for notification and alarm sounds.
 * No audio files needed — tones are generated programmatically.
 */

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  try {
    return new (window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  } catch {
    return null;
  }
}

function beep(
  ctx: AudioContext,
  frequency: number,
  type: OscillatorType,
  startTime: number,
  duration: number,
  gain: number
): void {
  const osc = ctx.createOscillator();
  const gainNode = ctx.createGain();
  osc.connect(gainNode);
  gainNode.connect(ctx.destination);

  osc.type = type;
  osc.frequency.setValueAtTime(frequency, startTime);
  gainNode.gain.setValueAtTime(gain, startTime);
  gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

  osc.start(startTime);
  osc.stop(startTime + duration);
}

/** Soft notification beep — two short sine tones */
export function playNotificationSound(): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  beep(ctx, 880, 'sine', now, 0.15, 0.4);
  beep(ctx, 1100, 'sine', now + 0.18, 0.15, 0.35);

  setTimeout(() => ctx.close(), 800);
}

/** Urgent alarm sound — three square-wave pulses */
export function playAlarmSound(): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const interval = 0.32;
  for (let i = 0; i < 3; i++) {
    beep(ctx, 440, 'square', now + i * interval, 0.25, 0.35);
    beep(ctx, 880, 'square', now + i * interval + 0.26, 0.06, 0.2);
  }

  setTimeout(() => ctx.close(), 1500);
}
