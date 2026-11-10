/**
 * Зала 2 „Мостът на загадките“ — всяка решена задача възстановява плоча от магическия мост.
 * Механика: избор между еднакво изглеждащи карти (без подсказване с цвят, движение или позиция).
 * Видове: пресмятане, сравняване, загадка (число по условие), откриване на грешното пресмятане.
 * Точно един верен избор; позицията на верния отговор е разбъркана.
 */
import type { Grade, Rng } from '../../../magic-tokens/logic'
import { RANGE_MAX, fmt } from '../../build/logic'
import { makeExpr, studied, wrongs } from './arith'
import { pick, randInt, shuffle, type GenOptions } from './common'

export type BridgeKind = 'calc' | 'compare' | 'riddle' | 'error'
export const BRIDGE_KINDS: BridgeKind[] = ['calc', 'compare', 'riddle', 'error']

export interface BridgeTask {
  hall: 1
  id: string
  kind: BridgeKind
  prompt: string
  /** Голямото условие върху каменната плоча. */
  question: string
  /** Изборите (текст) и стойностите им за проверка. */
  options: string[]
  /** Индексът на верния избор. */
  answer: number
  hint: string
  praise: string
}

type Draft = Omit<BridgeTask, 'id' | 'hall'>

/** Верният избор, разбъркан между грешните. */
function choices(correct: number, wrong: number[], rng: Rng): { options: string[]; answer: number } {
  const all = shuffle([correct, ...wrong], rng)
  return { options: all.map(fmt), answer: all.indexOf(correct) }
}

function genCalc(o: GenOptions, rng: Rng): Draft | null {
  const e = makeExpr(o, rng)
  const extra = e.table ? [e.value + e.table, e.value - e.table] : []
  const w = wrongs(e.value, o.grade, rng, 3, extra)
  if (w.length < 3) return null
  return {
    kind: 'calc',
    prompt: 'Пресметни и избери вярната плоча за моста.',
    question: `${e.text} = ?`,
    ...choices(e.value, w, rng),
    hint: e.table
      ? 'Спомни си таблицата и пресметни стъпка по стъпка: първо умножението или делението.'
      : 'Пресметни по разреди: първо единиците, после десетиците (и стотиците). Внимавай при преминаване.',
    praise: `${e.text} = ${fmt(e.value)}`,
  }
}

const SIGNS = ['<', '=', '>']

function genCompare(o: GenOptions, rng: Rng): Draft | null {
  const max = RANGE_MAX[o.grade]
  let left: string
  let lv: number
  let rv: number
  if (o.difficulty === 'explorer') {
    // числа с разменени цифри или с еднакво начало
    const digits = String(max).length - 1
    const len = randInt(rng, 2, digits)
    const ds = Array.from({ length: len }, (_, i) => (i === 0 ? randInt(rng, 1, 9) : randInt(rng, 0, 9)))
    lv = Number(ds.join(''))
    const r = [...ds].reverse()
    rv = r[0] !== 0 && rng() < 0.6 ? Number(r.join('')) : lv + pick([0, 1, -1, 10, -10], rng)
    left = fmt(lv)
  } else {
    const e = makeExpr(o, rng)
    lv = e.value
    left = e.text
    const t = e.table ?? 10
    rv = lv + pick([0, 0, 1, -1, 10, -10, t, -t], rng)
  }
  if (rv < 0 || rv > max) return null
  const sign = lv < rv ? '<' : lv > rv ? '>' : '='
  return {
    kind: 'compare',
    prompt: 'Сравни двете страни и избери верния знак.',
    question: `${left}  ?  ${fmt(rv)}`,
    options: SIGNS,
    answer: SIGNS.indexOf(sign),
    hint: o.difficulty === 'explorer' ? 'Сравни най-левите цифри. Ако са еднакви — следващите.' : 'Първо пресметни лявата страна, после сравни двете числа.',
    praise: `${left} ${sign} ${fmt(rv)}`,
  }
}

const NAME: Record<number, [string, string]> = {
  1: ['единица', 'единици'],
  10: ['десетица', 'десетици'],
  100: ['стотица', 'стотици'],
  1000: ['хиляда', 'хиляди'],
  10_000: ['десетица хиляди', 'десетици хиляди'],
  100_000: ['стотица хиляди', 'стотици хиляди'],
}
const words = (place: number, n: number) => `${n} ${NAME[place][n === 1 ? 0 : 1]}`

function genRiddle(o: GenOptions, rng: Rng): Draft | null {
  const { grade: g, difficulty: d } = o
  const max = RANGE_MAX[g]
  if (d === 'explorer') {
    // число по разредния състав
    const places = { 2: [10, 1], 3: [100, 10, 1], 4: [100_000, 10_000, 1000, 100, 10, 1] }[g]
    const used = g === 4 ? [places[0], ...shuffle(places.slice(1), rng).slice(0, 2)].sort((a, b) => b - a) : places
    const parts = used.map((p, i) => [p, i === 0 ? randInt(rng, 1, 9) : randInt(rng, 1, 9)] as const)
    const v = parts.reduce((a, [p, n]) => a + p * n, 0)
    if (v > max) return null
    const swapped = Number(String(v).split('').reverse().join(''))
    const w = wrongs(v, g, rng, 3, swapped !== v && String(swapped).length === String(v).length ? [swapped] : [])
    if (w.length < 3) return null
    const list = parts.map(([p, n]) => words(p, n))
    return {
      kind: 'riddle',
      prompt: 'Загадка: кое число описват думите?',
      question: `Числото има ${list.slice(0, -1).join(', ')} и ${list[list.length - 1]}.`,
      ...choices(v, w, rng),
      hint: 'Запиши цифрите по разреди отляво надясно. Ако някой разред липсва, пиши 0.',
      praise: `Числото е ${fmt(v)}.`,
    }
  }
  const T = studied(o)
  if (g !== 2 && rng() < 0.45) {
    // мисля си число: умножено по t дава P
    const t = pick(T, rng)
    const v = randInt(rng, 2, 10)
    const w = wrongs(v, g, rng, 3, [t * v, v + 1, v - 1, t])
    if (w.length < 3) return null
    return {
      kind: 'riddle',
      prompt: 'Загадка: кое е числото?',
      question: `Мисля си число. Като го умножа по ${t}, получавам ${t * v}.`,
      ...choices(v, w, rng),
      hint: 'Кое число, умножено по дадения множител, дава произведението? Помисли за обратното действие — делението.',
      praise: `${v} · ${t} = ${t * v}`,
    }
  }
  // мисля си число: прибавям a (и изваждам b) → получавам r
  const step = g === 4 ? 1000 : 1
  const v = step * randInt(rng, 5, Math.floor((max * 0.6) / step))
  const a = step * randInt(rng, 3, Math.floor((max * 0.3) / step))
  const b = d === 'master' ? step * randInt(rng, 2, Math.floor((v + a) / step) - 1) : 0
  const r = v + a - b
  if (v + a > max || r < 0) return null
  const w = wrongs(v, g, rng, 3, [r + a, r - a + step, d === 'master' ? r - a - b : r - a + 10 * step])
  if (w.length < 3) return null
  return {
    kind: 'riddle',
    prompt: 'Загадка: кое е числото?',
    question: b ? `Мисля си число. Прибавям ${fmt(a)}, после изваждам ${fmt(b)} и получавам ${fmt(r)}.` : `Мисля си число. Като прибавя ${fmt(a)}, получавам ${fmt(r)}.`,
    ...choices(v, w, rng),
    hint: b ? 'Тръгни отзад напред: върни изваденото (събери), после махни прибавеното (извади).' : 'Използвай обратното действие: от полученото махни прибавеното.',
    praise: b ? `${fmt(v)} + ${fmt(a)} − ${fmt(b)} = ${fmt(r)}` : `${fmt(v)} + ${fmt(a)} = ${fmt(r)}`,
  }
}

function genError(o: GenOptions, rng: Rng): Draft | null {
  const eqs = []
  const seen = new Set<string>()
  for (let k = 0; k < 40 && eqs.length < 4; k++) {
    const e = makeExpr(o, rng)
    if (seen.has(e.text)) continue
    seen.add(e.text)
    eqs.push(e)
  }
  if (eqs.length < 4) return null
  const bad = randInt(rng, 0, 3)
  const slip = wrongs(eqs[bad].value, o.grade, rng, 1, eqs[bad].table ? [eqs[bad].value + eqs[bad].table] : [])[0]
  if (slip === undefined) return null
  const shown = eqs.map((e, i) => (i === bad ? slip : e.value))
  return {
    kind: 'error',
    prompt: 'Едно пресмятане е грешно и плочата му е напукана. Кое е то?',
    question: 'Кое пресмятане е грешно?',
    options: eqs.map((e, i) => `${e.text} = ${fmt(shown[i])}`),
    answer: bad,
    hint: 'Провери всяко пресмятане поотделно. Можеш да провериш събирането с изваждане.',
    praise: `Вярно е: ${eqs[bad].text} = ${fmt(eqs[bad].value)}`,
  }
}

/** Стойността на избор (за проверка на еднозначността). */
const valueOf = (s: string) => Number(s.replace(/\D/g, ''))
/** Стойността на израз в текста (+ − · :). */
export function evalText(t: string): number {
  const toks = t.replace(/ /g, '').split(' ')
  // първо · и :
  const vals: (number | string)[] = []
  for (let i = 0; i < toks.length; i++) {
    const x = toks[i]
    if ((x === '·' || x === ':') && vals.length) {
      const a = vals.pop() as number
      const b = Number(toks[++i])
      vals.push(x === '·' ? a * b : a / b)
    } else vals.push(/^\d+$/.test(x) ? Number(x) : x)
  }
  let acc = vals[0] as number
  for (let i = 1; i < vals.length; i += 2) acc = vals[i] === '+' ? acc + (vals[i + 1] as number) : acc - (vals[i + 1] as number)
  return acc
}

/** Проверка: точно един верен избор, всички стойности в обхвата. */
export function validateBridge(t: Draft, g: Grade): boolean {
  const max = RANGE_MAX[g]
  if (new Set(t.options).size !== t.options.length || t.answer < 0 || t.answer >= t.options.length) return false
  if (t.kind === 'error') {
    const wrongIdx = t.options.map((s, i) => {
      const [l, r] = s.split(' = ')
      return evalText(l) !== valueOf(r) ? i : -1
    })
    const bad = wrongIdx.filter((i) => i >= 0)
    return bad.length === 1 && bad[0] === t.answer && t.options.every((s) => valueOf(s.split(' = ')[1]) <= max)
  }
  if (t.kind === 'compare') return t.options.length === 3
  if (t.options.length !== 4) return false
  const nums = t.options.map(valueOf)
  return nums.every((v) => Number.isInteger(v) && v >= 0 && v <= max)
}

const GEN: Record<BridgeKind, (o: GenOptions, rng: Rng) => Draft | null> = { calc: genCalc, compare: genCompare, riddle: genRiddle, error: genError }

export function generateBridgeTask(kind: BridgeKind, o: GenOptions, rng: Rng, id: string): BridgeTask {
  for (let k = 0; k < 500; k++) {
    const t = GEN[kind](o, rng)
    if (t && validateBridge(t, o.grade)) return { ...t, hall: 1, id }
  }
  throw new Error(`Няма валидна задача за ${kind}`)
}

/** Четирите задачи на моста: по една от всеки вид, в разбъркан ред. */
export function generateBridge(o: GenOptions, rng: Rng = Math.random): BridgeTask[] {
  return shuffle(BRIDGE_KINDS, rng).map((kind, i) => generateBridgeTask(kind, o, rng, `b${i + 1}`))
}

export const checkBridge = (t: BridgeTask, chosen: number | null): 'correct' | 'wrong' | 'incomplete' => (chosen === null ? 'incomplete' : chosen === t.answer ? 'correct' : 'wrong')
