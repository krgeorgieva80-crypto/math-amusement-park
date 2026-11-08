import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from 'react'
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
import { fmt } from '../build/logic'
import { FitText } from '../FitText'
import { TowerBackdrop, TowerScene, type Floor } from '../TowerScene'
import { HELP, MAX_DIGITS, checkSecret, choicesFor, ruleText, secretHint, type SecretTask } from './logic'

type Feedback = null | { kind: 'correct'; stars: 1 | 2 | 3 } | { kind: 'wrong'; message: string } | { kind: 'info'; message: string }

interface Props {
  grade: Grade
  difficulty: Difficulty
  tasks: SecretTask[]
  onFinish: (o: TaskOutcome[]) => void
  onExit: () => void
}

/** Текст, в който думите с тире не се разделят на два реда. */
function Words({ text }: { text: string }) {
  return <>{text.split(' ').flatMap((w, i) => [i ? ' ' : '', <span key={i} className="nt-word">{w}</span>])}</>
}

/** Ключовете на клавиатурата: 3 колони (хоризонтално) и 6 колони на 2 реда (вертикално) — подредбата е чрез CSS order. */
const KEYS: { k: string; o3: number; o6: number }[] = [
  ...['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((k, i) => ({ k, o3: i, o6: i < 5 ? i : i + 1 })),
  { k: 'clear', o3: 9, o6: 11 },
  { k: '0', o3: 10, o6: 10 },
  { k: 'back', o3: 11, o6: 5 },
]

/** „Тайните етажи“: открий числата в тъмните прозорци на кулата. */
export function SecretBoard({ grade, difficulty, tasks, onFinish, onExit }: Props) {
  const { settings, play } = useApp()
  const { scale, portrait } = useStage()
  const [index, setIndex] = useState(0)
  const task = tasks[index]
  const help = HELP[difficulty]
  const hintsOn = settings.hintsOn && help !== 'none'
  const explorer = difficulty === 'explorer'
  const choices = useMemo(() => (explorer ? choicesFor(task, grade) : []), [task, grade, explorer])

  const [typed, setTyped] = useState<Record<number, string>>({})
  const [active, setActive] = useState(tasks[0].hidden[0])
  const [choice, setChoice] = useState<number | null>(null)
  const [lit, setLit] = useState<Set<number>>(new Set())
  const [wrongAt, setWrongAt] = useState<Set<number>>(new Set())
  const [mistakes, setMistakes] = useState(0)
  const [usedHint, setUsedHint] = useState(false)
  const [hint, setHint] = useState<{ text: string; pair: [number, number] | null } | null>(null)
  const [feedback, setFeedback] = useState<Feedback>(null)
  const [outcomes, setOutcomes] = useState<TaskOutcome[]>([])
  const [solved, setSolved] = useState(false)
  const [shake, setShake] = useState(0)

  const isLast = index === tasks.length - 1
  const stars = outcomes.reduce((a, o) => a + o.stars, 0)
  const open = task.hidden.filter((i) => !lit.has(i))
  const two = task.hidden.length === 2

  const clearMsg = () => {
    setHint(null)
    if (feedback?.kind !== 'correct') setFeedback(null)
  }

  // ── въвеждане ──
  const pressKey = (k: string) => {
    if (solved || explorer || lit.has(active)) return
    play('pick')
    clearMsg()
    setWrongAt((w) => {
      const n = new Set(w)
      n.delete(active)
      return n
    })
    setTyped((t) => {
      const cur = t[active] ?? ''
      if (k === 'clear') return { ...t, [active]: '' }
      if (k === 'back') return { ...t, [active]: cur.slice(0, -1) }
      if (cur.length >= MAX_DIGITS[grade]) return t
      return { ...t, [active]: cur === '0' ? k : cur + k }
    })
  }

  const selectWindow = (i: number) => {
    if (solved || !task.hidden.includes(i) || lit.has(i)) {
      if (lit.has(i)) setFeedback({ kind: 'info', message: 'Този прозорец вече свети.' })
      return
    }
    play('pick')
    setActive(i)
  }

  const pickChoice = (v: number) => {
    if (solved) return
    play('pick')
    clearMsg()
    setWrongAt(new Set())
    setChoice(v)
  }

  const answerOf = (i: number): number | null => {
    if (explorer) return choice
    const s = typed[i]
    return s ? Number(s) : null
  }

  const check = () => {
    if (solved) return
    setHint(null)
    const r = checkSecret(task, Object.fromEntries(open.map((i) => [i, answerOf(i)])))
    if (r.empty.length) {
      play('hint')
      if (!explorer) setActive(r.empty[0])
      return setFeedback({ kind: 'info', message: explorer ? 'Първо избери едно от трите числа.' : two && r.empty.length === 1 && open.length === 2 ? 'Напиши число и в другия тъмен прозорец.' : 'Напиши числото с клавиатурата.' })
    }
    const nowLit = new Set([...lit, ...r.correct])
    setLit(nowLit)
    if (r.wrong.length) {
      // верните прозорци светват; грешният се изчиства — отговорът не се показва
      setWrongAt(new Set(r.wrong))
      setMistakes((m) => m + 1)
      setShake((x) => x + 1)
      play('tryAgain')
      if (explorer) setChoice(null)
      else {
        setTyped((t) => ({ ...t, ...Object.fromEntries(r.wrong.map((i) => [i, ''])) }))
        setActive(r.wrong[0])
      }
      const part = r.correct.length ? 'Единият прозорец светна! ' : ''
      return setFeedback({ kind: 'wrong', message: `${part}Това число не пасва. Провери с колко се променя числото от етаж на етаж.` })
    }
    const s = starsForTask(mistakes, usedHint)
    setSolved(true)
    setOutcomes((o) => [...o, { stars: s, firstTry: mistakes === 0, solved: true }])
    setFeedback({ kind: 'correct', stars: s })
    play('success')
    for (let k = 0; k < s; k++) window.setTimeout(() => play('star'), 900 + k * 230)
  }

  const askHelp = () => {
    if (!hintsOn || solved) return
    if (help === 'limited' && usedHint) return
    play('hint')
    setUsedHint(true)
    setFeedback(null)
    setHint(secretHint(task, help === 'visual' ? 'visual' : 'limited'))
  }

  const next = () => {
    if (!solved) return
    if (isLast) {
      play('fanfare')
      return onFinish(outcomes)
    }
    const t = tasks[index + 1]
    setIndex(index + 1)
    setTyped({})
    setActive(t.hidden[0])
    setChoice(null)
    setLit(new Set())
    setWrongAt(new Set())
    setMistakes(0)
    setUsedHint(false)
    setHint(null)
    setFeedback(null)
    setSolved(false)
  }

  // физическа клавиатура: цифри, Backspace, Delete, Enter, стрелки (между двата прозореца)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null
      if (el && (el.tagName === 'BUTTON' || el.getAttribute('role') === 'button') && (e.key === 'Enter' || e.key === ' ')) return
      if (/^[0-9]$/.test(e.key)) pressKey(e.key)
      else if (e.key === 'Backspace') pressKey('back')
      else if (e.key === 'Delete') pressKey('clear')
      else if (e.key === 'Enter') {
        e.preventDefault()
        if (solved) next()
        else check()
      } else if (two && (e.key === 'ArrowUp' || e.key === 'ArrowDown') && !explorer) {
        const o = open.filter((i) => i !== active)
        if (o.length) selectWindow(o[0])
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const floors: Floor[] = task.values.map((v, i) => {
    if (!task.hidden.includes(i)) return { label: fmt(v), hint: !!hint?.pair?.includes(i) }
    if (lit.has(i) || solved) return { label: fmt(v), state: 'glow' }
    const shown = explorer ? choice : typed[i] ? Number(typed[i]) : null
    return { label: shown === null ? null : fmt(shown), state: 'hidden', active: !explorer && i === active }
  })

  let mood: MascotMood = 'happy'
  let bubble: ReactNode
  if (feedback?.kind === 'wrong') {
    mood = 'encourage'
    bubble = <Words text={feedback.message} />
  } else if (hint) {
    mood = 'think'
    bubble = (
      <>
        <b className="bubble-title">Подсказка</b>
        <Words text={hint.text} />
      </>
    )
  } else if (feedback?.kind === 'info') {
    mood = 'think'
    bubble = <Words text={feedback.message} />
  } else if (solved) {
    mood = 'cheer'
    bubble = <Words text={two ? 'Браво! Тайните прозорци светнаха!' : 'Браво! Тайният прозорец светна!'} />
  } else bubble = <Words text={explorer ? 'Избери едно от трите числа.' : two ? 'Докосни поле или тъмен прозорец и напиши числото.' : 'Напиши числото с клавиатурата.'} />

  const tap = Math.ceil(52 / Math.max(0.1, scale))
  const helpDisabled = !hintsOn || solved || (help === 'limited' && usedHint)
  const helpTitle =
    help === 'none' ? 'На ниво „Майстор“ работиш самостоятелно' : !settings.hintsOn ? 'Подсказките са изключени от учителя' : help === 'limited' ? 'Една подсказка на задача' : 'Подсказка'
  const longest = Math.max(...task.values.map((v) => fmt(v).length))
  const fieldName = (i: number) => (two ? (i === task.hidden[0] ? 'Долу' : 'Горе') : 'Тайният прозорец')

  return (
    <div className="screen wheel-play nt-play nt-secret-play" style={{ '--tap': `${tap}px`, '--chars': longest } as CSSProperties}>
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
            <FitText text="Тайните етажи" max={portrait ? 56 : 40} className="marquee__label nt-marquee__title" />
          </div>
          <div className="nt-say">
            <div className="tb-instruction nt-instruction">
              <b>{two ? 'Открий двете тайни числа.' : 'Открий тайното число.'}</b>
              <span>
                <Words text="Етажите се променят с едно и също число." />
              </span>
            </div>
            <div className="nt-bubble">
              <Mascot mood={mood} size={72} />
              <div className={`speech-bubble speech-bubble--game ${feedback?.kind === 'wrong' ? 'is-wrong' : ''}`} key={`${feedback?.kind}-${hint?.text}-${shake}`}>
                {bubble}
              </div>
            </div>
          </div>
        </section>

        <section className={`wp-stage nt-stage nt-night ${feedback?.kind === 'wrong' ? 'is-shake' : ''}`}>
          <TowerBackdrop />
          <svg className="nt-moon" viewBox="0 0 100 100" aria-hidden="true">
            <circle cx="50" cy="50" r="46" fill="#fff6c8" opacity="0.25" />
            <path d="M62 14 A36 36 0 1 0 86 66 A30 30 0 1 1 62 14 Z" fill="#fff3a0" stroke="#3b2a5a" strokeWidth="4" />
          </svg>
          <div className="nt-secret-tower">
            <TowerScene floors={floors} topLit={solved} celebrate={solved} width={420} onFloor={selectWindow} />
          </div>
        </section>

        <section className="nt-side nt-secret-side">
          {explorer ? (
            <div className="nt-lanterns" role="radiogroup" aria-label="Кое число е в тъмния прозорец?">
              {choices.map((v) => (
                <button
                  key={v}
                  type="button"
                  role="radio"
                  aria-checked={choice === v}
                  data-choice={v}
                  className={`nt-lantern ${choice === v ? 'is-on' : ''}`}
                  onClick={() => pickChoice(v)}
                  disabled={solved}
                >
                  <svg className="nt-lantern__icon" viewBox="0 0 40 52" aria-hidden="true">
                    <path d="M8 12 H32 L28 44 H12 Z" fill="currentColor" stroke="#3b2a5a" strokeWidth="4" />
                    <rect x="6" y="42" width="28" height="8" rx="4" fill="#ffc928" stroke="#3b2a5a" strokeWidth="3" />
                    <path d="M14 6 H26" stroke="#3b2a5a" strokeWidth="4" strokeLinecap="round" />
                  </svg>
                  <span className="nt-lantern__num" style={{ '--len': Math.max(3, fmt(v).length) } as CSSProperties}>
                    {fmt(v)}
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <div className="nt-pad">
              <div className={`nt-fields ${two ? 'is-two' : ''}`}>
                {[...task.hidden].reverse().map((i) => {
                  const done = lit.has(i) || solved
                  const val = done ? fmt(task.values[i]) : typed[i] ? fmt(Number(typed[i])) : ''
                  return (
                    <button
                      key={i}
                      type="button"
                      data-field={i}
                      className={`nt-field ${i === active && !done ? 'is-active' : ''} ${done ? 'is-correct' : ''} ${wrongAt.has(i) ? 'is-wrong' : ''}`}
                      onClick={() => selectWindow(i)}
                      aria-label={`${two ? (i === task.hidden[0] ? 'Долният' : 'Горният') + ' таен прозорец' : 'Тайният прозорец'}: ${val || 'празно'}`}
                      aria-pressed={i === active && !done}
                    >
                      <span className="nt-field__name">{fieldName(i)}</span>
                      <span className={`nt-field__value ${val ? '' : 'is-empty'}`} style={{ '--len': Math.max(3, val.length) } as CSSProperties}>
                        {val || '?'}
                      </span>
                    </button>
                  )
                })}
              </div>
              <div className="nt-keypad" role="group" aria-label="Цифрова клавиатура">
                {KEYS.map(({ k, o3, o6 }) => (
                  <button
                    key={k}
                    type="button"
                    className={`nt-key ${k === 'clear' ? 'nt-key--clear' : k === 'back' ? 'nt-key--back' : ''}`}
                    style={{ '--o3': o3, '--o6': o6 } as CSSProperties}
                    onClick={() => pressKey(k)}
                    disabled={solved || lit.has(active)}
                    aria-label={k === 'clear' ? 'Изтрий числото' : k === 'back' ? 'Изтрий последната цифра' : k}
                  >
                    {k === 'clear' ? <Icon name="clear" size={30} /> : k === 'back' ? <Icon name="back" size={30} /> : k}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="nt-secret-actions">
            <GameButton color="green" size="lg" icon="check" onClick={check} disabled={solved} silent>
              Провери
            </GameButton>
            <GameButton color="turquoise" size="lg" icon="help" onClick={askHelp} disabled={helpDisabled} title={helpTitle} silent>
              Помощ
            </GameButton>
          </div>
        </section>
      </div>

      {feedback?.kind === 'correct' && (
        <div className="success-overlay nt-success">
          <Confetti seed={index + 41} />
          <div className="success-card">
            <div className="success-card__burst" aria-hidden="true" />
            <Mascot mood="cheer" size={150} className="success-card__mascot" />
            <div className="success-card__title">Браво!</div>
            <div className="success-card__praise">
              <Words text={two ? 'Тайните прозорци светнаха!' : 'Тайният прозорец светна!'} />
            </div>
            <StarRow stars={feedback.stars} size={86} animate />
            <div className="success-card__text nt-sequence">
              {/* отдолу нагоре — както расте кулата */}
              {task.values.map((v, i) => (
                <span key={i} className={task.hidden.includes(i) ? 'is-secret' : ''}>
                  {i > 0 && <span className="nt-sequence__arrow">→</span>}
                  {fmt(v)}
                </span>
              ))}
              <span className="nt-sequence__rule">
                <Words text={ruleText(task)} />
              </span>
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
