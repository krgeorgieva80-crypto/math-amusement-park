/**
 * Режими на „Вълшебните жетони“: генериране на задачи, начално състояние,
 * проверка на решенията и подсказки. Чист TypeScript — без React.
 */
import { borrowCount, borrowsThroughZero, carryCount, digitAt } from './arithmetic'
import { formatNumber, type Difficulty, type Grade, type Rng } from './logic'
import {
  PLACES,
  PLACE_NAMES,
  countsOf,
  describeCounts,
  emptyCounts,
  equalCounts,
  isEmpty,
  isStandard,
  placeWord,
  placesForMax,
  valueOf,
  type Counts,
  type Place,
} from './placeValue'

// ───────────────────────── Настройки ─────────────────────────

export type ModeId = 'compose' | 'add' | 'subtract' | 'challenge'
export type ComposeTopic = 'place' | 'regroup' | 'free'
export type Regrouping = 'none' | 'with' | 'mixed'
export type ChallengeKind = 'missingAddend' | 'missingSubtrahend' | 'missingMinuend' | 'compare' | 'findError' | 'otherWay'
export type RangeId = 'r20' | 'r100' | 'r1000' | 'r10000' | 'r100000'

export const MODE_LABELS: Record<ModeId, string> = {
  compose: 'Състави числото',
  add: 'Събиране',
  subtract: 'Изваждане',
  challenge: 'Предизвикателство',
}

export const MODE_DESCRIPTIONS: Record<ModeId, string> = {
  compose: 'Подреди жетоните по разряди',
  add: 'Обедини групите и разменяй',
  subtract: 'Махни жетони и разменяй',
  challenge: 'Липсващи числа, сравняване и още',
}

export const COMPOSE_TOPIC_LABELS: Record<ComposeTopic, string> = {
  place: 'Разряден състав',
  regroup: 'Различни представяния',
  free: 'С различни жетони',
}

export const REGROUPING_LABELS: Record<Regrouping, string> = {
  none: 'Без преминаване',
  with: 'С преминаване',
  mixed: 'Смесени',
}

export const CHALLENGE_LABELS: Record<ChallengeKind, string> = {
  missingAddend: 'Липсващо събираемо',
  missingSubtrahend: 'Липсващ умалител',
  missingMinuend: 'Липсващо умаляемо',
  compare: 'Сравни изразите',
  findError: 'Открий грешката',
  otherWay: 'Друг начин',
}

export const CHALLENGE_KINDS: ChallengeKind[] = ['missingAddend', 'missingSubtrahend', 'missingMinuend', 'compare', 'findError', 'otherWay']

export const RANGES: Record<RangeId, { label: string; max: number; digits: number }> = {
  r20: { label: 'до 20', max: 20, digits: 2 },
  r100: { label: 'до 100', max: 100, digits: 2 },
  r1000: { label: 'до 1000', max: 1000, digits: 3 },
  r10000: { label: 'до 10 000', max: 10000, digits: 4 },
  r100000: { label: 'до 100 000', max: 99999, digits: 5 },
}

export const GRADE_RANGES: Record<Grade, RangeId[]> = {
  2: ['r20', 'r100'],
  3: ['r100', 'r1000'],
  4: ['r10000', 'r100000'],
}

export interface TokensConfig {
  grade: Grade
  mode: ModeId
  range: RangeId
  regrouping: Regrouping
  difficulty: Difficulty
  count: number
  composeTopic: ComposeTopic
  challenge: ChallengeKind | 'mixed'
}

/** Етикет на режима за обобщението и учителските резултати. */
export function modeLabel(c: TokensConfig, workMode?: 'tokensAndCompute' | 'computeOnly' | 'tokensOnly'): string {
  if ((c.mode === 'add' || c.mode === 'subtract') && workMode) {
    const how = { tokensAndCompute: 'жетони и пресмятане', computeOnly: 'само пресмятане', tokensOnly: 'само жетони' }[workMode]
    return `${MODE_LABELS[c.mode]} (${how})`
  }
  if (c.mode === 'compose') return `${MODE_LABELS.compose}: ${COMPOSE_TOPIC_LABELS[c.composeTopic]}`
  if (c.mode === 'challenge') return `${MODE_LABELS.challenge}: ${c.challenge === 'mixed' ? 'смесени' : CHALLENGE_LABELS[c.challenge]}`
  return MODE_LABELS[c.mode]
}

/**
 * Прилага общия (избрания от билетите) клас към настройките на играта.
 * Параметри, неподходящи за новия клас (напр. обхват „до 20“ в 4. клас),
 * се заменят с подходящите за него — нищо не се пренася от стария клас.
 */
export function configForGrade(c: TokensConfig, grade: Grade, rangeLevel: 'small' | 'large' = 'large'): TokensConfig {
  const ranges = GRADE_RANGES[grade]
  const range = c.grade === grade && ranges.includes(c.range) ? c.range : ranges[rangeLevel === 'small' ? 0 : 1]
  return { ...c, grade, range }
}

/** Кои настройки имат смисъл за даден режим (показват се само те). */
export function applicableOptions(mode: ModeId, composeTopic: ComposeTopic, challenge: ChallengeKind | 'mixed') {
  const regroupingChallenge = challenge === 'mixed' || ['missingAddend', 'missingSubtrahend', 'missingMinuend', 'compare', 'findError'].includes(challenge)
  return {
    composeTopic: mode === 'compose',
    challenge: mode === 'challenge',
    range: !(mode === 'compose' && composeTopic === 'free'),
    regrouping: mode === 'add' || mode === 'subtract' || (mode === 'challenge' && regroupingChallenge),
  }
}

export function rangePlaces(range: RangeId): Place[] {
  return placesForMax(RANGES[range].max)
}

// ───────────────────────── Задачи ─────────────────────────

export type Relation = '<' | '=' | '>'
export interface Expr {
  a: number
  op: '+' | '-'
  b: number
}

export type TokenTask =
  | { kind: 'compose'; id: number; target: number; places: Place[]; topic: 'place' | 'regroup'; fixed?: Partial<Record<Place, number>>; free?: Place }
  | { kind: 'add'; id: number; a: number; b: number; places: Place[] }
  | { kind: 'subtract'; id: number; a: number; b: number; places: Place[] }
  | { kind: 'missingAddend'; id: number; a: number; c: number; places: Place[] }
  | { kind: 'missingSubtrahend'; id: number; a: number; c: number; places: Place[] }
  | { kind: 'missingMinuend'; id: number; b: number; c: number; places: Place[] }
  | { kind: 'otherWay'; id: number; target: number; places: Place[] }
  | { kind: 'compare'; id: number; left: Expr; right: Expr }
  | { kind: 'findError'; id: number; items: (Expr & { shown: number })[]; wrongIndex: number }

export const evalExpr = (e: Expr) => (e.op === '+' ? e.a + e.b : e.a - e.b)
export const exprText = (e: Expr) => `${formatNumber(e.a)} ${e.op === '+' ? '+' : '−'} ${formatNumber(e.b)}`

export function relationOf(x: number, y: number): Relation {
  return x < y ? '<' : x > y ? '>' : '='
}

/** Правилният отговор на задачата (за проверка и тестове). */
export function answerOf(task: TokenTask): number | Relation {
  switch (task.kind) {
    case 'compose':
    case 'otherWay':
      return task.target
    case 'add':
      return task.a + task.b
    case 'subtract':
      return task.a - task.b
    case 'missingAddend':
      return task.c - task.a
    case 'missingSubtrahend':
      return task.a - task.c
    case 'missingMinuend':
      return task.b + task.c
    case 'compare':
      return relationOf(evalExpr(task.left), evalExpr(task.right))
    case 'findError':
      return task.wrongIndex
  }
}

/** Текст на задачата за таблото. */
export function taskTitle(task: TokenTask): { label: string; text: string } {
  const f = formatNumber
  switch (task.kind) {
    case 'compose':
      return { label: 'Състави числото', text: f(task.target) }
    case 'otherWay':
      return { label: 'Друг начин за', text: f(task.target) }
    case 'add':
      return { label: 'Събери', text: `${f(task.a)} + ${f(task.b)}` }
    case 'subtract':
      return { label: 'Извади', text: `${f(task.a)} − ${f(task.b)}` }
    case 'missingAddend':
      return { label: 'Липсващо събираемо', text: `${f(task.a)} + ? = ${f(task.c)}` }
    case 'missingSubtrahend':
      return { label: 'Липсващ умалител', text: `${f(task.a)} − ? = ${f(task.c)}` }
    case 'missingMinuend':
      return { label: 'Липсващо умаляемо', text: `? − ${f(task.b)} = ${f(task.c)}` }
    case 'compare':
      return { label: 'Сравни изразите', text: '< = >' }
    case 'findError':
      return { label: 'Открий грешката', text: '?' }
  }
}

/** Кратко указание под таблото. */
export function taskInstruction(task: TokenTask): string {
  switch (task.kind) {
    case 'compose':
      if (task.topic === 'regroup' && task.fixed) return `Използвай точно ${fixedText(task.fixed, task.places)}.`
      return 'Сложи всеки жетон в неговия разряд.'
    case 'otherWay':
      return 'Състави числото по друг начин — с размяна. Всеки различен начин е верен.'
    case 'add':
      return 'Премести жетоните в сбора.'
    case 'subtract':
      return `Махни ${formatNumber(task.b)} от жетоните. Ако не стигат — размени.`
    case 'missingAddend':
      return `Добави жетони, докато стигнеш ${formatNumber(task.c)}.`
    case 'missingSubtrahend':
      return `Махай жетони, докато останат ${formatNumber(task.c)}.`
    case 'missingMinuend':
      return 'Състави числото, от което сме извадили.'
    case 'compare':
      return 'Избери знак: по-малко, равно или по-голямо.'
    case 'findError':
      return 'Само един пример е сгрешен. Докосни го.'
  }
}

function fixedText(fixed: Partial<Record<Place, number>>, places: Place[]): string {
  const parts = places.filter((p) => fixed[p] !== undefined).map((p) => `${fixed[p]} ${placeWord(p, fixed[p]!)}`)
  return parts.length === 1 ? parts[0] : `${parts.slice(0, -1).join(', ')} и ${parts[parts.length - 1]}`
}

// ───────────────────────── Генериране ─────────────────────────

const randInt = (rng: Rng, min: number, max: number) => min + Math.floor(rng() * (max - min + 1))
const pick = <T,>(rng: Rng, items: T[]): T => items[Math.floor(rng() * items.length)]
const withDigits = (rng: Rng, d: number) => (d <= 1 ? randInt(rng, 2, 9) : randInt(rng, 10 ** (d - 1), 10 ** d - 1))

/** Кои числа подхождат за събираеми/умаляеми според обхвата и трудността. */
function operandDigits(range: RangeId, difficulty: Difficulty): { a: number; b: number } {
  const D = RANGES[range].digits
  if (range === 'r20') return { a: 2, b: 1 }
  if (difficulty === 'explorer') return { a: D, b: D - 1 }
  return { a: D, b: D }
}

function regroupOk(op: '+' | '-', a: number, b: number, want: 'none' | 'with', difficulty: Difficulty, D: number): boolean {
  const n = op === '+' ? carryCount(a, b) : borrowCount(a, b)
  if (want === 'none') return n === 0
  if (n === 0) return false
  if (difficulty === 'explorer') return n === 1 && (op === '+' || !borrowsThroughZero(a, b))
  if (difficulty === 'master' && D >= 3) return n >= 2
  return true
}

/** Двойка числа за събиране или изваждане, спазваща ограниченията. */
export function generatePair(op: '+' | '-', range: RangeId, want: 'none' | 'with', difficulty: Difficulty, rng: Rng): { a: number; b: number } {
  const { max } = RANGES[range]
  const D = RANGES[range].digits
  const dig = operandDigits(range, difficulty)
  // Решенията за „кръгло умаляемо“ и „през нула“ се вземат веднъж за задачата,
  // за да не изкривяват разпределението при повторните опити.
  const masterSub = op === '-' && difficulty === 'master' && want === 'with'
  const useRound = masterSub && range !== 'r100000' && rng() < 0.25
  const preferZero = masterSub && D >= 3 && !useRound && rng() < 0.4
  for (let attempt = 0; attempt < 4000; attempt++) {
    let a: number
    let b: number
    if (range === 'r20') {
      a = op === '+' ? randInt(rng, want === 'with' ? 2 : 10, 18) : randInt(rng, 11, 20)
      b = randInt(rng, 1, 9)
      if (op === '+' && want === 'with' && a >= 10) a = randInt(rng, 2, 9)
    } else if (useRound) {
      // кръгли умаляеми — последователни размени през нулите (100 − 47, 1000 − 358)
      a = max
      b = withDigits(rng, D)
    } else {
      a = withDigits(rng, dig.a)
      b = withDigits(rng, dig.b)
    }
    if (op === '+') {
      if (a + b > max) continue
      if (!regroupOk('+', a, b, want, difficulty, D)) continue
    } else {
      if (b >= a) continue
      if (!regroupOk('-', a, b, want, difficulty, D)) continue
      // при „Майстор“ с преминаване предпочитаме понякога заемане през нула
      if (preferZero && attempt < 1500 && !borrowsThroughZero(a, b)) continue
    }
    return { a, b }
  }
  // резервен вариант (не би трябвало да се стига дотук)
  return op === '+' ? { a: 10, b: 5 } : { a: 15, b: 5 }
}

function wantFor(regrouping: Regrouping, index: number, rng: Rng): 'none' | 'with' {
  if (regrouping !== 'mixed') return regrouping
  return (index + (rng() < 0.5 ? 0 : 1)) % 2 === 0 ? 'with' : 'none'
}

/** Цел за разряден състав — с разумен брой жетони. */
function composeTarget(range: RangeId, difficulty: Difficulty, rng: Rng): number {
  const { max } = RANGES[range]
  const D = RANGES[range].digits
  const cap = difficulty === 'explorer' ? 12 : difficulty === 'researcher' ? 18 : 27
  for (let i = 0; i < 2000; i++) {
    const n = range === 'r20' ? randInt(rng, 10, 20) : difficulty === 'explorer' ? withDigits(rng, D) : randInt(rng, 10 ** (D - 1), max)
    const digitSum = String(n).split('').reduce((s, d) => s + Number(d), 0)
    if (n <= max && digitSum <= cap && n >= 10) return n
  }
  return 10 ** (D - 1)
}

function targetPlaces(n: number, places: Place[]): Place[] {
  return places.filter((p) => p <= Math.max(10, n))
}

/**
 * „Различни представяния“: разряд p се намалява с 1, а по-долният разряд
 * поема 10 жетона. Всички разряди без един са фиксирани — решението е едно.
 */
function regroupTask(id: number, range: RangeId, difficulty: Difficulty, rng: Rng): TokenTask {
  const places = rangePlaces(range)
  for (let i = 0; i < 2000; i++) {
    const target = composeTarget(range, difficulty, rng)
    const own = targetPlaces(target, places)
    const c = countsOf(target)
    const candidates = own.filter((p) => p > 1 && c[p] >= 1)
    if (candidates.length === 0) continue
    const p = pick(rng, candidates)
    const free = (p / 10) as Place
    const fixed: Partial<Record<Place, number>> = {}
    for (const q of own) if (q !== free) fixed[q] = q === p ? c[p] - 1 : c[q]
    return { kind: 'compose', id, target, places, topic: 'regroup', fixed, free }
  }
  return { kind: 'compose', id, target: 15, places, topic: 'regroup', fixed: { 10: 0 }, free: 1 }
}

function findErrorTask(id: number, range: RangeId, regrouping: Regrouping, difficulty: Difficulty, rng: Rng): TokenTask {
  const places = rangePlaces(range)
  const items: (Expr & { shown: number })[] = []
  const wrongIndex = randInt(rng, 0, 2)
  for (let i = 0; i < 3; i++) {
    const op: '+' | '-' = rng() < 0.5 ? '+' : '-'
    const want = i === wrongIndex && regrouping !== 'none' ? 'with' : wantFor(regrouping, i, rng)
    const { a, b } = generatePair(op, range, want, difficulty, rng)
    const correct = op === '+' ? a + b : a - b
    let shown = correct
    if (i === wrongIndex) shown = typicalMistake(op, a, b, places)
    items.push({ a, op, b, shown })
  }
  return { kind: 'findError', id, items, wrongIndex }
}

/**
 * Типична грешка: забравен пренос при събиране, „по-малкото от по-голямото“
 * при изваждане, или грешка с една десетица. Винаги различна от верния отговор.
 */
export function typicalMistake(op: '+' | '-', a: number, b: number, places: Place[]): number {
  const correct = op === '+' ? a + b : a - b
  let wrong = correct
  if (op === '+' && carryCount(a, b) > 0) {
    // забравен пренос: всяка колона се събира без пренос
    wrong = [...PLACES].reverse().reduce((s, p) => s + ((digitAt(a, p) + digitAt(b, p)) % 10) * p, 0)
  } else if (op === '-' && borrowCount(a, b) > 0) {
    wrong = [...PLACES].reverse().reduce((s, p) => s + Math.abs(digitAt(a, p) - digitAt(b, p)) * p, 0)
  }
  if (wrong === correct || wrong < 0) wrong = correct + (correct >= 20 ? -10 : 10)
  void places
  return wrong
}

function compareTask(id: number, range: RangeId, regrouping: Regrouping, difficulty: Difficulty, rng: Rng): TokenTask {
  const op1: '+' | '-' = rng() < 0.5 ? '+' : '-'
  const p1 = generatePair(op1, range, wantFor(regrouping, id, rng), difficulty, rng)
  const left: Expr = { a: p1.a, op: op1, b: p1.b }
  const lv = evalExpr(left)
  const wantEqual = rng() < 0.34
  for (let i = 0; i < 3000; i++) {
    const op2: '+' | '-' = op1 === '+' ? '-' : '+'
    let right: Expr
    if (wantEqual) {
      // същата стойност по друг начин
      if (op2 === '+') {
        const b = randInt(rng, 1, Math.max(1, lv - 1))
        right = { a: lv - b, op: '+', b }
      } else {
        const b = randInt(rng, 1, Math.max(1, RANGES[range].max - lv))
        right = { a: lv + b, op: '-', b }
      }
      if (right.a < 1 || right.b < 1 || right.a > RANGES[range].max) continue
      if (right.a === left.a && right.b === left.b) continue
    } else {
      const p2 = generatePair(op2, range, wantFor(regrouping, id + 1, rng), difficulty, rng)
      right = { a: p2.a, op: op2, b: p2.b }
      if (evalExpr(right) === lv) continue
      // близки стойности — сравнението да изисква смятане
      if (Math.abs(evalExpr(right) - lv) > Math.max(10, RANGES[range].max * 0.25)) continue
    }
    return { kind: 'compare', id, left, right }
  }
  return { kind: 'compare', id, left, right: { a: lv, op: '+', b: 0 } }
}

function challengeTask(kind: ChallengeKind, id: number, cfg: TokensConfig, rng: Rng): TokenTask {
  const places = rangePlaces(cfg.range)
  const want = wantFor(cfg.regrouping, id, rng)
  switch (kind) {
    case 'missingAddend': {
      const { a, b } = generatePair('+', cfg.range, want, cfg.difficulty, rng)
      return { kind, id, a, c: a + b, places }
    }
    case 'missingSubtrahend': {
      const { a, b } = generatePair('-', cfg.range, want, cfg.difficulty, rng)
      return { kind, id, a, c: a - b, places }
    }
    case 'missingMinuend': {
      const { a, b } = generatePair('-', cfg.range, want, cfg.difficulty, rng)
      return { kind, id, b, c: a - b, places }
    }
    case 'compare':
      return compareTask(id, cfg.range, cfg.regrouping, cfg.difficulty, rng)
    case 'findError':
      return findErrorTask(id, cfg.range, cfg.regrouping, cfg.difficulty, rng)
    case 'otherWay': {
      for (let i = 0; i < 500; i++) {
        const target = composeTarget(cfg.range, cfg.difficulty, rng)
        const c = countsOf(target)
        if (PLACES.some((p) => p > 1 && c[p] > 0)) return { kind, id, target, places }
      }
      return { kind, id, target: 25, places }
    }
  }
}

function taskKey(t: TokenTask): string {
  switch (t.kind) {
    case 'compose':
      return `compose:${t.target}:${JSON.stringify(t.fixed ?? {})}`
    case 'otherWay':
      return `otherWay:${t.target}`
    case 'add':
    case 'subtract':
      return `${t.kind}:${t.a}:${t.b}`
    case 'missingAddend':
    case 'missingSubtrahend':
      return `${t.kind}:${t.a}:${t.c}`
    case 'missingMinuend':
      return `${t.kind}:${t.b}:${t.c}`
    case 'compare':
      return `cmp:${exprText(t.left)}:${exprText(t.right)}`
    case 'findError':
      return `err:${t.items.map(exprText).join('|')}`
  }
}

/** Генерира серия различни задачи според настройките. */
export function generateTokenTasks(cfg: TokensConfig, rng: Rng = Math.random): TokenTask[] {
  if (cfg.mode === 'compose' && cfg.composeTopic === 'free') throw new Error('Свободното съставяне използва logic.ts')
  const places = rangePlaces(cfg.range)
  const seen = new Set<string>()
  const tasks: TokenTask[] = []
  const kinds = cfg.challenge === 'mixed' ? CHALLENGE_KINDS : [cfg.challenge]
  for (let i = 0; i < cfg.count; i++) {
    let task: TokenTask | null = null
    for (let attempt = 0; attempt < 60; attempt++) {
      const id = i + 1
      switch (cfg.mode) {
        case 'compose':
          task = cfg.composeTopic === 'regroup' ? regroupTask(id, cfg.range, cfg.difficulty, rng) : { kind: 'compose', id, target: composeTarget(cfg.range, cfg.difficulty, rng), places, topic: 'place' }
          break
        case 'add': {
          const { a, b } = generatePair('+', cfg.range, wantFor(cfg.regrouping, i, rng), cfg.difficulty, rng)
          task = { kind: 'add', id, a, b, places }
          break
        }
        case 'subtract': {
          const { a, b } = generatePair('-', cfg.range, wantFor(cfg.regrouping, i, rng), cfg.difficulty, rng)
          task = { kind: 'subtract', id, a, b, places }
          break
        }
        case 'challenge':
          // при „Смесени“ видовете се редуват, за да се срещнат всички
          task = challengeTask(cfg.challenge === 'mixed' ? kinds[(i + Math.floor(rng() * 2)) % kinds.length] : kinds[0], id, cfg, rng)
          break
      }
      if (!seen.has(taskKey(task))) break
    }
    seen.add(taskKey(task!))
    tasks.push(task!)
  }
  return tasks
}

// ───────────────────────── Състояние на дъската ─────────────────────────

export type BoardState =
  | { kind: 'compose'; built: Counts }
  | { kind: 'otherWay'; built: Counts }
  | { kind: 'missingMinuend'; built: Counts }
  | { kind: 'add'; a: Counts; b: Counts; result: Counts }
  | { kind: 'subtract'; board: Counts; removed: Counts }
  | { kind: 'missingSubtrahend'; board: Counts; removed: Counts }
  | { kind: 'missingAddend'; base: Counts; added: Counts }
  | { kind: 'compare'; choice: Relation | null }
  | { kind: 'findError'; choice: number | null }

export function initialState(task: TokenTask): BoardState {
  switch (task.kind) {
    case 'compose':
    case 'otherWay':
    case 'missingMinuend':
      return { kind: task.kind, built: emptyCounts() }
    case 'add':
      return { kind: 'add', a: countsOf(task.a), b: countsOf(task.b), result: emptyCounts() }
    case 'subtract':
      return { kind: 'subtract', board: countsOf(task.a), removed: emptyCounts() }
    case 'missingSubtrahend':
      return { kind: 'missingSubtrahend', board: countsOf(task.a), removed: emptyCounts() }
    case 'missingAddend':
      return { kind: 'missingAddend', base: countsOf(task.a), added: emptyCounts() }
    case 'compare':
      return { kind: 'compare', choice: null }
    case 'findError':
      return { kind: 'findError', choice: null }
  }
}

// ───────────────────────── Проверка ─────────────────────────

export type CheckStatus = 'correct' | 'wrong' | 'incomplete'
export interface TaskCheck {
  status: CheckStatus
  message: string
}

const f = formatNumber
const ok = (message = 'Браво!'): TaskCheck => ({ status: 'correct', message })
const wrong = (message: string): TaskCheck => ({ status: 'wrong', message })
const incomplete = (message: string): TaskCheck => ({ status: 'incomplete', message })

/** Първият разряд (отдолу) с повече от 9 жетона. */
function overfullPlace(c: Counts, places: Place[]): Place | null {
  return [...places].reverse().find((p) => c[p] > 9) ?? null
}

function valueMessage(value: number, target: number, details: boolean, verb = 'Имаш'): string {
  if (!details) return value < target ? 'Числото е по-малко от нужното.' : 'Числото е по-голямо от нужното.'
  return value < target ? `${verb} ${f(value)}. Трябват още ${f(target - value)}.` : `${verb} ${f(value)} — с ${f(value - target)} повече.`
}

/**
 * Проверява състоянието на дъската. details=false (без подсказки) дава
 * по-кратки съобщения без конкретни числа.
 */
export function checkTask(task: TokenTask, state: BoardState, details = true): TaskCheck {
  switch (task.kind) {
    case 'compose': {
      if (state.kind !== 'compose') break
      const v = valueOf(state.built)
      if (v === 0) return incomplete('Сложи жетони в разрядите.')
      if (v !== task.target) return wrong(valueMessage(v, task.target, details))
      if (task.topic === 'place') {
        const over = overfullPlace(state.built, task.places)
        if (over) return wrong(`Числото е вярно, но имаш ${state.built[over]} ${PLACE_NAMES[over].many}. Размени 10 ${PLACE_NAMES[over].many} за 1 ${PLACE_NAMES[(over * 10) as Place].one}.`)
        return ok()
      }
      const fixed = task.fixed ?? {}
      const bad = task.places.find((p) => fixed[p] !== undefined && state.built[p] !== fixed[p])
      if (bad) return wrong(`Числото е вярно, но трябва да има точно ${fixed[bad]} ${placeWord(bad, fixed[bad]!)}.`)
      return ok()
    }
    case 'otherWay': {
      if (state.kind !== 'otherWay') break
      const v = valueOf(state.built)
      if (v === 0) return incomplete('Сложи жетони в разрядите.')
      if (v !== task.target) return wrong(valueMessage(v, task.target, details))
      if (equalCounts(state.built, countsOf(task.target))) return wrong('Това е обичайният начин. Размени един жетон за 10 по-малки и опитай пак.')
      return ok()
    }
    case 'missingMinuend': {
      if (state.kind !== 'missingMinuend') break
      const target = task.b + task.c
      const v = valueOf(state.built)
      if (v === 0) return incomplete('Състави числото с жетони.')
      if (v !== target) {
        if (!details) return wrong('Провери: числото минус умалителя трябва да даде разликата.')
        return wrong(`${f(v)} − ${f(task.b)} = ${f(Math.max(0, v - task.b))}, а трябва да е ${f(task.c)}.`)
      }
      return ok()
    }
    case 'add': {
      if (state.kind !== 'add') break
      if (!isEmpty(state.a) || !isEmpty(state.b)) return incomplete('Премести всички жетони в сбора.')
      const v = valueOf(state.result)
      if (v !== task.a + task.b) return wrong(valueMessage(v, task.a + task.b, details))
      // Размяната е задължителна, но не е грешка — ученикът още не е готов.
      const over = overfullPlace(state.result, task.places)
      if (over) return incomplete(`Имаш ${state.result[over]} ${PLACE_NAMES[over].many}. Размени 10 ${PLACE_NAMES[over].many} за 1 ${PLACE_NAMES[(over * 10) as Place].one}.`)
      return ok()
    }
    case 'subtract':
    case 'missingSubtrahend': {
      if (state.kind !== 'subtract' && state.kind !== 'missingSubtrahend') break
      const removed = valueOf(state.removed)
      const left = valueOf(state.board)
      const need = task.kind === 'subtract' ? task.b : task.a - task.c
      // инвариант: нищо не изчезва и не се появява
      if (left + removed !== task.a) return wrong('Нещо не е наред с жетоните. Натисни „Изчисти“.')
      if (removed === 0) return incomplete(task.kind === 'subtract' ? `Махни ${f(task.b)} от жетоните.` : `Махай жетони, докато останат ${f(task.c)}.`)
      if (task.kind === 'subtract') {
        if (removed < need) return wrong(details ? `Махнал си ${f(removed)}. Махни още ${f(need - removed)}.` : 'Махнал си по-малко от нужното.')
        if (removed > need) return wrong(details ? `Махнал си ${f(removed)} — с ${f(removed - need)} повече. Върни жетони.` : 'Махнал си повече от нужното.')
      } else if (left !== task.c) {
        return wrong(details ? `Остават ${f(left)}, а трябва да останат ${f(task.c)}.` : left > task.c ? 'Останаха повече жетони от нужното.' : 'Останаха по-малко жетони от нужното.')
      }
      return ok()
    }
    case 'missingAddend': {
      if (state.kind !== 'missingAddend') break
      const added = valueOf(state.added)
      if (added === 0) return incomplete(`Добави жетони, докато стигнеш ${f(task.c)}.`)
      const total = task.a + added
      if (total !== task.c) return wrong(details ? `${f(task.a)} + ${f(added)} = ${f(total)}, а трябва да е ${f(task.c)}.` : total < task.c ? 'Още не стигаш числото.' : 'Надмина числото.')
      return ok()
    }
    case 'compare': {
      if (state.kind !== 'compare') break
      if (state.choice === null) return incomplete('Избери знак.')
      const correct = relationOf(evalExpr(task.left), evalExpr(task.right))
      if (state.choice !== correct) return wrong(details ? 'Пресметни двете страни и сравни още веднъж.' : 'Сравни отново.')
      return ok()
    }
    case 'findError': {
      if (state.kind !== 'findError') break
      if (state.choice === null) return incomplete('Докосни грешния пример.')
      if (state.choice !== task.wrongIndex) return wrong('Този пример е верен. Провери другите.')
      return ok()
    }
  }
  return wrong('Състоянието не съвпада със задачата.')
}

// ───────────────────────── Подсказки ─────────────────────────

export interface TokenHint {
  message: string
  /** Кой ред и разряд да светне (по избор). */
  row?: 'a' | 'b' | 'result' | 'board' | 'removed' | 'built' | 'added' | 'supply'
  place?: Place
}

/** Следваща стъпка при изваждане: какво да махна или какво да разменя. */
function removalHint(board: Counts, stillRemove: number, places: Place[]): TokenHint {
  if (stillRemove < 0) return { message: `Махнал си с ${f(-stillRemove)} повече. Върни жетони от „Махнати“.`, row: 'removed' }
  if (stillRemove === 0) return { message: 'Готово! Натисни „Провери“.' }
  for (const p of [...places].reverse()) {
    const d = digitAt(stillRemove, p)
    if (d === 0) continue
    if (board[p] >= d) return { message: `Махни ${d} ${placeWord(p, d)}.`, row: 'board', place: p }
    // не стигат — търсим по-горен разряд с жетони
    let q = (p * 10) as Place
    while (places.includes(q) && board[q] === 0) q = (q * 10) as Place
    if (!places.includes(q)) break
    const below = (q / 10) as Place
    if (below === p) return { message: `Нямаш достатъчно ${PLACE_NAMES[p].many}. Размени 1 ${PLACE_NAMES[q].one} за 10 ${PLACE_NAMES[p].many}.`, row: 'board', place: q }
    return { message: `Нямаш ${PLACE_NAMES[below].many}. Първо размени 1 ${PLACE_NAMES[q].one} за 10 ${PLACE_NAMES[below].many}.`, row: 'board', place: q }
  }
  return { message: 'Махни жетони, докато стигнеш нужното число.' }
}

/** Какво да добавя или махна, за да стигна целта (по разряди). */
function buildHint(built: Counts, desired: Counts, places: Place[]): TokenHint {
  for (const p of places) {
    if (built[p] < desired[p]) {
      const n = desired[p] - built[p]
      return { message: `Добави ${n} ${placeWord(p, n)}.`, row: 'supply', place: p }
    }
    if (built[p] > desired[p]) {
      const n = built[p] - desired[p]
      return { message: `Имаш с ${n} ${placeWord(p, n)} повече. Махни ${n === 1 ? 'една' : n}.`, row: 'built', place: p }
    }
  }
  return { message: 'Готово! Натисни „Провери“.' }
}

export function hintFor(task: TokenTask, state: BoardState): TokenHint {
  switch (task.kind) {
    case 'compose': {
      if (state.kind !== 'compose') break
      const desired = countsOf(task.target)
      if (task.topic === 'regroup' && task.fixed && task.free) {
        for (const p of task.places) if (task.fixed[p] !== undefined) desired[p] = task.fixed[p]!
        desired[task.free] = (task.target - task.places.filter((p) => p !== task.free).reduce((s, p) => s + p * desired[p], 0)) / task.free
      }
      return buildHint(state.built, desired, task.places)
    }
    case 'otherWay': {
      if (state.kind !== 'otherWay') break
      const v = valueOf(state.built)
      const std = countsOf(task.target)
      if (v === task.target && equalCounts(state.built, std)) {
        const p = task.places.find((q) => q > 1 && state.built[q] > 0)!
        return { message: `Размени 1 ${PLACE_NAMES[p].one} за 10 ${PLACE_NAMES[(p / 10) as Place].many} — числото остава същото.`, row: 'built', place: p }
      }
      if (v === task.target) return { message: 'Готово! Натисни „Провери“.' }
      if (v > task.target) return { message: `Имаш ${f(v)} — с ${f(v - task.target)} повече. Махни жетони.`, row: 'built' }
      return buildHint(state.built, std, task.places)
    }
    case 'missingMinuend': {
      if (state.kind !== 'missingMinuend') break
      const target = task.b + task.c
      const h = buildHint(state.built, countsOf(target), task.places)
      return valueOf(state.built) === 0 ? { ...h, message: `Помисли: ако ? − ${f(task.b)} = ${f(task.c)}, то ? = ${f(task.c)} + ${f(task.b)}.` } : h
    }
    case 'add': {
      if (state.kind !== 'add') break
      for (const row of ['b', 'a'] as const) {
        const group = state[row]
        const p = task.places.find((q) => group[q] > 0)
        if (p) return { message: `Премести ${PLACE_NAMES[p].many}те в сбора.`, row, place: p }
      }
      const over = overfullPlace(state.result, task.places)
      if (over) return { message: `Преброй ${PLACE_NAMES[over].many}те: ${state.result[over]}. Размени 10 ${PLACE_NAMES[over].many} за 1 ${PLACE_NAMES[(over * 10) as Place].one}.`, row: 'result', place: over }
      return { message: 'Готово! Провери решението.' }
    }
    case 'subtract': {
      if (state.kind !== 'subtract') break
      return removalHint(state.board, task.b - valueOf(state.removed), task.places)
    }
    case 'missingSubtrahend': {
      if (state.kind !== 'missingSubtrahend') break
      return removalHint(state.board, valueOf(state.board) - task.c, task.places)
    }
    case 'missingAddend': {
      if (state.kind !== 'missingAddend') break
      const rest = task.c - task.a - valueOf(state.added)
      if (rest < 0) return { message: `Надмина с ${f(-rest)}. Махни жетони от „Добави“.`, row: 'added' }
      if (rest === 0) return { message: 'Готово! Натисни „Провери“.' }
      const p = task.places.find((q) => q <= rest)!
      return { message: `Остават ${f(rest)} до ${f(task.c)}. Добави ${placeWord(p, 2)}.`, row: 'supply', place: p }
    }
    case 'compare': {
      const l = evalExpr(task.left)
      return { message: `Лявата страна: ${exprText(task.left)} = ${f(l)}. Сега пресметни дясната.` }
    }
    case 'findError': {
      const withRegroup = task.items.findIndex((e) => (e.op === '+' ? carryCount(e.a, e.b) : borrowCount(e.a, e.b)) > 0)
      return withRegroup >= 0 ? { message: 'Провери внимателно примерите с преминаване през десетицата.' } : { message: 'Пресметни всеки пример по разряди.' }
    }
  }
  return { message: 'Опитай стъпка по стъпка.' }
}

/** Описание на дъската за реда с „математическото представяне“. */
export function boardSummary(c: Counts, places: Place[]): string {
  return `${describeCounts(c, places)} = ${f(valueOf(c))}`
}

export { isStandard }
