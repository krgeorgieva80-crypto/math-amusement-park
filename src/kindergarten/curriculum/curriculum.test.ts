import { describe, expect, it } from 'vitest'
import { ACTIVITIES, activitiesFor } from './activities'
import { AGE_GROUPS, CORES, KG_ATTRACTIONS, attractionOfCore } from './structure'

describe('Приказен парк — образователна структура', () => {
  it('четири възрастови групи с възрастите от заданието', () => {
    expect(AGE_GROUPS.map((g) => `${g.name} – ${g.ages}`)).toEqual(['Първа група – 3–4 години', 'Втора група – 4–5 години', 'Трета група – 5–6 години', 'Четвърта група – 6–7 години'])
  })

  it('пет образователни ядра и по една атракция за всяко', () => {
    expect(CORES.map((c) => c.name)).toEqual(['Количествени отношения', 'Измерване', 'Пространствени отношения', 'Времеви отношения', 'Геометрични фигури и форми'])
    expect(KG_ATTRACTIONS).toHaveLength(5)
    for (const c of CORES) expect(attractionOfCore(c.id).core).toBe(c.id)
  })

  it('за всяко ядро и всяка група има точно една дейност', () => {
    for (const g of AGE_GROUPS) for (const c of CORES) expect(activitiesFor(g.id, c.id)).toHaveLength(1)
    expect(ACTIVITIES).toHaveLength(20)
  })

  it('дейностите не се дублират: различни идентификатори, заглавия и механики в рамките на ядро', () => {
    expect(new Set(ACTIVITIES.map((a) => a.id)).size).toBe(ACTIVITIES.length)
    expect(new Set(ACTIVITIES.map((a) => a.title)).size).toBe(ACTIVITIES.length)
    for (const c of CORES) {
      const mech = ACTIVITIES.filter((a) => a.core === c.id).map((a) => a.mechanic)
      expect(new Set(mech).size).toBe(mech.length)
    }
  })

  it('всяка дейност има всички задължителни полета', () => {
    for (const a of ACTIVITIES) {
      expect(a.targetOutcome.length).toBeGreaterThan(10)
      expect(a.pedagogicalGoal.length).toBeGreaterThan(10)
      expect(a.successCriterion.length).toBeGreaterThan(10)
      expect(a.instructions.length).toBeGreaterThan(0)
      expect(a.visualSupport.length).toBeGreaterThan(0)
      expect(a.taskCount.min).toBeLessThanOrEqual(a.taskCount.default)
      expect(a.taskCount.default).toBeLessThanOrEqual(a.taskCount.max)
      expect(a.attraction).toBe(attractionOfCore(a.core).id)
      expect(Array.isArray(a.programLinks)).toBe(true)
    }
  })

  it('нормативните полета не са попълнени без проверка', () => {
    for (const a of ACTIVITIES) {
      expect(a.normative.source).toMatch(/Наредба № 5.*Приложение № 2/)
      if (a.normative.status === 'pending') expect(a.normative.text).toBeNull()
      else expect(a.normative.text).toBeTruthy()
    }
  })

  it('активни са само реализираните и проверени игри за първа група', () => {
    const ready = ACTIVITIES.filter((a) => a.status === 'ready')
    expect(ready.map((a) => [a.id, a.group, a.core])).toEqual([
      ['feed-bears', 1, 'quantity'],
      ['giant-boots', 1, 'measurement'],
    ])
    for (const a of ready) expect(a.taskCount).toEqual({ min: 3, max: 5, default: 5 })
  })
})
