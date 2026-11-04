import { describe, expect, it } from 'vitest'
import { DIFFICULTIES, seededRng } from '../magic-tokens/logic'
import {
  MAX_PER_CABIN,
  addPassenger,
  checkFactor,
  checkGroups,
  checkSum,
  equationTexts,
  generateGroupsTasks,
  groupsHint,
  groupsLevel,
  isLocked,
  product,
  removePassenger,
  repeatedSumText,
  type GroupsTask,
} from './logic'

const task = (groups: number, size: number, kind: GroupsTask['kind'] = 'fill', start?: number[]): GroupsTask => ({
  id: 1,
  groups,
  size,
  kind,
  start: start ?? new Array(groups).fill(0),
})

/** Ученикът пълни кабинките с докосване, докато станат равни. */
function solveModel(t: GroupsTask): number[] {
  let c = [...t.start]
  for (let i = 0; i < t.groups; i++) {
    while (c[i] < t.size) c = addPassenger(t, c, i)
    while (c[i] > t.size) c = removePassenger(t, c, i)
  }
  return c
}

describe('равни групи и умножение', () => {
  it('4 кабинки по 3: 3 + 3 + 3 + 3 = 3 · 4 = 12', () => {
    const t = task(4, 3)
    expect(repeatedSumText(t)).toBe('3 + 3 + 3 + 3')
    expect(product(t)).toBe(12)
    const c = solveModel(t)
    expect(c).toEqual([3, 3, 3, 3])
    expect(c.reduce((a, b) => a + b, 0)).toBe(12)
    expect(checkGroups(t, c).status).toBe('correct')
    expect(checkSum(t, '12').status).toBe('correct')
    expect(checkFactor(t, '4').status).toBe('correct')
    expect(equationTexts(t, true, true).full).toBe('3 + 3 + 3 + 3 = 3 · 4 = 12')
  })

  it('сборът на равните групи винаги е равен на произведението', () => {
    for (let g = 2; g <= 10; g++)
      for (let s = 1; s <= 10; s++) {
        const t = task(g, s)
        const sum = repeatedSumText(t).split(' + ').map(Number).reduce((a, b) => a + b, 0)
        expect(sum).toBe(s * g)
        expect(solveModel(t).reduce((a, b) => a + b, 0)).toBe(product(t))
      }
  })
})

describe('генериране на задачи', () => {
  for (const grade of [2, 3, 4] as const)
    for (const d of DIFFICULTIES)
      it(`${grade}. клас, ${d}: в границите, решими и различни`, () => {
        const level = groupsLevel(grade, d)
        const rng = seededRng(grade * 7 + d.length)
        for (let run = 0; run < 40; run++) {
          const tasks = generateGroupsTasks(grade, d, 10, rng)
          expect(tasks).toHaveLength(10)
          for (const t of tasks) {
            expect(t.groups).toBeGreaterThanOrEqual(level.groups[0])
            expect(t.groups).toBeLessThanOrEqual(level.groups[1])
            expect(t.size).toBeGreaterThanOrEqual(level.size[0])
            expect(t.size).toBeLessThanOrEqual(Math.min(level.size[1], MAX_PER_CABIN))
            expect(product(t)).toBeLessThanOrEqual(100)
            expect(t.start).toHaveLength(t.groups)
            expect(t.start.every((c) => c >= 0 && c <= MAX_PER_CABIN)).toBe(true)
            // началото никога не е вече решено
            expect(checkGroups(t, t.start).status).not.toBe('correct')
            if (t.kind === 'match') expect(t.start[0]).toBe(t.size)
            if (t.kind === 'fill') expect(t.start.every((c) => c === 0)).toBe(true)
            // решимо с докосвания
            expect(checkGroups(t, solveModel(t)).status).toBe('correct')
          }
        }
      })

  it('2. клас „Откривател“ е лесен: до 4 кабинки по най-много 5 деца', () => {
    expect(groupsLevel(2, 'explorer')).toMatchObject({ groups: [2, 4], size: [2, 5], kind: 'fill' })
  })

  it('без повтарящи се задачи в серия от 5', () => {
    const tasks = generateGroupsTasks(2, 'explorer', 5, seededRng(3))
    expect(new Set(tasks.map((t) => `${t.groups}x${t.size}`)).size).toBe(5)
  })
})

describe('взаимодействие с кабинките', () => {
  it('добавяне и махане в границите 0–10', () => {
    const t = task(3, 4)
    let c = [0, 0, 0]
    c = removePassenger(t, c, 0)
    expect(c).toEqual([0, 0, 0]) // не под нула
    for (let k = 0; k < 15; k++) c = addPassenger(t, c, 1)
    expect(c[1]).toBe(MAX_PER_CABIN) // не над 10
    expect(addPassenger(t, c, 7)).toBe(c) // несъществуваща кабинка
  })

  it('първата кабинка в „match“ е заключена', () => {
    const t = task(4, 5, 'match', [5, 2, 7, 5])
    expect(isLocked(t, 0)).toBe(true)
    expect(addPassenger(t, t.start, 0)).toEqual(t.start)
    expect(removePassenger(t, t.start, 0)).toEqual(t.start)
    expect(checkGroups(t, t.start).message).toBe('В кабинка 2 има 2 деца, а в първата има 5. Добави 3.')
  })

  it('проверка с ясни съобщения', () => {
    const t = task(3, 4)
    expect(checkGroups(t, [0, 0, 0]).status).toBe('incomplete')
    expect(checkGroups(t, [4, 6, 4])).toMatchObject({ status: 'wrong', cabin: 1, message: 'В кабинка 2 има 6 деца, а трябва 4. Махни 2.' })
    expect(checkGroups(t, [4, 1, 4]).message).toBe('В кабинка 2 има 1 дете, а трябва 4. Добави 3.')
    expect(checkGroups(t, [4, 6, 4], false).message).toBe('Кабинките още не са равни.')
  })
})

describe('пресмятане без разкриване на резултата', () => {
  const t = task(4, 3)
  it('грешните отговори не се приемат и не издават резултата', () => {
    expect(checkSum(t, '').status).toBe('incomplete')
    for (const w of ['11', '13', '7', '43']) {
      const r = checkSum(t, w)
      expect(r.status).toBe('wrong')
      expect(r.message).not.toContain('12')
    }
    expect(checkFactor(t, '3').status).toBe('wrong')
    expect(checkFactor(t, '12').status).toBe('wrong')
  })

  it('изразите се показват постепенно', () => {
    expect(equationTexts(t, false, false)).toEqual({ sum: '3 + 3 + 3 + 3 =', sumAnswer: null, factor: null, full: null })
    expect(equationTexts(t, true, false).factor).toBe('3 · ? = 12')
  })

  it('подсказките не съдържат крайния резултат', () => {
    for (let g = 2; g <= 10; g++)
      for (let s = 2; s <= 10; s++) {
        const tt = task(g, s)
        expect(groupsHint(tt, new Array(g).fill(s), 'sum')).not.toMatch(new RegExp(`(^|\\D)${s * g}(\\D|$)`))
      }
    expect(groupsHint(t, [0, 0, 0, 0], 'sum')).toBe('Брой по 3: 3, 6, 9, …')
  })
})
