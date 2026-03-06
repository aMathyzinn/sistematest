/**
 * Web Audio API sound effects + narrated voice playback with echo.
 * All tones are generated programmatically — no audio files needed for SFX.
 * Voice lines are loaded from /audios/*.mp3 and passed through an echo chain.
 *
 * Uses a SINGLETON AudioContext that is unlocked once per session on the first
 * user gesture. This prevents the "suspended context" issue where a fresh
 * AudioContext created after a gesture can't be resumed.
 */

// ─── Singleton AudioContext ───────────────────────────────────────────────────
let _sharedCtx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (_sharedCtx && _sharedCtx.state !== 'closed') return _sharedCtx;
  try {
    _sharedCtx = new (window.AudioContext ||
      (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    return _sharedCtx;
  } catch {
    return null;
  }
}

// ─── Autoplay gate ────────────────────────────────────────────────────────────
let _hasGesture = false;
const _voiceQueue: string[] = [];

/** Called by SoundProvider on first user click — unlocks AudioContext and drains voice queue. */
export function markUserGesture(): void {
  if (_hasGesture) return;
  _hasGesture = true;
  // Resume the shared context now that we have a user gesture
  const ctx = getCtx();
  if (ctx && ctx.state === 'suspended') ctx.resume().catch(() => {});
  // Drain pending voices
  const pending = _voiceQueue.splice(0);
  for (const src of pending) playVoiceFile(src);
}

/** Plays immediately if gesture occurred, otherwise queues for next interaction. */
export function queueOrPlayVoice(src: string): void {
  if (_hasGesture) {
    playVoiceFile(src);
  } else {
    _voiceQueue.push(src);
  }
}

// ─── SFX helpers ─────────────────────────────────────────────────────────────
function beep(
  ctx: AudioContext,
  frequency: number,
  type: OscillatorType,
  startTime: number,
  duration: number,
  gain: number,
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

// ─── Voice file cache ─────────────────────────────────────────────────────────
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
 * Uses the shared AudioContext — no gesture race condition.
 */
export async function playVoiceFile(src: string): Promise<void> {
  const { useSettingsStore } = await import('@/stores/settingsStore');
  if (!useSettingsStore.getState().soundEnabled) return;

  const ctx = getCtx();
  if (!ctx) return;

  try {
    if (ctx.state === 'suspended') await ctx.resume();

    const buffer = await loadAudioBuffer(ctx, src);

    const source = ctx.createBufferSource();
    source.buffer = buffer;

    const dryGain = ctx.createGain();
    dryGain.gain.value = 0.9;

    const delay1 = ctx.createDelay(2);
    delay1.delayTime.value = 0.28;
    const echoGain1 = ctx.createGain();
    echoGain1.gain.value = 0.10;

    const delay2 = ctx.createDelay(2);
    delay2.delayTime.value = 0.56;
    const echoGain2 = ctx.createGain();
    echoGain2.gain.value = 0.04;

    const delay3 = ctx.createDelay(2);
    delay3.delayTime.value = 0.84;
    const echoGain3 = ctx.createGain();
    echoGain3.gain.value = 0.015;

    source.connect(dryGain);    dryGain.connect(ctx.destination);
    source.connect(delay1);     delay1.connect(echoGain1);  echoGain1.connect(ctx.destination);
    source.connect(delay2);     delay2.connect(echoGain2);  echoGain2.connect(ctx.destination);
    source.connect(delay3);     delay3.connect(echoGain3);  echoGain3.connect(ctx.destination);

    source.start(ctx.currentTime);
  } catch (e) {
    console.warn('[voice]', src, e);
  }
}

// ─── Named voice helpers ──────────────────────────────────────────────────────
export const playVoiceMissionComplete = () => playVoiceFile('/audios/missao_concluida.mp3');
export const playVoiceAllMissionsDone = () => playVoiceFile('/audios/missoes_concluidas.mp3');
export const playVoiceBoaTarde        = () => queueOrPlayVoice('/audios/boa_tarde.mp3');
export const playVoiceBemVindo        = () => playVoiceFile('/audios/bem-vindo.mp3');
export const playVoiceNotification    = () => playVoiceFile('/audios/notificacao.mp3');
export const playVoiceMissionCreated  = () => playVoiceFile('/audios/missao_criada.mp3');
export const playVoiceApiKey          = () => playVoiceFile('/audios/api_key.mp3');

// ─── SFX (generated tones) ────────────────────────────────────────────────────

export function playClick(): void {
  const ctx = getCtx();
  if (!ctx) return;
  beep(ctx, 1000, 'sine', ctx.currentTime, 0.055, 0.12);
}

export function playNavSwitch(): void {
  const ctx = getCtx();
  if (!ctx) return;
  const now = ctx.currentTime;
  beep(ctx, 420, 'sine', now, 0.07, 0.1);
  beep(ctx, 620, 'sine', now + 0.065, 0.07, 0.09);
}

export function playToggle(): void {
  const ctx = getCtx();
  if (!ctx) return;
  beep(ctx, 860, 'triangle', ctx.currentTime, 0.07, 0.18);
}

export function playSuccess(): void {
  const ctx = getCtx();
  if (!ctx) return;
  const now = ctx.currentTime;
  beep(ctx, 523, 'sine', now,       0.12, 0.28);
  beep(ctx, 659, 'sine', now + 0.1, 0.12, 0.28);
  beep(ctx, 784, 'sine', now + 0.2, 0.18, 0.28);
}

export function playDelete(): void {
  const ctx = getCtx();
  if (!ctx) return;
  const now = ctx.currentTime;
  beep(ctx, 380, 'sine', now,        0.05, 0.18);
  beep(ctx, 260, 'sine', now + 0.05, 0.11, 0.14);
}

export function playNotificationSound(): void {
  const ctx = getCtx();
  if (!ctx) return;
  const now = ctx.currentTime;
  beep(ctx, 880,  'sine', now,        0.15, 0.4);
  beep(ctx, 1100, 'sine', now + 0.18, 0.15, 0.35);
}

export function playAlarmSound(): void {
  const ctx = getCtx();
  if (!ctx) return;
  const now = ctx.currentTime;
  const interval = 0.32;
  for (let i = 0; i < 3; i++) {
    beep(ctx, 440, 'square', now + i * interval,        0.25, 0.35);
    beep(ctx, 880, 'square', now + i * interval + 0.26, 0.06, 0.2);
  }
}
