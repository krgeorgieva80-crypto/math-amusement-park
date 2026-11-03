/**
 * Математическа логика за играта „Вълшебните жетони“.
 * Модулът е напълно независим от React, за да се тества лесно.
 */

export type Grade = 2 | 3 | 4
export type Difficulty = 'explorer' | 'researcher' | 'master'

export const GRADES: Grade[] = [2, 3, 4]
export const DIFFICULTIES: Difficulty[] = ['explorer', 'researcher', 'master']

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  explorer: 'Откривател',
  researcher: 'Изследовател',
  master: 'Майстор',
}

export const DIFFICULTY_DESCRIPTIONS: Record<Difficulty, string> = {
  explorer: 'Лесни задачи с подсказки',
  researcher: 'По-големи числа',
  master: 'Трудни задачи с допълнителни условия',
}

/** Стойности на жетоните за всеки клас (подредени възходящо). */
export const DENOMINATIONS: Record<Grade, number[]> = {
  2: [1, 2, 5, 10, 20],
  3: [1, 5, 10, 50, 100],
  4: [1, 10, 100, 1000, 10000],
}

export type ConditionKind = 'none' | 'minTokens' | 'exactCount' | 'forbidden'

export type Condition =
  | { kind: 'none' }
  /** Да се използват възможно най-малко жетони (count е този минимум). */
  | { kind: 'minTokens'; count: number }
  /** Да се използват точно count жетона. */
  | { kind: 'exactCount'; count: number }
  /** Жетонът value не може да се използва. */
  | { kind: 'forbidden'; value: number }

export interface LevelConfig {
  grade: Grade
  difficulty: Difficulty
  denominations: number[]
  min: number
  max: number
  /** Максимален брой жетони в най-краткото решение — пази задачите приятни. */
  maxTokens: number
  conditions: ConditionKind[]
}

const LEVELS: Record<Grade, Record<Difficulty, Omit<LevelConfig, 'grade' | 'difficulty' | 'denominations'>>> = {
  2: {
    explorer: { min: 10, max: 50, maxTokens: 6, conditions: ['none'] },
    researcher: { min: 30, max: 100, maxTokens: 8, conditions: ['none'] },
    master: { min: 40, max: 100, maxTokens: 9, conditions: ['minTokens', 'exactCount', 'forbidden'] },
  },
  3: {
    explorer: { min: 100, max: 400, maxTokens: 8, conditions: ['none'] },
    researcher: { min: 200, max: 999, maxTokens: 12, conditions: ['none'] },
    master: { min: 300, max: 1000, maxTokens: 13, conditions: ['minTokens', 'exactCount', 'forbidden'] },
  },
  4: {
    explorer: { min: 1000, max: 9999, maxTokens: 10, conditions: ['none'] },
    researcher: { min: 10000, max: 59999, maxTokens: 14, conditions: ['none'] },
    master: { min: 10000, max: 100000, maxTokens: 15, conditions: ['minTokens', 'exactCount', 'forbidden'] },
  },
}

export function getLevelConfig(grade: Grade, difficulty: Difficulty): LevelConfig {
  return { grade, difficulty, denominations: DENOMINATIONS[grade], ...LEVELS[grade][difficulty] }
}

export interface Task {
  id: number
  target: number
  denominations: number[]
  condition: Condition
  /** Едно примерно вярно решение (използва се за подсказките и тестовете). */
  solution: number[]
}

export type Rng = () => number

/** Детерминиран генератор (mulberry32) — за тестове и повторяемост. */
export function seededRng(seed: number): Rng {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function randInt(rng: Rng, min: number, max: number): number {
  return min + Math.floor(rng() * (max - min + 1))
}

function pick<T>(rng: Rng, items: T[]): T {
  return items[Math.floor(rng() * items.length)]
}

export const sum = (values: number[]): number => values.reduce((a, b) => a + b, 0)

/**
 * Разлага числото „алчно“ — винаги с най-голямия възможен жетон.
 * За всички набори в играта това дава най-малкия брой жетони
 * (наборите са канонични — проверено в тестовете с динамично програмиране).
 */
export function greedyDecompose(target: number, denominations: number[]): number[] | null {
  const sorted = [...denominations].sort((a, b) => b - a)
  const result: number[] = []
  let rest = target
  for (const d of sorted) {
    while (rest >= d) {
      result.push(d)
      rest -= d
    }
  }
  return rest === 0 ? result : null
}

/** Точен минимален брой жетони (динамично програмиране) — за проверка. */
export function minTokenCount(target: number, denominations: number[]): number | null {
  const best = new Array<number>(target + 1).fill(Infinity)
  best[0] = 0
  for (let v = 1; v <= target; v++) {
    for (const d of denominations) {
      if (d <= v && best[v - d] + 1 < best[v]) best[v] = best[v - d] + 1
    }
  }
  return Number.isFinite(best[target]) ? best[target] : null
}

/**
 * Увеличава броя жетони в решението, като „разменя“ един жетон
 * за няколко по-малки. Връща новото решение или null.
 */
function splitOnce(solution: number[], denominations: number[], rng: Rng): number[] | null {
  const candidates = solution
    .map((v, i) => ({ v, i }))
    .filter(({ v }) => denominations.some((d) => d < v))
  if (candidates.length === 0) return null
  const { v, i } = pick(rng, candidates)
  const smaller = denominations.filter((d) => d < v)
  const parts = greedyDecompose(v, smaller)
  if (!parts) return null
  const next = [...solution]
  next.splice(i, 1, ...parts)
  return next.sort((a, b) => b - a)
}

function buildCondition(
  kind: ConditionKind,
  target: number,
  config: LevelConfig,
  rng: Rng,
): { condition: Condition; solution: number[] } | null {
  const { denominations, maxTokens } = config
  const greedy = greedyDecompose(target, denominations)
  if (!greedy) return null

  switch (kind) {
    case 'none':
      return greedy.length <= maxTokens ? { condition: { kind: 'none' }, solution: greedy } : null

    case 'minTokens':
      // Условието е интересно, само ако има поне два вида жетони.
      if (greedy.length > maxTokens || new Set(greedy).size < 2) return null
      return { condition: { kind: 'minTokens', count: greedy.length }, solution: greedy }

    case 'exactCount': {
      if (greedy.length > maxTokens) return null
      let solution: number[] | null = greedy
      const splits = randInt(rng, 1, 2)
      for (let s = 0; s < splits && solution; s++) solution = splitOnce(solution, denominations, rng)
      if (!solution || solution.length > maxTokens + 4) return null
      return { condition: { kind: 'exactCount', count: solution.length }, solution }
    }

    case 'forbidden': {
      // Забраняваме жетон, който иначе би бил полезен (не и 1 — така винаги е решимо).
      const options = [...new Set(greedy)].filter((v) => v !== 1)
      if (options.length === 0) return null
      const value = pick(rng, options)
      const allowed = denominations.filter((d) => d !== value)
      const solution = greedyDecompose(target, allowed)
      if (!solution || solution.length > maxTokens + 3) return null
      return { condition: { kind: 'forbidden', value }, solution }
    }
  }
}

/** Генерира една решима задача за даденото ниво. */
export function generateTask(config: LevelConfig, rng: Rng = Math.random, id = 0, avoid: Set<number> = new Set()): Task {
  for (let attempt = 0; attempt < 500; attempt++) {
    const target = randInt(rng, config.min, config.max)
    if (avoid.has(target) && attempt < 400) continue
    const kind = pick(rng, config.conditions)
    const built = buildCondition(kind, target, config, rng)
    if (built) return { id, target, denominations: config.denominations, ...built }
  }
  // Резервен вариант (практически недостижим): кръгло число без условие.
  const target = config.min
  return {
    id,
    target,
    denominations: config.denominations,
    condition: { kind: 'none' },
    solution: greedyDecompose(target, config.denominations) ?? [],
  }
}

/** Генерира серия задачи с различни целеви числа. */
export function generateSession(config: LevelConfig, count: number, rng: Rng = Math.random): Task[] {
  const used = new Set<number>()
  const tasks: Task[] = []
  for (let i = 0; i < count; i++) {
    const task = generateTask(config, rng, i + 1, used)
    used.add(task.target)
    tasks.push(task)
  }
  return tasks
}

export type CheckStatus = 'correct' | 'empty' | 'under' | 'over' | 'forbiddenUsed' | 'tooManyTokens' | 'wrongCount'

export interface CheckResult {
  status: CheckStatus
  sum: number
  message: string
}

/** Проверява поставените жетони спрямо задачата. */
export function checkAnswer(task: Task, placed: number[], withDetails = true): CheckResult {
  const total = sum(placed)
  const { condition, target } = task

  if (placed.length === 0) {
    return { status: 'empty', sum: 0, message: 'Постави жетони в зоната.' }
  }
  if (condition.kind === 'forbidden' && placed.includes(condition.value)) {
    return {
      status: 'forbiddenUsed',
      sum: total,
      message: `Жетонът ${formatNumber(condition.value)} не може да се използва в тази задача.`,
    }
  }
  if (total < target) {
    return {
      status: 'under',
      sum: total,
      message: withDetails
        ? `Сборът е ${formatNumber(total)}. Трябват ти още ${formatNumber(target - total)}.`
        : 'Сборът е по-малък от числото.',
    }
  }
  if (total > target) {
    return {
      status: 'over',
      sum: total,
      message: withDetails
        ? `Сборът е ${formatNumber(total)} — с ${formatNumber(total - target)} повече. Махни някой жетон.`
        : 'Сборът е по-голям от числото.',
    }
  }
  if (condition.kind === 'minTokens' && placed.length !== condition.count) {
    return {
      status: 'tooManyTokens',
      sum: total,
      message: withDetails
        ? `Сборът е верен, но може и с по-малко жетони — опитай с ${condition.count}.`
        : 'Сборът е верен, но може и с по-малко жетони.',
    }
  }
  if (condition.kind === 'exactCount' && placed.length !== condition.count) {
    return {
      status: 'wrongCount',
      sum: total,
      message: `Сборът е верен, но жетоните са ${placed.length}, а трябва да са ${condition.count}.`,
    }
  }
  return { status: 'correct', sum: total, message: 'Браво!' }
}

/** Текст на условието за показване на таблото. */
export function conditionText(condition: Condition): string | null {
  switch (condition.kind) {
    case 'none':
      return null
    case 'minTokens':
      return 'Използвай възможно най-малко жетони.'
    case 'exactCount':
      return `Използвай точно ${condition.count} ${condition.count === 1 ? 'жетон' : 'жетона'}.`
    case 'forbidden':
      return `Без жетон ${formatNumber(condition.value)}!`
  }
}

/** Жетоните, които ученикът може да използва в задачата. */
export function allowedDenominations(task: Task): number[] {
  const c = task.condition
  return c.kind === 'forbidden' ? task.denominations.filter((d) => d !== c.value) : task.denominations
}

/** Разлика между мултимножества: какво от `full` липсва в `part`; null ако `part` не е част от `full`. */
function missingFrom(full: number[], part: number[]): number[] | null {
  const rest = [...full]
  for (const v of part) {
    const i = rest.indexOf(v)
    if (i === -1) return null
    rest.splice(i, 1)
  }
  return rest
}

export interface Hint {
  /** Стойност на жетон, който е добре да се добави (или null). */
  suggest: number | null
  /** Стойност на жетон, който е добре да се махне (или null). */
  remove: number | null
  message: string
}

/** Подсказка за следващата стъпка според текущото решение. */
export function nextHint(task: Task, placed: number[]): Hint {
  const total = sum(placed)
  const allowed = allowedDenominations(task)
  const c = task.condition

  if (c.kind === 'forbidden') {
    const bad = placed.find((v) => v === c.value)
    if (bad !== undefined) {
      return { suggest: null, remove: bad, message: `Махни жетона ${formatNumber(bad)} — той е забранен.` }
    }
  }
  if (total > task.target) {
    const over = total - task.target
    const removable = [...placed].sort((a, b) => a - b).find((v) => v >= over) ?? Math.max(...placed)
    return {
      suggest: null,
      remove: removable,
      message: `Имаш с ${formatNumber(over)} повече. Махни жетона ${formatNumber(removable)}.`,
    }
  }

  // Ако текущото решение е част от примерното — продължаваме по него.
  const missing = missingFrom(task.solution, placed)
  if (missing && missing.length > 0) {
    const next = Math.max(...missing)
    return {
      suggest: next,
      remove: null,
      message: `Остават ${formatNumber(task.target - total)}. Опитай с жетон ${formatNumber(next)}.`,
    }
  }

  if (total === task.target) {
    if (c.kind === 'minTokens' && placed.length > c.count) {
      return {
        suggest: null,
        remove: null,
        message: 'Размени няколко малки жетона с един по-голям. Натисни „Изчисти“ и започни с най-големите.',
      }
    }
    if (c.kind === 'exactCount' && placed.length !== c.count) {
      return {
        suggest: null,
        remove: null,
        message:
          placed.length < c.count
            ? 'Трябват ти повече жетони. Размени един голям жетон с няколко по-малки.'
            : 'Трябват ти по-малко жетони. Размени няколко малки жетона с един по-голям.',
      }
    }
    return { suggest: null, remove: null, message: 'Сборът е точен! Натисни „Провери“.' }
  }

  const rest = task.target - total
  const next = [...allowed].sort((a, b) => b - a).find((d) => d <= rest) ?? null
  return {
    suggest: next,
    remove: null,
    message:
      next === null
        ? 'Натисни „Изчисти“ и опитай отново.'
        : `Остават ${formatNumber(rest)}. Опитай с жетон ${formatNumber(next)}.`,
  }
}

// ---------- Позиционни стойности и форматиране ----------

const PLACE_NAMES: { value: number; one: string; many: string }[] = [
  { value: 100000, one: 'стотица хиляди', many: 'стотици хиляди' },
  { value: 10000, one: 'десетица хиляди', many: 'десетици хиляди' },
  { value: 1000, one: 'хиляда', many: 'хиляди' },
  { value: 100, one: 'стотица', many: 'стотици' },
  { value: 10, one: 'десетица', many: 'десетици' },
  { value: 1, one: 'единица', many: 'единици' },
]

/** „47 = 4 десетици и 7 единици“ */
export function placeValueText(n: number): string {
  const parts: string[] = []
  let rest = n
  for (const p of PLACE_NAMES) {
    const count = Math.floor(rest / p.value)
    rest -= count * p.value
    if (count > 0) parts.push(`${count} ${count === 1 ? p.one : p.many}`)
  }
  if (parts.length === 0) return `${n} = 0`
  const joined = parts.length === 1 ? parts[0] : `${parts.slice(0, -1).join(', ')} и ${parts[parts.length - 1]}`
  return `${formatNumber(n)} = ${joined}`
}

/**
 * Форматиране по българския правопис: числата с пет и повече цифри
 * се групират по три с интервал (10 000), четирицифрените — без (4500).
 */
export function formatNumber(n: number): string {
  if (Math.abs(n) < 10000) return String(n)
  return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
}

/** Звезди за една задача според опитите и подсказките. */
export function starsForTask(mistakes: number, usedHint: boolean): 1 | 2 | 3 {
  if (mistakes === 0 && !usedHint) return 3
  if (mistakes <= 1) return 2
  return 1
}
