import { describe, expect, it } from 'vitest'
import type { Difficulty, Grade } from '../../magic-tokens/logic'
import { RANGE_MAX, fmt } from '../build/logic'
import { FIND_PLACES, HELP, LEVEL_KINDS, generateLiftTasks, initialLiftState, liftHint, liftReducer, routeValues, type LiftAction, type LiftTask } from './logic'

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

    it('„Намери етажа“: даден е стартът и придвижването, целта не се показва; отговорът е математически верен', () => {
      for (const t of tasks.filter((x) => x.kind === 'find')) {
        expect(t.mode).toBe('keypad')
        expect(t.answer).not.toBe(t.start)
        const steps = t.steps!
        // придвижването: разредите на класа и нивото, една посока
        for (const st of steps) expect(FIND_PLACES[grade][d]).toContain(st.place)
        expect(new Set(steps.map((x) => Math.sign(x.count))).size).toBe(1)
        expect(t.answer).toBe(t.start! + steps.reduce((a, x) => a + x.place * x.count, 0))
        // в условието: стартът и придвижването, но не и целта
        expect(t.question).toContain(`етаж ${fmt(t.start!)}`)
        expect(t.question).toMatch(/^Асансьорът е на етаж .+\. (Качи се|Слез) с .+ етажа?( \(.+\))?\. На кой етаж ще пристигнеш\?$/)
        const total = Math.abs(t.answer - t.start!)
        expect(t.question).toContain(fmt(total))
        // целта не е изписана (освен ако случайно съвпада с числото на придвижването или с броя на разредна единица)
        const given = [total, ...steps.map((x) => Math.abs(x.count))]
        if (!given.includes(t.answer)) expect(mentions(t.question.replace(`етаж ${fmt(t.start!)}`, ''), t.answer)).toBe(false)
        if (d === 'explorer') {
          expect(steps).toHaveLength(1)
          expect(Math.abs(steps[0].count)).toBeLessThanOrEqual(5)
          // без преминаване през разред
          const digit = Math.floor(t.start! / steps[0].place) % 10
          expect(digit + steps[0].count).toBeGreaterThanOrEqual(0)
          expect(digit + steps[0].count).toBeLessThanOrEqual(9)
        }
        if (d === 'researcher') expect(steps).toHaveLength(1)
        if (d === 'master') {
          expect(steps).toHaveLength(2)
          expect(steps[0].place).not.toBe(steps[1].place)
        }
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
        const h = liftHint(t, HELP[d] === 'visual' ? 'visual' : 'limited').replace(/с 1 по-|мине 9|по-малка от 0/g, '')
        // числата от условието (старт, придвижване, брой) могат случайно да съвпаднат с отговора
        const allowed = [t.start, ...(t.options ?? []), ...(t.kind === 'find' ? [Math.abs(t.answer - t.start!), ...t.steps!.map((x) => Math.abs(x.count))] : [])].filter((v) => v !== t.answer)
        if (!allowed.includes(t.answer) && !(t.kind === 'find' && [Math.abs(t.answer - t.start!), ...t.steps!.map((x) => Math.abs(x.count))].includes(t.answer))) expect(mentions(h, t.answer)).toBe(false)
      }
    })

    it('всяка задача може да бъде решена; серия от 10 задачи завършва', () => {
      for (const g of games.slice(0, 15)) {
        const ts = g.slice(0, 10)
        const r = liftReducer(ts, grade)
        let s = initialLiftState(ts)
        for (let k = 0; k < 10; k++) {
          const t = ts[s.index]
          const acts: LiftAction[] = t.mode === 'choose' ? [{ type: 'choose', value: t.answer }] : [...String(t.answer)].map((key) => ({ type: 'key', key }))
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
  // примерът от прегледа: „Асансьорът е на етаж 12. Слез с 2 етажа.“
  const d: LiftTask = { id: 2, kind: 'find', mission: 1, mode: 'keypad', start: 12, answer: 10, steps: [{ place: 1, count: -2 }], question: '' }
  const keys = (v: string): LiftAction[] => [...v].map((key) => ({ type: 'key', key }))
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
  it('„Намери етажа“: преди проверката и при грешка асансьорът остава на старта; при верен отговор отива на етажа', () => {
    const r = liftReducer([d], 2)
    let s = keys('14').reduce(r, initialLiftState([d]))
    expect(s.pos).toBe(12) // въвеждането не мести асансьора
    s = r(s, { type: 'check' })
    expect(s.solved).toBe(false)
    expect(s.pos).toBe(12) // грешен отговор — остава на място
    expect(s.mistakes).toBe(1)
    expect(s.message?.kind).toBe('wrong')
    expect(s.message?.text).not.toMatch(/(^|\D)10(\D|$)/) // без отговора
    // поправка преди проверка
    s = [{ type: 'key', key: 'clear' } as LiftAction, ...keys('10'), { type: 'check' } as LiftAction].reduce(r, s)
    expect(s.solved).toBe(true)
    expect(s.pos).toBe(10)
    expect(s.stars).toBe(2)
  })
  it('„Намери етажа“: корекция (изтриване) преди първата проверка не брои грешка', () => {
    const r = liftReducer([d], 2)
    const s = [...keys('9'), { type: 'key', key: 'back' } as LiftAction, ...keys('10'), { type: 'check' } as LiftAction].reduce(r, initialLiftState([d]))
    expect(s.solved).toBe(true)
    expect(s.stars).toBe(3)
  })
  it('след решаване нищо не скрива похвалата', () => {
    const r = liftReducer([d], 2)
    let s = [...keys('10'), { type: 'check' } as LiftAction].reduce(r, initialLiftState([d]))
    s = [...keys('5'), { type: 'check' } as LiftAction, { type: 'hint' } as LiftAction].reduce(r, s)
    expect(s.solved).toBe(true)
    expect(s.pos).toBe(10)
  })
})
