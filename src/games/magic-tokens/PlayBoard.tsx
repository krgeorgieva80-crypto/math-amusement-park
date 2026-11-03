import { useRef, useState, type MouseEvent, type ReactNode } from 'react'
import { useApp } from '../../core/AppContext'
import { useStage } from '../../core/Stage'
import { Mascot, type MascotMood } from '../../components/art/Mascot'
import { TokenCoin } from '../../components/art/TokenCoin'
import { Confetti, StarRow, StarShape } from '../../components/ui/Effects'
import { GameButton } from '../../components/ui/GameButton'
import { Icon } from '../../components/ui/Icon'
import { SoundControl } from '../../components/ui/SoundControl'
import { GradeTicket } from '../../components/ui/GradeTicket'
import { BoothBackdrop } from './BoothBackdrop'
import {
  DIFFICULTY_LABELS,
  checkAnswer,
  conditionText,
  formatNumber,
  nextHint,
  placeValueText,
  starsForTask,
  sum,
  type Difficulty,
  type Grade,
  type Hint,
  type Task,
} from './logic'
import { useTokenDrag, type DragSource } from './useTokenDrag'

export interface TaskOutcome {
  stars: number
  firstTry: boolean
  solved: boolean
}

type Feedback = null | { kind: 'correct'; stars: 1 | 2 | 3 } | { kind: 'wrong'; message: string } | { kind: 'info'; message: string }

const MAX_TOKENS = 30
const PRAISE = ['Супер си!', 'Отлично се справи!', 'Чудесно!', 'Страхотно!', 'Точно така!']

interface Props {
  grade: Grade
  difficulty: Difficulty
  tasks: Task[]
  onFinish: (outcomes: TaskOutcome[]) => void
  onExit: () => void
}

function expression(placed: number[]): string {
  if (placed.length === 0) return ''
  const sorted = [...placed].sort((a, b) => b - a)
  if (sorted.length <= 10) return sorted.map(formatNumber).join(' + ')
  const groups: [number, number][] = []
  for (const v of sorted) {
    const last = groups[groups.length - 1]
    if (last && last[0] === v) last[1]++
    else groups.push([v, 1])
  }
  return groups.map(([v, c]) => (c > 1 ? `${c} × ${formatNumber(v)}` : formatNumber(v))).join(' + ')
}

export function PlayBoard({ grade, difficulty, tasks, onFinish, onExit }: Props) {
  const { settings, play } = useApp()
  const { portrait } = useStage()
  // Във вертикален изглед зоната е по-ниска — по-ниски купчинки.
  const MAX_VISIBLE_IN_STACK = portrait ? 5 : 8
  const STEP = portrait ? 18 : 24
  const trayRef = useRef<HTMLDivElement>(null)
  const [index, setIndex] = useState(0)
  const [placed, setPlaced] = useState<number[]>([])
  const [mistakes, setMistakes] = useState(0)
  const [usedHint, setUsedHint] = useState(false)
  const [solved, setSolved] = useState(false)
  const [feedback, setFeedback] = useState<Feedback>(null)
  const [hint, setHint] = useState<Hint | null>(null)
  const [outcomes, setOutcomes] = useState<TaskOutcome[]>([])
  const [lastAdded, setLastAdded] = useState<{ value: number; n: number } | null>(null)
  const [shake, setShake] = useState(0)

  const task = tasks[index]
  const hintsOn = settings.hintsOn
  const autoHints = hintsOn && difficulty === 'explorer'
  const total = sum(placed)
  const cond = conditionText(task.condition)
  const forbidden = task.condition.kind === 'forbidden' ? task.condition.value : null
  const isLast = index === tasks.length - 1
  const canNext = solved || mistakes >= 2
  const starsSoFar = outcomes.reduce((a, o) => a + o.stars, 0)

  const changed = () => {
    setHint(null)
    if (feedback?.kind !== 'correct') setFeedback(null)
  }

  const addToken = (value: number) => {
    if (solved) return
    if (value === forbidden) {
      play('locked')
      setFeedback({ kind: 'info', message: `Жетонът ${formatNumber(value)} е забранен в тази задача.` })
      return
    }
    if (placed.length >= MAX_TOKENS) {
      play('locked')
      setFeedback({ kind: 'info', message: 'Зоната е пълна! Опитай с по-големи жетони.' })
      return
    }
    play('drop')
    setPlaced((p) => [...p, value])
    setLastAdded((l) => ({ value, n: (l?.n ?? 0) + 1 }))
    changed()
  }

  const removeToken = (value: number) => {
    if (solved) return
    setPlaced((p) => {
      const i = p.lastIndexOf(value)
      if (i === -1) return p
      const next = [...p]
      next.splice(i, 1)
      return next
    })
    setLastAdded(null)
    play('remove')
    changed()
  }

  const { drag, bind } = useTokenDrag({
    trayRef,
    disabled: solved,
    onStart: () => play('pick'),
    onTap: (v: number, src: DragSource) => (src === 'supply' ? addToken(v) : removeToken(v)),
    onDrop: (v: number, src: DragSource, inTray: boolean) => {
      if (src === 'supply' && inTray) addToken(v)
      else if (src === 'tray' && !inTray) removeToken(v)
    },
  })

  /** Клавиатура (Enter/интервал) — click без указател има detail === 0. */
  const keyboardOnly = (fn: () => void) => (e: MouseEvent) => {
    if (e.detail === 0) fn()
  }

  const check = () => {
    if (solved) return
    const res = checkAnswer(task, placed, hintsOn)
    setHint(null)
    if (res.status === 'empty') {
      play('hint')
      setFeedback({ kind: 'info', message: res.message })
      return
    }
    if (res.status === 'correct') {
      const stars = starsForTask(mistakes, usedHint)
      setSolved(true)
      setOutcomes((o) => [...o, { stars, firstTry: mistakes === 0, solved: true }])
      setFeedback({ kind: 'correct', stars })
      play('success')
      for (let i = 0; i < stars; i++) window.setTimeout(() => play('star'), 650 + i * 230)
      return
    }
    setMistakes((m) => m + 1)
    setFeedback({ kind: 'wrong', message: res.message })
    setShake((s) => s + 1)
    play('tryAgain')
  }

  const clear = () => {
    if (solved || placed.length === 0) return
    setPlaced([])
    setLastAdded(null)
    changed()
  }

  const help = () => {
    if (!hintsOn || solved) return
    play('hint')
    setUsedHint(true)
    setFeedback(null)
    setHint(nextHint(task, placed))
  }

  const next = () => {
    const finalOutcomes = solved ? outcomes : [...outcomes, { stars: 0, firstTry: false, solved: false }]
    if (isLast) {
      play('fanfare')
      onFinish(finalOutcomes)
      return
    }
    setOutcomes(finalOutcomes)
    setIndex((i) => i + 1)
    setPlaced([])
    setMistakes(0)
    setUsedHint(false)
    setSolved(false)
    setFeedback(null)
    setHint(null)
    setLastAdded(null)
  }

  // Какво казва талисманът.
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
        {hint.message}
        {autoHints && hint.suggest !== null && <span className="bubble-extra">{placeValueText(task.target)}</span>}
      </>
    )
  } else if (feedback?.kind === 'correct') {
    mood = 'cheer'
    bubble = 'Ура!'
  } else {
    bubble =
      placed.length === 0
        ? `Сложи жетони в зоната, за да получиш ${formatNumber(task.target)}.`
        : autoHints && total < task.target
          ? `Чудесно! Остават още ${formatNumber(task.target - total)}.`
          : 'Когато си готов, натисни „Провери“.'
  }

  // Групиране на жетоните в зоната по стойност.
  const groups = [...task.denominations]
    .sort((a, b) => b - a)
    .map((v) => ({ value: v, count: placed.filter((p) => p === v).length }))
    .filter((g) => g.count > 0)

  const showCount = task.condition.kind === 'exactCount' || task.condition.kind === 'minTokens'
  const exactMatch = autoHints && total === task.target

  return (
    <div className="screen play-board">
      <BoothBackdrop />

      <div className="top-bar">
        <GameButton color="yellow" size="md" icon="map" onClick={onExit}>
          Към парка
        </GameButton>
        <GradeTicket grade={grade} />
        <div className="level-chip">{DIFFICULTY_LABELS[difficulty]}</div>
        <div className="top-bar__spacer" />
        <div className="progress" aria-label={`Задача ${index + 1} от ${tasks.length}`}>
          <span className="progress__label">
            Задача {index + 1} / {tasks.length}
          </span>
          <span className="progress__dots">
            {tasks.map((t, i) => (
              <span
                key={t.id}
                className={`progress__dot ${i < outcomes.length ? (outcomes[i].solved ? 'is-done' : 'is-skipped') : ''} ${i === index ? 'is-current' : ''}`}
              />
            ))}
          </span>
        </div>
        <div className="star-counter">
          <Icon name="star" size={34} />
          <span>{starsSoFar}</span>
        </div>
        <SoundControl />
      </div>

      <div className="play-grid">
        <section className="target-area">
          <div className="marquee" key={task.id}>
            <span className="marquee__lights" aria-hidden="true" />
            <span className="marquee__label">Състави числото</span>
            <span className={`marquee__number ${String(task.target).length > 4 ? 'is-long' : ''}`}>{formatNumber(task.target)}</span>
          </div>
          {cond && (
            <div className="condition-chip">
              <StarShape size={30} />
              {cond}
            </div>
          )}
          {autoHints && <div className="place-value">{placeValueText(task.target)}</div>}
          <div className="mascot-area">
            <Mascot mood={mood} size={130} />
            <div className={`speech-bubble speech-bubble--game ${feedback?.kind === 'wrong' ? 'is-wrong' : ''}`} key={`${feedback?.kind}-${hint?.message}-${shake}`}>
              {bubble}
            </div>
          </div>
        </section>

        <section className="tray-area">
          <div
            ref={trayRef}
            className={`tray ${drag && drag.source === 'supply' ? 'is-target' : ''} ${drag?.overTray && drag.source === 'supply' ? 'is-over' : ''} ${exactMatch ? 'is-match' : ''} ${solved ? 'is-solved' : ''}`}
          >
            <div className={`tray__inner ${feedback?.kind === 'wrong' ? 'is-shake' : ''}`} key={shake}>
              {placed.length === 0 && (
                <div className="tray__empty">
                  <Icon name="play" size={40} className="tray__empty-icon" />
                  Постави жетоните тук
                </div>
              )}
              {groups.map((g) => {
                const visible = Math.min(g.count, MAX_VISIBLE_IN_STACK)
                const hinted = hint?.remove === g.value
                return (
                  <button
                    type="button"
                    key={g.value}
                    className={`tray-col ${hinted ? 'is-hinted' : ''}`}
                    aria-label={`${g.count} жетона по ${formatNumber(g.value)}. Докосни, за да махнеш един.`}
                    {...bind(g.value, 'tray')}
                    onClick={keyboardOnly(() => removeToken(g.value))}
                  >
                    <span className="tray-col__count">× {g.count}</span>
                    <span className="tray-col__stack" style={{ height: 104 + (visible - 1) * STEP }}>
                      {Array.from({ length: visible }, (_, i) => {
                        const isTop = i === visible - 1
                        const isNew = isTop && lastAdded?.value === g.value
                        return (
                          <span key={isNew ? `new-${lastAdded?.n}` : i} className={`tray-col__coin ${isNew ? 'is-new' : ''}`} style={{ bottom: i * STEP }}>
                            <TokenCoin value={g.value} size={104} />
                          </span>
                        )
                      })}
                    </span>
                    {g.count > MAX_VISIBLE_IN_STACK && <span className="tray-col__more">+{g.count - MAX_VISIBLE_IN_STACK}</span>}
                  </button>
                )
              })}
            </div>
          </div>
          <div className={`sum-bar ${exactMatch ? 'is-match' : ''}`}>
            <span className="sum-bar__label">Сбор</span>
            <span className="sum-bar__expr">{expression(placed) || '—'}</span>
            <span className="sum-bar__eq">=</span>
            <span className="sum-bar__total" key={total}>
              {formatNumber(total)}
            </span>
            {showCount && <span className="sum-bar__count">Жетони: {placed.length}</span>}
          </div>
        </section>

        <section className="actions">
          <GameButton color="green" size="lg" icon="check" onClick={check} disabled={solved} silent>
            Провери
          </GameButton>
          <GameButton color="orange" size="lg" icon="clear" onClick={clear} disabled={solved || placed.length === 0} silent>
            Изчисти
          </GameButton>
          <GameButton
            color="turquoise"
            size="lg"
            icon="help"
            onClick={help}
            disabled={!hintsOn || solved}
            title={hintsOn ? 'Подсказка' : 'Подсказките са изключени от учителя'}
            silent
          >
            Помощ
          </GameButton>
          <GameButton color="purple" size="lg" icon="next" onClick={next} disabled={!canNext} className={canNext ? 'is-ready' : ''}>
            {isLast && solved ? 'Резултат' : 'Следваща задача'}
          </GameButton>
        </section>

        <section className="supply">
          <div className="counter-shelf">
            <div className="counter-shelf__label">Вземи жетон</div>
            <div className="counter-shelf__tokens">
              {task.denominations.map((v) => {
                const isForbidden = v === forbidden
                const hinted = hint?.suggest === v
                return (
                  <button
                    type="button"
                    key={v}
                    className={`supply-token ${isForbidden ? 'is-forbidden' : ''} ${hinted ? 'is-hinted' : ''} ${drag?.source === 'supply' && drag.value === v ? 'is-lifted' : ''}`}
                    aria-label={isForbidden ? `Жетон ${formatNumber(v)} — забранен` : `Жетон ${formatNumber(v)}`}
                    disabled={solved}
                    {...(isForbidden ? {} : bind(v, 'supply'))}
                    onClick={keyboardOnly(() => addToken(v))}
                  >
                    <span className="supply-token__pile" aria-hidden="true">
                      <TokenCoin value={v} size={116} />
                    </span>
                    <span className="supply-token__top">
                      <TokenCoin value={v} size={116} dimmed={isForbidden} />
                    </span>
                    {isForbidden && (
                      <span className="supply-token__ban" aria-hidden="true">
                        <Icon name="close" size={60} />
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        </section>
      </div>

      {drag && (
        <div className={`drag-ghost ${drag.overTray ? 'is-over' : ''}`} style={{ left: drag.x, top: drag.y }} aria-hidden="true">
          <TokenCoin value={drag.value} size={120} />
        </div>
      )}

      {feedback?.kind === 'correct' && (
        <div className="success-overlay">
          <Confetti seed={index + 1} />
          <div className="success-card">
            <div className="success-card__burst" aria-hidden="true" />
            <Mascot mood="cheer" size={150} className="success-card__mascot" />
            <div className="success-card__title">Браво!</div>
            <div className="success-card__praise">{PRAISE[index % PRAISE.length]}</div>
            <StarRow stars={feedback.stars} size={86} animate />
            <div className="success-card__text">
              {expression(placed)} = {formatNumber(task.target)}
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
