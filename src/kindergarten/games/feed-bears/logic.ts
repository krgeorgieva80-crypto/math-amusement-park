/**
 * „Нахрани трите мечета“ — логика на играта (чист TypeScript, с тестове).
 * Първа група (3–4 г.), ядро „Количествени отношения“: едно и много, броене до 3,
 * съпоставяне на количество с предмети, съответствие едно към едно.
 * Без таймер, без наказания: грешката води до нов опит с визуална подсказка.
 */

export type BearId = 'big' | 'mid' | 'small'
export type FruitId = 'apple' | 'pear' | 'strawberry'
/** one/two/three — точно толкова; each — по едно на всяко мече; many — „много“ (повече от три). */
export type TaskKind = 'one' | 'two' | 'three' | 'each' | 'many'

export const BEARS: BearId[] = ['big', 'mid', 'small']
export const FRUITS: FruitId[] = ['apple', 'pear', 'strawberry']

export const BEAR_NAME: Record<BearId, string> = { big: 'голямото мече', mid: 'средното мече', small: 'малкото мече' }
const FRUIT_ONE: Record<FruitId, string> = { apple: 'ябълка', pear: 'круша', strawberry: 'ягода' }
const FRUIT_MANY: Record<FruitId, string> = { apple: 'ябълки', pear: 'круши', strawberry: 'ягоди' }
const NUM: Record<1 | 2 | 3, string> = { 1: 'една', 2: 'две', 3: 'три' }

/** „Много“ = повече от три. */
export const MANY_MIN = 4

export interface FeedTask {
  kind: TaskKind
  fruit: FruitId
  /** Мечето, което трябва да получи лакомствата (при 'each' — всички). */
  bear: BearId | null
  /** Колко трябва да получи посоченото мече (при 'many' — минимумът, при 'each' — по 1 на всяко). */
  need: number
  /** Колко лакомства има в кошничката в началото. */
  basket: number
}

export type Rng = () => number

/** Поредица от задачи с постепенно усложняване (3–5 задачи). */
export function plan(count: number): TaskKind[] {
  if (count <= 3) return ['one', 'two', 'three']
  if (count === 4) return ['one', 'each', 'two', 'three']
  return ['one', 'many', 'each', 'two', 'three']
}

const NEED: Record<TaskKind, number> = { one: 1, two: 2, three: 3, each: 1, many: MANY_MIN }
const BASKET: Record<TaskKind, number> = { one: 3, two: 4, three: 5, each: 4, many: 7 }

export function makeTasks(count: number, rng: Rng): FeedTask[] {
  const kinds = plan(Math.max(3, Math.min(5, count)))
  const tasks: FeedTask[] = []
  let lastBear: BearId | null = null
  let lastFruit: FruitId | null = null
  for (const kind of kinds) {
    const fruits = FRUITS.filter((f) => f !== lastFruit)
    const fruit = fruits[Math.floor(rng() * fruits.length)]
    let bear: BearId | null = null
    if (kind !== 'each') {
      const bears = BEARS.filter((b) => b !== lastBear)
      bear = bears[Math.floor(rng() * bears.length)]
      lastBear = bear
    }
    lastFruit = fruit
    tasks.push({ kind, fruit, bear, need: NEED[kind], basket: BASKET[kind] })
  }
  return tasks
}

// ───────────── текст и фрази за гласовите записи ─────────────

/** Идентификатор на фразата с инструкцията (за записания аудиофайл). */
export function instructionId(t: FeedTask): string {
  if (t.kind === 'each') return `feed.each.${t.fruit}`
  const n = t.kind === 'many' ? 'many' : t.need
  return `feed.give.${t.bear}.${n}.${t.fruit}`
}

export function instructionText(t: FeedTask): string {
  if (t.kind === 'each') return `Дай на всяко мече по една ${FRUIT_ONE[t.fruit]}.`
  const what = t.kind === 'many' ? `много ${FRUIT_MANY[t.fruit]}` : t.need === 1 ? `една ${FRUIT_ONE[t.fruit]}` : `${NUM[t.need as 2 | 3]} ${FRUIT_MANY[t.fruit]}`
  return `Дай на ${BEAR_NAME[t.bear!]} ${what}.`
}

export const COUNT_WORDS = ['едно', 'две', 'три', 'четири', 'пет', 'шест', 'седем']

export const FIXED_PHRASES: { id: string; text: string }[] = [
  { id: 'feed.hint.bear', text: 'Това мече ще почака. Виж кое мече е гладно.' },
  { id: 'feed.hint.more', text: 'Още малко! Виж празните места в чинийката.' },
  { id: 'feed.hint.less', text: 'Ох, това е много! Върни едно лакомство в кошничката.' },
  { id: 'feed.hint.each', text: 'Всяко мече чака по едно лакомство.' },
  { id: 'feed.hint.many', text: 'Мечето иска много! Дай му още.' },
  { id: 'feed.praise.1', text: 'Браво!' },
  { id: 'feed.praise.2', text: 'Чудесно! Мечето е доволно.' },
  { id: 'feed.praise.3', text: 'Много добре!' },
  { id: 'feed.praise.4', text: 'Мечето ти благодари!' },
  { id: 'feed.end', text: 'Мечетата са сити. Благодарят ти!' },
  { id: 'feed.end.group', text: 'Браво, деца! Мечетата са сити.' },
  { id: 'feed.next.child', text: 'Сега е ред на следващото дете.' },
  ...COUNT_WORDS.map((w, i) => ({ id: `count.${i + 1}`, text: w[0].toUpperCase() + w.slice(1) })),
]

/** Всички фрази на играта — за списъка със записи. */
export function allFeedPhrases(): { id: string; text: string }[] {
  const out = [...FIXED_PHRASES]
  for (const fruit of FRUITS) {
    out.push({ id: `feed.each.${fruit}`, text: instructionText({ kind: 'each', fruit, bear: null, need: 1, basket: 4 }) })
    for (const bear of BEARS)
      for (const kind of ['one', 'two', 'three', 'many'] as TaskKind[]) {
        const t: FeedTask = { kind, fruit, bear, need: NEED[kind], basket: BASKET[kind] }
        out.push({ id: instructionId(t), text: instructionText(t) })
      }
  }
  return out
}

// ───────────── състояние на играта ─────────────

export type Hint = 'bear' | 'more' | 'less' | 'each' | 'many'

export interface FeedState {
  tasks: FeedTask[]
  index: number
  phase: 'play' | 'success' | 'done'
  /** Колко лакомства има всяко мече в чинийката. */
  plates: Record<BearId, number>
  basket: number
  /** Неуспешни проверки по текущата задача. */
  wrong: number
  /** Подсказка след неуспешна проверка (визуална). */
  hint: Hint | null
  firstTry: number
  hinted: number
}

export type FeedAction = { type: 'give'; bear: BearId } | { type: 'takeBack'; bear: BearId } | { type: 'check'; hintsOn: boolean } | { type: 'next' }

const empty = (): Record<BearId, number> => ({ big: 0, mid: 0, small: 0 })

export function newGame(tasks: FeedTask[]): FeedState {
  return { tasks, index: 0, phase: 'play', plates: empty(), basket: tasks[0].basket, wrong: 0, hint: null, firstTry: 0, hinted: 0 }
}

export function isCorrect(t: FeedTask, plates: Record<BearId, number>): boolean {
  if (t.kind === 'each') return BEARS.every((b) => plates[b] === 1)
  const others = BEARS.filter((b) => b !== t.bear).every((b) => plates[b] === 0)
  if (!others) return false
  return t.kind === 'many' ? plates[t.bear!] >= MANY_MIN : plates[t.bear!] === t.need
}

/** Каква подсказка да се покаже при неуспех. */
export function hintFor(t: FeedTask, plates: Record<BearId, number>): Hint {
  if (t.kind === 'each') return 'each'
  if (BEARS.some((b) => b !== t.bear && plates[b] > 0)) return 'bear'
  if (t.kind === 'many') return 'many'
  return plates[t.bear!] < t.need ? 'more' : 'less'
}

export function feedReducer(s: FeedState, a: FeedAction): FeedState {
  switch (a.type) {
    case 'give':
      if (s.phase !== 'play' || s.basket <= 0) return s
      return { ...s, basket: s.basket - 1, plates: { ...s.plates, [a.bear]: s.plates[a.bear] + 1 } }
    case 'takeBack':
      if (s.phase !== 'play' || s.plates[a.bear] <= 0) return s
      return { ...s, basket: s.basket + 1, plates: { ...s.plates, [a.bear]: s.plates[a.bear] - 1 } }
    case 'check': {
      if (s.phase !== 'play') return s
      const t = s.tasks[s.index]
      if (isCorrect(t, s.plates)) return { ...s, phase: 'success', hint: null, firstTry: s.firstTry + (s.wrong === 0 ? 1 : 0), hinted: s.hinted + (s.wrong > 0 && a.hintsOn ? 1 : 0) }
      return { ...s, wrong: s.wrong + 1, hint: a.hintsOn ? hintFor(t, s.plates) : null }
    }
    case 'next': {
      if (s.phase !== 'success') return s
      const index = s.index + 1
      if (index >= s.tasks.length) return { ...s, phase: 'done' }
      return { ...s, index, phase: 'play', plates: empty(), basket: s.tasks[index].basket, wrong: 0, hint: null }
    }
  }
}

/** Детерминиран генератор (за тестове и повторяемост). */
export function seeded(seed: number): Rng {
  let x = seed >>> 0 || 1
  return () => {
    x ^= x << 13
    x ^= x >>> 17
    x ^= x << 5
    return ((x >>> 0) % 100000) / 100000
  }
}
