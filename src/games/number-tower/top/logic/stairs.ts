/**
 * Зала 1 „Стълбата на числата“ — каменна стълба с липсващи стъпала.
 * Видове: подреждане, попълване на редица, сгрешено стъпало, продължаване на закономерност.
 * Всяка задача се проверява (validateStairs); невалидната се заменя с нова.
 */
import type { Difficulty, Grade, Rng } from '../../../magic-tokens/logic'
import { RANGE_MAX, fmt } from '../../build/logic'
import { pick, randInt, shuffle, type GenOptions } from './common'

export type StairsKind = 'order' | 'fill' | 'wrong' | 'continue'

export interface StairsTask {
  hall: 0
  id: string
  kind: StairsKind
  /** Стъпалата отдолу нагоре; null — празно (липсващо) стъпало. */
  steps: (number | null)[]
  /** Плочките за поставяне (разбъркани). Празно при „сгрешено стъпало“. */
  bank: number[]
  /** Верните стойности за празните стъпала (отдолу нагоре); при „сгрешено“ — [индексът]. */
  answer: number[]
  prompt: string
  /** Методическа подсказка (без отговора). */
  hint: string
  /** Правилото с думи — за похвалата. */
  rule: string
}

export const STAIRS_KINDS: StairsKind[] = ['order', 'fill', 'wrong', 'continue']

/** Брой стъпала по нива. */
const LEN: Record<Difficulty, number> = { explorer: 5, researcher: 6, master: 6 }
/** Брой плочки при подреждане. */
const ORDER_N: Record<Difficulty, number> = { explorer: 4, researcher: 5, master: 6 }

/** Стъпките на редиците по клас и ниво (Изследовател в 3. и 4. клас — и кратни от изучените таблици). */
export function stairsSteps(o: GenOptions): number[] {
  const { grade, difficulty: d, tables } = o
  const t = tables.filter((x) => x >= 2 && x <= 10)
  if (d === 'explorer') return { 2: [1, 2, 5, 10], 3: [10, 50, 100], 4: [1000, 10_000, 100_000] }[grade]
  if (d === 'researcher') {
    if (grade === 2) return [2, 3, 4, 5]
    if (grade === 3) return [...t, 25, 50]
    return [...t.map((x) => x * 100), 250, 2500, 25_000]
  }
  return { 2: [3, 4, 6, 7, 8, 9, 11, 15], 3: [...t.map((x) => x * 10), 15, 35, 75, 125], 4: [...t.map((x) => x * 1000), 1250, 12_500, 75_000] }[grade]
}

const isArith = (xs: number[]) => xs.length < 2 || xs.every((v, i) => i === 0 || v - xs[i - 1] === xs[1] - xs[0])

/** Аритметична редица в обхвата: n числа със стъпка ±step. */
function sequence(grade: Grade, d: Difficulty, step: number, n: number, rng: Rng): number[] | null {
  const max = RANGE_MAX[grade]
  const span = step * (n - 1)
  if (span > max) return null
  const low = d === 'explorer' ? step * randInt(rng, 0, Math.floor((max - span) / step)) : randInt(rng, 0, max - span)
  const up = Array.from({ length: n }, (_, i) => low + i * step)
  return d === 'explorer' || rng() < 0.5 ? up : up.reverse()
}

/** Правдоподобни грешни плочки около дадени стойности. */
function distractors(values: number[], step: number, grade: Grade, rng: Rng, avoid: number[], k = 2): number[] {
  const max = RANGE_MAX[grade]
  const out = new Set<number>()
  const cand = shuffle(
    values.flatMap((v) => {
      // размяна на цифрите — само ако числото остава със същия брой цифри (100 → 1 не е убедително)
      const rev = Number(String(v).split('').reverse().join(''))
      return [v + 1, v - 1, v + 10, v - 10, v + step, v - step, v + 2 * step, ...(String(rev).length === String(v).length ? [rev] : [])]
    }),
    rng,
  )
  for (const c of cand) {
    if (out.size >= k) break
    if (Number.isInteger(c) && c >= 0 && c <= max && !avoid.includes(c) && !values.includes(c)) out.add(c)
  }
  return [...out]
}

const ruleOf = (xs: number[]) => {
  const d = xs[1] - xs[0]
  return d > 0 ? `Всяко стъпало е с ${fmt(d)} по-голямо.` : `Всяко стъпало е с ${fmt(-d)} по-малко.`
}

function genOrder(o: GenOptions, rng: Rng): Omit<StairsTask, 'id'> | null {
  const max = RANGE_MAX[o.grade]
  const n = ORDER_N[o.difficulty]
  const nums = new Set<number>()
  if (o.difficulty === 'master') {
    // „коварни“ числа: едни и същи цифри в различен ред и еднакво начало
    const digits = String(max).length - 1
    while (nums.size < n) {
      const base = Array.from({ length: digits }, (_, i) => (i === 0 ? randInt(rng, 1, 9) : randInt(rng, 0, 9)))
      const p = shuffle(base, rng)
      if (p[0] !== 0) nums.add(Number(p.join('')))
      if (nums.size < n) nums.add(Number(base.join('')) - (Number(base.join('')) % 10) + randInt(rng, 0, 9))
    }
  } else if (o.difficulty === 'researcher') {
    const width = Math.max(n * 4, Math.floor(max / 5))
    const start = randInt(rng, 0, max - width)
    while (nums.size < n) nums.add(randInt(rng, start, start + width))
  } else {
    const band = (max + 1) / n
    for (let i = 0; i < n; i++) nums.add(randInt(rng, Math.floor(i * band + band * 0.1), Math.floor((i + 1) * band - band * 0.1) - 1))
  }
  const list = [...nums].slice(0, n).filter((v) => v >= 0 && v <= max)
  if (list.length !== n) return null
  const sorted = [...list].sort((a, b) => a - b)
  return {
    hall: 0,
    kind: 'order',
    steps: sorted.map(() => null),
    bank: shuffle(list, rng),
    answer: sorted,
    prompt: 'Подреди стъпалата: най-малкото число е най-долу, най-голямото — най-горе.',
    hint: 'Намери първо най-малкото число — то е най-долу. После търси следващото по големина.',
    rule: 'Стъпалата растат от най-малкото към най-голямото.',
  }
}

function genFill(o: GenOptions, rng: Rng): Omit<StairsTask, 'id'> | null {
  const n = LEN[o.difficulty]
  const step = pick(stairsSteps(o), rng)
  const seq = sequence(o.grade, o.difficulty, step, n, rng)
  if (!seq) return null
  const k = o.difficulty === 'explorer' ? 1 : 2
  // липсващите — не първото стъпало и не две съседни (винаги се вижда стъпката)
  const idx = shuffle(Array.from({ length: n - 2 }, (_, i) => i + 1), rng)
    .slice(0, k)
    .sort((a, b) => a - b)
  if (k === 2 && idx[1] - idx[0] < 2) return null
  const answer = idx.map((i) => seq[i])
  const bank = shuffle([...answer, ...distractors(answer, step, o.grade, rng, seq)], rng)
  return {
    hall: 0,
    kind: 'fill',
    steps: seq.map((v, i) => (idx.includes(i) ? null : v)),
    bank,
    answer,
    prompt: k === 1 ? 'Едно стъпало липсва. Постави вярната плочка.' : 'Две стъпала липсват. Постави вярните плочки.',
    hint: 'Виж два съседни стъпала: с колко се променя числото? Така е по цялата стълба.',
    rule: ruleOf(seq),
  }
}

function genWrong(o: GenOptions, rng: Rng): Omit<StairsTask, 'id'> | null {
  const n = LEN[o.difficulty]
  const step = pick(stairsSteps(o), rng)
  const seq = sequence(o.grade, o.difficulty, step, n, rng)
  if (!seq) return null
  const i = randInt(rng, 1, n - 2)
  const max = RANGE_MAX[o.grade]
  const slips = shuffle([1, 10, Math.max(1, Math.floor(step / 2)), step === 1 ? 2 : step + 1].flatMap((k) => [seq[i] + k, seq[i] - k]), rng)
  const bad = slips.find((v) => v >= 0 && v <= max && !seq.includes(v))
  if (bad === undefined) return null
  const steps = seq.map((v, j) => (j === i ? bad : v))
  return {
    hall: 0,
    kind: 'wrong',
    steps,
    bank: [],
    answer: [i],
    prompt: 'Едно стъпало е сгрешено и не следва правилото. Докосни го.',
    hint: 'Пресметни разликите между съседните стъпала. Къде разликата е различна?',
    rule: ruleOf(seq),
  }
}

function genContinue(o: GenOptions, rng: Rng): Omit<StairsTask, 'id'> | null {
  const n = LEN[o.difficulty]
  const step = pick(stairsSteps(o), rng)
  const seq = sequence(o.grade, o.difficulty, step, n, rng)
  if (!seq) return null
  const k = o.difficulty === 'explorer' ? 1 : 2
  const answer = seq.slice(n - k)
  const bank = shuffle([...answer, ...distractors(answer, step, o.grade, rng, seq)], rng)
  return {
    hall: 0,
    kind: 'continue',
    steps: seq.map((v, i) => (i >= n - k ? null : v)),
    bank,
    answer,
    prompt: k === 1 ? 'Продължи стълбата: кое число е на най-горното стъпало?' : 'Продължи стълбата: кои числа са на двете най-горни стъпала?',
    hint: 'Открий правилото от първите стъпала: с колко се променя числото? Продължи по същия начин.',
    rule: ruleOf(seq),
  }
}

/** Проверка на задача: обхват, различни плочки, точно едно решение. */
export function validateStairs(t: Omit<StairsTask, 'id'>, grade: Grade): boolean {
  const max = RANGE_MAX[grade]
  const nums = [...t.steps.filter((x): x is number => x !== null), ...t.bank, ...(t.kind === 'wrong' ? [] : t.answer)]
  if (!nums.every((v) => Number.isInteger(v) && v >= 0 && v <= max)) return false
  if (new Set(t.bank).size !== t.bank.length) return false
  const empty = t.steps.map((v, i) => (v === null ? i : -1)).filter((i) => i >= 0)
  if (t.kind === 'order') {
    if (new Set(t.answer).size !== t.answer.length) return false // различни числа → един ред
    return t.answer.every((v, i) => i === 0 || v > t.answer[i - 1]) && [...t.bank].sort((a, b) => a - b).join() === t.answer.join()
  }
  if (t.kind === 'wrong') {
    const i = t.answer[0]
    const vals = t.steps as number[]
    if (new Set(vals).size !== vals.length) return false
    // само едно стъпало, което ако се махне, оставя аритметична редица (по позиции)
    const fits = vals.map((_, j) => {
      const known = vals.map((v, k) => [k, v] as const).filter(([k]) => k !== j)
      const [k0, v0] = known[0]
      const [k1, v1] = known[1]
      const dd = (v1 - v0) / (k1 - k0)
      return Number.isInteger(dd) && dd !== 0 && known.every(([k, v]) => v === v0 + (k - k0) * dd) && vals[j] !== v0 + (j - k0) * dd
    })
    return fits.filter(Boolean).length === 1 && fits[i]
  }
  // попълване / продължаване: отговорите са в тавата веднъж; редицата е еднозначна (≥ 2 съседни видими)
  if (empty.length !== t.answer.length) return false
  if (!t.answer.every((a) => t.bank.filter((b) => b === a).length === 1)) return false
  if (new Set(t.answer).size !== t.answer.length) return false
  const full = t.steps.map((v, i) => (v === null ? t.answer[empty.indexOf(i)] : v))
  if (!isArith(full) || full[1] === full[0]) return false
  const visiblePair = t.steps.some((v, i) => i > 0 && v !== null && t.steps[i - 1] !== null)
  if (!visiblePair) return false
  // никоя грешна плочка не може да пасне на празно стъпало
  return t.bank.filter((b) => !t.answer.includes(b)).every((b) => empty.every((i) => full[i] !== b))
}

const GEN: Record<StairsKind, (o: GenOptions, rng: Rng) => Omit<StairsTask, 'id'> | null> = { order: genOrder, fill: genFill, wrong: genWrong, continue: genContinue }

/** Една валидна задача от вида (при невалиден опит — нов). */
export function generateStairsTask(kind: StairsKind, o: GenOptions, rng: Rng, id: string): StairsTask {
  for (let k = 0; k < 500; k++) {
    const t = GEN[kind](o, rng)
    if (t && validateStairs(t, o.grade)) return { ...t, id }
  }
  throw new Error(`Няма валидна задача за ${kind}`)
}

/** Четирите задачи на залата: по една от всеки вид, в разбъркан ред, без повторения. */
export function generateStairs(o: GenOptions, rng: Rng = Math.random): StairsTask[] {
  return shuffle(STAIRS_KINDS, rng).map((kind, i) => generateStairsTask(kind, o, rng, `s${i + 1}`))
}

/** Отговорът на детето: поставените плочки по празните стъпала (отдолу нагоре) или избраното стъпало. */
export function checkStairs(t: StairsTask, placed: (number | null)[], selected: number | null): 'correct' | 'wrong' | 'incomplete' {
  if (t.kind === 'wrong') return selected === null ? 'incomplete' : selected === t.answer[0] ? 'correct' : 'wrong'
  if (placed.some((v) => v === null)) return 'incomplete'
  return placed.every((v, i) => v === t.answer[i]) ? 'correct' : 'wrong'
}
