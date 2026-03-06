/**
 * Web Audio API sound effects.
 * All tones are generated programmatically — no audio files needed.
 */

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  try {
    return new (window.AudioContext ||
      (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
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

/** Very short soft tick — generic button click */
export function playClick(): void {
  const ctx = getAudioContext();
  if (!ctx) return;
  beep(ctx, 1000, 'sine', ctx.currentTime, 0.055, 0.12);
  setTimeout(() => ctx.close(), 200);
}

/** Two ascending tones — navigation / tab switch */
export function playNavSwitch(): void {
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;
  beep(ctx, 420, 'sine', now, 0.07, 0.1);
  beep(ctx, 620, 'sine', now + 0.065, 0.07, 0.09);
  setTimeout(() => ctx.close(), 350);
}

/** Short blip — checkbox / toggle */
export function playToggle(): void {
  const ctx = getAudioContext();
  if (!ctx) return;
  beep(ctx, 860, 'triangle', ctx.currentTime, 0.07, 0.18);
  setTimeout(() => ctx.close(), 250);
}

/** Ascending arpeggio — task / mission complete */
export function playSuccess(): void {
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;
  beep(ctx, 523, 'sine', now,       0.12, 0.28); // C5
  beep(ctx, 659, 'sine', now + 0.1, 0.12, 0.28); // E5
  beep(ctx, 784, 'sine', now + 0.2, 0.18, 0.28); // G5
  setTimeout(() => ctx.close(), 700);
}

/** Short descending tone — delete / fail */
export function playDelete(): void {
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;
  beep(ctx, 380, 'sine', now,        0.05, 0.18);
  beep(ctx, 260, 'sine', now + 0.05, 0.11, 0.14);
  setTimeout(() => ctx.close(), 350);
}

/** Soft notification beep — two short sine tones */
export function playNotificationSound(): void {
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;
  beep(ctx, 880,  'sine', now,       0.15, 0.4);
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
    beep(ctx, 440, 'square', now + i * interval,        0.25, 0.35);
    beep(ctx, 880, 'square', now + i * interval + 0.26, 0.06, 0.2);
  }
  setTimeout(() => ctx.close(), 1500);
}
