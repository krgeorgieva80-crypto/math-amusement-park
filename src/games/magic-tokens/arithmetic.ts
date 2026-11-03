/**
 * Събиране и изваждане с преминаване чрез жетони, плюс проверка на
 * ограниченията (има ли преминаване, през нулев разряд ли е и т.н.).
 */
import { PLACES, countsOf, exchangeDownUntil, mergeCounts, normalizeUp, removeToken, valueOf, type Counts, type Exchange, type Place } from './placeValue'

/** Цифрата на числото в даден разряд. */
export function digitAt(n: number, p: Place): number {
  return Math.floor(n / p) % 10
}

/** Брой разряди с пренос при a + b (колко пъти се „минава през десетицата“). */
export function carryCount(a: number, b: number): number {
  let carry = 0
  let count = 0
  for (const p of [...PLACES].reverse()) {
    const s = digitAt(a, p) + digitAt(b, p) + carry
    carry = s >= 10 ? 1 : 0
    count += carry
  }
  return count
}

/** Брой разряди със заемане при a − b (a ≥ b). */
export function borrowCount(a: number, b: number): number {
  if (b > a) throw new RangeError('Умалителят е по-голям от умаляемото')
  let borrow = 0
  let count = 0
  for (const p of [...PLACES].reverse()) {
    const d = digitAt(a, p) - borrow - digitAt(b, p)
    borrow = d < 0 ? 1 : 0
    count += borrow
  }
  return count
}

/**
 * Заемането минава ли през нулев разряд (напр. 305 − 128 или 1000 − 1)?
 * Това означава последователни размени.
 */
export function borrowsThroughZero(a: number, b: number): boolean {
  if (b > a) return false
  let board = countsOf(a)
  for (const p of [...PLACES].reverse()) {
    const need = digitAt(b, p)
    if (board[p] < need) {
      // най-близкият по-горен разряд с жетони — ако не е съседният, минаваме през нула
      let q = p * 10
      while (q <= 10000 && board[q as Place] === 0) q *= 10
      if (q > p * 10) return true
      const step = exchangeDownUntil(board, p, need)
      if (!step) return false
      board = step.counts
    }
    board = removeToken(board, p, need)
  }
  return false
}

export function hasRegrouping(op: '+' | '-', a: number, b: number): boolean {
  return op === '+' ? carryCount(a, b) > 0 : borrowCount(a, b) > 0
}

export interface AdditionResult {
  sum: number
  /** Обединените жетони преди размяната. */
  merged: Counts
  /** Стандартното представяне на сбора. */
  result: Counts
  exchanges: Exchange[]
}

/** Събиране с жетони: обединяване на двете групи и размяна 10 → 1. */
export function addWithTokens(a: number, b: number): AdditionResult {
  const merged = mergeCounts(countsOf(a), countsOf(b))
  const { counts, exchanges } = normalizeUp(merged)
  return { sum: valueOf(counts), merged, result: counts, exchanges }
}

export interface SubtractionResult {
  difference: number
  remaining: Counts
  exchanges: Exchange[]
}

/**
 * Изваждане с жетони: от най-малкия разряд нагоре премахваме цифрата на
 * умалителя; ако жетоните не стигат — разменяме 1 → 10 (и през нулите).
 */
export function subtractWithTokens(a: number, b: number): SubtractionResult {
  if (b > a) throw new RangeError('Умалителят е по-голям от умаляемото')
  let board = countsOf(a)
  const exchanges: Exchange[] = []
  for (const p of [...PLACES].reverse()) {
    const need = digitAt(b, p)
    if (board[p] < need) {
      const step = exchangeDownUntil(board, p, need)
      if (!step) throw new RangeError('Невъзможно изваждане')
      board = step.counts
      exchanges.push(...step.exchanges)
    }
    board = removeToken(board, p, need)
  }
  return { difference: valueOf(board), remaining: board, exchanges }
}

/** Брой цифри на число (0 → 1). */
export function digitCount(n: number): number {
  return Math.max(1, String(Math.abs(n)).length)
}
