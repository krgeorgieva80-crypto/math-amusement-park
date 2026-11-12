import { describe, expect, it } from 'vitest'
import {
  BEARS,
  FIXED_PHRASES,
  MANY_MIN,
  allFeedPhrases,
  feedReducer,
  hintFor,
  instructionId,
  instructionText,
  isCorrect,
  makeTasks,
  newGame,
  plan,
  seeded,
  type BearId,
  type FeedState,
  type FeedTask,
} from './logic'

const plates = (big = 0, mid = 0, small = 0): Record<BearId, number> => ({ big, mid, small })

describe('Нахрани трите мечета — задачи', () => {
  it('3–5 задачи с постепенно усложняване', () => {
    expect(plan(3)).toEqual(['one', 'two', 'three'])
    expect(plan(4)).toEqual(['one', 'each', 'two', 'three'])
    expect(plan(5)).toEqual(['one', 'many', 'each', 'two', 'three'])
    expect(makeTasks(1, seeded(1))).toHaveLength(3)
    expect(makeTasks(9, seeded(1))).toHaveLength(5)
  })

  it('количествата са в обхвата до 3 („много“ е повече от три) и в кошничката има достатъчно', () => {
    for (let seed = 1; seed < 300; seed++)
      for (const n of [3, 4, 5]) {
        for (const t of makeTasks(n, seeded(seed))) {
          if (t.kind === 'many') expect(t.need).toBe(MANY_MIN)
          else {
            expect(t.need).toBeGreaterThanOrEqual(1)
            expect(t.need).toBeLessThanOrEqual(3)
          }
          const total = t.kind === 'each' ? 3 : t.need
          expect(t.basket).toBeGreaterThan(total)
          expect(t.kind === 'each' ? t.bear === null : BEARS.includes(t.bear!)).toBe(true)
        }
      }
  })

  it('съседни задачи не повтарят същото мече и същия плод', () => {
    for (let seed = 1; seed < 200; seed++) {
      const ts = makeTasks(5, seeded(seed))
      for (let i = 1; i < ts.length; i++) expect(ts[i].fruit).not.toBe(ts[i - 1].fruit)
      const withBear = ts.filter((t) => t.bear)
      for (let i = 1; i < withBear.length; i++) expect(withBear[i].bear).not.toBe(withBear[i - 1].bear)
    }
  })
})

describe('Нахрани трите мечета — инструкции', () => {
  it('граматически правилни изречения', () => {
    const t = (o: Partial<FeedTask>): FeedTask => ({ kind: 'one', fruit: 'apple', bear: 'big', need: 1, basket: 3, ...o })
    expect(instructionText(t({}))).toBe('Дай на голямото мече една ябълка.')
    expect(instructionText(t({ kind: 'two', need: 2, fruit: 'pear', bear: 'mid' }))).toBe('Дай на средното мече две круши.')
    expect(instructionText(t({ kind: 'three', need: 3, fruit: 'strawberry', bear: 'small' }))).toBe('Дай на малкото мече три ягоди.')
    expect(instructionText(t({ kind: 'many', need: MANY_MIN, fruit: 'apple', bear: 'small' }))).toBe('Дай на малкото мече много ябълки.')
    expect(instructionText(t({ kind: 'each', bear: null, fruit: 'strawberry' }))).toBe('Дай на всяко мече по една ягода.')
  })

  it('всяка възможна инструкция има фраза за запис; идентификаторите са уникални', () => {
    const all = allFeedPhrases()
    const ids = all.map((p) => p.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (let seed = 1; seed < 100; seed++) for (const task of makeTasks(5, seeded(seed))) expect(ids).toContain(instructionId(task))
    // 3 плода × (3 мечета × 4 вида + „всяко“) + постоянни фрази
    expect(all.length).toBe(3 * (3 * 4 + 1) + 13 + 7)
  })
})

describe('Нахрани трите мечета — проверка', () => {
  const T = (o: Partial<FeedTask>): FeedTask => ({ kind: 'two', fruit: 'apple', bear: 'mid', need: 2, basket: 4, ...o })

  it('точно количество за посоченото мече, другите — без лакомства', () => {
    expect(isCorrect(T({}), plates(0, 2, 0))).toBe(true)
    expect(isCorrect(T({}), plates(0, 1, 0))).toBe(false)
    expect(isCorrect(T({}), plates(0, 3, 0))).toBe(false)
    expect(isCorrect(T({}), plates(1, 2, 0))).toBe(false)
  })

  it('по едно на всяко мече (едно към едно)', () => {
    const t = T({ kind: 'each', bear: null, need: 1 })
    expect(isCorrect(t, plates(1, 1, 1))).toBe(true)
    expect(isCorrect(t, plates(2, 1, 0))).toBe(false)
    expect(hintFor(t, plates(2, 1, 0))).toBe('each')
  })

  describe('„едно“ и „много“ (първа група)', () => {
    const many = T({ kind: 'many', bear: 'big', need: MANY_MIN, basket: 7 })
    const one = T({ kind: 'one', bear: 'mid', need: 1, basket: 3 })
    const after = (t: FeedTask, n: number) => {
      let s = newGame([t])
      for (let k = 0; k < n; k++) s = feedReducer(s, { type: 'give', bear: t.bear! })
      return feedReducer(s, { type: 'check', hintsOn: true })
    }

    it('„много“ е две или повече (MANY_MIN = 2)', () => expect(MANY_MIN).toBe(2))
    it('0 плода → неуспех с подсказка', () => {
      const s = after(many, 0)
      expect(s.phase).toBe('play')
      expect(s.hint).toBe('many')
    })
    it('1 плод → подсказка „Добави още плодчета, за да станат много.“', () => {
      const s = after(many, 1)
      expect(s.phase).toBe('play')
      expect(s.hint).toBe('manyOne')
      expect(FIXED_PHRASES.find((p) => p.id === 'feed.hint.many.one')?.text).toBe('Добави още плодчета, за да станат много.')
    })
    it('2 плода → успех', () => expect(after(many, 2).phase).toBe('success'))
    it('3 плода → успех', () => expect(after(many, 3).phase).toBe('success'))
    it('всички налични плодове → успех', () => {
      const s = after(many, 7)
      expect(s.basket).toBe(0)
      expect(s.phase).toBe('success')
    })
    it('останали плодове в кошничката след успех → допустимо', () => {
      for (const n of [2, 3, 4, 5, 6]) {
        const s = after(many, n)
        expect(s.phase).toBe('success')
        expect(s.basket).toBe(7 - n)
      }
    })
    it('плодове при друго мече не се приемат и при „много“', () => {
      let s = newGame([many])
      s = feedReducer(s, { type: 'give', bear: 'big' })
      s = feedReducer(s, { type: 'give', bear: 'big' })
      s = feedReducer(s, { type: 'give', bear: 'small' })
      s = feedReducer(s, { type: 'check', hintsOn: true })
      expect(s.phase).toBe('play')
      expect(s.hint).toBe('bear')
    })
    it('„едно“ остава точно един плод', () => {
      expect(after(one, 0).phase).toBe('play')
      expect(after(one, 1).phase).toBe('success')
      expect(after(one, 2).phase).toBe('play')
      expect(after(one, 2).hint).toBe('less')
    })
    it('точните количества 2 и 3 и „по едно“ не са променени', () => {
      const two = T({ kind: 'two', bear: 'small', need: 2, basket: 4 })
      const three = T({ kind: 'three', bear: 'big', need: 3, basket: 5 })
      expect([1, 2, 3].map((n) => after(two, n).phase)).toEqual(['play', 'success', 'play'])
      expect([2, 3, 4].map((n) => after(three, n).phase)).toEqual(['play', 'success', 'play'])
      const each = T({ kind: 'each', bear: null, need: 1, basket: 4 })
      expect(isCorrect(each, plates(1, 1, 1))).toBe(true)
      expect(isCorrect(each, plates(2, 1, 1))).toBe(false)
    })
    it('цяла игра с различни допустими количества за „много“: похвала и преминаване', () => {
      for (const n of [2, 3, 7]) {
        let s = newGame(makeTasks(5, seeded(11)))
        for (let i = 0; i < 5; i++) {
          const t = s.tasks[s.index]
          const give = t.kind === 'each' ? BEARS.map((b) => [b, 1] as const) : [[t.bear!, t.kind === 'many' ? n : t.need] as const]
          for (const [b, k] of give) for (let j = 0; j < k; j++) s = feedReducer(s, { type: 'give', bear: b })
          s = feedReducer(s, { type: 'check', hintsOn: true })
          expect(s.phase).toBe('success')
          s = feedReducer(s, { type: 'next' })
        }
        expect(s.phase).toBe('done')
        expect(s.firstTry).toBe(5)
      }
    })
  })

  it('подсказки: друго мече, още, по-малко', () => {
    expect(hintFor(T({}), plates(1, 0, 0))).toBe('bear')
    expect(hintFor(T({}), plates(0, 1, 0))).toBe('more')
    expect(hintFor(T({}), plates(0, 3, 0))).toBe('less')
  })
})

describe('Нахрани трите мечета — ход на играта', () => {
  const solve = (s: FeedState) => {
    const t = s.tasks[s.index]
    const targets = t.kind === 'each' ? BEARS : [t.bear!]
    for (const b of targets) for (let k = 0; k < (t.kind === 'each' ? 1 : t.need); k++) s = feedReducer(s, { type: 'give', bear: b })
    return s
  }

  it('цялата игра от първия опит', () => {
    let s = newGame(makeTasks(5, seeded(7)))
    for (let i = 0; i < 5; i++) {
      s = solve(s)
      s = feedReducer(s, { type: 'check', hintsOn: true })
      expect(s.phase).toBe('success')
      s = feedReducer(s, { type: 'next' })
    }
    expect(s.phase).toBe('done')
    expect(s.firstTry).toBe(5)
    expect(s.hinted).toBe(0)
  })

  it('грешка → подсказка и нов опит; без наказание', () => {
    let s = newGame([{ kind: 'two', fruit: 'pear', bear: 'small', need: 2, basket: 4 }])
    s = feedReducer(s, { type: 'give', bear: 'small' })
    s = feedReducer(s, { type: 'check', hintsOn: true })
    expect(s.phase).toBe('play')
    expect(s.hint).toBe('more')
    expect(s.plates.small).toBe(1) // поставеното остава — детето продължава
    s = feedReducer(s, { type: 'give', bear: 'small' })
    s = feedReducer(s, { type: 'check', hintsOn: true })
    expect(s.phase).toBe('success')
    expect(s.firstTry).toBe(0)
    expect(s.hinted).toBe(1)
  })

  it('без подсказки при изключени визуални подсказки', () => {
    let s = newGame([{ kind: 'one', fruit: 'apple', bear: 'big', need: 1, basket: 3 }])
    s = feedReducer(s, { type: 'check', hintsOn: false })
    expect(s.hint).toBeNull()
    expect(s.wrong).toBe(1)
  })

  it('кошничката не може да даде повече, отколкото има; връщане обратно', () => {
    let s = newGame([{ kind: 'one', fruit: 'apple', bear: 'big', need: 1, basket: 3 }])
    for (let i = 0; i < 6; i++) s = feedReducer(s, { type: 'give', bear: 'mid' })
    expect(s.basket).toBe(0)
    expect(s.plates.mid).toBe(3)
    s = feedReducer(s, { type: 'takeBack', bear: 'mid' })
    expect(s.basket).toBe(1)
    expect(s.plates.mid).toBe(2)
    s = feedReducer(s, { type: 'takeBack', bear: 'big' })
    expect(s.plates.big).toBe(0)
  })
})
