import { useEffect, useState, type CSSProperties, type ReactNode } from 'react'
import { useApp } from '../../../core/AppContext'
import { useStage } from '../../../core/Stage'
import { Mascot, type MascotMood } from '../../../components/art/Mascot'
import { Confetti, StarRow } from '../../../components/ui/Effects'
import { GameButton } from '../../../components/ui/GameButton'
import { GradeTicket } from '../../../components/ui/GradeTicket'
import { Icon } from '../../../components/ui/Icon'
import { SoundControl } from '../../../components/ui/SoundControl'
import { DIFFICULTY_LABELS, starsForTask, type Difficulty, type Grade } from '../../magic-tokens/logic'
import type { TaskOutcome } from '../../magic-tokens/PlayBoard'
import { usePointerDrag } from '../../magic-tokens/usePointerDrag'
import { FLOOR_COLORS, TowerBackdrop, TowerScene, type Floor } from '../TowerScene'
import { HELP, buildHint, checkBuild, fmt, instruction, praise, ruleBottom, type BuildTask } from './logic'

type Feedback = null | { kind: 'correct'; stars: 1 | 2 | 3 } | { kind: 'wrong'; message: string } | { kind: 'info'; message: string }

interface Props {
  grade: Grade
  difficulty: Difficulty
  tasks: BuildTask[]
  onFinish: (o: TaskOutcome[]) => void
  onExit: () => void
}

/** Цветът на блока в тавата — по стойността (един и същ етаж запазва цвета си). */
const colorOf = (t: BuildTask, v: number) => FLOOR_COLORS[(t.numbers.indexOf(v) + 2) % FLOOR_COLORS.length][0]

/** Текст, в който думите с тире („най-малкото“) не се разделят на два реда. */
function Words({ text }: { text: string }) {
  return (
    <>
      {text.split(' ').flatMap((w, i) => [
        i ? ' ' : '',
        <span key={i} className="nt-word">
          {w}
        </span>,
      ])}
    </>
  )
}

/** „Построй кулата“: етажите от тавата се поставят в кулата отдолу нагоре. */
export function BuildBoard({ grade, difficulty, tasks, onFinish, onExit }: Props) {
  const { settings, play } = useApp()
  const { scale } = useStage()
  const [index, setIndex] = useState(0)
  const task = tasks[index]
  const help = HELP[difficulty]
  const hintsOn = settings.hintsOn && help !== 'none'

  const [placed, setPlaced] = useState<(number | null)[]>(() => new Array(tasks[0].numbers.length).fill(null))
  const [locked, setLocked] = useState<Set<number>>(new Set())
  const [wrongFlash, setWrongFlash] = useState<Set<number>>(new Set())
  const [picked, setPicked] = useState<number | null>(null)
  const [mistakes, setMistakes] = useState(0)
  const [usedHint, setUsedHint] = useState(false)
  const [feedback, setFeedback] = useState<Feedback>(null)
  const [hint, setHint] = useState<string | null>(null)
  const [hintPair, setHintPair] = useState<number[]>([])
  const [outcomes, setOutcomes] = useState<TaskOutcome[]>([])
  const [solved, setSolved] = useState(false)
  const [shake, setShake] = useState(0)

  const tray = task.numbers.filter((v) => !placed.includes(v))
  const isLast = index === tasks.length - 1
  const stars = outcomes.reduce((a, o) => a + o.stars, 0)
  const firstEmpty = placed.findIndex((v) => v === null)

  const clearMsg = () => {
    setHint(null)
    setHintPair([])
    if (feedback?.kind !== 'correct') setFeedback(null)
  }

  /** Поставяне в етаж i (ако е зает — размяна с тавата). */
  const placeAt = (v: number, i: number) => {
    if (solved || locked.has(i)) return
    play('drop')
    setPlaced((p) => {
      const next = p.map((x) => (x === v ? null : x))
      next[i] = v
      return next
    })
    setPicked(null)
    setWrongFlash(new Set())
    clearMsg()
  }

  const tapTray = (v: number) => {
    if (solved) return
    play('pick')
    // докосване на избрания — поставяне в първото празно място (най-бързо с един пръст)
    if (picked === v) return placeAt(v, firstEmpty >= 0 ? firstEmpty : placed.length - 1)
    setPicked(v)
    clearMsg()
    setFeedback({ kind: 'info', message: `Избра ${fmt(v)}. Докосни етажа, на който да го поставиш.` })
  }

  const tapFloor = (i: number) => {
    if (solved) return
    if (locked.has(i)) {
      play('locked')
      return setFeedback({ kind: 'info', message: 'Този етаж вече е на мястото си.' })
    }
    if (picked !== null) return placeAt(picked, i)
    const v = placed[i]
    if (v !== null) {
      // връщане в тавата
      play('remove')
      setPlaced((p) => p.map((x, k) => (k === i ? null : x)))
      clearMsg()
      return
    }
    play('hint')
    setFeedback({ kind: 'info', message: 'Първо избери етаж от тавата — или го плъзни до кулата.' })
  }

  const { drag, bind } = usePointerDrag<number>({
    disabled: solved,
    onStart: () => play('pick'),
    onTap: tapTray,
    onDrop: (v, target) => {
      if (target?.startsWith('floor:')) return placeAt(v, Number(target.slice(6)))
      // пуснато върху кулата, но не върху етаж — в първото празно място
      if (target === 'tower' && firstEmpty >= 0) return placeAt(v, firstEmpty)
    },
  })

  const check = () => {
    if (solved) return
    setHint(null)
    setHintPair([])
    const r = checkBuild(task, placed)
    if (r.status === 'incomplete') {
      play('hint')
      return setFeedback({ kind: 'info', message: r.message })
    }
    if (r.status === 'wrong') {
      // верните етажи се заключват, грешните се връщат в тавата (отговорът не се показва)
      setLocked(new Set(placed.map((_, i) => i).filter((i) => !r.wrong.includes(i))))
      setWrongFlash(new Set(r.wrong))
      window.setTimeout(() => {
        setPlaced((p) => p.map((x, i) => (r.wrong.includes(i) ? null : x)))
        setWrongFlash(new Set())
      }, 650)
      setMistakes((m) => m + 1)
      setShake((s) => s + 1)
      play('tryAgain')
      return setFeedback({ kind: 'wrong', message: help === 'visual' && settings.hintsOn ? `${r.message} ${ruleBottom(task)}` : r.message })
    }
    const s = starsForTask(mistakes, usedHint)
    setLocked(new Set(placed.map((_, i) => i)))
    setSolved(true)
    setOutcomes((o) => [...o, { stars: s, firstTry: mistakes === 0, solved: true }])
    setFeedback({ kind: 'correct', stars: s })
    play('success')
    for (let i = 0; i < s; i++) window.setTimeout(() => play('star'), 900 + i * 230)
  }

  const askHelp = () => {
    if (!hintsOn || solved) return
    if (help === 'limited' && usedHint) return
    play('hint')
    setUsedHint(true)
    setFeedback(null)
    setHint(buildHint(task, tray, help === 'visual' ? 'visual' : 'limited'))
    if (help === 'visual') setHintPair(tray.slice(0, 2))
  }

  const reset = () => {
    if (solved) return
    play('remove')
    setPlaced((p) => p.map((x, i) => (locked.has(i) ? x : null)))
    setPicked(null)
    clearMsg()
  }

  const next = () => {
    if (!solved) return
    if (isLast) {
      play('fanfare')
      return onFinish(outcomes)
    }
    const t = tasks[index + 1]
    setIndex(index + 1)
    setPlaced(new Array(t.numbers.length).fill(null))
    setLocked(new Set())
    setWrongFlash(new Set())
    setPicked(null)
    setMistakes(0)
    setUsedHint(false)
    setFeedback(null)
    setHint(null)
    setHintPair([])
    setSolved(false)
  }

  // клавиатура: Enter — Провери / Следваща; Escape — отказ от избора
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null
      if (el && (el.tagName === 'BUTTON' || el.getAttribute('role') === 'button') && (e.key === 'Enter' || e.key === ' ')) return
      if (e.key === 'Enter') {
        e.preventDefault()
        if (solved) next()
        else check()
      } else if (e.key === 'Escape') setPicked(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const floors: Floor[] = placed.map((v, i) => ({
    label: v === null ? null : fmt(v),
    state: v === null ? (picked !== null && i === firstEmpty ? 'next' : 'ghost') : wrongFlash.has(i) ? 'wrong' : locked.has(i) ? 'locked' : 'placed',
  }))

  let mood: MascotMood = 'happy'
  let bubble: ReactNode
  if (feedback?.kind === 'wrong') {
    mood = 'encourage'
    bubble = (
      <>
        <b className="bubble-title">Опитай отново!</b>
        <Words text={feedback.message} />
      </>
    )
  } else if (hint) {
    mood = 'think'
    bubble = (
      <>
        <b className="bubble-title">Подсказка</b>
        <Words text={hint} />
      </>
    )
  } else if (feedback?.kind === 'info') {
    mood = 'think'
    bubble = <Words text={feedback.message} />
  } else if (solved) {
    mood = 'cheer'
    bubble = <Words text={praise(task)} />
  } else bubble = <Words text={ruleBottom(task)} />

  const tap = Math.ceil(52 / Math.max(0.1, scale))
  const helpDisabled = !hintsOn || solved || (help === 'limited' && usedHint)
  const helpTitle =
    help === 'none' ? 'На ниво „Майстор“ работиш самостоятелно' : !settings.hintsOn ? 'Подсказките са изключени от учителя' : help === 'limited' ? 'Една подсказка на задача' : 'Подсказка'
  const longest = Math.max(...task.numbers.map((v) => fmt(v).length))

  return (
    <div className="screen wheel-play nt-play nt-build-play" style={{ '--tap': `${tap}px`, '--chars': longest } as CSSProperties}>
      <TowerBackdrop />
      <div className="top-bar">
        <GameButton color="yellow" size="md" icon="map" onClick={onExit}>
          Към парка
        </GameButton>
        <GradeTicket grade={grade} />
        <div className="level-chip">
          <span className="nt-chip-pre">{'Кулата · '}</span>
          {DIFFICULTY_LABELS[difficulty]}
        </div>
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

      <div className="nt-grid">
        <section className="nt-task">
          <div className="marquee tb-marquee nt-marquee" key={task.id}>
            <span className="marquee__lights" aria-hidden="true" />
            <span className="marquee__label">Построй кулата</span>
            <span className="marquee__number tb-marquee__text nt-marquee__text">
              <Words text={task.order === 'asc' ? 'От най-малкото към най-голямото' : 'От най-голямото към най-малкото'} />
            </span>
          </div>
          <div className="nt-say">
            <div className="tb-instruction">
              <Words text={solved ? praise(task) : instruction(task)} />
            </div>
            <div className="nt-bubble">
              <Mascot mood={mood} size={84} />
              <div className={`speech-bubble speech-bubble--game ${feedback?.kind === 'wrong' ? 'is-wrong' : ''}`} key={`${feedback?.kind}-${hint}-${shake}`}>
                {bubble}
              </div>
            </div>
          </div>
        </section>

        <section className={`wp-stage nt-stage ${feedback?.kind === 'wrong' ? 'is-shake' : ''}`} key={shake}>
          <TowerBackdrop />
          <div className="nt-build">
            <div className="nt-tray" role="group" aria-label="Етажи за подреждане">
              {tray.length === 0 && !solved && <div className="nt-tray__empty">Всички етажи са в кулата. Натисни „Провери“.</div>}
              {tray.map((v) => (
                <button
                  key={v}
                  type="button"
                  data-block={v}
                  className={`nt-block ${picked === v ? 'is-picked' : ''} ${hintPair.includes(v) ? 'is-hinted' : ''}`}
                  style={{ '--c': colorOf(task, v) } as CSSProperties}
                  aria-label={`Етаж ${fmt(v)}${picked === v ? ', избран' : ''}`}
                  aria-pressed={picked === v}
                  {...bind(v)}
                  // клавиатура (Enter/интервал): click без указател — същото като докосване
                  onClick={(e) => {
                    if (e.detail === 0) tapTray(v)
                  }}
                >
                  {fmt(v)}
                </button>
              ))}
            </div>
            <div className="nt-build__tower" data-drop="tower">
              <div className="nt-build__order" aria-hidden="true">
                <span>{task.order === 'asc' ? 'най-голямото' : 'най-малкото'}</span>
                <svg viewBox="0 0 24 120">
                  <path d="M12 116 V8 M4 18 L12 6 L20 18" fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span>{task.order === 'asc' ? 'най-малкото' : 'най-голямото'}</span>
              </div>
              <TowerScene floors={floors} topLit={solved} celebrate={solved} width={420} onFloor={tapFloor} />
            </div>
          </div>
        </section>

        <section className="nt-side">
          <div className="actions nt-actions">
            <GameButton color="green" size="lg" icon="check" onClick={check} disabled={solved} silent>
              Провери
            </GameButton>
            <GameButton color="orange" size="lg" icon="clear" onClick={reset} disabled={solved || placed.every((x, i) => x === null || locked.has(i))} silent>
              Изчисти
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

      {drag && (
        <div
          className={`drag-ghost nt-block nt-block--ghost ${drag.over ? 'is-over' : ''}`}
          style={{ left: drag.x, top: drag.y, '--c': colorOf(task, drag.payload) } as CSSProperties}
          aria-hidden="true"
        >
          {fmt(drag.payload)}
        </div>
      )}

      {feedback?.kind === 'correct' && (
        <div className="success-overlay nt-success">
          <Confetti seed={index + 21} />
          <div className="success-card">
            <div className="success-card__burst" aria-hidden="true" />
            <Mascot mood="cheer" size={150} className="success-card__mascot" />
            <div className="success-card__title">Браво!</div>
            <div className="success-card__praise">
              <Words text={praise(task)} />
            </div>
            <StarRow stars={feedback.stars} size={86} animate />
            <div className="success-card__text">
              {/* отдолу нагоре — както е построена кулата */}
              {placed.map((v) => fmt(v!)).join(task.order === 'asc' ? ' < ' : ' > ')}
            </div>
            <GameButton color="green" size="xl" icon="next" onClick={next} className="success-card__next">
              {isLast ? 'Виж резултата' : 'Следваща задача'}
            </GameButton>
          </div>
        </div>
      )}
    </div>
  )
}
