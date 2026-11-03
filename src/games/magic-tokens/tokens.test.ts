import { describe, expect, it } from 'vitest'
import { addWithTokens, borrowCount, borrowsThroughZero, carryCount, subtractWithTokens } from './arithmetic'
import { DIFFICULTIES, seededRng, type Difficulty } from './logic'
import {
  ExchangeError,
  canExchangeDown,
  canExchangeUp,
  countsOf,
  describeCounts,
  emptyCounts,
  exchangeDown,
  exchangeDownUntil,
  exchangeUp,
  isStandard,
  mergeCounts,
  normalizeUp,
  placesForMax,
  removeToken,
  valueOf,
  type Counts,
  type Place,
} from './placeValue'
import {
  CHALLENGE_KINDS,
  GRADE_RANGES,
  RANGES,
  answerOf,
  applicableOptions,
  checkTask,
  evalExpr,
  generatePair,
  generateTokenTasks,
  hintFor,
  initialState,
  relationOf,
  typicalMistake,
  type BoardState,
  type ChallengeKind,
  type RangeId,
  type Regrouping,
  type TokenTask,
  type TokensConfig,
} from './tasks'

const C = (o: Partial<Counts>): Counts => ({ ...emptyCounts(), ...o })

describe('разрядно представяне', () => {
  it('стандартен състав и стойност', () => {
    expect(countsOf(352)).toEqual(C({ 100: 3, 10: 5, 1: 2 }))
    expect(countsOf(10305)).toEqual(C({ 10000: 1, 100: 3, 1: 5 }))
    for (const n of [0, 7, 40, 99, 100, 999, 1000, 4500, 99999]) expect(valueOf(countsOf(n))).toBe(n)
    expect(() => countsOf(100000)).toThrow(RangeError)
    expect(() => countsOf(-1)).toThrow(RangeError)
  })

  it('разряди според обхвата', () => {
    expect(placesForMax(20)).toEqual([10, 1])
    expect(placesForMax(100)).toEqual([100, 10, 1])
    expect(placesForMax(1000)).toEqual([1000, 100, 10, 1])
    expect(placesForMax(99999)).toEqual([10000, 1000, 100, 10, 1])
  })

  it('описание на правилен български', () => {
    expect(describeCounts(countsOf(47))).toBe('4 десетици и 7 единици')
    expect(describeCounts(countsOf(311))).toBe('3 стотици, 1 десетица и 1 единица')
    expect(describeCounts(countsOf(21000))).toBe('2 десетици хиляди и 1 хиляда')
  })
})

describe('размяна на жетони', () => {
  it('10 единици = 1 десетица, 10 десетици = 1 стотица, 10 стотици = 1 хиляда', () => {
    expect(exchangeUp(C({ 1: 12 }), 1)).toEqual(C({ 10: 1, 1: 2 }))
    expect(exchangeUp(C({ 10: 10 }), 10)).toEqual(C({ 100: 1 }))
    expect(exchangeUp(C({ 100: 10, 1: 3 }), 100)).toEqual(C({ 1000: 1, 1: 3 }))
  })

  it('1 десетица = 10 единици, 1 стотица = 10 десетици, 1 хиляда = 10 стотици', () => {
    expect(exchangeDown(C({ 10: 1 }), 10)).toEqual(C({ 1: 10 }))
    expect(exchangeDown(C({ 100: 2 }), 100)).toEqual(C({ 100: 1, 10: 10 }))
    expect(exchangeDown(C({ 1000: 1 }), 1000)).toEqual(C({ 100: 10 }))
  })

  it('размяната запазва стойността', () => {
    const rng = seededRng(5)
    for (let i = 0; i < 500; i++) {
      let c = countsOf(Math.floor(rng() * 99999))
      const v = valueOf(c)
      for (let k = 0; k < 6; k++) {
        const p = ([10000, 1000, 100, 10] as Place[])[Math.floor(rng() * 4)]
        if (canExchangeDown(c, p, [10000, 1000, 100, 10, 1])) c = exchangeDown(c, p)
        expect(valueOf(c)).toBe(v)
      }
      expect(valueOf(normalizeUp(c).counts)).toBe(v)
      expect(isStandard(normalizeUp(c).counts)).toBe(true)
    }
  })

  it('не позволява невъзможни размени и премахване на несъществуващ жетон', () => {
    expect(canExchangeUp(C({ 1: 9 }), 1, [10, 1])).toBe(false)
    expect(() => exchangeUp(C({ 1: 9 }), 1)).toThrow(ExchangeError)
    expect(() => exchangeDown(C({ 10: 0 }), 10)).toThrow(ExchangeError)
    expect(() => exchangeDown(C({ 1: 5 }), 1)).toThrow(ExchangeError)
    // десетици → стотици не е разрешено, ако разрядът на стотиците липсва (обхват до 20)
    expect(canExchangeUp(C({ 10: 10 }), 10, [10, 1])).toBe(false)
    expect(() => removeToken(C({ 10: 0 }), 10)).toThrow(ExchangeError)
  })

  it('последователни размени през нулеви разряди', () => {
    // 305: трябват 8 единици → 1 стотица → 10 десетици → 1 десетица → 10 единици
    const r = exchangeDownUntil(countsOf(305), 1, 8)!
    expect(r.counts).toEqual(C({ 100: 2, 10: 9, 1: 15 }))
    expect(r.exchanges.map((e) => `${e.from}→${e.to}`)).toEqual(['100→10', '10→1'])
    // 1000 → нужни 3 единици: три последователни размени
    const t = exchangeDownUntil(countsOf(1000), 1, 3)!
    expect(t.counts).toEqual(C({ 100: 9, 10: 9, 1: 10 }))
    expect(t.exchanges).toHaveLength(3)
    // 10000 → 1 единица: четири размени
    expect(exchangeDownUntil(countsOf(10000), 1, 1)!.exchanges).toHaveLength(4)
    // невъзможно
    expect(exchangeDownUntil(countsOf(5), 1, 8)).toBeNull()
  })
})

describe('събиране и изваждане с жетони (примерите от заданието)', () => {
  it('48 + 27 = 75', () => {
    const r = addWithTokens(48, 27)
    expect(r.merged).toEqual(C({ 10: 6, 1: 15 }))
    expect(r.sum).toBe(75)
    expect(r.result).toEqual(countsOf(75))
    expect(r.exchanges).toEqual([{ from: 1, to: 10, direction: 'up' }])
  })

  it('196 + 108 = 304 (две размени)', () => {
    const r = addWithTokens(196, 108)
    expect(r.merged).toEqual(C({ 100: 2, 10: 9, 1: 14 }))
    expect(r.sum).toBe(304)
    expect(r.exchanges.map((e) => `${e.from}→${e.to}`)).toEqual(['1→10', '10→100'])
  })

  it('52 − 18 = 34', () => {
    const r = subtractWithTokens(52, 18)
    expect(r.difference).toBe(34)
    expect(r.remaining).toEqual(countsOf(34))
    expect(r.exchanges).toHaveLength(1)
  })

  it('100 − 47 = 53 (през нулата)', () => {
    const r = subtractWithTokens(100, 47)
    expect(r.difference).toBe(53)
    expect(r.exchanges.map((e) => `${e.from}→${e.to}`)).toEqual(['100→10', '10→1'])
    expect(borrowsThroughZero(100, 47)).toBe(true)
  })

  it('305 − 128 = 177 (през нулата)', () => {
    const r = subtractWithTokens(305, 128)
    expect(r.difference).toBe(177)
    expect(r.remaining).toEqual(countsOf(177))
    expect(borrowsThroughZero(305, 128)).toBe(true)
  })

  it('съвпада с обикновеното смятане за хиляди случайни двойки', () => {
    const rng = seededRng(11)
    for (let i = 0; i < 3000; i++) {
      const a = Math.floor(rng() * 50000)
      const b = Math.floor(rng() * 49999)
      expect(addWithTokens(a, b).sum).toBe(a + b)
      expect(isStandard(addWithTokens(a, b).result)).toBe(true)
      const [x, y] = a >= b ? [a, b] : [b, a]
      expect(subtractWithTokens(x, y).difference).toBe(x - y)
    }
  })

  it('брой преноси и заемания', () => {
    expect(carryCount(48, 27)).toBe(1)
    expect(carryCount(196, 108)).toBe(2)
    expect(carryCount(41, 27)).toBe(0)
    expect(borrowCount(52, 18)).toBe(1)
    expect(borrowCount(305, 128)).toBe(2)
    expect(borrowCount(57, 23)).toBe(0)
    expect(borrowsThroughZero(52, 18)).toBe(false)
    expect(() => borrowCount(5, 7)).toThrow(RangeError)
  })
})

// Пълно решаване на задача така, както би го направил ученик.
function solve(task: TokenTask): BoardState {
  const s = initialState(task)
  switch (s.kind) {
    case 'compose': {
      if (task.kind !== 'compose') throw new Error()
      if (task.topic === 'place') return { ...s, built: countsOf(task.target) }
      const built = countsOf(0)
      for (const p of task.places) if (task.fixed?.[p] !== undefined) built[p] = task.fixed[p]!
      const rest = task.target - valueOf(built)
      built[task.free!] = rest / task.free!
      return { ...s, built }
    }
    case 'otherWay': {
      if (task.kind !== 'otherWay') throw new Error()
      const c = countsOf(task.target)
      const p = task.places.find((q) => q > 1 && c[q] > 0)!
      return { ...s, built: exchangeDown(c, p) }
    }
    case 'missingMinuend':
      if (task.kind !== 'missingMinuend') throw new Error()
      return { ...s, built: countsOf(task.b + task.c) }
    case 'add': {
      if (task.kind !== 'add') throw new Error()
      return { kind: 'add', a: emptyCounts(), b: emptyCounts(), result: normalizeUp(mergeCounts(s.a, s.b), task.places).counts }
    }
    case 'subtract':
    case 'missingSubtrahend': {
      const a = task.kind === 'subtract' ? task.a : task.kind === 'missingSubtrahend' ? task.a : 0
      const b = task.kind === 'subtract' ? task.b : task.kind === 'missingSubtrahend' ? task.a - task.c : 0
      const r = subtractWithTokens(a, b)
      return { kind: s.kind, board: r.remaining, removed: countsOf(b) }
    }
    case 'missingAddend':
      if (task.kind !== 'missingAddend') throw new Error()
      return { ...s, added: countsOf(task.c - task.a) }
    case 'compare':
      if (task.kind !== 'compare') throw new Error()
      return { kind: 'compare', choice: relationOf(evalExpr(task.left), evalExpr(task.right)) }
    case 'findError':
      if (task.kind !== 'findError') throw new Error()
      return { kind: 'findError', choice: task.wrongIndex }
  }
}

const ALL_RANGES = Object.keys(RANGES) as RangeId[]
const REGROUPINGS: Regrouping[] = ['none', 'with', 'mixed']

describe('генериране и проверка на задачи', () => {
  it('всяка двойка спазва обхвата и изискването за преминаване', () => {
    for (const range of ALL_RANGES) {
      for (const difficulty of DIFFICULTIES) {
        const rng = seededRng(range.length * 31 + difficulty.length)
        for (let i = 0; i < 120; i++) {
          for (const op of ['+', '-'] as const) {
            for (const want of ['none', 'with'] as const) {
              const { a, b } = generatePair(op, range, want, difficulty, rng)
              expect(a).toBeGreaterThan(0)
              expect(b).toBeGreaterThan(0)
              if (op === '+') {
                expect(a + b).toBeLessThanOrEqual(RANGES[range].max)
                expect(carryCount(a, b) > 0).toBe(want === 'with')
              } else {
                expect(a - b).toBeGreaterThan(0)
                expect(a).toBeLessThanOrEqual(RANGES[range].max)
                expect(borrowCount(a, b) > 0).toBe(want === 'with')
              }
            }
          }
        }
      }
    }
  })

  it('„Откривател“ с преминаване — точно една размяна; „Майстор“ — поне две при 3+ цифри', () => {
    const rng = seededRng(77)
    for (let i = 0; i < 200; i++) {
      const e = generatePair('+', 'r1000', 'with', 'explorer', rng)
      expect(carryCount(e.a, e.b)).toBe(1)
      const m = generatePair('-', 'r1000', 'with', 'master', rng)
      expect(borrowCount(m.a, m.b)).toBeGreaterThanOrEqual(2)
    }
  })

  it('всички задачи във всички режими са решими и решението се приема', () => {
    let count = 0
    for (const grade of [2, 3, 4] as const) {
      for (const range of GRADE_RANGES[grade]) {
        for (const difficulty of DIFFICULTIES as Difficulty[]) {
          for (const regrouping of REGROUPINGS) {
            const configs: TokensConfig[] = [
              { grade, mode: 'compose', range, regrouping, difficulty, count: 8, composeTopic: 'place', challenge: 'mixed' },
              { grade, mode: 'compose', range, regrouping, difficulty, count: 8, composeTopic: 'regroup', challenge: 'mixed' },
              { grade, mode: 'add', range, regrouping, difficulty, count: 8, composeTopic: 'place', challenge: 'mixed' },
              { grade, mode: 'subtract', range, regrouping, difficulty, count: 8, composeTopic: 'place', challenge: 'mixed' },
              ...([...CHALLENGE_KINDS, 'mixed'] as (ChallengeKind | 'mixed')[]).map((challenge) => ({ grade, mode: 'challenge' as const, range, regrouping, difficulty, count: 6, composeTopic: 'place' as const, challenge })),
            ]
            for (const cfg of configs) {
              const tasks = generateTokenTasks(cfg, seededRng(count + 1))
              expect(tasks).toHaveLength(cfg.count)
              for (const t of tasks) {
                count++
                const res = checkTask(t, solve(t))
                expect(res.status, `${t.kind} ${JSON.stringify(t)} → ${res.message}`).toBe('correct')
                // началното състояние никога не е „вярно“
                expect(checkTask(t, initialState(t)).status).not.toBe('correct')
                // числата са в обхвата
                const ans = answerOf(t)
                if (typeof ans === 'number' && t.kind !== 'findError') expect(ans).toBeLessThanOrEqual(RANGES[range].max)
              }
            }
          }
        }
      }
    }
    expect(count).toBeGreaterThan(3000)
  })

  it('„Различни представяния“ имат единствено решение', () => {
    const tasks = generateTokenTasks({ grade: 3, mode: 'compose', range: 'r1000', regrouping: 'none', difficulty: 'researcher', count: 15, composeTopic: 'regroup', challenge: 'mixed' }, seededRng(3))
    for (const t of tasks) {
      if (t.kind !== 'compose' || !t.fixed || !t.free) throw new Error()
      // свободен е само един разряд — стойността му е определена еднозначно
      const fixedValue = t.places.filter((p) => p !== t.free).reduce((s, p) => s + p * (t.fixed![p] ?? 0), 0)
      expect((t.target - fixedValue) % t.free).toBe(0)
      expect(Object.keys(t.fixed)).not.toContain(String(t.free))
      // обичайното представяне НЕ е прието
      const std = countsOf(t.target)
      expect(checkTask(t, { kind: 'compose', built: std }).status).toBe('wrong')
    }
  })

  it('„Открий грешката“: точно един грешен пример', () => {
    const tasks = generateTokenTasks({ grade: 2, mode: 'challenge', range: 'r100', regrouping: 'with', difficulty: 'researcher', count: 15, composeTopic: 'place', challenge: 'findError' }, seededRng(9))
    for (const t of tasks) {
      if (t.kind !== 'findError') throw new Error()
      const wrongs = t.items.filter((e) => evalExpr(e) !== e.shown)
      expect(wrongs).toHaveLength(1)
      expect(evalExpr(t.items[t.wrongIndex])).not.toBe(t.items[t.wrongIndex].shown)
    }
    expect(typicalMistake('+', 48, 27, [10, 1])).toBe(65) // забравен пренос
    expect(typicalMistake('-', 52, 18, [10, 1])).toBe(46) // „по-малкото от по-голямото“
  })

  it('„Сравни“ — изразите се изчисляват вярно и се срещат и трите знака', () => {
    const tasks = generateTokenTasks({ grade: 3, mode: 'challenge', range: 'r100', regrouping: 'mixed', difficulty: 'researcher', count: 60, composeTopic: 'place', challenge: 'compare' }, seededRng(21))
    const seen = new Set(tasks.map((t) => (t.kind === 'compare' ? relationOf(evalExpr(t.left), evalExpr(t.right)) : '')))
    expect(seen).toEqual(new Set(['<', '=', '>']))
    for (const t of tasks) if (t.kind === 'compare') expect(evalExpr(t.right)).toBeGreaterThanOrEqual(0)
  })
})

describe('разнообразие на задачите', () => {
  it('„Майстор“ с преминаване: смес от кръгли умаляеми, заемане през нула и обикновени', () => {
    const rng = seededRng(42)
    let round = 0
    let zero = 0
    const N = 400
    for (let i = 0; i < N; i++) {
      const { a, b } = generatePair('-', 'r1000', 'with', 'master', rng)
      if (a === 1000) round++
      else if (borrowsThroughZero(a, b)) zero++
    }
    expect(round / N).toBeGreaterThan(0.12)
    expect(round / N).toBeLessThan(0.4)
    expect(zero).toBeGreaterThan(20)
    expect(N - round - zero).toBeGreaterThan(80)
  })

  it('серия от 10 задачи няма повторения', () => {
    const tasks = generateTokenTasks({ grade: 3, mode: 'subtract', range: 'r1000', regrouping: 'with', difficulty: 'master', count: 10, composeTopic: 'place', challenge: 'mixed' }, seededRng(8))
    expect(new Set(tasks.map((t) => (t.kind === 'subtract' ? `${t.a}-${t.b}` : ''))).size).toBe(10)
  })
})

describe('проверка на решения и подсказки', () => {
  const sub: TokenTask = { kind: 'subtract', id: 1, a: 305, b: 128, places: [1000, 100, 10, 1] }

  it('изваждане: отчита реалното останало количество', () => {
    // махнати 100 + 20 + 8 след размени → вярно
    let board = countsOf(305)
    board = exchangeDownUntil(board, 1, 8)!.counts
    const removed = countsOf(128)
    board = { ...board, 100: board[100] - 1, 10: board[10] - 2, 1: board[1] - 8 }
    expect(checkTask(sub, { kind: 'subtract', board, removed }).status).toBe('correct')
    // махнати повече
    expect(checkTask(sub, { kind: 'subtract', board: countsOf(305 - 130), removed: countsOf(130) }).message).toContain('повече')
    // жетони, които не съществуват, нарушават инварианта
    expect(checkTask(sub, { kind: 'subtract', board: countsOf(300), removed: countsOf(128) }).status).toBe('wrong')
  })

  it('изваждане: подсказките водят през нулите стъпка по стъпка', () => {
    const s = initialState(sub)
    if (s.kind !== 'subtract') throw new Error()
    expect(hintFor(sub, s).message).toBe('Нямаш десетици. Първо размени 1 стотица за 10 десетици.')
    const s2 = { ...s, board: exchangeDown(s.board, 100) }
    expect(hintFor(sub, s2).message).toBe('Нямаш достатъчно единици. Размени 1 десетица за 10 единици.')
    const s3 = { ...s2, board: exchangeDown(s2.board, 10) }
    expect(hintFor(sub, s3).message).toBe('Махни 8 единици.')
  })

  it('събиране: изисква обединяване и размяна', () => {
    const add: TokenTask = { kind: 'add', id: 1, a: 48, b: 27, places: [100, 10, 1] }
    const s = initialState(add)
    expect(checkTask(add, s).status).toBe('incomplete')
    const merged: BoardState = { kind: 'add', a: emptyCounts(), b: emptyCounts(), result: mergeCounts(countsOf(48), countsOf(27)) }
    const res = checkTask(add, merged)
    expect(res.status).toBe('wrong')
    expect(res.message).toBe('Имаш 15 единици. Размени 10 единици за 1 десетица.')
    expect(hintFor(add, merged).place).toBe(1)
    const done: BoardState = { kind: 'add', a: emptyCounts(), b: emptyCounts(), result: countsOf(75) }
    expect(checkTask(add, done).status).toBe('correct')
  })

  it('разряден състав: числото трябва да е в стандартен вид', () => {
    const t: TokenTask = { kind: 'compose', id: 1, target: 47, places: [100, 10, 1], topic: 'place' }
    expect(checkTask(t, { kind: 'compose', built: C({ 10: 3, 1: 17 }) }).status).toBe('wrong')
    expect(checkTask(t, { kind: 'compose', built: countsOf(47) }).status).toBe('correct')
    expect(hintFor(t, { kind: 'compose', built: C({ 10: 2 }) }).message).toBe('Добави 2 десетици.')
  })

  it('друг начин: приема всяко различно представяне', () => {
    const t: TokenTask = { kind: 'otherWay', id: 1, target: 47, places: [100, 10, 1] }
    expect(checkTask(t, { kind: 'otherWay', built: countsOf(47) }).status).toBe('wrong')
    expect(checkTask(t, { kind: 'otherWay', built: C({ 10: 3, 1: 17 }) }).status).toBe('correct')
    expect(checkTask(t, { kind: 'otherWay', built: C({ 1: 47 }) }).status).toBe('correct')
    expect(checkTask(t, { kind: 'otherWay', built: C({ 10: 3, 1: 16 }) }).status).toBe('wrong')
  })

  it('липсващо събираемо / умалител / умаляемо', () => {
    const ma: TokenTask = { kind: 'missingAddend', id: 1, a: 48, c: 75, places: [100, 10, 1] }
    expect(checkTask(ma, { kind: 'missingAddend', base: countsOf(48), added: countsOf(27) }).status).toBe('correct')
    expect(checkTask(ma, { kind: 'missingAddend', base: countsOf(48), added: countsOf(26) }).status).toBe('wrong')
    const ms: TokenTask = { kind: 'missingSubtrahend', id: 1, a: 52, c: 34, places: [100, 10, 1] }
    expect(checkTask(ms, { kind: 'missingSubtrahend', board: countsOf(34), removed: countsOf(18) }).status).toBe('correct')
    const mm: TokenTask = { kind: 'missingMinuend', id: 1, b: 47, c: 53, places: [100, 10, 1] }
    expect(checkTask(mm, { kind: 'missingMinuend', built: countsOf(100) }).status).toBe('correct')
    expect(checkTask(mm, { kind: 'missingMinuend', built: countsOf(90) }).status).toBe('wrong')
  })
})

describe('приложими настройки', () => {
  it('показват се само нужните опции', () => {
    expect(applicableOptions('compose', 'free', 'mixed')).toEqual({ composeTopic: true, challenge: false, range: false, regrouping: false })
    expect(applicableOptions('compose', 'place', 'mixed').regrouping).toBe(false)
    expect(applicableOptions('add', 'place', 'mixed')).toEqual({ composeTopic: false, challenge: false, range: true, regrouping: true })
    expect(applicableOptions('challenge', 'place', 'otherWay').regrouping).toBe(false)
    expect(applicableOptions('challenge', 'place', 'compare').regrouping).toBe(true)
  })
})
