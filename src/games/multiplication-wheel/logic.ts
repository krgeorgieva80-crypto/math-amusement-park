/**
 * „Колелото на умножението“ — режим „Открий равните групи“.
 * Кабинките на колелото са равните групи: g кабинки по s деца.
 * Връзка: s + s + … + s (g пъти) = s · g.
 * По българския учебен запис първият множител е събираемото,
 * а вторият показва колко пъти е взето (3 + 3 + 3 + 3 = 3 · 4).
 * Чист TypeScript — без React.
 */
import type { Difficulty, Grade, Rng } from '../magic-tokens/logic'

export const MAX_PER_CABIN = 10
export const MIN_CABINS = 2
export const MAX_CABINS = 10

export type WheelModeId = 'equalGroups' | 'spin' | 'table' | 'challenge'

export const WHEEL_MODES: { id: WheelModeId; label: string; description: string; ready: boolean }[] = [
  { id: 'equalGroups', label: 'Открий равните групи', description: 'Сложи по равно деца в кабинките', ready: true },
  { id: 'spin', label: 'Завърти колелото', description: 'Умножавай с колелото', ready: false },
  { id: 'table', label: 'Попълни таблицата', description: 'Таблицата за умножение', ready: false },
  { id: 'challenge', label: 'Предизвикателството на колелото', description: 'Трудни задачи', ready: false },
]

/**
 * fill — празни кабинки, сложи по s деца;
 * fix — кабинките са пълни неравно, направи ги по s;
 * match — направи всички като първата (тя е заключена и има s деца).
 */
export type GroupsKind = 'fill' | 'fix' | 'match'

export interface GroupsLevel {
  groups: [number, number]
  size: [number, number]
  kind: GroupsKind
}

const LEVELS: Record<Grade, Record<Difficulty, GroupsLevel>> = {
  2: {
    explorer: { groups: [2, 4], size: [2, 5], kind: 'fill' },
    researcher: { groups: [3, 6], size: [2, 6], kind: 'fix' },
    master: { groups: [4, 8], size: [3, 9], kind: 'match' },
  },
  3: {
    explorer: { groups: [3, 6], size: [3, 7], kind: 'fill' },
    researcher: { groups: [4, 8], size: [4, 9], kind: 'fix' },
    master: { groups: [6, 10], size: [6, 10], kind: 'match' },
  },
  // 4. клас използва най-трудните граници (таблицата е преговор).
  4: {
    explorer: { groups: [4, 8], size: [4, 9], kind: 'fill' },
    researcher: { groups: [5, 10], size: [5, 10], kind: 'fix' },
    master: { groups: [6, 10], size: [6, 10], kind: 'match' },
  },
}

export function groupsLevel(grade: Grade, difficulty: Difficulty): GroupsLevel {
  return LEVELS[grade][difficulty]
}

export interface GroupsTask {
  id: number
  /** Брой кабинки (групи) — вторият множител. */
  groups: number
  /** Деца във всяка кабинка — първият множител (събираемото). */
  size: number
  kind: GroupsKind
  /** Начален брой деца по кабинки. */
  start: number[]
}

export const product = (t: GroupsTask) => t.size * t.groups

const randInt = (rng: Rng, a: number, b: number) => a + Math.floor(rng() * (b - a + 1))

/** Неравно начално пълнене, при което поне половината кабинки са грешни. */
function unequalStart(groups: number, size: number, rng: Rng, lockFirst: boolean): number[] {
  for (let attempt = 0; attempt < 200; attempt++) {
    const start = Array.from({ length: groups }, () => randInt(rng, Math.max(0, size - 3), Math.min(MAX_PER_CABIN, size + 3)))
    if (lockFirst) start[0] = size
    const wrong = start.filter((c, i) => c !== size && !(lockFirst && i === 0)).length
    const need = Math.ceil((lockFirst ? groups - 1 : groups) / 2)
    if (wrong >= need) return start
  }
  // резервно: всяка втора кабинка с едно дете повече/по-малко
  return Array.from({ length: groups }, (_, i) => (lockFirst && i === 0 ? size : i % 2 ? Math.min(MAX_PER_CABIN, size + 1) : Math.max(0, size - 1)))
}

export function generateGroupsTask(level: GroupsLevel, rng: Rng, id: number): GroupsTask {
  const groups = randInt(rng, level.groups[0], Math.min(MAX_CABINS, level.groups[1]))
  const size = randInt(rng, level.size[0], Math.min(MAX_PER_CABIN, level.size[1]))
  const start = level.kind === 'fill' ? new Array(groups).fill(0) : unequalStart(groups, size, rng, level.kind === 'match')
  return { id, groups, size, kind: level.kind, start }
}

/** Серия задачи с различни двойки (групи, деца). */
export function generateGroupsTasks(grade: Grade, difficulty: Difficulty, count: number, rng: Rng = Math.random): GroupsTask[] {
  const level = groupsLevel(grade, difficulty)
  const seen = new Set<string>()
  const tasks: GroupsTask[] = []
  for (let i = 0; i < count; i++) {
    let t = generateGroupsTask(level, rng, i + 1)
    for (let k = 0; k < 50 && seen.has(`${t.groups}x${t.size}`); k++) t = generateGroupsTask(level, rng, i + 1)
    seen.add(`${t.groups}x${t.size}`)
    tasks.push(t)
  }
  return tasks
}

// ───────────────────────── Кабинки ─────────────────────────

/** Може ли кабинката да се променя (в „match“ първата е заключена). */
export const isLocked = (t: GroupsTask, i: number) => t.kind === 'match' && i === 0

export function addPassenger(t: GroupsTask, cabins: number[], i: number): number[] {
  if (isLocked(t, i) || i < 0 || i >= cabins.length || cabins[i] >= MAX_PER_CABIN) return cabins
  const next = [...cabins]
  next[i]++
  return next
}

export function removePassenger(t: GroupsTask, cabins: number[], i: number): number[] {
  if (isLocked(t, i) || i < 0 || i >= cabins.length || cabins[i] <= 0) return cabins
  const next = [...cabins]
  next[i]--
  return next
}

const kids = (n: number) => (n === 1 ? 'дете' : 'деца')

export interface Check {
  status: 'correct' | 'wrong' | 'incomplete'
  message: string
  /** Номер (от 0) на кабинката, която да светне. */
  cabin?: number
}

/** Етап „Представи“: всички кабинки трябва да имат по s деца. */
export function checkGroups(t: GroupsTask, cabins: number[], details = true): Check {
  if (cabins.every((c) => c === 0)) return { status: 'incomplete', message: 'Сложи деца в кабинките.' }
  const i = cabins.findIndex((c) => c !== t.size)
  if (i === -1) return { status: 'correct', message: 'Всички кабинки са равни!' }
  if (!details) return { status: 'wrong', message: 'Кабинките още не са равни.', cabin: i }
  const c = cabins[i]
  const what = t.kind === 'match' ? `а в първата има ${t.size}` : `а трябва ${t.size}`
  return {
    status: 'wrong',
    cabin: i,
    message: c < t.size ? `В кабинка ${i + 1} има ${c} ${kids(c)}, ${what}. Добави ${t.size - c}.` : `В кабинка ${i + 1} има ${c} ${kids(c)}, ${what}. Махни ${c - t.size}.`,
  }
}

// ───────────────────────── Пресмятане ─────────────────────────

/** „3 + 3 + 3 + 3“ */
export function repeatedSumText(t: GroupsTask): string {
  return new Array(t.groups).fill(String(t.size)).join(' + ')
}

/** Подетапи на „Пресметни“: първо сборът, после умножението. */
export type ComputeStep = 'sum' | 'factor'

export interface AnswerCheck {
  status: 'correct' | 'wrong' | 'incomplete'
  message: string
}

/** Сборът на равните събираеми (резултатът не се съобщава при грешка). */
export function checkSum(t: GroupsTask, input: string, details = true): AnswerCheck {
  if (input.trim() === '') return { status: 'incomplete', message: 'Напиши колко деца има общо.' }
  const v = Number(input)
  if (v === product(t)) return { status: 'correct', message: 'Точно така!' }
  if (!details) return { status: 'wrong', message: 'Не е вярно. Опитай отново.' }
  return { status: 'wrong', message: v > product(t) ? 'Получи повече. Преброй децата отново.' : 'Получи по-малко. Преброй децата отново.' }
}

/** Колко пъти е взето събираемото (вторият множител). */
export function checkFactor(t: GroupsTask, input: string): AnswerCheck {
  if (input.trim() === '') return { status: 'incomplete', message: 'Напиши колко пъти.' }
  if (Number(input) === t.groups) return { status: 'correct', message: 'Браво!' }
  return { status: 'wrong', message: `Не е вярно. Преброй кабинките — във всяка има по ${t.size}.` }
}

/** Подсказка без издаване на крайния резултат. */
export function groupsHint(t: GroupsTask, cabins: number[], step: 'model' | ComputeStep): string {
  if (step === 'model') {
    const r = checkGroups(t, cabins)
    if (r.status === 'correct') return 'Всички са равни! Натисни „Провери“.'
    if (r.status === 'incomplete') return `Сложи по ${t.size} ${kids(t.size)} във всяка кабинка.`
    return r.message
  }
  if (step === 'sum') {
    // броене през s: първите стъпки, но не крайният резултат
    const steps = Array.from({ length: Math.min(t.groups - 1, 3) }, (_, i) => t.size * (i + 1))
    return `Брой по ${t.size}: ${steps.join(', ')}, …`
  }
  return `Колко кабинки има на колелото? Във всяка има по ${t.size}.`
}

/** Какво се показва преди и след проверката (сборът — само след нея). */
export function equationTexts(t: GroupsTask, sumDone: boolean, factorDone: boolean) {
  const total = product(t)
  return {
    sum: `${repeatedSumText(t)} =`,
    sumAnswer: sumDone ? String(total) : null,
    factor: sumDone ? `${t.size} · ? = ${total}` : null,
    full: factorDone ? `${repeatedSumText(t)} = ${t.size} · ${t.groups} = ${total}` : null,
  }
}

/** Заглавие на задачата за таблото. */
export function groupsTitle(t: GroupsTask): { label: string; text: string } {
  if (t.kind === 'match') return { label: 'Направи кабинките равни', text: `${t.groups} кабинки` }
  return { label: 'Открий равните групи', text: `${t.groups} кабинки по ${t.size}` }
}

export function groupsInstruction(t: GroupsTask): string {
  switch (t.kind) {
    case 'fill':
      return `Сложи по ${t.size} ${kids(t.size)} във всяка кабинка.`
    case 'fix':
      return `Направи кабинките равни — по ${t.size} ${kids(t.size)} във всяка.`
    case 'match':
      return 'Във всяка кабинка да има толкова деца, колкото в първата.'
  }
}
