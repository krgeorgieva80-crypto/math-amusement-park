import { describe, expect, it } from 'vitest'
import { CY, R, VB_H, VB_W, CX, cabinHitBox, cabinSize, kidLayout } from './wheelGeometry'

describe('геометрия на колелото', () => {
  for (let n = 2; n <= 10; n++) {
    it(`${n} кабинки: равномерно разположени, без застъпване, в рамките на рисунката`, () => {
      const boxes = Array.from({ length: n }, (_, i) => cabinHitBox(i, n))
      for (let i = 0; i < n; i++)
        for (let j = i + 1; j < n; j++) {
          const a = boxes[i]
          const b = boxes[j]
          const overlap = Math.min(a.right, b.right) > Math.max(a.left, b.left) && Math.min(a.bottom, b.bottom) > Math.max(a.top, b.top)
          expect(overlap, `кабинки ${i + 1} и ${j + 1}`).toBe(false)
        }
      for (const b of boxes) {
        expect(CX + b.left).toBeGreaterThanOrEqual(0)
        expect(CX + b.right).toBeLessThanOrEqual(VB_W)
        expect(CY + b.top).toBeGreaterThanOrEqual(0)
        expect(CY + b.bottom).toBeLessThanOrEqual(VB_H)
      }
      // активната зона е достатъчно голяма за докосване (≥ 110 единици ≈ 70 px на дъска 16:9)
      const { w, h } = cabinSize(n)
      expect(Math.min(w * 1.08, h * 1.05)).toBeGreaterThanOrEqual(110)
      expect(R).toBeGreaterThan(0)
    })
  }

  it('броят на нарисуваните деца винаги е равен на стойността', () => {
    for (let n = 2; n <= 10; n++) {
      const { w, h } = cabinSize(n)
      for (let c = 0; c <= 10; c++) {
        const kids = kidLayout(c, w, h)
        expect(kids).toHaveLength(c)
        // всички деца са в кабинката, главите им не са под покривчето, не се покриват изцяло
        for (const k of kids) {
          expect(Math.abs(k.x) + k.s * 0.46).toBeLessThanOrEqual(w * 0.5 + 0.5)
          expect(k.y - k.s * 1.03).toBeGreaterThanOrEqual(h * 0.2 - 0.5)
        }
        const sameRow = (y: number) => kids.filter((k) => k.y === y).map((k) => k.x).sort((a, b) => a - b)
        for (const y of new Set(kids.map((k) => k.y))) {
          const xs = sameRow(y)
          for (let i = 1; i < xs.length; i++) expect(xs[i] - xs[i - 1]).toBeGreaterThan(kids[0].s * 0.6) // главите са отделни
        }
      }
    }
  })
})
