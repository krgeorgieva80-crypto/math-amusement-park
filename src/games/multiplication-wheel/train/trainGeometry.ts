/**
 * Геометрия на „Веселото влакче“ (чист TypeScript).
 * Локомотивът е отляво и гледа наляво; вагончетата се нареждат след него.
 * При повече вагончета релсите правят завой и влакчето се връща на следващ
 * ред („змийка“), така че номерата 1, 2, 3, … следват релсите без прекъсване.
 */
export const CAR_W = 230
export const CAR_H = 210
export const GAP = 18
export const LOCO_W = 262
/** Разстояние между редовете (вагонче + релси + място за значката с натрупването). */
export const ROW_H = 300
export const PAD = 24
/** Място над първия ред за значките с натрупването и пушека. */
export const TOP = 70
/** Ширина на завоя на релсите. */
export const TURN = 78
export const RAIL_DY = CAR_H + 10

export interface CarPos {
  /** Горен ляв ъгъл на вагончето. */
  x: number
  y: number
  row: number
  col: number
}

export interface TrainLayout {
  width: number
  height: number
  rows: number[]
  perRow: number
  cars: CarPos[]
  /** Релси за всеки ред: от x1 до x2 на височина y. */
  rails: { x1: number; x2: number; y: number }[]
  /** Завои между редовете: от (x, y1) до (x, y2), side = 1 вдясно, −1 вляво. */
  turns: { x: number; y1: number; y2: number; side: 1 | -1 }[]
  loco: { x: number; y: number }
}

/** Разпределение по редове: най-много perRow в ред, редовете — възможно най-равни. */
export function trainRows(n: number, perRow: number): number[] {
  if (n <= 0) return []
  const rows = Math.ceil(n / Math.max(1, perRow))
  const each = Math.ceil(n / rows)
  return Array.from({ length: rows }, (_, r) => Math.min(each, n - r * each)).filter((c) => c > 0)
}

/**
 * Колко вагончета на ред: подредбата, при която рисунката е най-едра в
 * наличното място. По-малко редове се предпочитат при почти еднакъв размер,
 * за да изглежда влакчето като дълга композиция.
 */
export function bestPerRow(n: number, availW: number, availH: number): number {
  let best = n
  let bestScale = 0
  for (let per = n; per >= Math.min(2, n); per--) {
    const rows = trainRows(n, per).length
    if (rows > 4) break
    const L = trainLayout(n, per)
    const sc = Math.min(availW / L.width, availH / L.height)
    if (sc > bestScale * 1.12) {
      best = per
      bestScale = sc
    }
  }
  return best
}

const colX = (col: number) => PAD + LOCO_W + GAP + col * (CAR_W + GAP)

export function trainLayout(n: number, perRow: number): TrainLayout {
  const rows = trainRows(n, perRow)
  const cols = Math.max(1, ...rows)
  const multi = rows.length > 1
  const width = colX(cols) + (multi ? TURN : 0) + PAD - GAP
  const height = TOP + rows.length * ROW_H - (ROW_H - CAR_H) + 40
  const cars: CarPos[] = []
  const rails: TrainLayout['rails'] = []
  const turns: TrainLayout['turns'] = []
  rows.forEach((count, r) => {
    const y = TOP + r * ROW_H
    // редовете се редуват: нечетните вървят отдясно наляво
    for (let k = 0; k < count; k++) {
      const col = r % 2 === 0 ? k : cols - 1 - k
      cars.push({ x: colX(col), y, row: r, col })
    }
    const left = colX(0) - GAP
    const right = colX(cols) - GAP
    const mine = cars.filter((c) => c.row === r)
    let x1 = r === 0 ? PAD : Math.min(...mine.map((c) => c.x)) - GAP / 2
    let x2 = Math.max(...mine.map((c) => c.x + CAR_W)) + GAP / 2
    // релсите стигат до завоите преди и след реда
    const sides = [r > 0 ? ((r - 1) % 2 === 0 ? 1 : -1) : 0, r < rows.length - 1 ? (r % 2 === 0 ? 1 : -1) : 0]
    if (sides.includes(1)) x2 = right
    if (sides.includes(-1)) x1 = left
    rails.push({ x1, x2, y: y + RAIL_DY })
    if (r < rows.length - 1) {
      const side = r % 2 === 0 ? 1 : -1
      turns.push({ x: side === 1 ? right : left, y1: y + RAIL_DY, y2: y + ROW_H + RAIL_DY, side })
    }
  })
  return { width, height, rows, perRow: cols, cars, rails, turns, loco: { x: PAD, y: TOP } }
}

/**
 * Децата във вагонче: до 5 в един ред, повече — в два реда (задният е по-висок).
 * (x, y) е долната среда на всяко дете спрямо горния ляв ъгъл на вагончето, s — ширината му.
 */
export function carKids(count: number, w = CAR_W, h = CAR_H): { x: number; y: number; s: number }[] {
  if (count <= 0) return []
  const two = count > 5
  const front = two ? Math.ceil(count / 2) : count
  const back = count - front
  const s = Math.min((w * 0.84) / Math.max(1, front * 0.82), h * (two ? 0.3 : 0.4))
  const baseY = h * 0.66
  const out: { x: number; y: number; s: number }[] = []
  const place = (k: number, y: number, sz: number) => {
    for (let j = 0; j < k; j++) out.push({ x: w / 2 + (j - (k - 1) / 2) * sz * 0.82, y, s: sz })
  }
  // задният ред се рисува първи (отзад), предният — пред него
  if (back) place(back, baseY - s * 0.45, s * 0.92)
  place(front, baseY, s)
  return out
}
