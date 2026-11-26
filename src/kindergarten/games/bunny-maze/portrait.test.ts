import { describe, expect, it } from 'vitest'
import { stonesLayout, type Step } from './logic'
import { PW, isPhonePortrait, stonePortrait } from './portrait'

const dist = (a: { x: number; y: number }, b: { x: number; y: number }) => Math.hypot(a.x - b.x, a.y - b.y)

describe('„Приказният лабиринт“ на вертикален телефон', () => {
  it('отделното поле е само за телефон вертикално (мястото за сцената)', () => {
    // размери в единиците на сцената (както ги мери играта)
    expect(isPhonePortrait({ w: 876, h: 1667 })).toBe(true) // 390×844
    expect(isPhonePortrait({ w: 876, h: 1707 })).toBe(true) // 360×800
    expect(isPhonePortrait({ w: 876, h: 1318 })).toBe(true) // 375×667
    expect(isPhonePortrait({ w: 876, h: 982 })).toBe(false) // таблет вертикално 768×1024
    expect(isPhonePortrait({ w: 876, h: 1222 })).toBe(false) // малък таблет 600×960
    expect(isPhonePortrait({ w: 1004, h: 600 })).toBe(false) // таблет хоризонтално
    expect(isPhonePortrait({ w: 834, h: 270 })).toBe(false) // телефон хоризонтално
    expect(isPhonePortrait({ w: 1260, h: 640 })).toBe(false) // компютър
  })

  it('мисия 4: при всички варианти „далечното“ е ясно по-далече, зоните не се застъпват и всичко е в полето', () => {
    for (let b = 0; b < 16; b++) {
      const steps = [0, 1, 2, 3].map((j) => ({ kind: 'stone', target: j < 3 ? 'near' : 'far', side: b & (1 << j) ? 'left' : 'right' })) as Extract<Step, { kind: 'stone' }>[]
      for (const L of stonesLayout(steps)) {
        const [bunny, near, far, after] = [L.bunny, L.near, L.far, L.after].map(stonePortrait)
        // зоните са с радиус 118 — между близкото и далечното има поне два радиуса
        expect(dist(near, far)).toBeGreaterThanOrEqual(236)
        expect(dist(far, bunny) / dist(near, bunny)).toBeGreaterThanOrEqual(1.5)
        // камъчето е широко ≈ 183: изцяло в полето
        for (const p of [near, far, bunny, after]) {
          expect(p.x - 92).toBeGreaterThanOrEqual(0)
          expect(p.x + 92).toBeLessThanOrEqual(PW)
        }
        // зайчето (≈ 157 високо) не излиза над полето
        expect(after.y - 26 - 157).toBeGreaterThanOrEqual(0)
      }
    }
  })
})
