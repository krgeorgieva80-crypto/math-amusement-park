import { describe, expect, it } from 'vitest'
import { addWithTokens, digitAt, subtractWithTokens } from './arithmetic'
import { visibleAddPlaces, type AddTask } from './addition'
import { checkComputedAnswer, visibleInfo, type ArithTask } from './compute'
import {
  canExchangeDown,
  canExchangeUp,
  countsOf,
  describeCounts,
  emptyCounts,
  exchangeDown,
  exchangeUp,
  mergeCounts,
  removeToken,
  valueOf,
  type Counts,
  type Place,
} from './placeValue'
import { checkTask, hintFor, initialState, rangePlaces, type BoardState } from './tasks'

type SubState = Extract<BoardState, { kind: 'subtract' }>
const C = (o: Partial<Counts>): Counts => ({ ...emptyCounts(), ...o })

describe('63 + 18 = 81', () => {
  const t: AddTask = { kind: 'add', id: 1, a: 63, b: 18, places: rangePlaces('r100') }

  it('групиране, обединяване и размяна 10 единици → 1 десетица', () => {
    expect(countsOf(63)).toEqual(C({ 10: 6, 1: 3 }))
    expect(countsOf(18)).toEqual(C({ 10: 1, 1: 8 }))
    const merged = mergeCounts(countsOf(63), countsOf(18))
    expect(merged).toEqual(C({ 10: 7, 1: 11 }))
    expect(valueOf(merged)).toBe(81)
    const s: BoardState = { kind: 'add', a: emptyCounts(), b: emptyCounts(), result: merged }
    // без размяна не се продължава
    expect(checkTask(t, s).status).toBe('incomplete')
    const places = visibleAddPlaces(t, s)
    expect(places).toEqual([10, 1])
    expect(canExchangeUp(merged, 1, places)).toBe(true)
    const swapped = exchangeUp(merged, 1, places)
    expect(swapped).toEqual(C({ 10: 8, 1: 1 }))
    expect(valueOf(swapped)).toBe(81)
    expect(checkTask(t, { ...s, result: swapped }).status).toBe('correct')
    expect(addWithTokens(63, 18).sum).toBe(81)
    expect(checkComputedAnswer(t, '81').status).toBe('correct')
    expect(checkComputedAnswer(t, '71').status).toBe('wrong') // забравена размяна
  })
})

/**
 * Изваждане така, както го прави ученикът: от единиците нагоре, с размяна
 * 1 → 10 при нужда (и през нулите), след това махане в „Махнати“.
 * Връща всяка стъпка, за да се провери, че стойността на дъската плюс
 * махнатите винаги е равна на умаляемото.
 */
function solveSubtraction(task: ArithTask) {
  let s = initialState(task) as SubState
  const log: string[] = []
  const places = task.places
  for (const p of [...places].reverse()) {
    const need = digitAt(task.b, p)
    while (s.board[p] < need) {
      // най-близкият по-горен разряд с жетони; размяната е само към съседния
      let q = (p * 10) as Place
      while (s.board[q] === 0) q = (q * 10) as Place
      while (q !== p) {
        expect(canExchangeDown(s.board, q, places)).toBe(true)
        const before = valueOf(s.board)
        s = { ...s, board: exchangeDown(s.board, q, places) }
        expect(valueOf(s.board)).toBe(before) // размяната не променя стойността
        expect(valueOf(s.board) + valueOf(s.removed)).toBe(task.a)
        log.push(`1 ${q} → 10 ${q / 10}`)
        // докато нищо не е махнато, представянето се показва с началното число
        if (valueOf(s.removed) === 0) {
          const info = visibleInfo(task, s, false)
          expect(info.rowValues.board).toBe(String(task.a))
          expect(info.info).toContain(`Имаш ${task.a} = `)
          expect(info.info).toContain(describeCounts(s.board, places.filter((x) => x <= Math.max(10, task.a)), true))
        }
        q = (q / 10) as Place
      }
    }
    for (let k = 0; k < need; k++) {
      s = { ...s, board: removeToken(s.board, p), removed: { ...s.removed, [p]: s.removed[p] + 1 } }
      expect(valueOf(s.board) + valueOf(s.removed)).toBe(task.a)
    }
    if (need) log.push(`махни ${need}×${p}`)
  }
  return { s, log }
}

const SUB_CASES: [number, number, number, Parameters<typeof rangePlaces>[0], string[]][] = [
  [25, 19, 6, 'r100', ['1 10 → 10 1', 'махни 9×1', 'махни 1×10']],
  [61, 52, 9, 'r100', ['1 10 → 10 1', 'махни 2×1', 'махни 5×10']],
  [100, 71, 29, 'r100', ['1 100 → 10 10', '1 10 → 10 1', 'махни 1×1', 'махни 7×10']],
  [100, 47, 53, 'r100', ['1 100 → 10 10', '1 10 → 10 1', 'махни 7×1', 'махни 4×10']],
  [305, 128, 177, 'r1000', ['1 100 → 10 10', '1 10 → 10 1', 'махни 8×1', 'махни 2×10', 'махни 1×100']],
]

describe('изваждане: групиране, размяна и махане', () => {
  for (const [a, b, diff, range, expectedLog] of SUB_CASES) {
    it(`${a} − ${b} = ${diff}`, () => {
      const task: ArithTask = { kind: 'subtract', id: 1, a, b, places: rangePlaces(range) }
      const s0 = initialState(task) as SubState
      // началното количество е представено правилно
      expect(s0.board).toEqual(countsOf(a))
      const start = visibleInfo(task, s0, false)
      expect(start.rowLabels?.board).toBe('Имаш')
      expect(start.rowValues.board).toBe(String(a))
      // моделът се завършва и всяка стъпка запазва стойността
      const { s, log } = solveSubtraction(task)
      expect(log).toEqual(expectedLog)
      expect(valueOf(s.board)).toBe(diff)
      expect(valueOf(s.removed)).toBe(b)
      expect(s.board).toEqual(subtractWithTokens(a, b).remaining)
      expect(checkTask(task, s).status).toBe('correct')
      // при „Пресметни“ останалите жетони са на дъската, но числото не е изписано
      const mid = visibleInfo(task, s, false)
      expect(mid.rowLabels?.board).toBe('Остават')
      expect(mid.rowValues.board).toBe('?')
      const shown = [mid.info, ...Object.values(mid.rowValues)].join(' | ')
      expect(shown).not.toMatch(new RegExp(`(^|\\D)${diff}(\\D|$)`))
      // ученикът сам въвежда отговора
      expect(checkComputedAnswer(task, '').status).toBe('incomplete')
      expect(checkComputedAnswer(task, String(diff + 1)).status).toBe('wrong')
      expect(checkComputedAnswer(task, String(diff)).status).toBe('correct')
      expect(visibleInfo(task, s, true).info).toBe(`${a} − ${b} = ${diff}`)
    })
  }

  it('100 − 71: представянето след размяна е „0 стотици, 9 десетици и 10 единици“', () => {
    const task: ArithTask = { kind: 'subtract', id: 1, a: 100, b: 71, places: rangePlaces('r100') }
    let board = countsOf(100)
    board = exchangeDown(board, 100)
    expect(visibleInfo(task, { kind: 'subtract', board, removed: emptyCounts() }, false).info).toBe('Имаш 100 = 0 стотици, 10 десетици и 0 единици')
    board = exchangeDown(board, 10)
    expect(valueOf(board)).toBe(100)
    expect(visibleInfo(task, { kind: 'subtract', board, removed: emptyCounts() }, false).info).toBe('Имаш 100 = 0 стотици, 9 десетици и 10 единици')
  })

  it('невалидни размени и махания са невъзможни', () => {
    const places = rangePlaces('r100')
    // няма десетица → няма размяна
    expect(canExchangeDown(C({ 1: 5 }), 10, places)).toBe(false)
    expect(() => exchangeDown(C({ 1: 5 }), 10, places)).toThrow()
    // единиците нямат по-долен разряд
    expect(canExchangeDown(C({ 1: 5 }), 1, places)).toBe(false)
    // не може да се махне несъществуващ жетон
    expect(() => removeToken(C({ 10: 2 }), 1)).toThrow()
    // махнато повече от умалителя → грешка, а не успех
    const task: ArithTask = { kind: 'subtract', id: 1, a: 25, b: 19, places }
    expect(checkTask(task, { kind: 'subtract', board: C({ 1: 5 }), removed: C({ 10: 2 }) }).status).toBe('wrong')
  })

  it('подсказките водят през размяната към махане', () => {
    const task: ArithTask = { kind: 'subtract', id: 1, a: 100, b: 71, places: rangePlaces('r100') }
    const s = initialState(task) as SubState
    expect(hintFor(task, s).message).toBe('Нямаш десетици. Първо размени 1 стотица за 10 десетици.')
  })
})
