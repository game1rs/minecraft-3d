// ============================================================
// 🔊 WebAudio sound engine — all effects are synthesized,
//    no audio files needed. Gracefully no-ops if unavailable.
// ============================================================

let ctx = null
let noiseBuffer = null

function ac() {
  if (typeof window === 'undefined') return null
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext
    if (!AC) return null
    try { ctx = new AC() } catch { return null }
  }
  if (ctx.state === 'suspended') ctx.resume().catch(() => {})
  return ctx
}

function tone({ freq, freqEnd = null, dur = 0.15, type = 'sine', gain = 0.18, when = 0 }) {
  const c = ac()
  if (!c) return
  const t0 = c.currentTime + when
  const osc = c.createOscillator()
  const g = c.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, t0)
  if (freqEnd != null) osc.frequency.exponentialRampToValueAtTime(Math.max(1, freqEnd), t0 + dur)
  g.gain.setValueAtTime(0.0001, t0)
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.012)
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur)
  osc.connect(g).connect(c.destination)
  osc.start(t0)
  osc.stop(t0 + dur + 0.05)
}

function noise({ dur = 0.3, from = 2000, to = 500, gain = 0.15, when = 0 }) {
  const c = ac()
  if (!c) return
  if (!noiseBuffer) {
    noiseBuffer = c.createBuffer(1, c.sampleRate, c.sampleRate)
    const data = noiseBuffer.getChannelData(0)
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
  }
  const t0 = c.currentTime + when
  const src = c.createBufferSource()
  src.buffer = noiseBuffer
  src.loop = true
  const filter = c.createBiquadFilter()
  filter.type = 'lowpass'
  filter.frequency.setValueAtTime(from, t0)
  filter.frequency.exponentialRampToValueAtTime(Math.max(40, to), t0 + dur)
  const g = c.createGain()
  g.gain.setValueAtTime(0.0001, t0)
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.02)
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur)
  src.connect(filter).connect(g).connect(c.destination)
  src.start(t0)
  src.stop(t0 + dur + 0.05)
}

const SFX = {
  plant:   () => tone({ type: 'triangle', freq: 230, freqEnd: 130, dur: 0.14, gain: 0.22 }),
  water:   () => { noise({ dur: 0.4, from: 2600, to: 450, gain: 0.14 }); tone({ type: 'sine', freq: 900, freqEnd: 480, dur: 0.3, gain: 0.05 }) },
  harvest: () => [523, 659, 784].forEach((f, i) => tone({ type: 'triangle', freq: f, dur: 0.1, when: i * 0.06, gain: 0.15 })),
  coin:    () => { tone({ type: 'square', freq: 988, dur: 0.07, gain: 0.1 }); tone({ type: 'square', freq: 1319, dur: 0.2, when: 0.07, gain: 0.1 }) },
  buy:     () => tone({ type: 'triangle', freq: 420, freqEnd: 840, dur: 0.13, gain: 0.2 }),
  error:   () => tone({ type: 'sawtooth', freq: 160, freqEnd: 110, dur: 0.16, gain: 0.1 }),
  levelup: () => [523, 659, 784, 1047].forEach((f, i) => tone({ type: 'triangle', freq: f, dur: 0.14, when: i * 0.09, gain: 0.16 })),
  ready:   () => { tone({ type: 'sine', freq: 880, dur: 0.22, gain: 0.08 }); tone({ type: 'sine', freq: 1320, dur: 0.28, when: 0.03, gain: 0.045 }) },
  sparkle: () => [1568, 1976, 2637].forEach((f, i) => tone({ type: 'sine', freq: f + Math.random() * 120, dur: 0.12, when: i * 0.05, gain: 0.1 })),
  alert:   () => { tone({ type: 'square', freq: 660, dur: 0.12, gain: 0.09 }); tone({ type: 'square', freq: 520, dur: 0.14, when: 0.14, gain: 0.09 }) },
  wither:  () => tone({ type: 'sawtooth', freq: 280, freqEnd: 70, dur: 0.5, gain: 0.12 }),
  rain:    () => noise({ dur: 1.1, from: 1400, to: 900, gain: 0.06 }),
  dig:     () => { noise({ dur: 0.18, from: 900, to: 280, gain: 0.18 }); tone({ type: 'triangle', freq: 150, freqEnd: 90, dur: 0.15, gain: 0.18 }) },
  spray:   () => noise({ dur: 0.35, from: 3800, to: 2100, gain: 0.1 }),
  step:    () => { noise({ dur: 0.07, from: 480, to: 150, gain: 0.045 }); tone({ type: 'sine', freq: 95, freqEnd: 60, dur: 0.07, gain: 0.045 }) },
}

export function playSfx(name, enabled = true) {
  if (!enabled) return
  const fn = SFX[name]
  if (!fn) return
  try { fn() } catch { /* audio is best-effort */ }
}
