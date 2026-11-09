/**
 * Запазване на недовършено приключение (локално, без лични данни).
 * Възстановява се само ако записът е валиден и е за същия клас и ниво.
 */
import type { Difficulty, Grade } from '../../../magic-tokens/logic'
import type { TopSession } from './session'

export const TOP_KEY = 'map.towerTop.v1'

type Store = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>
const store = (): Store | null => {
  try {
    return typeof window !== 'undefined' ? window.localStorage : null
  } catch {
    return null
  }
}

export function saveTop(s: TopSession, st: Store | null = store()) {
  try {
    st?.setItem(TOP_KEY, JSON.stringify(s))
  } catch {
    /* няма място / забранено — играта продължава без запис */
  }
}

export function clearTop(st: Store | null = store()) {
  try {
    st?.removeItem(TOP_KEY)
  } catch {
    /* нищо */
  }
}

/** Валидиран запис или null (повреден, стар, завършен или за друг клас/ниво). */
export function loadTop(grade: Grade, difficulty: Difficulty, st: Store | null = store()): TopSession | null {
  try {
    const raw = st?.getItem(TOP_KEY)
    if (!raw) return null
    const s = JSON.parse(raw) as TopSession
    const ok =
      s &&
      s.v === 1 &&
      s.grade === grade &&
      s.difficulty === difficulty &&
      Array.isArray(s.tasks) &&
      s.tasks.length > 0 &&
      Number.isInteger(s.index) &&
      s.index >= 0 &&
      s.index <= s.tasks.length &&
      (s.index < s.tasks.length || s.phase === 'climb') &&
      Array.isArray(s.results) &&
      s.results.length <= s.tasks.length &&
      s.phase !== 'done' &&
      ['climb', 'hall', 'solved', 'key'].includes(s.phase)
    return ok ? s : null
  } catch {
    return null
  }
}
