/**
 * „Големи и малки ботуши“ — логика на играта (чист TypeScript, с тестове).
 * Първа група (3–4 г.), ядро „Измерване“: различаване и сравняване по големина, групиране по големина,
 * изпълнение на кратки словесни инструкции. Без мерни единици и без числа.
 *
 * Всяка задача: предметите се разпределят — големите на великана, малките на джуджето.
 * Цветовете са по двойки (всеки цвят е и на голям, и на малък предмет), а редът е разбъркан,
 * така че задачата не може да се реши по цвят или по запомнено място.
 * Без таймер и без наказание: при грешка предметът остава на мястото си за нов опит, със спокойна подсказка.
 */

export type ItemKind = 'boot' | 'winter-boot' | 'hat' | 'mitten'
export type SizeId = 'big' | 'small'
export type HeroId = 'giant' | 'dwarf'
/** Кратката инструкция, с която започва задачата. */
export type Lead = 'who-big' | 'give-big' | 'find-small' | 'give-small' | 'sort-all'

export const HERO_OF: Record<SizeId, HeroId> = { big: 'giant', small: 'dwarf' }
export const SIZE_OF: Record<HeroId, SizeId> = { giant: 'big', dwarf: 'small' }

export const COLORS = ['red', 'blue', 'yellow', 'green', 'purple', 'orange'] as const
export type ColorId = (typeof COLORS)[number]

export interface Item {
  id: string
  kind: ItemKind
  size: SizeId
  color: ColorId
}

export interface BootsTask {
  lead: Lead
  items: Item[]
  /** Колко пъти малкият предмет е по-малък от големия (по-малко число — по-очевидна разлика). */
  ratio: number
}

export type Rng = () => number

interface Spec {
  lead: Lead
  kinds: ItemKind[]
  ratio: number
}

/** Поредица с постепенно разнообразяване: първо два ботуша с очевидна разлика, накрая различни предмети. */
export function plan(count: number): Spec[] {
  const T1: Spec = { lead: 'who-big', kinds: ['boot'], ratio: 0.42 }
  const T2: Spec = { lead: 'give-big', kinds: ['boot', 'boot'], ratio: 0.45 }
  const T3: Spec = { lead: 'find-small', kinds: ['boot', 'winter-boot'], ratio: 0.5 }
  const T4: Spec = { lead: 'give-small', kinds: ['winter-boot', 'boot'], ratio: 0.55 }
  const T5: Spec = { lead: 'sort-all', kinds: ['boot', 'hat', 'mitten'], ratio: 0.6 }
  if (count <= 3) return [T1, { ...T3, lead: 'give-small' }, T5]
  if (count === 4) return [T1, T2, T3, T5]
  return [T1, T2, T3, T4, T5]
}

function shuffle<T>(xs: T[], rng: Rng): T[] {
  const a = [...xs]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/** Предметите на рафт: по един ред до 3 предмета; 4 → 2 + 2; 5 → 3 + 2; 6 → 3 + 3. */
export function shelfRows<T>(items: T[]): T[][] {
  const n = items.length
  if (n <= 3) return [items]
  const first = Math.ceil(n / 2)
  return [items.slice(0, first), items.slice(first)]
}

/** Двата реда на рафта повтарят една и съща подредба (напр. голям вляво и в двата реда) — подсказва по място. */
export function rowsRepeat(items: Item[]): boolean {
  const rows = shelfRows(items)
  if (rows.length < 2 || rows[0].length !== rows[1].length) return false
  return rows[0].every((it, k) => it.size === rows[1][k].size)
}

/** Последователността „голям/малък“ по реда на предметите (за проверка, че разположението се сменя). */
export const pattern = (t: BootsTask) => t.items.map((i) => (i.size === 'big' ? 'Г' : 'м')).join('')

export function makeTasks(count: number, rng: Rng): BootsTask[] {
  const specs = plan(Math.max(3, Math.min(5, count)))
  const tasks: BootsTask[] = []
  let lastColors: ColorId[] = []
  let lastPattern = ''
  specs.forEach((sp, ti) => {
    // нови цветове, различни от предишната задача, доколкото е възможно
    const fresh = shuffle(
      COLORS.filter((c) => !lastColors.includes(c)),
      rng,
    )
    const pool = [...fresh, ...shuffle([...COLORS], rng)]
    const colors: ColorId[] = []
    for (const c of pool) if (!colors.includes(c) && colors.length < sp.kinds.length) colors.push(c)
    // всяка двойка: един голям и един малък предмет от същия вид и цвят
    const items: Item[] = sp.kinds.flatMap((kind, k) => (['big', 'small'] as SizeId[]).map((size) => ({ id: `t${ti}-${kind}-${k}-${size}`, kind, size, color: colors[k] })))
    // ред: разбъркан; големият не винаги е отпред; различен от предишната задача
    let order = shuffle(items, rng)
    // при 4 предмета допустимите подредби са малко — достатъчно опити, за да се намери винаги
    for (let tries = 0; tries < 2000; tries++) {
      const p = order.map((i) => (i.size === 'big' ? 'Г' : 'м')).join('')
      if (p !== lastPattern && !(items.length > 2 && /^(Г+м+|м+Г+)$/.test(p)) && !rowsRepeat(order)) break
      order = shuffle(items, rng)
    }
    const task: BootsTask = { lead: sp.lead, items: order, ratio: sp.ratio }
    tasks.push(task)
    lastColors = colors
    lastPattern = pattern(task)
  })
  return tasks
}

// ───────────── фрази за гласовите записи ─────────────

export const BOOTS_PHRASES: { id: string; text: string }[] = [
  { id: 'boots.intro', text: 'Виж великана и джуджето!' },
  { id: 'boots.who-big', text: 'Кой има нужда от големи ботуши?' },
  { id: 'boots.find-small', text: 'Намери малките ботуши.' },
  { id: 'boots.give-big', text: 'Дай големите ботуши на великана.' },
  { id: 'boots.give-small', text: 'Дай малките ботуши на джуджето.' },
  { id: 'boots.sort-all', text: 'Големите неща са за великана, а малките — за джуджето.' },
  { id: 'boots.select', text: 'Сега докосни великана или джуджето.' },
  { id: 'boots.hint', text: 'Погледни внимателно. Кой ботуш е по-голям?' },
  { id: 'boots.hint.thing', text: 'Погледни внимателно. Кое е по-голямо?' },
  { id: 'boots.retry', text: 'Опитай пак!' },
  { id: 'boots.praise.1', text: 'Браво!' },
  { id: 'boots.praise.2', text: 'Точно така!' },
  { id: 'boots.praise.3', text: 'Великанът и джуджето са доволни!' },
  { id: 'boots.end', text: 'Чудесно! Помогна на двамата приятели!' },
  { id: 'boots.end.group', text: 'Чудесно, деца! Помогнахте на двамата приятели!' },
  { id: 'boots.next.child', text: 'Сега е ред на следващото дете.' },
]

export const bootsText = (id: string) => BOOTS_PHRASES.find((p) => p.id === id)?.text ?? ''

// ───────────── състояние на играта ─────────────

export interface BootsState {
  tasks: BootsTask[]
  index: number
  phase: 'play' | 'success' | 'done'
  /** Поставените предмети: идентификатор → герой. */
  placed: Record<string, HeroId>
  /** Неуспешни опити по текущата задача. */
  wrong: number
  /** Подсказка след грешка: кой предмет и при кого всъщност отива. */
  hint: { item: string; hero: HeroId } | null
  firstTry: number
  hinted: number
}

export type BootsAction = { type: 'place'; item: string; hero: HeroId; hintsOn: boolean } | { type: 'next' }

export function newGame(tasks: BootsTask[]): BootsState {
  return { tasks, index: 0, phase: 'play', placed: {}, wrong: 0, hint: null, firstTry: 0, hinted: 0 }
}

export const isCorrect = (item: Item, hero: HeroId) => HERO_OF[item.size] === hero

export const remaining = (s: BootsState) => s.tasks[s.index].items.filter((i) => !s.placed[i.id])

export function bootsReducer(s: BootsState, a: BootsAction): BootsState {
  switch (a.type) {
    case 'place': {
      if (s.phase !== 'play' || s.placed[a.item]) return s
      const item = s.tasks[s.index].items.find((i) => i.id === a.item)
      if (!item) return s
      if (!isCorrect(item, a.hero)) return { ...s, wrong: s.wrong + 1, hint: a.hintsOn ? { item: item.id, hero: HERO_OF[item.size] } : null }
      const placed = { ...s.placed, [item.id]: a.hero }
      const done = s.tasks[s.index].items.every((i) => placed[i.id])
      if (!done) return { ...s, placed, hint: null }
      return { ...s, placed, hint: null, phase: 'success', firstTry: s.firstTry + (s.wrong === 0 ? 1 : 0), hinted: s.hinted + (s.wrong > 0 && a.hintsOn ? 1 : 0) }
    }
    case 'next': {
      if (s.phase !== 'success') return s
      if (s.index + 1 >= s.tasks.length) return { ...s, phase: 'done' }
      return { ...s, index: s.index + 1, phase: 'play', placed: {}, wrong: 0, hint: null }
    }
  }
}

/**
 * Текущата инструкция: в началото — тази на задачата; когато остане само една големина
 * (и само ботуши) — насочва към нея („Дай малките ботуши на джуджето.“).
 */
export function currentLead(s: BootsState): Lead {
  const t = s.tasks[s.index]
  const left = remaining(s)
  if (left.length === 0 || left.length === t.items.length) return t.lead
  const sizes = new Set(left.map((i) => i.size))
  const onlyBoots = left.every((i) => i.kind === 'boot' || i.kind === 'winter-boot')
  if (sizes.size === 1 && onlyBoots) return sizes.has('big') ? 'give-big' : 'give-small'
  return t.lead
}

export function hintPhrase(item: Item | undefined): string {
  return item && (item.kind === 'boot' || item.kind === 'winter-boot') ? 'boots.hint' : 'boots.hint.thing'
}

/** Детерминиран генератор (за тестове). */
export function seeded(seed: number): Rng {
  let x = seed >>> 0 || 1
  return () => {
    x ^= x << 13
    x ^= x >>> 17
    x ^= x << 5
    return ((x >>> 0) % 100000) / 100000
  }
}
