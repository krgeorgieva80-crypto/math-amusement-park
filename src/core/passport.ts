/**
 * Приключенски паспорт: отделен за 2., 3. и 4. клас.
 * Печатите НЕ се записват отделно — изчисляват се от вече записаните резултати
 * (единствен източник: звезди и резултати), така нищо не се брои два пъти.
 * Локално се пази само кои печати/отметки детето вече е видяло (за анимацията „Нов печат“).
 * Без имена и лични данни.
 */
import type { Grade } from '../games/magic-tokens/logic'
import type { GameResult } from './storage'

export interface PassportGame {
  /** Уникален ключ на играта в паспорта. */
  key: string
  name: string
  /** Резултатът принадлежи на тази игра, ако режимът започва с някой от префиксите. */
  prefixes: string[]
}

export interface PassportPage {
  attraction: 'magic-tokens' | 'multiplication-wheel' | 'number-tower'
  name: string
  /** Кратко пожелание върху печата. */
  motto: string
  games: PassportGame[]
}

/**
 * Страниците на паспорта — само разработените атракции (атракциите „Очаквай скоро“ не се показват).
 * Префиксите съвпадат с имената на режимите, които игрите записват днес.
 */
export const PASSPORT_PAGES: PassportPage[] = [
  {
    attraction: 'magic-tokens',
    name: 'Вълшебните жетони',
    motto: 'Майстор на числата',
    games: [
      // старите записи без режим са от „С различни жетони“ (съставяне на числа)
      { key: 'mt-compose', name: 'Състави числото', prefixes: ['Състави числото', 'С различни жетони'] },
      { key: 'mt-add', name: 'Събиране', prefixes: ['Събиране'] },
      { key: 'mt-subtract', name: 'Изваждане', prefixes: ['Изваждане'] },
      { key: 'mt-challenge', name: 'Предизвикателство', prefixes: ['Предизвикателство'] },
    ],
  },
  {
    attraction: 'multiplication-wheel',
    name: 'Колелото на умножението',
    motto: 'Покорител на колелото',
    games: [
      { key: 'mw-groups', name: 'Открий равните групи', prefixes: ['Колелото: Открий равните групи'] },
      { key: 'mw-spin', name: 'Завърти колелото', prefixes: ['Колелото: Завърти колелото'] },
      { key: 'mw-table', name: 'Попълни таблицата', prefixes: ['Колелото: Попълни таблицата'] },
      { key: 'mw-challenge', name: 'Предизвикателството на колелото', prefixes: ['Колелото: Предизвикателството'] },
    ],
  },
  {
    attraction: 'number-tower',
    name: 'Кулата на числата',
    motto: 'Пазител на числата',
    games: [
      { key: 'nt-build', name: 'Построй кулата', prefixes: ['Кулата: Построй кулата'] },
      { key: 'nt-secret', name: 'Тайните етажи', prefixes: ['Кулата: Тайните етажи'] },
      { key: 'nt-lift', name: 'Числовият асансьор', prefixes: ['Кулата: Числовият асансьор'] },
      { key: 'nt-top', name: 'Върхът на кулата', prefixes: ['Кулата: Върхът на кулата'] },
    ],
  },
]

const modeOf = (r: GameResult) => r.mode ?? 'С различни жетони'

/** Завършена игра: има запис за нея в този клас с всички решени задачи. */
const completes = (r: GameResult, page: PassportPage, game: PassportGame, grade: Grade) =>
  r.game === page.attraction && r.grade === grade && r.total > 0 && r.solved === r.total && game.prefixes.some((p) => modeOf(r).startsWith(p))

export interface PassportState {
  grade: Grade
  pages: {
    page: PassportPage
    /** Завършените игри (ключове). */
    done: string[]
    /** Печатът на атракцията — когато всички нейни игри са завършени. */
    stamped: boolean
  }[]
  stamps: number
  games: number
  totalGames: number
}

export function passportFor(results: GameResult[], grade: Grade): PassportState {
  const pages = PASSPORT_PAGES.map((page) => {
    const done = page.games.filter((g) => results.some((r) => completes(r, page, g, grade))).map((g) => g.key)
    return { page, done, stamped: done.length === page.games.length }
  })
  return {
    grade,
    pages,
    stamps: pages.filter((p) => p.stamped).length,
    games: pages.reduce((a, p) => a + p.done.length, 0),
    totalGames: PASSPORT_PAGES.reduce((a, p) => a + p.games.length, 0),
  }
}

// ───────────────────────── Видяното (за „Нов печат“) ─────────────────────────

const SEEN_KEY = 'map.passport.v1'

type Seen = Partial<Record<Grade, { games: string[]; stamps: string[] }>>

function readSeen(): Seen {
  try {
    const raw = window.localStorage.getItem(SEEN_KEY)
    const v = raw ? JSON.parse(raw) : {}
    return v && typeof v === 'object' ? v : {}
  } catch {
    return {}
  }
}

function writeSeen(v: Seen) {
  try {
    window.localStorage.setItem(SEEN_KEY, JSON.stringify(v))
  } catch {
    // частен режим — паспортът работи и без анимацията
  }
}

export interface PassportNews {
  /** Нови завършени игри (имена) от последното посещение на картата. */
  games: string[]
  /** Нови печати (страници). */
  stamps: PassportPage[]
}

/**
 * Какво е ново в паспорта за класа. Видяното се „подрязва“ до реалното
 * (ако учителят изтрие резултатите, паспортът се изпразва и после пак показва новото).
 */
export function passportNews(state: PassportState): PassportNews {
  const seen = readSeen()[state.grade] ?? { games: [], stamps: [] }
  return {
    games: state.pages.flatMap((p) => p.page.games.filter((g) => p.done.includes(g.key) && !seen.games.includes(g.key)).map((g) => g.name)),
    stamps: state.pages.filter((p) => p.stamped && !seen.stamps.includes(p.page.attraction)).map((p) => p.page),
  }
}

/** Отбелязва текущото състояние като видяно (след показване на новото). */
export function markPassportSeen(state: PassportState) {
  const all = readSeen()
  all[state.grade] = {
    games: state.pages.flatMap((p) => p.done),
    stamps: state.pages.filter((p) => p.stamped).map((p) => p.page.attraction),
  }
  writeSeen(all)
}
