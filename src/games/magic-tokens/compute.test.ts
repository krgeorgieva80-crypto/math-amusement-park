import { describe, expect, it } from 'vitest'
import { addWithTokens, subtractWithTokens } from './arithmetic'
import {
  backspace,
  checkComputedAnswer,
  columnSteps,
  computeHint,
  expressionText,
  firstStage,
  hasComputeStage,
  hasModelStage,
  resultFromSteps,
  typeDigit,
  visibleInfo,
  type ArithTask,
} from './compute'
import { formatNumber, seededRng } from './logic'
import { countsOf, exchangeDownUntil, exchangeUp, mergeCounts, normalizeUp, removeToken, valueOf, emptyCounts, type Place } from './placeValue'
import { generateTokenTasks, initialState, type BoardState } from './tasks'

const P3: Place[] = [1000, 100, 10, 1]
const sub = (a: number, b: number): ArithTask => ({ kind: 'subtract', id: 1, a, b, places: P3 })
const add = (a: number, b: number): ArithTask => ({ kind: 'add', id: 1, a, b, places: P3 })

const CASES: [ArithTask, number][] = [
  [sub(34, 4), 30],
  [sub(52, 18), 34],
  [sub(100, 47), 53],
  [add(48, 27), 75],
  [add(196, 108), 304],
  [sub(305, 128), 177],
]

describe('шестте случая от заданието', () => {
  for (const [task, expected] of CASES) {
    const label = expressionText(task) + ' ' + expected
    it(label, () => {
      // жетоните представят правилно числата
      expect(valueOf(countsOf(task.a))).toBe(task.a)
      expect(valueOf(countsOf(task.b))).toBe(task.b)
      // моделът с жетони дава същия резултат
      const r = task.kind === 'add' ? addWithTokens(task.a, task.b).sum : subtractWithTokens(task.a, task.b).difference
      expect(r).toBe(expected)
      // писменото пресмятане по разряди дава същия резултат
      expect(resultFromSteps(columnSteps(task.kind === 'add' ? '+' : '-', task.a, task.b))).toBe(expected)
      // ученикът въвежда отговора цифра по цифра
      let input = ''
      for (const d of String(expected)) input = typeDigit(input, d)
      expect(checkComputedAnswer(task, input).status).toBe('correct')
      // грешните отговори не се приемат
      for (const wrong of [expected + 1, expected - 1, expected + 10, 0]) {
        if (wrong === expected || wrong < 0) continue
        expect(checkComputedAnswer(task, String(wrong)).status).toBe('wrong')
      }
    })
  }

  it('34 − 4: махаме 4 единици, без размяна', () => {
    const r = subtractWithTokens(34, 4)
    expect(r.exchanges).toHaveLength(0)
    expect(r.remaining).toEqual(countsOf(30))
  })
})

describe('размяната запазва стойността по време на модела', () => {
  it('събиране 196 + 108: обединяване и две размени', () => {
    let c = mergeCounts(countsOf(196), countsOf(108))
    expect(valueOf(c)).toBe(304)
    c = exchangeUp(c, 1)
    expect(valueOf(c)).toBe(304)
    c = exchangeUp(c, 10)
    expect(valueOf(c)).toBe(304)
    expect(c).toEqual(countsOf(304))
  })

  it('изваждане 305 − 128: размяна през нулата и махане', () => {
    let board = countsOf(305)
    const step = exchangeDownUntil(board, 1, 8)!
    expect(valueOf(step.counts)).toBe(305)
    board = step.counts
    board = removeToken(removeToken(removeToken(board, 100), 10, 2), 1, 8)
    expect(valueOf(board)).toBe(177)
  })

  it('случайни размени никога не променят стойността', () => {
    const rng = seededRng(4)
    for (let i = 0; i < 300; i++) {
      const n = Math.floor(rng() * 99999)
      const merged = mergeCounts(countsOf(n), emptyCounts())
      expect(valueOf(normalizeUp(merged).counts)).toBe(n)
    }
  })
})

describe('въвеждане на отговора', () => {
  it('цифрова клавиатура', () => {
    expect(typeDigit('', '3')).toBe('3')
    expect(typeDigit('3', '0')).toBe('30')
    expect(typeDigit('0', '7')).toBe('7') // без водеща нула
    expect(typeDigit('12', 'a')).toBe('12') // само цифри
    expect(typeDigit('123456', '7')).toBe('123456') // най-много 6 цифри
    expect(backspace('304')).toBe('30')
    expect(backspace('')).toBe('')
  })

  it('празен или невалиден отговор не се приема', () => {
    expect(checkComputedAnswer(add(48, 27), '').status).toBe('incomplete')
    expect(checkComputedAnswer(add(48, 27), '7a').status).toBe('wrong')
  })

  it('съобщенията при грешка не издават верния отговор', () => {
    for (const [task, expected] of CASES) {
      for (const wrong of ['1', '999', String(expected + 10)]) {
        const msg = checkComputedAnswer(task, wrong).message
        expect(msg).not.toContain(String(expected))
        expect(msg).not.toContain(formatNumber(expected))
      }
    }
  })

  it('разпознава забравен пренос и „по-малкото от по-голямото“', () => {
    expect(checkComputedAnswer(add(48, 27), '65').message).toBe('Не е вярно. Провери размяната.')
    expect(checkComputedAnswer(sub(52, 18), '46').message).toContain('заемеш')
  })

  it('без подсказки съобщенията са кратки', () => {
    expect(checkComputedAnswer(add(48, 27), '65', false).message).toBe('Не е вярно. Опитай отново.')
    expect(checkComputedAnswer(sub(52, 18), '46', false).message).toBe('Отговорът не е верен. Пресметни още веднъж.')
  })
})

describe('подсказки при пресмятане', () => {
  it('без жетони — първата стъпка, но не целия резултат', () => {
    expect(computeHint(add(48, 27), null, 0)).toBe('Събери единиците: 8 + 7 = 15. Запиши 5, пренеси 1.')
    expect(computeHint(sub(52, 18), null, 0)).toBe('Започни от единици: 2 − 8 не може. Заеми 1 от следващия разряд: 12 − 8 = 4.')
    for (const [task, expected] of CASES) {
      if (expected >= 10) expect(computeHint(task, null, 0)).not.toContain(String(expected))
    }
  })

  it('с жетони — насочва към дъската', () => {
    expect(computeHint(add(48, 27), countsOf(75), 0)).toBe('Преброй десетиците и единиците.')
    expect(computeHint(add(48, 27), countsOf(75), 1)).toBe('Имаш 7 десетици и 5 единици.')
    expect(computeHint(sub(52, 18), countsOf(34), 0)).toBe('Погледни жетоните на дъската. Колко има във всеки разряд?')
  })
})

describe('резултатът не се разкрива преди проверката', () => {
  const state = (task: ArithTask): BoardState => initialState(task)
  for (const [task, expected] of CASES) {
    it(expressionText(task), () => {
      const s = state(task)
      const before = visibleInfo(task, s, false)
      const shown = [before.info, ...Object.values(before.rowValues)].join(' | ')
      expect(shown).not.toMatch(new RegExp(`(^|\\D)${expected}(\\D|$)`))
      expect(before.rowValues.result ?? before.rowValues.board).toBe('?')
      // дори когато моделът е завършен
      const done: BoardState =
        task.kind === 'add'
          ? { kind: 'add', a: emptyCounts(), b: emptyCounts(), result: countsOf(expected) }
          : { kind: 'subtract', board: countsOf(expected), removed: countsOf(task.b) }
      const mid = visibleInfo(task, done, false)
      expect([mid.info, ...Object.values(mid.rowValues)].join(' | ')).not.toMatch(new RegExp(`(^|\\D)${expected}(\\D|$)`))
      // след правилна проверка се показва пълният запис
      expect(visibleInfo(task, done, true).info).toBe(`${formatNumber(task.a)} ${task.kind === 'add' ? '+' : '−'} ${formatNumber(task.b)} = ${formatNumber(expected)}`)
    })
  }
})

describe('етапи според начина на работа', () => {
  it('събиране и изваждане', () => {
    const t = add(48, 27)
    expect([hasModelStage(t, 'tokensAndCompute'), hasComputeStage(t, 'tokensAndCompute')]).toEqual([true, true])
    expect([hasModelStage(t, 'computeOnly'), hasComputeStage(t, 'computeOnly')]).toEqual([false, true])
    expect([hasModelStage(t, 'tokensOnly'), hasComputeStage(t, 'tokensOnly')]).toEqual([true, false])
    expect(firstStage(t, 'computeOnly')).toBe('compute')
    expect(firstStage(t, 'tokensAndCompute')).toBe('model')
  })

  it('другите режими не се променят', () => {
    const [t] = generateTokenTasks({ grade: 2, mode: 'compose', range: 'r100', regrouping: 'none', difficulty: 'explorer', count: 1, composeTopic: 'place', challenge: 'mixed' }, seededRng(1))
    expect(hasComputeStage(t, 'tokensAndCompute')).toBe(false)
    expect(hasModelStage(t, 'computeOnly')).toBe(true)
  })

  it('стъпките по разряди са верни за хиляди случайни задачи', () => {
    const rng = seededRng(12)
    for (let i = 0; i < 2000; i++) {
      const a = Math.floor(rng() * 50000)
      const b = Math.floor(rng() * 49999)
      expect(resultFromSteps(columnSteps('+', a, b))).toBe(a + b)
      const [x, y] = a >= b ? [a, b] : [b, a]
      expect(resultFromSteps(columnSteps('-', x, y))).toBe(x - y)
    }
  })
})
