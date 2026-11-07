import { describe, expect, it } from 'vitest'
import { DIFFICULTIES, seededRng } from '../../magic-tokens/logic'
import {
  checkAnswer,
  generateChallenge,
  generateDetective,
  generateMaster,
  generateMissing,
  hintFor,
  isWrongEquation,
  masterAnswer,
  missingAnswer,
  stagePlan,
  type ChallengeTask,
  type MasterTask,
  type MissingTask,
} from './logic'

const ALL = [2, 3, 4, 5, 6, 7, 8, 9, 10]
const opts = (tables: number[], zero = false) => ({ tables, zero })
const subset = (rng: () => number) => {
  const t = ALL.filter(() => rng() < 0.45)
  return t.length ? t : [ALL[Math.floor(rng() * 9)]]
}
const answerOf = (t: MissingTask | MasterTask) => (t.stage === 'missing' ? missingAnswer(t) : masterAnswer(t))

describe('разпределение по етапи', () => {
  it('5 → 2 + 2 + 1; 10 и 15 — нарастващо, финалът е най-голям', () => {
    expect(stagePlan(5)).toEqual([2, 2, 1])
    expect(stagePlan(10)).toEqual([3, 3, 4])
    expect(stagePlan(15)).toEqual([4, 5, 6])
    for (const n of [10, 15]) {
      const p = stagePlan(n)
      expect(p[0]).toBeLessThanOrEqual(p[1])
      expect(p[2]).toBeGreaterThan(p[0])
      expect(p[2]).toBe(Math.max(...p))
    }
  })

  it('серията: етапите по ред, броят е избраният, всички етапи присъстват', () => {
    for (const d of DIFFICULTIES)
      for (const n of [5, 10, 15]) {
        const s = generateChallenge(d, opts(ALL), 3, n, seededRng(n))
        expect(s).toHaveLength(n)
        const stages = s.map((t) => t.stage)
        expect(stages.join(',')).toBe([...stages].sort((a, b) => ['detective', 'missing', 'master'].indexOf(a) - ['detective', 'missing', 'master'].indexOf(b)).join(','))
        expect(new Set(stages).size).toBe(3)
        expect(s.map((t) => t.id)).toEqual(Array.from({ length: n }, (_, i) => i + 1))
      }
  })
})

describe('само изучените таблици; без двусмислени задачи', () => {
  it('всички числа са от изучените таблици, отговорът е единствен и цял', () => {
    const rng = seededRng(4)
    for (let run = 0; run < 150; run++) {
      const tables = subset(rng)
      const zero = rng() < 0.3
      for (const d of DIFFICULTIES)
        for (const t of generateChallenge(d, opts(tables, zero), tables[0], 15, rng)) {
          if (t.stage === 'detective') {
            expect(t.equations.filter(isWrongEquation)).toHaveLength(1)
            expect(isWrongEquation(t.equations[t.wrong])).toBe(true)
            for (const e of t.equations) {
              expect(tables.includes(e.a) || tables.includes(e.b)).toBe(true)
              if (!zero) expect(e.a * e.b).toBeGreaterThan(0)
            }
            expect(new Set(t.equations.map((e) => `${Math.min(e.a, e.b)}x${Math.max(e.a, e.b)}`)).size).toBe(t.equations.length)
          } else {
            const ans = answerOf(t)
            expect(Number.isInteger(ans)).toBe(true)
            expect(ans).toBeGreaterThanOrEqual(0)
            expect(ans).toBeLessThanOrEqual(100)
            if (t.stage === 'missing') {
              expect(tables).toContain(t.a)
              expect(t.b).toBeGreaterThanOrEqual(2) // без 0 · □ и 1 · □
            } else {
              expect(tables).toContain(t.a)
              if (t.kind === 'balance') {
                expect(tables).toContain(t.c)
                expect((t.a * t.b) % t.c!).toBe(0)
                expect(ans).toBeGreaterThanOrEqual(2)
                expect(ans).toBeLessThanOrEqual(10)
              }
              if (t.kind === 'think' || t.kind === 'groups') expect(t.b).toBeGreaterThanOrEqual(2)
              if (!zero) expect(t.b).not.toBe(0)
            }
            // единствен отговор: само верното число минава проверката
            let accepted = 0
            for (let v = 0; v <= 100; v++) if (checkAnswer(t, String(v)).status === 'correct') accepted++
            expect(accepted).toBe(1)
            expect(checkAnswer(t, String(ans)).status).toBe('correct')
          }
        }
    }
  })

  it('Откривател — само избраната таблица', () => {
    for (const t of generateChallenge('explorer', opts([2, 5, 7]), 5, 15, seededRng(2))) {
      if (t.stage === 'detective') expect(t.equations.every((e) => e.a === 5)).toBe(true)
      else expect(t.a).toBe(5)
    }
  })

  it('без умножение с 0, ако не е включено; с него — може да се появи', () => {
    const rng = seededRng(9)
    let zeros = 0
    for (let k = 0; k < 200; k++) {
      for (const t of generateChallenge('researcher', opts([3, 4]), 3, 15, rng)) {
        if (t.stage === 'detective') expect(t.equations.every((e) => e.a !== 0 && e.b !== 0)).toBe(true)
        else expect(t.b).not.toBe(0)
      }
      for (const t of generateChallenge('researcher', opts([3, 4], true), 3, 15, rng)) if (t.stage === 'detective') zeros += t.equations.filter((e) => e.b === 0 || e.a === 0).length
    }
    expect(zeros).toBeGreaterThan(0)
  })
})

describe('нива: липсващият множител и загадките', () => {
  it('Откривател — предимно вторият множител; по-високите нива — и първият', () => {
    const rng = seededRng(5)
    const share = (d: (typeof DIFFICULTIES)[number]) => {
      let first = 0
      for (let k = 0; k < 600; k++) if (generateMissing(d, opts(ALL), 3, rng, 1, 1).hide === 'first') first++
      return first / 600
    }
    expect(share('explorer')).toBeLessThan(0.25)
    expect(share('researcher')).toBeGreaterThan(0.35)
    expect(share('master')).toBeGreaterThan(0.35)
  })

  it('видовете задачи в етап 3 по нива', () => {
    const rng = seededRng(6)
    const kinds = { explorer: new Set<string>(), researcher: new Set<string>(), master: new Set<string>() }
    for (let k = 0; k < 300; k++) for (const d of DIFFICULTIES) kinds[d].add(generateMaster(d, opts(ALL), 3, rng, 1, null).kind)
    expect([...kinds.explorer].sort()).toEqual(['groups', 'product', 'swapped'])
    expect([...kinds.researcher].sort()).toEqual(['groups', 'product', 'swapped', 'think'])
    expect([...kinds.master].sort()).toEqual(['balance', 'groups', 'swapped', 'think'])
  })

  it('с една изучена таблица „balance“ се заменя с друга загадка', () => {
    for (let k = 0; k < 100; k++) expect(generateMaster('master', opts([4]), 4, seededRng(k), 1, null).kind).not.toBe('balance')
  })

  it('детективът: 3 равенства на Откривател, 4 на по-високите', () => {
    expect(generateDetective('explorer', opts([3]), 3, seededRng(1), 1, 0).equations).toHaveLength(3)
    expect(generateDetective('master', opts(ALL), 3, seededRng(1), 1, 0).equations).toHaveLength(4)
  })
})

describe('подсказки и повторения', () => {
  it('подсказките не съдържат отговора; на Майстор няма подсказки', () => {
    const rng = seededRng(8)
    for (let run = 0; run < 100; run++)
      for (const d of DIFFICULTIES)
        for (const t of generateChallenge(d, opts(subset(rng)), 3, 15, rng)) {
          const h = hintFor(t, d)
          if (d === 'master') expect(h).toBeNull()
          if (!h || t.stage === 'detective') continue
          const ans = answerOf(t)
          const shown = t.stage === 'missing' ? [t.a, t.b, t.a * t.b] : [t.a, t.b, t.c ?? -1, t.a * t.b]
          // отговорът не е в подсказката, освен ако е число, което вече се вижда в условието
          if (!shown.includes(ans)) expect(h).not.toMatch(new RegExp(`(^|\\D)${ans}(\\D|$)`))
        }
  })

  it('без повтарящи се задачи в серия от 15; загадките в етап 3 не се повтарят две поред', () => {
    const rng = seededRng(10)
    for (let run = 0; run < 80; run++) {
      const s = generateChallenge('researcher', opts(ALL), 3, 15, rng)
      const sig = s.map((t: ChallengeTask) => (t.stage === 'detective' ? t.equations.map((e) => `${e.a}x${e.b}`).join() : `${t.stage}:${t.a}x${t.b}:${t.stage === 'master' ? t.kind : ''}`))
      expect(new Set(sig).size).toBe(15)
      const m = s.filter((t) => t.stage === 'master') as MasterTask[]
      for (let i = 1; i < m.length; i++) expect(m[i].kind).not.toBe(m[i - 1].kind)
    }
  })
})
