import { useEffect, useMemo, useReducer, useState, type CSSProperties, type ReactNode } from 'react'
import { useApp } from '../../../core/AppContext'
import { useStage } from '../../../core/Stage'
import { Mascot, type MascotMood } from '../../../components/art/Mascot'
import { Confetti, StarRow } from '../../../components/ui/Effects'
import { GameButton } from '../../../components/ui/GameButton'
import { GradeTicket } from '../../../components/ui/GradeTicket'
import { Icon } from '../../../components/ui/Icon'
import { SoundControl } from '../../../components/ui/SoundControl'
import { DIFFICULTY_LABELS, type Difficulty, type Grade } from '../../magic-tokens/logic'
import type { TaskOutcome } from '../../magic-tokens/PlayBoard'
import { fmt } from '../build/logic'
import { FitText } from '../FitText'
import { TowerBackdrop } from '../TowerScene'
import { HELP, MISSIONS, initialLiftState, liftHint, liftReducer, parseTyped, placeName, stepText, type LiftAction, type LiftTask } from './logic'

interface Props {
  grade: Grade
  difficulty: Difficulty
  tasks: LiftTask[]
  onFinish: (o: TaskOutcome[]) => void
  onExit: () => void
}

/** Текст, в който думите с тире не се разделят на два реда. */
function Words({ text }: { text: string }) {
  return <>{text.split(' ').flatMap((w, i) => [i ? ' ' : '', <span key={i} className="nt-word">{w}</span>])}</>
}

/** Ключовете на клавиатурата: 3 колони (хоризонтално) и 6 колони на 2 реда (вертикално). */
const KEYS: { k: string; o3: number; o6: number }[] = [
  ...['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((k, i) => ({ k, o3: i, o6: i < 5 ? i : i + 1 })),
  { k: 'clear', o3: 9, o6: 11 },
  { k: '0', o3: 10, o6: 10 },
  { k: 'back', o3: 11, o6: 5 },
]

type Mark = { value: number; kind: 'start' | 'target' | 'here' | 'goal' }

/** Стъклената шахта с асансьора: числова скала само с нужните етажи и плавно движеща се кабина. */
function LiftScene({ task, pos, solved, display, marks, ticks }: { task: LiftTask; pos: number | null; solved: boolean; display: string; marks: Mark[]; ticks: number[] }) {
  // обхватът на скалата: всички показвани стойности (+ отговорът, за да не се мести скалата при верния избор)
  const vals = [task.answer, ...(task.start !== null ? [task.start] : []), ...(pos !== null ? [pos] : []), ...marks.map((m) => m.value)]
  const lo0 = Math.min(...vals)
  const hi0 = Math.max(...vals)
  const pad = Math.max(1, (hi0 - lo0) * 0.12)
  const lo = lo0 - pad
  const hi = hi0 + pad
  // 14…86 % — кабината (центрирана на етажа) остава изцяло в шахтата
  const pct = (v: number) => 14 + (72 * (v - lo)) / Math.max(1e-9, hi - lo)
  const cabinAt = pos === null ? 6 : pct(pos)
  return (
    <div className="nl-scene">
      <div className="nl-tower" aria-hidden="true">
        <svg className="nl-roof" viewBox="0 0 300 120" preserveAspectRatio="xMidYMax meet">
          <path d="M20 118 Q150 -20 280 118 Z" fill="#9b5de5" stroke="#3b2a5a" strokeWidth="6" />
          <path d="M150 6 l7 14 15 2 -11 10 3 15 -14 -7 -14 7 3 -15 -11 -10 15 -2z" fill={solved ? '#ffd23f' : '#d6c6ff'} stroke="#3b2a5a" strokeWidth="4" className={solved ? 'nl-roof__star is-lit' : 'nl-roof__star'} />
        </svg>
        <svg className="nl-base" viewBox="0 0 300 90" preserveAspectRatio="xMidYMin meet">
          <rect x="10" y="4" width="280" height="70" rx="18" fill="#ff8cc0" stroke="#3b2a5a" strokeWidth="6" />
          <path d="M120 74 V40 Q150 14 180 40 V74 Z" fill="#ffd23f" stroke="#3b2a5a" strokeWidth="5" />
          <rect x="0" y="72" width="300" height="16" rx="8" fill="#9b5de5" stroke="#3b2a5a" strokeWidth="5" />
        </svg>
      </div>
      <div className="nl-shaft" role="img" aria-label={`Асансьорът е на ${display}`}>
        {ticks.map((v) => (
          <span key={`t${v}`} className="nl-tick" style={{ bottom: `${pct(v)}%` }} />
        ))}
        {marks.map((m) => (
          <div key={`${m.kind}-${m.value}`} className={`nl-floor nl-floor--${m.kind}`} style={{ bottom: `${pct(m.value)}%` }}>
            <span className="nl-floor__plate">
              <small>{m.kind === 'start' ? 'Старт' : m.kind === 'target' ? 'Цел' : m.kind === 'goal' ? 'Пристигна!' : 'Тук'}</small>
              <b>{fmt(m.value)}</b>
            </span>
            <span className="nl-floor__line" />
          </div>
        ))}
        <div className={`nl-cabin ${solved ? 'is-open' : ''}`} style={{ bottom: `${cabinAt}%`, '--clen': Math.max(3, display.length) } as CSSProperties} data-pos={pos ?? ''}>
          <div className="nl-cabin__display">{display}</div>
          <div className="nl-cabin__box">
            <span className="nl-cabin__door nl-cabin__door--l" />
            <span className="nl-cabin__door nl-cabin__door--r" />
            <Mascot mood={solved ? 'cheer' : 'happy'} size={46} className="nl-cabin__star" />
          </div>
        </div>
      </div>
    </div>
  )
}

/** „Числовият асансьор“: закарай асансьора / открий етажа. */
export function LiftBoard({ grade, difficulty, tasks, onFinish, onExit }: Props) {
  const { settings, play } = useApp()
  const { scale, portrait } = useStage()
  const help = HELP[difficulty]
  const hintsOn = settings.hintsOn && help !== 'none'
  const reduce = useMemo(() => liftReducer(tasks, grade), [tasks, grade])
  const [st, dispatch] = useReducer(reduce, tasks, initialLiftState)
  const [hint, setHint] = useState<string | null>(null)
  const [shake, setShake] = useState(0)
  const task = tasks[st.index]
  const { solved, outcomes } = st
  const isLast = st.index === tasks.length - 1
  const stars = outcomes.reduce((a, o) => a + o.stars, 0)

  useEffect(() => {
    if (st.finished) onFinish(st.outcomes)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [st.finished])

  const act = (a: LiftAction) => {
    const after = reduce(st, a)
    dispatch(a)
    return after
  }

  const step = (place: number, dir: 1 | -1) => {
    if (solved) return
    setHint(null)
    const after = act({ type: 'step', place, dir })
    play(after.message?.kind === 'info' ? 'locked' : dir > 0 ? 'pick' : 'remove')
  }
  const choose = (v: number) => {
    if (solved) return
    setHint(null)
    play('drop')
    act({ type: 'choose', value: v })
  }
  const pressKey = (k: string) => {
    if (solved) return
    setHint(null)
    play('pick')
    act({ type: 'key', key: k })
  }
  const check = () => {
    if (solved) return
    setHint(null)
    const after = act({ type: 'check' })
    if (after.solved) {
      play('success')
      for (let k = 0; k < (after.stars ?? 0); k++) window.setTimeout(() => play('star'), 1000 + k * 230)
    } else if (after.message?.kind === 'wrong') {
      setShake((x) => x + 1)
      play('tryAgain')
    } else play('hint')
  }
  const askHelp = () => {
    if (!hintsOn || solved || (help === 'limited' && st.usedHint)) return
    play('hint')
    act({ type: 'hint' })
    setHint(liftHint(task, help === 'visual' ? 'visual' : 'limited'))
  }
  const next = () => {
    if (!solved) return
    if (isLast) play('fanfare')
    setHint(null)
    act({ type: 'next' })
  }

  // физическа клавиатура: цифри / стрелки (управление), Enter — Провери / Следваща
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null
      if (el && (el.tagName === 'BUTTON' || el.getAttribute('role') === 'button') && (e.key === 'Enter' || e.key === ' ')) return
      if (task.mode === 'keypad') {
        if (/^[0-9]$/.test(e.key)) pressKey(e.key)
        else if (e.key === 'Backspace') pressKey('back')
        else if (e.key === 'Delete') pressKey('clear')
      }
      if (task.mode === 'drive' && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
        e.preventDefault()
        step(Math.min(...(task.buttons ?? [1])), e.key === 'ArrowUp' ? 1 : -1)
      }
      if (e.key === 'Enter') {
        e.preventDefault()
        if (solved) next()
        else check()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  // скалата: стартът и целта (при управление) / стартът и спирката на асансьора
  const marks: Mark[] = []
  if (task.start !== null) marks.push({ value: task.start, kind: 'start' })
  if (task.mode === 'drive') marks.push({ value: task.answer, kind: solved ? 'goal' : 'target' })
  else if (st.pos !== null && st.pos !== task.start) marks.push({ value: st.pos, kind: solved ? 'goal' : 'here' })
  const uniq = marks.filter((m, i) => marks.findIndex((x) => x.value === m.value) === i || m.kind === 'goal')
  // междинни етажи (без надписи) — само при малко стъпки по единици
  const unit = Math.min(...(task.buttons ?? [1]))
  const span = task.start === null ? 0 : Math.abs(task.answer - task.start) / unit
  const ticks = task.mode === 'drive' && span <= 12 ? Array.from({ length: span + 1 }, (_, k) => Math.min(task.start!, task.answer) + k * unit) : []
  const display = st.pos === null ? 'Вход' : fmt(st.pos)

  let mood: MascotMood = 'happy'
  let bubble: ReactNode
  if (st.message?.kind === 'wrong') {
    mood = 'encourage'
    bubble = <Words text={st.message.text} />
  } else if (hint) {
    mood = 'think'
    bubble = (
      <>
        <b className="bubble-title">Подсказка</b>
        <Words text={hint} />
      </>
    )
  } else if (st.message?.kind === 'info') {
    mood = 'think'
    bubble = <Words text={st.message.text} />
  } else if (solved) {
    mood = 'cheer'
    bubble = <Words text="Браво! Асансьорът пристигна!" />
  } else
    bubble = (
      <Words
        text={task.mode === 'drive' ? 'Натискай ▲ и ▼, за да движиш асансьора.' : task.mode === 'choose' ? 'Избери етаж — асансьорът ще те закара.' : 'Напиши номера на етажа и натисни „Провери“.'}
      />
    )

  const tap = Math.ceil(52 / Math.max(0.1, scale))
  const helpDisabled = !hintsOn || solved || (help === 'limited' && st.usedHint)
  const helpTitle =
    help === 'none' ? 'На ниво „Майстор“ работиш самостоятелно' : !settings.hintsOn ? 'Подсказките са изключени от учителя' : help === 'limited' ? 'Една подсказка на задача' : 'Подсказка'
  const typedNum = parseTyped(st.typed)
  const typedText = typedNum === null ? '' : fmt(typedNum)
  const longest = Math.max(fmt(task.answer).length, task.start === null ? 0 : fmt(task.start).length)

  return (
    <div className="screen wheel-play nt-play nt-secret-play nt-lift-play" style={{ '--tap': `${tap}px`, '--chars': longest } as CSSProperties}>
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
        <div className="progress" aria-label={`Задача ${st.index + 1} от ${tasks.length}`}>
          <span className="progress__label">
            Задача {st.index + 1} / {tasks.length}
          </span>
          <span className="progress__dots">
            {tasks.map((t, i) => (
              <span key={t.id} className={`progress__dot ${i < outcomes.length ? 'is-done' : ''} ${i === st.index ? 'is-current' : ''}`} />
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
            <FitText text="Числовият асансьор" max={portrait ? 56 : 40} className="marquee__label nt-marquee__title" />
          </div>
          <div className="nt-say">
            <div className="tb-instruction nt-instruction nl-mission">
              <span className="nl-mission__chip">
                Мисия {task.mission} · {MISSIONS[task.mission]}
              </span>
              <span className="nl-mission__q">
                <Words text={task.question} />
              </span>
              {task.steps && task.steps.length > 1 && (
                <span className="nl-route" aria-label="Маршрутът">
                  {task.steps.map((s, i) => (
                    <span key={i} className={`nl-route__step ${s.count > 0 ? 'is-up' : 'is-down'}`}>
                      {i + 1}. {stepText(s)}
                    </span>
                  ))}
                </span>
              )}
              {task.start !== null && (
                <span className="nl-ends">
                  <span className="nl-ends__chip">Старт {fmt(task.start)}</span>
                  <span aria-hidden="true">→</span>
                  <span className="nl-ends__chip is-goal">{task.mode === 'drive' ? `Цел ${fmt(task.answer)}` : 'Цел ?'}</span>
                </span>
              )}
            </div>
            <div className="nt-bubble">
              <Mascot mood={mood} size={72} />
              <div className={`speech-bubble speech-bubble--game ${st.message?.kind === 'wrong' ? 'is-wrong' : ''}`} key={`${st.message?.text}-${hint}-${shake}-${solved}`}>
                {bubble}
              </div>
            </div>
          </div>
        </section>

        <section className={`wp-stage nt-stage nl-stage ${st.message?.kind === 'wrong' ? 'is-shake' : ''}`} data-test-answer={import.meta.env.DEV ? task.answer : undefined} data-test-mode={import.meta.env.DEV ? task.mode : undefined}>
          <TowerBackdrop />
          <LiftScene task={task} pos={st.pos} solved={solved} display={display} marks={uniq} ticks={ticks} />
        </section>

        <section className="nt-side nt-secret-side nl-side">
          {task.mode === 'drive' && (
            <div className="nl-drive" role="group" aria-label="Управление на асансьора">
              <div className="nl-now">
                <small>Асансьорът е на</small>
                <b>{display}</b>
              </div>
              {(task.buttons ?? [1]).map((p) => (
                <div key={p} className="nl-drive__row">
                  <button type="button" className="nl-step is-down" onClick={() => step(p, -1)} disabled={solved} data-step={-p} aria-label={`Надолу с 1 ${placeName(p)}`}>
                    <span className="nl-step__t" style={{ '--blen': fmt(p).length + 3 } as CSSProperties}>
                      ▼ −{fmt(p)}
                    </span>
                  </button>
                  <span className="nl-drive__name">{placeName(p)}</span>
                  <button type="button" className="nl-step is-up" onClick={() => step(p, 1)} disabled={solved} data-step={p} aria-label={`Нагоре с 1 ${placeName(p)}`}>
                    <span className="nl-step__t" style={{ '--blen': fmt(p).length + 3 } as CSSProperties}>
                      ▲ +{fmt(p)}
                    </span>
                  </button>
                </div>
              ))}
            </div>
          )}
          {task.mode === 'choose' && (
            <div className="nt-lanterns" role="radiogroup" aria-label="Избери етаж">
              {task.options!.map((v) => (
                <button key={v} type="button" role="radio" aria-checked={st.choice === v} data-choice={v} className={`nt-lantern ${st.choice === v ? 'is-on' : ''}`} onClick={() => choose(v)} disabled={solved}>
                  <svg className="nt-lantern__icon" viewBox="0 0 40 52" aria-hidden="true">
                    <rect x="6" y="6" width="28" height="40" rx="6" fill="currentColor" stroke="#3b2a5a" strokeWidth="4" />
                    <path d="M20 14 l6 8 h-12 z M20 38 l6 -8 h-12 z" fill="#3b2a5a" />
                  </svg>
                  <span className="nt-lantern__num" style={{ '--len': Math.max(3, fmt(v).length) } as CSSProperties}>
                    {fmt(v)}
                  </span>
                </button>
              ))}
            </div>
          )}
          {task.mode === 'keypad' && (
            <div className="nt-pad">
              <div className="nt-fields">
                <div className={`nt-field is-active ${st.message?.kind === 'wrong' ? 'is-wrong' : ''} ${solved ? 'is-correct' : ''}`} data-field="lift" aria-live="polite">
                  <span className="nt-field__name">Етаж</span>
                  <span className={`nt-field__value ${typedText ? '' : 'is-empty'}`} style={{ '--len': Math.max(3, typedText.length) } as CSSProperties}>
                    {typedText || '?'}
                  </span>
                </div>
              </div>
              <div className="nt-keypad" role="group" aria-label="Цифрова клавиатура">
                {KEYS.map(({ k, o3, o6 }) => (
                  <button
                    key={k}
                    type="button"
                    className={`nt-key ${k === 'clear' ? 'nt-key--clear' : k === 'back' ? 'nt-key--back' : ''}`}
                    style={{ '--o3': o3, '--o6': o6 } as CSSProperties}
                    onClick={() => pressKey(k)}
                    disabled={solved}
                    aria-label={k === 'clear' ? 'Изтрий числото' : k === 'back' ? 'Изтрий последната цифра' : k}
                  >
                    {k === 'clear' ? <Icon name="clear" size={30} /> : k === 'back' ? <Icon name="back" size={30} /> : k}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="nt-secret-actions">
            {solved ? (
              <GameButton color="purple" size="lg" icon="next" onClick={next} className="is-ready nt-next-side">
                {isLast ? 'Резултат' : 'Следваща'}
              </GameButton>
            ) : (
              <GameButton color="green" size="lg" icon="check" onClick={check} silent>
                Провери
              </GameButton>
            )}
            <GameButton color="turquoise" size="lg" icon="help" onClick={askHelp} disabled={helpDisabled} title={helpTitle} silent>
              Помощ
            </GameButton>
          </div>
        </section>
      </div>

      {solved && (
        <div className="success-overlay nt-success nl-success">
          <Confetti seed={st.index + 61} />
          <div className="success-card">
            <div className="success-card__burst" aria-hidden="true" />
            <Mascot mood="cheer" size={150} className="success-card__mascot" />
            <div className="success-card__title">Браво!</div>
            <div className="success-card__praise">
              <Words text={`Асансьорът пристигна на етаж ${fmt(task.answer)}!`} />
            </div>
            <StarRow stars={st.stars ?? 1} size={86} animate />
            {task.steps && task.start !== null && (
              <div className="success-card__text nt-sequence">
                <span>{fmt(task.start)}</span>
                {task.steps.map((s, i) => (
                  <span key={i}>
                    <span className="nt-sequence__arrow">{s.count > 0 ? '↑' : '↓'}</span>
                    {fmt(task.steps!.slice(0, i + 1).reduce((a, x) => a + x.place * x.count, task.start!))}
                  </span>
                ))}
              </div>
            )}
            <GameButton color="green" size="xl" icon="next" onClick={next} className="success-card__next">
              {isLast ? 'Виж резултата' : 'Следваща задача'}
            </GameButton>
          </div>
        </div>
      )}
    </div>
  )
}
