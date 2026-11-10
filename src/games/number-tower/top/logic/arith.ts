/**
 * Изрази и правдоподобни грешни отговори според класа, нивото и изучените таблици.
 * 2. клас — само събиране и изваждане до 100; 3. и 4. клас — и умножение/деление
 * само с таблиците от учителския панел (деление без остатък). Без отрицателни и дробни стойности.
 */
import type { Grade, Rng } from '../../../magic-tokens/logic'
import { RANGE_MAX, fmt } from '../../build/logic'
import { pick, randInt, shuffle, type GenOptions } from './common'

export interface Expr {
  text: string
  value: number
  /** Всички междинни стойности (за проверка на обхвата). */
  steps: number[]
  /** Таблицата, ако изразът съдържа умножение или деление. */
  table?: number
}

const inRange = (v: number, g: Grade) => Number.isInteger(v) && v >= 0 && v <= RANGE_MAX[g]
export const validExpr = (e: Expr, g: Grade) => e.steps.every((v) => inRange(v, g)) && inRange(e.value, g)

/** Изучените таблици (2–10); при празен списък — 2…10. */
export const studied = (o: GenOptions) => {
  const t = o.tables.filter((x) => Number.isInteger(x) && x >= 2 && x <= 10)
  return t.length ? t : [2, 3, 4, 5, 6, 7, 8, 9, 10]
}

const plus = (a: number, b: number): Expr => ({ text: `${fmt(a)} + ${fmt(b)}`, value: a + b, steps: [a, b, a + b] })
const minus = (a: number, b: number): Expr => ({ text: `${fmt(a)} − ${fmt(b)}`, value: a - b, steps: [a, b, a - b] })

function exprOnce(o: GenOptions, rng: Rng): Expr {
  const { grade: g, difficulty: d } = o
  const T = studied(o)
  if (g === 2) {
    if (d === 'explorer') {
      const k = randInt(rng, 0, 2)
      if (k === 0) return plus(10 * randInt(rng, 1, 9), randInt(rng, 1, 9))
      if (k === 1) return plus(10 * randInt(rng, 1, 5), 10 * randInt(rng, 1, 4))
      const a = 10 * randInt(rng, 2, 10)
      return minus(a, 10 * randInt(rng, 1, a / 10 - 1))
    }
    if (d === 'researcher') {
      // с преминаване през десетицата
      if (rng() < 0.5) {
        let a = randInt(rng, 11, 79)
        if (a % 10 === 0) a += 1 // иначе няма преминаване
        const b = randInt(rng, Math.max(2, 10 - (a % 10)), 9) + 10 * randInt(rng, 0, Math.floor((90 - a) / 10))
        return plus(a, b)
      }
      let a = randInt(rng, 21, 98)
      if (a % 10 === 9) a -= 1 // иначе няма заемане
      const b = randInt(rng, (a % 10) + 1, 9) + 10 * randInt(rng, 0, Math.floor(a / 10) - 1)
      return minus(a, b)
    }
    const a = randInt(rng, 15, 70)
    const b = randInt(rng, 6, Math.min(48, 100 - a))
    const c = randInt(rng, 5, a + b - 1)
    return { text: `${a} + ${b} − ${c}`, value: a + b - c, steps: [a, b, a + b, c, a + b - c] }
  }
  if (g === 3) {
    if (d === 'explorer') {
      if (rng() < 0.6) {
        const [h, t, u] = [randInt(rng, 1, 9), randInt(rng, 0, 9), randInt(rng, 1, 9)]
        const parts = [100 * h, ...(t ? [10 * t] : []), u]
        return { text: parts.map(fmt).join(' + '), value: 100 * h + 10 * t + u, steps: parts }
      }
      const a = 100 * randInt(rng, 2, 9)
      return rng() < 0.5 ? minus(a, 100 * randInt(rng, 1, a / 100 - 1)) : plus(a, 100 * randInt(rng, 1, 10 - a / 100))
    }
    if (d === 'researcher') {
      const k = randInt(rng, 0, 3)
      const t = pick(T, rng)
      const m = randInt(rng, 2, 10)
      if (k === 0) return { text: `${t} · ${m}`, value: t * m, steps: [t * m], table: t }
      if (k === 1) return { text: `${t * m} : ${t}`, value: m, steps: [t * m, m], table: t }
      if (k === 2) {
        const a = randInt(rng, 120, 780)
        return plus(a, randInt(rng, 15, Math.min(200, 999 - a)))
      }
      const a = randInt(rng, 200, 990)
      return minus(a, randInt(rng, 15, Math.min(180, a - 10)))
    }
    const t = pick(T, rng)
    const m = randInt(rng, 2, 10)
    const k = randInt(rng, 0, 2)
    if (k === 0) {
      const c = randInt(rng, 11, 200)
      return { text: `${t} · ${m} + ${c}`, value: t * m + c, steps: [t * m, c, t * m + c], table: t }
    }
    if (k === 1) {
      const c = randInt(rng, t * m + 10, 400)
      return { text: `${c} − ${t} · ${m}`, value: c - t * m, steps: [t * m, c, c - t * m], table: t }
    }
    const c = randInt(rng, 10, 150)
    return { text: `${t * m} : ${t} + ${c}`, value: m + c, steps: [t * m, m, c, m + c], table: t }
  }
  // 4. клас
  if (d === 'explorer') {
    const digits = [randInt(rng, 1, 9), randInt(rng, 0, 9), randInt(rng, 0, 9), randInt(rng, 0, 9), randInt(rng, 0, 9), randInt(rng, 1, 9)]
    const places = [100_000, 10_000, 1000, 100, 10, 1]
    const chosen = places.map((p, i) => [p, digits[i]] as const).filter(([, dgt], i) => dgt > 0 && (i === 0 || i === 5 || rng() < 0.45))
    const parts = chosen.map(([p, dgt]) => p * dgt)
    return { text: parts.map(fmt).join(' + '), value: parts.reduce((a, b) => a + b, 0), steps: parts }
  }
  if (d === 'researcher') {
    const k = randInt(rng, 0, 3)
    const t = pick(T, rng)
    const m = randInt(rng, 2, 9)
    if (k === 0) {
      const z = pick([100, 1000], rng)
      return { text: `${t} · ${fmt(m * z)}`, value: t * m * z, steps: [m * z, t * m * z], table: t }
    }
    if (k === 1) {
      const z = pick([100, 1000], rng)
      return { text: `${fmt(t * m * z)} : ${t}`, value: m * z, steps: [t * m * z, m * z], table: t }
    }
    if (k === 2) {
      const a = 1000 * randInt(rng, 120, 800) + 100 * randInt(rng, 0, 9)
      return plus(a, 1000 * randInt(rng, 15, 190) + 100 * randInt(rng, 0, 9))
    }
    const a = 1000 * randInt(rng, 200, 990) + 100 * randInt(rng, 0, 9)
    return minus(a, 1000 * randInt(rng, 15, 180) + 100 * randInt(rng, 0, 9))
  }
  const t = pick(T, rng)
  const m = randInt(rng, 2, 9)
  const k = randInt(rng, 0, 2)
  if (k === 0) {
    const c = 1000 * randInt(rng, 5, 200)
    return { text: `${t} · ${fmt(m * 1000)} + ${fmt(c)}`, value: t * m * 1000 + c, steps: [m * 1000, t * m * 1000, c, t * m * 1000 + c], table: t }
  }
  if (k === 1) {
    const c = 1000 * randInt(rng, t * m + 5, 900)
    return { text: `${fmt(c)} − ${t} · ${fmt(m * 1000)}`, value: c - t * m * 1000, steps: [m * 1000, t * m * 1000, c, c - t * m * 1000], table: t }
  }
  const a = 1000 * randInt(rng, 100, 600)
  const b = 1000 * randInt(rng, 20, 300)
  const c = 1000 * randInt(rng, 10, Math.floor((a + b) / 1000) - 1)
  return { text: `${fmt(a)} + ${fmt(b)} − ${fmt(c)}`, value: a + b - c, steps: [a, b, a + b, c, a + b - c] }
}

/** Валиден израз (при невалиден опит — нов). */
export function makeExpr(o: GenOptions, rng: Rng): Expr {
  for (let k = 0; k < 400; k++) {
    const e = exprOnce(o, rng)
    if (validExpr(e, o.grade)) return e
  }
  throw new Error('Няма валиден израз')
}

/** Цифрите в обратен ред (размяна на цифрите — честа грешка). */
const reverse = (v: number) => Number(String(v).split('').reverse().join(''))

/**
 * n различни правдоподобни грешни отговора около v: ±1, ±10, ±100…, размяна на цифрите,
 * грешка с една таблица (±t). Предпочитат се числа със същия брой цифри.
 */
export function wrongs(v: number, g: Grade, rng: Rng, n = 3, extra: number[] = []): number[] {
  const max = RANGE_MAX[g]
  const steps = [1, 10, ...(max >= 1000 ? [100] : []), ...(max >= 1_000_000 ? [1000, 10_000] : [])]
  const cand = [...extra, ...steps.flatMap((s) => [v + s, v - s]), reverse(v)].filter((x) => Number.isInteger(x) && x >= 0 && x <= max && x !== v)
  const uniq = [...new Set(cand)]
  const same = shuffle(
    uniq.filter((x) => String(x).length === String(v).length),
    rng,
  )
  const other = shuffle(
    uniq.filter((x) => String(x).length !== String(v).length),
    rng,
  )
  const out = [...extra.filter((x) => uniq.includes(x)), ...same, ...other]
  return [...new Set(out)].slice(0, n)
}
