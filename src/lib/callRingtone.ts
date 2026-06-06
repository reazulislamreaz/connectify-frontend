let audioContext: AudioContext | null = null;
let ringTimer: ReturnType<typeof setInterval> | null = null;
let activeMode: "incoming" | "outgoing" | null = null;
let masterGain: GainNode | null = null;

function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new AudioContext();
  }
  return audioContext;
}

async function ensureResumed(): Promise<AudioContext> {
  const ctx = getAudioContext();
  if (ctx.state === "suspended") {
    await ctx.resume();
  }
  return ctx;
}

/** Fresh master bus per ring session so stopCallRingtone() can silence it instantly. */
function newMasterGain(ctx: AudioContext, level: number): GainNode {
  if (masterGain) {
    try {
      masterGain.disconnect();
    } catch {
      /* already disconnected */
    }
  }
  const gain = ctx.createGain();
  gain.gain.value = level;
  gain.connect(ctx.destination);
  masterGain = gain;
  return gain;
}

/**
 * A short marimba-like note: a triangle fundamental plus a quieter octave
 * partial, with a quick attack and a soft percussive decay.
 */
function playMarimbaNote(
  ctx: AudioContext,
  out: GainNode,
  freq: number,
  start: number,
  duration: number,
  volume: number,
): void {
  const noteGain = ctx.createGain();
  noteGain.connect(out);
  noteGain.gain.setValueAtTime(0.0001, start);
  noteGain.gain.exponentialRampToValueAtTime(volume, start + 0.012);
  noteGain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

  const fundamental = ctx.createOscillator();
  fundamental.type = "triangle";
  fundamental.frequency.value = freq;
  fundamental.connect(noteGain);
  fundamental.start(start);
  fundamental.stop(start + duration + 0.05);

  const overtone = ctx.createOscillator();
  const overtoneGain = ctx.createGain();
  overtone.type = "sine";
  overtone.frequency.value = freq * 2;
  overtoneGain.gain.value = 0.35;
  overtone.connect(overtoneGain);
  overtoneGain.connect(noteGain);
  overtone.start(start);
  overtone.stop(start + duration + 0.05);
}

/** A soft dual-tone beep used for the outgoing ringback ("calling…"). */
function playRingbackBeep(
  ctx: AudioContext,
  out: GainNode,
  start: number,
  duration: number,
  volume: number,
): void {
  for (const freq of [440, 480]) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(out);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(volume, start + 0.04);
    gain.gain.setValueAtTime(volume, start + duration - 0.05);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    osc.start(start);
    osc.stop(start + duration + 0.05);
  }
}

// Bright marimba arpeggio loop (A major), reminiscent of a messenger ringtone.
const A5 = 880;
const B5 = 987.77;
const CS6 = 1108.73;
const E6 = 1318.51;
const GS6 = 1661.22;
const A6 = 1760;
const INCOMING_MELODY: Array<[number, number]> = [
  [0.0, A5],
  [0.15, CS6],
  [0.3, E6],
  [0.45, A6],
  [0.6, GS6],
  [0.75, E6],
  [0.9, CS6],
  [1.05, B5],
];
const INCOMING_LOOP_MS = 2400;

export async function startIncomingRingtone(): Promise<void> {
  if (activeMode === "incoming") return;
  stopCallRingtone();
  activeMode = "incoming";

  const ctx = await ensureResumed();
  const out = newMasterGain(ctx, 0.9);

  const ring = () => {
    const base = ctx.currentTime + 0.02;
    for (const [offset, freq] of INCOMING_MELODY) {
      playMarimbaNote(ctx, out, freq, base + offset, 0.5, 0.22);
    }
  };

  ring();
  ringTimer = setInterval(ring, INCOMING_LOOP_MS);
}

const OUTGOING_LOOP_MS = 3200;

export async function startOutgoingRingtone(): Promise<void> {
  if (activeMode === "outgoing") return;
  stopCallRingtone();
  activeMode = "outgoing";

  const ctx = await ensureResumed();
  const out = newMasterGain(ctx, 0.9);

  // Two short beeps, then a pause — the classic "ringing out" cadence.
  const ring = () => {
    const base = ctx.currentTime + 0.02;
    playRingbackBeep(ctx, out, base, 0.4, 0.1);
    playRingbackBeep(ctx, out, base + 0.55, 0.4, 0.1);
  };

  ring();
  ringTimer = setInterval(ring, OUTGOING_LOOP_MS);
}

export function stopCallRingtone(): void {
  if (ringTimer) {
    clearInterval(ringTimer);
    ringTimer = null;
  }
  if (masterGain && audioContext) {
    // Fade out fast so any in-flight notes are silenced immediately.
    const now = audioContext.currentTime;
    try {
      masterGain.gain.cancelScheduledValues(now);
      masterGain.gain.setValueAtTime(masterGain.gain.value, now);
      masterGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);
    } catch {
      /* node may already be disconnected */
    }
    const toStop = masterGain;
    masterGain = null;
    setTimeout(() => {
      try {
        toStop.disconnect();
      } catch {
        /* already disconnected */
      }
    }, 120);
  }
  activeMode = null;
}
