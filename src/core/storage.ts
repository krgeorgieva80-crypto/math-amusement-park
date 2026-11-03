/**
 * Локално съхранение (localStorage). Не се пазят лични данни —
 * само настройки и анонимни резултати от игрите.
 */
import type { Difficulty, Grade } from '../games/magic-tokens/logic'

export type TokensRegrouping = 'none' | 'with' | 'mixed'
/** По-малкият или по-големият числов обхват за класа. */
export type TokensRangeLevel = 'small' | 'large'

const SETTINGS_KEY = 'map.settings.v1'
const RESULTS_KEY = 'map.results.v1'
const MAX_RESULTS = 300

export type TaskCount = 5 | 10 | 15

export interface Settings {
  soundOn: boolean
  musicOn: boolean
  volume: number
  grade: Grade
  difficulty: Difficulty
  taskCount: TaskCount
  hintsOn: boolean
  /** Учениците могат сами да сменят класа и трудността. */
  studentCanChoose: boolean
  /** Декоративни анимации (облаци, колело, балони и др.). */
  animationsOn: boolean
  /** „Вълшебните жетони“: преминаване по подразбиране. */
  tokensRegrouping: TokensRegrouping
  /** „Вълшебните жетони“: числов обхват по подразбиране. */
  tokensRange: TokensRangeLevel
}

export const DEFAULT_SETTINGS: Settings = {
  soundOn: true,
  musicOn: false,
  volume: 0.7,
  grade: 2,
  difficulty: 'explorer',
  taskCount: 10,
  hintsOn: true,
  studentCanChoose: true,
  animationsOn: true,
  tokensRegrouping: 'mixed',
  tokensRange: 'large',
}

export interface GameResult {
  id: string
  /** ISO дата и час */
  date: string
  game: string
  /** Режим и вид задачи (за „Вълшебните жетони“). */
  mode?: string
  grade: Grade
  difficulty: Difficulty
  total: number
  solved: number
  firstTry: number
  stars: number
  maxStars: number
  durationSec: number
}

function read<T>(key: string): T | null {
  try {
    const raw = window.localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}

function write(key: string, value: unknown): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Частен режим или пълно хранилище — играта продължава без запазване.
  }
}

export function loadSettings(): Settings {
  const saved = read<Partial<Settings>>(SETTINGS_KEY)
  const merged = { ...DEFAULT_SETTINGS, ...saved }
  // Защита от повредени стойности.
  if (![2, 3, 4].includes(merged.grade)) merged.grade = DEFAULT_SETTINGS.grade
  if (!['explorer', 'researcher', 'master'].includes(merged.difficulty)) merged.difficulty = DEFAULT_SETTINGS.difficulty
  if (![5, 10, 15].includes(merged.taskCount)) merged.taskCount = DEFAULT_SETTINGS.taskCount
  if (!['none', 'with', 'mixed'].includes(merged.tokensRegrouping)) merged.tokensRegrouping = DEFAULT_SETTINGS.tokensRegrouping
  if (!['small', 'large'].includes(merged.tokensRange)) merged.tokensRange = DEFAULT_SETTINGS.tokensRange
  if (typeof merged.volume !== 'number' || merged.volume < 0 || merged.volume > 1) merged.volume = DEFAULT_SETTINGS.volume
  return merged
}

export function saveSettings(settings: Settings): void {
  write(SETTINGS_KEY, settings)
}

export function loadResults(): GameResult[] {
  const saved = read<GameResult[]>(RESULTS_KEY)
  return Array.isArray(saved) ? saved : []
}

export function addResult(result: Omit<GameResult, 'id' | 'date'>): GameResult[] {
  const entry: GameResult = {
    ...result,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    date: new Date().toISOString(),
  }
  const next = [entry, ...loadResults()].slice(0, MAX_RESULTS)
  write(RESULTS_KEY, next)
  return next
}

export function clearResults(): void {
  write(RESULTS_KEY, [])
}

/** Най-добрият резултат в звезди за дадена игра, клас и трудност. */
export function bestStars(results: GameResult[], game: string, grade: Grade, difficulty: Difficulty): number | null {
  const relevant = results.filter((r) => r.game === game && r.grade === grade && r.difficulty === difficulty)
  if (relevant.length === 0) return null
  return Math.max(...relevant.map((r) => Math.round((r.stars / r.maxStars) * 3)))
}
