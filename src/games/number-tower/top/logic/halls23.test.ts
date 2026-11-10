import { describe, expect, it } from 'vitest'
import type { Difficulty, Grade } from '../../../magic-tokens/logic'
import { RANGE_MAX } from '../../build/logic'
import { makeExpr, validExpr, wrongs } from './arith'
import { BRIDGE_KINDS, checkBridge, evalText, generateBridge, validateBridge } from './bridge'
import { generateSky, checkSky, SKY_KINDS, validateSky } from './sky'
import { generateStairs } from './stairs'
import { newSession, summary, topReducer, type TopAction } from './session'

const seeded = (seed: number) => () => {
  seed |= 0
  seed = (seed + 0x6d2b79f5) | 0
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}
const GRADES: Grade[] = [2, 3, 4]
const LEVELS: Difficulty[] = ['explorer', 'researcher', 'master']
const TABLES: Record<Grade, number[][]> = {
  2: [[2]],
  3: [
    [2, 3, 4, 5, 6, 7, 8, 9, 10],
    [3, 4],
  ],
  4: [
    [2, 3, 4, 5, 6, 7, 8, 9, 10],
    [6, 7],
  ],
}
const num = (s: string) => Number(s.replace(/\D/g, ''))
/** Множителите/делителите в израз (числата до · и :). */
const factors = (t: string) => [...t.replace(/ /g, '').matchAll(/(\d+) ([·:]) (\d+)/g)].map((m) => (m[2] === '·' ? [+m[1], +m[3]] : [+m[3]]))

describe.each(GRADES)('%i. клас', (grade) => {
  describe.each(LEVELS)('ниво %s', (difficulty) => {
    for (const tables of TABLES[grade]) {
      const o = { grade, difficulty, tables }
      const label = `таблици ${tables.join(',')}`

      it(`изрази: в обхвата, без отрицателни и дробни; действия според класа (${label})`, () => {
        for (let s = 0; s < 300; s++) {
          const e = makeExpr(o, seeded(s + grade * 1000 + difficulty.length))
          expect(validExpr(e, grade)).toBe(true)
          expect(evalText(e.text)).toBe(e.value)
          if (grade === 2) expect(e.text).not.toMatch(/[·:]/)
          // умножение: единият множител е от изучените таблици; деление: делителят е от тях
          else for (const f of factors(e.text)) expect(f.some((x) => tables.includes(x))).toBe(true)
          const w = wrongs(e.value, grade, seeded(s))
          expect(new Set(w).size).toBe(w.length)
          expect(w).not.toContain(e.value)
        }
      })

      const bridges = Array.from({ length: 50 }, (_, s) => generateBridge(o, seeded(s * 97 + grade + tables.length)))
      it(`Мостът: 4 задачи (по една от вид), точно един верен избор (${label})`, () => {
        for (const h of bridges) {
          expect([...h.map((t) => t.kind)].sort()).toEqual([...BRIDGE_KINDS].sort())
          for (const t of h) {
            expect(validateBridge(t, grade)).toBe(true)
            expect(checkBridge(t, t.answer)).toBe('correct')
            expect(t.options.filter((_, i) => checkBridge(t, i) === 'correct')).toHaveLength(1)
            if (t.kind === 'calc') {
              const v = evalText(t.question.replace(' = ?', ''))
              expect(t.options.filter((x) => num(x) === v)).toHaveLength(1)
              expect(num(t.options[t.answer])).toBe(v)
            }
            if (t.kind === 'compare') {
              const [l, r] = t.question.split('  ?  ')
              const lv = evalText(l)
              const rv = num(r)
              expect(t.options[t.answer]).toBe(lv < rv ? '<' : lv > rv ? '>' : '=')
            }
            if (t.kind === 'error') expect(t.options.filter((x) => evalText(x.split(' = ')[0]) !== num(x.split(' = ')[1]))).toHaveLength(1)
            if (t.kind === 'riddle' && /умножа/.test(t.question)) {
              const m = t.question.match(/по (\d+), получавам (\d+)/)!
              expect(num(t.options[t.answer]) * +m[1]).toBe(+m[2])
              expect(tables).toContain(+m[1])
            }
            if (grade === 2) expect(t.question + t.options.join()).not.toMatch(/[·:]/)
            for (const x of t.options) if (/^\d/.test(x)) expect(num(x.split(' = ').pop()!)).toBeLessThanOrEqual(RANGE_MAX[grade])
          }
          expect(new Set(h.map((t) => t.question)).size).toBe(4)
        }
      })

      it(`Мостът: верният отговор е на различни позиции (разбъркване) (${label})`, () => {
        const pos = new Set(
          bridges
            .flat()
            .filter((t) => t.kind !== 'compare')
            .map((t) => t.answer),
        )
        expect(pos.size).toBe(4)
      })

      const skies = Array.from({ length: 50 }, (_, s) => generateSky(o, seeded(s * 61 + grade * 3 + tables.length)))
      it(`Обсерваторията: 4 задачи (по една от вид), еднозначни отговори (${label})`, () => {
        for (const h of skies) {
          expect([...h.map((t) => t.kind)].sort()).toEqual([...SKY_KINDS].sort())
          for (const t of h) {
            expect(validateSky(t, grade)).toBe(true)
            if (t.mode === 'order') {
              expect(checkSky(t, t.order!, null)).toBe('correct')
              expect(checkSky(t, [...t.order!].reverse(), null)).toBe('wrong')
              expect(checkSky(t, t.order!.slice(0, 2), null)).toBe('incomplete')
              if (difficulty !== 'explorer') t.stars!.forEach((s, i) => expect(evalText(s)).toBe(t.values![i]))
            } else {
              expect(checkSky(t, [], t.answer)).toBe('correct')
              expect(checkSky(t, [], t.answer + 1)).toBe('wrong')
              expect(checkSky(t, [], null)).toBe('incomplete')
              expect(t.answer >= 0 && t.answer <= RANGE_MAX[grade]).toBe(true)
            }
            if (t.kind === 'puzzle') {
              // точно едно решение в целия обхват на класа (не само в интервала)
              const m = t.conditions![0].match(/между ([\d ]+) и ([\d ]+)/)!
              const [lo, hi] = [num(m[1]), num(m[2])]
              const tests = t.conditions!.slice(1).map((c) => {
                const ds = (x: number) => String(x).split('').map(Number)
                if (c === 'Числото е четно.') return (x: number) => x % 2 === 0
                if (c === 'Числото е нечетно.') return (x: number) => x % 2 === 1
                let mm = c.match(/единиците е (\d)\./)
                if (mm) return (x: number) => x % 10 === +mm![1]
                mm = c.match(/Сборът от цифрите му е (\d+)/)
                if (mm) return (x: number) => ds(x).reduce((a, b) => a + b, 0) === +mm![1]
                mm = c.match(/дели на (\d+)/)
                if (mm) return (x: number) => x % +mm![1] === 0
                if (/единиците е по-голяма/.test(c)) return (x: number) => x % 10 > Math.floor(x / 10) % 10
                if (/десетиците е по-голяма/.test(c)) return (x: number) => x % 10 < Math.floor(x / 10) % 10
                throw new Error('непознато условие: ' + c)
              })
              const sols = []
              for (let x = lo + 1; x < hi; x++) if (tests.every((f) => f(x))) sols.push(x)
              expect(sols).toEqual([t.answer])
              expect(t.conditions!.length).toBeGreaterThanOrEqual(3)
              for (const c of t.conditions!) if (/дели на/.test(c)) expect(grade).not.toBe(2)
            }
            if (t.kind === 'pattern') for (const v of t.seq!) if (v !== null) expect(v >= 0 && v <= RANGE_MAX[grade]).toBe(true)
            if (t.kind === 'twostep') {
              expect(t.story!.length).toBeGreaterThan(20)
              if (grade === 2) expect(t.story).not.toMatch(/кутии|съзвездия/)
            }
            // подсказката не съдържа отговора
            if (t.mode === 'keypad' && t.answer > 9) expect(t.hint.replace(/\D/g, ' ')).not.toMatch(new RegExp(`(^|\\s)${t.answer}(\\s|$)`))
          }
        }
      })
    }
  })
})

describe('цялото приключение: 12 задачи, 3 зали, 3 ключа, до 36 звезди', () => {
  it('всеки клас и ниво — 12 различни валидни задачи; минаване през трите зали', () => {
    for (const grade of GRADES)
      for (const difficulty of LEVELS) {
        const o = { grade, difficulty, tables: TABLES[grade][0] }
        const rng = seeded(grade * 7 + difficulty.length)
        const tasks = [...generateStairs(o, rng), ...generateBridge(o, rng), ...generateSky(o, rng)]
        expect(tasks.map((t) => t.hall)).toEqual([0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2])
        let s = newSession(grade, difficulty, tasks, 0)
        const ok: TopAction[] = [{ type: 'check', correct: true }, { type: 'next' }]
        for (let h = 0; h < 3; h++) {
          s = topReducer(s, { type: 'enter' })
          for (let k = 0; k < 4; k++) s = ok.reduce(topReducer, s)
          expect(s.keys).toBe(h + 1)
          s = topReducer(s, { type: 'climb' })
        }
        s = topReducer(s, { type: 'finish' })
        expect(s.phase).toBe('done')
        expect(summary(s)).toMatchObject({ total: 12, solved: 12, stars: 36, maxStars: 36, keys: 3 })
      }
  })

  it('пропускане в зали 2 и 3: 0 звезди, приключението продължава до края', () => {
    const o = { grade: 3 as Grade, difficulty: 'master' as Difficulty, tables: [3, 4] }
    const rng = seeded(9)
    const tasks = [...generateStairs(o, rng), ...generateBridge(o, rng), ...generateSky(o, rng)]
    let s = newSession(3, 'master', tasks, 0)
    const fail: TopAction[] = [{ type: 'check', correct: false }, { type: 'check', correct: false }, { type: 'check', correct: false }, { type: 'skip' }, { type: 'next' }]
    for (let h = 0; h < 3; h++) {
      s = topReducer(s, { type: 'enter' })
      for (let k = 0; k < 4; k++) s = (h === 0 ? [{ type: 'check', correct: true } as TopAction, { type: 'next' } as TopAction] : fail).reduce(topReducer, s)
      s = topReducer(s, { type: 'climb' })
    }
    s = topReducer(s, { type: 'finish' })
    expect(summary(s)).toMatchObject({ solved: 4, stars: 12, keys: 3 })
  })
})
