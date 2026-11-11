import { useEffect, useReducer, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { useApp } from '../../../core/AppContext'
import { useStage } from '../../../core/Stage'
import { Mascot, type MascotMood } from '../../../components/art/Mascot'
import { Confetti, StarRow } from '../../../components/ui/Effects'
import { GameButton } from '../../../components/ui/GameButton'
import { GradeTicket } from '../../../components/ui/GradeTicket'
import { Icon } from '../../../components/ui/Icon'
import { SoundControl } from '../../../components/ui/SoundControl'
import { DIFFICULTY_LABELS, type Difficulty, type Grade } from '../../magic-tokens/logic'
import { fmt } from '../build/logic'
import { FitText } from '../FitText'
import { TowerBackdrop } from '../TowerScene'
import { FOCUS_Y, MagicKey, TOWER_VB, TowerOutside, type HallState } from './TopArt'
import { HALLS, TASKS_PER_HALL, starsTop } from './logic/common'
import { clearTop, loadTop, saveTop } from './logic/persist'
import { atTop, canSkip, hallOf, newSession, posInHall, summary, topReducer, type TopSession } from './logic/session'
import { generateStairs, type StairsKind, type StairsTask } from './logic/stairs'
import { StairsBank, StairsScene, stairsResult, useStairsAnswer } from './StairsHall'
import { BridgePlay } from './BridgeHall'
import { SkyPlay } from './SkyHall'
import { GoldenGate } from './GoldenGate'
import { generateBridge } from './logic/bridge'
import { generateSky } from './logic/sky'

export const TOP_RESULT_MODE = 'Кулата: Върхът на кулата'

/** Текст, в който думите с тире не се разделят на два реда. */
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

const KIND_NAME: Record<StairsKind, string> = { order: 'Подреди стъпалата', fill: 'Липсващи стъпала', wrong: 'Сгрешено стъпало', continue: 'Продължи стълбата' }

/** Задачите на приключението: по 4 във всяка от трите зали (12). */
const makeTasks = (grade: Grade, difficulty: Difficulty, tables: number[]) => {
  const o = { grade, difficulty, tables }
  return [...generateStairs(o), ...generateBridge(o), ...generateSky(o)]
}

interface Props {
  grade: Grade
  difficulty: Difficulty
  onExit: () => void
  onChooseLevel: () => void
  onChooseMode: () => void
}

export function TopGame(p: Props) {
  const { settings } = useApp()
  const tables = settings.spinTables[p.grade]
  // недовършено приключение за същия клас и ниво → въпрос „Продължи?“
  const [saved] = useState(() => loadTop(p.grade, p.difficulty))
  const [run, setRun] = useState<{ id: number; session: TopSession } | null>(() =>
    saved ? null : { id: 1, session: newSession(p.grade, p.difficulty, makeTasks(p.grade, p.difficulty, tables), Date.now()) },
  )
  const restart = () => {
    clearTop()
    setRun((r) => ({ id: (r?.id ?? 0) + 1, session: newSession(p.grade, p.difficulty, makeTasks(p.grade, p.difficulty, tables), Date.now()) }))
  }
  if (!run)
    return <ResumePrompt session={saved!} grade={p.grade} onResume={() => setRun({ id: 1, session: { ...saved!, startedAt: Date.now() - saved!.elapsedMs } })} onRestart={restart} onExit={p.onExit} />
  return <Adventure key={run.id} {...p} initial={run.session} onAgain={restart} />
}

function TopBar({ grade, difficulty, s, onExit }: { grade: Grade; difficulty: Difficulty; s: TopSession; onExit: () => void }) {
  const stars = s.results.reduce((a, r) => a + r.stars, 0)
  const shown = Math.min(s.index + 1, s.tasks.length)
  return (
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
      <div className="progress" aria-label={`Задача ${shown} от ${s.tasks.length}`}>
        <span className="progress__label">
          Задача {shown} / {s.tasks.length}
        </span>
      </div>
      {/* звезди и ключове в една табелка — горната лента се побира и на таблет */}
      <div className="star-counter tt-counter" aria-label={`Звезди: ${stars}, ключове: ${s.keys} от 3`}>
        <Icon name="star" size={34} />
        <span>{stars}</span>
        <span className="tt-counter__keys">
          <MagicKey size={44} got={s.keys > 0} />
          <span>{s.keys}</span>
        </span>
      </div>
      <SoundControl />
    </div>
  )
}

function Adventure({ grade, difficulty, initial, onExit, onChooseLevel, onChooseMode, onAgain }: Props & { initial: TopSession; onAgain: () => void }) {
  const { play, saveResult } = useApp()
  const { scale, portrait } = useStage()
  const [s, dispatch] = useReducer(topReducer, initial)
  const savedOnce = useRef(false)
  const tap = Math.ceil(52 / Math.max(0.1, scale))

  // запазване при всяка промяна (за възстановяване след презареждане); време — на всеки 5 s
  useEffect(() => {
    if (s.phase === 'done') clearTop()
    else saveTop(s)
  }, [s])
  useEffect(() => {
    const t = window.setInterval(() => dispatch({ type: 'tick', now: Date.now() }), 5000)
    return () => window.clearInterval(t)
  }, [])
  // краят: резултатът се записва веднъж (само при пълното приключение от 12 задачи)
  useEffect(() => {
    if (s.phase !== 'done' || savedOnce.current) return
    savedOnce.current = true
    const sum = summary({ ...s, elapsedMs: Math.max(s.elapsedMs, Date.now() - s.startedAt) })
    if (s.tasks.length === TASKS_PER_HALL * 3)
      saveResult({
        game: 'number-tower',
        mode: TOP_RESULT_MODE,
        grade,
        difficulty,
        total: sum.total,
        solved: sum.solved,
        firstTry: sum.firstTry,
        stars: sum.stars,
        maxStars: sum.maxStars,
        durationSec: sum.durationSec,
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s.phase])

  const style = { '--tap': `${tap}px` } as CSSProperties
  if (s.phase === 'done')
    return (
      <div className="screen wheel-play nt-play nt-secret-play tt-play" style={style}>
        <TowerBackdrop />
        <TopSummary
          s={{ ...s, elapsedMs: Math.max(s.elapsedMs, Date.now() - s.startedAt) }}
          grade={grade}
          difficulty={difficulty}
          onAgain={onAgain}
          onChooseLevel={onChooseLevel}
          onChooseMode={onChooseMode}
          onExit={onExit}
        />
      </div>
    )

  const hall = hallOf(Math.min(s.index, s.tasks.length - 1))
  const inHall = s.phase === 'hall' || s.phase === 'solved' || s.phase === 'key'
  return (
    <div className="screen wheel-play nt-play nt-secret-play tt-play" style={style}>
      <TowerBackdrop />
      <TopBar grade={grade} difficulty={difficulty} s={s} onExit={onExit} />
      {inHall && hall === 0 ? (
        <StairsPlay key={s.index} s={s} dispatch={dispatch} portrait={portrait} />
      ) : inHall && hall === 1 ? (
        <BridgePlay key={s.index} s={s} dispatch={dispatch} portrait={portrait} />
      ) : inHall && hall === 2 ? (
        <SkyPlay key={s.index} s={s} dispatch={dispatch} portrait={portrait} grade={grade} />
      ) : (
        <ClimbView s={s} portrait={portrait} onEnter={() => (play('drop'), dispatch({ type: 'enter' }))} onFinish={() => (play('fanfare'), dispatch({ type: 'finish' }))} />
      )}
      {s.phase === 'key' && (
        <div className="success-overlay tt-key-overlay">
          <Confetti seed={s.keys * 7} />
          <div className="success-card">
            <div className="success-card__burst" aria-hidden="true" />
            <div className="success-card__title" style={{ '--chars': 9 } as CSSProperties}>
              Магически ключ!
            </div>
            <div className="tt-key-big">
              <MagicKey size={210} />
            </div>
            <div className="success-card__praise">
              <Words text={`Премина „${HALLS[hall].name}“. Ключовете: ${s.keys} от 3.`} />
            </div>
            <div className="tt-keys">
              {[0, 1, 2].map((k) => (
                <MagicKey key={k} size={86} got={k < s.keys} />
              ))}
            </div>
            <GameButton color="green" size="xl" icon="next" onClick={() => (play('drop'), dispatch({ type: 'climb' }))} className="success-card__next">
              Изкачи се нагоре
            </GameButton>
          </div>
        </div>
      )}
    </div>
  )
}

/** Кулата отвън: „камерата“ показва текущата зала (или върха) и плавно се изкачва. */
function ClimbView({ s, portrait, onEnter, onFinish }: { s: TopSession; portrait: boolean; onEnter: () => void; onFinish: () => void }) {
  const [gate, setGate] = useState(false)
  const top = atTop(s)
  const built = Math.ceil(s.tasks.length / TASKS_PER_HALL) // колко зали има в това приключение
  const nextHall = Math.min(2, Math.floor(s.index / TASKS_PER_HALL))
  const states = [0, 1, 2].map((h) => (h < s.keys ? 'done' : h === nextHall && !top ? 'current' : 'locked')) as [HallState, HallState, HallState]
  const focus = top ? (built < 3 ? FOCUS_Y.halls[Math.min(2, built)] : FOCUS_Y.top) : FOCUS_Y.halls[nextHall]
  const VIEW = 900 // видимата височина на кулата (единици)
  const shift = Math.max(0, Math.min(TOWER_VB.h - VIEW, focus - VIEW / 2))
  const notBuilt = top && built < 3
  let mood: MascotMood = 'wave'
  let say: string
  if (top && !notBuilt) {
    mood = 'cheer'
    say = 'Стигна върха! Постави трите ключа в златната порта.'
  } else if (notBuilt) {
    mood = 'think'
    say = `Залата „${HALLS[built].name}“ още се строи. Очаквай я скоро!`
  } else say = s.index === 0 ? 'Изкачи кулата! Във всяка зала реши 4 задачи и вземи ключа.' : `Следва „${HALLS[nextHall].name}“. Реши 4 задачи и вземи ключа.`
  return (
    <div className="nt-grid tt-grid">
      <section className="nt-task">
        <div className="marquee tb-marquee nt-marquee">
          <span className="marquee__lights" aria-hidden="true" />
          <FitText text="Върхът на кулата" max={portrait ? 56 : 40} className="marquee__label nt-marquee__title" />
        </div>
        <div className="nt-say">
          <div className="tb-instruction nt-instruction">
            <b>{top ? (notBuilt ? 'Още малко…' : 'Златната порта') : `Зала ${nextHall + 1} от 3`}</b>
            <span>
              <Words text={top ? (notBuilt ? 'Залите 2 и 3 идват в следващата част.' : 'Трите ключа отключват златната порта на върха.') : HALLS[nextHall].name} />
            </span>
          </div>
          <div className="nt-bubble">
            <Mascot mood={mood} size={72} />
            <div className="speech-bubble speech-bubble--game" key={say}>
              <Words text={say} />
            </div>
          </div>
        </div>
      </section>
      <section className="wp-stage nt-stage tt-camera" aria-label="Кулата">
        <TowerBackdrop />
        <div className="tt-camera__track" style={{ '--shift': shift / TOWER_VB.h, '--view': VIEW / TOWER_VB.h } as CSSProperties}>
          <TowerOutside states={states} topLit={top && !notBuilt} />
        </div>
      </section>
      <section className="nt-side nt-secret-side tt-side">
        <div className="tt-keys-panel">
          <small>Магически ключове</small>
          <div className="tt-keys">
            {[0, 1, 2].map((k) => (
              <MagicKey key={k} size={80} got={k < s.keys} />
            ))}
          </div>
        </div>
        <div className="nt-secret-actions tt-go">
          {top ? (
            <GameButton color="green" size="lg" icon="next" onClick={() => (notBuilt ? onFinish() : setGate(true))}>
              {notBuilt ? 'Към отчета' : 'Отключи портата'}
            </GameButton>
          ) : (
            <GameButton color="green" size="lg" icon="play" onClick={onEnter}>
              {`Влез в зала ${nextHall + 1}`}
            </GameButton>
          )}
        </div>
      </section>
      {gate && <GoldenGate keys={s.keys} onDone={onFinish} />}
    </div>
  )
}

/** Зала 1: задача от стълбата. */
function StairsPlay({ s, dispatch, portrait }: { s: TopSession; dispatch: (a: Parameters<typeof topReducer>[1]) => void; portrait: boolean }) {
  const { settings, play } = useApp()
  const task = s.tasks[s.index] as StairsTask // зала 1
  const st = useStairsAnswer(task)
  const [msg, setMsg] = useState<null | { kind: 'wrong' | 'info' | 'hint'; text: string }>(null)
  const [shake, setShake] = useState(0)
  const solved = s.phase === 'solved' || s.phase === 'key'
  const result = s.results[s.index]

  const pick = (v: number) => {
    if (solved) return
    play('pick')
    st.setPicked(st.picked === v ? null : v)
    setMsg({ kind: 'info', text: `Избра ${v}. Докосни празно стъпало.` })
  }
  const drop = (v: number, slot: number | null) => {
    if (solved || slot === null) return
    play('drop')
    st.place(v, slot)
    st.setPicked(null)
    setMsg(null)
  }
  const slot = (k: number) => {
    if (solved) return
    const r = st.slotTap(k)
    play(r === 'placed' ? 'drop' : r === 'returned' ? 'remove' : 'hint')
    setMsg(r === 'nothing' ? { kind: 'info', text: 'Първо избери плочка — или я плъзни до стъпалото.' } : null)
  }
  const step = (i: number) => {
    if (solved) return
    if (task.kind === 'wrong') {
      play('pick')
      st.select(i)
      setMsg(null)
    } else {
      play('hint')
      setMsg({ kind: 'info', text: 'Това стъпало вече е на мястото си. Плочките се слагат на празните стъпала.' })
    }
  }
  const check = () => {
    if (solved) return
    const r = stairsResult(task, st.answer)
    if (r === 'incomplete') {
      play('hint')
      return setMsg({ kind: 'info', text: task.kind === 'wrong' ? 'Първо докосни стъпалото, което смяташ за сгрешено.' : 'Постави плочка на всяко празно стъпало.' })
    }
    dispatch({ type: 'check', correct: r === 'correct' })
    if (r === 'correct') {
      setMsg(null)
      play('success')
      const stars = starsTop(s.wrong, s.usedHint, false)
      for (let k = 0; k < stars; k++) window.setTimeout(() => play('star'), 900 + k * 230)
    } else {
      setShake((x) => x + 1)
      play('tryAgain')
      // спокойно насърчение; отговорът не се показва, плочките остават за поправка
      setMsg({ kind: 'wrong', text: s.wrong + 1 >= 3 ? 'Не се отказвай! Можеш да опиташ пак или да продължиш нататък.' : 'Още не е вярно. Провери пак стъпалата — можеш да преместиш плочките.' })
    }
  }
  const help = () => {
    if (solved || !settings.hintsOn || s.usedHint) return
    play('hint')
    dispatch({ type: 'hint' })
    setMsg({ kind: 'hint', text: task.hint })
  }
  const skip = () => {
    play('click')
    dispatch({ type: 'skip' })
    setMsg(null)
  }
  const next = () => {
    play('drop')
    dispatch({ type: 'next' })
  }

  let mood: MascotMood = 'happy'
  let bubble: ReactNode = <Words text={task.kind === 'wrong' ? 'Докосни сгрешеното стъпало и натисни „Провери“.' : 'Плъзни плочка до празно стъпало — или я докосни и после докосни стъпалото.'} />
  if (solved && result) {
    mood = result.solved ? 'cheer' : 'encourage'
    bubble = result.solved ? (
      <>
        <b className="bubble-title">Браво!</b>
        <Words text={task.rule} />
        <span className="tt-bubble-stars">
          <StarRow stars={result.stars} size={34} animate />
        </span>
      </>
    ) : (
      <Words text="Продължаваме нататък. Ще се върнеш към такива задачи и ще станеш още по-добър!" />
    )
  } else if (msg?.kind === 'wrong') {
    mood = 'encourage'
    bubble = <Words text={msg.text} />
  } else if (msg?.kind === 'hint') {
    mood = 'think'
    bubble = (
      <>
        <b className="bubble-title">Подсказка</b>
        <Words text={msg.text} />
      </>
    )
  } else if (msg) {
    mood = 'think'
    bubble = <Words text={msg.text} />
  }

  const longest = Math.max(3, ...[...task.steps, ...task.bank].map((v) => (v === null ? 1 : fmt(v).length)))
  return (
    <div className="nt-grid tt-grid" style={{ '--chars': longest } as CSSProperties}>
      <section className="nt-task">
        <div className="marquee tb-marquee nt-marquee" key={task.id}>
          <span className="marquee__lights" aria-hidden="true" />
          <FitText text="Стълбата на числата" max={portrait ? 56 : 40} className="marquee__label nt-marquee__title" />
        </div>
        <div className="nt-say">
          <div className="tb-instruction nt-instruction nl-mission">
            <span className="nl-mission__chip">
              Задача {posInHall(s.index) + 1} от 4 · {KIND_NAME[task.kind]}
            </span>
            <span className="nl-mission__q">
              <Words text={task.prompt} />
            </span>
            {/* вертикално ключовете са тук (горната лента е тясна) */}
            <span className="tt-inline-keys" aria-label={`Ключове: ${s.keys} от 3`}>
              {[0, 1, 2].map((k) => (
                <MagicKey key={k} size={56} got={k < s.keys} />
              ))}
            </span>
          </div>
          <div className="nt-bubble">
            <Mascot mood={mood} size={72} />
            <div className={`speech-bubble speech-bubble--game ${msg?.kind === 'wrong' ? 'is-wrong' : ''}`} key={`${msg?.text}-${shake}-${solved}`}>
              {bubble}
            </div>
          </div>
        </div>
      </section>
      <section className={`wp-stage nt-stage tt-stage ${msg?.kind === 'wrong' ? 'is-shake' : ''}`} data-test-kind={import.meta.env.DEV ? task.kind : undefined}>
        <StairsScene task={task} answer={st.answer} picked={st.picked} solved={solved} onSlot={slot} onStep={step} />
      </section>
      <section className="nt-side nt-secret-side tt-side">
        {task.kind !== 'wrong' && <StairsBank task={task} answer={st.answer} picked={st.picked} solved={solved} onPick={pick} onDrop={drop} />}
        {task.kind === 'wrong' && !solved && <div className="tt-bank__empty">Кое стъпало не следва правилото? Докосни го на стълбата.</div>}
        <div className="nt-secret-actions">
          {solved ? (
            <GameButton color="purple" size="lg" icon="next" onClick={next} className="is-ready nt-next-side tt-next">
              Следваща задача
            </GameButton>
          ) : (
            <>
              <GameButton color="green" size="lg" icon="check" onClick={check} silent>
                Провери
              </GameButton>
              <GameButton
                color="turquoise"
                size="lg"
                icon="help"
                onClick={help}
                disabled={!settings.hintsOn || s.usedHint}
                title={settings.hintsOn ? 'Подсказка (една на задача)' : 'Подсказките са изключени от учителя'}
                silent
              >
                Помощ
              </GameButton>
            </>
          )}
        </div>
        {!solved && (
          // „Изчисти“ и (след 3 неуспешни опита) „Продължи нататък“ — на един ред
          <div className="tt-extra">
            <button type="button" className="tt-clear" onClick={() => (play('remove'), st.clear(), setMsg(null))}>
              <Icon name="clear" size={22} /> Изчисти
            </button>
            {canSkip(s) && (
              <GameButton color="orange" size="md" icon="next" onClick={skip} className="tt-skip">
                Продължи нататък
              </GameButton>
            )}
          </div>
        )}
      </section>
    </div>
  )
}

function ResumePrompt({ session, grade, onResume, onRestart, onExit }: { session: TopSession; grade: Grade; onResume: () => void; onRestart: () => void; onExit: () => void }) {
  const h = hallOf(Math.min(session.index, session.tasks.length - 1))
  const stars = session.results.reduce((a, r) => a + r.stars, 0)
  return (
    <div className="screen wheel-play nt-play tt-play">
      <TowerBackdrop />
      <div className="top-bar">
        <GameButton color="yellow" size="md" icon="map" onClick={onExit}>
          Към парка
        </GameButton>
        <GradeTicket grade={grade} />
        <div className="top-bar__spacer" />
        <SoundControl />
      </div>
      <div className="success-overlay tt-resume">
        <div className="success-card">
          <Mascot mood="wave" size={130} className="success-card__mascot" />
          <div className="success-card__title" style={{ '--chars': 12 } as CSSProperties}>
            Продължаваме ли?
          </div>
          <div className="success-card__praise">
            <Words text={`Имаш недовършено приключение: „${HALLS[h].name}“, задача ${Math.min(session.index, session.tasks.length - 1) + 1} от ${session.tasks.length}.`} />
          </div>
          <div className="tt-resume__stats">
            <span>
              <Icon name="star" size={30} /> {stars}
            </span>
            <span>
              <MagicKey size={60} got={session.keys > 0} /> {session.keys} / 3
            </span>
          </div>
          <div className="tt-resume__btns">
            <GameButton color="green" size="lg" icon="play" onClick={onResume}>
              Продължи приключението
            </GameButton>
            <GameButton color="orange" size="lg" icon="back" onClick={onRestart}>
              Започни отначало
            </GameButton>
          </div>
        </div>
      </div>
    </div>
  )
}

const mmss = (sec: number) => `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`

function TopSummary({
  s,
  onAgain,
  onChooseLevel,
  onChooseMode,
  onExit,
}: {
  s: TopSession
  grade: Grade
  difficulty: Difficulty
  onAgain: () => void
  onChooseLevel: () => void
  onChooseMode: () => void
  onExit: () => void
}) {
  const sum = summary(s)
  const ratio = sum.stars / Math.max(1, sum.maxStars)
  const message =
    ratio >= 0.85
      ? 'Великолепно! Мислиш внимателно и проверяваш всяка стъпка — истински пазител на числата!'
      : ratio >= 0.5
        ? 'Браво! Справи се с трудни задачи. Когато бързаш по-малко и проверяваш, звездите стават повече.'
        : 'Ти не се отказа — това е най-важното! Опитай отново и ще стигнеш още по-високо.'
  return (
    <div className="tt-summary">
      <Confetti seed={sum.stars + 3} />
      <div className="success-card tt-summary__card">
        <div className="success-card__burst" aria-hidden="true" />
        <Mascot mood="cheer" size={140} className="success-card__mascot" />
        <div className="tt-summary__left">
          <div className="tt-summary__title">
            <FitText text="Съкровището е твое!" max={84} min={30} className="success-card__title" />
          </div>
          <div className="tt-chest" aria-hidden="true">
            <svg viewBox="0 0 160 110" width="200" height="138">
              <ellipse cx="80" cy="40" rx="78" ry="38" fill="#fff6a8" opacity="0.7" />
              <rect x="20" y="50" width="120" height="54" rx="12" fill="#ff9f43" stroke="#3b2a5a" strokeWidth="6" />
              <path d="M20 54 Q80 -6 140 54 Z" fill="#ffd23f" stroke="#3b2a5a" strokeWidth="6" transform="rotate(-18 20 54)" />
              <rect x="70" y="62" width="20" height="24" rx="5" fill="#ffd23f" stroke="#3b2a5a" strokeWidth="4" />
              {[48, 80, 112].map((x) => (
                <circle key={x} cx={x} cy="44" r="9" fill={x === 80 ? '#2ed1c4' : '#ff5fa2'} stroke="#3b2a5a" strokeWidth="3" />
              ))}
            </svg>
          </div>
          <div className="success-card__praise tt-summary__msg">
            <Words text={message} />
          </div>
        </div>
        <div className="tt-summary__right">
          <div className="tt-stats" role="list">
            <div role="listitem" className="tt-stat">
              <Icon name="star" size={36} />
              <b>
                {sum.stars} / {sum.maxStars}
              </b>
              <small>звезди</small>
            </div>
            <div role="listitem" className="tt-stat">
              <b>
                {sum.solved} / {sum.total}
              </b>
              <small>решени задачи</small>
            </div>
            <div role="listitem" className="tt-stat">
              <b>{sum.firstTry}</b>
              <small>верни от първия опит</small>
            </div>
            <div role="listitem" className="tt-stat">
              <b>{sum.hints}</b>
              <small>използвани подсказки</small>
            </div>
            <div role="listitem" className="tt-stat">
              <MagicKey size={60} got={sum.keys > 0} />
              <b>{sum.keys} / 3</b>
              <small>ключа</small>
            </div>
            <div role="listitem" className="tt-stat">
              <b>{mmss(sum.durationSec)}</b>
              <small>време</small>
            </div>
          </div>
          <div className="tt-summary__btns">
            <GameButton color="green" size="lg" icon="play" onClick={onAgain}>
              Играй отново
            </GameButton>
            <GameButton color="turquoise" size="lg" icon="back" onClick={onChooseLevel}>
              Друго ниво
            </GameButton>
            <GameButton color="purple" size="lg" icon="next" onClick={onChooseMode}>
              Друга игра
            </GameButton>
            <GameButton color="yellow" size="lg" icon="map" onClick={onExit}>
              Към парка
            </GameButton>
          </div>
        </div>
      </div>
    </div>
  )
}
