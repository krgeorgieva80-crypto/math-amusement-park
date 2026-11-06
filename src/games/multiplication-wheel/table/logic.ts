/**
 * „Колелото на умножението“ — карта 3 „Попълни таблицата“.
 * Ред = таблицата (първият множител), колона = колко пъти: клетка (3, 7) е 3 · 7 = 21.
 * Четири дейности: закономерности в редици, липсващи произведения,
 * грешни произведения и финално предизвикателство. Само изучените таблици.
 * Чист TypeScript — без React.
 */
import type { Difficulty, Rng } from '../../magic-tokens/logic'
import { multiplicationText } from '../logic'

export type ActivityId = 'pattern' | 'fill' | 'fix' | 'final'

export const ACTIVITIES: { id: ActivityId; label: string; short: string }[] = [
  { id: 'pattern', label: 'Открий закономерността', short: 'Закономерности' },
  { id: 'fill', label: 'Попълни липсващите', short: 'Липсващи' },
  { id: 'fix', label: 'Открий и поправи грешките', short: 'Грешки' },
  { id: 'final', label: 'Финално предизвикателство', short: 'Финал' },
]

export interface TableOptions {
  /** Изучените таблици (вече проверени, поне една). */
  tables: number[]
  /** Умножение с 0 (колона 0). */
  zero: boolean
}

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
/** Различни случайни елементи. */
const sample = <T,>(xs: T[], n: number, rng: Rng): T[] => shuffle(xs, rng).slice(0, Math.min(n, xs.length))

export const tableColumns = (zero: boolean) => Array.from({ length: zero ? 11 : 10 }, (_, i) => (zero ? i : i + 1))
export const cellKey = (r: number, c: number) => `${r}x${c}`

// ───────────────────────── 1. Закономерности ─────────────────────────

/**
 * Редица от числа с еднаква стъпка (кратни на изучена таблица).
 * Детето първо избира стъпката, после попълва празните места.
 */
export interface PatternTask {
  kind: 'pattern'
  id: number
  /** Верните числа по ред. */
  terms: number[]
  /** Индекси на празните места (никога първите две). */
  blanks: number[]
  /** Разлика между съседни числа (отрицателна при намаляваща редица). */
  step: number
  /** Три възможности за стъпката (с верния знак). */
  stepOptions: number[]
  /** Таблицата, от която идва редицата (за подсказката). */
  table: number
  /** Вид: поред, намаляваща, през едно, колона. */
  shape: 'up' | 'down' | 'skip' | 'column'
}

function stepOptions(step: number, rng: Rng): number[] {
  const s = Math.abs(step)
  const pool = [s - 1, s + 1, s + 2, s - 2, s * 2].filter((x) => x > 0 && x !== s)
  const opts = shuffle([s, ...sample([...new Set(pool)], 2, rng)], rng)
  return opts.map((x) => (step < 0 ? -x : x))
}

export function generatePattern(d: Difficulty, o: TableOptions, explorerTable: number, rng: Rng, id: number, avoid?: PatternTask): PatternTask {
  const first = o.zero ? 0 : 1
  const tables = o.tables
  if (d === 'explorer') {
    const t = tables.includes(explorerTable) ? explorerTable : tables[tables.length - 1]
    // начало: от първото число или от средата на таблицата (различно от предишната редица)
    const starts = Array.from({ length: 6 - first }, (_, i) => first + i).filter((x) => x + 5 <= 10 && (!avoid || avoid.terms[0] !== t * x))
    const start = starts.length ? pick(starts, rng) : first
    const terms = Array.from({ length: 6 }, (_, i) => t * (start + i))
    const blanks = sample([2, 3, 4, 5], 2, rng).sort((a, b) => a - b)
    return { kind: 'pattern', id, terms, blanks, step: t, stepOptions: stepOptions(t, rng), table: t, shape: 'up' }
  }
  if (d === 'researcher') {
    const t = tables.length > 1 && avoid ? pick(tables.filter((x) => x !== avoid.table), rng) : pick(tables, rng)
    // редуват се: нагоре и надолу
    const down = avoid ? avoid.shape !== 'down' : rng() < 0.4
    const len = 6
    const start = randInt(rng, first + (down ? len - 1 : 0), 10 - (down ? 0 : len - 1))
    const terms = Array.from({ length: len }, (_, i) => t * (down ? start - i : start + i))
    const blanks = sample([2, 3, 4, 5], 3, rng).sort((a, b) => a - b)
    return { kind: 'pattern', id, terms, blanks, step: down ? -t : t, stepOptions: stepOptions(down ? -t : t, rng), table: t, shape: down ? 'down' : 'up' }
  }
  // Майстор: през едно (стъпка 2·t) или колона от поредни изучени таблици (стъпка = множителя)
  const sorted = [...tables].sort((a, b) => a - b)
  let run: number[] = []
  for (let i = 0; i < sorted.length; i++) {
    const r = [sorted[i]]
    while (i + r.length < sorted.length && sorted[i + r.length] === r[r.length - 1] + 1) r.push(sorted[i + r.length])
    if (r.length > run.length) run = r
  }
  const wantColumn = avoid ? avoid.shape !== 'column' : rng() < 0.5
  if (run.length >= 4 && wantColumn) {
    const k = randInt(rng, 3, 9)
    const rows = run.slice(0, Math.min(6, run.length))
    const terms = rows.map((t) => t * k)
    const blanks = sample(rows.map((_, i) => i).filter((i) => i >= 2), Math.min(3, rows.length - 2), rng).sort((a, b) => a - b)
    return { kind: 'pattern', id, terms, blanks, step: k, stepOptions: stepOptions(k, rng), table: k, shape: 'column' }
  }
  const t = tables.length > 1 && avoid ? pick(tables.filter((x) => x !== avoid.table), rng) : pick(tables, rng)
  const start = randInt(rng, first, 2)
  const terms = Array.from({ length: 5 }, (_, i) => t * (start + 2 * i)).filter((x) => x <= t * 10)
  while (terms.length < 5) terms.unshift(terms[0] - 2 * t)
  const blanks = sample([2, 3, 4], 2, rng).sort((a, b) => a - b)
  return { kind: 'pattern', id, terms, blanks, step: 2 * t, stepOptions: stepOptions(2 * t, rng), table: t, shape: 'skip' }
}

export const checkStep = (t: PatternTask, chosen: number) => chosen === t.step

// ───────────────────────── 2–4. Таблица ─────────────────────────

export interface GridCell {
  r: number
  c: number
  /** Вярното произведение. */
  value: number
  /** Празна клетка, която детето попълва. */
  blank: boolean
  /** Показана грешна стойност (детето трябва да я открие и поправи). */
  wrong?: number
}

export interface GridTask {
  kind: 'fill' | 'fix' | 'final'
  id: number
  rows: number[]
  cols: number[]
  cells: GridCell[]
  /** Казва ли се колко са грешките. */
  tellErrors: boolean
}

/** Типична детска грешка за a · k: стъпка встрани, съседна таблица, разменени цифри. */
export function typicalWrong(a: number, k: number, rng: Rng): number {
  const v = a * k
  const swap = v >= 10 && v % 10 !== Math.floor(v / 10) % 10 && v < 100 ? (v % 10) * 10 + Math.floor(v / 10) : -1
  const cands = [a * (k + 1), a * (k - 1), (a + 1) * k, (a - 1) * k, swap].filter((x) => x > 0 && x <= 100 && x !== v)
  return cands.length ? pick([...new Set(cands)], rng) : v + a
}

/** Редовете за задачата: Откривател — една таблица; иначе няколко изучени. */
function rowsFor(d: Difficulty, o: TableOptions, explorerTable: number, rng: Rng, big: boolean): number[] {
  if (d === 'explorer') return [o.tables.includes(explorerTable) ? explorerTable : o.tables[o.tables.length - 1]]
  const n = d === 'researcher' ? (big ? 3 : 2) : big ? 4 : 3
  return sample(o.tables, n, rng).sort((a, b) => a - b)
}

/** Празни клетки, разпръснати по колони (не всички в една колона, не в колона 0 при грешки). */
function spread(cells: GridCell[], n: number, rng: Rng, avoidZero: boolean): GridCell[] {
  const pool = shuffle(cells.filter((x) => !(avoidZero && x.c === 0)), rng)
  const out: GridCell[] = []
  const usedCols = new Map<number, number>()
  for (const x of pool) {
    if (out.length >= n) break
    const u = usedCols.get(x.c) ?? 0
    if (u >= Math.max(1, Math.ceil(n / 5))) continue
    usedCols.set(x.c, u + 1)
    out.push(x)
  }
  for (const x of pool) if (out.length < n && !out.includes(x)) out.push(x)
  return out
}

const COUNTS: Record<'fill' | 'fix' | 'final', Record<Difficulty, { blanks: number; errors: number }>> = {
  fill: { explorer: { blanks: 3, errors: 0 }, researcher: { blanks: 6, errors: 0 }, master: { blanks: 10, errors: 0 } },
  fix: { explorer: { blanks: 0, errors: 2 }, researcher: { blanks: 0, errors: 3 }, master: { blanks: 0, errors: 4 } },
  final: { explorer: { blanks: 5, errors: 0 }, researcher: { blanks: 8, errors: 0 }, master: { blanks: 12, errors: 2 } },
}

export function generateGrid(kind: 'fill' | 'fix' | 'final', d: Difficulty, o: TableOptions, explorerTable: number, rng: Rng, id: number, avoidRows?: number[]): GridTask {
  let rows = rowsFor(d, o, explorerTable, rng, kind === 'final')
  // различни редове от предишната задача, когато има достатъчно изучени таблици
  for (let k = 0; k < 20 && avoidRows && o.tables.length > rows.length && rows.join() === avoidRows.join(); k++) rows = rowsFor(d, o, explorerTable, rng, kind === 'final')
  const cols = tableColumns(o.zero)
  const cells: GridCell[] = rows.flatMap((r) => cols.map((c) => ({ r, c, value: r * c, blank: false })))
  // по-малко празни, ако таблицата е малка (една изучена таблица)
  const cap = Math.max(1, Math.floor(cells.length * 0.6))
  const { blanks, errors } = COUNTS[kind][d]
  const errN = d === 'master' && kind === 'fix' ? randInt(rng, 2, errors) : errors
  const chosen = spread(cells, Math.min(cap, blanks + errN), rng, errN > 0)
  shuffle(chosen, rng).forEach((x, i) => {
    if (i < errN && x.c !== 0) x.wrong = typicalWrong(x.r, x.c, rng)
    else x.blank = true
  })
  return { kind, id, rows, cols, cells, tellErrors: d !== 'master' }
}

// ───────────────────────── Серия ─────────────────────────

export type TableTask = PatternTask | GridTask

/** Задачи на станция в маршрута. */
const ROUTE: Record<Difficulty, Record<ActivityId, number>> = {
  explorer: { pattern: 2, fill: 2, fix: 2, final: 1 },
  researcher: { pattern: 2, fill: 2, fix: 2, final: 1 },
  master: { pattern: 2, fill: 2, fix: 2, final: 1 },
}

export function generateTableTasks(d: Difficulty, o: TableOptions, explorerTable: number, activity: ActivityId | 'route', count: number, rng: Rng = Math.random): TableTask[] {
  const plan: ActivityId[] =
    activity === 'route' ? (['pattern', 'fill', 'fix', 'final'] as ActivityId[]).flatMap((a) => new Array(ROUTE[d][a]).fill(a)) : new Array(count).fill(activity)
  const seen = new Set<string>()
  const out: TableTask[] = []
  plan.forEach((a, i) => {
    const prevSame = [...out].reverse().find((x) => x.kind === a)
    const prevGrid = [...out].reverse().find((x) => x.kind !== 'pattern') as GridTask | undefined
    const make = (): TableTask =>
      a === 'pattern' ? generatePattern(d, o, explorerTable, rng, i + 1, prevSame as PatternTask | undefined) : generateGrid(a, d, o, explorerTable, rng, i + 1, prevGrid?.rows)
    let t = make()
    for (let k = 0; k < 30 && seen.has(signature(t)); k++) t = make()
    seen.add(signature(t))
    out.push(t)
  })
  return out
}

function signature(t: TableTask): string {
  if (t.kind === 'pattern') return `p:${t.terms.join(',')}`
  return `${t.kind}:${t.cells
    .filter((c) => c.blank || c.wrong !== undefined)
    .map((c) => `${c.r}x${c.c}`)
    .join(',')}`
}

export const activityOf = (t: TableTask): ActivityId => t.kind

// ───────────────────────── Проверки ─────────────────────────

/** Клетките, които детето трябва да въведе: празните (и откритите грешни). */
export const editableCells = (t: GridTask) => t.cells.filter((c) => c.blank || c.wrong !== undefined)

export interface GridCheck {
  status: 'correct' | 'wrong' | 'incomplete'
  message: string
  /** Ключове на клетките с неверен отговор (изчистват се, без да се показва верният). */
  wrongKeys: string[]
}

/**
 * Проверка на таблицата. answers: въведените числа; marked: открити грешни клетки (при поправяне).
 * Отговорът никога не се съобщава.
 */
export function checkGrid(t: GridTask, answers: Record<string, string>, marked: Set<string>): GridCheck {
  const blanks = t.cells.filter((c) => c.blank)
  const errs = t.cells.filter((c) => c.wrong !== undefined)
  const emptyBlank = blanks.filter((c) => !(answers[cellKey(c.r, c.c)] ?? '').trim()).length
  const unmarked = errs.filter((c) => !marked.has(cellKey(c.r, c.c))).length
  const markedEmpty = errs.filter((c) => marked.has(cellKey(c.r, c.c)) && !(answers[cellKey(c.r, c.c)] ?? '').trim()).length
  if (emptyBlank) return { status: 'incomplete', message: emptyBlank === 1 ? 'Остава още 1 празна клетка.' : `Остават още ${emptyBlank} празни клетки.`, wrongKeys: [] }
  if (markedEmpty) return { status: 'incomplete', message: 'Напиши вярното число в откритата клетка.', wrongKeys: [] }
  const wrongKeys = [...blanks, ...errs.filter((c) => marked.has(cellKey(c.r, c.c)))]
    .filter((c) => Number(answers[cellKey(c.r, c.c)]) !== c.value)
    .map((c) => cellKey(c.r, c.c))
  if (wrongKeys.length) return { status: 'wrong', message: wrongKeys.length === 1 ? '1 клетка не е вярна. Опитай отново.' : `${wrongKeys.length} клетки не са верни. Опитай отново.`, wrongKeys }
  if (unmarked) {
    const msg = t.tellErrors ? (unmarked === 1 ? 'Има още 1 грешно произведение. Потърси го!' : `Има още ${unmarked} грешни произведения. Потърси ги!`) : 'Още не са поправени всички грешки. Потърси ги!'
    return { status: 'wrong', message: msg, wrongKeys: [] }
  }
  return { status: 'correct', message: 'Таблицата е вярна!', wrongKeys: [] }
}

export function checkPattern(t: PatternTask, answers: Record<number, string>): { status: 'correct' | 'wrong' | 'incomplete'; message: string; wrong: number[] } {
  const empty = t.blanks.filter((i) => !(answers[i] ?? '').trim()).length
  if (empty) return { status: 'incomplete', message: empty === 1 ? 'Остава още 1 празно място.' : `Остават още ${empty} празни места.`, wrong: [] }
  const wrong = t.blanks.filter((i) => Number(answers[i]) !== t.terms[i])
  if (wrong.length) return { status: 'wrong', message: wrong.length === 1 ? 'Едно число не е вярно. Опитай отново.' : `${wrong.length} числа не са верни. Опитай отново.`, wrong }
  return { status: 'correct', message: 'Редицата е вярна!', wrong: [] }
}

// ───────────────────────── Текстове и подсказки ─────────────────────────

export const stepText = (s: number) => (s < 0 ? `− ${-s}` : `+ ${s}`)

/** „Всяко следващо число е с 2 по-голямо“ / „… с 5 по-малко“. */
export const ruleText = (s: number) => `Всяко следващо число е с ${Math.abs(s)} ${s < 0 ? 'по-малко' : 'по-голямо'}`

export function instruction(t: TableTask, stepChosen: boolean): string {
  switch (t.kind) {
    case 'pattern':
      return stepChosen ? `${ruleText(t.step)}. Попълни празните места.` : 'С колко се променя всяко следващо число?'
    case 'fill':
      return 'Докосни празна клетка и напиши произведението.'
    case 'fix': {
      const n = t.cells.filter((c) => c.wrong !== undefined).length
      return t.tellErrors ? `Открий ${n === 1 ? '1 грешно произведение' : `${n} грешни произведения`} и ги поправи.` : 'Има грешни произведения. Открий ги и ги поправи.'
    }
    case 'final':
      return t.cells.some((c) => c.wrong !== undefined) ? 'Попълни празните клетки. Внимание — има и скрити грешки!' : 'Попълни всички празни клетки.'
  }
}

/** Подсказка за клетка (без резултата): броене през таблицата до съседната. */
export function cellHint(r: number, c: number, level: 'visual' | 'limited'): string {
  if (c === 0) return 'Умножение с нула: ако няма нито една група, колко има общо?'
  if (c === 1) return 'Умножение по едно: числото се взема само веднъж. Виж заглавието на реда.'
  if (level === 'limited') return `${multiplicationText(r, c - 1)} = ${r * (c - 1)}. Колко е с още едно ${r}?`
  const n = Math.min(c - 1, 3)
  return `${multiplicationText(r, c)}: брой по ${r} — ${Array.from({ length: n }, (_, i) => r * (i + 1)).join(', ')}, … и спри след ${c} ${c === 1 ? 'стъпка' : 'стъпки'}.`
}

export function patternHint(t: PatternTask, stepChosen: boolean): string {
  if (!stepChosen) return `Виж първите две числа: ${t.terms[0]} и ${t.terms[1]}. С колко се различават?`
  // насочва към действието, без да казва числото на празното място
  return `${ruleText(t.step)}. Започни от числото преди празното място и ${t.step < 0 ? 'извади' : 'добави'} ${Math.abs(t.step)}.`
}

/** Подсказка за поправянето: къде да се търси (ред), без да се казва коя клетка. */
export function fixHint(t: GridTask, marked: Set<string>): string {
  const left = t.cells.find((c) => c.wrong !== undefined && !marked.has(cellKey(c.r, c.c)))
  if (!left) return 'Провери числата, които написа.'
  return t.rows.length > 1 ? `Потърси в реда на ${left.r}. Брой по ${left.r}.` : `Брой по ${left.r} и сравнявай всяко число.`
}

export function praise(t: TableTask): string {
  if (t.kind === 'pattern') return `Браво! Откри правилото: ${ruleText(t.step).charAt(0).toLowerCase()}${ruleText(t.step).slice(1)}.`
  if (t.kind === 'fix') return 'Браво! Откри и поправи всички грешки!'
  if (t.kind === 'final') return 'Браво! Таблицата е попълнена без грешки!'
  return 'Браво! Попълни липсващите произведения!'
}

export const HELP_LEVEL: Record<Difficulty, 'visual' | 'limited' | 'none'> = { explorer: 'visual', researcher: 'limited', master: 'none' }

export type CellState = 'given' | 'blank' | 'filled' | 'wrongShown' | 'marked' | 'locked'

export function cellState(t: GridTask, key: string, answers: Record<string, string>, marked: Set<string>, locked: Set<string>): CellState {
  const c = t.cells.find((x) => cellKey(x.r, x.c) === key)!
  if (locked.has(key)) return 'locked'
  if (c.blank) return answers[key] ? 'filled' : 'blank'
  if (c.wrong !== undefined) return marked.has(key) ? 'marked' : 'wrongShown'
  return 'given'
}

/** Първата празна клетка (избрана от самото начало) — само при попълване без търсене на грешки. */
export function firstSelection(t: TableTask): string | null {
  if (t.kind === 'pattern' || t.cells.some((c) => c.wrong !== undefined)) return null
  const c = t.cells.find((x) => x.blank)
  return c ? cellKey(c.r, c.c) : null
}
