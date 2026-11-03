import { useEffect, useState, type ReactNode } from 'react'
import { useApp } from '../../core/AppContext'
import { useStage } from '../../core/Stage'
import { Mascot, type MascotMood } from '../../components/art/Mascot'
import { TokenCoin } from '../../components/art/TokenCoin'
import { Confetti, StarRow } from '../../components/ui/Effects'
import { GameButton } from '../../components/ui/GameButton'
import { Icon } from '../../components/ui/Icon'
import { SoundControl } from '../../components/ui/SoundControl'
import { BoothBackdrop } from './BoothBackdrop'
import { DIFFICULTY_LABELS, formatNumber, starsForTask, type Difficulty, type Grade } from './logic'
import { PlaceMat, type DragPayload, type MatRow, type RowKey } from './PlaceMat'
import {
  PLACE_NAMES,
  addToken,
  canExchangeDown,
  canExchangeUp,
  describeCounts,
  exchangeDown,
  exchangeUp,
  higherPlace,
  lowerPlace,
  removeToken,
  valueOf,
  type Counts,
  type Place,
} from './placeValue'
import type { TaskOutcome } from './PlayBoard'
import {
  MODE_LABELS,
  checkTask,
  evalExpr,
  exprText,
  hintFor,
  initialState,
  taskInstruction,
  taskTitle,
  type BoardState,
  type ModeId,
  type Relation,
  type TokenHint,
  type TokenTask,
} from './tasks'
import { usePointerDrag } from './usePointerDrag'
import {
  backspace,
  checkComputedAnswer,
  computeHint,
  expressionText,
  firstStage,
  hasComputeStage,
  hasModelStage,
  isArithmetic,
  typeDigit,
  visibleInfo,
  type ArithTask,
  type Stage,
  type WorkMode,
} from './compute'

type Feedback = null | { kind: 'correct'; stars: 1 | 2 | 3 } | { kind: 'wrong'; message: string } | { kind: 'info'; message: string }

interface Props {
  grade: Grade
  difficulty: Difficulty
  mode: ModeId
  tasks: TokenTask[]
  /** Начин на работа при събиране и изваждане. */
  workMode?: WorkMode
  onFinish: (outcomes: TaskOutcome[]) => void
  onExit: () => void
}

const PRAISE = ['Супер си!', 'Отлично се справи!', 'Чудесно!', 'Страхотно!', 'Точно така!']

/** Редовете на дъската според вида задача. */
function rowsFor(task: TokenTask): MatRow[] {
  switch (task.kind) {
    case 'add':
      return [
        { key: 'a', label: '1. група', weight: 1, interactive: true, tone: 'group' },
        { key: 'b', label: '2. група', weight: 1, interactive: true, tone: 'group' },
        { key: 'result', label: 'Сбор', weight: 1.8, drop: true, interactive: true, up: true, tone: 'result' },
      ]
    case 'subtract':
    case 'missingSubtrahend':
      return [
        { key: 'board', label: 'Имаш', weight: 1.7, interactive: true, down: true, tone: 'board' },
        { key: 'removed', label: 'Махнати', weight: 1, drop: true, interactive: true, tone: 'removed' },
      ]
    case 'missingAddend':
      return [
        { key: 'base', label: 'Имаш', weight: 1, tone: 'locked' },
        { key: 'added', label: 'Добави', weight: 1.3, drop: true, interactive: true, up: true, tone: 'build' },
      ]
    case 'compose':
      return [{ key: 'built', label: 'Твоето число', weight: 1, drop: true, interactive: true, up: true, down: task.topic === 'regroup', tone: 'build' }]
    case 'otherWay':
    case 'missingMinuend':
      return [{ key: 'built', label: 'Твоето число', weight: 1, drop: true, interactive: true, up: true, down: task.kind === 'otherWay', tone: 'build' }]
    default:
      return []
  }
}

/** Достъп до броевете на всеки ред от състоянието. */
function countsOfState(s: BoardState): Partial<Record<RowKey, Counts>> {
  switch (s.kind) {
    case 'add':
      return { a: s.a, b: s.b, result: s.result }
    case 'subtract':
    case 'missingSubtrahend':
      return { board: s.board, removed: s.removed }
    case 'missingAddend':
      return { base: s.base, added: s.added }
    case 'compose':
    case 'otherWay':
    case 'missingMinuend':
      return { built: s.built }
    default:
      return {}
  }
}

function withRow(s: BoardState, row: RowKey, c: Counts): BoardState {
  return { ...s, [row]: c } as BoardState
}

const needsSupply = (t: TokenTask) => t.kind === 'compose' || t.kind === 'otherWay' || t.kind === 'missingMinuend' || t.kind === 'missingAddend'
const buildRow = (t: TokenTask): RowKey => (t.kind === 'missingAddend' ? 'added' : 'built')

export function TokenBoard({ grade, difficulty, mode, tasks, workMode = 'tokensAndCompute', onFinish, onExit }: Props) {
  const { settings, play } = useApp()
  const { width: W, portrait } = useStage()
  const [index, setIndex] = useState(0)
  const [state, setState] = useState<BoardState>(() => initialState(tasks[0]))
  const [mistakes, setMistakes] = useState(0)
  const [usedHint, setUsedHint] = useState(false)
  const [solved, setSolved] = useState(false)
  const [feedback, setFeedback] = useState<Feedback>(null)
  const [hint, setHint] = useState<TokenHint | null>(null)
  const [outcomes, setOutcomes] = useState<TaskOutcome[]>([])
  const [flash, setFlash] = useState<{ row: RowKey; places: Place[]; n: number } | null>(null)
  const [shake, setShake] = useState(0)
  const [stage, setStage] = useState<Stage>(() => firstStage(tasks[0], workMode))
  const [answer, setAnswer] = useState('')
  const [computeTries, setComputeTries] = useState(0)

  const task = tasks[index]
  const hintsOn = settings.hintsOn
  const autoHints = hintsOn && difficulty === 'explorer'
  const isLast = index === tasks.length - 1
  // „Следваща задача“ се активира само след успешно решена задача.
  const canNext = solved
  const starsSoFar = outcomes.reduce((a, o) => a + o.stars, 0)
  const rows = rowsFor(task)
  const places = 'places' in task ? task.places : []
  const counts = countsOfState(state)
  const supply = needsSupply(task)
  const arith: ArithTask | null = isArithmetic(task) ? task : null
  /** Дъската с жетони остава видима и при пресмятане (освен „без жетони“). */
  const showMat = !arith || hasModelStage(arith, workMode)

  // Размер на жетоните според ширината на колоните.
  const centerW = (portrait ? W - 40 : W - 48 - 360 - 260 - 48) - 128
  // отстъпи на дъската (рамка, вътрешен отстъп) и празнините между колоните
  const colW = places.length ? (centerW - 40 - 8 * places.length) / places.length : 200
  // горна граница; всяка клетка сама избира размер, за да се поберат всички жетони
  const tokenSize = Math.max(36, Math.min(54, Math.floor((colW - 16) / 3) - 4))

  const changed = (next: BoardState) => {
    setState(next)
    setHint(null)
    if (feedback?.kind !== 'correct') setFeedback(null)
  }
  const info = (message: string) => {
    play('locked')
    setFeedback({ kind: 'info', message })
  }
  const doFlash = (row: RowKey, ps: Place[]) => setFlash({ row, places: ps, n: (flash?.n ?? 0) + 1 })

  const exchange = (row: RowKey, p: Place, dir: 'up' | 'down') => {
    if (solved) return
    const c = counts[row]
    if (!c) return
    if (dir === 'up') {
      if (!canExchangeUp(c, p, places)) return info(`Трябват ти 10 ${PLACE_NAMES[p].many} за 1 ${higherPlace(p) ? PLACE_NAMES[higherPlace(p)!].one : ''}.`)
      changed(withRow(state, row, exchangeUp(c, p, places)))
      doFlash(row, [p, higherPlace(p)!])
    } else {
      if (!canExchangeDown(c, p, places)) return info(`Нямаш ${PLACE_NAMES[p].one} за размяна.`)
      changed(withRow(state, row, exchangeDown(c, p, places)))
      doFlash(row, [p, lowerPlace(p)!])
    }
    play('star')
  }

  /** Докосване на жетон — основното действие за всеки ред. */
  const tap = (row: RowKey | 'supply', p: Place) => {
    if (solved) return
    const s = state
    if (row === 'supply') {
      const target = buildRow(task)
      const c = counts[target]!
      if (c[p] >= 40) return info('Тук вече има много жетони. Опитай с размяна.')
      play('drop')
      return changed(withRow(s, target, addToken(c, p)))
    }
    if (s.kind === 'add' && (row === 'a' || row === 'b')) {
      const group = s[row]
      if (group[p] === 0) return
      play('drop')
      changed({ ...s, [row]: { ...group, [p]: 0 }, result: addToken(s.result, p, group[p]) })
      return doFlash('result', [p])
    }
    if ((s.kind === 'subtract' || s.kind === 'missingSubtrahend') && row === 'board') {
      if (s.board[p] === 0) return
      play('remove')
      return changed({ ...s, board: removeToken(s.board, p), removed: addToken(s.removed, p) })
    }
    if ((s.kind === 'subtract' || s.kind === 'missingSubtrahend') && row === 'removed') {
      if (s.removed[p] === 0) return
      play('drop')
      return changed({ ...s, removed: removeToken(s.removed, p), board: addToken(s.board, p) })
    }
    if (row === 'built' || row === 'added') {
      const c = counts[row]!
      if (c[p] === 0) return
      play('remove')
      return changed(withRow(s, row, removeToken(c, p)))
    }
    if (row === 'result') info('Тук жетоните вече са събрани. Ако са 10 еднакви — размени ги.')
  }

  const { drag, bind } = usePointerDrag<DragPayload>({
    disabled: solved,
    onStart: () => play('pick'),
    onTap: (d) => tap(d.row, d.place),
    onDrop: (d, target) => {
      const [tRow, tPlaceRaw] = (target ?? '').split(':')
      const tPlace = tPlaceRaw ? (Number(tPlaceRaw) as Place) : null
      const from = d.row
      if (from === 'supply') {
        const build = buildRow(task)
        if (tRow !== build) return
        if (tPlace !== null && tPlace !== d.place) return info(`Това е жетон за ${PLACE_NAMES[d.place].many}. Сложи го в колона „${PLACE_NAMES[d.place].header}“.`)
        return tap('supply', d.place)
      }
      // влачене към съседна колона в същия ред → размяна
      if (tRow === from && tPlace !== null && tPlace !== d.place) {
        if (tPlace === higherPlace(d.place)) return exchange(from, d.place, 'up')
        if (tPlace === lowerPlace(d.place)) return exchange(from, d.place, 'down')
        return info('Размяната става между съседни разряди.')
      }
      if (state.kind === 'add' && (from === 'a' || from === 'b') && tRow === 'result') return tap(from, d.place)
      if ((state.kind === 'subtract' || state.kind === 'missingSubtrahend') && from === 'board' && tRow === 'removed') return tap('board', d.place)
      if ((state.kind === 'subtract' || state.kind === 'missingSubtrahend') && from === 'removed' && tRow === 'board') return tap('removed', d.place)
      if ((from === 'built' || from === 'added') && tRow !== from) return tap(from, d.place)
    },
  })

  const succeed = () => {
    const stars = starsForTask(mistakes, usedHint)
    setSolved(true)
    setStage('done')
    setOutcomes((o) => [...o, { stars, firstTry: mistakes === 0, solved: true }])
    setFeedback({ kind: 'correct', stars })
    play('success')
    for (let i = 0; i < stars; i++) window.setTimeout(() => play('star'), 650 + i * 230)
  }

  const fail = (message: string) => {
    setMistakes((m) => m + 1)
    setFeedback({ kind: 'wrong', message })
    setShake((n) => n + 1)
    play('tryAgain')
  }

  const check = () => {
    if (solved) return
    setHint(null)
    // Етап „Пресметни“: проверяваме въведения от ученика отговор.
    if (stage === 'compute' && isArithmetic(task)) {
      const r = checkComputedAnswer(task, answer, hintsOn)
      if (r.status === 'incomplete') {
        play('hint')
        return setFeedback({ kind: 'info', message: r.message })
      }
      if (r.status === 'correct') return succeed()
      setComputeTries((n) => n + 1)
      return fail(r.message)
    }
    const res = checkTask(task, state, hintsOn)
    if (res.status === 'incomplete') {
      play('hint')
      return setFeedback({ kind: 'info', message: res.message })
    }
    if (res.status === 'correct') {
      // Жетоните са подредени вярно → етап „Пресметни“ (ако има такъв).
      if (hasComputeStage(task, workMode)) {
        play('star')
        setStage('compute')
        return setFeedback({ kind: 'info', message: 'Жетоните са готови! Сега пресметни сам и напиши отговора.' })
      }
      return succeed()
    }
    fail(res.message)
  }

  const reset = () => {
    if (solved) return
    play('remove')
    if (stage === 'compute') {
      setAnswer('')
      setHint(null)
      if (feedback?.kind !== 'correct') setFeedback(null)
      return
    }
    changed(initialState(task))
  }

  const help = () => {
    if (!hintsOn || solved) return
    play('hint')
    setUsedHint(true)
    setFeedback(null)
    if (stage === 'compute' && isArithmetic(task)) {
      const board = workMode === 'computeOnly' ? null : state.kind === 'add' ? state.result : state.kind === 'subtract' ? state.board : null
      return setHint({ message: computeHint(task, board, computeTries) })
    }
    setHint(hintFor(task, state))
  }

  const pressDigit = (d: string) => {
    if (solved || stage !== 'compute') return
    play('click')
    setAnswer((a) => typeDigit(a, d))
    if (feedback?.kind === 'wrong' || feedback?.kind === 'info') setFeedback(null)
    setHint(null)
  }
  const pressBack = () => {
    if (solved || stage !== 'compute') return
    play('remove')
    setAnswer((a) => backspace(a))
  }

  // Физическа клавиатура в етап „Пресметни“: цифри, Backspace, Enter.
  useEffect(() => {
    if (stage !== 'compute' || solved) return
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return
      if (/^\d$/.test(e.key)) {
        e.preventDefault()
        pressDigit(e.key)
      } else if (e.key === 'Backspace') {
        e.preventDefault()
        pressBack()
      } else if (e.key === 'Delete' || e.key === 'Escape') {
        setAnswer('')
      } else if (e.key === 'Enter') {
        e.preventDefault()
        check()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const next = () => {
    const final = solved ? outcomes : [...outcomes, { stars: 0, firstTry: false, solved: false }]
    if (isLast) {
      play('fanfare')
      return onFinish(final)
    }
    const t = tasks[index + 1]
    setOutcomes(final)
    setIndex(index + 1)
    setState(initialState(t))
    setMistakes(0)
    setUsedHint(false)
    setSolved(false)
    setFeedback(null)
    setHint(null)
    setFlash(null)
    setStage(firstStage(t, workMode))
    setAnswer('')
    setComputeTries(0)
  }

  // Звездичката: обратна връзка → подсказка → автоматична подсказка (Откривател) → указание
  const auto = autoHints && !solved && stage === 'model' && task.kind !== 'compare' && task.kind !== 'findError' ? hintFor(task, state) : null
  const shownHint = hint ?? auto
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
  } else if (feedback?.kind === 'correct') {
    mood = 'cheer'
    bubble = 'Ура!'
  } else if (shownHint) {
    mood = 'think'
    bubble = (
      <>
        <b className="bubble-title">{hint ? 'Подсказка' : 'Следваща стъпка'}</b>
        {shownHint.message}
      </>
    )
  } else {
    bubble =
      stage === 'compute'
        ? 'Сега пресметни сам! Напиши отговора с цифрите.'
        : task.kind === 'compare' || task.kind === 'findError'
          ? 'Помисли спокойно и избери.'
          : 'Докосни или влачи жетоните. Ти можеш!'
  }

  const title = taskTitle(task)

  return (
    <div className="screen token-board">
      <BoothBackdrop />
      <div className="top-bar">
        <GameButton color="yellow" size="md" icon="map" onClick={onExit}>
          Към парка
        </GameButton>
        <div className="level-chip">
          {grade}. клас · {MODE_LABELS[mode]} · {DIFFICULTY_LABELS[difficulty]}
        </div>
        <div className="top-bar__spacer" />
        <div className="progress" aria-label={`Задача ${index + 1} от ${tasks.length}`}>
          <span className="progress__label">
            Задача {index + 1} / {tasks.length}
          </span>
          <span className="progress__dots">
            {tasks.map((t, i) => (
              <span key={t.id} className={`progress__dot ${i < outcomes.length ? (outcomes[i].solved ? 'is-done' : 'is-skipped') : ''} ${i === index ? 'is-current' : ''}`} />
            ))}
          </span>
        </div>
        <div className="star-counter">
          <Icon name="star" size={34} />
          <span>{starsSoFar}</span>
        </div>
        <SoundControl />
      </div>

      <div className={`tb-grid ${supply ? 'has-supply' : ''}`}>
        <section className="tb-task">
          <div className="marquee tb-marquee" key={task.id}>
            <span className="marquee__lights" aria-hidden="true" />
            <span className="marquee__label">{title.label}</span>
            <span className={`marquee__number tb-marquee__text ${textSize(title.text)}`}>{title.text}</span>
          </div>
          <div className="tb-instruction">
            {arith && stage !== 'model'
              ? showMat
                ? 'Погледни жетоните и пресметни сам. Напиши отговора.'
                : 'Пресметни сам и напиши отговора.'
              : taskInstruction(task)}
          </div>
          <div className="mascot-area">
            <Mascot mood={mood} size={110} />
            <div className={`speech-bubble speech-bubble--game ${feedback?.kind === 'wrong' ? 'is-wrong' : ''}`} key={`${feedback?.kind}-${shownHint?.message}-${shake}`}>
              {bubble}
            </div>
          </div>
        </section>

        <section className="tb-work">
          <div className={`tb-work__inner ${feedback?.kind === 'wrong' ? 'is-shake' : ''}`} key={shake}>
            {task.kind === 'compare' && state.kind === 'compare' ? (
              <CompareScale task={task} choice={state.choice} solved={solved} onChoose={(c) => !solved && (play('pick'), changed({ kind: 'compare', choice: c }))} />
            ) : task.kind === 'findError' && state.kind === 'findError' ? (
              <ErrorCards task={task} choice={state.choice} solved={solved} onChoose={(i) => !solved && (play('pick'), changed({ kind: 'findError', choice: i }))} />
            ) : arith && stage !== 'model' && !showMat ? (
              <ComputePanel task={arith} answer={answer} solved={solved} wrong={feedback?.kind === 'wrong'} big onDigit={pressDigit} onBack={pressBack} onClear={() => !solved && setAnswer('')} />
            ) : (
              <div className={`tb-split ${arith && stage !== 'model' && hasComputeStage(arith, workMode) ? 'has-panel' : ''}`}>
              <PlaceMat
                places={places}
                rows={arith && stage !== 'model' ? rows.filter((r) => r.key === 'result' || r.key === 'board') : rows}
                counts={counts}
                rowValues={arith ? visibleInfo(arith, state, solved).rowValues : undefined}
                bind={bind}
                dragOver={drag?.over ?? null}
                onExchange={exchange}
                onKeyTap={(r, p) => tap(r, p)}
                highlight={shownHint && shownHint.row !== 'supply' ? shownHint : null}
                flash={flash}
                tokenSize={tokenSize}
                cap={20}
                disabled={solved || stage !== 'model'}
              />
              {arith && stage !== 'model' && hasComputeStage(arith, workMode) && (
                <ComputePanel task={arith} answer={answer} solved={solved} wrong={feedback?.kind === 'wrong'} onDigit={pressDigit} onBack={pressBack} onClear={() => !solved && setAnswer('')} />
              )}
              </div>
            )}
          </div>
          {arith ? <StepsBar stage={stage} model={hasModelStage(arith, workMode)} compute={hasComputeStage(arith, workMode)} info={showMat || solved ? visibleInfo(arith, state, solved).info : `Пресметни ${expressionText(arith).replace(/ =$/, '')}.`} /> : <Representation task={task} state={state} />}
        </section>

        <section className="actions">
          <GameButton color="green" size="lg" icon="check" onClick={check} disabled={solved} silent>
            Провери
          </GameButton>
          <GameButton color="orange" size="lg" icon="clear" onClick={reset} disabled={solved} silent>
            {stage === 'compute' ? 'Изтрий' : 'Изчисти'}
          </GameButton>
          <GameButton color="turquoise" size="lg" icon="help" onClick={help} disabled={!hintsOn || solved} title={hintsOn ? 'Подсказка' : 'Подсказките са изключени от учителя'} silent>
            Помощ
          </GameButton>
          <GameButton color="purple" size="lg" icon="next" onClick={next} disabled={!canNext} className={canNext ? 'is-ready' : ''}>
            {isLast && solved ? 'Резултат' : 'Следваща задача'}
          </GameButton>
        </section>

        {supply && (
          <section className="supply tb-supply">
            <div className="counter-shelf">
              <div className="counter-shelf__label">Вземи жетон</div>
              <div className="counter-shelf__tokens">
                {places.map((p) => (
                  <button
                    type="button"
                    key={p}
                    className={`supply-token ${shownHint?.row === 'supply' && shownHint.place === p ? 'is-hinted' : ''} ${drag?.payload.row === 'supply' && drag.payload.place === p ? 'is-lifted' : ''}`}
                    aria-label={`Жетон ${formatNumber(p)} — ${PLACE_NAMES[p].one}`}
                    disabled={solved}
                    {...bind({ row: 'supply', place: p })}
                    onClick={(e) => e.detail === 0 && tap('supply', p)}
                  >
                    <span className="supply-token__pile" aria-hidden="true">
                      <TokenCoin value={p} size={104} />
                    </span>
                    <span className="supply-token__top">
                      <TokenCoin value={p} size={104} />
                    </span>
                    <span className="supply-token__name">{PLACE_NAMES[p].header}</span>
                  </button>
                ))}
              </div>
            </div>
          </section>
        )}
      </div>

      {drag && (
        <div className={`drag-ghost ${drag.over ? 'is-over' : ''}`} style={{ left: drag.x, top: drag.y }} aria-hidden="true">
          <TokenCoin value={drag.payload.place} size={drag.payload.row === 'supply' ? 110 : 80} />
          {(drag.payload.row === 'a' || drag.payload.row === 'b') && counts[drag.payload.row] && <span className="drag-ghost__count">× {counts[drag.payload.row]![drag.payload.place]}</span>}
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
            <div className="success-card__text">{solvedText(task)}</div>
            <GameButton color="green" size="xl" icon="next" onClick={next} className="success-card__next">
              {isLast ? 'Виж резултата' : 'Следваща задача'}
            </GameButton>
          </div>
        </div>
      )}
    </div>
  )
}

/** Размер на текста в таблото според дължината на израза. */
function textSize(text: string): string {
  const n = text.length
  return n <= 6 ? '' : n <= 9 ? 'is-long' : n <= 13 ? 'is-xlong' : 'is-xxlong'
}

/** Решението, показано при „Браво!“. */
function solvedText(task: TokenTask): string {
  const f = formatNumber
  switch (task.kind) {
    case 'compose':
    case 'otherWay':
      return `${f(task.target)} — готово!`
    case 'add':
      return `${f(task.a)} + ${f(task.b)} = ${f(task.a + task.b)}`
    case 'subtract':
      return `${f(task.a)} − ${f(task.b)} = ${f(task.a - task.b)}`
    case 'missingAddend':
      return `${f(task.a)} + ${f(task.c - task.a)} = ${f(task.c)}`
    case 'missingSubtrahend':
      return `${f(task.a)} − ${f(task.a - task.c)} = ${f(task.c)}`
    case 'missingMinuend':
      return `${f(task.b + task.c)} − ${f(task.b)} = ${f(task.c)}`
    case 'compare': {
      const l = evalExpr(task.left)
      const r = evalExpr(task.right)
      return `${f(l)} ${l < r ? '<' : l > r ? '>' : '='} ${f(r)}`
    }
    case 'findError': {
      const e = task.items[task.wrongIndex]
      return `Вярно е: ${exprText(e)} = ${f(evalExpr(e))}`
    }
  }
}

/** Трите етапа на задачата: 1. Представи → 2. Пресметни → 3. Провери. */
function StepsBar({ stage, model, compute, info }: { stage: Stage; model: boolean; compute: boolean; info: string }) {
  const state = (n: 1 | 2 | 3): 'done' | 'active' | 'todo' | 'skip' => {
    if (n === 1) return !model ? 'skip' : stage === 'model' ? 'active' : 'done'
    if (n === 2) return !compute ? 'skip' : stage === 'compute' ? 'active' : stage === 'done' ? 'done' : 'todo'
    return stage === 'done' ? 'done' : 'todo'
  }
  const labels = ['Представи', 'Пресметни', 'Провери'] as const
  return (
    <div className="steps-bar" aria-label="Етапи на задачата">
      {labels.map((l, i) => {
        const st = state((i + 1) as 1 | 2 | 3)
        return (
          <span key={l} className={`step step--${st}`} aria-current={st === 'active' ? 'step' : undefined}>
            <span className="step__num">{st === 'done' ? <Icon name="check" size={22} /> : i + 1}</span>
            <span className="step__label">{l}</span>
          </span>
        )
      })}
      <span className="steps-bar__info">{info}</span>
    </div>
  )
}

/** „Сега пресметни сам!“ — изразът, полето за отговор и голяма цифрова клавиатура. */
function ComputePanel({ task, answer, solved, wrong, big, onDigit, onBack, onClear }: { task: ArithTask; answer: string; solved: boolean; wrong: boolean; big?: boolean; onDigit: (d: string) => void; onBack: () => void; onClear: () => void }) {
  const keys = ['7', '8', '9', '4', '5', '6', '1', '2', '3']
  return (
    <div className={`compute-panel ${big ? 'is-big' : ''}`}>
      <div className="compute-panel__title">{solved ? 'Браво! Пресметна вярно.' : 'Сега пресметни сам!'}</div>
      <div className="compute-panel__expr" aria-live="polite">
        <span>{expressionText(task)}</span>
        <span className={`answer-box ${wrong ? 'is-wrong' : ''} ${solved ? 'is-correct' : ''} ${answer ? '' : 'is-empty'}`} aria-label={answer ? `Твоят отговор: ${answer}` : 'Празно поле за отговор'}>
          {answer ? formatNumber(Number(answer)) : '?'}
        </span>
      </div>
      <div className="keypad" role="group" aria-label="Цифрова клавиатура">
        {keys.map((k) => (
          <button key={k} type="button" className="keypad__key" onClick={() => onDigit(k)} disabled={solved}>
            {k}
          </button>
        ))}
        <button type="button" className="keypad__key keypad__key--clear" onClick={onClear} disabled={solved || !answer} aria-label="Изтрий всичко">
          <Icon name="clear" size={34} />
        </button>
        <button type="button" className="keypad__key" onClick={() => onDigit('0')} disabled={solved}>
          0
        </button>
        <button type="button" className="keypad__key keypad__key--back" onClick={onBack} disabled={solved || !answer} aria-label="Изтрий последната цифра">
          <Icon name="back" size={34} />
        </button>
      </div>
    </div>
  )
}

/** Ред с текущото математическо представяне на дъската. */
function Representation({ task, state }: { task: TokenTask; state: BoardState }) {
  const f = formatNumber
  const places = 'places' in task ? task.places : []
  let main: ReactNode = null
  let side: ReactNode = null
  switch (state.kind) {
    case 'add': {
      const r = valueOf(state.result)
      main = (
        <>
          <span className="rep__label">Сбор</span>
          <span className="rep__expr">{describeCounts(state.result, places)}</span>
        </>
      )
      side = <span className="rep__total">{f(r)}</span>
      break
    }
    case 'subtract':
    case 'missingSubtrahend': {
      main = (
        <>
          <span className="rep__label">Остават</span>
          <span className="rep__expr">{describeCounts(state.board, places)}</span>
        </>
      )
      side = (
        <>
          <span className="rep__total">{f(valueOf(state.board))}</span>
          <span className="rep__chip">Махнати: {f(valueOf(state.removed))}</span>
        </>
      )
      break
    }
    case 'missingAddend': {
      const add = valueOf(state.added)
      main = (
        <>
          <span className="rep__label">Сметка</span>
          <span className="rep__expr">
            {task.kind === 'missingAddend' && `${f(task.a)} + ${f(add)} = ${f(task.a + add)}`}
          </span>
        </>
      )
      side = <span className="rep__total">{f(add)}</span>
      break
    }
    case 'compose':
    case 'otherWay':
    case 'missingMinuend': {
      const v = valueOf(state.built)
      main = (
        <>
          <span className="rep__label">Твоето число</span>
          <span className="rep__expr">
            {describeCounts(state.built, places)}
            {task.kind === 'missingMinuend' && v > 0 ? ` → ${f(v)} − ${f(task.b)} = ${f(v - task.b)}` : ''}
          </span>
        </>
      )
      side = <span className="rep__total">{f(v)}</span>
      break
    }
    case 'compare':
      main = (
        <>
          <span className="rep__label">Сравни</span>
          <span className="rep__expr">Пресметни двете страни на везната.</span>
        </>
      )
      break
    case 'findError':
      main = (
        <>
          <span className="rep__label">Внимание</span>
          <span className="rep__expr">Пресметни всеки пример. Един от тях е грешен.</span>
        </>
      )
      break
  }
  return (
    <div className="rep">
      {main}
      <span className="rep__side">{side}</span>
    </div>
  )
}

/** Везна за сравняване на два израза. */
function CompareScale({ task, choice, solved, onChoose }: { task: Extract<TokenTask, { kind: 'compare' }>; choice: Relation | null; solved: boolean; onChoose: (c: Relation) => void }) {
  const l = evalExpr(task.left)
  const r = evalExpr(task.right)
  const tilt = solved ? (l > r ? -8 : l < r ? 8 : 0) : 0
  const longest = Math.max(exprText(task.left).length, exprText(task.right).length)
  const cardFont = longest > 13 ? 38 : longest > 10 ? 44 : 52
  return (
    <div className="compare">
      <svg className="compare__scale" viewBox="0 0 800 300" aria-hidden="true">
        <rect x="380" y="70" width="40" height="200" rx="12" fill="#ffd23f" stroke="#3b2a5a" strokeWidth="5" />
        <path d="M300 290 h200 l-30 -30 h-140 z" fill="#9b5de5" stroke="#3b2a5a" strokeWidth="5" strokeLinejoin="round" />
        <g className="compare__beam" style={{ transform: `rotate(${tilt}deg)` }}>
          <rect x="90" y="62" width="620" height="18" rx="9" fill="#ff5fa2" stroke="#3b2a5a" strokeWidth="5" />
          <path d="M150 80 L110 170 M150 80 L190 170 M650 80 L610 170 M650 80 L690 170" stroke="#3b2a5a" strokeWidth="4" />
          <path d="M80 170 h140 a70 22 0 0 1 -140 0 z" fill="#2ed1c4" stroke="#3b2a5a" strokeWidth="5" />
          <path d="M580 170 h140 a70 22 0 0 1 -140 0 z" fill="#2ed1c4" stroke="#3b2a5a" strokeWidth="5" />
        </g>
        <circle cx="400" cy="70" r="16" fill="#ffd23f" stroke="#3b2a5a" strokeWidth="5" />
      </svg>
      <div className="compare__sides">
        <div className="compare__card compare__card--left" style={{ fontSize: cardFont }}>
          {exprText(task.left)}
        </div>
        <div className="compare__choices" role="radiogroup" aria-label="Знак за сравнение">
          {(['<', '=', '>'] as Relation[]).map((c) => (
            <button key={c} type="button" role="radio" aria-checked={choice === c} className={`compare__choice ${choice === c ? 'is-on' : ''}`} onClick={() => onChoose(c)}>
              {c}
            </button>
          ))}
        </div>
        <div className="compare__card compare__card--right" style={{ fontSize: cardFont }}>
          {exprText(task.right)}
        </div>
      </div>
      {solved && (
        <div className="compare__values">
          {formatNumber(l)} {choice} {formatNumber(r)}
        </div>
      )}
    </div>
  )
}

/** Три пресметнати примера — един е грешен. */
function ErrorCards({ task, choice, solved, onChoose }: { task: Extract<TokenTask, { kind: 'findError' }>; choice: number | null; solved: boolean; onChoose: (i: number) => void }) {
  return (
    <div className="error-cards">
      {task.items.map((e, i) => (
        <button key={i} type="button" style={{ ['--expr-size' as string]: `${exprText(e).length > 11 ? 30 : exprText(e).length > 8 ? 36 : 44}px` }} className={`error-card ${choice === i ? 'is-on' : ''} ${solved && i === task.wrongIndex ? 'is-wrong-shown' : ''}`} onClick={() => onChoose(i)} aria-pressed={choice === i}>
          <span className="error-card__who">Задача {i + 1}</span>
          <span className="error-card__expr">
            <span className="error-card__lhs">{exprText(e)}</span>
            <span className="error-card__lhs">
              = <b>{formatNumber(e.shown)}</b>
            </span>
          </span>
          {solved && i === task.wrongIndex && <span className="error-card__fix">Вярно: {formatNumber(evalExpr(e))}</span>}
          <span className="error-card__stamp" aria-hidden="true">
            {choice === i ? '✗' : ''}
          </span>
        </button>
      ))}
    </div>
  )
}

