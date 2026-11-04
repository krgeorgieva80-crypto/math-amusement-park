/**
 * „Веселото влакче“ — равни групи, подредени една след друга.
 * Използва математическата логика на колелото (генериране, проверки,
 * натрупване, запис на умножението) и добавя само собствените нива и
 * текстове с „вагонче“. Чист TypeScript — без React.
 */
import type { Difficulty, Grade, Rng } from '../../magic-tokens/logic'
import {
  WHY_EQUAL,
  checkGroups,
  generateGroupsTask,
  groupsHint,
  product,
  runningTotals,
  type AnswerCheck,
  type Check,
  type ComputeStep,
  type GroupsLevel,
  type GroupsTask,
} from '../logic'

/**
 * Нива на влакчето: до 8 вагончета (на два реда), за да остават децата
 * достатъчно големи за преброяване. По-кратки серии от колелото в 2. клас.
 */
const TRAIN_LEVELS: Record<Grade, Record<Difficulty, GroupsLevel>> = {
  2: {
    explorer: { groups: [2, 4], size: [2, 5], kind: 'fill' },
    researcher: { groups: [3, 5], size: [2, 6], kind: 'fix' },
    master: { groups: [4, 6], size: [3, 9], kind: 'match' },
  },
  3: {
    explorer: { groups: [3, 5], size: [3, 7], kind: 'fill' },
    researcher: { groups: [4, 6], size: [4, 9], kind: 'fix' },
    master: { groups: [5, 8], size: [6, 10], kind: 'match' },
  },
  4: {
    explorer: { groups: [4, 6], size: [4, 9], kind: 'fill' },
    researcher: { groups: [5, 8], size: [5, 10], kind: 'fix' },
    master: { groups: [6, 8], size: [6, 10], kind: 'match' },
  },
}

export const MAX_CARS = 8

export function trainLevel(grade: Grade, difficulty: Difficulty): GroupsLevel {
  return TRAIN_LEVELS[grade][difficulty]
}

/** Серия задачи за влакчето с различни двойки (вагончета, деца). */
export function generateTrainTasks(grade: Grade, difficulty: Difficulty, count: number, rng: Rng = Math.random): GroupsTask[] {
  const level = trainLevel(grade, difficulty)
  const seen = new Set<string>()
  const tasks: GroupsTask[] = []
  for (let i = 0; i < count; i++) {
    let t = generateGroupsTask(level, rng, i + 1)
    for (let k = 0; k < 50 && seen.has(`${t.groups}x${t.size}`); k++) t = generateGroupsTask(level, rng, i + 1)
    seen.add(`${t.groups}x${t.size}`)
    tasks.push(t)
  }
  return tasks
}

const kids = (n: number) => (n === 1 ? 'дете' : 'деца')
const cars = (n: number) => (n === 1 ? 'вагонче' : 'вагончета')

/** Вагончето е попълнено правилно (за моменталното му открояване). */
export const carIsRight = (t: GroupsTask, cars: number[], i: number) => cars[i] === t.size

/** Проверка на „Представи“ — същата логика като при кабинките, с текст за вагончета. */
export function checkCars(t: GroupsTask, c: number[], details = true): Check {
  const r = checkGroups(t, c, details)
  if (r.status === 'incomplete') return { ...r, message: 'Сложи деца във вагончетата.' }
  if (r.status === 'correct') return { ...r, message: 'Всички вагончета са равни!' }
  if (!details) return { ...r, message: 'Вагончетата още не са равни.' }
  const i = r.cabin!
  const n = c[i]
  const what = t.kind === 'match' ? `а в първото има ${t.size}` : `а трябва ${t.size}`
  return {
    ...r,
    why: WHY_EQUAL,
    message: n < t.size ? `Във вагонче ${i + 1} има ${n} ${kids(n)}, ${what}. Добави ${t.size - n}.` : `Във вагонче ${i + 1} има ${n} ${kids(n)}, ${what}. Махни ${n - t.size}.`,
  }
}

/** Колко пъти е взето събираемото — текст за вагончета. */
export function checkCarsFactor(t: GroupsTask, input: string): AnswerCheck {
  if (input.trim() === '') return { status: 'incomplete', message: 'Напиши колко пъти.' }
  if (Number(input) === t.groups) return { status: 'correct', message: 'Браво!' }
  return { status: 'wrong', message: `Не е вярно. Преброй вагончетата — във всяко има по ${t.size}.` }
}

/** Подсказка без крайния резултат. */
export function carsHint(t: GroupsTask, c: number[], step: 'model' | ComputeStep): string {
  if (step === 'model') {
    const r = checkCars(t, c)
    if (r.status === 'correct') return 'Всички са равни! Натисни „Провери“.'
    if (r.status === 'incomplete') return `Сложи по ${t.size} ${kids(t.size)} във всяко вагонче.`
    return `${r.message} ${WHY_EQUAL}`
  }
  if (step === 'sum') return groupsHint(t, c, 'sum') // „Брой по 3: 3, 6, 9, …“
  return `Колко вагончета има влакчето? Във всяко има по ${t.size}.`
}

export function carsTitle(t: GroupsTask): { label: string; text: string } {
  if (t.kind === 'match') return { label: 'Направи вагончетата равни', text: `${t.groups} ${cars(t.groups)}` }
  return { label: 'Веселото влакче', text: `${t.groups} ${cars(t.groups)} по ${t.size}` }
}

export function carsInstruction(t: GroupsTask): string {
  switch (t.kind) {
    case 'fill':
      return `Сложи по ${t.size} ${kids(t.size)} във всяко вагонче.`
    case 'fix':
      return `Направи вагончетата равни — по ${t.size} ${kids(t.size)} във всяко.`
    case 'match':
      return 'Във всяко вагонче да има толкова деца, колкото в първото.'
  }
}

/** „Браво! Откри, че 4 вагончета по 5 деца са общо 20!“ */
export function carsSuccessText(t: GroupsTask): string {
  return `Браво! Откри, че ${t.groups} ${cars(t.groups)} по ${t.size} ${kids(t.size)} са общо ${product(t)}!`
}

export { runningTotals }

/** Брой вагончета, които вече са попълнени правилно. */
export const rightCars = (t: GroupsTask, c: number[]) => c.filter((_, i) => carIsRight(t, c, i)).length

export { product }
