// Small audio + haptic helpers shared across the app. Audio uses a single
// lazily-created AudioContext so quick repeated calls don't allocate.

let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (ctx && ctx.state !== "closed") return ctx;
  const AudioCtx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!AudioCtx) return null;
  try {
    ctx = new AudioCtx();
  } catch {
    ctx = null;
  }
  return ctx;
}

function tone(
  freq: number,
  durationMs: number,
  options: { gain?: number; delayMs?: number; type?: OscillatorType } = {}
): void {
  const { gain = 0.2, delayMs = 0, type = "sine" } = options;
  try {
    const c = getCtx();
    if (!c) return;
    const start = c.currentTime + delayMs / 1000;
    const end = start + durationMs / 1000;
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, start);
    g.gain.setValueAtTime(0.0001, start);
    g.gain.exponentialRampToValueAtTime(gain, start + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, end);
    osc.connect(g).connect(c.destination);
    osc.start(start);
    osc.stop(end + 0.02);
  } catch {
    // best-effort; ignore (e.g. autoplay restrictions before user gesture)
  }
}

export function playCorrect(): void {
  tone(880, 140);
  tone(1175, 180, { delayMs: 90 });
}

export function playSkip(): void {
  tone(520, 120, { gain: 0.18 });
}

export function playUndo(): void {
  tone(660, 90, { gain: 0.15 });
}

export function playTimeUp(): void {
  tone(880, 250);
  tone(660, 250, { delayMs: 180 });
  tone(440, 400, { delayMs: 380, gain: 0.25 });
}

export function vibrate(pattern: number | number[]): void {
  if (typeof navigator === "undefined") return;
  if (typeof navigator.vibrate !== "function") return;
  try {
    navigator.vibrate(pattern);
  } catch {
    // ignore
  }
}
