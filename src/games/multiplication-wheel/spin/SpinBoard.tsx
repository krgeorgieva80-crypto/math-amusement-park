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
import { backspace, typeDigit } from '../../magic-tokens/compute'
import { DIFFICULTY_LABELS, starsForTask, type Difficulty, type Grade } from '../../magic-tokens/logic'
import type { TaskOutcome } from '../../magic-tokens/PlayBoard'
import { ParkNightBackdrop } from '../WheelBoard'
import { SPIN_HELP, SPIN_MS, checkSpin, neighbourHint, skipCountHint, spinExpression, spinPraise, targetRotation, wheelSectors, type SpinTask } from './logic'
import { SW_VB_H, SW_VB_W, SpinWheel } from './SpinWheel'

type Stage = 'spin' | 'spinning' | 'answer' | 'done'
type Feedback = null | { kind: 'correct'; stars: 1 | 2 | 3 } | { kind: 'wrong'; message: string } | { kind: 'info'; message: string }

interface Props {
  grade: Grade
  difficulty: Difficulty
  tasks: SpinTask[]
  zero: boolean
  onFinish: (o: TaskOutcome[]) => void
  onExit: () => void
}

/** Модел с точки: m реда по „таблицата“ — за преброяване, без готов отговор. */
function DotModel({ table, groups, compact }: { table: number; groups: number; compact: boolean }) {
  if (groups === 0) return <div className="spin-model spin-model--empty">0 групи — няма нито една точка.</div>
  // вертикално групите са колони (ниско и широко), иначе — редове
  const dot = compact ? Math.max(8, Math.min(20, Math.floor(Math.min(140 / (table * 1.3), 360 / (groups * 1.5))))) : Math.max(10, Math.min(22, Math.floor(200 / Math.max(table, groups))))
  return (
    <div className="spin-model" aria-label={`${groups} ${groups === 1 ? 'група' : 'групи'} по ${table}`}>
      {Array.from({ length: groups }, (_, r) => (
        <div key={r} className="spin-model__row" style={{ gap: dot * 0.3 }}>
          {Array.from({ length: table }, (_, c) => (
            <span key={c} className="spin-model__dot" style={{ width: dot, height: dot, animationDelay: `${r * 0.05}s` }} />
          ))}
        </div>
      ))}
    </div>
  )
}

/** „Завърти колелото“: Завърти → Пресметни → Провери. */
export function SpinBoard({ grade, difficulty, tasks, zero, onFinish, onExit }: Props) {
  const { settings, play } = useApp()
  const { width: W, height: H, portrait, scale } = useStage()
  const sectors = wheelSectors(zero)
  const [index, setIndex] = useState(0)
  const [stage, setStage] = useState<Stage>('spin')
  const [rotation, setRotation] = useState(0)
  const [duration, setDuration] = useState(0)
  const [winner, setWinner] = useState<number | null>(null)
  const [answer, setAnswer] = useState('')
  const [mistakes, setMistakes] = useState(0)
  const [usedHint, setUsedHint] = useState(false)
  const [feedback, setFeedback] = useState<Feedback>(null)
  const [hint, setHint] = useState<string | null>(null)
  const [showModel, setShowModel] = useState(false)
  const [outcomes, setOutcomes] = useState<TaskOutcome[]>([])
  const [shake, setShake] = useState(0)
  const timers = useRef<number[]>([])

  const task = tasks[index]
  const help = SPIN_HELP[difficulty]
  const hintsOn = settings.hintsOn && help !== 'none'
  const solved = stage === 'done'
  const isLast = index === tasks.length - 1
  const stars = outcomes.reduce((a, o) => a + o.stars, 0)
  const expr = spinExpression(task, stage === 'answer' ? answer || '?' : solved ? String(task.kind === 'missing' ? task.table : task.table * task.multiplier) : '?')
  const target = sectors.indexOf(task.multiplier)
  const reduceMotion = () => !settings.animationsOn || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

  const clearTimers = () => {
    timers.current.forEach((t) => window.clearTimeout(t))
    timers.current = []
  }
  useEffect(() => clearTimers, [])

  const stopped = () => {
    clearTimers()
    setDuration(0)
    setWinner(target)
    setStage('answer')
    setAnswer('')
    play('drop')
    setFeedback({ kind: 'info', message: task.kind === 'missing' ? `Колелото спря на ${task.multiplier}! Кое число липсва?` : `Колелото спря на ${task.multiplier}! Пресметни.` })
  }

  const spin = () => {
    if (stage !== 'spin') return
    const next = targetRotation(rotation, target, sectors.length)
    setFeedback(null)
    setHint(null)
    if (reduceMotion()) {
      setDuration(0)
      setRotation(next)
      return stopped()
    }
    play('pick')
    setDuration(SPIN_MS)
    setRotation(next)
    setStage('spinning')
    // тихи щраквания, които се забавят заедно с колелото
    for (let k = 1; k <= 11; k++) timers.current.push(window.setTimeout(() => play('click'), SPIN_MS * (1 - Math.sqrt(1 - k / 12))))
    timers.current.push(window.setTimeout(stopped, SPIN_MS + 60))
  }

  /** „Спри“ — колелото застава веднага на същия сектор. */
  const skip = () => {
    if (stage === 'spinning') stopped()
  }

  const fail = (message: string) => {
    const m = mistakes + 1
    setMistakes(m)
    setShake((n) => n + 1)
    play('tryAgain')
    // Откривател: моделът се показва след първата грешка; Изследовател — след третата.
    if (settings.hintsOn && task.kind === 'normal' && ((help === 'visual' && m >= 1) || (help === 'limited' && m >= 3))) setShowModel(true)
    const extra = help === 'visual' && settings.hintsOn ? ` ${skipCountHint(task)}` : help === 'limited' && settings.hintsOn && m >= 3 ? ' Преброй точките.' : ''
    setFeedback({ kind: 'wrong', message: message + extra })
  }

  const check = () => {
    if (stage === 'spin') return spin()
    if (stage !== 'answer') return
    setHint(null)
    const r = checkSpin(task, answer)
    if (r.status === 'incomplete') return setFeedback({ kind: 'info', message: r.message })
    if (r.status === 'wrong') {
      setAnswer('')
      return fail(r.message)
    }
    const s = starsForTask(mistakes, usedHint)
    setStage('done')
    setOutcomes((o) => [...o, { stars: s, firstTry: mistakes === 0, solved: true }])
    setFeedback({ kind: 'correct', stars: s })
    play('success')
    for (let i = 0; i < s; i++) window.setTimeout(() => play('star'), 650 + i * 230)
  }

  const askHelp = () => {
    if (!hintsOn || stage !== 'answer') return
    if (help === 'limited' && usedHint) return
    play('hint')
    setUsedHint(true)
    setFeedback(null)
    if (help === 'visual') {
      setShowModel(true)
      setHint(skipCountHint(task))
    } else setHint(neighbourHint(task))
  }

  const reset = () => {
    if (stage !== 'answer') return
    play('remove')
    setAnswer('')
    if (feedback?.kind !== 'correct') setFeedback(null)
  }

  const next = () => {
    if (!solved) return
    if (isLast) {
      play('fanfare')
      return onFinish(outcomes)
    }
    clearTimers()
    setIndex(index + 1)
    setStage('spin')
    setWinner(null)
    setAnswer('')
    setMistakes(0)
    setUsedHint(false)
    setFeedback(null)
    setHint(null)
    setShowModel(false)
  }

  const digit = (d: string) => {
    if (stage !== 'answer') return
    play('click')
    setAnswer((a) => typeDigit(a, d))
    if (feedback?.kind === 'wrong') setFeedback(null)
  }
  const back = () => {
    if (stage !== 'answer') return
    play('remove')
    setAnswer((a) => backspace(a))
  }

  // Клавиатура: Enter/интервал завърта или спира; цифри, Backspace и Enter при отговора.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return
      const t = e.target as HTMLElement | null
      if (t && (t.tagName === 'BUTTON' || t.getAttribute('role') === 'button') && (e.key === 'Enter' || e.key === ' ')) return
      if (stage === 'spinning' && (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape')) {
        e.preventDefault()
        return skip()
      }
      if (stage === 'spin' && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault()
        return spin()
      }
      if (stage !== 'answer') return
      if (/^\d$/.test(e.key)) {
        e.preventDefault()
        digit(e.key)
      } else if (e.key === 'Backspace') {
        e.preventDefault()
        back()
      } else if (e.key === 'Enter') {
        e.preventDefault()
        check()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  // Звездичката
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
    bubble = spinPraise(task)
  } else bubble = stage === 'spinning' ? 'Колелото се върти…' : 'Натисни „Завърти!“ и виж на кое число ще спре.'

  const tableText = difficulty === 'explorer' ? `с ${task.table}` : 'смесени'
  const instruction =
    stage === 'spin' || stage === 'spinning'
      ? 'Завърти колелото. То ще избере колко пъти.'
      : solved
        ? expr.full
        : task.kind === 'missing'
          ? 'Кое число липсва? Запиши го.'
          : 'Пресметни и запиши отговора.'

  // Размер на колелото — от реално свободното място (както при „Открий равните групи“).
  const narrow = !portrait && W < 1450
  const sideW = portrait ? 0 : narrow ? 280 : 340
  const work = useRef<HTMLElement>(null)
  const side = useRef<HTMLDivElement>(null)
  const [box, setBox] = useState({ w: 0, h: 0, side: 0 })
  useLayoutEffect(() => {
    const el = work.current
    const sd = side.current
    if (!el || !sd) return
    const m = () => setBox({ w: el.clientWidth, h: el.clientHeight, side: sd.offsetHeight })
    m()
    const ro = new ResizeObserver(m)
    ro.observe(el)
    ro.observe(sd)
    return () => ro.disconnect()
    // сцената се създава наново при „разклащане“ след грешка — измерваме новия панел
  }, [shake])
  const RATIO = SW_VB_H / SW_VB_W
  const availW = box.w - 40 - (sideW ? sideW + 16 : 0)
  // вертикално панелът е под колелото — изваждаме реалната му височина
  const availH = box.h - 84 - 28 - (portrait ? box.side + 12 : 0)
  const wheelSize = box.w ? Math.max(160, Math.min(availW, availH / RATIO)) : portrait ? Math.min(W - 60, (H * 0.45) / RATIO) : 560

  const stepState = (n: 1 | 2 | 3) => (n === 1 ? (stage === 'spin' || stage === 'spinning' ? 'active' : 'done') : n === 2 ? (stage === 'answer' ? 'active' : solved ? 'done' : 'todo') : solved ? 'done' : 'todo')
  const helpDisabled = !hintsOn || stage !== 'answer' || (help === 'limited' && usedHint)
  const helpTitle = help === 'none' ? 'На ниво „Майстор“ смяташ самостоятелно' : !settings.hintsOn ? 'Подсказките са изключени от учителя' : help === 'limited' ? 'Една подсказка на задача' : 'Подсказка'

  return (
    <div className="screen wheel-play spin-play">
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

      <div className={`wp-grid ${narrow ? 'is-narrow' : ''}`}>
        <section className="tb-task">
          <div className="marquee tb-marquee" key={task.id}>
            <span className="marquee__lights" aria-hidden="true" />
            <span className="marquee__label">Завърти колелото</span>
            <span className="marquee__number tb-marquee__text wheel-marquee spin-marquee">{difficulty === 'explorer' ? `Таблица ${tableText}` : 'Смесени задачи'}</span>
          </div>
          <div className="tb-instruction">{instruction}</div>
          <div className="mascot-area">
            <Mascot mood={mood} size={110} />
            <div className={`speech-bubble speech-bubble--game ${feedback?.kind === 'wrong' ? 'is-wrong' : ''}`} key={`${feedback?.kind}-${hint}-${shake}`}>
              {bubble}
            </div>
          </div>
        </section>

        <section className="wp-work" ref={work}>
          <div className={`wp-stage ${feedback?.kind === 'wrong' ? 'is-shake' : ''}`} key={shake}>
            <ParkNightBackdrop />
            <SpinWheel
              sectors={sectors}
              rotation={rotation}
              duration={duration}
              winner={winner}
              hub={task.kind === 'missing' && stage !== 'done' ? '?' : `${task.table} ·`}
              spinning={stage === 'spinning'}
              size={wheelSize}
              onSpin={stage === 'spin' ? spin : stage === 'spinning' ? skip : undefined}
            />
            <div className="wp-side spin-side" ref={side} style={sideW ? { width: sideW } : undefined}>
              <div
                className={`wheel-compute spin-panel ${stage === 'spin' || stage === 'spinning' ? 'is-idle' : ''}`}
                // вертикално клавишите са ~50 реални пиксела на всяко устройство
                style={portrait ? ({ '--key-h': `${Math.round(Math.max(56, Math.min(112, 50 / Math.max(0.1, scale))))}px` } as CSSProperties) : undefined}
              >
                {stage === 'spin' || stage === 'spinning' ? (
                  <>
                    <div className="compute-panel__title">{stage === 'spin' ? 'Готов ли си?' : 'Върти се…'}</div>
                    {stage === 'spin' ? (
                      <GameButton color="green" size="xl" icon="play" onClick={spin} className="spin-go" silent>
                        Завърти!
                      </GameButton>
                    ) : (
                      <GameButton color="purple" size="xl" icon="next" onClick={skip} className="spin-go">
                        Спри
                      </GameButton>
                    )}
                    <div className="spin-panel__note">{difficulty === 'explorer' ? `Таблицата е с ${task.table}.` : 'Колелото избира множителя.'}</div>
                  </>
                ) : (
                  <>
                    <div className="compute-panel__title">{solved ? 'Браво!' : 'Пресметни сам!'}</div>
                    <div className="wheel-eq spin-eq is-active" aria-live="polite">
                      {task.kind === 'missing' ? (
                        <>
                          <span className="wheel-eq__expr">{task.multiplier} ·</span>
                          <span className={`answer-box ${solved ? 'is-correct' : answer ? '' : 'is-empty'}`}>{solved ? task.table : answer || '?'}</span>
                          <span className="wheel-eq__expr">= {task.table * task.multiplier}</span>
                        </>
                      ) : (
                        <>
                          <span className="wheel-eq__expr">{expr.left}</span>
                          <span className={`answer-box ${solved ? 'is-correct' : answer ? '' : 'is-empty'}`}>{expr.right}</span>
                        </>
                      )}
                    </div>
                    {showModel && task.kind === 'normal' && !solved && <DotModel table={task.table} groups={task.multiplier} compact={portrait} />}
                    {!solved && (
                      <div className="keypad" role="group" aria-label="Цифрова клавиатура">
                        {['7', '8', '9', '4', '5', '6', '1', '2', '3'].map((k) => (
                          <button key={k} type="button" className="keypad__key" onClick={() => digit(k)}>
                            {k}
                          </button>
                        ))}
                        <button type="button" className="keypad__key keypad__key--clear" onClick={() => setAnswer('')} disabled={!answer} aria-label="Изтрий всичко">
                          <Icon name="clear" size={30} />
                        </button>
                        <button type="button" className="keypad__key" onClick={() => digit('0')}>
                          0
                        </button>
                        <button type="button" className="keypad__key keypad__key--back" onClick={back} disabled={!answer} aria-label="Изтрий последната цифра">
                          <Icon name="back" size={30} />
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="steps-bar" aria-label="Етапи на задачата">
            {(['Завърти', 'Пресметни', 'Провери'] as const).map((l, i) => {
              const st = stepState((i + 1) as 1 | 2 | 3)
              return (
                <span key={l} className={`step step--${st}`} aria-current={st === 'active' ? 'step' : undefined}>
                  <span className="step__num">{st === 'done' ? <Icon name="check" size={22} /> : i + 1}</span>
                  <span className="step__label">{l}</span>
                </span>
              )
            })}
            <span className="steps-bar__info">{solved ? expr.full : `Таблица ${tableText}`}</span>
          </div>
        </section>

        <section className="actions">
          <GameButton color="green" size="lg" icon="check" onClick={check} disabled={stage !== 'answer'} silent>
            Провери
          </GameButton>
          <GameButton color="orange" size="lg" icon="clear" onClick={reset} disabled={stage !== 'answer'} silent>
            Изтрий
          </GameButton>
          <GameButton color="turquoise" size="lg" icon="help" onClick={askHelp} disabled={helpDisabled} title={helpTitle} silent>
            Помощ
          </GameButton>
          <GameButton color="purple" size="lg" icon="next" onClick={next} disabled={!solved} className={solved ? 'is-ready' : ''}>
            {isLast && solved ? 'Резултат' : 'Следваща задача'}
          </GameButton>
        </section>
      </div>

      {feedback?.kind === 'correct' && (
        <div className="success-overlay">
          <Confetti seed={index + 5} />
          <div className="success-card">
            <div className="success-card__burst" aria-hidden="true" />
            <Mascot mood="cheer" size={150} className="success-card__mascot" />
            <div className="success-card__title">Браво!</div>
            <div className="success-card__praise">{spinPraise(task)}</div>
            <StarRow stars={feedback.stars} size={86} animate />
            <div className="success-card__text">{expr.full}</div>
            <GameButton color="green" size="xl" icon="next" onClick={next} className="success-card__next">
              {isLast ? 'Виж резултата' : 'Следваща задача'}
            </GameButton>
          </div>
        </div>
      )}
    </div>
  )
}
