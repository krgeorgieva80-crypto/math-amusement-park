import { describe, expect, it } from 'vitest'
import { DIFFICULTIES, seededRng, starsForTask } from '../../magic-tokens/logic'
import { DEFAULT_SETTINGS, loadSettings } from '../../../core/storage'
import {
  ALL_TABLES,
  DEFAULT_SPIN_TABLES,
  SPIN_HELP,
  checkSpin,
  generateSpinTasks,
  neighbourHint,
  sanitizeTables,
  sectorAngle,
  skipCountHint,
  spinAnswer,
  spinExpression,
  spinPraise,
  spinProduct,
  targetRotation,
  wheelSectors,
  type SpinTask,
} from './logic'

const t = (table: number, multiplier: number, kind: SpinTask['kind'] = 'normal'): SpinTask => ({ id: 1, table, multiplier, kind })
const opts = (tables: number[], zero = false, missing = false) => ({ tables, zero, missing })

describe('произведения и запис', () => {
  it('всички произведения от таблицата са верни (0–10 × 2–10)', () => {
    for (const a of ALL_TABLES)
      for (let m = 0; m <= 10; m++) {
        expect(spinProduct(t(a, m))).toBe(a * m)
        expect(checkSpin(t(a, m), String(a * m)).status).toBe('correct')
        expect(checkSpin(t(a, m, 'swapped'), String(a * m)).status).toBe('correct')
        if (m > 0) expect(checkSpin(t(a, m, 'missing'), String(a)).status).toBe('correct')
      }
  })

  it('запис: таблица · множител; размяна; липсващ множител', () => {
    expect(spinExpression(t(3, 7)).full).toBe('3 · 7 = 21')
    expect(spinExpression(t(3, 7)).left).toBe('3 · 7 =')
    expect(spinExpression(t(3, 7, 'swapped')).full).toBe('7 · 3 = 21')
    expect(spinExpression(t(3, 7, 'missing')).left).toBe('7 · ? = 21')
    expect(spinAnswer(t(3, 7, 'missing'))).toBe(3)
  })

  it('грешните отговори се отхвърлят, без да се издава верният', () => {
    for (const a of ALL_TABLES)
      for (let m = 1; m <= 10; m++)
        for (const kind of ['normal', 'swapped', 'missing'] as const) {
          const task = t(a, m, kind)
          const want = spinAnswer(task)
          for (const w of [want - 1, want + 1, want + 10]) {
            if (w < 0) continue
            const r = checkSpin(task, String(w))
            expect(r.status).toBe('wrong')
            expect(r.message).not.toMatch(new RegExp(`(^|\\D)${want}(\\D|$)`))
          }
        }
    expect(checkSpin(t(3, 7), '').status).toBe('incomplete')
  })
})

describe('генериране по нива', () => {
  it('Откривател: само избраната таблица, всеки множител 1–10 по веднъж', () => {
    const ts = generateSpinTasks('explorer', opts([2, 3, 5]), 3, 10, seededRng(1))
    expect(ts.every((x) => x.table === 3 && x.kind === 'normal')).toBe(true)
    expect(ts.map((x) => x.multiplier).sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
    // таблица извън изучените не се приема — взима се последната изучена
    expect(generateSpinTasks('explorer', opts([2, 4]), 7, 5, seededRng(2)).every((x) => x.table === 4)).toBe(true)
  })

  it('15 задачи на Откривател: без повторение в първите 10', () => {
    const ts = generateSpinTasks('explorer', opts([2]), 2, 15, seededRng(3))
    expect(new Set(ts.slice(0, 10).map((x) => x.multiplier)).size).toBe(10)
    expect(ts).toHaveLength(15)
  })

  it('Изследовател: от няколко изучени таблици, без повторения', () => {
    const ts = generateSpinTasks('researcher', opts([2, 3, 4]), 2, 15, seededRng(4))
    expect(ts.every((x) => [2, 3, 4].includes(x.table) && x.kind === 'normal')).toBe(true)
    expect(new Set(ts.map((x) => `${x.table}x${x.multiplier}`)).size).toBe(15)
    expect(new Set(ts.map((x) => x.table)).size).toBeGreaterThan(1)
  })

  it('Майстор: смесени и разменени; липсващ множител само при включена опция', () => {
    const rng = seededRng(5)
    const plain = generateSpinTasks('master', opts([2, 5, 9]), 2, 15, rng)
    expect(plain.some((x) => x.kind === 'swapped')).toBe(true)
    expect(plain.some((x) => x.kind === 'normal')).toBe(true)
    expect(plain.some((x) => x.kind === 'missing')).toBe(false)
    let missing = 0
    for (let run = 0; run < 20; run++) missing += generateSpinTasks('master', opts([2, 5, 9], true, true), 2, 15, rng).filter((x) => x.kind === 'missing').length
    expect(missing).toBeGreaterThan(0)
  })

  it('никога неизучени таблици; 0 само при включена опция; без липсващ множител при 0', () => {
    const rng = seededRng(6)
    for (const d of DIFFICULTIES)
      for (let run = 0; run < 40; run++) {
        const tables = ALL_TABLES.filter(() => rng() < 0.4)
        const active = tables.length ? [...tables] : [2]
        for (const zero of [false, true]) {
          const ts = generateSpinTasks(d, opts(active, zero, true), active[0], 15, rng)
          for (const x of ts) {
            expect(active).toContain(x.table)
            expect(x.multiplier).toBeGreaterThanOrEqual(zero ? 0 : 1)
            expect(x.multiplier).toBeLessThanOrEqual(10)
            if (x.kind === 'missing') expect(x.multiplier).toBeGreaterThan(1)
            if (d !== 'master') expect(x.kind).toBe('normal')
          }
          if (!zero) expect(ts.some((x) => x.multiplier === 0)).toBe(false)
        }
      }
  })
})

describe('изучени таблици (настройки на учителя)', () => {
  it('по подразбиране: 2. клас — само с 2; 3. и 4. клас — 2…10', () => {
    expect(DEFAULT_SPIN_TABLES[2]).toEqual([2])
    expect(DEFAULT_SPIN_TABLES[3]).toEqual([2, 3, 4, 5, 6, 7, 8, 9, 10])
    expect(DEFAULT_SETTINGS.spinTables[2]).toEqual([2])
    expect(DEFAULT_SETTINGS.spinZero).toBe(false)
    expect(DEFAULT_SETTINGS.spinMissing).toBe(false)
  })

  it('почистване на повредени стойности', () => {
    expect(sanitizeTables([5, 2, 2, 11, 1, 'x', 0], 2)).toEqual([2, 5])
    expect(sanitizeTables([], 2)).toEqual([2])
    expect(sanitizeTables(null, 3)).toEqual([2, 3, 4, 5, 6, 7, 8, 9, 10])
  })

  it('запазените таблици се зареждат за всеки клас поотделно', () => {
    const store = new Map<string, string>()
    const localStorage = { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => void store.set(k, v), clear: () => store.clear() }
    ;(globalThis as unknown as { window: unknown }).window = { localStorage }
    localStorage.setItem('map.settings.v1', JSON.stringify({ spinTables: { 2: [2, 3, 4], 3: [7] }, spinZero: true }))
    const s = loadSettings()
    expect(s.spinTables[2]).toEqual([2, 3, 4])
    expect(s.spinTables[3]).toEqual([7])
    expect(s.spinTables[4]).toEqual(DEFAULT_SPIN_TABLES[4])
    expect(s.spinZero).toBe(true)
    expect(s.spinMissing).toBe(false)
    localStorage.clear()
  })
})

describe('колело', () => {
  it('сектори 1–10, по избор 0–10', () => {
    expect(wheelSectors(false)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
    expect(wheelSectors(true)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
  })

  it('спира точно на избрания сектор, винаги напред и с поне 4 обиколки', () => {
    for (const n of [10, 11]) {
      let rot = 0
      const rng = seededRng(n)
      for (let k = 0; k < 200; k++) {
        const i = Math.floor(rng() * n)
        const next = targetRotation(rot, i, n)
        expect(next - rot).toBeGreaterThanOrEqual(4 * 360)
        // секторът i е под стрелката (ъгъл 0 отгоре)
        const at = (((sectorAngle(i, n) + next) % 360) + 360) % 360
        expect(Math.min(at, 360 - at)).toBeLessThan(1e-6)
        rot = next
      }
    }
  })
})

describe('подсказки, похвала и звезди', () => {
  it('подсказките не съдържат отговора', () => {
    for (const a of ALL_TABLES)
      for (let m = 0; m <= 10; m++) {
        const p = a * m
        const re = new RegExp(`(^|\\D)${p}(\\D|$)`)
        if (m > 1) expect(skipCountHint(t(a, m))).not.toMatch(re)
        if (m > 1) expect(neighbourHint(t(a, m))).not.toMatch(re)
        if (m > 1 && m !== a) expect(neighbourHint(t(a, m, 'missing'))).not.toMatch(new RegExp(`(^|\\D)${a}(\\D|$)`))
      }
    expect(skipCountHint(t(3, 7))).toBe('Брой по 3: 3, 6, 9, …')
    expect(neighbourHint(t(3, 7))).toBe('3 · 6 = 18. Колко е с още едно 3?')
  })

  it('нива на помощ: визуална, ограничена, без', () => {
    expect(SPIN_HELP).toEqual({ explorer: 'visual', researcher: 'limited', master: 'none' })
  })

  it('конкретна похвала', () => {
    expect(spinPraise(t(3, 7))).toBe('Браво! 3 · 7 = 21 — 7 пъти по 3!')
    expect(spinPraise(t(4, 1))).toBe('Браво! 4 · 1 = 4 — 1 път по 4!')
    expect(spinPraise(t(3, 7, 'swapped'))).toContain('Размяната на множителите не променя произведението')
    expect(spinPraise(t(3, 7, 'missing'))).toContain('7 · 3 = 21')
  })

  it('звезди: 3 без грешки и помощ, 2 при една грешка, 1 при повече', () => {
    expect(starsForTask(0, false)).toBe(3)
    expect(starsForTask(0, true)).toBe(2)
    expect(starsForTask(1, false)).toBe(2)
    expect(starsForTask(3, false)).toBe(1)
  })
})
