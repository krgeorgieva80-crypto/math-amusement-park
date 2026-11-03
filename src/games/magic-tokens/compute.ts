/**
 * Самостоятелно пресмятане в „Събиране“ и „Изваждане“:
 * етапи на задачата, проверка на въведения отговор, подсказки по разряди
 * и правила какво може да се вижда на екрана преди проверката.
 * Чист TypeScript — без React.
 */
import { borrowCount, carryCount, digitAt } from './arithmetic'
import { formatNumber } from './logic'
import { PLACES, PLACE_NAMES, valueOf, type Counts, type Place } from './placeValue'
import { typicalMistake, type BoardState, type TokenTask } from './tasks'

export type WorkMode = 'tokensAndCompute' | 'computeOnly' | 'tokensOnly'

export const WORK_MODE_LABELS: Record<WorkMode, string> = {
  tokensAndCompute: 'С жетони и самостоятелно пресмятане',
  computeOnly: 'Самостоятелно пресмятане без жетони',
  tokensOnly: 'Само работа с жетони',
}

export const WORK_MODE_SHORT: Record<WorkMode, string> = {
  tokensAndCompute: 'Жетони + пресмятане',
  computeOnly: 'Само пресмятане',
  tokensOnly: 'Само жетони',
}

/** Етап на задачата: 1. Представи → 2. Пресметни → 3. Провери. */
export type Stage = 'model' | 'compute' | 'done'

export type ArithTask = Extract<TokenTask, { kind: 'add' | 'subtract' }>

export const isArithmetic = (t: TokenTask): t is ArithTask => t.kind === 'add' || t.kind === 'subtract'

/** Задачата има ли етап „Пресметни“ при този начин на работа. */
export function hasComputeStage(task: TokenTask, mode: WorkMode): boolean {
  return isArithmetic(task) && mode !== 'tokensOnly'
}

/** Задачата има ли етап „Представи“ (работа с жетони). */
export function hasModelStage(task: TokenTask, mode: WorkMode): boolean {
  return !isArithmetic(task) || mode !== 'computeOnly'
}

export function firstStage(task: TokenTask, mode: WorkMode): Stage {
  return hasModelStage(task, mode) ? 'model' : 'compute'
}

export const resultOf = (t: ArithTask) => (t.kind === 'add' ? t.a + t.b : t.a - t.b)
export const opSign = (t: ArithTask) => (t.kind === 'add' ? '+' : '−')

/** Изразът без отговор: „34 − 4 =“. */
export function expressionText(t: ArithTask): string {
  return `${formatNumber(t.a)} ${opSign(t)} ${formatNumber(t.b)} =`
}

// ───────────────────────── Пресмятане по разряди ─────────────────────────

export interface ColumnStep {
  place: Place
  /** Цифрите в разряда. */
  top: number
  bottom: number
  /** Пренос (при +) или заем (при −) от предишния разряд. */
  carryIn: number
  /** Цифрата, която се записва в резултата. */
  digit: number
  /** Пренос към / заем от следващия разряд. */
  carryOut: number
}

/** Писмено пресмятане отдясно наляво — цифра по цифра. */
export function columnSteps(op: '+' | '-', a: number, b: number): ColumnStep[] {
  const steps: ColumnStep[] = []
  const top = Math.max(a, b)
  const lastPlace = PLACES.filter((p) => p <= Math.max(1, top)).length
  let carry = 0
  for (const p of [...PLACES].reverse().slice(0, lastPlace)) {
    const x = digitAt(a, p)
    const y = digitAt(b, p)
    if (op === '+') {
      const s = x + y + carry
      steps.push({ place: p, top: x, bottom: y, carryIn: carry, digit: s % 10, carryOut: s >= 10 ? 1 : 0 })
      carry = s >= 10 ? 1 : 0
    } else {
      let d = x - carry - y
      const borrow = d < 0 ? 1 : 0
      if (borrow) d += 10
      steps.push({ place: p, top: x, bottom: y, carryIn: carry, digit: d, carryOut: borrow })
      carry = borrow
    }
  }
  if (op === '+' && carry) steps.push({ place: (steps[steps.length - 1].place * 10) as Place, top: 0, bottom: 0, carryIn: 1, digit: 1, carryOut: 0 })
  return steps
}

/** Сглобява резултата от стъпките (за проверка на самите стъпки). */
export function resultFromSteps(steps: ColumnStep[]): number {
  return steps.reduce((s, st) => s + st.digit * st.place, 0)
}

// ───────────────────────── Въвеждане и проверка ─────────────────────────

export const MAX_ANSWER_DIGITS = 6

/** Добавя цифра към въведения отговор (без водещи нули, най-много 6 цифри). */
export function typeDigit(input: string, digit: string): string {
  if (!/^\d$/.test(digit)) return input
  if (input.length >= MAX_ANSWER_DIGITS) return input
  if (input === '0') return digit
  return input + digit
}

export function backspace(input: string): string {
  return input.slice(0, -1)
}

export interface AnswerCheck {
  status: 'correct' | 'wrong' | 'incomplete'
  message: string
}

/**
 * Проверява отговора, въведен от ученика. Никога не съобщава верния
 * резултат — само дали е по-голям/по-малък или типична грешка.
 */
export function checkComputedAnswer(task: ArithTask, input: string, details = true): AnswerCheck {
  const clean = input.trim()
  if (clean === '') return { status: 'incomplete', message: 'Напиши отговора с цифрите.' }
  if (!/^\d+$/.test(clean)) return { status: 'wrong', message: 'Използвай само цифри.' }
  const value = Number(clean)
  const correct = resultOf(task)
  if (value === correct) return { status: 'correct', message: 'Браво!' }
  if (!details) return { status: 'wrong', message: 'Отговорът не е верен. Пресметни още веднъж.' }
  const regroup = task.kind === 'add' ? carryCount(task.a, task.b) > 0 : borrowCount(task.a, task.b) > 0
  if (regroup && value === typicalMistake(task.kind === 'add' ? '+' : '-', task.a, task.b, task.places)) {
    return {
      status: 'wrong',
      message: task.kind === 'add' ? 'Май си забравил преноса. Провери къде има 10 или повече.' : 'Май си извадил по-малката цифра от по-голямата. Провери къде трябва да заемеш.',
    }
  }
  return { status: 'wrong', message: value > correct ? 'Отговорът е по-голям от верния. Пресметни още веднъж.' : 'Отговорът е по-малък от верния. Пресметни още веднъж.' }
}

// ───────────────────────── Подсказки ─────────────────────────

function digitsWord(c: Counts, places: Place[]): string {
  const ps = places.filter((p) => c[p] > 0)
  if (ps.length === 0) return 'няма жетони'
  const parts = ps.map((p) => `${c[p]} ${c[p] === 1 ? PLACE_NAMES[p].one : PLACE_NAMES[p].many}`)
  return parts.length === 1 ? parts[0] : `${parts.slice(0, -1).join(', ')} и ${parts[parts.length - 1]}`
}

/**
 * Подсказка за етап „Пресметни“. След работа с жетони насочва към
 * дъската; без жетони — дава първата стъпка от писменото пресмятане.
 * Не съобщава целия резултат.
 */
export function computeHint(task: ArithTask, board: Counts | null, attempt: number): string {
  if (board) {
    return attempt === 0
      ? 'Погледни жетоните на дъската. Колко има във всеки разряд?'
      : `На дъската има ${digitsWord(board, task.places)}. Какво число е това?`
  }
  const steps = columnSteps(task.kind === 'add' ? '+' : '-', task.a, task.b)
  const s = steps[0]
  const unit = PLACE_NAMES[s.place].many
  if (task.kind === 'add') {
    const sum = s.top + s.bottom
    return sum >= 10
      ? `Започни от ${unit}: ${s.top} + ${s.bottom} = ${sum}. Запиши ${s.digit} и пренеси 1 в следващия разряд.`
      : `Започни от ${unit}: ${s.top} + ${s.bottom} = ${sum}. После събери следващия разряд.`
  }
  return s.carryOut
    ? `Започни от ${unit}: ${s.top} − ${s.bottom} не може. Заеми 1 от следващия разряд: ${s.top + 10} − ${s.bottom} = ${s.digit}.`
    : `Започни от ${unit}: ${s.top} − ${s.bottom} = ${s.digit}. После извади следващия разряд.`
}

// ───────────────────────── Какво се вижда на екрана ─────────────────────────

export interface VisibleInfo {
  /** Число до етикета на всеки ред на дъската (или „?“). */
  rowValues: Partial<Record<'a' | 'b' | 'result' | 'board' | 'removed', string>>
  /** Текст в лентата под дъската. */
  info: string
}

/**
 * Какво показваме за „Събиране“ и „Изваждане“. Преди правилна проверка
 * се виждат само условието и броят жетони в клетките — без резултата
 * и без автоматично завършен израз.
 */
export function visibleInfo(task: ArithTask, state: BoardState, revealed: boolean): VisibleInfo {
  const f = formatNumber
  const result = resultOf(task)
  if (task.kind === 'add') {
    return {
      rowValues: { a: f(task.a), b: f(task.b), result: revealed ? f(result) : '?' },
      info: revealed ? `${f(task.a)} + ${f(task.b)} = ${f(result)}` : `Събери ${f(task.a)} и ${f(task.b)}.`,
    }
  }
  const removed = state.kind === 'subtract' ? valueOf(state.removed) : 0
  return {
    rowValues: { board: revealed ? f(result) : '?', removed: revealed ? f(task.b) : '' },
    info: revealed ? `${f(task.a)} − ${f(task.b)} = ${f(result)}` : `Имаше ${f(task.a)}. Трябва да махнеш ${f(task.b)}.${removed > 0 ? ' Махай по разряди.' : ''}`,
  }
}
