/**
 * „Събиране“: кои колони да се виждат и какво кратко указание да
 * получи ученикът на всеки етап. Чист TypeScript — без React.
 */
import { PLACE_NAMES, higherPlace, isEmpty, placesForMax, type Counts, type Place } from './placeValue'
import type { BoardState, TokenTask } from './tasks'
import type { Stage } from './compute'

export type AddTask = Extract<TokenTask, { kind: 'add' }>
type AddState = Extract<BoardState, { kind: 'add' }>

/**
 * Колоните за събиране: само разрядите на събираемите (при задачи до 100 —
 * десетици и единици). По-горният разряд се показва едва когато е нужен:
 * когато в най-горния разряд има 10 жетона за размяна или вече има жетон в него.
 * Така празната колона „Стотици“ не заема място и не издава резултата.
 */
export function visibleAddPlaces(task: AddTask, state: BoardState): Place[] {
  const base = placesForMax(Math.max(task.a, task.b, 10)).filter((p) => task.places.includes(p))
  const s = state.kind === 'add' ? (state as AddState) : null
  const places = [...base]
  let top = places[0]
  while (s) {
    const up = higherPlace(top)
    if (!up || !task.places.includes(up)) break
    const total = s.a[top] + s.b[top] + s.result[top]
    if (total >= 10 || s.result[up] > 0) {
      places.unshift(up)
      top = up
    } else break
  }
  return places
}

/** Най-ниският разряд в сбора с 10 или повече жетона (нужна размяна). */
export function placeToExchange(result: Counts, places: Place[]): Place | null {
  return [...places].reverse().find((p) => result[p] >= 10 && higherPlace(p) !== null) ?? null
}

/** „Размени 10 единици за 1 десетица.“ */
export function exchangeText(p: Place): string {
  const up = higherPlace(p)!
  return `Размени 10 ${PLACE_NAMES[p].many} за 1 ${PLACE_NAMES[up].one}.`
}

/**
 * Кратко указание за ученика според етапа. Указание за размяна се
 * показва само когато размяната наистина е необходима.
 */
export function addStepInstruction(task: AddTask, state: BoardState, stage: Stage, answer: string): string {
  if (stage === 'done') return 'Браво!'
  if (stage === 'compute') return answer ? 'Провери решението.' : 'Пресметни и запиши отговора.'
  if (state.kind !== 'add') return 'Премести жетоните в сбора.'
  if (!isEmpty(state.a) || !isEmpty(state.b)) return 'Премести жетоните в сбора.'
  const p = placeToExchange(state.result, visibleAddPlaces(task, state))
  if (p) return exchangeText(p)
  return 'Провери решението.'
}
