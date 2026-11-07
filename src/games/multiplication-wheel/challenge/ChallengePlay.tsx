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
import { HELP, STAGES, checkAnswer, hintFor, instruction, praise, riddleText, type ChallengeTask, type MasterTask, type MissingTask } from './logic'
import { AdventurePath, DetectiveScene, MagicianScene, MasterScene } from './Scenes'

type Feedback = null | { kind: 'correct'; stars: 1 | 2 | 3 } | { kind: 'wrong'; message: string } | { kind: 'info'; message: string }

interface Props {
  grade: Grade
  difficulty: Difficulty
  tasks: ChallengeTask[]
  onFinish: (o: TaskOutcome[]) => void
  onExit: () => void
}

const stageIndex = (t: ChallengeTask) => STAGES.findIndex((s) => s.id === t.stage)

/** „Предизвикателството на колелото“: едно приключение в три етапа с общ финал. */
export function ChallengePlay({ grade, difficulty, tasks, onFinish, onExit }: Props) {
  const { settings, play } = useApp()
  const { width: W, portrait, scale } = useStage()
  const [index, setIndex] = useState(0)
  const task = tasks[index]
  const stage = stageIndex(task)
  const help = HELP[difficulty]
  const hintsOn = settings.hintsOn && help !== 'none'

  const [answer, setAnswer] = useState('')
  const [mistakes, setMistakes] = useState(0)
  const [usedHint, setUsedHint] = useState(false)
  const [feedback, setFeedback] = useState<Feedback>(null)
  const [hint, setHint] = useState<string | null>(null)
  const [outcomes, setOutcomes] = useState<TaskOutcome[]>([])
  const [solved, setSolved] = useState(false)
  const [shake, setShake] = useState(0)
  const [picked, setPicked] = useState<number | null>(null)
  const [checked, setChecked] = useState<Set<number>>(new Set())
  const [wiggle, setWiggle] = useState(0)
  const [counted, setCounted] = useState(0)
  /** Преходът към следващ етап (показва се между етапите). */
  const [intro, setIntro] = useState<number | null>(0)
  const [finale, setFinale] = useState(false)

  const isLast = index === tasks.length - 1
  const stars = outcomes.reduce((a, o) => a + o.stars, 0)
  const typed = task.stage !== 'detective'
  const riddle = task.stage === 'master' ? riddleText(task, difficulty) : null

  const fail = (message: string) => {
    setMistakes((m) => m + 1)
    setShake((n) => n + 1)
    setFeedback({ kind: 'wrong', message })
    play('tryAgain')
  }

  const win = () => {
    const s = starsForTask(mistakes, usedHint)
    setSolved(true)
    setOutcomes((o) => [...o, { stars: s, firstTry: mistakes === 0, solved: true }])
    setFeedback({ kind: 'correct', stars: s })
    play('success')
    for (let i = 0; i < s; i++) window.setTimeout(() => play('star'), 650 + i * 230)
  }

  // ── Детектив: докосване на равенство ──
  const pick = (i: number) => {
    if (task.stage !== 'detective' || solved || checked.has(i)) return
    setPicked(i)
    setHint(null)
    if (i === task.wrong) return win()
    // вярното равенство се отбелязва като проверено; детето продължава да търси
    setChecked((c) => new Set(c).add(i))
    fail('Това равенство е вярно. Провери другите.')
  }

  // ── Писане и проверка ──
  const digit = (d: string) => {
    if (!typed || solved) return
    play('click')
    setAnswer((a) => typeDigit(a, d))
    setWiggle((w) => w + 1)
    if (feedback?.kind === 'wrong') setFeedback(null)
  }
  const back = () => {
    if (!typed || solved) return
    play('remove')
    setAnswer((a) => backspace(a))
  }
  const check = () => {
    if (!typed || solved) return
    setHint(null)
    const r = checkAnswer(task as MissingTask | MasterTask, answer)
    if (r.status === 'incomplete') {
      play('hint')
      return setFeedback({ kind: 'info', message: r.message })
    }
    if (r.status === 'wrong') {
      setAnswer('')
      // Откривател: насочваща подсказка веднага след грешка
      const h = help === 'visual' && settings.hintsOn ? hintFor(task, difficulty) : null
      return fail(h ? `${r.message} ${h}` : r.message)
    }
    win()
  }

  const askHelp = () => {
    if (!hintsOn || solved) return
    if (help === 'limited' && usedHint) return
    play('hint')
    setUsedHint(true)
    setFeedback(null)
    setHint(hintFor(task, difficulty))
  }

  const onCabin = (i: number) => {
    if (solved || task.stage !== 'master' || task.kind !== 'groups') return
    play('pick')
    setCounted((c) => Math.max(c, i + 1))
  }

  const next = () => {
    if (!solved) return
    if (isLast) {
      play('fanfare')
      return setFinale(true)
    }
    const nt = tasks[index + 1]
    setIndex(index + 1)
    setAnswer('')
    setMistakes(0)
    setUsedHint(false)
    setFeedback(null)
    setHint(null)
    setSolved(false)
    setPicked(null)
    setChecked(new Set())
    setCounted(0)
    if (stageIndex(nt) !== stage) setIntro(stageIndex(nt))
  }

  // клавиатура
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey || finale) return
      const t = e.target as HTMLElement | null
      if (t && t.tagName === 'BUTTON' && (e.key === 'Enter' || e.key === ' ')) return
      if (intro !== null && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault()
        return setIntro(null)
      }
      if (/^\d$/.test(e.key)) {
        e.preventDefault()
        digit(e.key)
      } else if (e.key === 'Backspace') {
        e.preventDefault()
        back()
      } else if (e.key === 'Enter') {
        e.preventDefault()
        if (solved) next()
        else check()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  // ── размери от реалното място ──
  const areaRef = useRef<HTMLDivElement>(null)
  const [box, setBox] = useState({ w: 0, h: 0 })
  useLayoutEffect(() => {
    const el = areaRef.current
    if (!el) return
    const m = () => setBox({ w: el.clientWidth, h: el.clientHeight })
    m()
    const ro = new ResizeObserver(m)
    ro.observe(el)
    return () => ro.disconnect()
  }, [shake, index])
  const tap = Math.ceil(52 / Math.max(0.1, scale))
  const minFont = Math.ceil(26 / Math.max(0.1, scale))
  // табелите: 3 в ред или 2 × 2 (вертикално — една под друга); всяка е ~8,4 em широка и ~2,6 em висока
  const nEq = task.stage === 'detective' ? task.equations.length : 4
  const cols = portrait ? 1 : nEq === 3 ? 3 : 2
  const rows = Math.ceil(nEq / cols)
  const signFont = Math.round(Math.max(minFont, Math.min(64, (box.w || 600) / (cols * 8.4 + 1), (box.h || 400) / (rows * 2.7 + 2.5))))
  const eqFont = Math.round(Math.max(minFont * 1.2, Math.min(96, (box.w || 600) / 11, (box.h || 400) / 6)))
  const narrow = !portrait && W < 1450
  const phoneLand = !portrait && scale < 0.6

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
  } else bubble = STAGES[stage].intro

  const helpDisabled = !hintsOn || solved || (help === 'limited' && usedHint)
  const helpTitle = help === 'none' ? 'На ниво „Майстор“ работиш самостоятелно' : !settings.hintsOn ? 'Подсказките са изключени от учителя' : help === 'limited' ? 'Една подсказка на задача' : 'Подсказка'
  const stageTasks = tasks.filter((t) => t.stage === task.stage)
  const inStage = stageTasks.findIndex((t) => t.id === task.id) + 1
  const done = STAGES.map((s) => tasks.filter((t) => t.stage === s.id).every((t) => t.id <= outcomes.length))

  return (
    <div className={`screen wheel-play challenge-play ch-stage-${task.stage}`} style={{ '--tap': `${tap}px` } as CSSProperties}>
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

      <div className={`ch-grid ${narrow ? 'is-narrow' : ''} ${phoneLand ? 'is-phone-land' : ''} ${typed ? 'has-pad' : ''}`}>
        <section className="ch-task">
          <div className="marquee tb-marquee ch-marquee" key={task.stage}>
            <span className="marquee__lights" aria-hidden="true" />
            <span className="marquee__label">
              Етап {stage + 1} · {inStage}/{stageTasks.length}
            </span>
            <span className="marquee__number tb-marquee__text ch-marquee__text">{STAGES[stage].label}</span>
          </div>
          <div className="ch-say">
            <div className="tb-instruction">{solved ? praise(task) : instruction(task)}</div>
            <div className="ch-bubble">
              <Mascot mood={mood} size={84} />
              <div className={`speech-bubble speech-bubble--game ${feedback?.kind === 'wrong' ? 'is-wrong' : ''}`} key={`${feedback?.kind}-${hint}-${shake}`}>
                {bubble}
              </div>
            </div>
          </div>
        </section>

        <section className={`wp-stage ch-stagebox ${feedback?.kind === 'wrong' ? 'is-shake' : ''}`} key={shake}>
          <AdventurePath current={stage} done={done} />
          <div className="ch-area" ref={areaRef}>
            {task.stage === 'detective' && <DetectiveScene task={task} picked={picked} solved={solved} wrongTries={checked} font={signFont} onPick={pick} />}
            {task.stage === 'missing' && <MagicianScene task={task} answer={answer} solved={solved} font={eqFont} wiggle={wiggle} onHat={() => (play('pick'), setWiggle((w) => w + 1))} />}
            {task.stage === 'master' && (
              <MasterScene task={task} riddle={riddle} answer={answer} solved={solved} font={eqFont} counted={counted} showTotals={help !== 'none' && settings.hintsOn} onCabin={onCabin} />
            )}
          </div>
        </section>

        <section className="ch-side">
          {typed && (
            <div className="wheel-compute tp-pad ch-pad">
              <div className="keypad" role="group" aria-label="Цифрова клавиатура">
                {['7', '8', '9', '4', '5', '6', '1', '2', '3'].map((k) => (
                  <button key={k} type="button" className="keypad__key" onClick={() => digit(k)} disabled={solved}>
                    {k}
                  </button>
                ))}
                <button type="button" className="keypad__key keypad__key--clear" onClick={() => setAnswer('')} disabled={solved || !answer} aria-label="Изтрий всичко">
                  <Icon name="clear" size={30} />
                </button>
                <button type="button" className="keypad__key" onClick={() => digit('0')} disabled={solved}>
                  0
                </button>
                <button type="button" className="keypad__key keypad__key--back" onClick={back} disabled={solved || !answer} aria-label="Изтрий последната цифра">
                  <Icon name="back" size={30} />
                </button>
              </div>
            </div>
          )}
          <div className="actions tp-actions ch-actions">
            {typed && (
              <GameButton color="green" size="lg" icon="check" onClick={check} disabled={solved} silent>
                Провери
              </GameButton>
            )}
            <GameButton color="turquoise" size="lg" icon="help" onClick={askHelp} disabled={helpDisabled} title={helpTitle} silent>
              Помощ
            </GameButton>
            <GameButton color="purple" size="lg" icon="next" onClick={next} disabled={!solved} className={solved ? 'is-ready' : ''}>
              {isLast && solved ? 'Финал' : 'Следваща'}
            </GameButton>
          </div>
        </section>
      </div>

      {/* преход между етапите */}
      {intro !== null && !finale && (
        <div className="success-overlay ch-intro" role="dialog" aria-label={STAGES[intro].label}>
          <div className="success-card ch-intro__card">
            <div className="success-card__burst" aria-hidden="true" />
            <AdventurePath current={intro} done={done} />
            <div className="ch-intro__step">Етап {intro + 1} от 3</div>
            <div className="success-card__title">{STAGES[intro].label}</div>
            <div className="success-card__praise">{STAGES[intro].intro}</div>
            <GameButton color="green" size="xl" icon="play" onClick={() => (play('drop'), setIntro(null))} className="success-card__next ch-intro__go">
              {intro === 0 ? 'Започни приключението' : 'Напред!'}
            </GameButton>
          </div>
        </div>
      )}

      {feedback?.kind === 'correct' && !finale && (
        <div className="success-overlay">
          <Confetti seed={index + 11} />
          <div className="success-card">
            <div className="success-card__burst" aria-hidden="true" />
            <Mascot mood="cheer" size={150} className="success-card__mascot" />
            <div className="success-card__title">Браво!</div>
            <div className="success-card__praise">{praise(task)}</div>
            <StarRow stars={feedback.stars} size={86} animate />
            <div className="success-card__text">{STAGES[stage].label}</div>
            <GameButton color="green" size="xl" icon="next" onClick={next} className="success-card__next">
              {isLast ? 'Към финала' : 'Следваща задача'}
            </GameButton>
          </div>
        </div>
      )}

      {/* общ финал на приключението */}
      {finale && (
        <div className="success-overlay ch-finale">
          <Confetti seed={99} />
          <div className="success-card ch-finale__card">
            <div className="success-card__burst" aria-hidden="true" />
            <svg className="ch-medal" viewBox="0 0 200 220" aria-hidden="true">
              <path d="M60 0 L90 80 L110 80 L80 0 Z M140 0 L110 80 L90 80 L120 0 Z" fill="#ff5fa2" stroke="#3b2a5a" strokeWidth="5" />
              <circle cx="100" cy="140" r="70" fill="#ffc928" stroke="#3b2a5a" strokeWidth="7" />
              <circle cx="100" cy="140" r="54" fill="none" stroke="#fff3a0" strokeWidth="6" />
              <path d="M100 98 l12 26 28 4 -20 20 5 28 -25 -13 -25 13 5 -28 -20 -20 28 -4z" fill="#fff6a8" stroke="#3b2a5a" strokeWidth="4" strokeLinejoin="round" />
            </svg>
            <div className="success-card__title">Приключението завърши!</div>
            <div className="ch-finale__stages">
              {STAGES.map((s) => {
                const ids = tasks.filter((t) => t.stage === s.id).map((t) => t.id)
                const got = outcomes.filter((_, i) => ids.includes(i + 1)).reduce((a, o) => a + o.stars, 0)
                return (
                  <div key={s.id} className="ch-finale__stage">
                    <b>{s.short}</b>
                    <span>
                      <Icon name="star" size={26} /> {got} / {ids.length * 3}
                    </span>
                  </div>
                )
              })}
            </div>
            <div className="success-card__praise">
              Общо: {stars} от {tasks.length * 3} звезди · решени {outcomes.length} от {tasks.length}
            </div>
            <GameButton color="green" size="xl" icon="next" onClick={() => onFinish(outcomes)} className="success-card__next">
              Виж резултата
            </GameButton>
          </div>
        </div>
      )}
    </div>
  )
}
