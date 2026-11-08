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

/* ── състояние на играта: въвеждане, проверка и преминаване (сигнал от прегледа: 2. клас, Майстор, задача 3/10) ── */
import { initialSecretState, parseTyped, secretReducer, typeKey, type SecretAction, type SecretState, type SecretTask } from './logic'

const mk = (values: number[], hidden: number[], id: number): SecretTask => ({ id, values, hidden, step: Math.abs(values[1] - values[0]), direction: values[1] > values[0] ? 'up' : 'down' })
const run = (r: ReturnType<typeof secretReducer>, s: SecretState, ...acts: SecretAction[]) => acts.reduce(r, s)
const keys = (digits: string): SecretAction[] => [...digits].map((key) => ({ type: 'key', key }))

describe('клавиатурата', () => {
  it('само цифри, без водещи нули, с ограничение на дължината; изтриване', () => {
    expect(typeKey('', '6', 3)).toBe('6')
    expect(typeKey('6', '2', 3)).toBe('62')
    expect(typeKey('0', '2', 3)).toBe('2')
    expect(typeKey('123', '4', 3)).toBe('123')
    expect(typeKey('62', 'back', 3)).toBe('6')
    expect(typeKey('62', 'clear', 3)).toBe('')
    expect(parseTyped('62')).toBe(62)
    expect(parseTyped('')).toBeNull()
    expect(parseTyped(undefined)).toBeNull()
  })
})

describe('Майстор, два тайни прозореца — задача 3/10: 2, 17, 32, 47, 62, 77', () => {
  // задачите 1–4 на серия от 10; задача 3 е редицата от сигнала (тайни: долу = 2, пети етаж = 62)
  const tasks = [mk([10, 20, 30, 40, 50, 60], [1, 4], 1), mk([5, 10, 15, 20, 25, 30], [0, 3], 2), mk([2, 17, 32, 47, 62, 77], [0, 4], 3), mk([1, 4, 7, 10, 13, 16], [2, 5], 4), ...Array.from({ length: 6 }, (_, k) => mk([k, k + 3, k + 6, k + 9, k + 12, k + 15], [1, 4], 5 + k))]
  const r = secretReducer(tasks, false, 3)
  const solveCurrent = (s: SecretState) => {
    const t = tasks[s.index]
    return run(r, s, ...t.hidden.flatMap((i) => [{ type: 'select', floor: i } as SecretAction, ...keys(String(t.values[i]))]), { type: 'check' })
  }
  const toTask3 = () => {
    let s = initialSecretState(tasks)
    for (let k = 0; k < 2; k++) s = r(solveCurrent(s), { type: 'next' })
    return s
  }

  it('индексите и очакваните стойности: долу (етаж 0) = 2, горе (етаж 4) = 62', () => {
    const t = tasks[2]
    expect(t.hidden).toEqual([0, 4])
    expect(t.values[0]).toBe(2)
    expect(t.values[4]).toBe(62)
  })

  it('стойностите от клавиатурата се записват в правилния прозорец', () => {
    const s = run(r, toTask3(), { type: 'select', floor: 4 }, ...keys('62'), { type: 'select', floor: 0 }, ...keys('2'))
    expect(s.index).toBe(2)
    expect(s.typed).toEqual({ 4: '62', 0: '2' })
  })

  it('горе 62 и долу 2 → „Провери“ → решено, похвала, после задача 4/10', () => {
    let s = run(r, toTask3(), { type: 'select', floor: 4 }, ...keys('62'), { type: 'select', floor: 0 }, ...keys('2'), { type: 'check' })
    expect(s.solved).toBe(true)
    expect(s.stars).toBe(3)
    expect(s.lit.sort()).toEqual([0, 4])
    expect(s.message).toBeNull()
    s = r(s, { type: 'next' })
    expect(s.index).toBe(3) // задача 4/10
    expect(s.solved).toBe(false)
    expect(s.typed).toEqual({})
    expect(s.active).toBe(tasks[3].hidden[0])
    expect(s.outcomes).toHaveLength(3)
  })

  it('и в обратен ред (първо долу, после горе), и без избор на поле за първото число', () => {
    const a = run(r, toTask3(), { type: 'select', floor: 0 }, ...keys('2'), { type: 'select', floor: 4 }, ...keys('62'), { type: 'check' })
    expect(a.solved).toBe(true)
    // активен по подразбиране е долният прозорец
    const b = run(r, toTask3(), ...keys('2'), { type: 'select', floor: 4 }, ...keys('62'), { type: 'check' })
    expect(b.solved).toBe(true)
  })

  it('след грешка: верният прозорец свети, грешният се изчиства; поправката завършва задачата', () => {
    let s = run(r, toTask3(), { type: 'select', floor: 4 }, ...keys('62'), { type: 'select', floor: 0 }, ...keys('3'), { type: 'check' })
    expect(s.solved).toBe(false)
    expect(s.lit).toEqual([4])
    expect(s.typed[0]).toBe('')
    expect(s.active).toBe(0)
    s = run(r, s, ...keys('2'), { type: 'check' })
    expect(s.solved).toBe(true)
    expect(s.stars).toBe(2)
  })

  it('с празен прозорец: подсказва да се попълни другият, без да брои грешка', () => {
    const s = run(r, toTask3(), { type: 'select', floor: 4 }, ...keys('62'), { type: 'check' })
    expect(s.solved).toBe(false)
    expect(s.mistakes).toBe(0)
    expect(s.active).toBe(0)
    expect(s.message?.kind).toBe('info')
  })

  it('похвалата не може да бъде скрита след решаване (докосване на прозорец, клавиш, проверка)', () => {
    let s = run(r, toTask3(), { type: 'select', floor: 4 }, ...keys('62'), { type: 'select', floor: 0 }, ...keys('2'), { type: 'check' })
    s = run(r, s, { type: 'select', floor: 4 }, { type: 'select', floor: 0 }, ...keys('9'), { type: 'check' }, { type: 'hint' })
    expect(s.solved).toBe(true)
    expect(s.message).toBeNull()
    expect(s.typed).toEqual({ 4: '62', 0: '2' })
  })

  it('цялата серия от 10 задачи се завършва', () => {
    let s = initialSecretState(tasks)
    for (let k = 0; k < 10; k++) {
      s = solveCurrent(s)
      expect(s.solved).toBe(true)
      s = r(s, { type: 'next' })
    }
    expect(s.finished).toBe(true)
    expect(s.outcomes).toHaveLength(10)
  })
})

describe.each(GRADES)('%i. клас — всяка генерирана задача се решава с клавиатурата', (grade) => {
  it.each(LEVELS)('ниво %s: серия от 10 задачи (вкл. два прозореца)', (d) => {
    for (let s0 = 0; s0 < 30; s0++) {
      const tasks = generateSecretTasks(grade, d, 10, seeded(s0 * 101 + grade))
      const explorer = d === 'explorer'
      const r = secretReducer(tasks, explorer, ({ 2: 3, 3: 4, 4: 7 } as const)[grade])
      let s = initialSecretState(tasks)
      for (let k = 0; k < 10; k++) {
        const t = tasks[s.index]
        const acts: SecretAction[] = explorer ? [{ type: 'choose', value: t.values[t.hidden[0]] }] : [...t.hidden].reverse().flatMap((i) => [{ type: 'select', floor: i } as SecretAction, ...keys(String(t.values[i]))])
        s = run(r, s, ...acts, { type: 'check' })
        expect(s.solved).toBe(true)
        s = r(s, { type: 'next' })
      }
      expect(s.finished).toBe(true)
    }
  })
})
