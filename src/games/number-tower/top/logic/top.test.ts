import { describe, expect, it } from 'vitest'
import type { Difficulty, Grade } from '../../../magic-tokens/logic'
import { RANGE_MAX } from '../../build/logic'
import { SKIP_AFTER, starsTop } from './common'
import { TOP_KEY, clearTop, loadTop, saveTop } from './persist'
import { atTop, canSkip, hallOf, newSession, summary, topReducer, type TopAction, type TopSession } from './session'
import { STAIRS_KINDS, checkStairs, generateStairs, stairsSteps, validateStairs, type StairsTask } from './stairs'

const seeded = (seed: number) => () => {
  seed |= 0
  seed = (seed + 0x6d2b79f5) | 0
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}
const GRADES: Grade[] = [2, 3, 4]
const LEVELS: Difficulty[] = ['explorer', 'researcher', 'master']
const TABLES: Record<Grade, number[][]> = { 2: [[2]], 3: [[2, 3, 4, 5, 6, 7, 8, 9, 10], [3, 4]], 4: [[2, 3, 4, 5, 6, 7, 8, 9, 10], [6, 7, 8, 9]] }

/** Решение на задача (поставяне на верните плочки / избор на сгреденото стъпало). */
const solve = (t: StairsTask) => (t.kind === 'wrong' ? checkStairs(t, [], t.answer[0]) : checkStairs(t, t.answer, null))

describe.each(GRADES)('Зала 1 „Стълбата на числата“ — %i. клас', (grade) => {
  describe.each(LEVELS)('ниво %s', (difficulty) => {
    for (const tables of TABLES[grade]) {
      const o = { grade, difficulty, tables }
      const halls = Array.from({ length: 60 }, (_, s) => generateStairs(o, seeded(s * 131 + grade * 7 + difficulty.length + tables.length)))
      const tasks = halls.flat()

      it(`четири задачи, по една от всеки вид (таблици ${tables.join(',')})`, () => {
        for (const h of halls) {
          expect(h).toHaveLength(4)
          expect([...h.map((t) => t.kind)].sort()).toEqual([...STAIRS_KINDS].sort())
          expect(new Set(h.map((t) => t.steps.join() + '|' + t.bank.join())).size).toBe(4)
        }
      })

      it('всяка задача е валидна, в обхвата, с точно едно решение', () => {
        for (const t of tasks) {
          expect(validateStairs(t, grade)).toBe(true)
          for (const v of [...t.steps, ...t.bank]) if (v !== null) expect(v >= 0 && v <= RANGE_MAX[grade]).toBe(true)
          expect(solve(t)).toBe('correct')
        }
      })

      it('стъпките на редиците са от учебното съдържание (вкл. изучените таблици)', () => {
        const allowed = stairsSteps(o)
        for (const t of tasks.filter((x) => x.kind !== 'order')) {
          // пълната редица (с поставените отговори), без сгрешеното стъпало
          let e = 0
          const full = t.steps.map((v) => (v === null ? t.answer[e++] : v))
          const known = full.map((v, k) => [k, v] as const).filter(([k]) => t.kind !== 'wrong' || k !== t.answer[0])
          const d = Math.abs((known[1][1] - known[0][1]) / (known[1][0] - known[0][0]))
          const vals = known
          expect(allowed).toContain(d)
          expect(vals.length).toBeGreaterThan(2)
          if (difficulty === 'researcher' && grade !== 2) expect(allowed.some((s) => tables.some((x) => s === x || s === x * 100))).toBe(true)
        }
      })

      it('грешните отговори се отхвърлят, без да се променя задачата', () => {
        for (const t of tasks.slice(0, 80)) {
          const before = JSON.stringify(t)
          if (t.kind === 'wrong') {
            const other = t.answer[0] === 1 ? 2 : 1
            expect(checkStairs(t, [], other)).toBe('wrong')
            expect(checkStairs(t, [], null)).toBe('incomplete')
          } else {
            const swapped = t.answer.length > 1 ? [...t.answer].reverse() : [t.bank.find((b) => b !== t.answer[0])!]
            expect(checkStairs(t, swapped, null)).toBe('wrong')
            expect(checkStairs(t, t.answer.map(() => null), null)).toBe('incomplete')
          }
          expect(JSON.stringify(t)).toBe(before)
        }
      })

      it('грешните плочки са убедителни: същият брой цифри или близо до верните', () => {
        for (const t of tasks.filter((x) => x.kind === 'fill' || x.kind === 'continue'))
          for (const b of t.bank.filter((v) => !t.answer.includes(v))) {
            const full = t.steps.filter((x): x is number => x !== null)
            const step = Math.abs(full[1] - full[0])
            // близо до верен отговор: ±1, ±10, ±1–2 стъпки или размяна на цифрите (същият брой цифри)
            expect(t.answer.some((a) => String(a).length === String(b).length || Math.abs(a - b) <= Math.max(10, 2 * step))).toBe(true)
          }
      })

      it('подсказката не съдържа отговора', () => {
        for (const t of tasks) for (const a of t.kind === 'wrong' ? [] : t.answer) expect(t.hint).not.toMatch(new RegExp(`(^|\\D)${a}(\\D|$)`))
      })
    }
  })
})

describe('звезди: 3 / 2 / 1 / 0', () => {
  it('по правилата на приключението', () => {
    expect(starsTop(0, false, false)).toBe(3)
    expect(starsTop(1, false, false)).toBe(2)
    expect(starsTop(2, false, false)).toBe(1)
    expect(starsTop(5, false, false)).toBe(1)
    expect(starsTop(0, true, false)).toBe(1)
    expect(starsTop(3, false, true)).toBe(0)
  })
})

describe('ходът на приключението', () => {
  const tasks = Array.from({ length: 3 }, (_, h) => generateStairs({ grade: 3, difficulty: 'researcher', tables: [3, 4] }, seeded(h + 1))).flat() // 12 задачи
  const run = (s: TopSession, ...acts: TopAction[]) => acts.reduce(topReducer, s)
  const ok: TopAction[] = [{ type: 'check', correct: true }, { type: 'next' }]

  it('изкачване → зала → 4 задачи → ключ → изкачване … → край; 3 ключа, 36 звезди', () => {
    let s = newSession(3, 'researcher', tasks, 0)
    expect(s.phase).toBe('climb')
    for (let h = 0; h < 3; h++) {
      s = run(s, { type: 'enter' })
      expect(s.phase).toBe('hall')
      expect(hallOf(s.index)).toBe(h)
      for (let k = 0; k < 4; k++) s = run(s, ...ok)
      expect(s.phase).toBe('key')
      expect(s.keys).toBe(h + 1)
      s = run(s, { type: 'climb' })
    }
    // на върха: съкровището се отваря с „finish“ (влизане в зала вече няма)
    expect(s.phase).toBe('climb')
    expect(atTop(s)).toBe(true)
    expect(run(s, { type: 'enter' }).phase).toBe('climb')
    s = run(s, { type: 'finish' })
    expect(s.phase).toBe('done')
    expect(summary(s)).toMatchObject({ total: 12, solved: 12, firstTry: 12, stars: 36, maxStars: 36, keys: 3, hints: 0 })
  })

  it('повторни опити и подсказка: 2, 1 и 1 звезда; задачата не се сменя', () => {
    let s = run(newSession(2, 'explorer', tasks, 0), { type: 'enter' })
    const t0 = s.tasks[s.index]
    s = run(s, { type: 'check', correct: false })
    expect(s.tasks[s.index]).toBe(t0)
    s = run(s, ...ok)
    expect(s.results[0]).toMatchObject({ stars: 2, solved: true, firstTry: false })
    s = run(s, { type: 'check', correct: false }, { type: 'check', correct: false }, ...ok)
    expect(s.results[1].stars).toBe(1)
    s = run(s, { type: 'hint' }, { type: 'hint' }, ...ok)
    expect(s.results[2]).toMatchObject({ stars: 1, usedHint: true })
    expect(s.hintsUsed).toBe(1)
  })

  it('„Продължи нататък“ — само след 3 неуспешни опита; 0 звезди, нерешена', () => {
    let s = run(newSession(4, 'master', tasks, 0), { type: 'enter' })
    for (let k = 0; k < SKIP_AFTER - 1; k++) s = run(s, { type: 'check', correct: false })
    expect(canSkip(s)).toBe(false)
    expect(run(s, { type: 'skip' })).toBe(s)
    s = run(s, { type: 'check', correct: false })
    expect(canSkip(s)).toBe(true)
    s = run(s, { type: 'skip' })
    expect(s.results[0]).toMatchObject({ stars: 0, solved: false, firstTry: false })
    expect(s.phase).toBe('solved')
  })

  it('време: от началото до последното отчитане', () => {
    const s = run(newSession(2, 'explorer', tasks, 1000), { type: 'tick', now: 61_000 })
    expect(summary(s).durationSec).toBe(60)
  })
})

describe('запазване и възстановяване', () => {
  const mem = () => {
    const m = new Map<string, string>()
    return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v), removeItem: (k: string) => void m.delete(k), m }
  }
  const tasks = generateStairs({ grade: 2, difficulty: 'explorer', tables: [2] }, seeded(5))

  it('запис → четене: същата задача, етап, резултати и време', () => {
    const st = mem()
    let s = topReducer(newSession(2, 'explorer', tasks, 0), { type: 'enter' })
    s = [{ type: 'check', correct: false }, { type: 'check', correct: true }, { type: 'next' }, { type: 'tick', now: 42_000 }].reduce((a, x) => topReducer(a, x as TopAction), s)
    saveTop(s, st)
    const back = loadTop(2, 'explorer', st)!
    expect(back.index).toBe(1)
    expect(back.phase).toBe('hall')
    expect(back.results).toEqual(s.results)
    expect(back.tasks[1]).toEqual(tasks[1])
    expect(back.elapsedMs).toBe(42_000)
  })

  it('друг клас/ниво, повреден или завършен запис — не се възстановява', () => {
    const st = mem()
    saveTop(topReducer(newSession(2, 'explorer', tasks, 0), { type: 'enter' }), st)
    expect(loadTop(3, 'explorer', st)).toBeNull()
    expect(loadTop(2, 'master', st)).toBeNull()
    st.setItem(TOP_KEY, '{oops')
    expect(loadTop(2, 'explorer', st)).toBeNull()
    saveTop({ ...newSession(2, 'explorer', tasks, 0), phase: 'done' }, st)
    expect(loadTop(2, 'explorer', st)).toBeNull()
    // на върха (преди съкровището) — възстановява се
    saveTop({ ...newSession(2, 'explorer', tasks, 0), phase: 'climb', index: tasks.length }, st)
    expect(loadTop(2, 'explorer', st)?.index).toBe(tasks.length)
    clearTop(st)
    expect(st.m.has(TOP_KEY)).toBe(false)
  })
})
