import { describe, expect, it } from 'vitest'
import type { Difficulty, Grade } from '../../magic-tokens/logic'
import { RANGE_MAX, fmt } from '../build/logic'
import { HELP, SECRET_FLOORS, SECRET_HIDDEN, STEPS, checkSecret, choicesFor, generateSecretTasks, isDetermined, secretHint } from './logic'

/** Детерминиран генератор (mulberry32). */
const seeded = (seed: number) => () => {
  seed |= 0
  seed = (seed + 0x6d2b79f5) | 0
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}

const GRADES: Grade[] = [2, 3, 4]
const LEVELS: Difficulty[] = ['explorer', 'researcher', 'master']
/** Числото като отделна дума в текста (не като част от по-дълго число). */
const mentions = (text: string, v: number) => new RegExp(`(^|[^\\d ])${fmt(v)}(?!\\d| \\d)`).test(text)

describe.each(GRADES)('%i. клас', (grade) => {
  describe.each(LEVELS)('ниво %s', (d) => {
    const games = Array.from({ length: 40 }, (_, s) => generateSecretTasks(grade, d, 15, seeded(s * 7919 + grade * 31 + d.length)))
    const tasks = games.flat()

    it('числова редица с постоянна стъпка от таблицата, в обхвата на класа', () => {
      for (const t of tasks) {
        expect(t.values).toHaveLength(SECRET_FLOORS[d])
        expect(STEPS[grade][d]).toContain(t.step)
        const diff = t.direction === 'up' ? t.step : -t.step
        for (let i = 1; i < t.values.length; i++) expect(t.values[i] - t.values[i - 1]).toBe(diff)
        for (const v of t.values) {
          expect(Number.isInteger(v)).toBe(true)
          expect(v).toBeGreaterThanOrEqual(0)
          expect(v).toBeLessThanOrEqual(RANGE_MAX[grade])
        }
      }
    })

    it('тайните прозорци: брой и място по нивото; винаги два съседни видими етажа (еднозначно решение)', () => {
      for (const t of tasks) {
        expect(t.hidden).toHaveLength(SECRET_HIDDEN[d])
        expect(new Set(t.hidden).size).toBe(t.hidden.length)
        expect(isDetermined(t.values.length, t.hidden)).toBe(true)
        if (d === 'explorer') expect(t.hidden[0]).toBeGreaterThan(0)
        if (d === 'explorer') expect(t.hidden[0]).toBeLessThan(t.values.length - 1)
        if (d === 'master') expect(Math.abs(t.hidden[0] - t.hidden[1])).toBeGreaterThanOrEqual(2)
      }
    })

    it('еднозначност: всяка редица със същите видими етажи и същата стъпка дава същия отговор', () => {
      for (const t of tasks) {
        // стъпката от първата видима двойка съседи — и възстановяване на всички етажи
        let k = 0
        while (t.hidden.includes(k) || t.hidden.includes(k + 1)) k++
        const diff = t.values[k + 1] - t.values[k]
        const rebuilt = t.values.map((_, i) => t.values[k] + (i - k) * diff)
        expect(rebuilt).toEqual(t.values)
      }
    })

    it('посоката по нивото: Откривател — само растяща; другите — и двете', () => {
      const dirs = new Set(tasks.map((t) => t.direction))
      if (d === 'explorer') expect([...dirs]).toEqual(['up'])
      else expect(dirs).toEqual(new Set(['up', 'down']))
    })

    it('в една игра задачите не се повтарят', () => {
      for (const g of games) {
        const keys = g.map((t) => `${t.values.join()}|${t.hidden.join()}`)
        expect(new Set(keys).size).toBe(keys.length)
      }
    })

    it('проверката: вярно / грешно / непопълнено по прозорци', () => {
      for (const t of tasks.slice(0, 50)) {
        const right = Object.fromEntries(t.hidden.map((i) => [i, t.values[i]]))
        expect(checkSecret(t, right)).toEqual({ correct: t.hidden, wrong: [], empty: [] })
        const off = Object.fromEntries(t.hidden.map((i) => [i, t.values[i] + 1]))
        expect(checkSecret(t, off).wrong).toEqual(t.hidden)
        expect(checkSecret(t, {}).empty).toEqual(t.hidden)
      }
    })

    it('подсказката насочва към закономерността, без готовия отговор', () => {
      for (const t of tasks) {
        const level = HELP[d] === 'visual' ? 'visual' : 'limited'
        const h = secretHint(t, level)
        for (const i of t.hidden) expect(mentions(h.text, t.values[i])).toBe(false)
        // и стъпката не се казва (освен ако съвпада с някое от двете видими числа в подсказката)
        const shown = h.pair ? h.pair.map((i) => t.values[i]) : []
        if (!shown.includes(t.step)) expect(mentions(h.text, t.step)).toBe(false)
        if (h.pair) {
          const [a, b] = h.pair
          expect(b).toBe(a + 1)
          expect(t.hidden).not.toContain(a)
          expect(t.hidden).not.toContain(b)
        }
      }
    })
  })

  it('Откривател: три различни отговора, само един верен, всички в обхвата', () => {
    for (let s = 0; s < 300; s++) {
      const rng = seeded(s + grade * 1000)
      const [t] = generateSecretTasks(grade, 'explorer', 1, rng)
      const ch = choicesFor(t, grade, rng)
      expect(ch).toHaveLength(3)
      expect(new Set(ch).size).toBe(3)
      expect(ch.filter((v) => v === t.values[t.hidden[0]])).toHaveLength(1)
      for (const v of ch) {
        expect(Number.isInteger(v)).toBe(true)
        expect(v).toBeGreaterThanOrEqual(0)
        expect(v).toBeLessThanOrEqual(RANGE_MAX[grade])
      }
    }
  })
})

describe('помощ по нива', () => {
  it('визуална / една / без', () => expect(HELP).toEqual({ explorer: 'visual', researcher: 'limited', master: 'none' }))
  it('всяка стъпка се събира в обхвата на класа (етажи × стъпка)', () => {
    for (const g of GRADES) for (const d of LEVELS) for (const s of STEPS[g][d]) expect(s * (SECRET_FLOORS[d] - 1)).toBeLessThanOrEqual(RANGE_MAX[g])
  })
})
