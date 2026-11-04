import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
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
import { usePointerDrag } from '../../magic-tokens/usePointerDrag'
import { MAX_PER_CABIN, addPassenger, checkSum, countStepMs, equationTexts, isLocked, removePassenger, runningTotals, type ComputeStep, type GroupsTask } from '../logic'
import { Kid } from '../KidArt'
import { carsHint, carsInstruction, carsSuccessText, carsTitle, checkCars, checkCarsFactor, rightCars } from './logic'
import { TrainBackdrop, TrainScene } from './TrainScene'
import { bestPerRow, trainLayout } from './trainGeometry'

type Stage = 'model' | ComputeStep | 'done'
type Feedback = null | { kind: 'correct'; stars: 1 | 2 | 3 } | { kind: 'wrong'; message: string } | { kind: 'info'; message: string }
type Drag = { from: 'queue' } | { from: 'car'; i: number }


interface Props {
  grade: Grade
  difficulty: Difficulty
  tasks: GroupsTask[]
  onFinish: (o: TaskOutcome[]) => void
  onExit: () => void
}

/**
 * „Веселото влакче“: Представи (деца във вагончетата) → Пресметни (сбор и умножение) → Провери.
 * Същият ход на задачата като при колелото; равните групи са подредени една след друга.
 */
export function TrainBoard({ grade, difficulty, tasks, onFinish, onExit }: Props) {
  const { settings, play } = useApp()
  const { width: W, height: H, portrait } = useStage()
  const [index, setIndex] = useState(0)
  const [cars, setCars] = useState<number[]>(() => [...tasks[0].start])
  const [stage, setStage] = useState<Stage>('model')
  const [answer, setAnswer] = useState('')
  const [mistakes, setMistakes] = useState(0)
  const [usedHint, setUsedHint] = useState(false)
  const [feedback, setFeedback] = useState<Feedback>(null)
  const [hint, setHint] = useState<string | null>(null)
  const [hintCar, setHintCar] = useState<number | null>(null)
  const [outcomes, setOutcomes] = useState<TaskOutcome[]>([])
  const [shake, setShake] = useState(0)
  /** Броене след успех: колко вагончета са преброени (null — няма анимация). */
  const [counted, setCounted] = useState<number | null>(null)

  const task = tasks[index]
  const hintsOn = settings.hintsOn
  const solved = stage === 'done'
  const isLast = index === tasks.length - 1
  const eq = equationTexts(task, stage === 'factor' || solved, solved)
  const title = carsTitle(task)
  const stars = outcomes.reduce((a, o) => a + o.stars, 0)

  const clearMsg = () => {
    setHint(null)
    setHintCar(null)
    if (feedback?.kind !== 'correct') setFeedback(null)
  }

  const add = (i: number) => {
    if (stage !== 'model') return
    if (isLocked(task, i)) {
      play('locked')
      return setFeedback({ kind: 'info', message: 'Първото вагонче е образец. Не го променяй.' })
    }
    const next = addPassenger(task, cars, i)
    if (next === cars) {
      play('locked')
      return setFeedback({ kind: 'info', message: 'Вагончето е пълно.' })
    }
    // Вагончето току-що стана точно колкото трябва — кратко „дзън“.
    play(next[i] === task.size ? 'star' : 'drop')
    setCars(next)
    clearMsg()
  }
  const remove = (i: number) => {
    if (stage !== 'model') return
    const next = removePassenger(task, cars, i)
    if (next === cars) return
    play('remove')
    setCars(next)
    clearMsg()
  }

  // Влачене: дете от перона → вагонче (добавя); дете от вагонче → навън (маха) или в друго вагонче.
  const { drag, bind } = usePointerDrag<Drag>({
    disabled: stage !== 'model',
    onStart: () => play('pick'),
    onTap: (d) => (d.from === 'car' ? add(d.i) : setFeedback({ kind: 'info', message: 'Влачи детето до вагонче — или просто докосни вагончето.' })),
    onDrop: (d, target) => {
      const to = target?.startsWith('car:') ? Number(target.slice(4)) : null
      if (d.from === 'queue') {
        if (to !== null) add(to)
        return
      }
      if (to === d.i) return add(d.i)
      if (cars[d.i] === 0 || isLocked(task, d.i)) return
      if (to !== null) {
        if (isLocked(task, to) || cars[to] >= MAX_PER_CABIN) return add(to)
        const moved = addPassenger(task, removePassenger(task, cars, d.i), to)
        play('drop')
        setCars(moved)
        clearMsg()
      } else remove(d.i)
    },
  })
  const overCar = drag?.over?.startsWith('car:') ? Number(drag.over.slice(4)) : null

  const fail = (message: string) => {
    setMistakes((m) => m + 1)
    setFeedback({ kind: 'wrong', message })
    setShake((n) => n + 1)
    play('tryAgain')
  }

  const check = () => {
    setHint(null)
    if (stage === 'model') {
      const r = checkCars(task, cars, hintsOn)
      if (r.status === 'incomplete') {
        play('hint')
        return setFeedback({ kind: 'info', message: r.message })
      }
      if (r.status === 'wrong') {
        // Неравни групи: не се преминава към умножение; обясняваме защо.
        setHintCar(r.cabin ?? null)
        return fail(r.why ? `${r.message} ${r.why}` : r.message)
      }
      play('star')
      setStage('sum')
      setAnswer('')
      return setFeedback({ kind: 'info', message: 'Всички вагончета са равни! Сега пресметни.' })
    }
    if (stage === 'sum') {
      const r = checkSum(task, answer, hintsOn)
      if (r.status === 'incomplete') return setFeedback({ kind: 'info', message: r.message })
      if (r.status === 'wrong') return fail(r.message)
      play('star')
      setStage('factor')
      setAnswer('')
      return setFeedback({ kind: 'info', message: `Сега запиши с умножение: колко пъти е взето ${task.size}?` })
    }
    if (stage === 'factor') {
      const r = checkCarsFactor(task, answer)
      if (r.status === 'incomplete') return setFeedback({ kind: 'info', message: r.message })
      if (r.status === 'wrong') return fail(r.message)
      const s = starsForTask(mistakes, usedHint)
      setStage('done')
      // Вагончетата светват едно след друго (5 → 10 → 15 → 20), освен при намалено движение.
      const reduce = !settings.animationsOn || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
      if (!reduce) setCounted(0)
      setOutcomes((o) => [...o, { stars: s, firstTry: mistakes === 0, solved: true }])
      setFeedback({ kind: 'correct', stars: s })
      play('success')
      for (let i = 0; i < s; i++) window.setTimeout(() => play('star'), 650 + i * 230)
    }
  }

  const skipCount = () => setCounted(null)

  // Стъпки на броенето; след последната — кратка пауза и поздравителния прозорец.
  useEffect(() => {
    if (counted === null) return
    const step = countStepMs(task.groups)
    const t = window.setTimeout(() => {
      if (counted >= task.groups) setCounted(null)
      else {
        play('pick')
        setCounted(counted + 1)
      }
    }, counted === 0 ? 250 : counted >= task.groups ? 900 : step)
    return () => window.clearTimeout(t)
  }, [counted, task.groups, play])

  const reset = () => {
    if (solved) return
    play('remove')
    if (stage === 'model') setCars([...task.start])
    else setAnswer('')
    clearMsg()
  }

  const help = () => {
    if (!hintsOn || solved) return
    play('hint')
    setUsedHint(true)
    setFeedback(null)
    setHint(carsHint(task, cars, stage === 'model' ? 'model' : stage))
    if (stage === 'model') setHintCar(checkCars(task, cars).cabin ?? null)
  }

  const next = () => {
    if (!solved) return
    if (isLast) {
      play('fanfare')
      return onFinish(outcomes)
    }
    const t = tasks[index + 1]
    setIndex(index + 1)
    setCars([...t.start])
    setStage('model')
    setAnswer('')
    setMistakes(0)
    setUsedHint(false)
    setFeedback(null)
    setHint(null)
    setHintCar(null)
    setCounted(null)
  }

  const digit = (d: string) => {
    if (stage !== 'sum' && stage !== 'factor') return
    play('click')
    setAnswer((a) => typeDigit(a, d))
    if (feedback?.kind !== 'correct') setFeedback(null)
  }
  const back = () => {
    if (stage !== 'sum' && stage !== 'factor') return
    play('remove')
    setAnswer((a) => backspace(a))
  }

  // Клавиш Enter, интервал или Escape пропуска броенето.
  useEffect(() => {
    if (counted === null) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') {
        e.preventDefault()
        setCounted(null)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [counted])

  // Физическа клавиатура при пресмятане.
  useEffect(() => {
    if (stage !== 'sum' && stage !== 'factor') return
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return
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
  } else if (feedback?.kind === 'info') {
    mood = 'think'
    bubble = feedback.message
  } else if (hint) {
    mood = 'think'
    bubble = (
      <>
        <b className="bubble-title">Подсказка</b>
        {hint}
      </>
    )
  } else if (solved) {
    mood = 'cheer'
    bubble = carsSuccessText(task)
  } else if (stage === 'model') {
    const ok = rightCars(task, cars)
    bubble = ok > 0 && ok < task.groups ? `Готови вагончета: ${ok} от ${task.groups}. Продължавай!` : 'Докосни вагонче, за да качиш дете.'
  } else bubble = 'Пресметни и запиши отговора.'

  const instruction = solved ? `Броим по ${task.size}: ${runningTotals(task).join(' → ')}.` : stage === 'model' ? carsInstruction(task) : stage === 'sum' ? 'Колко деца има общо? Пресметни и запиши.' : `Колко пъти е взето ${task.size}? Запиши.`
  // На тесни хоризонтални екрани (4:3) страничните панели са по-тесни.
  const narrow = !portrait && W < 1450
  const sideW = portrait ? 0 : stage === 'model' ? (narrow ? 170 : 220) : narrow ? 280 : 330
  // Влакчето заема реално свободното място в средната част (измерено, не изчислено).
  const work = useRef<HTMLElement>(null)
  const [box, setBox] = useState({ w: 0, h: 0 })
  useLayoutEffect(() => {
    const el = work.current
    if (!el) return
    const m = () => setBox({ w: el.clientWidth, h: el.clientHeight })
    m()
    const ro = new ResizeObserver(m)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  const availW = (box.w || W * 0.55) - 40 - (sideW ? sideW + 16 : 0)
  const availH = (box.h || H * 0.6) - 84 - 28 - (portrait ? (stage === 'model' ? 150 : 250) : 0)
  // подредбата остава същата през цялата задача (не прескача при „Пресметни“)
  const modelH = (box.h || H * 0.6) - 84 - 28 - (portrait ? 250 : 0)
  const modelW = (box.w || W * 0.55) - 40 - (portrait ? 0 : (narrow ? 280 : 330) + 16)
  const layout = trainLayout(task.groups, bestPerRow(task.groups, modelW, modelH))
  const trainSize = Math.max(260, Math.min(availW, (availH * layout.width) / layout.height))
  // следващото дете на перона изглежда различно
  const queueKid = cars.reduce((a, b) => a + b, 0) + index * 3

  const stepState = (n: 1 | 2 | 3) => (n === 1 ? (stage === 'model' ? 'active' : 'done') : n === 2 ? (stage === 'sum' || stage === 'factor' ? 'active' : solved ? 'done' : 'todo') : solved ? 'done' : 'todo')

  return (
    <div className="screen wheel-play train-play">
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
            <span className="marquee__label">{title.label}</span>
            <span className="marquee__number tb-marquee__text wheel-marquee">{title.text}</span>
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
            <TrainBackdrop />
            <TrainScene
              layout={layout}
              cars={cars}
              target={task.size}
              locked={(i) => isLocked(task, i)}
              onAdd={add}
              onRemove={remove}
              bindCar={(i) => bind({ from: 'car', i })}
              highlight={hintCar}
              over={overCar}
              disabled={stage !== 'model'}
              departing={solved && counted === null}
              counted={counted}
              totals={runningTotals(task)}
              size={trainSize}
            />
            <div className="wp-side" style={sideW ? { width: sideW } : undefined}>
              {stage === 'model' ? (
                <div className="kid-queue">
                  <div className="kid-queue__title">Перон</div>
                  <div className="kid-queue__kid" {...bind({ from: 'queue' })} role="button" aria-label="Дете от перона — влачи го до вагонче">
                    <svg viewBox="-60 -110 120 120" width="110" height="110" aria-hidden="true">
                      <Kid x={0} y={0} s={100} v={queueKid} />
                    </svg>
                  </div>
                  <div className="kid-queue__hint">Влачи до вагонче или докосни вагончето.</div>
                </div>
              ) : (
                <div className="wheel-compute">
                  <div className="compute-panel__title">{solved ? 'Браво!' : 'Сега пресметни сам!'}</div>
                  <div className={`wheel-eq ${stage === 'sum' ? 'is-active' : 'is-done'}`}>
                    <span className="wheel-eq__expr">{eq.sum}</span>
                    <span className={`answer-box ${stage === 'sum' ? (answer ? '' : 'is-empty') : 'is-correct'}`}>{stage === 'sum' ? answer || '?' : eq.sumAnswer}</span>
                  </div>
                  {eq.factor && (
                    <div className={`wheel-eq ${stage === 'factor' ? 'is-active' : 'is-done'}`}>
                      <span className="wheel-eq__expr">{task.size} ·</span>
                      <span className={`answer-box ${stage === 'factor' ? (answer ? '' : 'is-empty') : 'is-correct'}`}>{stage === 'factor' ? answer || '?' : task.groups}</span>
                      <span className="wheel-eq__expr">= {eq.sumAnswer}</span>
                    </div>
                  )}
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
                </div>
              )}
            </div>
          </div>
          <div className="steps-bar" aria-label="Етапи на задачата">
            {(['Представи', 'Пресметни', 'Провери'] as const).map((l, i) => {
              const st = stepState((i + 1) as 1 | 2 | 3)
              return (
                <span key={l} className={`step step--${st}`} aria-current={st === 'active' ? 'step' : undefined}>
                  <span className="step__num">{st === 'done' ? <Icon name="check" size={22} /> : i + 1}</span>
                  <span className="step__label">{l}</span>
                </span>
              )
            })}
            <span className="steps-bar__info">{solved ? eq.full : stage === 'model' ? `${task.groups} вагончета` : eq.sum.replace(/ =$/, '')}</span>
          </div>
        </section>

        <section className="actions">
          <GameButton color="green" size="lg" icon="check" onClick={check} disabled={solved} silent>
            Провери
          </GameButton>
          <GameButton color="orange" size="lg" icon="clear" onClick={reset} disabled={solved} silent>
            {stage === 'model' ? 'Изчисти' : 'Изтрий'}
          </GameButton>
          <GameButton color="turquoise" size="lg" icon="help" onClick={help} disabled={!hintsOn || solved} title={hintsOn ? 'Подсказка' : 'Подсказките са изключени от учителя'} silent>
            Помощ
          </GameButton>
          <GameButton color="purple" size="lg" icon="next" onClick={next} disabled={!solved} className={solved ? 'is-ready' : ''}>
            {isLast && solved ? 'Резултат' : 'Следваща задача'}
          </GameButton>
        </section>
      </div>

      {drag && (
        <div className={`drag-ghost ${drag.over ? 'is-over' : ''}`} style={{ left: drag.x, top: drag.y }} aria-hidden="true">
          <svg viewBox="-60 -110 120 120" width="96" height="96">
            <Kid x={0} y={0} s={100} v={queueKid} />
          </svg>
        </div>
      )}

      {counted !== null && (
        <div className="count-strip" role="status" aria-live="polite">
          <span className="count-strip__label">Броим:</span>
          <span className="count-strip__steps">
            {runningTotals(task)
              .slice(0, Math.max(1, counted))
              .map((v, i) => (
                <span key={i} className="count-strip__step">
                  {i > 0 && <span className="count-strip__arrow">→</span>}
                  <b>{v}</b>
                </span>
              ))}
          </span>
          <button type="button" className="count-strip__skip" onClick={skipCount}>
            Пропусни <Icon name="next" size={22} />
          </button>
        </div>
      )}

      {feedback?.kind === 'correct' && counted === null && (
        <div className="success-overlay">
          <Confetti seed={index + 3} />
          <div className="success-card">
            <div className="success-card__burst" aria-hidden="true" />
            <Mascot mood="cheer" size={150} className="success-card__mascot" />
            <div className="success-card__title">Браво!</div>
            <div className="success-card__praise">{carsSuccessText(task)}</div>
            <StarRow stars={feedback.stars} size={86} animate />
            <div className="success-card__text">{eq.full}</div>
            <GameButton color="green" size="xl" icon="next" onClick={next} className="success-card__next">
              {isLast ? 'Виж резултата' : 'Следваща задача'}
            </GameButton>
          </div>
        </div>
      )}
    </div>
  )
}
