/**
 * „Колелото на умножението“ — карта 4 „Предизвикателството на колелото“.
 * Едно приключение в три етапа: Детектив → Изчезналият множител → Майстор на колелото.
 * Проверките и подсказките идват от карти 2 и 3 (checkSpin, typicalWrong, cellHint);
 * тук са само генераторът на етапите, загадките и текстовете. Чист TypeScript — без React.
 */
import type { Difficulty, Rng } from '../../magic-tokens/logic'
import { multiplicationText } from '../logic'
import { checkSpin, type SpinCheck } from '../spin/logic'
import { cellHint, typicalWrong } from '../table/logic'

export type StageId = 'detective' | 'missing' | 'master'

export const STAGES: { id: StageId; label: string; short: string; intro: string }[] = [
  { id: 'detective', label: 'Математически детектив', short: 'Детектив', intro: 'Едно равенство е грешно. Открий го!' },
  { id: 'missing', label: 'Изчезналият множител', short: 'Множителят', intro: 'Фокусникът скри един множител. Намери го!' },
  { id: 'master', label: 'Майстор на колелото', short: 'Майстор', intro: 'Последното изпитание — покажи всичко, което можеш!' },
]

export interface ChallengeOptions {
  /** Изучените таблици (поне една). */
  tables: number[]
  /** Умножение с 0 — само ако учителят го е включил. */
  zero: boolean
}

export const HELP: Record<Difficulty, 'visual' | 'limited' | 'none'> = { explorer: 'visual', researcher: 'limited', master: 'none' }

const randInt = (rng: Rng, a: number, b: number) => a + Math.floor(rng() * (b - a + 1))
const pick = <T,>(xs: T[], rng: Rng): T => xs[Math.floor(rng() * xs.length)]
function shuffle<T>(xs: T[], rng: Rng): T[] {
  const a = [...xs]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/**
 * Разпределение на задачите по етапи: всеки етап присъства,
 * финалният има най-много (5 → 2 + 2 + 1 по изрично решение).
 */
export function stagePlan(count: number): [number, number, number] {
  if (count <= 5) return [2, 2, Math.max(1, count - 4)]
  const base = Math.floor(count / 3)
  const rest = count - 3 * base
  // остатъкът отива към последните етапи; при равенство финалът получава още една задача от първия
  const plan: [number, number, number] = [base, base + (rest >= 2 ? 1 : 0), base + (rest >= 1 ? 1 : 0)]
  if (plan[2] <= plan[0] && plan[0] > 1) {
    plan[0]--
    plan[2]++
  }
  return plan
}

/** Таблиците за нивото: Откривател — една избрана; иначе всички изучени. */
const tablesFor = (d: Difficulty, o: ChallengeOptions, explorerTable: number) =>
  d === 'explorer' ? [o.tables.includes(explorerTable) ? explorerTable : o.tables[o.tables.length - 1]] : o.tables

/** Множители (колко пъти): 1…10, с 0 само при включено умножение с 0. */
const multipliers = (zero: boolean) => Array.from({ length: zero ? 11 : 10 }, (_, i) => (zero ? i : i + 1))

// ───────────────────────── Етап 1: Детектив ─────────────────────────

export interface Equation {
  a: number
  b: number
  /** Показаното произведение (при грешното — неверно). */
  shown: number
}

export interface DetectiveTask {
  stage: 'detective'
  id: number
  equations: Equation[]
  /** Индексът на грешното равенство. */
  wrong: number
  /** Таблицата на грешното (за подсказката). */
  table: number
}

function wrongValue(d: Difficulty, a: number, b: number, rng: Rng): number {
  const v = a * b
  if (d === 'explorer') {
    // ясна грешка: с една стъпка встрани
    const c = [a * (b + 1), a * (b - 1)].filter((x) => x > 0 && x !== v && x <= 100)
    if (c.length) return pick(c, rng)
  }
  if (d === 'master' && v >= 10 && v < 100 && v % 10 !== Math.floor(v / 10)) {
    const swap = (v % 10) * 10 + Math.floor(v / 10)
    if (swap !== v && swap > 0) return swap
  }
  return typicalWrong(a, b, rng)
}

export function generateDetective(d: Difficulty, o: ChallengeOptions, explorerTable: number, rng: Rng, id: number, step: number): DetectiveTask {
  const tables = tablesFor(d, o, explorerTable)
  const n = d === 'explorer' ? 3 : 4
  const ms = multipliers(o.zero)
  // по-малки множители в началото на етапа
  const maxM = Math.min(10, (d === 'explorer' ? 5 : 6) + step * 2)
  const pool = shuffle(
    tables.flatMap((a) => ms.filter((b) => b <= maxM).map((b) => ({ a, b }))),
    rng,
  )
  const chosen: { a: number; b: number }[] = []
  // едно и също равенство (и в разменен вид) не се показва два пъти
  const same = (c: { a: number; b: number }, p: { a: number; b: number }) => (c.a === p.a && c.b === p.b) || (c.a === p.b && c.b === p.a)
  for (const p of pool) {
    if (chosen.length >= n) break
    // различни равенства; при няколко таблици — по възможност от различни таблици
    if (chosen.some((c) => same(c, p))) continue
    if (tables.length > 1 && chosen.length < tables.length && chosen.some((c) => c.a === p.a)) continue
    chosen.push(p)
  }
  for (const p of pool) if (chosen.length < n && !chosen.some((c) => same(c, p))) chosen.push(p)
  const wrong = randInt(rng, 0, chosen.length - 1)
  const equations = chosen.map((p, i) => {
    // Майстор: понякога разменен ред на множителите
    const swap = d === 'master' && rng() < 0.4
    const [a, b] = swap ? [p.b, p.a] : [p.a, p.b]
    return { a, b, shown: i === wrong ? wrongValue(d, p.a, p.b, rng) : a * b }
  })
  return { stage: 'detective', id, equations, wrong, table: chosen[wrong].a }
}

export const isWrongEquation = (e: Equation) => e.a * e.b !== e.shown

// ───────────────────────── Етап 2: Изчезналият множител ─────────────────────────

export interface MissingTask {
  stage: 'missing'
  id: number
  /** a · b = a·b; липсва първият или вторият множител. */
  a: number
  b: number
  hide: 'first' | 'second'
}

export function generateMissing(d: Difficulty, o: ChallengeOptions, explorerTable: number, rng: Rng, id: number, step: number): MissingTask {
  const tables = tablesFor(d, o, explorerTable)
  const a = pick(tables, rng)
  // без 0 (всяко число би било отговор) и без 1 · □ = 1 при първия множител
  const maxM = Math.min(10, (d === 'explorer' ? 5 : 6) + step * 2)
  const b = randInt(rng, 2, Math.max(2, maxM))
  // Откривател — предимно вторият множител; по-високите нива — и първият
  const firstChance = d === 'explorer' ? 0.15 : 0.5
  return { stage: 'missing', id, a, b, hide: rng() < firstChance ? 'first' : 'second' }
}

export const missingAnswer = (t: MissingTask) => (t.hide === 'first' ? t.a : t.b)

// ───────────────────────── Етап 3: Майстор на колелото ─────────────────────────

/**
 * product — a · b = □; swapped — b · a = □ (с подсказка a · b = …, по нивото);
 * groups — „В b кабинки има по a деца…“; think — „Мисля си число…“;
 * balance — a · b = c · □ (Майстор).
 */
export type MasterKind = 'product' | 'swapped' | 'groups' | 'think' | 'balance'

export interface MasterTask {
  stage: 'master'
  id: number
  kind: MasterKind
  a: number
  b: number
  /** Само за balance: известният множител отдясно. */
  c?: number
}

const KINDS: Record<Difficulty, MasterKind[]> = {
  explorer: ['product', 'swapped', 'groups'],
  researcher: ['product', 'swapped', 'groups', 'think'],
  master: ['swapped', 'groups', 'think', 'balance'],
}

/** a · b = c · x с цял x от 2 до 10, c — изучена таблица, различна от a и b. */
function balanceFor(tables: number[], rng: Rng, zero: boolean) {
  const opts: { a: number; b: number; c: number }[] = []
  for (const a of tables)
    for (const b of multipliers(zero).filter((x) => x >= 2))
      for (const c of tables) {
        const p = a * b
        if (c === a || c === b || p % c) continue
        const x = p / c
        if (x >= 2 && x <= 10 && x !== a && x !== b) opts.push({ a, b, c })
      }
  return opts.length ? pick(opts, rng) : null
}

export function generateMaster(d: Difficulty, o: ChallengeOptions, explorerTable: number, rng: Rng, id: number, avoid: MasterKind | null): MasterTask {
  const tables = tablesFor(d, o, explorerTable)
  let kinds = KINDS[d].filter((k) => k !== avoid)
  if (!kinds.length) kinds = KINDS[d]
  const kind = pick(kinds, rng)
  if (kind === 'balance') {
    const bal = balanceFor(tables, rng, o.zero)
    if (bal) return { stage: 'master', id, kind, ...bal }
    return generateMaster(d, o, explorerTable, rng, id, 'balance')
  }
  const a = pick(tables, rng)
  // загадките и „мисля си число“ — без 0 и 1 (иначе условието е двусмислено или тривиално)
  // 0 само при включено умножение с 0 (и никога в загадките)
  const lo = kind === 'think' || kind === 'groups' ? 2 : o.zero ? 0 : 2
  const b = randInt(rng, lo, 10)
  return { stage: 'master', id, kind, a, b }
}

/** Числото, което ученикът въвежда. */
export function masterAnswer(t: MasterTask): number {
  switch (t.kind) {
    case 'product':
    case 'swapped':
    case 'groups':
      return t.a * t.b
    case 'think':
      return t.b
    case 'balance':
      return (t.a * t.b) / t.c!
  }
}

// ───────────────────────── Серия ─────────────────────────

export type ChallengeTask = DetectiveTask | MissingTask | MasterTask

export function generateChallenge(d: Difficulty, o: ChallengeOptions, explorerTable: number, count: number, rng: Rng = Math.random): ChallengeTask[] {
  const [n1, n2, n3] = stagePlan(count)
  const out: ChallengeTask[] = []
  const seen = new Set<string>()
  const add = (make: () => ChallengeTask) => {
    let t = make()
    for (let k = 0; k < 40 && seen.has(signature(t)); k++) t = make()
    seen.add(signature(t))
    out.push({ ...t, id: out.length + 1 })
  }
  for (let i = 0; i < n1; i++) add(() => generateDetective(d, o, explorerTable, rng, 0, i))
  for (let i = 0; i < n2; i++) add(() => generateMissing(d, o, explorerTable, rng, 0, i))
  let last: MasterKind | null = null
  for (let i = 0; i < n3; i++) {
    add(() => generateMaster(d, o, explorerTable, rng, 0, last))
    last = (out[out.length - 1] as MasterTask).kind
  }
  return out
}

function signature(t: ChallengeTask): string {
  if (t.stage === 'detective') return `d:${t.equations.map((e) => `${e.a}x${e.b}`).join(',')}`
  if (t.stage === 'missing') return `m:${t.a}x${t.b}`
  return `t:${t.kind}:${t.a}x${t.b}:${t.c ?? ''}`
}

export const stageOf = (t: ChallengeTask): StageId => t.stage

// ───────────────────────── Проверка (общата от карта 2) ─────────────────────────

/**
 * Проверка на въведеното число — чрез checkSpin от карта 2:
 * липсващ множител и „мисля си число“ се проверяват като „missing“ (без издаване на отговора).
 */
export function checkAnswer(t: MissingTask | MasterTask, input: string): SpinCheck {
  if (t.stage === 'missing') return checkSpin({ id: 0, kind: 'missing', table: missingAnswer(t), multiplier: t.hide === 'first' ? t.b : t.a }, input)
  if (t.kind === 'think' || t.kind === 'balance') return checkSpin({ id: 0, kind: 'missing', table: masterAnswer(t), multiplier: t.kind === 'think' ? t.a : t.c! }, input)
  return checkSpin({ id: 0, kind: 'normal', table: t.a, multiplier: t.b }, input)
}

// ───────────────────────── Текстове, подсказки, похвала ─────────────────────────

/** Записът на задачата (лява и дясна страна около полето за отговор). */
export function expression(t: MissingTask | MasterTask): { before: string; after: string } {
  if (t.stage === 'missing') return t.hide === 'first' ? { before: '', after: ` · ${t.b} = ${t.a * t.b}` } : { before: `${t.a} · `, after: ` = ${t.a * t.b}` }
  switch (t.kind) {
    case 'product':
    case 'groups':
      return { before: `${multiplicationText(t.a, t.b)} = `, after: '' }
    case 'swapped':
      return { before: `${multiplicationText(t.b, t.a)} = `, after: '' }
    case 'think':
      return { before: '', after: ` · ${t.a} = ${t.a * t.b}` }
    case 'balance':
      return { before: `${multiplicationText(t.a, t.b)} = ${t.c} · `, after: '' }
  }
}

/** Условието на загадката (само за етап 3). */
export function riddleText(t: MasterTask, d: Difficulty): string | null {
  switch (t.kind) {
    case 'groups':
      return `В ${t.b} кабинки на колелото има по ${t.a} деца. Колко деца има общо?`
    case 'think':
      return `Мисля си число. Като го умножа по ${t.a}, получавам ${t.a * t.b}. Кое е числото?`
    case 'balance':
      return 'Двете страни са равни. Кое число липсва?'
    case 'swapped':
      return d === 'master' ? 'Разменени множители — пресметни!' : `Знаеш, че ${multiplicationText(t.a, t.b)} = ${t.a * t.b}. Колко е тогава ${multiplicationText(t.b, t.a)}?`
    default:
      return null
  }
}

export function instruction(t: ChallengeTask): string {
  if (t.stage === 'detective') return `Кое от ${t.equations.length === 3 ? 'трите' : 'четирите'} равенства е грешно? Докосни го.`
  if (t.stage === 'missing') return 'Кое число е скрил фокусникът? Напиши го.'
  return t.kind === 'product' ? 'Пресметни и запиши отговора.' : 'Реши загадката и запиши отговора.'
}

/** Подсказка според нивото; никога не съдържа отговора. */
export function hintFor(t: ChallengeTask, d: Difficulty): string | null {
  const level = HELP[d]
  if (level === 'none') return null
  if (t.stage === 'detective') {
    return level === 'visual'
      ? `Брой по ${t.table} и сравнявай с всяко равенство.`
      : 'Сметни всяко равенство наум и сравни с написаното число.'
  }
  if (t.stage === 'missing') {
    const known = t.hide === 'first' ? t.b : t.a
    const p = t.a * t.b
    return level === 'visual'
      ? `Брой по ${known}, докато стигнеш ${p}. Колко пъти преброи?`
      : `Кое число по ${known} дава ${p}? Опитай числата едно по едно.`
  }
  switch (t.kind) {
    case 'product':
      return cellHint(t.a, t.b, level)
    case 'swapped':
      return level === 'visual' ? `Размяната на множителите не променя произведението. Спомни си ${multiplicationText(t.a, t.b)}.` : 'Размени множителите — получава се позната задача.'
    case 'groups':
      return level === 'visual' ? `Докосни кабинките една по една и брой по ${t.a}.` : `${t.b} кабинки по ${t.a} — запиши го с умножение.`
    case 'think':
      return `Кое число по ${t.a} дава ${t.a * t.b}? Брой по ${t.a}.`
    case 'balance':
      return `Пресметни лявата страна. После: по колко ${t.c} е толкова?`
  }
}

export function praise(t: ChallengeTask): string {
  if (t.stage === 'detective') {
    const e = t.equations[t.wrong]
    return `Браво, детективе! Вярното е ${multiplicationText(e.a, e.b)} = ${e.a * e.b}.`
  }
  if (t.stage === 'missing') return `Браво! Скритото число е ${missingAnswer(t)}: ${multiplicationText(t.a, t.b)} = ${t.a * t.b}.`
  switch (t.kind) {
    case 'swapped':
      return `Браво! ${multiplicationText(t.b, t.a)} = ${t.a * t.b} — размяната не променя произведението!`
    case 'groups':
      return `Браво! ${t.b} кабинки по ${t.a} деца са ${t.a * t.b} деца: ${multiplicationText(t.a, t.b)} = ${t.a * t.b}.`
    case 'think':
      return `Браво! Числото е ${t.b}: ${multiplicationText(t.b, t.a)} = ${t.a * t.b}.`
    case 'balance':
      return `Браво! ${multiplicationText(t.a, t.b)} = ${multiplicationText(t.c!, masterAnswer(t))} = ${t.a * t.b}.`
    default:
      return `Браво! ${multiplicationText(t.a, t.b)} = ${t.a * t.b}.`
  }
}
