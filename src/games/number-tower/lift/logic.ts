/**
 * „Кулата на числата“ — игра 3 „Числовият асансьор“.
 * Мисии: 1 „Намери етажа“ (управление на асансьора), 2 „Съседните етажи“ (предходно/следващо, сравняване),
 * 3 „Тайният маршрут“ (последователни придвижвания), 4 „Загадъчният етаж“ (разреден състав и загадки).
 * Всички задачи са еднозначни; всички начални, междинни и крайни стойности са в обхвата на класа.
 * Чист TypeScript — без React.
 */
import { starsForTask, type Difficulty, type Grade, type Rng } from '../../magic-tokens/logic'
import { RANGE_MAX, fmt } from '../build/logic'

export type LiftKind = 'find' | 'neighbor' | 'compare' | 'route' | 'mystery'
/** Как детето отговаря: управлява асансьора, избира карта или пише с клавиатурата. */
export type AnswerMode = 'drive' | 'choose' | 'keypad'

export interface LiftStep {
  /** Разредна единица: 1, 10, 100 … */
  place: number
  /** Брой (със знак): +3 = нагоре с 3 такива. */
  count: number
}

export interface LiftTask {
  id: number
  kind: LiftKind
  /** Номерът на мисията (1–4). */
  mission: 1 | 2 | 3 | 4
  mode: AnswerMode
  /** Къде е асансьорът в началото (null — на входа, без число). */
  start: number | null
  answer: number
  /** Условието с думи. */
  question: string
  /** Тайният маршрут — действията поред. */
  steps?: LiftStep[]
  /** Управление: разредите на бутоните (низходящо). */
  buttons?: number[]
  /** Избор: възможните отговори (в разбъркан ред). */
  options?: number[]
  /** Загадъчният етаж: разредният състав (в реда на условието). */
  parts?: LiftStep[]
  /** Сравняване: търси се по-високият (true) или по-ниският етаж. */
  higher?: boolean
  /** Съседни етажи: следващото (+1) или предходното (−1). */
  dir?: 1 | -1
}

export const MISSIONS: Record<1 | 2 | 3 | 4, string> = { 1: 'Намери етажа', 2: 'Съседните етажи', 3: 'Тайният маршрут', 4: 'Загадъчният етаж' }

/** Разредите по клас. */
export const PLACES: Record<Grade, number[]> = { 2: [1, 10], 3: [1, 10, 100], 4: [1, 10, 100, 1000, 10_000, 100_000] }

/** Най-много цифри при въвеждане. */
export const MAX_DIGITS: Record<Grade, number> = { 2: 3, 3: 4, 4: 7 }

export const HELP: Record<Difficulty, 'visual' | 'limited' | 'none'> = { explorer: 'visual', researcher: 'limited', master: 'none' }

/** Редуване на мисиите по нива. */
export const LEVEL_KINDS: Record<Difficulty, LiftKind[]> = {
  explorer: ['find', 'neighbor', 'compare'],
  researcher: ['find', 'neighbor', 'route'],
  master: ['route', 'mystery', 'find'],
}

const NAMES: Record<number, [string, string]> = {
  1: ['единица', 'единици'],
  10: ['десетица', 'десетици'],
  100: ['стотица', 'стотици'],
  1000: ['хиляда', 'хиляди'],
  10_000: ['десетица хиляди', 'десетици хиляди'],
  100_000: ['стотица хиляди', 'стотици хиляди'],
}

/** „3 десетици“, „1 стотица“ (без знак). */
export const placeWords = (place: number, count: number) => `${Math.abs(count)} ${NAMES[place][Math.abs(count) === 1 ? 0 : 1]}`
/** Името на разреда в множествено число („десетици“). */
export const placeName = (place: number) => NAMES[place][1]
/** Действие от маршрута: „▲ 3 десетици“ / „▼ 1 стотица“. */
export const stepText = (s: LiftStep) => `${s.count > 0 ? '▲' : '▼'} ${placeWords(s.place, s.count)}`
const stepPhrase = (s: LiftStep) => `${s.count > 0 ? 'нагоре' : 'надолу'} с ${placeWords(s.place, s.count)}`

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
const sum = (steps: LiftStep[]) => steps.reduce((a, s) => a + s.place * s.count, 0)

/** Всички стойности по маршрута (начало, след всяко действие). */
export function routeValues(start: number, steps: LiftStep[]): number[] {
  const out = [start]
  for (const s of steps) out.push(out[out.length - 1] + s.place * s.count)
  return out
}

/* ───────── генериране ───────── */

function genFind(grade: Grade, d: Difficulty, rng: Rng, id: number): LiftTask {
  const max = RANGE_MAX[grade]
  if (d === 'explorer') {
    const dist = randInt(rng, 1, 5) * (rng() < 0.5 ? 1 : -1)
    const start = randInt(rng, Math.max(0, -dist), Math.min(max, max - dist))
    return { id, kind: 'find', mission: 1, mode: 'drive', start, answer: start + dist, buttons: [1], question: `Закарай асансьора от ${fmt(start)} до ${fmt(start + dist)}.` }
  }
  const places = PLACES[grade].filter((p) => p * 2 <= max)
  for (;;) {
    const n = d === 'researcher' ? randInt(rng, 1, Math.min(2, places.length)) : randInt(rng, 2, Math.min(3, places.length))
    const used = shuffle(places, rng).slice(0, n)
    const sign = rng() < 0.5 ? 1 : -1
    const steps: LiftStep[] = used.map((place) => ({ place, count: randInt(rng, 1, d === 'researcher' ? 4 : 5) * (d === 'researcher' ? sign : rng() < 0.5 ? 1 : -1) }))
    const pos = steps.filter((s) => s.count > 0).reduce((a, s) => a + s.place * s.count, 0)
    const neg = steps.filter((s) => s.count < 0).reduce((a, s) => a + s.place * s.count, 0)
    // всяка подредба на натисканията остава в обхвата: start + neg ≥ 0 и start + pos ≤ max
    if (-neg > max - pos) continue
    const start = randInt(rng, -neg, max - pos)
    const answer = start + pos + neg
    if (answer === start) continue
    // бутоните: използваните разреди и още един съседен (за избор), най-много 3
    const extra = places.filter((p) => !used.includes(p))
    const buttons = [...used, ...(extra.length ? [pick(extra, rng)] : [])].slice(0, 3).sort((a, b) => b - a)
    return { id, kind: 'find', mission: 1, mode: 'drive', start, answer, buttons, question: `Закарай асансьора от ${fmt(start)} до ${fmt(answer)}.` }
  }
}

function genNeighbor(grade: Grade, d: Difficulty, rng: Rng, id: number): LiftTask {
  const max = RANGE_MAX[grade]
  const dir: 1 | -1 = rng() < 0.5 ? 1 : -1
  let n: number
  if (d === 'explorer') n = randInt(rng, 1, max - 1)
  else {
    // Изследовател: преминаване през разред (399 → 400, 1000 → 999, 45 099 → 45 100)
    const p = pick(PLACES[grade].filter((x) => x >= 10 && x < max), rng)
    // k ≥ 2: числата са поне двуцифрени (правилото в подсказката не съвпада с отговора, напр. 10 → 9)
    const k = randInt(rng, 2, Math.floor(max / p) - 1)
    n = dir === 1 ? k * p - 1 : k * p
  }
  const answer = n + dir
  const question = dir === 1 ? `Асансьорът е на етаж ${fmt(n)}. Кой е етажът точно над него (следващото число)?` : `Асансьорът е на етаж ${fmt(n)}. Кой е етажът точно под него (предходното число)?`
  if (d === 'explorer') {
    const ok = (v: number) => v >= 0 && v <= max && v !== answer && v !== n
    const cand = [n - dir, n + 10 * dir, n - 10 * dir, answer + 1 * dir].filter(ok)
    const options = shuffle([answer, ...shuffle([...new Set(cand)], rng).slice(0, 2)], rng)
    return { id, kind: 'neighbor', mission: 2, mode: 'choose', start: n, answer, question, options, dir }
  }
  return { id, kind: 'neighbor', mission: 2, mode: 'keypad', start: n, answer, question, dir }
}

function genCompare(grade: Grade, rng: Rng, id: number): LiftTask {
  const max = RANGE_MAX[grade]
  const digits = String(max).length - 1
  for (;;) {
    const kind = randInt(rng, 0, 2)
    let a: number
    let b: number
    if (kind === 0) {
      // разменени цифри (47 и 74; 305 и 503)
      const len = randInt(rng, 2, digits)
      const ds = Array.from({ length: len }, (_, i) => (i === 0 ? randInt(rng, 1, 9) : randInt(rng, 0, 9)))
      a = Number(ds.join(''))
      const r = [...ds].reverse()
      if (r[0] === 0) continue
      b = Number(r.join(''))
    } else if (kind === 1) {
      // същото начало, различни единици/десетици
      a = randInt(rng, 10, max - 10)
      b = a - (a % 10) + randInt(rng, 0, 9)
    } else {
      // различен брой цифри (9 и 12; 98 и 102)
      const p = Math.pow(10, randInt(rng, 1, digits))
      a = randInt(rng, Math.max(1, p / 10), p - 1)
      b = randInt(rng, p, Math.min(max, p * 2))
    }
    if (a === b || a > max || b > max) continue
    const higher = rng() < 0.6
    const answer = higher ? Math.max(a, b) : Math.min(a, b)
    return {
      id,
      kind: 'compare',
      mission: 2,
      mode: 'choose',
      start: null,
      answer,
      higher,
      options: shuffle([a, b], rng),
      question: higher ? `Кой етаж е по-високо: ${fmt(a)} или ${fmt(b)}?` : `Кой етаж е по-ниско: ${fmt(a)} или ${fmt(b)}?`,
    }
  }
}

function genRoute(grade: Grade, d: Difficulty, rng: Rng, id: number): LiftTask {
  const max = RANGE_MAX[grade]
  const places = PLACES[grade].filter((p) => p * 2 <= max && (grade !== 4 || p >= 10))
  for (;;) {
    const n = d === 'researcher' ? 1 : randInt(rng, 2, Math.min(3, places.length))
    const used = shuffle(places, rng).slice(0, n)
    const steps: LiftStep[] = used.map((place) => ({ place, count: randInt(rng, 1, d === 'researcher' ? 4 : 5) * (rng() < 0.5 ? 1 : -1) }))
    // Майстор: смесени посоки (и нагоре, и надолу)
    if (d === 'master' && new Set(steps.map((x) => Math.sign(x.count))).size === 1) steps[steps.length - 1].count *= -1
    const start = randInt(rng, 0, max)
    const vals = routeValues(start, steps)
    if (vals.some((v) => v < 0 || v > max)) continue
    const answer = vals[vals.length - 1]
    if (answer === start) continue
    const question = steps.length === 1 ? `Тръгни от етаж ${fmt(start)} и се придвижи ${stepPhrase(steps[0])}. На кой етаж ще спреш?` : `Тръгни от етаж ${fmt(start)} и следвай маршрута. На кой етаж ще спреш?`
    return { id, kind: 'route', mission: 3, mode: 'keypad', start, answer, steps, question }
  }
}

function genMystery(grade: Grade, rng: Rng, id: number): LiftTask {
  const max = RANGE_MAX[grade]
  if (rng() < 0.35) {
    // загадка: между две съседни десетици и цифра на единиците
    const a = 10 * randInt(rng, 1, Math.floor((max - 10) / 10))
    const u = randInt(rng, 1, 9)
    return { id, kind: 'mystery', mission: 4, mode: 'keypad', start: null, answer: a + u, question: `Загадъчният етаж е между ${fmt(a)} и ${fmt(a + 10)}. Цифрата на единиците му е ${u}. Кой е етажът?` }
  }
  // разреден състав, често с пропуснат (нулев) разред и разбъркан ред
  const places = PLACES[grade].filter((p) => p < max)
  for (;;) {
    const top = pick(places.filter((p) => p >= 10), rng)
    const below = places.filter((p) => p < top)
    const chosen = [top, ...shuffle(below, rng).slice(0, randInt(rng, 1, Math.min(2, below.length)))]
    const parts: LiftStep[] = chosen.map((place) => ({ place, count: randInt(rng, 1, 9) }))
    const answer = sum(parts)
    if (answer > max) continue
    const shown = rng() < 0.5 ? shuffle(parts, rng) : [...parts].sort((x, y) => y.place - x.place)
    const words = shown.map((p) => placeWords(p.place, p.count))
    const list = words.length > 1 ? `${words.slice(0, -1).join(', ')} и ${words[words.length - 1]}` : words[0]
    return { id, kind: 'mystery', mission: 4, mode: 'keypad', start: null, answer, parts: shown, question: `Загадъчният етаж има ${list}. Кой е етажът?` }
  }
}

export function generateLiftTask(grade: Grade, d: Difficulty, rng: Rng, id: number, index: number): LiftTask {
  const kind = LEVEL_KINDS[d][index % LEVEL_KINDS[d].length]
  if (kind === 'find') return genFind(grade, d, rng, id)
  if (kind === 'neighbor') return genNeighbor(grade, d, rng, id)
  if (kind === 'compare') return genCompare(grade, rng, id)
  if (kind === 'route') return genRoute(grade, d, rng, id)
  return genMystery(grade, rng, id)
}

export function generateLiftTasks(grade: Grade, d: Difficulty, count: number, rng: Rng = Math.random): LiftTask[] {
  const seen = new Set<string>()
  return Array.from({ length: count }, (_, i) => {
    let t = generateLiftTask(grade, d, rng, i + 1, i)
    for (let k = 0; k < 40 && seen.has(t.question); k++) t = generateLiftTask(grade, d, rng, i + 1, i)
    seen.add(t.question)
    return t
  })
}

/* ───────── подсказки (насочват, без отговора) ───────── */

export function liftHint(t: LiftTask, level: 'visual' | 'limited'): string {
  switch (t.kind) {
    case 'find':
      return level === 'visual'
        ? `Целта е ${t.answer > (t.start ?? 0) ? 'по-нагоре — натискай ▲' : 'по-надолу — натискай ▼'}. Брой етажите по пътя.`
        : 'Сравни двете числа разред по разред: кои цифри са различни и с колко?'
    case 'neighbor':
      return level === 'visual'
        ? t.dir === 1
          ? `Следващото число е с 1 по-голямо от ${fmt(t.start ?? 0)}.`
          : `Предходното число е с 1 по-малко от ${fmt(t.start ?? 0)}.`
        : t.dir === 1
          ? 'Когато единиците са 9, следва нова десетица (и може би нова стотица).'
          : 'Когато единиците са 0, взимаш една десетица: единиците стават 9.'
    case 'compare':
      return 'Числото с повече цифри е по-голямо. Ако цифрите са колкото, сравни първо най-левите.'
    case 'route':
      return level === 'visual' ? 'Действай стъпка по стъпка: при всяко действие се променя само една цифра.' : 'Направи действията едно по едно. Виж коя цифра се променя при всяко.'
    case 'mystery':
      return 'Запиши цифрите по разреди отляво надясно. Ако някой разред липсва, пиши 0.'
  }
}

/* ───────── състояние на задачата (чиста логика, с тестове) ───────── */

/** Едно натискане на клавиатурата (само цифри; без водещи нули). */
export function typeKey(cur: string, k: string, maxDigits: number): string {
  const s = cur.replace(/\D/g, '')
  if (k === 'clear') return ''
  if (k === 'back') return s.slice(0, -1)
  if (!/^[0-9]$/.test(k) || s.length >= maxDigits) return s
  return s === '0' ? k : s + k
}
export const parseTyped = (s: string): number | null => {
  const d = s.replace(/\D/g, '')
  return d ? Number(d) : null
}

export interface LiftState {
  index: number
  /** Къде е асансьорът сега (null — на входа). */
  pos: number | null
  typed: string
  choice: number | null
  mistakes: number
  usedHint: boolean
  solved: boolean
  stars: 1 | 2 | 3 | null
  message: null | { kind: 'wrong' | 'info'; text: string }
  outcomes: { stars: 1 | 2 | 3; firstTry: boolean; solved: true }[]
  finished: boolean
}

export type LiftAction = { type: 'step'; place: number; dir: 1 | -1 } | { type: 'choose'; value: number } | { type: 'key'; key: string } | { type: 'check' } | { type: 'hint' } | { type: 'next' }

export const initialLiftState = (tasks: LiftTask[]): LiftState => ({
  index: 0,
  pos: tasks[0].start,
  typed: '',
  choice: null,
  mistakes: 0,
  usedHint: false,
  solved: false,
  stars: null,
  message: null,
  outcomes: [],
  finished: false,
})

export function liftReducer(tasks: LiftTask[], grade: Grade) {
  const max = RANGE_MAX[grade]
  return (s: LiftState, a: LiftAction): LiftState => {
    const t = tasks[s.index]
    if (s.finished) return s
    switch (a.type) {
      case 'step': {
        if (s.solved || t.mode !== 'drive' || s.pos === null) return s
        const v = s.pos + a.place * a.dir
        if (v < 0 || v > max) return { ...s, message: { kind: 'info', text: `Кулата има етажи от 0 до ${fmt(max)}.` } }
        return { ...s, pos: v, message: null }
      }
      case 'choose':
        if (s.solved || t.mode !== 'choose' || !t.options?.includes(a.value)) return s
        return { ...s, choice: a.value, pos: a.value, message: null }
      case 'key':
        if (s.solved || t.mode !== 'keypad') return s
        return { ...s, typed: typeKey(s.typed, a.key, MAX_DIGITS[grade]), message: null }
      case 'hint':
        return s.solved ? s : { ...s, usedHint: true, message: null }
      case 'check': {
        if (s.solved) return s
        let value: number | null
        if (t.mode === 'drive') value = s.pos
        else if (t.mode === 'choose') {
          value = s.choice
          if (value === null) return { ...s, message: { kind: 'info', text: t.kind === 'compare' ? 'Избери един от двата етажа.' : 'Избери един от етажите.' } }
        } else {
          value = parseTyped(s.typed)
          if (value === null) return { ...s, message: { kind: 'info', text: 'Напиши номера на етажа с клавиатурата.' } }
          if (value > max) return { ...s, message: { kind: 'info', text: `Кулата има етажи от 0 до ${fmt(max)}.` } }
        }
        const pos = t.mode === 'keypad' ? value : s.pos
        if (value === t.answer) {
          const stars = starsForTask(s.mistakes, s.usedHint)
          return { ...s, pos, solved: true, stars, message: null, outcomes: [...s.outcomes, { stars, firstTry: s.mistakes === 0, solved: true }] }
        }
        const text =
          t.mode === 'drive'
            ? `Асансьорът е на ${fmt(value ?? 0)}, а целта е ${fmt(t.answer)}. Продължи!`
            : `Асансьорът спря на ${fmt(value ?? 0)}. Това не е търсеният етаж — опитай отново.`
        return { ...s, pos, mistakes: s.mistakes + 1, message: { kind: 'wrong', text } }
      }
      case 'next': {
        if (!s.solved) return s
        if (s.index >= tasks.length - 1) return { ...s, finished: true }
        const nt = tasks[s.index + 1]
        return { ...initialLiftState(tasks), index: s.index + 1, pos: nt.start, outcomes: s.outcomes }
      }
    }
  }
}
