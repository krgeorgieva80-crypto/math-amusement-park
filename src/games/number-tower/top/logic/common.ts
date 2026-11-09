/**
 * „Върхът на кулата“ — общи типове и правила (чист TypeScript).
 * Три зали по 4 задачи; звезди 3/2/1/0; по един ключ след всяка зала.
 */
import type { Difficulty, Grade, Rng } from '../../../magic-tokens/logic'

export type HallId = 0 | 1 | 2
export const HALLS: { id: HallId; name: string; short: string }[] = [
  { id: 0, name: 'Стълбата на числата', short: 'Стълбата' },
  { id: 1, name: 'Мостът на загадките', short: 'Мостът' },
  { id: 2, name: 'Тайната на върха', short: 'Обсерваторията' },
]
export const TASKS_PER_HALL = 4

/** Опции за генериране: клас, ниво и изучените таблици (от учителския панел). */
export interface GenOptions {
  grade: Grade
  difficulty: Difficulty
  tables: number[]
}

/**
 * Звезди за задача:
 * 3 — верен от първия опит без помощ; 2 — от втория без помощ;
 * 1 — от третия или следващ опит, или с помощ; 0 — пропусната („Продължи нататък“).
 */
export function starsTop(wrongAttempts: number, usedHint: boolean, skipped: boolean): 0 | 1 | 2 | 3 {
  if (skipped) return 0
  if (usedHint) return 1
  if (wrongAttempts === 0) return 3
  if (wrongAttempts === 1) return 2
  return 1
}

/** След толкова неуспешни опита се появява „Продължи нататък“. */
export const SKIP_AFTER = 3

export const randInt = (rng: Rng, a: number, b: number) => a + Math.floor(rng() * (b - a + 1))
export const pick = <T>(xs: T[], rng: Rng): T => xs[Math.floor(rng() * xs.length)]
export function shuffle<T>(xs: T[], rng: Rng): T[] {
  const a = [...xs]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}
