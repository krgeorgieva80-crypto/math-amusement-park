/**
 * Звукови ефекти, синтезирани с Web Audio API — без външни файлове.
 * Всеки ефект може по-късно да се замени с професионален аудио файл
 * чрез `registerSample(name, url)`.
 */

export type SoundName = 'click' | 'pick' | 'drop' | 'remove' | 'success' | 'tryAgain' | 'star' | 'fanfare' | 'locked' | 'hint'

type Note = { f: number; t: number; d: number; type?: OscillatorType; g?: number; slide?: number }

const SOUNDS: Record<SoundName, Note[]> = {
  click: [{ f: 660, t: 0, d: 0.07, type: 'triangle', g: 0.35, slide: 880 }],
  pick: [{ f: 520, t: 0, d: 0.09, type: 'sine', g: 0.4, slide: 900 }],
  drop: [
    { f: 880, t: 0, d: 0.08, type: 'triangle', g: 0.35 },
    { f: 1320, t: 0.05, d: 0.12, type: 'sine', g: 0.25 },
  ],
  remove: [{ f: 700, t: 0, d: 0.12, type: 'sine', g: 0.3, slide: 380 }],
  success: [
    { f: 523.25, t: 0, d: 0.14, type: 'triangle' },
    { f: 659.25, t: 0.1, d: 0.14, type: 'triangle' },
    { f: 783.99, t: 0.2, d: 0.14, type: 'triangle' },
    { f: 1046.5, t: 0.3, d: 0.4, type: 'triangle' },
    { f: 1567.98, t: 0.3, d: 0.4, type: 'sine', g: 0.15 },
  ],
  tryAgain: [
    { f: 440, t: 0, d: 0.18, type: 'sine', g: 0.3 },
    { f: 392, t: 0.16, d: 0.26, type: 'sine', g: 0.3 },
  ],
  star: [
    { f: 1318.5, t: 0, d: 0.1, type: 'sine', g: 0.25 },
    { f: 1975.5, t: 0.06, d: 0.18, type: 'sine', g: 0.2 },
  ],
  fanfare: [
    { f: 392, t: 0, d: 0.16, type: 'square', g: 0.12 },
    { f: 523.25, t: 0.15, d: 0.16, type: 'square', g: 0.12 },
    { f: 659.25, t: 0.3, d: 0.16, type: 'square', g: 0.12 },
    { f: 783.99, t: 0.45, d: 0.5, type: 'square', g: 0.12 },
    { f: 1046.5, t: 0.45, d: 0.5, type: 'triangle', g: 0.25 },
  ],
  locked: [
    { f: 300, t: 0, d: 0.1, type: 'triangle', g: 0.25 },
    { f: 260, t: 0.1, d: 0.14, type: 'triangle', g: 0.25 },
  ],
  hint: [
    { f: 988, t: 0, d: 0.12, type: 'sine', g: 0.25 },
    { f: 1319, t: 0.1, d: 0.12, type: 'sine', g: 0.25 },
    { f: 1760, t: 0.2, d: 0.2, type: 'sine', g: 0.2 },
  ],
}

// Весела мелодия за въртележка (тоника – доминанта), повтаря се.
const MELODY: [number, number][] = [
  [392, 1], [523.25, 1], [659.25, 1], [523.25, 1], [587.33, 1], [698.46, 1], [880, 2],
  [783.99, 1], [659.25, 1], [523.25, 1], [659.25, 1], [587.33, 1], [493.88, 1], [523.25, 2],
]
const BASS = [130.81, 196, 146.83, 196, 130.81, 196, 130.81, 196]

class SoundEngine {
  private ctx: AudioContext | null = null
  private master: GainNode | null = null
  private samples = new Map<SoundName, AudioBuffer>()
  private musicTimer: number | null = null
  private musicGain: GainNode | null = null
  enabled = true
  volume = 0.7

  private ensure(): AudioContext | null {
    if (typeof window === 'undefined') return null
    if (!this.ctx) {
      const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      if (!Ctor) return null
      this.ctx = new Ctor()
      this.master = this.ctx.createGain()
      this.master.gain.value = this.volume
      this.master.connect(this.ctx.destination)
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume()
    return this.ctx
  }

  setVolume(v: number) {
    this.volume = v
    if (this.master) this.master.gain.value = v
  }

  /** Позволява замяна на синтезиран звук с файл (напр. от професионален дизайнер). */
  async registerSample(name: SoundName, url: string) {
    const ctx = this.ensure()
    if (!ctx) return
    const data = await fetch(url).then((r) => r.arrayBuffer())
    this.samples.set(name, await ctx.decodeAudioData(data))
  }

  play(name: SoundName) {
    if (!this.enabled) return
    const ctx = this.ensure()
    if (!ctx || !this.master) return
    const sample = this.samples.get(name)
    if (sample) {
      const src = ctx.createBufferSource()
      src.buffer = sample
      src.connect(this.master)
      src.start()
      return
    }
    const now = ctx.currentTime + 0.01
    for (const n of SOUNDS[name]) this.tone(n, now, this.master)
  }

  private tone(n: Note, start: number, out: AudioNode) {
    const ctx = this.ctx!
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = n.type ?? 'sine'
    osc.frequency.setValueAtTime(n.f, start + n.t)
    if (n.slide) osc.frequency.exponentialRampToValueAtTime(n.slide, start + n.t + n.d)
    const peak = n.g ?? 0.3
    gain.gain.setValueAtTime(0.0001, start + n.t)
    gain.gain.exponentialRampToValueAtTime(peak, start + n.t + 0.015)
    gain.gain.exponentialRampToValueAtTime(0.0001, start + n.t + n.d)
    osc.connect(gain).connect(out)
    osc.start(start + n.t)
    osc.stop(start + n.t + n.d + 0.05)
  }

  startMusic() {
    if (this.musicTimer !== null) return
    const ctx = this.ensure()
    if (!ctx || !this.master) return
    this.musicGain = ctx.createGain()
    this.musicGain.gain.value = 0.22
    this.musicGain.connect(this.master)
    const beat = 0.3
    const loopLength = MELODY.reduce((a, [, d]) => a + d, 0) * beat
    let next = ctx.currentTime + 0.1
    const schedule = () => {
      if (!this.ctx || !this.musicGain) return
      while (next < this.ctx.currentTime + 1.5) {
        let t = 0
        for (const [f, d] of MELODY) {
          this.tone({ f, t, d: d * beat * 0.9, type: 'triangle', g: 0.18 }, next, this.musicGain)
          t += d * beat
        }
        BASS.forEach((f, i) => this.tone({ f, t: i * beat * 2, d: beat * 1.6, type: 'sine', g: 0.2 }, next, this.musicGain!))
        next += loopLength
      }
    }
    schedule()
    this.musicTimer = window.setInterval(schedule, 500)
  }

  stopMusic() {
    if (this.musicTimer !== null) window.clearInterval(this.musicTimer)
    this.musicTimer = null
    if (this.musicGain && this.ctx) {
      const g = this.musicGain
      g.gain.setTargetAtTime(0, this.ctx.currentTime, 0.1)
      window.setTimeout(() => g.disconnect(), 600)
    }
    this.musicGain = null
  }
}

export const sound = new SoundEngine()
