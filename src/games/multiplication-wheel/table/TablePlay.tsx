import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { useApp } from '../../../core/AppContext'
import { useStage } from '../../../core/Stage'
import { Mascot, type MascotMood } from '../../../components/art/Mascot'
import { Confetti, StarRow } from '../../../components/ui/Effects'
import { GameButton } from '../../../components/ui/GameButton'
import { GradeTicket } from '../../../components/ui/GradeTicket'
import { Icon } from '../../../components/ui/Icon'
import { SoundControl } from '../../../components/ui/SoundControl'
import { BoothBackdrop } from '../../magic-tokens/BoothBackdrop'
import { DIFFICULTY_LABELS, starsForTask, type Difficulty, type Grade } from '../../magic-tokens/logic'
import type { TaskOutcome } from '../../magic-tokens/PlayBoard'
import { ParkNightBackdrop } from '../WheelBoard'
import {
  ACTIVITIES,
  HELP_LEVEL,
  cellHint,
  cellKey,
  checkGrid,
  checkPattern,
  checkStep,
  cellState,
  firstSelection,
  fixHint,
  instruction,
  patternHint,
  praise,
  ruleText,
  stepText,
  type GridTask,
  type PatternTask,
  type TableTask,
} from './logic'
import { PatternStrip, TableGrid } from './TableBoard'

type Feedback = null | { kind: 'correct'; stars: 1 | 2 | 3 } | { kind: 'wrong'; message: string } | { kind: 'info'; message: string }

interface Props {
  grade: Grade
  difficulty: Difficulty
  tasks: TableTask[]
  onFinish: (o: TaskOutcome[]) => void
  onExit: () => void
}

/** Минимален размер на клетка в реални пиксели (докосване на таблет и интерактивен дисплей). */
const MIN_TOUCH = 50
const typeInto = (a: string, d: string) => (a === '0' ? d : (a + d).slice(0, 3))
/** На коя половина (страница) е клетката. */
const pageOf = (t: TableTask, key: string | null) => {
  if (!key || t.kind === 'pattern') return 0
  const half = Math.ceil(t.cols.length / 2)
  return t.cols.indexOf(Number(key.split('x')[1])) < half ? 0 : 1
}

/**
 * Примерът за избраната клетка: „2 · 3 = ?“, докато детето пише — „2 · 3 = 6“.
 * Отговорът се вижда само когато е въведен от детето или вече е проверен.
 */
function EquationBar({ grid, sel, answers, marked, locked, height, canMark }: { grid: GridTask; sel: string | null; answers: Record<string, string>; marked: Set<string>; locked: Set<string>; height: number; canMark: boolean }) {
  const style = { height, fontSize: Math.round(height * 0.5) } as CSSProperties
  if (!sel) return <div className="tp-eq is-empty" style={style}>{canMark ? 'Докосни грешното произведение' : 'Докосни празна клетка'}</div>
  const [r, c] = sel.split('x').map(Number)
  const st = cellState(grid, sel, answers, marked, locked)
  const value = st === 'locked' ? answers[sel] || String(r * c) : st === 'given' ? String(r * c) : answers[sel] ?? ''
  return (
    <div className={`tp-eq ${st === 'locked' ? 'is-locked' : ''}`} style={style} aria-live="polite">
      <span>
        {r} · {c} =
      </span>
      <span className={`tp-eq__box ${value ? '' : 'is-empty'}`}>{value || '?'}</span>
    </div>
  )
}

/** „Попълни таблицата“: четири дейности върху светещото табло на парка. */
export function TablePlay({ grade, difficulty, tasks, onFinish, onExit }: Props) {
  const { settings, play } = useApp()
  const { width: W, portrait, scale } = useStage()
  const [index, setIndex] = useState(0)
  const task = tasks[index]
  const help = HELP_LEVEL[difficulty]
  const hintsOn = settings.hintsOn && help !== 'none'

  // общо състояние
  const [mistakes, setMistakes] = useState(0)
  const [usedHint, setUsedHint] = useState(false)
  const [feedback, setFeedback] = useState<Feedback>(null)
  const [hint, setHint] = useState<string | null>(null)
  const [outcomes, setOutcomes] = useState<TaskOutcome[]>([])
  const [solved, setSolved] = useState(false)
  const [touched, setTouched] = useState(false)
  const [shake, setShake] = useState(0)
  // редица
  const [stepChosen, setStepChosen] = useState(false)
  const [pAnswers, setPAnswers] = useState<Record<number, string>>({})
  const [pLocked, setPLocked] = useState<Set<number>>(new Set())
  const [pSel, setPSel] = useState<number | null>(null)
  const [pFlash, setPFlash] = useState<Set<number>>(new Set())
  // таблица
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [marked, setMarked] = useState<Set<string>>(new Set())
  const [locked, setLocked] = useState<Set<string>>(new Set())
  const [sel, setSelRaw] = useState<string | null>(() => firstSelection(tasks[0]))
  const [flash, setFlash] = useState<Set<string>>(new Set())
  const [page, setPage] = useState(() => pageOf(tasks[0], firstSelection(tasks[0])))

  const isLast = index === tasks.length - 1
  const stars = outcomes.reduce((a, o) => a + o.stars, 0)
  const activity = ACTIVITIES.find((a) => a.id === task.kind)!
  const grid = task.kind === 'pattern' ? null : (task as GridTask)
  const pattern = task.kind === 'pattern' ? (task as PatternTask) : null
  const canMark = !!grid && grid.cells.some((c) => c.wrong !== undefined)

  const reset = (t: TableTask) => {
    setMistakes(0)
    setUsedHint(false)
    setFeedback(null)
    setHint(null)
    setSolved(false)
    setTouched(false)
    setStepChosen(false)
    setPAnswers({})
    setPLocked(new Set())
    setPSel(null)
    setPFlash(new Set())
    setAnswers({})
    setMarked(new Set())
    setLocked(new Set())
    setSelRaw(firstSelection(t))
    setFlash(new Set())
    setPage(pageOf(t, firstSelection(t)))
  }

  /** Избор на клетка; при таблица на две страници се показва страницата ѝ. */
  const setSel = (key: string | null) => {
    setSelRaw(key)
    if (key) setPage(pageOf(task, key))
  }

  const fail = (message: string) => {
    setMistakes((m) => m + 1)
    setShake((n) => n + 1)
    setFeedback({ kind: 'wrong', message })
    play('tryAgain')
  }

  const win = () => {
    const s = starsForTask(mistakes, usedHint)
    setSolved(true)
    setSel(null)
    setPSel(null)
    setOutcomes((o) => [...o, { stars: s, firstTry: mistakes === 0, solved: true }])
    setFeedback({ kind: 'correct', stars: s })
    play('success')
    for (let i = 0; i < s; i++) window.setTimeout(() => play('star'), 650 + i * 230)
  }

  // ── редица ──
  const chooseStep = (v: number) => {
    if (!pattern || stepChosen || solved) return
    setTouched(true)
    setHint(null)
    if (checkStep(pattern, v)) {
      play('star')
      setStepChosen(true)
      setPSel(pattern.blanks[0])
      setFeedback({ kind: 'info', message: `Точно така! ${ruleText(pattern.step)}. Сега попълни празните места.` })
    } else fail(help === 'visual' && settings.hintsOn ? `Не е ${stepText(v)}. ${patternHint(pattern, false)}` : `Не е ${stepText(v)}. Виж пак как се променят числата.`)
  }

  // ── таблица: докосване на клетка ──
  const onCell = (key: string) => {
    if (!grid || solved) return
    setTouched(true)
    const st = cellState(grid, key, answers, marked, locked)
    const c = grid.cells.find((x) => cellKey(x.r, x.c) === key)!
    if (st === 'locked') return
    if (st === 'wrongShown') {
      // открита грешка: клетката се отваря за поправяне
      play('pick')
      setMarked((m) => new Set(m).add(key))
      setSel(key)
      setFeedback({ kind: 'info', message: `Откри грешка! Напиши вярното произведение на ${c.r} · ${c.c}.` })
      return
    }
    if (st === 'given') {
      if (canMark) {
        fail(`Тази е вярна: ${c.r} · ${c.c} = ${c.value}. Потърси друга.`)
        return
      }
      play('locked')
      setFeedback({ kind: 'info', message: 'Тази клетка е готова. Докосни празна клетка.' })
      return
    }
    play('click')
    setSel(key)
    if (feedback?.kind !== 'correct') setFeedback(null)
  }

  const digit = (d: string) => {
    if (solved) return
    if (pattern) {
      if (!stepChosen || pSel === null || pLocked.has(pSel)) return
      play('click')
      setPAnswers((a) => ({ ...a, [pSel]: typeInto(a[pSel] ?? '', d) }))
      return
    }
    if (!grid || !sel) return
    const st = cellState(grid, sel, answers, marked, locked)
    if (st !== 'blank' && st !== 'filled' && st !== 'marked') return
    play('click')
    setAnswers((a) => ({ ...a, [sel]: typeInto(a[sel] ?? '', d) }))
    setTouched(true)
    if (feedback?.kind === 'wrong') setFeedback(null)
  }
  const back = () => {
    if (solved) return
    play('remove')
    if (pattern && pSel !== null && !pLocked.has(pSel)) setPAnswers((a) => ({ ...a, [pSel]: (a[pSel] ?? '').slice(0, -1) }))
    if (grid && sel && !locked.has(sel)) setAnswers((a) => ({ ...a, [sel]: (a[sel] ?? '').slice(0, -1) }))
  }
  const clearCell = () => {
    if (solved) return
    play('remove')
    if (pattern && pSel !== null && !pLocked.has(pSel)) setPAnswers((a) => ({ ...a, [pSel]: '' }))
    if (grid && sel && !locked.has(sel)) setAnswers((a) => ({ ...a, [sel]: '' }))
  }

  const check = () => {
    if (solved) return
    setHint(null)
    if (pattern) {
      if (!stepChosen) return setFeedback({ kind: 'info', message: 'Първо избери с колко се променят числата.' })
      const r = checkPattern(pattern, pAnswers)
      if (r.status === 'incomplete') {
        play('hint')
        return setFeedback({ kind: 'info', message: r.message })
      }
      // верните се заключват, грешните се изчистват (отговорът не се показва)
      setPLocked(new Set(pattern.blanks.filter((i) => !r.wrong.includes(i))))
      if (r.status === 'wrong') {
        setPAnswers((a) => Object.fromEntries(Object.entries(a).map(([k, v]) => [k, r.wrong.includes(Number(k)) ? '' : v])))
        setPFlash(new Set(r.wrong))
        setPSel(r.wrong[0])
        window.setTimeout(() => setPFlash(new Set()), 700)
        return fail(help === 'visual' && settings.hintsOn ? `${r.message} ${patternHint(pattern, true)}` : r.message)
      }
      return win()
    }
    if (!grid) return
    const r = checkGrid(grid, answers, marked)
    if (r.status === 'incomplete') {
      play('hint')
      return setFeedback({ kind: 'info', message: r.message })
    }
    const entered = grid.cells.filter((c) => c.blank || marked.has(cellKey(c.r, c.c))).map((c) => cellKey(c.r, c.c))
    setLocked(new Set(entered.filter((k) => !r.wrongKeys.includes(k))))
    if (r.status === 'wrong') {
      if (r.wrongKeys.length) {
        setAnswers((a) => Object.fromEntries(Object.entries(a).map(([k, v]) => [k, r.wrongKeys.includes(k) ? '' : v])))
        setFlash(new Set(r.wrongKeys))
        window.setTimeout(() => setFlash(new Set()), 700)
        setSel(r.wrongKeys[0])
        const [rr, cc] = r.wrongKeys[0].split('x').map(Number)
        return fail(help === 'visual' && settings.hintsOn ? `${r.message} ${cellHint(rr, cc, 'visual')}` : r.message)
      }
      return fail(r.message)
    }
    win()
  }

  const askHelp = () => {
    if (!hintsOn || solved) return
    if (help === 'limited' && usedHint) return
    play('hint')
    setUsedHint(true)
    setFeedback(null)
    if (pattern) return setHint(patternHint(pattern, stepChosen))
    if (!grid) return
    if (canMark && (!sel || cellState(grid, sel, answers, marked, locked) !== 'marked')) return setHint(fixHint(grid, marked))
    const target = sel ?? (() => {
      const c = grid.cells.find((x) => x.blank && !answers[cellKey(x.r, x.c)])
      return c ? cellKey(c.r, c.c) : null
    })()
    if (!target) return setHint('Провери числата, които написа.')
    setSel(target)
    const [rr, cc] = target.split('x').map(Number)
    setHint(cellHint(rr, cc, help === 'visual' ? 'visual' : 'limited'))
  }

  const next = () => {
    if (!solved) return
    if (isLast) {
      play('fanfare')
      return onFinish(outcomes)
    }
    setIndex(index + 1)
    reset(tasks[index + 1])
  }

  // клавиатура: цифри, Backspace, Enter; стрелки местят избраната клетка; интервал отваря грешка
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey || solved) return
      const t = e.target as HTMLElement | null
      if (t && t.tagName === 'BUTTON' && (e.key === 'Enter' || e.key === ' ')) return
      if (/^\d$/.test(e.key)) {
        e.preventDefault()
        return digit(e.key)
      }
      if (e.key === 'Backspace' || e.key === 'Delete') {
        e.preventDefault()
        return back()
      }
      if (e.key === 'Enter') {
        e.preventDefault()
        return check()
      }
      const dir = { ArrowLeft: [0, -1], ArrowRight: [0, 1], ArrowUp: [-1, 0], ArrowDown: [1, 0] }[e.key]
      if (!dir) {
        if (e.key === ' ' && grid && sel) {
          e.preventDefault()
          onCell(sel)
        }
        return
      }
      e.preventDefault()
      if (pattern && stepChosen) {
        const open = pattern.blanks.filter((i) => !pLocked.has(i))
        if (!open.length) return
        const at = pSel === null ? -1 : open.indexOf(pSel)
        setPSel(open[(at + (dir[1] || dir[0]) + open.length) % open.length])
        return
      }
      if (!grid) return
      const cur = sel ?? cellKey(grid.rows[0], grid.cols[0])
      const [r, c] = cur.split('x').map(Number)
      const ri = Math.max(0, Math.min(grid.rows.length - 1, grid.rows.indexOf(r) + dir[0]))
      const ci = Math.max(0, Math.min(grid.cols.length - 1, grid.cols.indexOf(c) + dir[1]))
      setSel(cellKey(grid.rows[ri], grid.cols[ci]))
      setTouched(true)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  // ── размер на таблото: от реалното място; клетките ≥ 56 реални пиксела ──
  const boardRef = useRef<HTMLDivElement>(null)
  const [box, setBox] = useState({ w: 0, h: 0 })
  useLayoutEffect(() => {
    const el = boardRef.current
    if (!el) return
    const m = () => setBox({ w: el.clientWidth, h: el.clientHeight })
    m()
    const ro = new ResizeObserver(m)
    ro.observe(el)
    return () => ro.disconnect()
  }, [shake])
  // рамката на таблото: 16 px отстъп + 6 px ръб от всяка страна
  const narrow = !portrait && W < 1450
  // телефон хоризонтално: много нисък екран — клавиатурата и бутоните един до друг
  const phoneLand = !portrait && scale < 0.6
  const availW = Math.max(200, box.w - 48)
  const availH = Math.max(160, box.h - 48)
  let cols = grid?.cols ?? []
  let cell = 100
  let paged = false
  let stripWrap = false
  // лентата с примера (напр. „2 · 3 = ?“) над таблото
  const eqH = Math.round(Math.max(64, 46 / Math.max(0.1, scale)))
  if (grid) {
    const gridH = availH - eqH - 12
    // клетка + 8 px зазор
    const fit = (nc: number, nr: number) => Math.min((availW - 8 * nc) / nc, (gridH - 8 * nr) / nr, 150)
    const full = fit(grid.cols.length + 1, grid.rows.length + 1)
    paged = full * scale < MIN_TOUCH && grid.cols.length > 6
    if (paged) {
      const half = Math.ceil(grid.cols.length / 2)
      cols = page === 0 ? grid.cols.slice(0, half) : grid.cols.slice(half)
      // мястото вече е измерено без бутоните за страниците
      cell = Math.floor(fit(half + 1, grid.rows.length + 1))
    } else cell = Math.floor(full)
  } else if (pattern) {
    const n = pattern.terms.length
    // под редицата са бутоните за стъпката (докато не е избрана)
    // телефон хоризонтално: бутоните са вдясно от редицата (ниският екран пести височина)
    const stepBtn = Math.max(92, 52 / Math.max(0.1, scale))
    const below = stepChosen || phoneLand ? 0 : stepBtn + 70
    const beside = phoneLand && !stepChosen ? Math.max(150, stepBtn * 1.7) + 40 : 0
    const one = Math.min((availW - beside) / (n + 0.6 * (n - 1)), (availH - below) / 1.6, 160)
    // тясно (телефон вертикално): редицата е на два реда, лампичките са по-едри
    stripWrap = one * scale < MIN_TOUCH
    const per = stripWrap ? Math.ceil(n / 2) : n
    cell = Math.floor(stripWrap ? Math.min((availW - beside - 90) / (per * 1.6 + 1), (availH - below) / 3.6, 160) : one)
  }
  const pageInfo = (p: number) => {
    if (!grid) return 0
    const half = Math.ceil(grid.cols.length / 2)
    const pc = p === 0 ? grid.cols.slice(0, half) : grid.cols.slice(half)
    return grid.cells.filter((c) => pc.includes(c.c) && c.blank && !answers[cellKey(c.r, c.c)]).length
  }

  // ── Звездичката ──
  let mood: MascotMood = 'happy'
  let bubble: ReactNode
  if (feedback?.kind === 'wrong') {
    mood = 'encourage'
    bubble = (
      <>
        <b className="bubble-title">Опитай отново!</b>
        {feedback.message}
      </>
    )
  } else if (hint) {
    mood = 'think'
    bubble = (
      <>
        <b className="bubble-title">Подсказка</b>
        {hint}
      </>
    )
  } else if (feedback?.kind === 'info') {
    mood = 'think'
    bubble = feedback.message
  } else if (solved) {
    mood = 'cheer'
    bubble = praise(task)
  } else bubble = pattern ? 'Разгледай редицата. Как се променят числата?' : canMark ? 'Докосни число, което не е вярно.' : 'Докосни празна клетка и напиши числото.'

  const stepState = (n: 1 | 2 | 3) => (n === 1 ? (touched || solved ? 'done' : 'active') : n === 2 ? (solved ? 'done' : touched ? 'active' : 'todo') : solved ? 'done' : 'todo')
  const helpDisabled = !hintsOn || solved || (help === 'limited' && usedHint)
  const helpTitle = help === 'none' ? 'На ниво „Майстор“ работиш самостоятелно' : !settings.hintsOn ? 'Подсказките са изключени от учителя' : help === 'limited' ? 'Една подсказка на задача' : 'Подсказка'
  const tablesText = grid ? (grid.rows.length === 1 ? `Таблица с ${grid.rows[0]}` : `Таблици ${grid.rows.join(', ')}`) : 'Редица'
  // поне ~52 реални пиксела за всеки бутон за докосване
  const tap = `${Math.ceil(52 / Math.max(0.1, scale))}px`

  return (
    <div className="screen wheel-play table-play" style={{ '--tap': tap } as CSSProperties}>
      <BoothBackdrop />
      <div className="top-bar">
        <GameButton color="yellow" size="md" icon="map" onClick={onExit}>
          Към парка
        </GameButton>
        <GradeTicket grade={grade} />
        <div className="level-chip">Умножение · {DIFFICULTY_LABELS[difficulty]}</div>
        <div className="top-bar__spacer" />
        <div className="progress" aria-label={`Задача ${index + 1} от ${tasks.length}`}>
          <span className="progress__label">
            Задача {index + 1} / {tasks.length}
          </span>
          <span className="progress__dots">
            {tasks.map((t, i) => (
              <span key={t.id} className={`progress__dot ${i < outcomes.length ? 'is-done' : ''} ${i === index ? 'is-current' : ''}`} />
            ))}
          </span>
        </div>
        <div className="star-counter">
          <Icon name="star" size={34} />
          <span>{stars}</span>
        </div>
        <SoundControl />
      </div>

      <div className={`tp-grid ${narrow ? 'is-narrow' : ''} ${phoneLand ? 'is-phone-land' : ''}`}>
        <section className="tp-task">
          <div className="marquee tb-marquee tp-marquee" key={task.id}>
            <span className="marquee__lights" aria-hidden="true" />
            <span className="marquee__label">{activity.label}</span>
            <span className="marquee__number tb-marquee__text tp-marquee__text">{tablesText}</span>
          </div>
          <div className="tp-say">
            <div className="tb-instruction">{solved ? praise(task) : instruction(task, stepChosen)}</div>
            <div className="tp-bubble">
              <Mascot mood={mood} size={84} />
              <div className={`speech-bubble speech-bubble--game ${feedback?.kind === 'wrong' ? 'is-wrong' : ''}`} key={`${feedback?.kind}-${hint}-${shake}`}>
                {bubble}
              </div>
            </div>
          </div>
        </section>

        <section className={`wp-stage tp-stage ${feedback?.kind === 'wrong' ? 'is-shake' : ''} ${grid && paged ? 'is-paged' : ''} ${grid && paged && ((portrait && scale >= 0.6) || phoneLand) ? 'is-paged-side' : ''}`} key={shake}>
          <ParkNightBackdrop />
          <div className="tp-board-area" ref={boardRef}>
            {pattern && (
              <div className="tp-pattern">
                <PatternStrip task={pattern} cell={cell} wrap={stripWrap} stepChosen={stepChosen} answers={pAnswers} locked={pLocked} flash={pFlash} selected={pSel} celebrate={solved} disabled={solved} onCell={(i) => (setPSel(i), play('click'))} />
                {!stepChosen && (
                  <div className="tp-steps" role="group" aria-label="Каква е стъпката?">
                    <span className="tp-steps__q">Каква е стъпката?</span>
                    {pattern.stepOptions.map((v) => (
                      <button key={v} type="button" className="tp-step-btn" onClick={() => chooseStep(v)}>
                        {stepText(v)}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
            {grid && (
              <EquationBar grid={grid} sel={sel} answers={answers} marked={marked} locked={locked} height={eqH} canMark={canMark} />
            )}
            {grid && (
              <TableGrid
                task={grid}
                cols={cols}
                cell={cell}
                answers={answers}
                marked={marked}
                locked={locked}
                flash={flash}
                selected={sel}
                showExpr={help === 'visual'}
                celebrate={solved}
                disabled={solved}
                onCell={onCell}
              />
            )}
          </div>
          {grid && paged && (
            <div className="tp-pages" role="tablist" aria-label="Част от таблицата">
              {[0, 1].map((p) => {
                const half = Math.ceil(grid.cols.length / 2)
                const pc = p === 0 ? grid.cols.slice(0, half) : grid.cols.slice(half)
                const left = pageInfo(p)
                return (
                  <button key={p} type="button" role="tab" aria-selected={page === p} className={`tp-page ${page === p ? 'is-on' : ''}`} onClick={() => (play('click'), setPage(p))}>
                    {pc[0]}–{pc[pc.length - 1]}
                    {left > 0 && <span className="tp-page__badge">{left}</span>}
                  </button>
                )
              })}
            </div>
          )}
        </section>

        <div className="steps-bar tp-stepsbar" aria-label="Етапи на задачата">
          {(['Разгледай', 'Попълни', 'Провери'] as const).map((l, i) => {
            const st = stepState((i + 1) as 1 | 2 | 3)
            return (
              <span key={l} className={`step step--${st}`} aria-current={st === 'active' ? 'step' : undefined}>
                <span className="step__num">{st === 'done' ? <Icon name="check" size={22} /> : i + 1}</span>
                <span className="step__label">{l}</span>
              </span>
            )
          })}
          <span className="steps-bar__info">{activity.short}</span>
        </div>

        <section className="tp-side">
          <div
            className="wheel-compute tp-pad"
            // вертикално клавишите са ~50 реални пиксела на всяко устройство
            style={portrait ? ({ '--key-h': `${Math.round(Math.max(56, Math.min(112, 56 / Math.max(0.1, scale))))}px` } as CSSProperties) : undefined}
          >
            <div className="keypad" role="group" aria-label="Цифрова клавиатура">
              {['7', '8', '9', '4', '5', '6', '1', '2', '3'].map((k) => (
                <button key={k} type="button" className="keypad__key" onClick={() => digit(k)} disabled={solved}>
                  {k}
                </button>
              ))}
              <button type="button" className="keypad__key keypad__key--clear" onClick={clearCell} disabled={solved} aria-label="Изчисти клетката">
                <Icon name="clear" size={30} />
              </button>
              <button type="button" className="keypad__key" onClick={() => digit('0')} disabled={solved}>
                0
              </button>
              <button type="button" className="keypad__key keypad__key--back" onClick={back} disabled={solved} aria-label="Изтрий последната цифра">
                <Icon name="back" size={30} />
              </button>
            </div>
          </div>
          <div className="actions tp-actions">
            <GameButton color="green" size="lg" icon="check" onClick={check} disabled={solved} silent>
              Провери
            </GameButton>
            <GameButton color="turquoise" size="lg" icon="help" onClick={askHelp} disabled={helpDisabled} title={helpTitle} silent>
              Помощ
            </GameButton>
            <GameButton color="purple" size="lg" icon="next" onClick={next} disabled={!solved} className={solved ? 'is-ready' : ''}>
              {isLast && solved ? 'Резултат' : 'Следваща'}
            </GameButton>
          </div>
        </section>
      </div>

      {feedback?.kind === 'correct' && (
        <div className="success-overlay">
          <Confetti seed={index + 7} />
          <div className="success-card">
            <div className="success-card__burst" aria-hidden="true" />
            <Mascot mood="cheer" size={150} className="success-card__mascot" />
            <div className="success-card__title">Браво!</div>
            <div className="success-card__praise">{praise(task)}</div>
            <StarRow stars={feedback.stars} size={86} animate />
            <div className="success-card__text">{activity.label}</div>
            <GameButton color="green" size="xl" icon="next" onClick={next} className="success-card__next">
              {isLast ? 'Виж резултата' : 'Следваща задача'}
            </GameButton>
          </div>
        </div>
      )}
    </div>
  )
}
