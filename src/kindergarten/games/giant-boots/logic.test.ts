import { describe, expect, it } from 'vitest'
import {
  BOOTS_PHRASES,
  bootsReducer,
  currentLead,
  hintPhrase,
  isCorrect,
  makeTasks,
  newGame,
  pattern,
  plan,
  rowsRepeat,
  seeded,
  shelfRows,
  type BootsState,
  type BootsTask,
  type HeroId,
  type Item,
} from './logic'

const heroFor = (i: Item): HeroId => (i.size === 'big' ? 'giant' : 'dwarf')
const solveAll = (s: BootsState) => {
  for (const i of s.tasks[s.index].items) s = bootsReducer(s, { type: 'place', item: i.id, hero: heroFor(i), hintsOn: true })
  return s
}

describe('Големи и малки ботуши — задачи', () => {
  it('3–5 задачи; започва с два ботуша и най-очевидната разлика', () => {
    expect(plan(1)).toHaveLength(3)
    expect(plan(4)).toHaveLength(4)
    expect(plan(9)).toHaveLength(5)
    for (const n of [3, 4, 5]) {
      const ts = makeTasks(n, seeded(n))
      expect(ts).toHaveLength(n)
      expect(ts[0].items).toHaveLength(2)
      expect(ts[0].items.every((i) => i.kind === 'boot')).toBe(true)
      expect(ts[0].lead).toBe('who-big')
      // разликата е най-голяма в началото и постепенно намалява (но остава ясна)
      for (let k = 1; k < ts.length; k++) expect(ts[k].ratio).toBeGreaterThanOrEqual(ts[k - 1].ratio)
      expect(Math.max(...ts.map((t) => t.ratio))).toBeLessThanOrEqual(0.6)
      // предметите се разнообразяват: последната задача има и други предмети освен ботуши
      expect(new Set(ts[ts.length - 1].items.map((i) => i.kind)).size).toBeGreaterThan(1)
    }
  })

  it('във всяка задача има и големи, и малки предмети, по двойки от един цвят', () => {
    for (let seed = 1; seed < 300; seed++)
      for (const t of makeTasks(5, seeded(seed))) {
        const big = t.items.filter((i) => i.size === 'big')
        const small = t.items.filter((i) => i.size === 'small')
        expect(big.length).toBe(small.length)
        expect(big.length).toBeGreaterThan(0)
        // цветът не подсказва: всеки цвят е и на голям, и на малък предмет
        for (const b of big) expect(small.some((s) => s.color === b.color && s.kind === b.kind)).toBe(true)
        expect(new Set(t.items.map((i) => i.id)).size).toBe(t.items.length)
      }
  })

  it('цветовете и разположението се сменят между задачите', () => {
    let samePattern = 0
    let total = 0
    for (let seed = 1; seed < 200; seed++) {
      const ts = makeTasks(5, seeded(seed))
      for (let k = 1; k < ts.length; k++) {
        total++
        if (pattern(ts[k]) === pattern(ts[k - 1])) samePattern++
        const prev = new Set(ts[k - 1].items.map((i) => i.color))
        // при малко предмети цветовете са изцяло нови
        if (ts[k].items.length <= 4) expect(ts[k].items.some((i) => prev.has(i.color))).toBe(false)
      }
      for (const t of ts) {
        // при 4 и повече предмета големите не са всички наляво или всички надясно
        if (t.items.length > 2) expect(/^(Г+м+|м+Г+)$/.test(pattern(t))).toBe(false)
        // на рафта двата реда не повтарят една и съща подредба (големият не е винаги в една колона)
        expect(rowsRepeat(t.items)).toBe(false)
      }
    }
    expect(samePattern).toBe(0)
    expect(total).toBeGreaterThan(0)
  })
})

describe('Големи и малки ботуши — рафт', () => {
  it('редове: до 3 в един ред; 4 → 2 + 2; 6 → 3 + 3', () => {
    expect(shelfRows([1, 2]).map((r) => r.length)).toEqual([2])
    expect(shelfRows([1, 2, 3, 4]).map((r) => r.length)).toEqual([2, 2])
    expect(shelfRows([1, 2, 3, 4, 5, 6]).map((r) => r.length)).toEqual([3, 3])
  })
  it('повтаряща се подредба по колони се разпознава', () => {
    const mk = (p: string): Item[] => [...p].map((c, k) => ({ id: String(k), kind: 'boot', size: c === 'Г' ? 'big' : 'small', color: 'red' }))
    expect(rowsRepeat(mk('ГмГм'))).toBe(true)
    expect(rowsRepeat(mk('ГммГ'))).toBe(false)
    expect(rowsRepeat(mk('ГмГГмГ'))).toBe(true)
    expect(rowsRepeat(mk('ГмммГГ'))).toBe(false)
  })
})

describe('Големи и малки ботуши — разпознаване и ход на играта', () => {
  const T: BootsTask = {
    lead: 'sort-all',
    ratio: 0.5,
    items: [
      { id: 'a', kind: 'boot', size: 'small', color: 'red' },
      { id: 'b', kind: 'boot', size: 'big', color: 'red' },
      { id: 'c', kind: 'hat', size: 'big', color: 'blue' },
      { id: 'd', kind: 'hat', size: 'small', color: 'blue' },
    ],
  }

  it('голямото е за великана, малкото — за джуджето', () => {
    expect(isCorrect(T.items[1], 'giant')).toBe(true)
    expect(isCorrect(T.items[1], 'dwarf')).toBe(false)
    expect(isCorrect(T.items[0], 'dwarf')).toBe(true)
    expect(isCorrect(T.items[0], 'giant')).toBe(false)
  })

  it('правилно поставяне: предметът отива при героя; задачата завършва, когато всички са разпределени', () => {
    let s = newGame([T])
    s = bootsReducer(s, { type: 'place', item: 'b', hero: 'giant', hintsOn: true })
    expect(s.placed).toEqual({ b: 'giant' })
    expect(s.phase).toBe('play')
    s = solveAll(s)
    expect(s.phase).toBe('success')
    expect(s.firstTry).toBe(1)
  })

  it('грешка: предметът остава за нов опит, подсказка към правилния герой, без наказание', () => {
    let s = newGame([T])
    s = bootsReducer(s, { type: 'place', item: 'a', hero: 'giant', hintsOn: true })
    expect(s.placed).toEqual({})
    expect(s.hint).toEqual({ item: 'a', hero: 'dwarf' })
    expect(s.wrong).toBe(1)
    s = bootsReducer(s, { type: 'place', item: 'a', hero: 'dwarf', hintsOn: true })
    expect(s.placed).toEqual({ a: 'dwarf' })
    expect(s.hint).toBeNull()
    s = solveAll(s)
    expect(s.phase).toBe('success')
    expect(s.firstTry).toBe(0)
    expect(s.hinted).toBe(1)
  })

  it('без визуални подсказки: грешката се брои, но не се показва подсказка', () => {
    let s = newGame([T])
    s = bootsReducer(s, { type: 'place', item: 'c', hero: 'dwarf', hintsOn: false })
    expect(s.hint).toBeNull()
    expect(s.wrong).toBe(1)
  })

  it('повторно поставяне на вече поставен предмет не променя нищо', () => {
    let s = newGame([T])
    s = bootsReducer(s, { type: 'place', item: 'b', hero: 'giant', hintsOn: true })
    const again = bootsReducer(s, { type: 'place', item: 'b', hero: 'dwarf', hintsOn: true })
    expect(again).toBe(s)
  })

  it('подсказката говори за ботуш или за „нещо“ според предмета', () => {
    expect(hintPhrase(T.items[0])).toBe('boots.hint')
    expect(hintPhrase(T.items[2])).toBe('boots.hint.thing')
  })

  it('инструкцията насочва към останалата големина', () => {
    const boots: BootsTask = {
      lead: 'who-big',
      ratio: 0.45,
      items: [T.items[0], T.items[1], { id: 'e', kind: 'boot', size: 'big', color: 'green' }, { id: 'f', kind: 'boot', size: 'small', color: 'green' }],
    }
    let s = newGame([boots])
    expect(currentLead(s)).toBe('who-big')
    s = bootsReducer(s, { type: 'place', item: 'b', hero: 'giant', hintsOn: true })
    s = bootsReducer(s, { type: 'place', item: 'e', hero: 'giant', hintsOn: true })
    expect(currentLead(s)).toBe('give-small')
  })

  it('цяла игра: похвала след всяка задача, преминаване и край', () => {
    for (const n of [3, 4, 5]) {
      let s = newGame(makeTasks(n, seeded(31)))
      for (let k = 0; k < n; k++) {
        s = solveAll(s)
        expect(s.phase).toBe('success')
        s = bootsReducer(s, { type: 'next' })
      }
      expect(s.phase).toBe('done')
      expect(s.firstTry).toBe(n)
    }
  })

  it('фразите за запис: исканите от заданието и уникални идентификатори', () => {
    const texts = BOOTS_PHRASES.map((p) => p.text)
    for (const t of [
      'Виж великана и джуджето!',
      'Кой има нужда от големи ботуши?',
      'Намери малките ботуши.',
      'Дай големите ботуши на великана.',
      'Дай малките ботуши на джуджето.',
      'Погледни внимателно. Кой ботуш е по-голям?',
      'Чудесно! Помогна на двамата приятели!',
    ])
      expect(texts).toContain(t)
    expect(new Set(BOOTS_PHRASES.map((p) => p.id)).size).toBe(BOOTS_PHRASES.length)
  })
})
