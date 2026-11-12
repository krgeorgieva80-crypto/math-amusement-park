import { describe, expect, it } from 'vitest'
import { KG_ATTRACTIONS } from '../curriculum/structure'
import { allPhrases } from './phrases'

describe('Гласови фрази', () => {
  it('уникални идентификатори и непразни текстове', () => {
    const all = allPhrases()
    expect(new Set(all.map((p) => p.id)).size).toBe(all.length)
    for (const p of all) expect(p.text.trim().length).toBeGreaterThan(1)
  })
  it('представяне за всяка атракция', () => {
    const ids = allPhrases().map((p) => p.id)
    for (const a of KG_ATTRACTIONS) expect(ids).toContain(`kg.attr.${a.id}`)
  })
})
