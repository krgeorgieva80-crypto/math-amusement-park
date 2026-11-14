import { describe, expect, it } from 'vitest'
import { VoicePlayer, type AudioLike } from './voice'

function fakeAudio(log: string[]): () => AudioLike {
  return () => {
    const a: AudioLike = {
      src: '',
      volume: 1,
      currentTime: 0,
      onended: null,
      onerror: null,
      play() {
        log.push(`play ${a.src}`)
        return Promise.resolve()
      },
      pause() {
        log.push('pause')
      },
    }
    return a
  }
}

describe('Гласови инструкции (само записи)', () => {
  it('без запис не звучи нищо и няма синтезиран глас', () => {
    const log: string[] = []
    const v = new VoicePlayer('/a/', fakeAudio(log))
    expect(v.say('feed.give.big.1.apple')).toBe(false)
    expect(log.filter((l) => l.startsWith('play'))).toEqual([])
    expect(v.playing).toBeNull()
  })

  it('пуска записания файл по манифеста', () => {
    const log: string[] = []
    const v = new VoicePlayer('/a', fakeAudio(log))
    v.setManifest({ files: { hello: 'hello.mp3' } })
    expect(v.has('hello')).toBe(true)
    expect(v.recorded).toBe(1)
    expect(v.say('hello')).toBe(true)
    expect(log).toContain('play /a/hello.mp3')
    expect(v.playing).toBe('hello')
  })

  it('един канал: новата фраза спира предишната', () => {
    const log: string[] = []
    const v = new VoicePlayer('/a/', fakeAudio(log))
    v.setManifest({ files: { a: 'a.mp3', b: 'b.mp3' } })
    v.say('a')
    v.say('b')
    expect(log).toEqual(['play /a/a.mp3', 'pause', 'play /a/b.mp3'])
    expect(v.playing).toBe('b')
  })

  it('изключен глас не пуска записи', () => {
    const log: string[] = []
    const v = new VoicePlayer('/a/', fakeAudio(log))
    v.setManifest({ files: { a: 'a.mp3' } })
    v.enabled = false
    expect(v.say('a')).toBe(false)
    expect(log.filter((l) => l.startsWith('play'))).toEqual([])
  })

  it('уведомява за начало и край на фразата', () => {
    const states: (string | null)[] = []
    let audio: AudioLike | null = null
    const v = new VoicePlayer('/a/', () => (audio = fakeAudio([])()))
    v.setManifest({ files: { a: 'a.mp3' } })
    v.subscribe((s) => states.push(s))
    v.say('a')
    audio!.onended?.()
    expect(states).toEqual(['a', null])
  })

  it('поредица от фрази: една след друга, само записаните, прекъсва се от нова фраза', () => {
    const log: string[] = []
    let audio: AudioLike | null = null
    const v = new VoicePlayer('/a/', () => (audio = fakeAudio(log)()))
    v.setManifest({ files: { a: 'a.mp3', b: 'b.mp3', c: 'c.mp3' } })
    expect(v.sayAll(['a', 'missing', 'b'])).toBe(true)
    expect(v.playing).toBe('a')
    audio!.onended?.()
    expect(v.playing).toBe('b')
    expect(log.filter((l) => l.startsWith('play'))).toEqual(['play /a/a.mp3', 'play /a/b.mp3'])
    // нова фраза прекъсва поредицата
    v.sayAll(['a', 'b'])
    v.say('c')
    audio!.onended?.()
    expect(log.filter((l) => l.startsWith('play')).slice(-2)).toEqual(['play /a/a.mp3', 'play /a/c.mp3'])
    expect(v.playing).toBeNull()
    expect(v.sayAll(['missing'])).toBe(false)
  })

  it('липсващ манифест не е грешка', async () => {
    const v = new VoicePlayer('/a/', fakeAudio([]))
    await v.load(async () => null)
    expect(v.recorded).toBe(0)
    await v.load(async () => {
      throw new Error('мрежа')
    })
    expect(v.recorded).toBe(0)
  })
})
