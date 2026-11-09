/**
 * „Върхът на кулата“ — ходът на приключението (чиста функция, с тестове).
 * Етапи: изкачване (кулата отвън) → зала (4 задачи) → ключ → изкачване … → съкровище (край).
 * Задачата не се променя след грешен опит; след 3 неуспешни опита може „Продължи нататък“ (0 звезди, без отговора).
 */
import type { Difficulty, Grade } from '../../../magic-tokens/logic'
import { SKIP_AFTER, TASKS_PER_HALL, starsTop, type HallId } from './common'
import type { StairsTask } from './stairs'

/** Задача от някоя от залите (залите 2 и 3 се добавят на следващия етап). */
export type TopTask = StairsTask

export interface TaskResult {
  stars: 0 | 1 | 2 | 3
  solved: boolean
  firstTry: boolean
  usedHint: boolean
  attempts: number
}

export type Phase = 'climb' | 'hall' | 'solved' | 'key' | 'done'

export interface TopSession {
  v: 1
  grade: Grade
  difficulty: Difficulty
  tasks: TopTask[]
  /** Индексът на текущата задача (0…11). */
  index: number
  phase: Phase
  /** Неуспешни опити по текущата задача. */
  wrong: number
  usedHint: boolean
  results: TaskResult[]
  keys: number
  hintsUsed: number
  startedAt: number
  /** Изминало време (мс) до последното запазване — за възстановяване след презареждане. */
  elapsedMs: number
}

export type TopAction =
  | { type: 'enter' }
  | { type: 'check'; correct: boolean }
  | { type: 'hint' }
  | { type: 'skip' }
  | { type: 'next' }
  | { type: 'climb' }
  | { type: 'finish' }
  | { type: 'tick'; now: number }

export function newSession(grade: Grade, difficulty: Difficulty, tasks: TopTask[], now: number): TopSession {
  return { v: 1, grade, difficulty, tasks, index: 0, phase: 'climb', wrong: 0, usedHint: false, results: [], keys: 0, hintsUsed: 0, startedAt: now, elapsedMs: 0 }
}

/** Изкачването е стигнало върха (всички зали са минати). */
export const atTop = (s: TopSession) => s.index >= s.tasks.length

/** Залата на задача с индекс i. */
export const hallOf = (i: number): HallId => Math.min(2, Math.floor(i / TASKS_PER_HALL)) as HallId
/** Позицията в залата (0…3). */
export const posInHall = (i: number) => i % TASKS_PER_HALL

export const canSkip = (s: TopSession) => s.phase === 'hall' && s.wrong >= SKIP_AFTER

export function topReducer(s: TopSession, a: TopAction): TopSession {
  switch (a.type) {
    case 'enter':
      return s.phase === 'climb' && s.index < s.tasks.length ? { ...s, phase: 'hall' } : s
    case 'hint':
      if (s.phase !== 'hall' || s.usedHint) return s
      return { ...s, usedHint: true, hintsUsed: s.hintsUsed + 1 }
    case 'check': {
      if (s.phase !== 'hall') return s
      if (!a.correct) return { ...s, wrong: s.wrong + 1 }
      const r: TaskResult = { stars: starsTop(s.wrong, s.usedHint, false), solved: true, firstTry: s.wrong === 0 && !s.usedHint, usedHint: s.usedHint, attempts: s.wrong + 1 }
      return { ...s, phase: 'solved', results: [...s.results, r] }
    }
    case 'skip': {
      if (!canSkip(s)) return s
      const r: TaskResult = { stars: 0, solved: false, firstTry: false, usedHint: s.usedHint, attempts: s.wrong }
      return { ...s, phase: 'solved', results: [...s.results, r] }
    }
    case 'next': {
      if (s.phase !== 'solved') return s
      const index = s.index + 1
      const base = { ...s, index, wrong: 0, usedHint: false }
      // край на залата → ключ
      if (posInHall(index) === 0 || index >= s.tasks.length) return { ...base, index: s.index, keys: s.keys + 1, phase: 'key' }
      return { ...base, phase: 'hall' }
    }
    case 'climb': {
      if (s.phase !== 'key') return s
      // камерата се качва към следващата зала (след последната — към върха със съкровището)
      return { ...s, index: s.index + 1, wrong: 0, usedHint: false, phase: 'climb' }
    }
    case 'finish':
      // отваряне на съкровището — само на върха, след всички задачи
      return s.phase === 'climb' && s.index >= s.tasks.length ? { ...s, phase: 'done' } : s
    case 'tick':
      return { ...s, elapsedMs: Math.max(s.elapsedMs, a.now - s.startedAt) }
  }
}

/** Обобщение за финалния отчет и записа. */
export function summary(s: TopSession) {
  return {
    total: s.tasks.length,
    solved: s.results.filter((r) => r.solved).length,
    firstTry: s.results.filter((r) => r.firstTry).length,
    stars: s.results.reduce((a, r) => a + r.stars, 0),
    maxStars: s.tasks.length * 3,
    hints: s.hintsUsed,
    keys: s.keys,
    durationSec: Math.round(s.elapsedMs / 1000),
  }
}
