/**
 * „Кулата на числата“ — игра 2 „Тайните етажи“.
 * Етажите отдолу нагоре са числова редица с постоянна стъпка (растяща или намаляваща).
 * Един или два прозореца са тайни; детето открива числата им.
 * Задачите са еднозначни: винаги има два съседни видими етажа, от които се вижда стъпката.
 * Чист TypeScript — без React.
 */
import { starsForTask, type Difficulty, type Grade, type Rng } from '../../magic-tokens/logic'
import { RANGE_MAX, fmt } from '../build/logic'

export type Direction = 'up' | 'down'

export interface SecretTask {
  id: number
  /** Числата на етажите отдолу нагоре. */
  values: number[]
  /** Индексите (отдолу нагоре) на тайните прозорци — възходящо. */
  hidden: number[]
  /** Стъпката (винаги положителна); посоката е в direction. */
  step: number
  direction: Direction
}

/** Брой етажи и тайни прозорци по нива. */
export const SECRET_FLOORS: Record<Difficulty, number> = { explorer: 5, researcher: 6, master: 6 }
export const SECRET_HIDDEN: Record<Difficulty, number> = { explorer: 1, researcher: 1, master: 2 }

/** Възможните стъпки по клас и ниво. */
export const STEPS: Record<Grade, Record<Difficulty, number[]>> = {
  2: { explorer: [1, 2, 5, 10], researcher: [2, 3, 4, 5, 10], master: [3, 4, 6, 7, 8, 9, 11, 15] },
  // 3. клас: 6 етажа × стъпка трябва да се събират в 0–1000 (затова Майстор е до 150)
  3: { explorer: [10, 50, 100], researcher: [20, 25, 50, 100], master: [15, 35, 75, 125, 150] },
  4: { explorer: [1000, 10_000, 100_000], researcher: [500, 2000, 5000, 25_000], master: [250, 1500, 12_500, 75_000] },
}

/** Най-много цифри при въвеждане (за клавиатурата). */
export const MAX_DIGITS: Record<Grade, number> = { 2: 3, 3: 4, 4: 7 }

export const HELP: Record<Difficulty, 'visual' | 'limited' | 'none'> = { explorer: 'visual', researcher: 'limited', master: 'none' }

const randInt = (rng: Rng, a: number, b: number) => a + Math.floor(rng() * (b - a + 1))
const pick = <T>(xs: T[], rng: Rng): T => xs[Math.floor(rng() * xs.length)]
function shuffle<T>(xs: T[], rng: Rng): T[] {
  const a = [...xs]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/** Има ли два съседни видими етажа (от тях се вижда стъпката) — тогава отговорът е еднозначен. */
export function isDetermined(n: number, hidden: number[]): boolean {
  for (let i = 0; i + 1 < n; i++) if (!hidden.includes(i) && !hidden.includes(i + 1)) return true
  return false
}

function pickHidden(n: number, d: Difficulty, rng: Rng): number[] {
  if (d === 'explorer') return [randInt(rng, 1, n - 2)] // в средата — и двата съседа се виждат
  if (d === 'researcher') return [randInt(rng, 0, n - 1)] // навсякъде, и най-горе/най-долу
  // Майстор: два прозореца, които не са съседни (всеки има видим съсед)
  for (;;) {
    const a = randInt(rng, 0, n - 1)
    const b = randInt(rng, 0, n - 1)
    if (Math.abs(a - b) < 2) continue
    const h = [a, b].sort((x, y) => x - y)
    if (isDetermined(n, h)) return h
  }
}

export function generateSecretTask(grade: Grade, d: Difficulty, rng: Rng, id: number): SecretTask {
  const n = SECRET_FLOORS[d]
  const max = RANGE_MAX[grade]
  const step = pick(STEPS[grade][d], rng)
  const direction: Direction = d === 'explorer' ? 'up' : rng() < 0.5 ? 'up' : 'down'
  const span = step * (n - 1)
  // най-малкото число в редицата
  let low: number
  if (d === 'explorer') {
    // кръгли числа — кратни на стъпката
    low = step * randInt(rng, 0, Math.floor((max - span) / step))
  } else if (d === 'researcher') {
    // понякога с отместване (13, 18, 23 …)
    const base = step * randInt(rng, 0, Math.floor((max - span) / step))
    const off = rng() < 0.5 ? 0 : randInt(rng, 1, step - 1)
    low = base + off <= max - span ? base + off : base
  } else {
    low = randInt(rng, 0, max - span)
  }
  const up = Array.from({ length: n }, (_, i) => low + i * step)
  const values = direction === 'up' ? up : up.reverse()
  return { id, values, hidden: pickHidden(n, d, rng), step, direction }
}

export function generateSecretTasks(grade: Grade, d: Difficulty, count: number, rng: Rng = Math.random): SecretTask[] {
  const seen = new Set<string>()
  const key = (t: SecretTask) => `${t.values.join()}|${t.hidden.join()}`
  return Array.from({ length: count }, (_, i) => {
    let t = generateSecretTask(grade, d, rng, i + 1)
    for (let k = 0; k < 40 && seen.has(key(t)); k++) t = generateSecretTask(grade, d, rng, i + 1)
    seen.add(key(t))
    return t
  })
}

/** Верният отговор за тайния прозорец на етаж i. */
export const answerAt = (t: SecretTask, i: number) => t.values[i]

/**
 * Откривател: три различни отговора, само един верен.
 * Грешните са правдоподобни: числото на съседен етаж и „сбъркана стъпка“ (напр. +1 вместо +10).
 */
export function choicesFor(t: SecretTask, grade: Grade, rng: Rng = Math.random): number[] {
  const i = t.hidden[0]
  const c = t.values[i]
  const max = RANGE_MAX[grade]
  const s = t.step
  const ok = (v: number) => Number.isInteger(v) && v >= 0 && v <= max && v !== c
  // 1) съсед на етажа (видимо число от кулата или следващото в редицата)
  const neighbour = [c + s, c - s].filter(ok)
  // 2) сбъркана стъпка: ±1, ±10, ±100 … (различно от стъпката) или двойна стъпка
  const slips = [1, 10, 100, 1000, 10_000].filter((k) => k !== s && k < s * 10).flatMap((k) => [c + k, c - k])
  const wrongStep = [...slips, c + 2 * s, c - 2 * s].filter(ok)
  const out = new Set<number>()
  const a = neighbour.length ? pick(neighbour, rng) : pick(wrongStep, rng)
  out.add(a)
  for (const v of shuffle(wrongStep, rng)) {
    if (out.size >= 2) break
    if (!out.has(v)) out.add(v)
  }
  // резерва (не би трябвало да се стига дотук)
  for (let k = 2; out.size < 2; k++) if (ok(c + k * s)) out.add(c + k * s)
  return shuffle([c, ...out], rng)
}

/** Подсказка: насочва към закономерността, без готовия отговор. */
export function secretHint(t: SecretTask, level: 'visual' | 'limited'): { text: string; pair: [number, number] | null } {
  if (level === 'limited') return { text: 'Сравни два съседни етажа: с колко се променя числото? Така е между всички етажи.', pair: null }
  // два съседни видими етажа — най-близо до тайния прозорец
  const h = t.hidden[0]
  const pairs: [number, number][] = []
  for (let i = 0; i + 1 < t.values.length; i++) if (!t.hidden.includes(i) && !t.hidden.includes(i + 1)) pairs.push([i, i + 1])
  pairs.sort((a, b) => Math.abs(a[0] - h) - Math.abs(b[0] - h))
  const [a, b] = pairs[0]
  return { text: `Виж етажите ${fmt(t.values[a])} и ${fmt(t.values[b])}. С колко се променя числото от етаж на етаж?`, pair: [a, b] }
}

/** Закономерността с думи — за похвалата след верен отговор. */
export const ruleText = (t: SecretTask) => (t.direction === 'up' ? `Всеки етаж е с ${fmt(t.step)} по-голям.` : `Всеки етаж е с ${fmt(t.step)} по-малък.`)

/** Проверка на въведените числа (по тайните прозорци). */
export function checkSecret(t: SecretTask, answers: Record<number, number | null>): { correct: number[]; wrong: number[]; empty: number[] } {
  const correct: number[] = []
  const wrong: number[] = []
  const empty: number[] = []
  for (const i of t.hidden) {
    const v = answers[i]
    if (v === null || v === undefined) empty.push(i)
    else if (v === t.values[i]) correct.push(i)
    else wrong.push(i)
  }
  return { correct, wrong, empty }
}

/* ───────────────────── състояние на задачата (чиста логика, с тестове) ───────────────────── */

/** Едно натискане на клавиатурата върху текущия низ (само цифри; без водещи нули). */
export function typeKey(cur: string, k: string, maxDigits: number): string {
  const s = cur.replace(/\D/g, '')
  if (k === 'clear') return ''
  if (k === 'back') return s.slice(0, -1)
  if (!/^[0-9]$/.test(k) || s.length >= maxDigits) return s
  return s === '0' ? k : s + k
}

/** Числото от въведения текст (само цифрите) или null, ако е празно. */
export const parseTyped = (s: string | undefined): number | null => {
  const d = (s ?? '').replace(/\D/g, '')
  return d ? Number(d) : null
}

export interface SecretState {
  index: number
  /** Въведеното по прозорци (индекс на етажа → цифри). */
  typed: Record<number, string>
  /** Прозорецът, в който пише клавиатурата. */
  active: number
  /** Откривател: избраното фенерче. */
  choice: number | null
  /** Светналите (верни) прозорци. */
  lit: number[]
  wrong: number[]
  mistakes: number
  usedHint: boolean
  /** Задачата е решена — показва се похвалата и бутонът „Следваща задача“ (нищо не може да ги скрие). */
  solved: boolean
  stars: 1 | 2 | 3 | null
  message: null | { kind: 'wrong' | 'info'; text: string }
  outcomes: { stars: 1 | 2 | 3; firstTry: boolean; solved: true }[]
  finished: boolean
}

export type SecretAction = { type: 'select'; floor: number } | { type: 'key'; key: string } | { type: 'choose'; value: number } | { type: 'check' } | { type: 'hint' } | { type: 'next' }

export function initialSecretState(tasks: SecretTask[]): SecretState {
  return { index: 0, typed: {}, active: tasks[0].hidden[0], choice: null, lit: [], wrong: [], mistakes: 0, usedHint: false, solved: false, stars: null, message: null, outcomes: [], finished: false }
}

/**
 * Преходите на играта. explorer — отговор с избор; maxDigits — по клас.
 * Проверката сравнява всеки тъмен прозорец с очакваното число от редицата.
 */
export function secretReducer(tasks: SecretTask[], explorer: boolean, maxDigits: number) {
  return (s: SecretState, a: SecretAction): SecretState => {
    const task = tasks[s.index]
    if (s.finished) return s
    switch (a.type) {
      case 'select':
        // след решаване или върху светнал прозорец — нищо не се променя (похвалата остава)
        if (s.solved || explorer || !task.hidden.includes(a.floor) || s.lit.includes(a.floor)) return s
        return { ...s, active: a.floor }
      case 'key': {
        if (s.solved || explorer || s.lit.includes(s.active)) return s
        return { ...s, typed: { ...s.typed, [s.active]: typeKey(s.typed[s.active] ?? '', a.key, maxDigits) }, wrong: s.wrong.filter((i) => i !== s.active), message: null }
      }
      case 'choose':
        if (s.solved || !explorer) return s
        return { ...s, choice: a.value, wrong: [], message: null }
      case 'hint':
        return s.solved ? s : { ...s, usedHint: true, message: null }
      case 'check': {
        if (s.solved) return s
        const open = task.hidden.filter((i) => !s.lit.includes(i))
        const value = (i: number) => (explorer ? s.choice : parseTyped(s.typed[i]))
        const empty = open.filter((i) => value(i) === null)
        if (empty.length) {
          const text = explorer ? 'Първо избери едно от трите числа.' : open.length === 2 && empty.length === 1 ? 'Напиши число и в другия тъмен прозорец.' : 'Напиши числото с клавиатурата.'
          return { ...s, active: explorer ? s.active : empty[0], message: { kind: 'info', text } }
        }
        const correct = open.filter((i) => value(i) === task.values[i])
        const wrong = open.filter((i) => value(i) !== task.values[i])
        const lit = [...s.lit, ...correct]
        if (wrong.length) {
          const part = correct.length ? 'Единият прозорец светна! ' : ''
          return {
            ...s,
            lit,
            wrong,
            mistakes: s.mistakes + 1,
            choice: explorer ? null : s.choice,
            typed: explorer ? s.typed : { ...s.typed, ...Object.fromEntries(wrong.map((i) => [i, ''])) },
            active: explorer ? s.active : wrong[0],
            message: { kind: 'wrong', text: `${part}Това число не пасва. Провери с колко се променя числото от етаж на етаж.` },
          }
        }
        const stars = starsForTask(s.mistakes, s.usedHint)
        return { ...s, lit, wrong: [], solved: true, stars, message: null, outcomes: [...s.outcomes, { stars, firstTry: s.mistakes === 0, solved: true }] }
      }
      case 'next': {
        if (!s.solved) return s
        if (s.index >= tasks.length - 1) return { ...s, finished: true }
        const t = tasks[s.index + 1]
        return { ...initialSecretState(tasks), index: s.index + 1, active: t.hidden[0], outcomes: s.outcomes }
      }
    }
  }
}
