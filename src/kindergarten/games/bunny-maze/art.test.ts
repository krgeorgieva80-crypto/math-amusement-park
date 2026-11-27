/// <reference types="node" />
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { MAZE_ART } from './art'

const DIR = join(process.cwd(), 'public/kg/art/bunny-maze')

/** Размер на WebP файл (VP8 / VP8L / VP8X) без външни библиотеки. */
function webpSize(buf: Buffer): [number, number] {
  const kind = buf.toString('ascii', 12, 16)
  if (kind === 'VP8X') return [1 + buf.readUIntLE(24, 3), 1 + buf.readUIntLE(27, 3)]
  if (kind === 'VP8L') {
    const b = buf.readUInt32LE(21)
    return [1 + (b & 0x3fff), 1 + ((b >> 14) & 0x3fff)]
  }
  return [buf.readUInt16LE(26) & 0x3fff, buf.readUInt16LE(28) & 0x3fff]
}

describe('„Приказният лабиринт“: художествени ресурси', () => {
  const manifest = JSON.parse(readFileSync(join(DIR, 'manifest.json'), 'utf8')) as { files: Record<string, string> }

  it('каталогът е без повторения: 26 основни (с дома) + 6 допълнителни', () => {
    const names = MAZE_ART.map((r) => r.name)
    expect(new Set(names).size).toBe(names.length)
    expect(MAZE_ART.filter((r) => r.core).length).toBe(26)
    expect(MAZE_ART.filter((r) => !r.core).length).toBe(6)
  })

  it('всеки файл в манифеста е в каталога, с вярно съотношение', () => {
    for (const [name, file] of Object.entries(manifest.files)) {
      const r = MAZE_ART.find((x) => x.name === name)
      expect(r, name).toBeDefined()
      const [w, h] = webpSize(readFileSync(join(DIR, file)))
      expect(r!.aspect, name).toBeCloseTo(w / h, 2)
    }
  })

  it('готовите ресурси (с размер в каталога) са в манифеста', () => {
    for (const r of MAZE_ART.filter((x) => x.aspect > 0)) expect(manifest.files[r.name], r.name).toBeTruthy()
  })
})
