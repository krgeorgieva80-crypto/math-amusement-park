/**
 * „Зайчето в лабиринта“ — първа група (3–4 г.), ядро „Пространствени отношения“, атракция „Приказният лабиринт“.
 * Едно приключение от пет кратки мисии с различни действия и постепенно усложняване:
 *   1. Разклонът — горе / долу (избор от две пътечки)
 *   2. Съкровищата на катеричката — в / на / под (поставяне спрямо предмет, избор от три места)
 *   3. Пиленцата у дома — вътре / вън (няколко обекта, после разпознаване)
 *   4. Камъчетата в поточето — близо / далече (спрямо героя, който се движи)
 *   5. Вълшебната врата — горе / долу с двустъпково указание (финал)
 * Чиста логика без React: задачите, проверката на отговора, подсказките и фразите.
 */

export type Rng = () => number

export type MissionId = 'fork' | 'hide' | 'chicks' | 'stones' | 'door'
export const MISSIONS: MissionId[] = ['fork', 'hide', 'chicks', 'stones', 'door']

export const MISSION_TITLE: Record<MissionId, string> = {
  fork: 'Разклонът',
  hide: 'Съкровищата на катеричката',
  chicks: 'Пиленцата у дома',
  stones: 'Камъчетата в поточето',
  door: 'Вълшебната врата',
}

export type Vertical = 'up' | 'down'
export type Place = 'in' | 'on' | 'under'
export type Treasure = 'key' | 'acorn' | 'cone'
export type Gift = 'star' | 'flower' | 'heart' | 'leaf'
export type ChickId = 'c1' | 'c2' | 'c3'
export const CHICKS: ChickId[] = ['c1', 'c2', 'c3']

export type Step =
  | { kind: 'fork'; target: Vertical; scene: number }
  | { kind: 'hide'; item: Treasure; target: Place }
  | { kind: 'chicks-in' }
  | { kind: 'chicks-out'; target: ChickId }
  | { kind: 'stone'; target: 'near' | 'far'; /** От коя страна на зайчето е близкото камъче. */ side: 'left' | 'right' }
  | { kind: 'door'; seq: { item: Gift; target: Vertical }[] }

export interface Mission {
  id: MissionId
  steps: Step[]
}

const shuffle = <T>(a: T[], rng: Rng): T[] => {
  const r = [...a]
  for (let i = r.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[r[i], r[j]] = [r[j], r[i]]
  }
  return r
}
const pick = <T>(a: readonly T[], rng: Rng): T => a[Math.floor(rng() * a.length)]

/** Приключението: пет мисии в постоянен ред, с разбъркани подробности. */
export function makeAdventure(rng: Rng): Mission[] {
  // 1. три разклона: и „горе“, и „долу“ се срещат поне веднъж
  const first: Vertical = rng() < 0.5 ? 'up' : 'down'
  const other: Vertical = first === 'up' ? 'down' : 'up'
  const forks: Vertical[] = [first, other, pick<Vertical>(['up', 'down'], rng)]
  // 2. трите предлога по веднъж, всеки с различно съкровище
  const places = shuffle<Place>(['in', 'on', 'under'], rng)
  const items = shuffle<Treasure>(['key', 'acorn', 'cone'], rng)
  // 4. три скока до близкото камъче, накрая — далечното (където е жабката)
  const stones: Step[] = [0, 1, 2].map(() => ({ kind: 'stone' as const, target: 'near' as const, side: rng() < 0.5 ? ('left' as const) : ('right' as const) }))
  stones.push({ kind: 'stone', target: 'far', side: rng() < 0.5 ? 'left' : 'right' })
  // 5. един подарък горе, един долу, после двустъпково указание
  const gifts = shuffle<Gift>(['star', 'flower', 'heart', 'leaf'], rng)
  const firstDoor: Vertical = rng() < 0.5 ? 'up' : 'down'
  const secondDoor: Vertical = firstDoor === 'up' ? 'down' : 'up'
  const pairFirst: Vertical = rng() < 0.5 ? 'up' : 'down'
  const pairSecond: Vertical = pairFirst === 'up' ? 'down' : 'up'
  return [
    { id: 'fork', steps: forks.map((target, scene) => ({ kind: 'fork', target, scene })) },
    { id: 'hide', steps: places.map((target, i) => ({ kind: 'hide', item: items[i], target })) },
    { id: 'chicks', steps: [{ kind: 'chicks-in' }, { kind: 'chicks-out', target: pick(CHICKS, rng) }] },
    { id: 'stones', steps: stones },
    {
      id: 'door',
      steps: [
        { kind: 'door', seq: [{ item: gifts[0], target: firstDoor }] },
        { kind: 'door', seq: [{ item: gifts[1], target: secondDoor }] },
        {
          kind: 'door',
          seq: [
            { item: gifts[2], target: pairFirst },
            { item: gifts[3], target: pairSecond },
          ],
        },
      ],
    },
  ]
}

export const totalSteps = (ms: Mission[]) => ms.reduce((n, m) => n + m.steps.length, 0)

// ───────────── фрази ─────────────

const TREASURE_NAME: Record<Treasure, string> = { key: 'ключето', acorn: 'жълъдчето', cone: 'шишарката' }
const PLACE_WORDS: Record<Place, string> = { in: 'в кошничката', on: 'на гъбката', under: 'под гъбката' }
const GIFT_NAME: Record<Gift, string> = { star: 'звездичката', flower: 'цветето', heart: 'сърчицето', leaf: 'листенцето' }
const VERT_WORD: Record<Vertical, string> = { up: 'горе', down: 'долу' }
export const TREASURES: Treasure[] = ['key', 'acorn', 'cone']
export const GIFTS: Gift[] = ['star', 'flower', 'heart', 'leaf']
export const PLACES: Place[] = ['in', 'on', 'under']
const cap = (s: string) => s[0].toUpperCase() + s.slice(1)

export const MAZE_PHRASES: { id: string; text: string }[] = [
  { id: 'maze.intro', text: 'Зайчето Скокльо отива на празник в Морковената градина. Да му помогнем да мине през лабиринта!' },
  { id: 'maze.intro.fork', text: 'Пътечката в лабиринта се разделя на две.' },
  { id: 'maze.intro.hide', text: 'Катеричката иска да скрие съкровищата си.' },
  { id: 'maze.intro.chicks', text: 'Пиленцата са избягали от оградката.' },
  { id: 'maze.intro.stones', text: 'Пред зайчето има поточе с камъчета.' },
  { id: 'maze.intro.door', text: 'Ето вълшебната врата на Морковената градина!' },
  { id: 'maze.fork.up', text: 'Да минем по горната пътечка!' },
  { id: 'maze.fork.down', text: 'Да минем по долната пътечка!' },
  ...TREASURES.flatMap((t) => PLACES.map((p) => ({ id: `maze.hide.${t}.${p}`, text: `Сложи ${TREASURE_NAME[t]} ${PLACE_WORDS[p]}.` }))),
  { id: 'maze.chicks.in', text: 'Пусни пиленцата вътре в оградката.' },
  { id: 'maze.chicks.out', text: 'Едно пиленце пак излезе. Покажи пиленцето, което е вън от оградката.' },
  { id: 'maze.stone.near', text: 'Скочи на камъчето, което е близо до зайчето.' },
  { id: 'maze.stone.far', text: 'Жабката седи на камъчето, което е далече. Покажи го!' },
  ...GIFTS.flatMap((g) => (['up', 'down'] as Vertical[]).map((v) => ({ id: `maze.door.${g}.${v}`, text: `Сложи ${GIFT_NAME[g]} ${VERT_WORD[v]}.` }))),
  { id: 'maze.select.next', text: 'Сега второто!' },
  { id: 'maze.hint.up', text: 'Горната пътечка води нагоре, към слънцето.' },
  { id: 'maze.hint.down', text: 'Долната пътечка води надолу, към езерцето.' },
  { id: 'maze.hint.in', text: 'В кошничката — вътре в нея.' },
  { id: 'maze.hint.on', text: 'На гъбката — отгоре, на шапчицата.' },
  { id: 'maze.hint.under', text: 'Под гъбката — отдолу, под шапчицата.' },
  { id: 'maze.hint.inside', text: 'Това пиленце вече е вътре. Търсим пиленце отвън.' },
  { id: 'maze.hint.outside', text: 'Търсим пиленцето, което е отвън на оградката.' },
  { id: 'maze.hint.near', text: 'Близкото камъче е точно до зайчето.' },
  { id: 'maze.hint.far', text: 'Далечното камъче е най-далече от зайчето.' },
  { id: 'maze.hint.top', text: 'Горе е над вратата.' },
  { id: 'maze.hint.bottom', text: 'Долу е до тревата, при прага.' },
  // подсказка, второ ниво (след втора грешка): мястото меко светва
  { id: 'maze.hint2.up', text: 'Ето я горната пътечка.' },
  { id: 'maze.hint2.down', text: 'Ето я долната пътечка.' },
  { id: 'maze.hint2.in', text: 'Ето тук — в кошничката.' },
  { id: 'maze.hint2.on', text: 'Ето тук — на гъбката.' },
  { id: 'maze.hint2.under', text: 'Ето тук — под гъбката.' },
  { id: 'maze.hint2.outside', text: 'Ето едно пиленце вън.' },
  { id: 'maze.hint2.near', text: 'Ето близкото камъче.' },
  { id: 'maze.hint2.far', text: 'Ето далечното камъче.' },
  { id: 'maze.hint2.top', text: 'Ето горното място.' },
  { id: 'maze.hint2.bottom', text: 'Ето долното място.' },
  { id: 'maze.retry', text: 'Опитай пак!' },
  // пример преди първата стъпка на всяка мисия — с други предмети, за да не издава отговора
  { id: 'maze.demo.fork', text: 'Виж! Горната пътечка води нагоре, към слънцето. Долната пътечка води надолу, към езерцето.' },
  { id: 'maze.demo.hide', text: 'Виж ябълката! Една е на гъбката, една е под гъбката, а една е в кошничката.' },
  { id: 'maze.demo.chicks', text: 'Виж! Това пиленце е вън от оградката, а това е вътре.' },
  { id: 'maze.demo.stones', text: 'Виж жабката! Листенцето до нея е близо. Листенцето в другия край е далече.' },
  { id: 'maze.demo.door', text: 'Виж дървото! Птичето е горе, а гъбката е долу.' },
  { id: 'maze.demo.go', text: 'Да опитаме!' },
  // меко насочване, ако детето се колебае (без да издава отговора)
  { id: 'maze.nudge', text: 'Докосни едно от светещите места.' },
  { id: 'maze.praise.1', text: 'Браво!' },
  { id: 'maze.praise.2', text: 'Точно така!' },
  { id: 'maze.praise.3', text: 'Зайчето е много доволно!' },
  // преходи между мисиите и завършена мисия
  { id: 'maze.journey.start', text: 'Да тръгваме по приказната пътечка!' },
  { id: 'maze.journey.next', text: 'Зайчето продължава по пътечката.' },
  { id: 'maze.journey.home', text: 'Зайчето бърза към своя дом!' },
  { id: 'maze.journey.resume', text: 'Продължаваме приключението!' },
  { id: 'maze.done.fork', text: 'Зайчето намери пътя!' },
  { id: 'maze.done.hide', text: 'Съкровищата са скрити!' },
  { id: 'maze.done.chicks', text: 'Пиленцата са у дома!' },
  { id: 'maze.done.stones', text: 'Зайчето прескочи поточето!' },
  { id: 'maze.done.door', text: 'Вратата се отваря!' },
  { id: 'maze.star', text: 'Получаваш вълшебна звездичка!' },
  { id: 'maze.star.group', text: 'Получавате вълшебна звездичка!' },
  { id: 'maze.next.child', text: 'Сега е ред на следващото дете.' },
  { id: 'maze.end', text: 'Ура! Зайчето си е у дома, в Морковената градина. Получаваш Златното морковче!' },
  { id: 'maze.end.group', text: 'Ура, деца! Зайчето си е у дома, в Морковената градина. Получавате Златното морковче!' },
]

export const mazeText = (id: string) => MAZE_PHRASES.find((p) => p.id === id)?.text ?? ''

/** Указанието на стъпката: идентификатори на фрази (едно или две изречения). */
export function stepPhrases(step: Step): string[] {
  switch (step.kind) {
    case 'fork':
      return [`maze.fork.${step.target}`]
    case 'hide':
      return [`maze.hide.${step.item}.${step.target}`]
    case 'chicks-in':
      return ['maze.chicks.in']
    case 'chicks-out':
      return ['maze.chicks.out']
    case 'stone':
      return [step.target === 'near' ? 'maze.stone.near' : 'maze.stone.far']
    case 'door':
      return step.seq.map((g) => `maze.door.${g.item}.${g.target}`)
  }
}

/** Текстът на указанието, както се вижда на екрана. */
export function stepText(step: Step): string {
  if (step.kind === 'door' && step.seq.length === 2) {
    const [a, b] = step.seq
    return `Сложи ${GIFT_NAME[a.item]} ${VERT_WORD[a.target]}, а ${GIFT_NAME[b.item]} — ${VERT_WORD[b.target]}.`
  }
  return stepPhrases(step).map(mazeText).join(' ')
}

export const giftName = (g: Gift) => cap(GIFT_NAME[g])
export const treasureName = (t: Treasure) => cap(TREASURE_NAME[t])

// ───────────── състояние ─────────────

export interface MazeState {
  missions: Mission[]
  /** Текуща мисия и стъпка. */
  m: number
  i: number
  /** play — действие; success — стъпката е изпълнена; mission — мисията е завършена (звездичка); done — край. */
  phase: 'play' | 'success' | 'mission' | 'done'
  /** Пиленцата, които са вътре в оградката. */
  inside: ChickId[]
  /** Колко части от двустъпковото указание са изпълнени. */
  part: number
  /** Неуспешни опити в текущата стъпка (за отчета). */
  wrong: number
  /** Неуспешни опити в текущото действие (при двустъпково указание — във всяка част поотделно); определя нивото на подсказката. */
  tries: number
  /**
   * Подсказка на две нива. Ниво 1 (първа грешка): само думи, които обясняват понятието — нищо не светва.
   * Ниво 2 (втора и следваща грешка): правилното място меко светва (target), детето само го докосва.
   */
  hint: Hint | null
  /** Завършени мисии (звездички). */
  stars: number
  firstTry: number
  hinted: number
}

export interface Hint {
  level: 1 | 2
  /** Целта (светва само на ниво 2). */
  target: string
  phrase: string
}

export type MazeAction = { type: 'tap'; target: string; hintsOn: boolean } | { type: 'next' }

export function newGame(missions: Mission[]): MazeState {
  return { missions, m: 0, i: 0, phase: 'play', inside: [], part: 0, wrong: 0, tries: 0, hint: null, stars: 0, firstTry: 0, hinted: 0 }
}

export const currentStep = (s: MazeState): Step => s.missions[s.m].steps[s.i]

/** Пиленцата при втората стъпка: всички вътре, освен избягалото. */
export function chicksInside(s: MazeState): ChickId[] {
  const st = currentStep(s)
  if (st.kind === 'chicks-out') return s.phase === 'play' ? CHICKS.filter((c) => c !== st.target) : CHICKS
  return s.inside
}

/** Подсказка за грешен избор: целта и фразата от първо ниво (обяснява думата). */
function hintBase(step: Step, part: number, tapped: string): { target: string; phrase: string } {
  switch (step.kind) {
    case 'fork':
      return { target: step.target, phrase: `maze.hint.${step.target}` }
    case 'hide':
      return { target: step.target, phrase: `maze.hint.${step.target}` }
    case 'chicks-in':
      return { target: 'outside', phrase: 'maze.hint.inside' }
    case 'chicks-out':
      return { target: step.target, phrase: CHICKS.includes(tapped as ChickId) ? 'maze.hint.inside' : 'maze.hint.outside' }
    case 'stone':
      return { target: step.target, phrase: `maze.hint.${step.target}` }
    case 'door': {
      const t = step.seq[part].target
      return { target: t, phrase: t === 'up' ? 'maze.hint.top' : 'maze.hint.bottom' }
    }
  }
}

/** Подсказка според поредната грешка в текущото действие: първата — само думи; втората и следващите — и светване. */
export function hintFor(step: Step, part: number, tapped: string, tries: number): Hint {
  const b = hintBase(step, part, tapped)
  if (tries < 2) return { level: 1, ...b }
  // второ ниво: за „пиленце вътре“ при прибирането — пак „търсим отвън“
  const key = b.phrase.replace('maze.hint.', '')
  const second = key === 'inside' ? 'outside' : key
  return { level: 2, target: b.target, phrase: `maze.hint2.${second}` }
}

const finishStep = (s: MazeState, hintsOn: boolean): MazeState => ({
  ...s,
  phase: 'success',
  hint: null,
  firstTry: s.firstTry + (s.wrong === 0 ? 1 : 0),
  hinted: s.hinted + (s.wrong > 0 && hintsOn ? 1 : 0),
})

export function mazeReducer(s: MazeState, a: MazeAction): MazeState {
  switch (a.type) {
    case 'tap': {
      if (s.phase !== 'play') return s
      const step = currentStep(s)
      const miss = (): MazeState => {
        const tries = s.tries + 1
        return { ...s, wrong: s.wrong + 1, tries, hint: a.hintsOn ? hintFor(step, s.part, a.target, tries) : null }
      }
      switch (step.kind) {
        case 'fork':
        case 'hide':
        case 'chicks-out':
        case 'stone':
          return a.target === step.target ? finishStep(s, a.hintsOn) : miss()
        case 'chicks-in': {
          const c = a.target as ChickId
          if (!CHICKS.includes(c)) return s
          if (s.inside.includes(c)) return miss()
          const inside = [...s.inside, c]
          const next = { ...s, inside, hint: null, tries: 0 }
          return inside.length === CHICKS.length ? finishStep(next, a.hintsOn) : next
        }
        case 'door': {
          if (a.target !== step.seq[s.part].target) return miss()
          const part = s.part + 1
          return part === step.seq.length ? finishStep({ ...s, part }, a.hintsOn) : { ...s, part, hint: null, tries: 0 }
        }
      }
      return s
    }
    case 'next': {
      if (s.phase === 'success') {
        const lastStep = s.i === s.missions[s.m].steps.length - 1
        if (lastStep) return { ...s, phase: 'mission', stars: s.stars + 1 }
        return { ...s, i: s.i + 1, phase: 'play', part: 0, wrong: 0, tries: 0, hint: null }
      }
      if (s.phase === 'mission') {
        if (s.m === s.missions.length - 1) return { ...s, phase: 'done' }
        return { ...s, m: s.m + 1, i: 0, phase: 'play', part: 0, wrong: 0, tries: 0, hint: null, inside: [] }
      }
      return s
    }
  }
}

// ───────────── запазен напредък ─────────────

/**
 * Проверява запазено (недовършено) приключение, преди да се продължи. Връща състоянието, готово за игра,
 * или null, ако записът е непълен, повреден или приключението вече е завършено.
 * Подсказката не се пази, а двустъпковото указание на вратата започва от първата част; звездичките остават.
 */
export function restoreGame(raw: unknown): MazeState | null {
  if (!raw || typeof raw !== 'object') return null
  const s = raw as Partial<MazeState>
  const ids: MissionId[] = ['fork', 'hide', 'chicks', 'stones', 'door']
  if (!Array.isArray(s.missions) || s.missions.length !== ids.length) return null
  if (!s.missions.every((m, k) => m && m.id === ids[k] && Array.isArray(m.steps) && m.steps.length > 0)) return null
  const int = (v: unknown, lo: number, hi: number) => typeof v === 'number' && Number.isInteger(v) && v >= lo && v <= hi
  if (!int(s.m, 0, ids.length - 1) || !int(s.i, 0, s.missions[s.m!].steps.length - 1)) return null
  if (!int(s.stars, 0, ids.length) || !int(s.firstTry, 0, 99) || !int(s.hinted, 0, 99)) return null
  if (s.phase !== 'play' && s.phase !== 'success' && s.phase !== 'mission') return null
  // звездичките отговарят на завършените мисии
  if (s.stars !== s.m! + (s.phase === 'mission' ? 1 : 0)) return null
  const inside = Array.isArray(s.inside) ? CHICKS.filter((c) => s.inside!.includes(c)) : []
  // грешките в текущата стъпка се пазят (за честен брой „от първия път“); подсказката — не
  const wrong = int(s.wrong, 0, 99) ? s.wrong! : 0
  return { ...(s as MazeState), inside, wrong, tries: 0, hint: null, part: s.phase === 'play' ? 0 : (s.part ?? 0) }
}

// ───────────── разположение в мисия 4 (в проектното поле 1000×700) ─────────────

const ROWS = [650, 470, 300, 150]
const clampX = (x: number) => Math.max(160, Math.min(840, x))
type Pt = { x: number; y: number }
const dist = (a: Pt, b: Pt) => Math.hypot(a.x - b.x, a.y - b.y)
/** Места, където може да е далечното камъче (ъглите и средата на поточето). */
const FAR_SPOTS: Pt[] = [160, 500, 840].flatMap((x) => [150, 560].map((y) => ({ x, y })))

/** Близкото камъче: от предпочитаната страна, а ако там е ръбът — от другата. */
function nearSpot(bx: number, dx: number, y: number, side: 'left' | 'right'): Pt {
  const dir = side === 'left' ? -1 : 1
  const x = clampX(bx + dir * dx)
  return Math.abs(x - bx) >= dx * 0.8 ? { x, y } : { x: clampX(bx - dir * dx), y }
}

/** Местата на зайчето и камъчетата за всяка стъпка от мисията. */
export function stonesLayout(steps: Extract<Step, { kind: 'stone' }>[]) {
  let bx = 500
  return steps.map((st, j) => {
    const bunny = { x: bx, y: ROWS[Math.min(j, 3)] }
    const near = st.target === 'near' ? nearSpot(bx, 190, ROWS[j + 1], st.side) : nearSpot(bx, 230, bunny.y, st.side)
    // далечното: най-отдалеченото от зайчето свободно място (не до близкото и не там, където е зайчето)
    const far = FAR_SPOTS.filter((p) => dist(p, near) > 260 && dist(p, bunny) > 100).reduce((a, b) => (dist(b, bunny) > dist(a, bunny) ? b : a))
    const after = st.target === 'near' ? near : { x: bx, y: 40 }
    if (st.target === 'near') bx = near.x
    return { bunny, near, far, after }
  })
}

/** Детерминиран генератор (за тестове и съпоставими снимки). */
export function seeded(seed: number): Rng {
  let x = seed % 2147483647 || 1
  return () => (x = (x * 16807) % 2147483647) / 2147483647
}
