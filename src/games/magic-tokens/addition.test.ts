import { describe, expect, it } from 'vitest'
import { addStepInstruction, placeToExchange, visibleAddPlaces, type AddTask } from './addition'
import { checkComputedAnswer, visibleInfo } from './compute'
import { carryCount } from './arithmetic'
import { canExchangeUp, countsOf, emptyCounts, exchangeUp, valueOf, type Counts } from './placeValue'
import { checkTask, hintFor, initialState, rangePlaces, type BoardState } from './tasks'

const task = (a: number, b: number): AddTask => ({ kind: 'add', id: 1, a, b, places: rangePlaces('r100') })
type AddState = Extract<BoardState, { kind: 'add' }>

const CASES: [number, number, number][] = [
  [30, 4, 34],
  [24, 13, 37],
  [38, 8, 46],
  [47, 25, 72],
  [56, 34, 90],
  [65, 35, 100],
]

/** Преместване на една група (разряд) в сбора — както при докосване. */
function move(s: AddState, row: 'a' | 'b', p: 1 | 10 | 100): AddState {
  return { ...s, [row]: { ...s[row], [p]: 0 }, result: { ...s.result, [p]: s.result[p] + s[row][p] } }
}

const total = (s: AddState) => valueOf(s.a) + valueOf(s.b) + valueOf(s.result)

describe('събиране до 100 — колони', () => {
  it('без празна колона „Стотици“ в началото', () => {
    for (const [a, b] of CASES) {
      const t = task(a, b)
      expect(visibleAddPlaces(t, initialState(t))).toEqual([10, 1])
    }
  })

  it('„Стотици“ се появява чак когато има 10 десетици за размяна (65 + 35)', () => {
    const t = task(65, 35)
    let s = initialState(t) as AddState
    s = move(move(move(move(s, 'a', 10), 'a', 1), 'b', 10), 'b', 1)
    // 9 десетици и 10 единици — все още без стотици
    expect(visibleAddPlaces(t, s)).toEqual([10, 1])
    s = { ...s, result: exchangeUp(s.result, 1, visibleAddPlaces(t, s)) }
    // 10 десетици — колоната се появява, за да може ученикът да размени
    expect(visibleAddPlaces(t, s)).toEqual([100, 10, 1])
    expect(addStepInstruction(t, s, 'model', '')).toBe('Размени 10 десетици за 1 стотица.')
  })

  it('в 3. клас (до 1000) — без празната колона „Хиляди“', () => {
    const t: AddTask = { kind: 'add', id: 1, a: 236, b: 451, places: rangePlaces('r1000') }
    expect(visibleAddPlaces(t, initialState(t))).toEqual([100, 10, 1])
  })
})

describe('шестте случая: етапи, стойности и указания', () => {
  for (const [a, b, sum] of CASES) {
    it(`${a} + ${b} = ${sum}`, () => {
      const t = task(a, b)
      let s = initialState(t) as AddState
      expect(valueOf(s.a)).toBe(a)
      expect(valueOf(s.b)).toBe(b)
      // Етап 1: първо „Премести жетоните в сбора.“; не може да се продължи без това
      expect(addStepInstruction(t, s, 'model', '')).toBe('Премести жетоните в сбора.')
      expect(checkTask(t, s).status).toBe('incomplete')
      // ученикът премества групите една по една; стойността се запазва
      for (const [row, p] of [['a', 10], ['b', 10], ['a', 1], ['b', 1]] as const) {
        s = move(s, row, p)
        expect(total(s)).toBe(sum)
      }
      expect(valueOf(s.result)).toBe(sum)
      // Размяна само ако е нужна — и никога автоматично
      const needs = carryCount(a, b) > 0
      const exchanges: string[] = []
      while (placeToExchange(s.result, visibleAddPlaces(t, s))) {
        expect(needs).toBe(true)
        const p = placeToExchange(s.result, visibleAddPlaces(t, s))!
        expect(addStepInstruction(t, s, 'model', '')).toMatch(/^Размени 10 /)
        // без размяната не може да се продължи
        expect(checkTask(t, s).status).toBe('incomplete')
        expect(canExchangeUp(s.result, p, visibleAddPlaces(t, s))).toBe(true)
        s = { ...s, result: exchangeUp(s.result, p, visibleAddPlaces(t, s)) }
        exchanges.push(`${p}`)
        expect(valueOf(s.result)).toBe(sum)
      }
      expect(exchanges.length > 0).toBe(needs)
      if (!needs) expect(addStepInstruction(t, s, 'model', '')).not.toMatch(/Размени/)
      expect(s.result).toEqual(countsOf(sum))
      expect(addStepInstruction(t, s, 'model', '')).toBe('Провери решението.')
      // моделът е готов → етап 2; резултатът още не се показва
      expect(checkTask(t, s).status).toBe('correct')
      const info = visibleInfo(t, s, false)
      expect(info.rowValues.result).toBe('?')
      expect(info.info).not.toContain(String(sum))
      // Етап 2: самостоятелно пресмятане
      expect(addStepInstruction(t, s, 'compute', '')).toBe('Пресметни и запиши отговора.')
      expect(addStepInstruction(t, s, 'compute', '1')).toBe('Провери решението.')
      expect(checkComputedAnswer(t, '').status).toBe('incomplete')
      for (const w of [sum - 1, sum + 1, sum + 10, sum - 10]) {
        if (w < 0) continue
        const r = checkComputedAnswer(t, String(w))
        expect(r.status).toBe('wrong')
        expect(r.message).toMatch(/Опитай отново|Провери размяната/)
        expect(r.message).not.toContain(String(sum))
      }
      // Етап 3: вярно
      expect(checkComputedAnswer(t, String(sum)).status).toBe('correct')
      expect(visibleInfo(t, s, true).info).toBe(`${a} + ${b} = ${sum}`)
    })
  }

  it('47 + 25: забравената размяна се разпознава', () => {
    expect(checkComputedAnswer(task(47, 25), '62').message).toBe('Не е вярно. Провери размяната.')
  })

  it('подсказките са кратки и показват размяна само при нужда', () => {
    const t = task(24, 13)
    const s = initialState(t)
    expect(hintFor(t, s).message).toBe('Премести десетиците в сбора.')
    const merged: AddState = { kind: 'add', a: emptyCounts(), b: emptyCounts(), result: { ...emptyCounts(), 10: 3, 1: 7 } as Counts }
    expect(hintFor(t, merged).message).toBe('Готово! Провери решението.')
    const t2 = task(38, 8)
    const m2: AddState = { kind: 'add', a: emptyCounts(), b: emptyCounts(), result: { ...emptyCounts(), 10: 3, 1: 16 } as Counts }
    expect(hintFor(t2, m2).message).toBe('Преброй единиците: 16. Размени 10 единици за 1 десетица.')
  })

  it('размяната е невъзможна без 10 жетона', () => {
    const t = task(30, 4)
    const s: AddState = { kind: 'add', a: emptyCounts(), b: emptyCounts(), result: countsOf(34) }
    expect(canExchangeUp(s.result, 1, visibleAddPlaces(t, s))).toBe(false)
    expect(placeToExchange(s.result, visibleAddPlaces(t, s))).toBeNull()
  })
})
