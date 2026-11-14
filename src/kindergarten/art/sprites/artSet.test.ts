import { describe, expect, it } from 'vitest'
import { BOOTS_ART, bootsArtNames } from '../../games/giant-boots/art'
import { heroFallbackChain } from '../../games/giant-boots/BootsSprites'
import { loadArtSet, makeArtSet } from './artSet'

describe('Художествена система', () => {
  it('ресурс без файл → резервна рисунка (null)', () => {
    const s = makeArtSet('/kg/art/x', { files: { 'giant-happy': 'giant-happy.webp' } })
    expect(s.url('giant-happy')).toBe('/kg/art/x/giant-happy.webp')
    expect(s.url('giant-idle')).toBeNull()
    expect(s.has('giant-happy')).toBe(true)
    expect(s.count).toBe(1)
  })

  it('липсващ или повреден манифест не е грешка', async () => {
    const a = await loadArtSet('t1', async () => null)
    expect(a.count).toBe(0)
    const b = await loadArtSet('t2', async () => {
      throw new Error('мрежа')
    })
    expect(b.url('x')).toBeNull()
  })

  it('„Големи и малки ботуши“: пълният списък с ресурси', () => {
    const names = bootsArtNames()
    expect(new Set(names).size).toBe(names.length)
    // 2 фона + 5 + 5 състояния на героите + 24 предмета + 4 обзавеждане + 2 ефекта
    expect(names.length).toBe(2 + 10 + 24 + 4 + 2)
    for (const k of ['boot', 'winter-boot', 'hat', 'mitten']) for (const c of ['red', 'blue', 'yellow', 'green', 'purple', 'orange']) expect(names).toContain(`${k}-${c}`)
    for (const h of ['giant', 'dwarf']) for (const st of ['idle', 'hopeful', 'happy', 'blink', 'boots']) expect(names).toContain(`${h}-${st}`)
    for (const r of BOOTS_ART) expect(r.size).toMatch(/^\d+×\d+$/)
  })

  it('героят не сменя стила: липсващо състояние → най-близката рисувана поза', () => {
    expect(heroFallbackChain('hopeful')).toEqual(['hopeful', 'idle'])
    expect(heroFallbackChain('blink')).toEqual(['blink', 'idle'])
    expect(heroFallbackChain('boots')).toEqual(['boots', 'happy', 'idle'])
    const set = makeArtSet('/a', { files: { 'giant-idle': 'giant-idle.webp' } })
    const pick = (st: Parameters<typeof heroFallbackChain>[0]) =>
      heroFallbackChain(st)
        .map((x) => `giant-${x}`)
        .find((n) => set.has(n))
    for (const st of ['idle', 'hopeful', 'happy', 'blink', 'boots'] as const) expect(pick(st)).toBe('giant-idle')
  })
})
