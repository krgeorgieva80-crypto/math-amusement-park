/**
 * „Колелото на умножението“ — режим „Завърти колелото“ (упражнение на табличното умножение).
 * Колелото дава множителя (колко пъти), таблицата — повтарящото се събираемо.
 * Запис като в „Открий равните групи“: таблица · множител (3 · 7 = 3 + 3 + … седем пъти).
 * Задачите са само от активните (изучени) таблици, избрани от учителя.
 * Чист TypeScript — без React.
 */
import type { Difficulty, Grade, Rng } from '../../magic-tokens/logic'
import { multiplicationText } from '../logic'

export const ALL_TABLES = [2, 3, 4, 5, 6, 7, 8, 9, 10] as const

/** Активни таблици по подразбиране: 2. клас — само с 2; 3. и 4. клас — 2…10. */
export const DEFAULT_SPIN_TABLES: Record<Grade, number[]> = {
  2: [2],
  3: [2, 3, 4, 5, 6, 7, 8, 9, 10],
  4: [2, 3, 4, 5, 6, 7, 8, 9, 10],
}

export interface SpinOptions {
  /** Активните таблици за класа (вече проверени). */
  tables: number[]
  /** Сектор 0 на колелото (настройка на учителя). */
  zero: boolean
  /** „Майстор“: и задачи с липсващ множител (настройка на учителя). */
  missing: boolean
}

/** Почистване на запазен списък: само 2…10, без повторения, подредени; празен → по подразбиране. */
export function sanitizeTables(raw: unknown, grade: Grade): number[] {
  const list = Array.isArray(raw) ? raw.filter((n): n is number => typeof n === 'number' && (ALL_TABLES as readonly number[]).includes(n)) : []
  const clean = [...new Set(list)].sort((a, b) => a - b)
  return clean.length ? clean : [...DEFAULT_SPIN_TABLES[grade]]
}

/** Секторите на колелото: 1…10, а при включена нула — 0…10. */
export const wheelSectors = (zero: boolean): number[] => Array.from({ length: zero ? 11 : 10 }, (_, i) => (zero ? i : i + 1))

/**
 * normal — таблица · множител = ?
 * swapped — множител · таблица = ? (размяна на множителите)
 * missing — множител · ? = произведение (липсва таблицата; колелото не издава отговора)
 */
export type SpinKind = 'normal' | 'swapped' | 'missing'

export interface SpinTask {
  id: number
  table: number
  /** Числото от колелото (сектор). */
  multiplier: number
  kind: SpinKind
}

export const spinProduct = (t: SpinTask) => t.table * t.multiplier
/** Числото, което ученикът трябва да въведе. */
export const spinAnswer = (t: SpinTask) => (t.kind === 'missing' ? t.table : spinProduct(t))

/** Записът на задачата: лява страна, дясна страна (едното е „?“). */
export function spinExpression(t: SpinTask, answer?: string): { left: string; right: string; full: string } {
  const a = answer ?? '?'
  const p = spinProduct(t)
  switch (t.kind) {
    case 'normal':
      return { left: `${multiplicationText(t.table, t.multiplier)} =`, right: a, full: `${multiplicationText(t.table, t.multiplier)} = ${p}` }
    case 'swapped':
      return { left: `${multiplicationText(t.multiplier, t.table)} =`, right: a, full: `${multiplicationText(t.multiplier, t.table)} = ${p}` }
    case 'missing':
      return { left: `${t.multiplier} · ${a} = ${p}`, right: '', full: `${multiplicationText(t.multiplier, t.table)} = ${p}` }
  }
}

const shuffle = <T,>(xs: T[], rng: Rng): T[] => {
  const a = [...xs]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/**
 * Серия задачи. Откривател: една таблица, всеки множител по веднъж в разбъркан ред.
 * Изследовател: двойки от всички активни таблици без повторение.
 * Майстор: като изследовател, със смесен ред на множителите и (по избор) липсващ множител.
 */
export function generateSpinTasks(difficulty: Difficulty, opts: SpinOptions, explorerTable: number, count: number, rng: Rng = Math.random): SpinTask[] {
  const sectors = wheelSectors(opts.zero)
  const tables = opts.tables.length ? opts.tables : [2]
  const pool =
    difficulty === 'explorer'
      ? () => shuffle(sectors, rng).map((m) => ({ table: tables.includes(explorerTable) ? explorerTable : tables[tables.length - 1], multiplier: m }))
      : () => shuffle(tables.flatMap((tb) => sectors.map((m) => ({ table: tb, multiplier: m }))), rng)
  const out: SpinTask[] = []
  let bag = pool()
  let lastTable = -1
  while (out.length < count) {
    if (!bag.length) bag = pool()
    // при няколко таблици — по възможност различна от предишната
    let k = bag.findIndex((p) => p.table !== lastTable)
    if (k < 0 || difficulty === 'explorer') k = 0
    const [pair] = bag.splice(k, 1)
    lastTable = pair.table
    let kind: SpinKind = 'normal'
    if (difficulty === 'master') {
      const r = rng()
      // липсващ множител: не при 0 (всеки отговор става) и не при 1 (отговорът е в задачата)
      if (opts.missing && pair.multiplier > 1 && r < 0.34) kind = 'missing'
      else kind = rng() < 0.5 ? 'swapped' : 'normal'
    }
    out.push({ id: out.length + 1, ...pair, kind })
  }
  return out
}

export interface SpinCheck {
  status: 'correct' | 'wrong' | 'incomplete'
  message: string
}

/** Проверка без издаване на верния отговор. */
export function checkSpin(t: SpinTask, input: string): SpinCheck {
  if (input.trim() === '') return { status: 'incomplete', message: 'Напиши отговора с цифрите.' }
  const v = Number(input)
  const want = spinAnswer(t)
  if (v === want) return { status: 'correct', message: 'Точно така!' }
  if (t.kind === 'missing') return { status: 'wrong', message: v > want ? 'Получава се повече. Опитай с по-малко число.' : 'Получава се по-малко. Опитай с по-голямо число.' }
  return { status: 'wrong', message: v > want ? 'Получи повече. Опитай отново.' : 'Получи по-малко. Опитай отново.' }
}

/** Броене през таблицата — първите стъпки, но никога до отговора. */
export function skipCountHint(t: SpinTask): string {
  const n = Math.max(0, Math.min(t.multiplier - 1, 3))
  if (t.multiplier <= 1) return t.multiplier === 0 ? `0 групи по ${t.table} — колко са?` : `Една група по ${t.table}.`
  return `Брой по ${t.table}: ${Array.from({ length: n }, (_, i) => t.table * (i + 1)).join(', ')}, …`
}

/** Подсказка с близка позната задача (Изследовател) — без отговора. */
export function neighbourHint(t: SpinTask): string {
  if (t.kind === 'missing') return `Кое число по ${t.multiplier} дава ${spinProduct(t)}? Опитай таблиците една по една.`
  if (t.multiplier === 0) return 'Колко е, ако нямаш нито една група?'
  if (t.multiplier === 1) return `Една група по ${t.table}. Колко е?`
  return `${multiplicationText(t.table, t.multiplier - 1)} = ${t.table * (t.multiplier - 1)}. Колко е с още едно ${t.table}?`
}

/** Похвала според задачата. */
export function spinPraise(t: SpinTask): string {
  const p = spinProduct(t)
  if (t.kind === 'swapped') return `Браво! ${multiplicationText(t.multiplier, t.table)} = ${p}. Размяната на множителите не променя произведението!`
  if (t.kind === 'missing') return `Браво! Откри липсващия множител: ${multiplicationText(t.multiplier, t.table)} = ${p}!`
  if (t.multiplier === 0) return `Браво! ${multiplicationText(t.table, 0)} = 0 — нула групи по ${t.table} са 0!`
  return `Браво! ${multiplicationText(t.table, t.multiplier)} = ${p} — ${t.multiplier} ${t.multiplier === 1 ? 'път' : 'пъти'} по ${t.table}!`
}

/** Какви подсказки има на всяко ниво. */
export const SPIN_HELP: Record<Difficulty, 'visual' | 'limited' | 'none'> = { explorer: 'visual', researcher: 'limited', master: 'none' }

/** Ъгъл (в градуси, по часовника от горе), на който е центърът на сектора с номер index. */
export const sectorAngle = (index: number, count: number) => (index * 360) / count

/**
 * Крайно завъртане, при което секторът index застава под стрелката отгоре,
 * поне `turns` пълни обиколки след текущото.
 */
export function targetRotation(current: number, index: number, count: number, turns = 4): number {
  const want = (360 - sectorAngle(index, count)) % 360
  const base = current - (((current % 360) + 360) % 360)
  let next = base + turns * 360 + want
  if (next - current < turns * 360) next += 360
  return next
}

export const SPIN_MS = 2200
