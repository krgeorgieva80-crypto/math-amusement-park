import { describe, expect, it } from 'vitest'
import { CHICKS, MAZE_PHRASES, MISSIONS, chicksInside, currentStep, makeAdventure, mazeReducer, mazeText, newGame, restoreGame, seeded, stepPhrases, stepText, stonesLayout, totalSteps, type MazeState, type Step } from './logic'

const H = true
const tap = (s: MazeState, target: string, hintsOn = H) => mazeReducer(s, { type: 'tap', target, hintsOn })
const next = (s: MazeState) => mazeReducer(s, { type: 'next' })

/** Верният отговор за текущата стъпка (за пиленцата — първото пиленце отвън). */
function correct(s: MazeState): string {
  const st = currentStep(s)
  switch (st.kind) {
    case 'fork':
    case 'hide':
    case 'chicks-out':
    case 'stone':
      return st.target
    case 'chicks-in':
      return CHICKS.find((c) => !s.inside.includes(c))!
    case 'door':
      return st.seq[s.part].target
  }
}
function wrongFor(s: MazeState): string {
  const st = currentStep(s)
  switch (st.kind) {
    case 'fork':
      return st.target === 'up' ? 'down' : 'up'
    case 'hide':
      return st.target === 'in' ? 'on' : 'in'
    case 'chicks-out':
      return CHICKS.find((c) => c !== st.target)!
    case 'stone':
      return st.target === 'near' ? 'far' : 'near'
    case 'chicks-in':
      return s.inside[0] ?? 'nobody'
    case 'door':
      return st.seq[s.part].target === 'up' ? 'down' : 'up'
  }
}

/** Изиграва цялото приключение; при wrongFirst — по един грешен опит преди всеки верен. */
function playAll(seed: number, wrongFirst = false): MazeState {
  let s = newGame(makeAdventure(seeded(seed)))
  for (let guard = 0; guard < 200 && s.phase !== 'done'; guard++) {
    if (s.phase === 'play') {
      // при пиленцата грешка е възможна едва когато вече има пиленце вътре
      if (wrongFirst && s.wrong === 0 && !(currentStep(s).kind === 'chicks-in' && s.inside.length === 0)) s = tap(s, wrongFor(s))
      s = tap(s, correct(s))
    } else s = next(s)
  }
  return s
}

describe('„Зайчето в лабиринта“ — приключението', () => {
  it('пет мисии в постоянен ред, с постепенно усложняване', () => {
    for (let seed = 1; seed < 200; seed++) {
      const ms = makeAdventure(seeded(seed))
      expect(ms.map((m) => m.id)).toEqual(MISSIONS)
      const [fork, hide, chicks, stones, door] = ms
      // 1: три разклона, и горе, и долу
      expect(fork.steps).toHaveLength(3)
      const dirs = fork.steps.map((s) => (s as Extract<Step, { kind: 'fork' }>).target)
      expect(dirs).toContain('up')
      expect(dirs).toContain('down')
      // 2: в, на, под — по веднъж, с различни съкровища
      const hs = hide.steps as Extract<Step, { kind: 'hide' }>[]
      expect(new Set(hs.map((x) => x.target))).toEqual(new Set(['in', 'on', 'under']))
      expect(new Set(hs.map((x) => x.item)).size).toBe(3)
      // 3: прибиране и разпознаване
      expect(chicks.steps.map((x) => x.kind)).toEqual(['chicks-in', 'chicks-out'])
      // 4: три пъти близо, накрая далече
      expect(stones.steps.map((x) => (x as Extract<Step, { kind: 'stone' }>).target)).toEqual(['near', 'near', 'near', 'far'])
      // 5: една, една, после двустъпково указание с горе и долу
      const ds = door.steps as Extract<Step, { kind: 'door' }>[]
      expect(ds.map((d) => d.seq.length)).toEqual([1, 1, 2])
      expect(new Set(ds[2].seq.map((g) => g.target))).toEqual(new Set(['up', 'down']))
      expect(new Set(ds.flatMap((d) => d.seq.map((g) => g.item))).size).toBe(4)
      expect(totalSteps(ms)).toBe(15)
    }
  })

  it('цялото приключение се изиграва до край: 5 звездички, всички стъпки от първия опит', () => {
    const s = playAll(7)
    expect(s.phase).toBe('done')
    expect(s.stars).toBe(5)
    expect(s.firstTry).toBe(15)
    expect(s.hinted).toBe(0)
  })

  it('грешен избор: без наказание — стъпката продължава, показва се подсказка и се отчита', () => {
    const s = playAll(11, true)
    expect(s.phase).toBe('done')
    expect(s.stars).toBe(5)
    expect(s.firstTry).toBe(0)
    expect(s.hinted).toBe(15)
  })

  it('подсказката сочи вярната цел и е с подходяща фраза', () => {
    let s = newGame(makeAdventure(seeded(3)))
    const st = currentStep(s) as Extract<Step, { kind: 'fork' }>
    s = tap(s, st.target === 'up' ? 'down' : 'up')
    expect(s.phase).toBe('play')
    expect(s.hint).toEqual({ target: st.target, phrase: `maze.hint.${st.target}` })
    expect(mazeText(s.hint!.phrase).length).toBeGreaterThan(5)
    // без подсказки — само нов опит
    const off = tap(newGame(makeAdventure(seeded(3))), st.target === 'up' ? 'down' : 'up', false)
    expect(off.hint).toBeNull()
    expect(off.wrong).toBe(1)
  })

  it('пиленцата: всяко пиленце отвън влиза; пиленце отвътре е грешка; накрая всички са вътре', () => {
    let s = newGame(makeAdventure(seeded(5)))
    while (s.missions[s.m].id !== 'chicks') s = s.phase === 'play' ? tap(s, correct(s)) : next(s)
    expect(chicksInside(s)).toEqual([])
    s = tap(s, 'c2')
    expect(chicksInside(s)).toEqual(['c2'])
    s = tap(s, 'c2')
    expect(s.wrong).toBe(1)
    expect(s.hint?.phrase).toBe('maze.hint.inside')
    s = tap(tap(s, 'c1'), 'c3')
    expect(s.phase).toBe('success')
    s = next(s)
    const out = (currentStep(s) as Extract<Step, { kind: 'chicks-out' }>).target
    expect(chicksInside(s)).toHaveLength(2)
    expect(chicksInside(s)).not.toContain(out)
    s = tap(s, out)
    expect(chicksInside(s)).toEqual(CHICKS)
  })

  it('двустъпковото указание изисква и двете части в реда', () => {
    let s = newGame(makeAdventure(seeded(9)))
    while (!(currentStep(s).kind === 'door' && (currentStep(s) as Extract<Step, { kind: 'door' }>).seq.length === 2 && s.phase === 'play')) s = s.phase === 'play' ? tap(s, correct(s)) : next(s)
    const st = currentStep(s) as Extract<Step, { kind: 'door' }>
    s = tap(s, st.seq[0].target)
    expect(s.part).toBe(1)
    expect(s.phase).toBe('play')
    s = tap(s, st.seq[0].target) // същото място пак — грешка за втората част
    expect(s.wrong).toBe(1)
    expect(s.part).toBe(1)
    s = tap(s, st.seq[1].target)
    expect(s.phase).toBe('success')
    expect(stepText(st)).toMatch(/^Сложи .+ (горе|долу), а .+ — (горе|долу)\.$/)
  })

  it('действия извън хода на играта не променят състоянието', () => {
    const s0 = newGame(makeAdventure(seeded(2)))
    expect(next(s0)).toBe(s0)
    const s1 = tap(s0, correct(s0))
    expect(tap(s1, 'up')).toBe(s1)
  })

  it('всяко указание има записваема фраза; фразите са уникални', () => {
    const ids = new Set(MAZE_PHRASES.map((p) => p.id))
    expect(ids.size).toBe(MAZE_PHRASES.length)
    for (let seed = 1; seed < 60; seed++)
      for (const m of makeAdventure(seeded(seed)))
        for (const st of m.steps) {
          for (const id of stepPhrases(st)) expect(ids).toContain(id)
          expect(stepText(st).length).toBeGreaterThan(10)
        }
    for (const m of MISSIONS) expect(ids).toContain(`maze.intro.${m}`)
    for (const p of MAZE_PHRASES) if (p.id.startsWith('maze.hint.')) expect(p.text.length).toBeGreaterThan(8)
  })

  it('камъчетата: близкото е ясно по-близо до зайчето от далечното (поне 1,6 пъти)', () => {
    const d = (a: { x: number; y: number }, b: { x: number; y: number }) => Math.hypot(a.x - b.x, a.y - b.y)
    for (let seed = 1; seed < 300; seed++) {
      const steps = makeAdventure(seeded(seed))[3].steps as Extract<Step, { kind: 'stone' }>[]
      const lay = stonesLayout(steps)
      lay.forEach((l, j) => {
        expect(d(l.far, l.bunny)).toBeGreaterThan(1.6 * d(l.near, l.bunny))
        expect(d(l.near, l.far)).toBeGreaterThan(240) // зоните (r = 118) не се застъпват
        if (j > 0) expect(l.bunny).toEqual(lay[j - 1].after)
      })
    }
  })

  it('запазен напредък: продължава от същата мисия със звездичките; повреден запис се отхвърля', () => {
    let s = newGame(makeAdventure(seeded(7)))
    // мисия 1 докрай → празнуване (звездичка) → мисия 2
    while (s.phase !== 'mission') s = s.phase === 'play' ? tap(s, correct(s)) : next(s)
    const atReward = JSON.parse(JSON.stringify(s))
    const r1 = restoreGame(atReward)!
    expect(r1.phase).toBe('mission')
    expect(r1.stars).toBe(1)
    expect(next(r1).m).toBe(1) // не повтаря мисия 1
    s = next(s)
    s = tap(s, ['in', 'on', 'under'].find((x) => x !== correct(s))!) // грешка
    const r2 = restoreGame(JSON.parse(JSON.stringify(s)))!
    expect([r2.m, r2.i, r2.phase, r2.stars, r2.wrong, r2.hint]).toEqual([1, 0, 'play', 1, 1, null])
    // приключението се довършва от записа
    let z = r2
    for (let g = 0; g < 200 && z.phase !== 'done'; g++) z = z.phase === 'play' ? tap(z, correct(z)) : next(z)
    expect(z.phase).toBe('done')
    expect(z.stars).toBe(5)
    // повредени или завършени записи
    expect(restoreGame(null)).toBeNull()
    expect(restoreGame({ ...atReward, stars: 3 })).toBeNull()
    expect(restoreGame({ ...atReward, m: 9 })).toBeNull()
    expect(restoreGame({ ...atReward, phase: 'done' })).toBeNull()
    expect(restoreGame({ ...atReward, missions: atReward.missions.slice(1) })).toBeNull()
  })
})
