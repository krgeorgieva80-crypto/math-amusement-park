import { describe, expect, it } from 'vitest'
import type { Difficulty, Grade } from '../../magic-tokens/logic'
import { FLOORS, HELP, RANGE_MAX, buildHint, checkBuild, fmt, generateBuildTask, generateBuildTasks, solution } from './logic'

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

describe.each(GRADES)('%i. клас', (grade) => {
  describe.each(LEVELS)('ниво %s', (d) => {
    const all = Array.from({ length: 40 }, (_, s) => generateBuildTasks(grade, d, 15, seeded(s * 7919 + grade * 13 + d.length)))
    const tasks = all.flat()

    it('числата са цели, различни и в обхвата на класа', () => {
      for (const t of tasks) {
        expect(t.numbers).toHaveLength(FLOORS[d])
        expect(new Set(t.numbers).size).toBe(t.numbers.length)
        for (const v of t.numbers) {
          expect(Number.isInteger(v)).toBe(true)
          expect(v).toBeGreaterThanOrEqual(0)
          expect(v).toBeLessThanOrEqual(RANGE_MAX[grade])
        }
      }
    })

    it('единствен правилен ред, който проверката приема', () => {
      for (const t of tasks) {
        const sol = solution(t)
        for (let i = 1; i < sol.length; i++) expect(t.order === 'asc' ? sol[i] > sol[i - 1] : sol[i] < sol[i - 1]).toBe(true)
        expect(checkBuild(t, sol).status).toBe('correct')
        // обратният ред е грешен (и посочва грешните етажи, без да издава верния)
        const rev = [...sol].reverse()
        const r = checkBuild(t, rev)
        expect(r.status).toBe('wrong')
        expect(r.wrong.length).toBeGreaterThan(0)
        expect(r.message).toMatch(/^(Един етаж не е|\d етажа не са) на мястото си\. Опитай отново\.$/)
      }
    })

    it('тавата не е подредена предварително', () => {
      // разбъркването е случайно — но не всички задачи могат да започват подредени
      const sortedStart = tasks.filter((t) => solution(t).every((v, i) => v === t.numbers[i])).length
      expect(sortedStart / tasks.length).toBeLessThan(0.1)
    })

    it('в една игра задачите не се повтарят', () => {
      for (const g of all) {
        const keys = g.map((t) => [...t.numbers].sort((a, b) => a - b).join())
        expect(new Set(keys).size).toBe(keys.length)
      }
    })

    it('посоката отговаря на нивото', () => {
      const orders = new Set(tasks.map((t) => t.order))
      if (d === 'explorer') expect([...orders]).toEqual(['asc'])
      else expect(orders).toEqual(new Set(['asc', 'desc']))
      if (d === 'researcher') all.forEach((g) => g.forEach((t, i) => expect(t.order).toBe(i % 2 ? 'desc' : 'asc')))
    })

    it('непълна кула не се проверява като грешна', () => {
      const t = tasks[0]
      const part: (number | null)[] = solution(t).map((v, i) => (i === 0 ? null : v))
      const r = checkBuild(t, part)
      expect(r.status).toBe('incomplete')
      expect(r.message).toBe('Остава още 1 етаж.')
    })

    it('подсказката не издава подредбата', () => {
      for (const t of tasks.slice(0, 60)) {
        const sol = solution(t)
        const h = buildHint(t, t.numbers, HELP[d] === 'visual' ? 'visual' : 'limited')
        // не изброява правилния ред и не казва кое е най-долу
        expect(h).not.toContain(sol.map(fmt).join(', '))
        expect(h).not.toMatch(/най-долу|първият етаж е/i)
        if (HELP[d] === 'visual') {
          // посочва само две от числата за сравнение
          const shown = t.numbers.filter((v) => new RegExp(`(^|[^\\d\u00a0])${fmt(v)}(?!\\d|\u00a0\\d)`).test(h))
          expect(shown.length).toBeLessThanOrEqual(2)
        }
      }
    })
  })
})

describe('нива на трудност', () => {
  it('Откривател — числата са далеч едно от друго (различен най-голям разряд/десетица)', () => {
    for (const grade of GRADES)
      for (let s = 0; s < 200; s++) {
        const sol = solution(generateBuildTask(grade, 'explorer', seeded(s + 1), 1, 0))
        const gap = Math.min(...sol.slice(1).map((v, i) => v - sol[i]))
        expect(gap).toBeGreaterThanOrEqual(RANGE_MAX[grade] / FLOORS.explorer / 5)
      }
  })

  it('Майстор — „коварни“ числа: често с едни и същи цифри', () => {
    for (const grade of GRADES) {
      let shared = 0
      for (let s = 0; s < 200; s++) {
        const t = generateBuildTask(grade, 'master', seeded(s + 5), 1, 0)
        const sig = t.numbers.map((v) => String(v).split('').sort().join(''))
        if (sig.some((x, i) => sig.indexOf(x) !== i)) shared++
      }
      expect(shared).toBeGreaterThan(120)
    }
  })

  it('Изследовател — числата са по-близки от тези на Откривател', () => {
    for (const grade of GRADES) {
      const spread = (d: Difficulty) => {
        let sum = 0
        for (let s = 0; s < 200; s++) {
          const sol = solution(generateBuildTask(grade, d, seeded(s + 9), 1, 0))
          sum += (sol[sol.length - 1] - sol[0]) / RANGE_MAX[grade]
        }
        return sum / 200
      }
      expect(Math.abs(spread('researcher'))).toBeLessThan(Math.abs(spread('explorer')))
    }
  })

  it('помощта по нива: визуална / ограничена / без', () => {
    expect(HELP).toEqual({ explorer: 'visual', researcher: 'limited', master: 'none' })
  })
})

describe('запис на многоцифрените числа', () => {
  it('неразделящ интервал за хилядите от 10 000 нагоре', () => {
    expect(fmt(9999)).toBe('9999')
    expect(fmt(45600)).toBe('45 600')
    expect(fmt(1_000_000)).toBe('1 000 000')
    expect(fmt(0)).toBe('0')
  })
})
