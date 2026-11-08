import { describe, expect, it } from 'vitest'
import type { Difficulty, Grade } from '../../magic-tokens/logic'
import { RANGE_MAX, fmt } from '../build/logic'
import { HELP, LEVEL_KINDS, PLACES, generateLiftTasks, initialLiftState, liftHint, liftReducer, routeValues, type LiftAction, type LiftTask } from './logic'

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
const mentions = (text: string, v: number) => new RegExp(`(^|[^\\d ])${fmt(v)}(?!\\d| \\d)`).test(text)
const inRange = (v: number, g: Grade) => Number.isInteger(v) && v >= 0 && v <= RANGE_MAX[g]

/** Най-краткото решение на задача с управление (по разреди) — показва, че целта е достижима с бутоните. */
function driveTo(t: LiftTask): LiftAction[] {
  let diff = t.answer - (t.start ?? 0)
  const acts: LiftAction[] = []
  for (const p of [...(t.buttons ?? [])].sort((a, b) => b - a)) {
    const n = Math.trunc(diff / p)
    for (let k = 0; k < Math.abs(n); k++) acts.push({ type: 'step', place: p, dir: n > 0 ? 1 : -1 })
    diff -= n * p
  }
  expect(diff).toBe(0)
  return acts
}

describe.each(GRADES)('%i. клас', (grade) => {
  describe.each(LEVELS)('ниво %s', (d) => {
    const games = Array.from({ length: 40 }, (_, s) => generateLiftTasks(grade, d, 15, seeded(s * 7919 + grade * 17 + d.length)))
    const tasks = games.flat()

    it('мисиите се редуват според нивото', () => {
      for (const g of games) g.forEach((t, i) => expect(t.kind).toBe(LEVEL_KINDS[d][i % LEVEL_KINDS[d].length]))
    })

    it('всички начални, междинни и крайни стойности са в обхвата на класа', () => {
      for (const t of tasks) {
        expect(inRange(t.answer, grade)).toBe(true)
        if (t.start !== null) expect(inRange(t.start, grade)).toBe(true)
        if (t.steps) for (const v of routeValues(t.start!, t.steps)) expect(inRange(v, grade)).toBe(true)
        for (const o of t.options ?? []) expect(inRange(o, grade)).toBe(true)
      }
    })

    it('„Намери етажа“: целта е различна от старта и достижима с бутоните; всяка подредба остава в обхвата', () => {
      for (const t of tasks.filter((x) => x.kind === 'find')) {
        expect(t.mode).toBe('drive')
        expect(t.answer).not.toBe(t.start)
        if (d === 'explorer') {
          expect(t.buttons).toEqual([1])
          expect(Math.abs(t.answer - t.start!)).toBeLessThanOrEqual(5)
        }
        expect(t.buttons!.every((p) => PLACES[grade].includes(p))).toBe(true)
        // решението по разреди достига целта
        const r = liftReducer([t], grade)
        const s = driveTo(t).reduce(r, initialLiftState([t]))
        expect(s.pos).toBe(t.answer)
        expect(r(s, { type: 'check' }).solved).toBe(true)
      }
    })

    it('„Съседните етажи“: точно следващото / предходното число', () => {
      for (const t of tasks.filter((x) => x.kind === 'neighbor')) {
        expect(t.answer).toBe(t.start! + t.dir!)
        if (d !== 'explorer') {
          // Изследовател: преминаване през разред (…9 → …0 или …0 → …9)
          expect(t.dir === 1 ? t.answer % 10 : t.start! % 10).toBe(0)
        }
      }
    })

    it('избор: различни отговори, само един верен', () => {
      for (const t of tasks.filter((x) => x.mode === 'choose')) {
        const o = t.options!
        expect(new Set(o).size).toBe(o.length)
        expect(o.filter((v) => v === t.answer)).toHaveLength(1)
        if (t.kind === 'compare') {
          expect(o).toHaveLength(2)
          expect(t.answer).toBe(t.higher ? Math.max(...o) : Math.min(...o))
        } else expect(o).toHaveLength(3)
      }
    })

    it('„Тайният маршрут“: отговорът е резултатът от действията; Майстор — 2–3 действия в различни разреди и посоки', () => {
      for (const t of tasks.filter((x) => x.kind === 'route')) {
        const vals = routeValues(t.start!, t.steps!)
        expect(vals[vals.length - 1]).toBe(t.answer)
        expect(t.answer).not.toBe(t.start)
        expect(new Set(t.steps!.map((s) => s.place)).size).toBe(t.steps!.length)
        if (d === 'researcher') expect(t.steps).toHaveLength(1)
        if (d === 'master') {
          expect(t.steps!.length).toBeGreaterThanOrEqual(2)
          expect(new Set(t.steps!.map((s) => Math.sign(s.count))).size).toBe(2)
        }
      }
    })

    it('„Загадъчният етаж“: разредният състав или загадката дават едно-единствено число', () => {
      for (const t of tasks.filter((x) => x.kind === 'mystery')) {
        if (t.parts) {
          expect(new Set(t.parts.map((p) => p.place)).size).toBe(t.parts.length)
          for (const p of t.parts) expect(p.count).toBeGreaterThanOrEqual(1)
          for (const p of t.parts) expect(p.count).toBeLessThanOrEqual(9)
          expect(t.parts.reduce((a, p) => a + p.place * p.count, 0)).toBe(t.answer)
        } else {
          // загадка: между a и a+10, единиците са u — проверка, че само едно число отговаря
          const m = t.question.match(/между ([\d ]+) и ([\d ]+)\. Цифрата на единиците му е (\d)/)!
          const [a, b, u] = [Number(m[1].replace(/\D/g, '')), Number(m[2].replace(/\D/g, '')), Number(m[3])]
          const fits = Array.from({ length: b - a - 1 }, (_, k) => a + 1 + k).filter((v) => v % 10 === u)
          expect(fits).toEqual([t.answer])
        }
      }
    })

    it('подсказките насочват, без да казват отговора', () => {
      for (const t of tasks) {
        // „с 1 по-голямо/по-малко“ е част от правилото, не отговор
        const h = liftHint(t, HELP[d] === 'visual' ? 'visual' : 'limited').replace(/с 1 по-/g, '')
        const allowed = [t.start, ...(t.options ?? [])].filter((v) => v !== t.answer)
        if (!allowed.includes(t.answer) && t.kind !== 'find') expect(mentions(h, t.answer)).toBe(false)
      }
    })

    it('всяка задача може да бъде решена; серия от 10 задачи завършва', () => {
      for (const g of games.slice(0, 15)) {
        const ts = g.slice(0, 10)
        const r = liftReducer(ts, grade)
        let s = initialLiftState(ts)
        for (let k = 0; k < 10; k++) {
          const t = ts[s.index]
          const acts: LiftAction[] = t.mode === 'drive' ? driveTo(t) : t.mode === 'choose' ? [{ type: 'choose', value: t.answer }] : [...String(t.answer)].map((key) => ({ type: 'key', key }))
          s = [...acts, { type: 'check' } as LiftAction].reduce(r, s)
          expect(s.solved).toBe(true)
          s = r(s, { type: 'next' })
        }
        expect(s.finished).toBe(true)
        expect(s.outcomes).toHaveLength(10)
      }
    })
  })
})

describe('състояние: проверка, поправка, граници', () => {
  const t: LiftTask = { id: 1, kind: 'route', mission: 3, mode: 'keypad', start: 245, answer: 275, steps: [{ place: 10, count: 3 }], question: '' }
  const d: LiftTask = { id: 2, kind: 'find', mission: 1, mode: 'drive', start: 98, answer: 100, buttons: [1], question: '' }
  it('грешен отговор: асансьорът отива там, брои се грешка, поправката завършва', () => {
    const r = liftReducer([t], 3)
    let s = [..."265"].map((key) => ({ type: 'key', key }) as LiftAction).reduce(r, initialLiftState([t]))
    s = r(s, { type: 'check' })
    expect(s.solved).toBe(false)
    expect(s.pos).toBe(265)
    expect(s.mistakes).toBe(1)
    expect(s.message?.text).not.toMatch(/275/)
    const fix: LiftAction[] = [{ type: 'key', key: 'back' }, { type: 'key', key: 'back' }, { type: 'key', key: '7' }, { type: 'key', key: '5' }, { type: 'check' }]
    s = fix.reduce(r, s)
    expect(s.solved).toBe(true)
    expect(s.stars).toBe(2)
  })
  it('празно поле и етаж извън кулата — подсказка, без грешка', () => {
    const r = liftReducer([t], 3)
    expect(r(initialLiftState([t]), { type: 'check' }).mistakes).toBe(0)
    const s = [...'5000'].map((key) => ({ type: 'key', key }) as LiftAction).reduce(r, initialLiftState([t]))
    expect(r(s, { type: 'check' }).message?.kind).toBe('info')
  })
  it('асансьорът не излиза извън 0…максимума (2. клас: до 100)', () => {
    const r = liftReducer([d], 2)
    let s = initialLiftState([d])
    for (let k = 0; k < 5; k++) s = r(s, { type: 'step', place: 1, dir: 1 })
    expect(s.pos).toBe(100)
    expect(s.message?.kind).toBe('info')
    expect(r(s, { type: 'check' }).solved).toBe(true)
  })
  it('след решаване нищо не скрива похвалата', () => {
    const r = liftReducer([d], 2)
    const go: LiftAction[] = [{ type: 'step', place: 1, dir: 1 }, { type: 'step', place: 1, dir: 1 }, { type: 'check' }]
    const after: LiftAction[] = [{ type: 'step', place: 1, dir: -1 }, { type: 'check' }, { type: 'hint' }]
    let s = go.reduce(r, initialLiftState([d]))
    s = after.reduce(r, s)
    expect(s.solved).toBe(true)
    expect(s.pos).toBe(100)
  })
})
