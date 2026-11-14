/**
 * Гласови инструкции за предучилищния модул — САМО предварително записани аудиофайлове.
 *
 * Синтезиран глас не се използва: ако за фраза няма запис, инструкцията се показва като текст
 * (с илюстрация), а бутонът за повторно прослушване не се появява.
 *
 * Записите са в public/audio/kg/bg/. Списъкът с наличните файлове е в manifest.json:
 *   { "files": { "<идентификатор на фраза>": "<име на файл>.mp3", ... } }
 * Пълният списък с фрази за записване се получава от `allPhrases()` (вж. RECORDING.md).
 *
 * Един канал: всяка нова фраза спира предишната — инструкциите никога не звучат едновременно.
 */

export interface Phrase {
  id: string
  text: string
}

export interface Manifest {
  files: Record<string, string>
}

/** Минимален интерфейс на аудио елемента (за тестове). */
export interface AudioLike {
  src: string
  volume: number
  currentTime: number
  play(): Promise<void> | void
  pause(): void
  onended: (() => void) | null
  onerror: (() => void) | null
}

type Listener = (playing: string | null) => void

export class VoicePlayer {
  private manifest: Manifest = { files: {} }
  private audio: AudioLike | null = null
  private current: string | null = null
  private listeners = new Set<Listener>()
  enabled = true
  volume = 0.9
  private makeAudio: () => AudioLike
  private base: string

  constructor(base: string, makeAudio?: () => AudioLike) {
    this.base = base.endsWith('/') ? base : base + '/'
    this.makeAudio = makeAudio ?? (() => new Audio() as unknown as AudioLike)
  }

  setManifest(m: Manifest) {
    this.manifest = { files: { ...(m?.files ?? {}) } }
  }

  async load(fetcher: (url: string) => Promise<Manifest | null> = defaultFetch): Promise<void> {
    try {
      const m = await fetcher(this.base + 'manifest.json')
      if (m) this.setManifest(m)
    } catch {
      // няма записи — остават текстовите инструкции
    }
  }

  /** Има ли запис за фразата. */
  has(id: string): boolean {
    return Boolean(this.manifest.files[id])
  }

  /** Брой налични записи. */
  get recorded(): number {
    return Object.keys(this.manifest.files).length
  }

  get playing(): string | null {
    return this.current
  }

  subscribe(fn: Listener): () => void {
    this.listeners.add(fn)
    return () => this.listeners.delete(fn)
  }

  private emit() {
    for (const fn of this.listeners) fn(this.current)
  }

  /** Пуска фразата, като спира предходната. Връща false, ако няма запис или гласът е изключен. */
  say(id: string): boolean {
    this.stop()
    if (!this.enabled || !this.has(id)) return false
    const a = this.audio ?? (this.audio = this.makeAudio())
    a.src = this.base + this.manifest.files[id]
    a.volume = this.volume
    a.currentTime = 0
    this.current = id
    a.onended = () => {
      if (this.current === id) {
        this.current = null
        this.emit()
      }
    }
    a.onerror = a.onended
    this.emit()
    try {
      const r = a.play()
      if (r && typeof (r as Promise<void>).catch === 'function') (r as Promise<void>).catch(() => a.onended?.())
    } catch {
      a.onended?.()
    }
    return true
  }

  /**
   * Няколко фрази една след друга (само записаните). Каналът остава един:
   * нова фраза или stop() прекъсват цялата поредица.
   */
  sayAll(ids: string[]): boolean {
    const list = ids.filter((id) => this.has(id))
    if (!this.enabled || !list.length) {
      this.stop()
      return false
    }
    const [first, ...rest] = list
    const ok = this.say(first)
    if (ok && rest.length && this.audio) {
      const end = this.audio.onended
      this.audio.onended = () => {
        end?.()
        if (this.current === null) this.sayAll(rest)
      }
      this.audio.onerror = this.audio.onended
    }
    return ok
  }

  stop(): void {
    if (this.audio) {
      this.audio.pause()
      this.audio.onended = null
      this.audio.onerror = null
    }
    if (this.current !== null) {
      this.current = null
      this.emit()
    }
  }
}

async function defaultFetch(url: string): Promise<Manifest | null> {
  const r = await fetch(url, { cache: 'no-cache' })
  if (!r.ok) return null
  return (await r.json()) as Manifest
}

/** Общият плейър за приложението. */
export const voice = new VoicePlayer(`${typeof import.meta !== 'undefined' ? (import.meta.env?.BASE_URL ?? '/') : '/'}audio/kg/bg/`)
