import { describe, expect, it } from 'vitest'
import {
  DENOMINATIONS,
  DIFFICULTIES,
  GRADES,
  allowedDenominations,
  checkAnswer,
  conditionText,
  formatNumber,
  generateSession,
  generateTask,
  getLevelConfig,
  greedyDecompose,
  minTokenCount,
  nextHint,
  placeValueText,
  seededRng,
  starsForTask,
  sum,
  type Task,
} from './logic'

const RUNS = 400

describe('набори жетони', () => {
  it('съответстват на заданието', () => {
    expect(DENOMINATIONS[2]).toEqual([1, 2, 5, 10, 20])
    expect(DENOMINATIONS[3]).toEqual([1, 5, 10, 50, 100])
    expect(DENOMINATIONS[4]).toEqual([1, 10, 100, 1000, 10000])
  })

  it('алчното разлагане винаги дава минималния брой жетони (каноничен набор)', () => {
    for (const grade of GRADES) {
      const limit = grade === 4 ? 30000 : 1200
      for (let n = 1; n <= limit; n += grade === 4 ? 7 : 1) {
        const greedy = greedyDecompose(n, DENOMINATIONS[grade])!
        expect(sum(greedy)).toBe(n)
        expect(greedy.length).toBe(minTokenCount(n, DENOMINATIONS[grade]))
      }
    }
  })

  it('разлага 47 като 20 + 20 + 5 + 2', () => {
    expect(greedyDecompose(47, DENOMINATIONS[2])).toEqual([20, 20, 5, 2])
  })
})

describe('генериране на задачи', () => {
  for (const grade of GRADES) {
    for (const difficulty of DIFFICULTIES) {
      it(`${grade}. клас, ${difficulty}: всички задачи са в обхвата и са решими`, () => {
        const config = getLevelConfig(grade, difficulty)
        const rng = seededRng(grade * 100 + DIFFICULTIES.indexOf(difficulty))
        for (let i = 0; i < RUNS; i++) {
          const task = generateTask(config, rng, i)
          expect(task.target).toBeGreaterThanOrEqual(config.min)
          expect(task.target).toBeLessThanOrEqual(config.max)
          expect(Number.isInteger(task.target)).toBe(true)
          // Примерното решение е вярно и спазва условието.
          expect(sum(task.solution)).toBe(task.target)
          for (const v of task.solution) expect(allowedDenominations(task)).toContain(v)
          expect(checkAnswer(task, task.solution).status).toBe('correct')
          // Без условия решението остава удобно за ръчно подреждане.
          if (task.condition.kind === 'none') expect(task.solution.length).toBeLessThanOrEqual(config.maxTokens)
          if (difficulty !== 'master') expect(task.condition.kind).toBe('none')
        }
      })
    }
  }

  it('условията за „Майстор“ са коректни', () => {
    const seen = new Set<string>()
    for (const grade of GRADES) {
      const config = getLevelConfig(grade, 'master')
      const rng = seededRng(7 + grade)
      for (let i = 0; i < RUNS; i++) {
        const task = generateTask(config, rng, i)
        const c = task.condition
        seen.add(c.kind)
        if (c.kind === 'minTokens') {
          expect(c.count).toBe(minTokenCount(Math.min(task.target, 100000), task.denominations))
        }
        if (c.kind === 'exactCount') {
          expect(task.solution.length).toBe(c.count)
          expect(c.count).toBeGreaterThan(greedyDecompose(task.target, task.denominations)!.length)
        }
        if (c.kind === 'forbidden') {
          expect(c.value).not.toBe(1)
          expect(task.solution).not.toContain(c.value)
        }
      }
    }
    expect(seen).toEqual(new Set(['minTokens', 'exactCount', 'forbidden']))
  })

  it('серията има уникални числа и исканата дължина', () => {
    for (const count of [5, 10, 15]) {
      const tasks = generateSession(getLevelConfig(2, 'explorer'), count, seededRng(count))
      expect(tasks).toHaveLength(count)
      expect(new Set(tasks.map((t) => t.target)).size).toBe(count)
    }
  })

  it('4. клас стига до 100 000', () => {
    expect(getLevelConfig(4, 'master').max).toBe(100000)
    expect(greedyDecompose(100000, DENOMINATIONS[4])).toEqual(new Array(10).fill(10000))
  })
})

const task47: Task = { id: 1, target: 47, denominations: DENOMINATIONS[2], condition: { kind: 'none' }, solution: [20, 20, 5, 2] }

describe('проверка на отговора', () => {
  it('приема всяко вярно съставяне', () => {
    expect(checkAnswer(task47, [10, 10, 10, 10, 5, 2]).status).toBe('correct')
    expect(checkAnswer(task47, [20, 20, 5, 2]).status).toBe('correct')
    expect(checkAnswer(task47, new Array(47).fill(1)).status).toBe('correct')
  })

  it('разпознава по-малък, по-голям и празен сбор', () => {
    expect(checkAnswer(task47, []).status).toBe('empty')
    const under = checkAnswer(task47, [20, 20])
    expect(under.status).toBe('under')
    expect(under.message).toContain('още 7')
    const over = checkAnswer(task47, [20, 20, 10])
    expect(over.status).toBe('over')
    expect(over.message).toContain('3 повече')
    expect(checkAnswer(task47, [20], false).message).toBe('Сборът е по-малък от числото.')
  })

  it('спазва условията', () => {
    const min: Task = { ...task47, condition: { kind: 'minTokens', count: 4 } }
    expect(checkAnswer(min, [10, 10, 10, 10, 5, 2]).status).toBe('tooManyTokens')
    expect(checkAnswer(min, [20, 20, 5, 2]).status).toBe('correct')

    const exact: Task = { ...task47, condition: { kind: 'exactCount', count: 6 }, solution: [10, 10, 10, 10, 5, 2] }
    expect(checkAnswer(exact, [20, 20, 5, 2]).status).toBe('wrongCount')
    expect(checkAnswer(exact, [20, 10, 10, 5, 1, 1]).status).toBe('correct')

    const forbidden: Task = { ...task47, condition: { kind: 'forbidden', value: 20 }, solution: [10, 10, 10, 10, 5, 2] }
    expect(checkAnswer(forbidden, [20, 20, 5, 2]).status).toBe('forbiddenUsed')
    expect(checkAnswer(forbidden, [10, 10, 10, 10, 5, 2]).status).toBe('correct')
    expect(allowedDenominations(forbidden)).toEqual([1, 2, 5, 10])
  })
})

describe('подсказки', () => {
  it('предлагат следващ жетон и водят до решение', () => {
    for (const grade of GRADES) {
      for (const difficulty of DIFFICULTIES) {
        const rng = seededRng(99 + grade)
        for (let i = 0; i < 60; i++) {
          const task = generateTask(getLevelConfig(grade, difficulty), rng, i)
          const placed: number[] = []
          for (let step = 0; step < 60; step++) {
            const hint = nextHint(task, placed)
            if (hint.suggest === null) break
            placed.push(hint.suggest)
          }
          expect(checkAnswer(task, placed).status).toBe('correct')
        }
      }
    }
  })

  it('съветват да се махне жетон при надвишаване', () => {
    const hint = nextHint(task47, [20, 20, 10])
    expect(hint.remove).toBe(10)
    expect(hint.suggest).toBeNull()
  })

  it('продължават от произволно частично решение', () => {
    const hint = nextHint(task47, [10, 10, 10, 10])
    expect(hint.suggest).toBe(5)
    expect(hint.message).toContain('Остават 7')
  })
})

describe('текстове и форматиране', () => {
  it('позиционни стойности на правилен български', () => {
    expect(placeValueText(47)).toBe('47 = 4 десетици и 7 единици')
    expect(placeValueText(10)).toBe('10 = 1 десетица')
    expect(placeValueText(311)).toBe('311 = 3 стотици, 1 десетица и 1 единица')
    expect(placeValueText(21000)).toBe('21 000 = 2 десетици хиляди и 1 хиляда')
  })

  it('числата се групират по правописа', () => {
    expect(formatNumber(4500)).toBe('4500')
    expect(formatNumber(10000)).toBe('10 000')
    expect(formatNumber(100000)).toBe('100 000')
  })

  it('текстове на условията', () => {
    expect(conditionText({ kind: 'none' })).toBeNull()
    expect(conditionText({ kind: 'exactCount', count: 5 })).toBe('Използвай точно 5 жетона.')
    expect(conditionText({ kind: 'forbidden', value: 10000 })).toBe('Без жетон 10 000!')
  })

  it('звезди', () => {
    expect(starsForTask(0, false)).toBe(3)
    expect(starsForTask(0, true)).toBe(2)
    expect(starsForTask(1, false)).toBe(2)
    expect(starsForTask(3, true)).toBe(1)
  })
})
