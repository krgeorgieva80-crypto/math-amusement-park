/**
 * Разрядно представяне и размяна на жетони.
 * Състоянието на дъската е „колко жетона има във всеки разряд“ (Counts).
 * Всички операции са чисти функции и запазват стойността, когато трябва.
 */

export const PLACES = [10000, 1000, 100, 10, 1] as const
export type Place = (typeof PLACES)[number]
export type Counts = Record<Place, number>

/** Най-голямото число, което може да се представи стандартно (5 разряда). */
export const MAX_VALUE = 99999

export const PLACE_NAMES: Record<Place, { one: string; many: string; short: string; header: string }> = {
  10000: { one: 'десетица хиляди', many: 'десетици хиляди', short: 'ДХ', header: 'Десетици хиляди' },
  1000: { one: 'хиляда', many: 'хиляди', short: 'Х', header: 'Хиляди' },
  100: { one: 'стотица', many: 'стотици', short: 'С', header: 'Стотици' },
  10: { one: 'десетица', many: 'десетици', short: 'Д', header: 'Десетици' },
  1: { one: 'единица', many: 'единици', short: 'Е', header: 'Единици' },
}

export function emptyCounts(): Counts {
  return { 10000: 0, 1000: 0, 100: 0, 10: 0, 1: 0 }
}

export function cloneCounts(c: Counts): Counts {
  return { ...c }
}

/** Стандартно разрядно представяне: 352 → 3 стотици, 5 десетици, 2 единици. */
export function countsOf(n: number): Counts {
  if (!Number.isInteger(n) || n < 0 || n > MAX_VALUE) throw new RangeError(`Числото ${n} е извън обхвата 0–${MAX_VALUE}`)
  const c = emptyCounts()
  let rest = n
  for (const p of PLACES) {
    c[p] = Math.floor(rest / p)
    rest -= c[p] * p
  }
  return c
}

/** Стойност на жетоните върху дъската. */
export function valueOf(c: Counts): number {
  return PLACES.reduce((s, p) => s + p * c[p], 0)
}

export function totalTokens(c: Counts): number {
  return PLACES.reduce((s, p) => s + c[p], 0)
}

/** Стандартно ли е представянето (най-много 9 жетона във всеки разряд)? */
export function isStandard(c: Counts): boolean {
  return PLACES.every((p) => c[p] >= 0 && c[p] <= 9)
}

export function equalCounts(a: Counts, b: Counts): boolean {
  return PLACES.every((p) => a[p] === b[p])
}

export function isEmpty(c: Counts): boolean {
  return PLACES.every((p) => c[p] === 0)
}

/** Разрядите, нужни за числа до max включително (низходящо): 100 → [100, 10, 1]. */
export function placesForMax(max: number): Place[] {
  const top = Math.min(MAX_VALUE, max)
  return PLACES.filter((p) => p <= Math.max(10, top))
}

export function higherPlace(p: Place): Place | null {
  return p === 10000 ? null : ((p * 10) as Place)
}

export function lowerPlace(p: Place): Place | null {
  return p === 1 ? null : ((p / 10) as Place)
}

export class ExchangeError extends Error {}

/** Може ли да се разменят 10 жетона от разряд p за 1 от по-горния разряд? */
export function canExchangeUp(c: Counts, p: Place, places: readonly Place[]): boolean {
  const up = higherPlace(p)
  return up !== null && places.includes(up) && c[p] >= 10
}

/** 10 единици = 1 десетица, 10 десетици = 1 стотица и т.н. */
export function exchangeUp(c: Counts, p: Place, places: readonly Place[] = PLACES): Counts {
  if (!canExchangeUp(c, p, places)) {
    throw new ExchangeError(`Не може да се размени: трябват 10 ${PLACE_NAMES[p].many}`)
  }
  const up = higherPlace(p)!
  return { ...c, [p]: c[p] - 10, [up]: c[up] + 1 }
}

/** Може ли 1 жетон от разряд p да се размени за 10 от по-долния разряд? */
export function canExchangeDown(c: Counts, p: Place, places: readonly Place[]): boolean {
  const down = lowerPlace(p)
  return down !== null && places.includes(down) && c[p] >= 1
}

/** 1 десетица = 10 единици, 1 стотица = 10 десетици и т.н. */
export function exchangeDown(c: Counts, p: Place, places: readonly Place[] = PLACES): Counts {
  if (!canExchangeDown(c, p, places)) {
    throw new ExchangeError(`Няма ${PLACE_NAMES[p].one} за размяна`)
  }
  const down = lowerPlace(p)!
  return { ...c, [p]: c[p] - 1, [down]: c[down] + 10 }
}

/** Обединява две групи жетони (без размяна). */
export function mergeCounts(a: Counts, b: Counts): Counts {
  const c = emptyCounts()
  for (const p of PLACES) c[p] = a[p] + b[p]
  return c
}

export function addToken(c: Counts, p: Place, n = 1): Counts {
  return { ...c, [p]: c[p] + n }
}

/** Премахва жетон; не позволява премахване на несъществуващ жетон. */
export function removeToken(c: Counts, p: Place, n = 1): Counts {
  if (c[p] < n) throw new ExchangeError(`Няма толкова ${PLACE_NAMES[p].many}`)
  return { ...c, [p]: c[p] - n }
}

export interface Exchange {
  from: Place
  to: Place
  direction: 'up' | 'down'
}

/**
 * Привежда представянето в стандартен вид чрез размени нагоре
 * (използва се при събиране с преминаване). Връща и списъка с размени.
 */
export function normalizeUp(c: Counts, places: readonly Place[] = PLACES): { counts: Counts; exchanges: Exchange[] } {
  let cur = cloneCounts(c)
  const exchanges: Exchange[] = []
  const ascending = [...places].sort((a, b) => a - b)
  for (const p of ascending) {
    while (canExchangeUp(cur, p, places)) {
      cur = exchangeUp(cur, p, places)
      exchanges.push({ from: p, to: higherPlace(p)!, direction: 'up' })
    }
  }
  return { counts: cur, exchanges }
}

/**
 * Последователни размени надолу, докато разряд target получи поне `need`
 * жетона — минава и през нулеви разряди (напр. 305: 1 стотица → 10 десетици
 * → 1 десетица → 10 единици). Връща null, ако не е възможно.
 */
export function exchangeDownUntil(c: Counts, target: Place, need: number, places: readonly Place[] = PLACES): { counts: Counts; exchanges: Exchange[] } | null {
  let cur = cloneCounts(c)
  const exchanges: Exchange[] = []
  while (cur[target] < need) {
    // най-близкият по-горен разряд с жетон
    let q = higherPlace(target)
    while (q !== null && places.includes(q) && cur[q] === 0) q = higherPlace(q)
    if (q === null || !places.includes(q)) return null
    // разменяме надолу стъпка по стъпка до target
    let p: Place = q
    while (p !== target) {
      cur = exchangeDown(cur, p, places)
      exchanges.push({ from: p, to: lowerPlace(p)!, direction: 'down' })
      p = lowerPlace(p)!
    }
  }
  return { counts: cur, exchanges }
}

export function placeWord(p: Place, n: number): string {
  return n === 1 ? PLACE_NAMES[p].one : PLACE_NAMES[p].many
}

/** „4 десетици и 7 единици“ — само ненулевите разряди (или всички, ако includeZero). */
export function describeCounts(c: Counts, places: readonly Place[] = PLACES, includeZero = false): string {
  const parts = places.filter((p) => includeZero || c[p] > 0).map((p) => `${c[p]} ${placeWord(p, c[p])}`)
  if (parts.length === 0) return '0'
  return parts.length === 1 ? parts[0] : `${parts.slice(0, -1).join(', ')} и ${parts[parts.length - 1]}`
}

/** Кратък запис: „3 С 4 Д 15 Е“. */
export function shortCounts(c: Counts, places: readonly Place[]): string {
  return places.map((p) => `${c[p]} ${PLACE_NAMES[p].short}`).join(' ')
}
