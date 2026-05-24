// Lightweight synthesized audio. We avoid bundling audio assets (and the
// licensing/CORS questions that come with hosted clips) by generating short
// SFX and a slow ambient drone directly with the Web Audio API.
//
// All public functions are safe to call before the user has interacted with
// the page — the AudioContext is lazily created and operations no-op if the
// browser blocks them.

let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (ctx) return ctx;
  try {
    const Ctor =
      window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    ctx = new Ctor();
    return ctx;
  } catch {
    return null;
  }
}

function resumeCtx(c: AudioContext) {
  if (c.state === 'suspended') {
    c.resume().catch(() => undefined);
  }
}

export type SfxKind =
  | 'guessSubmit'
  | 'correct'
  | 'win'
  | 'lose'
  | 'cardDraw'
  | 'cardPlay'
  | 'tick';

interface ToneSpec {
  freq: number;
  duration: number;
  type?: OscillatorType;
  gain?: number;
  glideTo?: number;
}

const RECIPES: Record<SfxKind, ToneSpec[]> = {
  guessSubmit: [{ freq: 440, duration: 0.09, type: 'triangle', gain: 0.18 }],
  correct: [
    { freq: 523, duration: 0.12, type: 'triangle', gain: 0.22 },
    { freq: 784, duration: 0.18, type: 'triangle', gain: 0.22 },
  ],
  win: [
    { freq: 523, duration: 0.12, type: 'triangle', gain: 0.25 },
    { freq: 659, duration: 0.12, type: 'triangle', gain: 0.25 },
    { freq: 784, duration: 0.18, type: 'triangle', gain: 0.25 },
    { freq: 1047, duration: 0.32, type: 'triangle', gain: 0.25 },
  ],
  lose: [
    { freq: 392, duration: 0.18, type: 'sawtooth', gain: 0.18, glideTo: 196 },
  ],
  cardDraw: [{ freq: 880, duration: 0.08, type: 'sine', gain: 0.16, glideTo: 1320 }],
  cardPlay: [{ freq: 660, duration: 0.16, type: 'square', gain: 0.18, glideTo: 220 }],
  tick: [{ freq: 1200, duration: 0.04, type: 'square', gain: 0.08 }],
};

export function playSfx(kind: SfxKind) {
  const c = getCtx();
  if (!c) return;
  resumeCtx(c);
  let t = c.currentTime;
  for (const spec of RECIPES[kind]) {
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = spec.type ?? 'sine';
    osc.frequency.setValueAtTime(spec.freq, t);
    if (spec.glideTo) {
      osc.frequency.exponentialRampToValueAtTime(spec.glideTo, t + spec.duration);
    }
    const peak = spec.gain ?? 0.2;
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(peak, t + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + spec.duration);
    osc.connect(gain).connect(c.destination);
    osc.start(t);
    osc.stop(t + spec.duration + 0.02);
    t += spec.duration * 0.85;
  }
}

// ---- Ambient music: two detuned sine pads + a slow LFO. ----

interface AmbientHandle {
  start(): void;
  stop(): void;
  setSwapped(swapped: boolean): void;
  setMuted(muted: boolean): void;
}

let ambient: AmbientHandle | null = null;

function buildAmbient(c: AudioContext): AmbientHandle {
  const master = c.createGain();
  master.gain.value = 0;
  master.connect(c.destination);

  const padA = c.createOscillator();
  const padB = c.createOscillator();
  const padGain = c.createGain();
  padGain.gain.value = 0.12;
  padA.type = 'sine';
  padB.type = 'triangle';
  padA.frequency.value = 196; // G3
  padB.frequency.value = 261.6; // C4
  padA.connect(padGain);
  padB.connect(padGain);
  padGain.connect(master);

  // Slow LFO on the master gain for a breathing feel.
  const lfo = c.createOscillator();
  const lfoGain = c.createGain();
  lfo.frequency.value = 0.08;
  lfoGain.gain.value = 0.08;
  lfo.connect(lfoGain).connect(master.gain);

  let started = false;
  let targetGain = 0.5;
  let muted = false;

  function applyGain() {
    const ramp = 1.5;
    const v = muted ? 0.0001 : targetGain;
    master.gain.cancelScheduledValues(c.currentTime);
    master.gain.setTargetAtTime(v, c.currentTime, ramp / 3);
  }

  return {
    start() {
      if (started) return;
      started = true;
      padA.start();
      padB.start();
      lfo.start();
      applyGain();
    },
    stop() {
      if (!started) return;
      muted = true;
      applyGain();
    },
    setSwapped(swapped) {
      // Drop the pad by a fifth and add detune for a slightly woozy feel.
      const tNow = c.currentTime;
      if (swapped) {
        padA.frequency.setTargetAtTime(130.8, tNow, 0.5);
        padB.frequency.setTargetAtTime(174.6, tNow, 0.5);
        padA.detune.setTargetAtTime(-25, tNow, 0.5);
        padB.detune.setTargetAtTime(25, tNow, 0.5);
        targetGain = 0.7;
      } else {
        padA.frequency.setTargetAtTime(196, tNow, 0.5);
        padB.frequency.setTargetAtTime(261.6, tNow, 0.5);
        padA.detune.setTargetAtTime(0, tNow, 0.5);
        padB.detune.setTargetAtTime(0, tNow, 0.5);
        targetGain = 0.5;
      }
      applyGain();
    },
    setMuted(m) {
      muted = m;
      applyGain();
    },
  };
}

export function ambientMusic(): AmbientHandle | null {
  const c = getCtx();
  if (!c) return null;
  if (!ambient) ambient = buildAmbient(c);
  return ambient;
}

// Browsers gate audio until a user gesture. Call this from a click handler
// to start the context cleanly.
export function unlockAudio() {
  const c = getCtx();
  if (c) resumeCtx(c);
}
