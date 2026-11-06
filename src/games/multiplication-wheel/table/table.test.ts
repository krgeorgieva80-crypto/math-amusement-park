import { describe, expect, it } from 'vitest'
import { DIFFICULTIES, seededRng, starsForTask } from '../../magic-tokens/logic'
import {
  ACTIVITIES,
  HELP_LEVEL,
  cellHint,
  cellKey,
  checkGrid,
  checkPattern,
  checkStep,
  fixHint,
  generateGrid,
  generatePattern,
  generateTableTasks,
  patternHint,
  praise,
  ruleText,
  instruction,
  tableColumns,
  typicalWrong,
  type GridTask,
  type PatternTask,
} from './logic'

const ALL = [2, 3, 4, 5, 6, 7, 8, 9, 10]
const opts = (tables: number[], zero = false) => ({ tables, zero })
const subsets = (rng: () => number) => {
  const t = ALL.filter(() => rng() < 0.45)
  return t.length ? t : [ALL[Math.floor(rng() * 9)]]
}
const solved = (t: GridTask) => Object.fromEntries(t.cells.filter((c) => c.blank || c.wrong !== undefined).map((c) => [cellKey(c.r, c.c), String(c.value)]))
const allMarked = (t: GridTask) => new Set(t.cells.filter((c) => c.wrong !== undefined).map((c) => cellKey(c.r, c.c)))

describe('таблицата: верни произведения', () => {
  it('всяка клетка е ред · колона (0–10 × 2–10)', () => {
    for (const d of DIFFICULTIES)
      for (const kind of ['fill', 'fix', 'final'] as const) {
        const t = generateGrid(kind, d, opts(ALL, true), 5, seededRng(d.length + kind.length), 1)
        for (const c of t.cells) expect(c.value).toBe(c.r * c.c)
        expect(t.cols).toEqual(tableColumns(true))
        expect(t.cells).toHaveLength(t.rows.length * t.cols.length)
      }
  })

  it('без умножение с 0 няма колона 0; с него — има', () => {
    expect(tableColumns(false)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
    expect(tableColumns(true)[0]).toBe(0)
  })
})

describe('само изучените таблици, на всички нива и дейности', () => {
  it('редове и редици — само от разрешените таблици', () => {
    const rng = seededRng(11)
    for (let run = 0; run < 150; run++) {
      const tables = subsets(rng)
      for (const d of DIFFICULTIES)
        for (const t of generateTableTasks(d, opts(tables, rng() < 0.5), tables[0], 'route', 0, rng)) {
          if (t.kind === 'pattern') {
            // ред — от изучена таблица; колона — числата са в редовете на поредни изучени таблици
            if (t.shape === 'column') expect(t.terms.every((v) => tables.includes(v / t.step))).toBe(true)
            else expect(tables).toContain(t.table)
            // всяко число е кратно на изучена таблица и е до 100
            for (const v of t.terms) {
              expect(v).toBeGreaterThanOrEqual(0)
              expect(v).toBeLessThanOrEqual(100)
              expect(tables.some((tb) => v % tb === 0)).toBe(true)
            }
          } else for (const r of t.rows) expect(tables).toContain(r)
        }
    }
  })

  it('Откривател — само избраната таблица (или последната изучена)', () => {
    const g = generateGrid('fill', 'explorer', opts([2, 3, 5]), 3, seededRng(1), 1)
    expect(g.rows).toEqual([3])
    expect(generateGrid('fill', 'explorer', opts([2, 4]), 7, seededRng(1), 1).rows).toEqual([4])
    const p = generatePattern('explorer', opts([2, 3, 5]), 5, seededRng(2), 1)
    expect(p.table).toBe(5)
  })

  it('с една изучена таблица всички нива работят само с нея', () => {
    for (const d of DIFFICULTIES)
      for (const t of generateTableTasks(d, opts([2]), 2, 'route', 0, seededRng(4))) {
        if (t.kind === 'pattern') expect(t.terms.every((v) => v % 2 === 0)).toBe(true)
        else expect(t.rows).toEqual([2])
      }
  })
})

describe('закономерности: еднаква стъпка', () => {
  it('стъпката е еднаква, първите две числа се виждат, възможностите съдържат верната', () => {
    const rng = seededRng(7)
    for (let k = 0; k < 400; k++) {
      const tables = subsets(rng)
      const d = DIFFICULTIES[k % 3]
      const p = generatePattern(d, opts(tables, k % 2 === 0), tables[0], rng, 1) as PatternTask
      for (let i = 1; i < p.terms.length; i++) expect(p.terms[i] - p.terms[i - 1]).toBe(p.step)
      expect(p.blanks.every((i) => i >= 2)).toBe(true)
      expect(p.blanks.length).toBeGreaterThan(0)
      expect(p.stepOptions).toContain(p.step)
      expect(new Set(p.stepOptions).size).toBe(3)
      expect(checkStep(p, p.step)).toBe(true)
      for (const o of p.stepOptions) if (o !== p.step) expect(checkStep(p, o)).toBe(false)
    }
  })

  it('нивата: Откривател — поред нагоре; Изследовател — от средата или надолу; Майстор — през едно или колона', () => {
    const rng = seededRng(3)
    const shapes = { explorer: new Set<string>(), researcher: new Set<string>(), master: new Set<string>() }
    for (let k = 0; k < 200; k++) for (const d of DIFFICULTIES) shapes[d].add(generatePattern(d, opts(ALL), 3, rng, 1).shape)
    expect([...shapes.explorer]).toEqual(['up'])
    expect([...shapes.researcher].sort()).toEqual(['down', 'up'])
    expect([...shapes.master].sort()).toEqual(['column', 'skip'])
  })

  it('проверка на редицата: празни, грешни, верни', () => {
    const p = generatePattern('explorer', opts([3]), 3, seededRng(5), 1)
    expect(checkPattern(p, {}).status).toBe('incomplete')
    const wrong = Object.fromEntries(p.blanks.map((i) => [i, String(p.terms[i] + 1)]))
    const r = checkPattern(p, wrong)
    expect(r.status).toBe('wrong')
    expect(r.wrong).toEqual(p.blanks)
    for (const i of p.blanks) expect(r.message).not.toContain(String(p.terms[i]))
    expect(checkPattern(p, Object.fromEntries(p.blanks.map((i) => [i, String(p.terms[i])]))).status).toBe('correct')
  })
})

describe('липсващи и грешни произведения', () => {
  it('брой празни и грешни по нива; празните не са в една колона', () => {
    const rng = seededRng(9)
    for (let k = 0; k < 100; k++) {
      const f = { explorer: generateGrid('fill', 'explorer', opts(ALL), 4, rng, 1), researcher: generateGrid('fill', 'researcher', opts(ALL), 4, rng, 1), master: generateGrid('fill', 'master', opts(ALL), 4, rng, 1) }
      const n = (t: GridTask) => t.cells.filter((c) => c.blank).length
      expect(n(f.explorer)).toBeLessThan(n(f.researcher))
      expect(n(f.researcher)).toBeLessThan(n(f.master))
      for (const t of Object.values(f)) if (n(t) > 2) expect(new Set(t.cells.filter((c) => c.blank).map((c) => c.c)).size).toBeGreaterThan(1)
      const fx = generateGrid('fix', 'master', opts(ALL, true), 4, rng, 1)
      const errs = fx.cells.filter((c) => c.wrong !== undefined)
      expect(errs.length).toBeGreaterThanOrEqual(2)
      expect(errs.length).toBeLessThanOrEqual(4)
      expect(fx.tellErrors).toBe(false)
      for (const c of errs) {
        expect(c.wrong).not.toBe(c.value)
        expect(c.c).not.toBe(0)
        expect(c.wrong).toBeGreaterThan(0)
        expect(c.wrong).toBeLessThanOrEqual(100)
      }
    }
    expect(generateGrid('fix', 'explorer', opts(ALL), 4, seededRng(1), 1).cells.filter((c) => c.wrong !== undefined)).toHaveLength(2)
    expect(generateGrid('fix', 'researcher', opts(ALL), 4, seededRng(1), 1).tellErrors).toBe(true)
  })

  it('типичните грешки: стъпка встрани, съседна таблица или разменени цифри — никога верният отговор', () => {
    const rng = seededRng(2)
    for (const a of ALL)
      for (let k = 1; k <= 10; k++)
        for (let n = 0; n < 10; n++) {
          const w = typicalWrong(a, k, rng)
          expect(w).not.toBe(a * k)
          const swap = a * k >= 10 ? (a * k % 10) * 10 + Math.floor(a * k / 10) : -1
          expect([a * (k + 1), a * (k - 1), (a + 1) * k, (a - 1) * k, swap, a * k + a]).toContain(w)
        }
  })

  it('проверка: празни → непълно; грешни се изчистват без отговора; неоткрити грешки', () => {
    const t = generateGrid('fill', 'researcher', opts([3, 7]), 3, seededRng(6), 1)
    expect(checkGrid(t, {}, new Set()).status).toBe('incomplete')
    const ans = solved(t)
    const k0 = Object.keys(ans)[0]
    const bad = { ...ans, [k0]: String(Number(ans[k0]) + 1) }
    const r = checkGrid(t, bad, new Set())
    expect(r).toMatchObject({ status: 'wrong', wrongKeys: [k0] })
    expect(r.message).not.toContain(ans[k0])
    expect(checkGrid(t, ans, new Set()).status).toBe('correct')

    const fx = generateGrid('fix', 'researcher', opts([3, 7]), 3, seededRng(8), 1)
    const marked = allMarked(fx)
    const one = new Set([...marked].slice(0, 1))
    const partial = checkGrid(fx, solved(fx), one)
    expect(partial.status).toBe('wrong')
    expect(partial.message).toContain(`${marked.size - 1}`)
    expect(checkGrid(fx, solved(fx), marked).status).toBe('correct')
    const fm = generateGrid('fix', 'master', opts([3, 7]), 3, seededRng(8), 1)
    expect(checkGrid(fm, solved(fm), new Set()).message).not.toMatch(/\d/)
  })
})

describe('логична последователност без повторения', () => {
  it('маршрутът: редиците са различни; Изследовател/Майстор редуват вида; таблиците на поредни задачи се сменят', () => {
    const rng = seededRng(21)
    for (let run = 0; run < 120; run++) {
      const tables = subsets(rng)
      for (const d of DIFFICULTIES) {
        const r = generateTableTasks(d, opts(tables), tables[0], 'route', 0, rng)
        const pats = r.filter((t) => t.kind === 'pattern') as PatternTask[]
        expect(pats[0].terms.join()).not.toBe(pats[1].terms.join())
        if (d !== 'explorer' && pats[0].shape !== 'column' && pats[1].shape !== 'column') {
          if (d === 'researcher') expect(pats[0].shape).not.toBe(pats[1].shape)
          if (tables.length > 1) expect(pats[0].table).not.toBe(pats[1].table)
        }
        const grids = r.filter((t) => t.kind !== 'pattern') as GridTask[]
        for (let i = 1; i < grids.length; i++) if (d !== 'explorer' && tables.length > grids[i].rows.length + 1) expect(grids[i].rows.join()).not.toBe(grids[i - 1].rows.join())
        // няма две еднакви задачи
        const sig = r.map((t) => (t.kind === 'pattern' ? t.terms.join() : (t as GridTask).cells.filter((c) => c.blank || c.wrong !== undefined).map((c) => `${c.r}x${c.c}`).join()))
        expect(new Set(sig).size).toBe(sig.length)
      }
    }
  })
})

describe('серия, подсказки и звезди', () => {
  it('маршрутът: 4 станции по ред (2 + 2 + 2 + 1); отделна дейност — избраният брой', () => {
    for (const d of DIFFICULTIES) {
      const r = generateTableTasks(d, opts(ALL), 3, 'route', 0, seededRng(1))
      expect(r.map((t) => t.kind)).toEqual(['pattern', 'pattern', 'fill', 'fill', 'fix', 'fix', 'final'])
      for (const a of ACTIVITIES) expect(generateTableTasks(d, opts(ALL), 3, a.id, 5, seededRng(2)).every((t) => t.kind === a.id)).toBe(true)
    }
    expect(generateTableTasks('researcher', opts(ALL), 3, 'fill', 10, seededRng(2))).toHaveLength(10)
  })

  it('точната формулировка на правилото', () => {
    expect(ruleText(2)).toBe('Всяко следващо число е с 2 по-голямо')
    expect(ruleText(-5)).toBe('Всяко следващо число е с 5 по-малко')
    const p = generatePattern('explorer', opts([2]), 2, seededRng(1), 1)
    expect(instruction(p, true)).toBe('Всяко следващо число е с 2 по-голямо. Попълни празните места.')
    expect(praise(p)).toBe('Браво! Откри правилото: всяко следващо число е с 2 по-голямо.')
  })

  it('подсказките насочват, но не съдържат отговора (и при ×0 и ×1)', () => {
    for (const r of ALL) {
      expect(cellHint(r, 0, 'visual')).not.toMatch(/\d/)
      expect(cellHint(r, 1, 'limited')).not.toMatch(/\d/)
    }
    expect(cellHint(3, 7, 'visual')).toBe('3 · 7: брой по 3 — 3, 6, 9, … и спри след 7 стъпки.')
    expect(cellHint(3, 7, 'limited')).toBe('3 · 6 = 18. Колко е с още едно 3?')
    const rng = seededRng(12)
    for (let k = 0; k < 300; k++) {
      const p = generatePattern(DIFFICULTIES[k % 3], opts(subsets(rng), k % 2 === 0), 2, rng, 1)
      // подсказката за попълването не съобщава числото на празното място (освен ако то съвпада със самата стъпка)
      for (const i of p.blanks) if (p.terms[i] !== Math.abs(p.step) && p.terms[i] !== p.terms[i - 1]) expect(patternHint(p, true)).not.toMatch(new RegExp(`(^|\\D)${p.terms[i]}(\\D|$)`))
    }
    for (const r of ALL)
      for (let c = 2; c <= 10; c++) {
        const re = new RegExp(`(^|\\D)${r * c}(\\D|$)`)
        expect(cellHint(r, c, 'visual')).not.toMatch(re)
        expect(cellHint(r, c, 'limited')).not.toMatch(re)
      }
    const p = generatePattern('researcher', opts([6]), 6, seededRng(3), 1)
    for (const i of p.blanks) {
      expect(patternHint(p, false)).not.toMatch(new RegExp(`(^|\\D)${p.terms[i]}(\\D|$)`))
      expect(patternHint(p, true)).not.toMatch(new RegExp(`(^|\\D)${p.terms[i]}(\\D|$)`))
    }
    const fx = generateGrid('fix', 'researcher', opts([3, 7]), 3, seededRng(8), 1)
    for (const c of fx.cells.filter((x) => x.wrong !== undefined)) expect(fixHint(fx, new Set())).not.toMatch(new RegExp(`(^|\\D)${c.value}(\\D|$)`))
  })

  it('нива на помощ и звезди', () => {
    expect(HELP_LEVEL).toEqual({ explorer: 'visual', researcher: 'limited', master: 'none' })
    expect(starsForTask(0, false)).toBe(3)
    expect(starsForTask(1, false)).toBe(2)
    expect(starsForTask(0, true)).toBe(2)
    expect(starsForTask(2, false)).toBe(1)
  })
})
