/** Геометрия на колелото (единици на viewBox) — без React, за тестове. */
// Геометрия в единиците на viewBox
export const VB_W = 1000
export const VB_H = 1050
export const CX = 500
export const CY = 430
export const R = 322

/** Активната зона на кабинка с ширина w (правоъгълник спрямо центъра на колелото). */
function boxAt(i: number, n: number, w: number) {
  const h = w * 0.86
  const a = (i * 2 * Math.PI) / n - Math.PI / 2
  const x = R * Math.cos(a)
  const y = R * Math.sin(a)
  return { left: x - w * 0.54, right: x + w * 0.54, top: y - h * 0.02, bottom: y + h * 1.03 }
}

function overlaps(n: number, w: number): boolean {
  const b = Array.from({ length: n }, (_, i) => boxAt(i, n, w))
  for (let i = 0; i < n; i++)
    for (let j = i + 1; j < n; j++)
      if (Math.min(b[i].right, b[j].right) > Math.max(b[i].left, b[j].left) && Math.min(b[i].bottom, b[j].bottom) > Math.max(b[i].top, b[j].top)) return true
  return false
}

const sizeCache = new Map<number, { w: number; h: number }>()

/**
 * Размер на кабинка за n кабинки: най-голямата ширина (до 310), при която
 * активните зони на всички кабинки не се застъпват.
 */
export function cabinSize(n: number): { w: number; h: number } {
  const cached = sizeCache.get(n)
  if (cached) return cached
  let w = 310
  while (w > 60 && overlaps(n, w)) w -= 2
  const r = { w, h: w * 0.86 }
  sizeCache.set(n, r)
  return r
}

/**
 * Подреждане на децата: до 5 в един ред, повече — в два реда (задният
 * е малко по-високо и по-малък), така че всяко дете остава видимо.
 */
export function kidLayout(count: number, w: number, h: number): { x: number; y: number; s: number }[] {
  if (count === 0) return []
  const rows = count <= 5 ? 1 : 2
  const front = rows === 1 ? count : Math.ceil(count / 2)
  const back = count - front
  const inner = w * 0.86
  // децата седят рамо до рамо (стъпка 0.82 от ширината) — главите остават отделни
  const s = Math.min(inner / (Math.max(front, 1) * 0.82), h * (rows === 1 ? 0.43 : 0.32))
  const baseY = h * 0.68
  const out: { x: number; y: number; s: number }[] = []
  const place = (n: number, y: number, sz: number, offset: number) => {
    for (let k = 0; k < n; k++) out.push({ x: (k - (n - 1) / 2) * sz * 0.82 + offset, y, s: sz })
  }
  // задният ред първо (рисува се отзад), после предният
  if (back) place(back, baseY - s * 0.42, s * 0.92, back < front ? 0 : s * 0.2)
  place(front, baseY, s, 0)
  return out
}


/** Активната зона на кабинка i (правоъгълник във viewBox), спрямо центъра на колелото. */
export function cabinHitBox(i: number, n: number) {
  return boxAt(i, n, cabinSize(n).w)
}
