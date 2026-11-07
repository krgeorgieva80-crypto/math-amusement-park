import { beforeEach, describe, expect, it } from 'vitest'
import { PASSPORT_PAGES, markPassportSeen, passportFor, passportNews } from './passport'
import type { GameResult } from './storage'
import { ATTRACTIONS } from '../attractions/registry'

const rec = (game: string, mode: string | undefined, grade: 2 | 3 | 4 = 3, solved = 5, total = 5): GameResult => ({ id: Math.random().toString(36), date: '2026-11-07T10:00:00.000Z', game, mode, grade, difficulty: 'explorer', total, solved, firstTry: solved, stars: solved * 3, maxStars: total * 3, durationSec: 60 })
const WHEEL = ['Колелото: Открий равните групи', 'Колелото: Завърти колелото', 'Колелото: Попълни таблицата', 'Колелото: Предизвикателството']

beforeEach(() => {
  const store = new Map<string, string>()
  ;(globalThis as unknown as { window: unknown }).window = { localStorage: { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => void store.set(k, v) } }
})

describe('страниците на паспорта', () => {
  it('само разработените атракции, всяка със своите игри', () => {
    const ready = ATTRACTIONS.filter((a) => a.status === 'ready').map((a) => a.id).sort()
    expect(PASSPORT_PAGES.map((p) => p.attraction).sort()).toEqual(ready)
    expect(PASSPORT_PAGES.map((p) => p.games.length)).toEqual([4, 4, 4])
    expect(new Set(PASSPORT_PAGES.flatMap((p) => p.games.map((g) => g.key))).size).toBe(12)
  })
})

describe('изчисляване от резултатите', () => {
  it('разпознава всички варианти на имената на режимите', () => {
    const r = [
      rec('magic-tokens', 'Състави числото: разряди'),
      rec('magic-tokens', 'Събиране (само пресмятане)'),
      rec('magic-tokens', 'Изваждане (жетони и пресмятане)'),
      rec('magic-tokens', 'Предизвикателство: смесени'),
      rec('multiplication-wheel', 'Колелото: Попълни таблицата — Грешки'),
    ]
    const s = passportFor(r, 3)
    expect(s.pages[0].done).toEqual(['mt-compose', 'mt-add', 'mt-subtract', 'mt-challenge'])
    expect(s.pages[0].stamped).toBe(true)
    expect(s.pages[1].done).toEqual(['mw-table'])
    expect(s.stamps).toBe(1)
    expect(s.games).toBe(5)
    expect(s.totalGames).toBe(12)
  })

  it('старите записи без режим са „С различни жетони“ (Състави числото)', () => {
    expect(passportFor([rec('magic-tokens', undefined)], 3).pages[0].done).toEqual(['mt-compose'])
  })

  it('печат — само когато всички игри на атракцията са завършени', () => {
    const three = WHEEL.slice(0, 3).map((m) => rec('multiplication-wheel', m))
    expect(passportFor(three, 3).pages[1].stamped).toBe(false)
    expect(passportFor([...three, rec('multiplication-wheel', WHEEL[3])], 3).pages[1].stamped).toBe(true)
  })

  it('отделно за всеки клас; без смесване между атракции', () => {
    const r = WHEEL.map((m) => rec('multiplication-wheel', m, 2))
    expect(passportFor(r, 2).pages[1].stamped).toBe(true)
    expect(passportFor(r, 3).games).toBe(0)
    expect(passportFor(r, 4).games).toBe(0)
    // „Предизвикателство“ на жетоните не е „Предизвикателството“ на колелото
    expect(passportFor([rec('magic-tokens', 'Предизвикателство: смесени')], 3).pages[1].done).toEqual([])
    expect(passportFor([rec('multiplication-wheel', 'Колелото: Предизвикателството')], 3).pages[0].done).toEqual([])
  })

  it('незавършена игра не дава отметка; повторните игри не дублират', () => {
    expect(passportFor([rec('multiplication-wheel', WHEEL[0], 3, 3, 5)], 3).games).toBe(0)
    const many = Array.from({ length: 6 }, () => rec('multiplication-wheel', WHEEL[0]))
    expect(passportFor(many, 3).games).toBe(1)
  })
})

describe('„Нов печат“ — веднъж', () => {
  it('новото се показва веднъж за класа', () => {
    const r = WHEEL.map((m) => rec('multiplication-wheel', m))
    const s = passportFor(r, 3)
    expect(passportNews(s).stamps.map((p) => p.attraction)).toEqual(['multiplication-wheel'])
    expect(passportNews(s).games).toHaveLength(4)
    markPassportSeen(s)
    expect(passportNews(s)).toEqual({ games: [], stamps: [] })
    // друг клас — свое видяно
    expect(passportNews(passportFor(WHEEL.map((m) => rec('multiplication-wheel', m, 4)), 4)).stamps).toHaveLength(1)
  })

  it('след изтриване на резултатите видяното се подрязва и новото пак се показва', () => {
    const r = WHEEL.map((m) => rec('multiplication-wheel', m))
    markPassportSeen(passportFor(r, 3))
    markPassportSeen(passportFor([], 3))
    expect(passportNews(passportFor(r, 3)).stamps).toHaveLength(1)
  })
})

describe('Кулата на числата в паспорта', () => {
  const TOWER = ['Кулата: Построй кулата', 'Кулата: Тайните етажи', 'Кулата: Числовият асансьор', 'Кулата: Върхът на кулата']
  it('„Построй кулата“ отбелязва една игра, но печатът „Пазител на числата“ е след четирите', () => {
    const one = passportFor([rec("number-tower", TOWER[0], 2)], 2)
    const page = one.pages.find((p) => p.page.attraction === 'number-tower')!
    expect(page.done).toEqual(['nt-build'])
    expect(page.stamped).toBe(false)
    const all = passportFor(TOWER.map((m) => rec('number-tower', m, 2)), 2).pages.find((p) => p.page.attraction === 'number-tower')!
    expect(all.stamped).toBe(true)
    expect(all.page.motto).toBe('Пазител на числата')
    // друг клас и други атракции не се засягат
    expect(passportFor(TOWER.map((m) => rec('number-tower', m, 2)), 3).stamps).toBe(0)
    expect(passportFor([rec('multiplication-wheel', TOWER[0])], 2).games).toBe(0)
  })
})
