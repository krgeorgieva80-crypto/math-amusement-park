/**
 * „Кулата на числата“ — игра 1 „Построй кулата“.
 * Разбъркани етажи с числа се подреждат във възходящ или низходящ ред (отдолу нагоре).
 * Числата са различни (единствен правилен ред) и винаги в обхвата на класа.
 * Чист TypeScript — без React.
 */
import type { Difficulty, Grade, Rng } from '../../magic-tokens/logic'

/** Числов обхват по клас: 2. — 0…100, 3. — 0…1000, 4. — 0…1 000 000. */
export const RANGE_MAX: Record<Grade, number> = { 2: 100, 3: 1000, 4: 1_000_000 }

export type Order = 'asc' | 'desc'

export interface BuildTask {
  id: number
  /** Етажите в реда, в който са разбъркани в тавата. */
  numbers: number[]
  order: Order
}

/** Брой етажи по нива. */
export const FLOORS: Record<Difficulty, number> = { explorer: 4, researcher: 5, master: 6 }

const randInt = (rng: Rng, a: number, b: number) => a + Math.floor(rng() * (b - a + 1))
function shuffle<T>(xs: T[], rng: Rng): T[] {
  const a = [...xs]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/** Правилният ред отдолу нагоре. */
export const solution = (t: BuildTask) => [...t.numbers].sort((a, b) => (t.order === 'asc' ? a - b : b - a))

/** Числа, далеч едно от друго (Откривател): различни „големи“ разряди. */
function spread(n: number, max: number, rng: Rng): number[] {
  const band = (max + 1) / n
  return shuffle(
    Array.from({ length: n }, (_, i) => {
      const lo = Math.floor(i * band + band * 0.1)
      const hi = Math.floor((i + 1) * band - band * 0.1) - 1
      return randInt(rng, lo, Math.max(lo, Math.min(max, hi)))
    }),
    rng,
  )
}

/** Числа в по-тесен интервал (Изследовател): еднакъв най-голям разряд при част от тях. */
function close(n: number, max: number, rng: Rng): number[] {
  const width = Math.max(n * 3, Math.floor(max / 5))
  const start = randInt(rng, 0, max - width)
  const out = new Set<number>()
  while (out.size < n) out.add(randInt(rng, start, start + width))
  return shuffle([...out], rng)
}

/**
 * Майстор: „коварни“ числа — пермутации на едни и същи цифри и числа
 * с еднакво начало (407, 470, 704, 740 / 38, 83, 33 …).
 */
function tricky(n: number, max: number, rng: Rng): number[] {
  const digits = String(max).length - 1 // 2 за 0–100, 3 за 0–1000, 6 за 0–1 000 000
  const out = new Set<number>()
  for (let attempt = 0; attempt < 400 && out.size < n; attempt++) {
    // база: число с digits цифри
    const base = Array.from({ length: digits }, (_, i) => (i === 0 ? randInt(rng, 1, 9) : randInt(rng, 0, 9)))
    // пермутации на цифрите
    for (let k = 0; k < 6 && out.size < n; k++) {
      const p = shuffle(base, rng)
      if (p[0] === 0) continue
      const v = Number(p.join(''))
      if (v <= max) out.add(v)
    }
    // числа със същото начало, различни в последния разряд
    if (out.size < n) {
      const v = Number(base.join(''))
      const w = v - (v % 10) + randInt(rng, 0, 9)
      if (w <= max) out.add(w)
    }
  }
  while (out.size < n) out.add(randInt(rng, 0, max))
  return shuffle([...out].slice(0, n), rng)
}

export function generateBuildTask(grade: Grade, d: Difficulty, rng: Rng, id: number, index: number): BuildTask {
  const n = FLOORS[d]
  const max = RANGE_MAX[grade]
  const numbers = d === 'explorer' ? spread(n, max, rng) : d === 'researcher' ? close(n, max, rng) : tricky(n, max, rng)
  // Откривател — само възходящо; Изследовател — редуване; Майстор — случайно
  const order: Order = d === 'explorer' ? 'asc' : d === 'researcher' ? (index % 2 ? 'desc' : 'asc') : rng() < 0.5 ? 'asc' : 'desc'
  return { id, numbers, order }
}

export function generateBuildTasks(grade: Grade, d: Difficulty, count: number, rng: Rng = Math.random): BuildTask[] {
  const seen = new Set<string>()
  return Array.from({ length: count }, (_, i) => {
    let t = generateBuildTask(grade, d, rng, i + 1, i)
    for (let k = 0; k < 30 && seen.has([...t.numbers].sort().join()); k++) t = generateBuildTask(grade, d, rng, i + 1, i)
    seen.add([...t.numbers].sort().join())
    return t
  })
}

export interface BuildCheck {
  status: 'correct' | 'wrong' | 'incomplete'
  message: string
  /** Позициите (отдолу нагоре), които не са на мястото си. */
  wrong: number[]
}

/** Проверка на построеното (placed — етажите отдолу нагоре). Отговорът не се издава. */
export function checkBuild(t: BuildTask, placed: (number | null)[]): BuildCheck {
  const empty = placed.filter((x) => x === null).length
  if (empty) return { status: 'incomplete', message: empty === 1 ? 'Остава още 1 етаж.' : `Остават още ${empty} етажа.`, wrong: [] }
  const sol = solution(t)
  const wrong = placed.map((v, i) => (v === sol[i] ? -1 : i)).filter((i) => i >= 0)
  if (!wrong.length) return { status: 'correct', message: 'Кулата е построена!', wrong: [] }
  return { status: 'wrong', message: wrong.length === 1 ? 'Един етаж не е на мястото си. Опитай отново.' : `${wrong.length} етажа не са на мястото си. Опитай отново.`, wrong }
}

/** Запис с интервали за хилядите (45 600, 1 000 000). */
// неразделящ интервал — числото никога не се пренася на два реда
export const fmt = (v: number) => (v >= 10000 ? String(v).replace(/\B(?=(\d{3})+(?!\d))/g, '\u00a0') : String(v))

export const instruction = (t: BuildTask) => (t.order === 'asc' ? 'Подреди от най-малкото до най-голямото.' : 'Подреди от най-голямото до най-малкото.')
export const ruleBottom = (t: BuildTask) => (t.order === 'asc' ? 'Най-долу е най-малкото число.' : 'Най-долу е най-голямото число.')

/** Подсказка без готовия отговор: сравняване на две от оставащите числа или правило за разрядите. */
export function buildHint(t: BuildTask, remaining: number[], level: 'visual' | 'limited'): string {
  if (!remaining.length) return 'Провери кулата отдолу нагоре.'
  if (level === 'limited') return 'Сравни първо най-левите цифри. Ако са еднакви — следващите.'
  // две числа поред от тавата (не непременно следващото) — детето сравнява само
  const want = t.order === 'asc' ? 'по-малкото' : 'по-голямото'
  return remaining.length === 1 ? 'Остана само един етаж — той е последен.' : `Сравни ${fmt(remaining[0])} и ${fmt(remaining[1])}. Кое е ${want}?`
}

export const praise = (t: BuildTask) => (t.order === 'asc' ? 'Браво! Кулата е подредена от най-малкото до най-голямото!' : 'Браво! Кулата е подредена от най-голямото до най-малкото!')

export const HELP: Record<Difficulty, 'visual' | 'limited' | 'none'> = { explorer: 'visual', researcher: 'limited', master: 'none' }
