/**
 * Web Audio API sound effects + narrated voice playback with echo.
 * All tones are generated programmatically — no audio files needed for SFX.
 * Voice lines are loaded from /audios/*.mp3 and passed through an echo chain.
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

// ─── Voice file cache ────────────────────────────────────────────────────────
const audioBufferCache: Map<string, AudioBuffer> = new Map();

async function loadAudioBuffer(ctx: AudioContext, src: string): Promise<AudioBuffer> {
  if (audioBufferCache.has(src)) return audioBufferCache.get(src)!;
  const res = await fetch(src);
  const arrayBuf = await res.arrayBuffer();
  const decoded = await ctx.decodeAudioData(arrayBuf);
  audioBufferCache.set(src, decoded);
  return decoded;
}

/**
 * Play a narrated voice MP3 with a light echo effect.
 * Only plays if soundEnabled in settingsStore is true.
 * Returns a Promise that resolves when playback ends (or on error).
 */
export async function playVoiceFile(src: string): Promise<void> {
  // Dynamically import to avoid circular deps / SSR issues
  const { useSettingsStore } = await import('@/stores/settingsStore');
  if (!useSettingsStore.getState().soundEnabled) return;

  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const buffer = await loadAudioBuffer(ctx, src);

    // Dry path
    const source = ctx.createBufferSource();
    source.buffer = buffer;

    const dryGain = ctx.createGain();
    dryGain.gain.value = 0.9;

    // Echo 1 — 260 ms
    const delay1 = ctx.createDelay(2);
    delay1.delayTime.value = 0.26;
    const echoGain1 = ctx.createGain();
    echoGain1.gain.value = 0.32;

    // Echo 2 — 520 ms
    const delay2 = ctx.createDelay(2);
    delay2.delayTime.value = 0.52;
    const echoGain2 = ctx.createGain();
    echoGain2.gain.value = 0.14;

    // Echo 3 — 780 ms (tail)
    const delay3 = ctx.createDelay(2);
    delay3.delayTime.value = 0.78;
    const echoGain3 = ctx.createGain();
    echoGain3.gain.value = 0.06;

    // Routing
    source.connect(dryGain);    dryGain.connect(ctx.destination);
    source.connect(delay1);     delay1.connect(echoGain1);   echoGain1.connect(ctx.destination);
    source.connect(delay2);     delay2.connect(echoGain2);   echoGain2.connect(ctx.destination);
    source.connect(delay3);     delay3.connect(echoGain3);   echoGain3.connect(ctx.destination);

    source.start(ctx.currentTime);

    await new Promise<void>((resolve) => {
      source.onended = () => {
        setTimeout(() => { ctx.close(); resolve(); }, 1000);
      };
    });
  } catch (e) {
    console.warn('[voice]', src, e);
    ctx.close();
  }
}

// ─── Named voice helpers ──────────────────────────────────────────────────────
export const playVoiceMissionComplete    = () => playVoiceFile('/audios/missao_concluida.mp3');
export const playVoiceAllMissionsDone    = () => playVoiceFile('/audios/missoes_concluidas.mp3');
export const playVoiceBoaTarde           = () => playVoiceFile('/audios/boa_tarde.mp3');
export const playVoiceNotification       = () => playVoiceFile('/audios/notificacao.mp3');
export const playVoiceMissionCreated     = () => playVoiceFile('/audios/missao_criada.mp3');

// ─── SFX (generated tones) ────────────────────────────────────────────────────

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
  beep(ctx, 880,  'sine', now,        0.15, 0.4);
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
