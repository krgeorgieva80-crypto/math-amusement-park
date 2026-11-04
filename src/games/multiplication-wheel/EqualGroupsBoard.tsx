import { useEffect, useState, type ReactNode } from 'react'
import { useApp } from '../../core/AppContext'
import { useStage } from '../../core/Stage'
import { Mascot, type MascotMood } from '../../components/art/Mascot'
import { Confetti, StarRow } from '../../components/ui/Effects'
import { GameButton } from '../../components/ui/GameButton'
import { GradeTicket } from '../../components/ui/GradeTicket'
import { Icon } from '../../components/ui/Icon'
import { SoundControl } from '../../components/ui/SoundControl'
import { BoothBackdrop } from '../magic-tokens/BoothBackdrop'
import { backspace, typeDigit } from '../magic-tokens/compute'
import { DIFFICULTY_LABELS, starsForTask, type Difficulty, type Grade } from '../magic-tokens/logic'
import type { TaskOutcome } from '../magic-tokens/PlayBoard'
import { usePointerDrag } from '../magic-tokens/usePointerDrag'
import {
  addPassenger,
  checkFactor,
  checkGroups,
  checkSum,
  equationTexts,
  groupsHint,
  groupsInstruction,
  groupsTitle,
  isLocked,
  removePassenger,
  type ComputeStep,
  type GroupsTask,
} from './logic'
import { WheelBoard } from './WheelBoard'

type Stage = 'model' | ComputeStep | 'done'
type Feedback = null | { kind: 'correct'; stars: 1 | 2 | 3 } | { kind: 'wrong'; message: string } | { kind: 'info'; message: string }
type Drag = { from: 'queue' } | { from: 'cabin'; i: number }

const PRAISE = ['Супер си!', 'Отлично!', 'Чудесно!', 'Страхотно!', 'Точно така!']

interface Props {
  grade: Grade
  difficulty: Difficulty
  tasks: GroupsTask[]
  onFinish: (o: TaskOutcome[]) => void
  onExit: () => void
}

/** „Открий равните групи“: Представи (кабинки) → Пресметни (сбор и умножение) → Провери. */
export function EqualGroupsBoard({ grade, difficulty, tasks, onFinish, onExit }: Props) {
  const { settings, play } = useApp()
  const { width: W, height: H, portrait } = useStage()
  const [index, setIndex] = useState(0)
  const [cabins, setCabins] = useState<number[]>(() => [...tasks[0].start])
  const [stage, setStage] = useState<Stage>('model')
  const [answer, setAnswer] = useState('')
  const [mistakes, setMistakes] = useState(0)
  const [usedHint, setUsedHint] = useState(false)
  const [feedback, setFeedback] = useState<Feedback>(null)
  const [hint, setHint] = useState<string | null>(null)
  const [hintCabin, setHintCabin] = useState<number | null>(null)
  const [outcomes, setOutcomes] = useState<TaskOutcome[]>([])
  const [shake, setShake] = useState(0)

  const task = tasks[index]
  const hintsOn = settings.hintsOn
  const solved = stage === 'done'
  const isLast = index === tasks.length - 1
  const eq = equationTexts(task, stage === 'factor' || solved, solved)
  const title = groupsTitle(task)
  const stars = outcomes.reduce((a, o) => a + o.stars, 0)

  const clearMsg = () => {
    setHint(null)
    setHintCabin(null)
    if (feedback?.kind !== 'correct') setFeedback(null)
  }

  const add = (i: number) => {
    if (stage !== 'model') return
    if (isLocked(task, i)) {
      play('locked')
      return setFeedback({ kind: 'info', message: 'Първата кабинка е образец. Не я променяй.' })
    }
    const next = addPassenger(task, cabins, i)
    if (next === cabins) {
      play('locked')
      return setFeedback({ kind: 'info', message: 'Кабинката е пълна.' })
    }
    play('drop')
    setCabins(next)
    clearMsg()
  }
  const remove = (i: number) => {
    if (stage !== 'model') return
    const next = removePassenger(task, cabins, i)
    if (next === cabins) return
    play('remove')
    setCabins(next)
    clearMsg()
  }

  // Влачене: дете от опашката → кабинка (добавя); дете от кабинка → навън (маха) или в друга кабинка.
  const { drag, bind } = usePointerDrag<Drag>({
    disabled: stage !== 'model',
    onStart: () => play('pick'),
    onTap: (d) => (d.from === 'cabin' ? add(d.i) : setFeedback({ kind: 'info', message: 'Влачи детето до кабинка — или просто докосни кабинката.' })),
    onDrop: (d, target) => {
      const to = target?.startsWith('cabin:') ? Number(target.slice(6)) : null
      if (d.from === 'queue') {
        if (to !== null) add(to)
        return
      }
      if (to === d.i) return add(d.i)
      if (cabins[d.i] === 0 || isLocked(task, d.i)) return
      if (to !== null) {
        if (isLocked(task, to) || cabins[to] >= 10) return add(to)
        const moved = addPassenger(task, removePassenger(task, cabins, d.i), to)
        play('drop')
        setCabins(moved)
        clearMsg()
      } else remove(d.i)
    },
  })
  const overCabin = drag?.over?.startsWith('cabin:') ? Number(drag.over.slice(6)) : null

  const fail = (message: string) => {
    setMistakes((m) => m + 1)
    setFeedback({ kind: 'wrong', message })
    setShake((n) => n + 1)
    play('tryAgain')
  }

  const check = () => {
    setHint(null)
    if (stage === 'model') {
      const r = checkGroups(task, cabins, hintsOn)
      if (r.status === 'incomplete') {
        play('hint')
        return setFeedback({ kind: 'info', message: r.message })
      }
      if (r.status === 'wrong') {
        setHintCabin(r.cabin ?? null)
        return fail(r.message)
      }
      play('star')
      setStage('sum')
      setAnswer('')
      return setFeedback({ kind: 'info', message: 'Кабинките са равни! Сега пресметни.' })
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
      const r = checkFactor(task, answer)
      if (r.status === 'incomplete') return setFeedback({ kind: 'info', message: r.message })
      if (r.status === 'wrong') return fail(r.message)
      const s = starsForTask(mistakes, usedHint)
      setStage('done')
      setOutcomes((o) => [...o, { stars: s, firstTry: mistakes === 0, solved: true }])
      setFeedback({ kind: 'correct', stars: s })
      play('success')
      for (let i = 0; i < s; i++) window.setTimeout(() => play('star'), 650 + i * 230)
    }
  }

  const reset = () => {
    if (solved) return
    play('remove')
    if (stage === 'model') setCabins([...task.start])
    else setAnswer('')
    clearMsg()
  }

  const help = () => {
    if (!hintsOn || solved) return
    play('hint')
    setUsedHint(true)
    setFeedback(null)
    setHint(groupsHint(task, cabins, stage === 'model' ? 'model' : stage))
    if (stage === 'model') setHintCabin(checkGroups(task, cabins).cabin ?? null)
  }

  const next = () => {
    if (!solved) return
    if (isLast) {
      play('fanfare')
      return onFinish(outcomes)
    }
    const t = tasks[index + 1]
    setIndex(index + 1)
    setCabins([...t.start])
    setStage('model')
    setAnswer('')
    setMistakes(0)
    setUsedHint(false)
    setFeedback(null)
    setHint(null)
    setHintCabin(null)
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
    bubble = 'Ура!'
  } else bubble = stage === 'model' ? 'Докосни кабинка, за да сложиш дете.' : 'Пресметни и запиши отговора.'

  const instruction = stage === 'model' ? groupsInstruction(task) : stage === 'sum' ? 'Колко деца има общо? Пресметни и запиши.' : `Колко пъти е взето ${task.size}? Запиши.`
  const wheelSize = portrait ? Math.min(W - 50, H * 0.5) : Math.min(700, H - 220)

  const stepState = (n: 1 | 2 | 3) => (n === 1 ? (stage === 'model' ? 'active' : 'done') : n === 2 ? (stage === 'sum' || stage === 'factor' ? 'active' : solved ? 'done' : 'todo') : solved ? 'done' : 'todo')

  return (
    <div className="screen wheel-play">
      <BoothBackdrop />
      <div className="top-bar">
        <GameButton color="yellow" size="md" icon="map" onClick={onExit}>
          Към парка
        </GameButton>
        <GradeTicket grade={grade} />
        <div className="level-chip">Равни групи · {DIFFICULTY_LABELS[difficulty]}</div>
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

      <div className="wp-grid">
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

        <section className="wp-work">
          <div className={`wp-stage ${feedback?.kind === 'wrong' ? 'is-shake' : ''}`} key={shake}>
            <WheelBoard
              cabins={cabins}
              locked={(i) => isLocked(task, i)}
              onAdd={add}
              onRemove={remove}
              bindCabin={(i) => bind({ from: 'cabin', i })}
              highlight={hintCabin}
              over={overCabin}
              disabled={stage !== 'model'}
              spinning={solved}
              size={wheelSize}
            />
            <div className="wp-side">
              {stage === 'model' ? (
                <div className="kid-queue">
                  <div className="kid-queue__title">Опашка</div>
                  <div className="kid-queue__kid" {...bind({ from: 'queue' })} role="button" aria-label="Дете от опашката — влачи го до кабинка">
                    <svg viewBox="-30 -30 60 60" width="96" height="96" aria-hidden="true">
                      <circle r="26" fill="#ffcf9e" stroke="#3b2a5a" strokeWidth="3" />
                      <path d="M-26 -4 a26 26 0 0 1 52 0 q-26 -14 -52 0z" fill="#7a4b1e" />
                      <circle cx="-9" cy="3" r="3.4" fill="#3b2a5a" />
                      <circle cx="9" cy="3" r="3.4" fill="#3b2a5a" />
                      <path d="M-9 11 q9 8 18 0" fill="none" stroke="#3b2a5a" strokeWidth="3" strokeLinecap="round" />
                    </svg>
                  </div>
                  <div className="kid-queue__hint">Влачи до кабинка или докосни кабинката.</div>
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
            <span className="steps-bar__info">{solved ? eq.full : stage === 'model' ? `${task.groups} кабинки` : eq.sum.replace(/ =$/, '')}</span>
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
          <svg viewBox="-30 -30 60 60" width="80" height="80">
            <circle r="26" fill="#ffcf9e" stroke="#3b2a5a" strokeWidth="3" />
            <path d="M-26 -4 a26 26 0 0 1 52 0 q-26 -14 -52 0z" fill="#7a4b1e" />
            <circle cx="-9" cy="3" r="3.4" fill="#3b2a5a" />
            <circle cx="9" cy="3" r="3.4" fill="#3b2a5a" />
          </svg>
        </div>
      )}

      {feedback?.kind === 'correct' && (
        <div className="success-overlay">
          <Confetti seed={index + 3} />
          <div className="success-card">
            <div className="success-card__burst" aria-hidden="true" />
            <Mascot mood="cheer" size={150} className="success-card__mascot" />
            <div className="success-card__title">Браво!</div>
            <div className="success-card__praise">{PRAISE[index % PRAISE.length]}</div>
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
