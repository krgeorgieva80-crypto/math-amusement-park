import { describe, expect, it } from 'vitest'
import { stonesLayout, type Step } from './logic'
import { PW, isPhonePortrait, stonePortrait } from './portrait'

const dist = (a: { x: number; y: number }, b: { x: number; y: number }) => Math.hypot(a.x - b.x, a.y - b.y)

describe('„Приказният лабиринт“ на вертикален телефон', () => {
  it('отделното поле е само за телефон вертикално (по размерите на сцената на играта)', () => {
    // сцената на играта: вертикално ширина 900, височина 1200–2000 според екрана (core/Stage.tsx)
    const stage = (vw: number, vh: number) => (vh > vw ? { w: 900, h: Math.round(Math.min(2000, Math.max(1200, 900 / (vw / vh)))) } : { w: Math.round(Math.min(2100, Math.max(1200, 900 * (vw / vh)))), h: 900 })
    for (const [vw, vh] of [[390, 844], [360, 800], [375, 667], [412, 915], [430, 932]]) expect(isPhonePortrait(stage(vw, vh)), `${vw}×${vh}`).toBe(true)
    for (const [vw, vh] of [[768, 1024], [800, 1280], [600, 960], [1024, 768], [844, 390], [1280, 800], [1920, 1080]]) expect(isPhonePortrait(stage(vw, vh)), `${vw}×${vh}`).toBe(false)
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
