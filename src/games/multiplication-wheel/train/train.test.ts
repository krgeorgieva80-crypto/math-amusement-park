import { describe, expect, it } from 'vitest'
import { DIFFICULTIES, seededRng } from '../../magic-tokens/logic'
import { MAX_PER_CABIN, addPassenger, checkGroups, checkSum, equationTexts, product, removePassenger, runningTotals, WHY_EQUAL, type GroupsTask } from '../logic'
import { MAX_CARS, carIsRight, carsHint, carsInstruction, carsSuccessText, carsTitle, checkCars, checkCarsFactor, generateTrainTasks, rightCars, trainLevel } from './logic'
import { CAR_H, CAR_W, bestPerRow, carKids, trainLayout, trainRows } from './trainGeometry'

const task = (groups: number, size: number, kind: GroupsTask['kind'] = 'fill', start?: number[]): GroupsTask => ({ id: 1, groups, size, kind, start: start ?? new Array(groups).fill(0) })

function solve(t: GroupsTask): number[] {
  let c = [...t.start]
  for (let i = 0; i < t.groups; i++) {
    while (c[i] < t.size) c = addPassenger(t, c, i)
    while (c[i] > t.size) c = removePassenger(t, c, i)
  }
  return c
}

describe('влакчето: равни групи една след друга', () => {
  it('4 вагончета по 3: 3 + 3 + 3 + 3 = 3 · 4 = 12', () => {
    const t = task(4, 3)
    const c = solve(t)
    expect(checkCars(t, c).status).toBe('correct')
    expect(checkSum(t, '12').status).toBe('correct')
    expect(checkCarsFactor(t, '4').status).toBe('correct')
    expect(checkCarsFactor(t, '3').status).toBe('wrong')
    expect(equationTexts(t, true, true).full).toBe('3 + 3 + 3 + 3 = 3 · 4 = 12')
    expect(runningTotals(t)).toEqual([3, 6, 9, 12])
  })

  it('всяко правилно попълнено вагонче се разпознава веднага', () => {
    const t = task(4, 3)
    const c = [3, 2, 4, 3]
    expect([0, 1, 2, 3].map((i) => carIsRight(t, c, i))).toEqual([true, false, false, true])
    expect(rightCars(t, c)).toBe(2)
    expect(rightCars(t, solve(t))).toBe(4)
  })

  it('неравните вагончета се отхвърлят с обяснение (същата проверка като кабинките)', () => {
    const t = task(3, 4)
    expect(checkCars(t, [0, 0, 0]).status).toBe('incomplete')
    expect(checkCars(t, [4, 6, 4])).toMatchObject({ status: 'wrong', cabin: 1, why: WHY_EQUAL, message: 'Във вагонче 2 има 6 деца, а трябва 4. Махни 2.' })
    expect(checkCars(t, [4, 1, 4]).message).toBe('Във вагонче 2 има 1 дете, а трябва 4. Добави 3.')
    expect(checkCars(t, [4, 6, 4], false).message).toBe('Вагончетата още не са равни.')
    expect(checkCars(task(4, 5, 'match', [5, 2, 7, 5]), [5, 2, 7, 5]).message).toBe('Във вагонче 2 има 2 деца, а в първото има 5. Добави 3.')
    const rng = seededRng(9)
    for (let k = 0; k < 400; k++) {
      const g = 2 + Math.floor(rng() * 7)
      const s = 2 + Math.floor(rng() * 9)
      const c = Array.from({ length: g }, () => Math.floor(rng() * 11))
      expect(checkCars(task(g, s), c).status).toBe(checkGroups(task(g, s), c).status)
    }
  })

  it('текстовете са за вагончета и съответстват на задачата', () => {
    expect(carsTitle(task(4, 5))).toEqual({ label: 'Веселото влакче', text: '4 вагончета по 5' })
    expect(carsInstruction(task(4, 5))).toBe('Сложи по 5 деца във всяко вагонче.')
    expect(carsSuccessText(task(4, 5))).toBe('Браво! Откри, че 4 вагончета по 5 деца са общо 20!')
    expect(carsSuccessText(task(2, 1))).toBe('Браво! Откри, че 2 вагончета по 1 дете са общо 2!')
    expect(checkCarsFactor(task(4, 5), '5').message).toBe('Не е вярно. Преброй вагончетата — във всяко има по 5.')
  })

  it('подсказките не издават резултата', () => {
    for (let g = 2; g <= MAX_CARS; g++)
      for (let s = 2; s <= 10; s++) {
        const t = task(g, s)
        for (const step of ['sum', 'factor'] as const) expect(carsHint(t, new Array(g).fill(s), step)).not.toMatch(new RegExp(`(^|\\D)${s * g}(\\D|$)`))
      }
  })
})

describe('задачи по клас и трудност', () => {
  for (const grade of [2, 3, 4] as const)
    for (const d of DIFFICULTIES)
      it(`${grade}. клас, ${d}`, () => {
        const lv = trainLevel(grade, d)
        const rng = seededRng(grade * 13 + d.length)
        for (let run = 0; run < 30; run++)
          for (const t of generateTrainTasks(grade, d, 10, rng)) {
            expect(t.groups).toBeGreaterThanOrEqual(lv.groups[0])
            expect(t.groups).toBeLessThanOrEqual(Math.min(lv.groups[1], MAX_CARS))
            expect(t.size).toBeGreaterThanOrEqual(lv.size[0])
            expect(t.size).toBeLessThanOrEqual(Math.min(lv.size[1], MAX_PER_CABIN))
            expect(t.kind).toBe(lv.kind)
            expect(checkCars(t, t.start).status).not.toBe('correct')
            expect(checkCars(t, solve(t)).status).toBe('correct')
            expect(product(t)).toBeLessThanOrEqual(80)
          }
      })

  it('по-големият клас и трудност дават повече вагончета и деца', () => {
    expect(trainLevel(2, 'explorer')).toMatchObject({ groups: [2, 4], size: [2, 5], kind: 'fill' })
    expect(trainLevel(3, 'master').groups[1]).toBeGreaterThan(trainLevel(2, 'explorer').groups[1])
    expect(trainLevel(4, 'explorer').size[0]).toBeGreaterThan(trainLevel(2, 'explorer').size[0])
  })

  it('без повторения в серия от 5', () => {
    const ts = generateTrainTasks(3, 'explorer', 5, seededRng(4))
    expect(new Set(ts.map((t) => `${t.groups}x${t.size}`)).size).toBe(5)
  })
})

describe('подреждане на влакчето', () => {
  it('редовете са възможно най-равни и съдържат всички вагончета', () => {
    expect(trainRows(8, 3)).toEqual([3, 3, 2])
    expect(trainRows(5, 3)).toEqual([3, 2])
    expect(trainRows(4, 4)).toEqual([4])
    for (let n = 2; n <= MAX_CARS; n++) for (let per = 1; per <= n; per++) expect(trainRows(n, per).reduce((a, b) => a + b, 0)).toBe(n)
  })

  it('вагончетата не се застъпват и номерата следват релсите', () => {
    for (let n = 2; n <= MAX_CARS; n++)
      for (let per = 2; per <= n; per++) {
        const L = trainLayout(n, per)
        expect(L.cars).toHaveLength(n)
        for (let i = 0; i < n; i++) {
          const a = L.cars[i]
          expect(a.x).toBeGreaterThanOrEqual(0)
          expect(a.x + CAR_W).toBeLessThanOrEqual(L.width)
          expect(a.y + CAR_H).toBeLessThanOrEqual(L.height)
          for (let j = i + 1; j < n; j++) {
            const b = L.cars[j]
            expect(Math.abs(a.x - b.x) >= CAR_W || Math.abs(a.y - b.y) >= CAR_H).toBe(true)
          }
          // съседните вагончета са едно до друго или на завоя (същата колона)
          if (i > 0) {
            const p = L.cars[i - 1]
            if (p.row === a.row) expect(Math.abs(p.col - a.col)).toBe(1)
            else expect(p.col).toBe(a.col)
          }
        }
        expect(L.turns).toHaveLength(L.rows.length - 1)
      }
  })

  it('избира подредбата с най-едри вагончета', () => {
    // широко и ниско място — един ред; тясно и високо — няколко реда
    expect(bestPerRow(4, 2000, 500)).toBe(4)
    expect(trainRows(8, bestPerRow(8, 700, 1200)).length).toBeGreaterThan(1)
  })

  it('нарисуваните деца са точно колкото е броят и не излизат от вагончето', () => {
    for (let c = 0; c <= MAX_PER_CABIN; c++) {
      const kids = carKids(c)
      expect(kids).toHaveLength(c)
      for (const k of kids) {
        expect(k.x - k.s * 0.46).toBeGreaterThanOrEqual(CAR_W * 0.05)
        expect(k.x + k.s * 0.46).toBeLessThanOrEqual(CAR_W * 0.95)
        expect(k.y - k.s * 1.05).toBeGreaterThanOrEqual(CAR_H * 0.18)
      }
    }
  })
})
