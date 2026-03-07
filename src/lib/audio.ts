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
let _analyser: AnalyserNode | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (_sharedCtx && _sharedCtx.state !== 'closed') return _sharedCtx;
  try {
    _sharedCtx = new (window.AudioContext ||
      (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    _analyser = _sharedCtx.createAnalyser();
    _analyser.fftSize = 256;
    _analyser.smoothingTimeConstant = 0.8;
    _analyser.connect(_sharedCtx.destination);
    return _sharedCtx;
  } catch {
    return null;
  }
}

/** Returns the shared AnalyserNode (or null if not yet created). */
export function getAnalyser(): AnalyserNode | null {
  return _analyser;
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
 * Play a narrated voice MP3 with a consistent echo effect.
 *
 * Signal path (single path — no doubling):
 *   source ──► dryGain ──┐
 *   source ──► echo1    ──► compressor ──► analyser ──► destination
 *   source ──► echo2    ──┘
 *   source ──► echo3    ──┘
 *
 * DynamicsCompressor acts as a limiter so every file (regardless of its
 * recording level or baked-in reverb) hits the echo mix at the same perceived
 * loudness, making the echo sound identical across all mp3s.
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

    // ── Master compressor / limiter ──────────────────────────────────────
    // Normalises loudness differences between files so the echo
    // mix is proportionally equal regardless of source recording level.
    const compressor = ctx.createDynamicsCompressor();
    compressor.threshold.value = -10;
    compressor.knee.value      = 4;
    compressor.ratio.value     = 8;
    compressor.attack.value    = 0.003;
    compressor.release.value   = 0.18;

    // Route through the shared analyser (already wired to destination in getCtx).
    // This is the SINGLE path to the speakers — avoids the doubling/phase issue
    // that occurred when source was also connected directly to the analyser.
    if (_analyser) {
      compressor.connect(_analyser);
    } else {
      compressor.connect(ctx.destination);
    }

    // ── Dry signal ───────────────────────────────────────────────────────
    const dryGain = ctx.createGain();
    dryGain.gain.value = 0.85;
    dryGain.connect(compressor);

    // ── Three evenly-spaced echo taps ────────────────────────────────────
    const makeEcho = (delayTime: number, gain: number) => {
      const d = ctx.createDelay(2);
      d.delayTime.value = delayTime;
      const g = ctx.createGain();
      g.gain.value = gain;
      d.connect(g);
      g.connect(compressor);
      return d;
    };

    const echo1 = makeEcho(0.20, 0.18);
    const echo2 = makeEcho(0.40, 0.055);
    const echo3 = makeEcho(0.60, 0.018);

    source.connect(dryGain);
    source.connect(echo1);
    source.connect(echo2);
    source.connect(echo3);

    await new Promise<void>((resolve) => {
      source.onended = () => resolve();
      source.start(ctx.currentTime);
    });
  } catch (e) {
    console.warn('[voice]', src, e);
  }
}

/**
 * Like playVoiceFile but returns `{ duration, done }` so callers can:
 *  - start a countdown using `duration` (seconds, float)
 *  - await `done` to know when playback finishes
 * Returns null if sound is disabled or audio context is unavailable.
 */
export async function playVoiceFileTracked(
  src: string,
): Promise<{ duration: number; done: Promise<void> } | null> {
  const { useSettingsStore } = await import('@/stores/settingsStore');
  if (!useSettingsStore.getState().soundEnabled) return null;

  const ctx = getCtx();
  if (!ctx) return null;

  try {
    if (ctx.state === 'suspended') await ctx.resume();

    const buffer = await loadAudioBuffer(ctx, src);
    const duration = buffer.duration;

    let resolveEnded!: () => void;
    const done = new Promise<void>((res) => { resolveEnded = res; });

    const source = ctx.createBufferSource();
    source.buffer = buffer;

    const compressor = ctx.createDynamicsCompressor();
    compressor.threshold.value = -10;
    compressor.knee.value      = 4;
    compressor.ratio.value     = 8;
    compressor.attack.value    = 0.003;
    compressor.release.value   = 0.18;

    if (_analyser) {
      compressor.connect(_analyser);
    } else {
      compressor.connect(ctx.destination);
    }

    const dryGain = ctx.createGain();
    dryGain.gain.value = 0.85;
    dryGain.connect(compressor);

    const makeEcho = (delayTime: number, gain: number) => {
      const d = ctx.createDelay(2);
      d.delayTime.value = delayTime;
      const g = ctx.createGain();
      g.gain.value = gain;
      d.connect(g);
      g.connect(compressor);
      return d;
    };
    source.connect(dryGain);
    source.connect(makeEcho(0.20, 0.18));
    source.connect(makeEcho(0.40, 0.055));
    source.connect(makeEcho(0.60, 0.018));

    source.onended = () => resolveEnded();
    source.start(ctx.currentTime);

    return { duration, done };
  } catch (e) {
    console.warn('[voice tracked]', src, e);
    return null;
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
