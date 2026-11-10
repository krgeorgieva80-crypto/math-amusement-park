/**
 * Зала 3 „Обсерваторията на числата“ — числови съзвездия в звездното небе.
 * Всяка решена задача осветява част от голямото съзвездие.
 * Видове и начин на отговор:
 *  - „Съзвездие“: звездите се свързват по стойност от най-малката (подреждане с докосване);
 *  - „Зависимост“: продължи редицата (клавиатура);
 *  - „Тайното число“: загадка с няколко условия — проверено, че има точно едно решение (клавиатура);
 *  - „Звездна задача“: текстова задача в две стъпки (клавиатура).
 */
import type { Grade, Rng } from '../../../magic-tokens/logic'
import { RANGE_MAX, fmt } from '../../build/logic'
import { makeExpr, studied } from './arith'
import { pick, randInt, shuffle, type GenOptions } from './common'

export type SkyKind = 'constellation' | 'pattern' | 'puzzle' | 'twostep'
export const SKY_KINDS: SkyKind[] = ['constellation', 'pattern', 'puzzle', 'twostep']

export interface SkyTask {
  hall: 2
  id: string
  kind: SkyKind
  mode: 'order' | 'keypad'
  prompt: string
  /** Съзвездие: надписите на звездите и стойностите им. */
  stars?: string[]
  values?: number[]
  /** Съзвездие: верният ред (индексите на звездите от най-малката стойност). */
  order?: number[]
  /** Зависимост: редицата (null — търсеното). */
  seq?: (number | null)[]
  /** Тайното число: условията. */
  conditions?: string[]
  /** Звездна задача: условието. */
  story?: string
  /** Клавиатура: верният отговор. */
  answer: number
  hint: string
  praise: string
}

type Draft = Omit<SkyTask, 'id' | 'hall'>

function genConstellation(o: GenOptions, rng: Rng): Draft | null {
  const n = 4
  const labels: string[] = []
  const values: number[] = []
  for (let k = 0; k < 60 && labels.length < n; k++) {
    let text: string
    let v: number
    if (o.difficulty === 'explorer') {
      const max = RANGE_MAX[o.grade]
      v = randInt(rng, Math.floor(max / 20), max - 1)
      text = fmt(v)
    } else {
      const e = makeExpr(o, rng)
      v = e.value
      text = e.text
    }
    if (values.includes(v) || labels.includes(text)) continue
    labels.push(text)
    values.push(v)
  }
  if (labels.length < n) return null
  const order = values.map((_, i) => i).sort((a, b) => values[a] - values[b])
  return {
    kind: 'constellation',
    mode: 'order',
    prompt: 'Свържи звездите на съзвездието: докосвай ги от най-малката към най-голямата стойност.',
    stars: labels,
    values,
    order,
    answer: 0,
    hint: o.difficulty === 'explorer' ? 'Намери първо най-малкото число. После търси следващото по големина.' : 'Пресметни стойността на всяка звезда и я запомни. После ги подреди.',
    praise: `Съзвездието: ${order.map((i) => fmt(values[i])).join(' < ')}`,
  }
}

function genPattern(o: GenOptions, rng: Rng): Draft | null {
  const { grade: g, difficulty: d } = o
  const max = RANGE_MAX[g]
  const T = studied(o)
  let seq: number[]
  let rule: string
  let hint: string
  if (d === 'explorer') {
    const step = pick({ 2: [2, 5, 10, 3], 3: [10, 20, 50, 100, 25], 4: [1000, 5000, 10_000, 100_000] }[g], rng)
    const a = step * randInt(rng, 0, Math.floor((max - 4 * step) / step))
    seq = Array.from({ length: 5 }, (_, i) => a + i * step)
    rule = `Всяка звезда е с ${fmt(step)} повече.`
    hint = 'С колко се променя числото от звезда на звезда? Направи същото още веднъж.'
  } else if (d === 'researcher') {
    const t = pick(g === 2 ? [3, 4, 6, 7, 9] : T, rng)
    const step = g === 4 ? t * 1000 : g === 3 ? t * pick([1, 10], rng) : t
    const a = randInt(rng, 0, Math.max(0, max - 4 * step))
    const up = Array.from({ length: 5 }, (_, i) => a + i * step)
    seq = rng() < 0.5 ? up : up.reverse()
    rule = seq[1] > seq[0] ? `Всяка звезда е с ${fmt(step)} повече.` : `Всяка звезда е с ${fmt(step)} по-малко.`
    hint = 'Пресметни разликата между две съседни звезди. Тя е една и съща по цялата редица.'
  } else if (rng() < 0.5 || g === 2) {
    // нарастващи разлики: +d, +2d, +3d, +4d
    const dd = g === 4 ? 1000 * randInt(rng, 1, 9) : g === 3 ? pick([5, 10, 20, 25], rng) : randInt(rng, 1, 5)
    const a = randInt(rng, 0, Math.max(0, max - 10 * dd))
    seq = [a, a + dd, a + 3 * dd, a + 6 * dd, a + 10 * dd]
    rule = `Разликите растат: +${fmt(dd)}, +${fmt(2 * dd)}, +${fmt(3 * dd)}, +${fmt(4 * dd)}.`
    hint = 'Запиши разликите между съседните звезди. Как се променят самите разлики?'
  } else {
    // удвояване
    const a = g === 4 ? 1000 * randInt(rng, 2, 60) : randInt(rng, 2, 60)
    seq = [a, 2 * a, 4 * a, 8 * a, 16 * a]
    rule = 'Всяка звезда е два пъти по-голяма от предишната.'
    hint = 'Сравни всяка звезда с предишната: прибавя ли се нещо, или числото става няколко пъти по-голямо?'
  }
  if (!seq.every((v) => Number.isInteger(v) && v >= 0 && v <= max)) return null
  return {
    kind: 'pattern',
    mode: 'keypad',
    prompt: 'Звездите следват правило. Кое число е в последната звезда?',
    seq: [...seq.slice(0, 4), null],
    answer: seq[4],
    hint,
    praise: rule,
  }
}

interface Cond {
  text: string
  test: (n: number) => boolean
}
const digitsOf = (n: number) => String(n).split('').map(Number)

function genPuzzle(o: GenOptions, rng: Rng): Draft | null {
  const { grade: g } = o
  // числото и тесен интервал около него (претърсва се изцяло)
  const [lo0, hi0, width] = { 2: [10, 99, randInt(rng, 12, 30)], 3: [100, 999, randInt(rng, 30, 80)], 4: [10_000, 999_999, 100] }[g]
  const n = randInt(rng, lo0 + 5, hi0 - 5)
  const lo = g === 4 ? Math.floor(n / 100) * 100 : Math.max(lo0 - 1, n - randInt(rng, 2, width - 2))
  const hi = g === 4 ? lo + 100 : lo + width
  if (!(lo < n && n < hi)) return null
  const ds = digitsOf(n)
  const u = ds[ds.length - 1]
  const t = ds[ds.length - 2]
  const sum = ds.reduce((a, b) => a + b, 0)
  const pool: Cond[] = [
    n % 2 === 0 ? { text: 'Числото е четно.', test: (x) => x % 2 === 0 } : { text: 'Числото е нечетно.', test: (x) => x % 2 === 1 },
    { text: `Цифрата на единиците е ${u}.`, test: (x) => x % 10 === u },
    { text: `Сборът от цифрите му е ${sum}.`, test: (x) => digitsOf(x).reduce((a, b) => a + b, 0) === sum },
    ...(u > t ? [{ text: 'Цифрата на единиците е по-голяма от цифрата на десетиците.', test: (x: number) => x % 10 > Math.floor(x / 10) % 10 }] : []),
    ...(u < t ? [{ text: 'Цифрата на десетиците е по-голяма от цифрата на единиците.', test: (x: number) => x % 10 < Math.floor(x / 10) % 10 }] : []),
    ...(g !== 2
      ? studied(o)
          .filter((k) => n % k === 0)
          .slice(0, 2)
          .map((k) => ({ text: `Числото се дели на ${k} без остатък.`, test: (x: number) => x % k === 0 }))
      : []),
  ]
  const range: Cond = { text: `Числото е между ${fmt(lo)} и ${fmt(hi)}.`, test: (x) => x > lo && x < hi }
  const conds = [range]
  const sols = (cs: Cond[]) => {
    const out: number[] = []
    for (let x = lo + 1; x < hi; x++) if (cs.every((c) => c.test(x))) out.push(x)
    return out
  }
  for (const c of shuffle(pool, rng)) {
    if (sols(conds).length === 1) break
    if (conds.length >= 4) break
    // условие, което стеснява избора
    if (sols([...conds, c]).length < sols(conds).length) conds.push(c)
  }
  const s = sols(conds)
  if (s.length !== 1 || s[0] !== n || conds.length < 3) return null
  return {
    kind: 'puzzle',
    mode: 'keypad',
    prompt: 'Тайното число на звездата отговаря на всички условия. Кое е то?',
    conditions: conds.map((c) => c.text),
    answer: n,
    hint: 'Запиши числата от интервала. Задрасквай тези, които не отговарят на някое условие.',
    praise: `Тайното число е ${fmt(n)}.`,
  }
}

function genTwostep(o: GenOptions, rng: Rng): Draft | null {
  const { grade: g, difficulty: d } = o
  const max = RANGE_MAX[g]
  const T = studied(o)
  const k = g === 2 ? randInt(rng, 0, 1) : randInt(rng, 0, 3)
  const big = g === 4 ? 1000 : 1
  if (k === 0) {
    // A + B − C
    const r = (lo: number, hi: number) => (d === 'explorer' ? 10 * big * randInt(rng, Math.ceil(lo / 10), Math.floor(hi / 10)) : big * randInt(rng, lo, hi))
    const lim = g === 2 ? 100 : g === 3 ? 1000 : 1000
    const A = r(15, Math.floor(lim * 0.55))
    const B = r(8, Math.floor(lim * 0.35))
    const C = r(5, Math.floor((A + B) / big) - 1)
    const v = A + B - C
    if (A + B > max || v < 0 || C <= 0) return null
    return {
      kind: 'twostep',
      mode: 'keypad',
      prompt: 'Звездна задача в две стъпки.',
      story: `В небето светеха ${fmt(A)} звезди. Изгряха още ${fmt(B)}, а после ${fmt(C)} се скриха зад облак. Колко звезди светят сега?`,
      answer: v,
      hint: 'Първа стъпка: колко звезди станаха, когато изгряха новите? Втора стъпка: махни скритите.',
      praise: `${fmt(A)} + ${fmt(B)} − ${fmt(C)} = ${fmt(v)}`,
    }
  }
  if (k === 1) {
    // A и с B повече → общо
    const A = big * randInt(rng, 10, Math.floor((g === 2 ? 40 : 400) * (g === 4 ? 1 : 1)))
    const B = big * randInt(rng, 2, g === 2 ? 15 : 150)
    const v = A + (A + B)
    if (v > max) return null
    return {
      kind: 'twostep',
      mode: 'keypad',
      prompt: 'Звездна задача в две стъпки.',
      story: `Първата нощ телескопът засече ${fmt(A)} комети, а втората нощ — с ${fmt(B)} повече. Колко комети засече за двете нощи?`,
      answer: v,
      hint: 'Първа стъпка: колко комети засече втората нощ? Втора стъпка: събери двете нощи.',
      praise: `${fmt(A)} + ${fmt(A + B)} = ${fmt(v)}`,
    }
  }
  const t = pick(T, rng)
  const m = randInt(rng, 2, 10)
  const unit = g === 4 ? 100 : 1
  if (k === 2) {
    // m кутии по t·unit кристала, подариха C
    const total = m * t * unit
    const C = unit * randInt(rng, 1, m * t - 1)
    const v = total - C
    if (total > max) return null
    return {
      kind: 'twostep',
      mode: 'keypad',
      prompt: 'Звездна задача в две стъпки.',
      story: `В обсерваторията има ${m} кутии с по ${fmt(t * unit)} кристала. Магьосникът подари ${fmt(C)} кристала. Колко кристала останаха?`,
      answer: v,
      hint: 'Първа стъпка: колко кристала има във всички кутии (умножи)? Втора стъпка: извади подарените.',
      praise: `${m} · ${fmt(t * unit)} − ${fmt(C)} = ${fmt(v)}`,
    }
  }
  // t·m·unit звезди в t съзвездия по равно, после по C още
  const total = t * m * unit
  const C = unit * randInt(rng, 1, 9)
  const v = m * unit + C
  if (total > max || v > max) return null
  return {
    kind: 'twostep',
    mode: 'keypad',
    prompt: 'Звездна задача в две стъпки.',
    story: `${fmt(total)} звезди се подредиха по равно в ${t} съзвездия. После във всяко съзвездие изгряха още по ${fmt(C)}. Колко звезди има сега във всяко съзвездие?`,
    answer: v,
    hint: 'Първа стъпка: по колко звезди има във всяко съзвездие (раздели)? Втора стъпка: добави новите.',
    praise: `${fmt(total)} : ${t} + ${fmt(C)} = ${fmt(v)}`,
  }
}

export function validateSky(t: Draft, g: Grade): boolean {
  const max = RANGE_MAX[g]
  const ok = (v: number) => Number.isInteger(v) && v >= 0 && v <= max
  if (t.mode === 'order') {
    const v = t.values!
    return new Set(v).size === v.length && v.every(ok) && t.order!.every((i, k) => k === 0 || v[i] > v[t.order![k - 1]])
  }
  return ok(t.answer)
}

const GEN: Record<SkyKind, (o: GenOptions, rng: Rng) => Draft | null> = { constellation: genConstellation, pattern: genPattern, puzzle: genPuzzle, twostep: genTwostep }

export function generateSkyTask(kind: SkyKind, o: GenOptions, rng: Rng, id: string): SkyTask {
  for (let k = 0; k < 800; k++) {
    const t = GEN[kind](o, rng)
    if (t && validateSky(t, o.grade)) return { ...t, hall: 2, id }
  }
  throw new Error(`Няма валидна задача за ${kind}`)
}

/** Четирите задачи на обсерваторията: по една от всеки вид, в разбъркан ред. */
export function generateSky(o: GenOptions, rng: Rng = Math.random): SkyTask[] {
  return shuffle(SKY_KINDS, rng).map((kind, i) => generateSkyTask(kind, o, rng, `o${i + 1}`))
}

/** Отговорът: свързаните звезди (индекси по реда на докосване) или въведеното число. */
export function checkSky(t: SkyTask, tapped: number[], typed: number | null): 'correct' | 'wrong' | 'incomplete' {
  if (t.mode === 'order') {
    if (tapped.length < t.order!.length) return 'incomplete'
    return tapped.every((v, k) => v === t.order![k]) ? 'correct' : 'wrong'
  }
  if (typed === null) return 'incomplete'
  return typed === t.answer ? 'correct' : 'wrong'
}
