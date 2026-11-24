/**
 * „Зайчето в лабиринта“ — приключение от пет кратки мисии (първа група, „Пространствени отношения“).
 * Детето докосва място в сцената: пътечка, място спрямо гъбката или кошничката, пиленце, камъче, гнездо на вратата.
 * Всички цели са зони за докосване от поне 64 реални px и работят и с клавиатура (Tab, Enter).
 * Без таймер и без наказания: при грешка обектът леко трепва, а Звездичка дава кратка насочваща подсказка.
 */
import { useEffect, useLayoutEffect, useReducer, useRef, useState, type CSSProperties, type KeyboardEvent, type ReactNode, type RefObject } from 'react'
import './bunny-maze.css'
import { DemoArt, StepPicture } from './MazeGuide'
import { MazeJourney, type JourneyKind } from './MazeJourney'
import { Mascot } from '../../../components/art/Mascot'
import { Confetti } from '../../../components/ui/Effects'
import { GameButton } from '../../../components/ui/GameButton'
import { Icon } from '../../../components/ui/Icon'
import { useApp } from '../../../core/AppContext'
import { useStage } from '../../../core/Stage'
import { useKg } from '../../KgContext'
import { KgTopBar } from '../../screens/KgTopBar'
import {
  Basket,
  BigMushroom,
  Bunny,
  BunnyHome,
  Bush,
  Cake,
  Carrot,
  Chick,
  Coop,
  Fence,
  Flower,
  Frog,
  GiftArt,
  GoldenCarrotBadge,
  Hedge,
  HillTree,
  MagicDoor,
  MazeDefs,
  Pond,
  Socket,
  Squirrel,
  Stone,
  Stream,
  Sun,
  TreasureArt,
  type BunnyMood,
} from './MazeArt'
import {
  CHICKS,
  MISSION_TITLE,
  chicksInside,
  currentStep,
  makeAdventure,
  mazeReducer,
  mazeText,
  newGame,
  restoreGame,
  stepPhrases,
  stepText,
  stonesLayout,
  totalSteps,
  type ChickId,
  type Gift,
  type MazeState,
  type Place,
  type Step,
  type Vertical,
} from './logic'

const ACTIVITY_ID = 'bunny-maze'
const PRAISE = ['maze.praise.1', 'maze.praise.2', 'maze.praise.3']
/** Проектно поле на всяка сцена; мащабира се равномерно в наличното място. */
const DW = 1000
const DH = 700

/**
 * Недовършеното приключение се пази за сесията (без лични данни): ако детето или учителят излезе
 * по невнимание, при връщане зайчето продължава от същата мисия, без да губи звездичките.
 */
const SAVE_KEY = 'kg.maze.progress.v1'
/** След толкова време без игра приключението започва отначало. */
const SAVE_TTL_MS = 3 * 60 * 60 * 1000
interface Saved {
  group: number | string
  s: MazeState
  started: number
  at: number
}
function loadSaved(group: number | string | null): Saved | null {
  try {
    const raw = JSON.parse(sessionStorage.getItem(SAVE_KEY) || 'null') as Saved | null
    if (!raw || raw.group !== group || typeof raw.at !== 'number' || Date.now() - raw.at > SAVE_TTL_MS) return null
    const s = restoreGame(raw.s)
    return s ? { ...raw, s, started: typeof raw.started === 'number' ? raw.started : Date.now() } : null
  } catch {
    return null
  }
}
function storeSaved(v: Saved | null) {
  try {
    if (v) sessionStorage.setItem(SAVE_KEY, JSON.stringify(v))
    else sessionStorage.removeItem(SAVE_KEY)
  } catch {
    /* без сесийно хранилище играта просто започва отначало */
  }
}

export function BunnyMazeGame({ onExit, onMap }: { onExit: () => void; onMap: () => void }) {
  const [round, setRound] = useState(0)
  const restart = () => {
    storeSaved(null)
    setRound((r) => r + 1)
  }
  return <MazeRound key={round} seed={round} onExit={onExit} onMap={onMap} onRestart={restart} />
}

interface SceneProps {
  s: MazeState
  step: Step
  /** Зона, която да се подчертае (подсказка). */
  hint: string | null
  /** Зона, която да трепне след грешен избор. */
  shake: { target: string; n: number } | null
  tap: (target: string) => void
  motion: boolean
}

/** Пространствените думи в указанието се оцветяват (помагат и на учителя, който чете на глас). */
function emphasize(step: Step, text: string): ReactNode {
  const re =
    step.kind === 'fork'
      ? /(горната|долната)/
      : step.kind === 'hide'
        ? /( в | на | под )/
        : step.kind === 'chicks-in' || step.kind === 'chicks-out'
          ? /(вътре|вън)/
          : step.kind === 'stone'
            ? /(близо|далече)/
            : /(горе|долу)/
  const cls = (w: string) => (/гор|на$|^на|вътре|близо/.test(w.trim()) ? 'is-a' : /^в$/.test(w.trim()) ? 'is-c' : 'is-b')
  return text.split(re).map((part, i) =>
    i % 2 ? (
      <b key={i} className={`mz-kw ${cls(part)}`}>
        {part}
      </b>
    ) : (
      part
    ),
  )
}

/** Колко секунди без действие, преди възможните места да светнат меко (не е таймер на задачата). */
const NUDGE_AFTER_MS = 9000

function MazeRound({ seed, onExit, onMap, onRestart }: { seed: number; onExit: () => void; onMap: () => void; onRestart: () => void }) {
  const { width: w, height: h, portrait, scale } = useStage()
  // телефон хоризонтално: указанието е в горната лента, без групата — повече място за сцената
  const compact = !portrait && scale < 0.55
  const app = useApp()
  const { group, settings, play, say, sayAll, hasVoice, saveResult } = useKg()
  // продължено приключение (ако има) или ново
  const [resumed] = useState(() => loadSaved(group))
  const [s, dispatch] = useReducer(mazeReducer, undefined, () => resumed?.s ?? newGame(makeAdventure(Math.random)))
  // преход по пътечката: при старт (входът → мисия 1), между мисиите, към дома и при продължаване
  const [journey, setJourney] = useState<{ from: number; to: number; kind: JourneyKind } | null>(() =>
    resumed ? { from: resumed.s.m + 1, to: resumed.s.m + 1, kind: 'resume' } : { from: 0, to: 1, kind: 'start' },
  )
  // разкриването на новата сцена: кръг, който расте от мястото на зайчето
  const [reveal, setReveal] = useState<{ x: number; y: number } | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [praise, setPraise] = useState(PRAISE[0])
  const [shake, setShake] = useState<{ target: string; n: number } | null>(null)
  // пример преди първата стъпка на всяка мисия: номер на последната мисия, чийто пример е показан
  const [demoSeen, setDemoSeen] = useState(-1)
  const [taps, setTaps] = useState(0)
  // насочването важи само за текущото „колебание“ (стъпка, част и брой докосвания)
  const [nudgedKey, setNudgedKey] = useState('')
  const motion = app.settings.animationsOn && !(typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)
  const groupMode = settings.workMode === 'group'
  const started = useRef(0)
  const saved = useRef(false)
  const mission = s.missions[s.m]
  const step = currentStep(s)
  const demo = !journey && s.phase === 'play' && s.i === 0 && s.part === 0 && s.wrong === 0 && demoSeen < s.m
  const nudgeKey = `${s.m}.${s.i}.${s.part}.${taps}`
  const nudge = !journey && s.phase === 'play' && nudgedKey === nudgeKey
  const demoIds = [...(s.m === 0 ? ['maze.intro'] : []), `maze.intro.${mission.id}`, `maze.demo.${mission.id}`]

  // мястото за сцената (логически px) — сцената се подрежда според него
  const region = useRef<HTMLDivElement>(null)
  const isDone = s.phase === 'done'
  const [box, setBox] = useState({ w: 0, h: 0 })
  useLayoutEffect(() => {
    const el = region.current
    if (!el) return
    const upd = () => setBox({ w: el.offsetWidth, h: el.offsetHeight })
    upd()
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(upd) : null
    ro?.observe(el)
    return () => ro?.disconnect()
  }, [isDone])

  useEffect(() => {
    started.current = resumed?.started ?? Date.now()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // напредъкът се пази след всяка промяна; след финала — изчиства се
  useEffect(() => {
    if (s.phase === 'done' || !group) storeSaved(null)
    else storeSaved({ group, s, started: started.current || Date.now(), at: Date.now() })
  }, [s, group])

  // „Продължи“ / „Напред“ — едно натискане е една крачка (двойно докосване не прескача празнуването)
  const stepKey = `${s.m}.${s.i}.${s.phase}`
  const advanced = useRef('')
  const advance = () => {
    if (advanced.current === stepKey || journey) return
    advanced.current = stepKey
    play('click')
    setMessage(null)
    setShake(null)
    if (s.phase === 'mission') {
      const last = s.m === s.missions.length - 1
      // след петата мисия: зайчето тръгва към дома си, а финалът идва след прехода
      setJourney({ from: s.m + 1, to: s.m + 2, kind: last ? 'home' : 'next' })
      if (last) return
    }
    dispatch({ type: 'next' })
  }
  const journeyDone = () => {
    const kind = journey?.kind
    setJourney(null)
    setReveal(null)
    if (kind === 'home') dispatch({ type: 'next' })
  }

  // глас (ако има записи): при пример — въведение и пример; иначе — указанието на стъпката
  useEffect(() => {
    if (s.phase !== 'play' || journey) return
    sayAll(demo ? demoIds : stepPhrases(step))
  }, [s.m, s.i, s.phase === 'play', demo, !journey]) // eslint-disable-line react-hooks/exhaustive-deps

  // на пътечката: кратко изречение (ако има запис)
  useEffect(() => {
    if (journey) say(`maze.journey.${journey.kind}`)
  }, [journey?.kind, journey?.to]) // eslint-disable-line react-hooks/exhaustive-deps

  // меко насочване: ако детето се колебае, всички възможни места светват (без да издават отговора)
  useEffect(() => {
    if (s.phase !== 'play' || demo || journey) return
    const t = setTimeout(() => {
      setNudgedKey(nudgeKey)
      say('maze.nudge')
    }, NUDGE_AFTER_MS)
    return () => clearTimeout(t)
  }, [nudgeKey, s.phase, demo, !journey]) // eslint-disable-line react-hooks/exhaustive-deps

  // самостоятелна игра: след изпълнена стъпка — сама продължава (без да бърза); при групова — с „Напред“
  useEffect(() => {
    if (s.phase !== 'success' || groupMode) return
    const last = s.i === mission.steps.length - 1
    const t = setTimeout(() => advance(), last ? 1500 : 1300)
    return () => clearTimeout(t)
  }, [s.phase, s.m, s.i]) // eslint-disable-line react-hooks/exhaustive-deps

  // звездичка за завършена мисия
  useEffect(() => {
    if (s.phase !== 'mission' || journey) return
    play('star')
    sayAll([`maze.done.${mission.id}`, groupMode ? 'maze.star.group' : 'maze.star'])
  }, [s.phase, s.m]) // eslint-disable-line react-hooks/exhaustive-deps

  // край — обобщен резултат без лични данни
  useEffect(() => {
    if (s.phase !== 'done' || saved.current || !group) return
    saved.current = true
    saveResult({ activity: ACTIVITY_ID, group, mode: settings.workMode, tasks: totalSteps(s.missions), firstTry: s.firstTry, hinted: s.hinted, durationSec: Math.round((Date.now() - started.current) / 1000) })
    play('fanfare')
    say(groupMode ? 'maze.end.group' : 'maze.end')
  }, [s.phase]) // eslint-disable-line react-hooks/exhaustive-deps

  const tap = (target: string) => {
    if (s.phase !== 'play' || demo || journey) return
    const next = mazeReducer(s, { type: 'tap', target, hintsOn: settings.hintsOn })
    if (next === s) return
    setTaps((n) => n + 1)
    dispatch({ type: 'tap', target, hintsOn: settings.hintsOn })
    if (next.wrong > s.wrong) {
      play('hint')
      setShake({ target, n: (shake?.n ?? 0) + 1 })
      const id = next.hint?.phrase ?? 'maze.retry'
      setMessage(mazeText(id))
      say(id)
      return
    }
    setMessage(null)
    setShake(null)
    if (next.phase === 'success') {
      const p = PRAISE[(s.m + s.i + s.wrong) % PRAISE.length]
      setPraise(p)
      play('success')
      say(groupMode ? 'maze.next.child' : p)
    } else {
      play('drop')
      if (step.kind === 'door' && next.part > s.part) say(stepPhrases(step)[next.part])
    }
  }
  const startMission = () => {
    play('click')
    setDemoSeen(s.m)
  }

  if (s.phase === 'done') return <Finale seed={seed} motion={motion} groupMode={groupMode} onRestart={() => (play('click'), onRestart())} onExit={onExit} onMap={onMap} w={w} h={h} portrait={portrait} />

  const sceneProps: SceneProps = { s, step, hint: s.hint?.target ?? null, shake, tap, motion }
  const Scene = { fork: ForkScene, hide: HideScene, chicks: ChicksScene, stones: StonesScene, door: DoorScene }[mission.id]
  const instr = stepText(step)
  // балончето на Звездичка в сцената: похвала, подсказка, насочване или „Сега второто!“
  const bubble: { text: ReactNode; mood: 'cheer' | 'encourage'; kind: string } | null = demo || journey
    ? null
    : s.phase === 'success'
      ? {
          text: (
            <>
              <b>{mazeText(praise)}</b>
              {groupMode && <> {mazeText('maze.next.child')}</>}
            </>
          ),
          mood: 'cheer',
          kind: 'praise',
        }
      : message
        ? { text: message, mood: 'encourage', kind: 'hint' }
        : nudge
          ? { text: mazeText('maze.nudge'), mood: 'encourage', kind: 'nudge' }
          : step.kind === 'door' && step.seq.length === 2 && s.part === 1 && s.phase === 'play'
            ? { text: mazeText('maze.select.next'), mood: 'encourage', kind: 'next' }
            : null
  const stars = (
    <span className="kg-maze__stars" aria-label={`Мисия ${s.m + 1} от 5. Звездички: ${s.stars}`} data-stars={s.stars}>
      {s.missions.map((m, i) => (
        <svg key={m.id} viewBox="-44 -44 88 88" className={i < s.stars ? `is-got ${i === s.stars - 1 && s.phase === 'mission' ? 'is-new' : ''}` : i === s.m ? 'is-now' : ''} aria-hidden="true">
          <path d="M0 -40 L 11 -13 L 40 -12 L 17 6 L 25 36 L 0 19 L -25 36 L -17 6 L -40 -12 L -11 -13 Z" />
        </svg>
      ))}
    </span>
  )
  // на вертикален екран звездичките са в горната лента, а указанието заема цялата ширина под нея
  // по време на прехода лентата казва накъде върви зайчето (вместо указанието)
  const nextIdx = journey ? Math.min(journey.to, 5) - 1 : 0
  const bar = journey ? (
    <div className="kg-maze__bar is-journey" aria-live="polite" data-bar>
      <span className="kg-maze__pic is-mascot">
        <Mascot mood="happy" size={60} />
      </span>
      <p className="kg-maze__text">
        {journey.kind === 'home' ? (
          mazeText('maze.journey.home')
        ) : (
          <>
            {mazeText(`maze.journey.${journey.kind}`)} <span className="kg-maze__goal">Мисия {nextIdx + 1}: {MISSION_TITLE[s.missions[nextIdx].id]}</span>
          </>
        )}
      </p>
      {!portrait && stars}
    </div>
  ) : s.phase === 'mission' ? (
    <div className="kg-maze__bar is-journey" aria-live="polite" data-bar>
      <span className="kg-maze__pic is-mascot">
        <Mascot mood="cheer" size={60} />
      </span>
      <p className="kg-maze__text">
        Мисия {s.m + 1} от {s.missions.length} е изпълнена!
      </p>
      {!portrait && stars}
    </div>
  ) : (
    <div className="kg-maze__bar" aria-live="polite" data-bar>
      <span className="kg-maze__pic">
        <StepPicture step={step} part={s.part} />
      </span>
      <p className="kg-maze__text">{emphasize(step, instr)}</p>
      {!portrait && stars}
    </div>
  )
  const onReveal = (at: { x: number; y: number }) => {
    if (journey?.kind === 'home') journeyDone()
    else setReveal(at)
  }
  const restartFromMap = () => {
    play('click')
    onRestart()
  }
  return (
    <div
      className={`screen kg-screen kg-maze kg-maze--${mission.id} ${compact ? 'is-compact' : ''} ${motion ? '' : 'is-still'}`}
      data-mission={mission.id}
      data-step={JSON.stringify(step)}
      data-index={`${s.m}.${s.i}`}
      data-phase={s.phase}
      data-part={s.part}
      data-demo-open={demo ? '1' : '0'}
    >
      <MazeBackdrop w={w} h={h} portrait={portrait} />
      <KgTopBar
        onBack={onExit}
        backLabel="Към атракцията"
        center={portrait ? stars : bar}
        extra={hasVoice(stepPhrases(step)[0]) ? <GameButton color="turquoise" size="md" icon="sound" onClick={() => sayAll(demo ? demoIds : stepPhrases(step).slice(s.part))} aria-label="Чуй отново" title="Чуй отново" silent className="kg-replay" /> : null}
      />
      {portrait && <div className="kg-maze__strip">{bar}</div>}

      <div className="kg-maze__region" ref={region}>
        {box.w > 0 && box.h > 0 && (
          <svg
            className={`kg-maze__scene ${nudge && !demo ? 'is-nudge' : ''} ${journey ? (reveal ? 'is-reveal' : 'is-hidden') : ''}`}
            style={reveal ? ({ '--rx': `${reveal.x * 100}%`, '--ry': `${reveal.y * 100}%` } as CSSProperties) : undefined}
            viewBox={`0 0 ${box.w} ${box.h}`} width={box.w} height={box.h} role="group" aria-label={MISSION_TITLE[mission.id]}>
            <MazeDefs />
            <Scene key={mission.id} {...sceneProps} box={box} />
          </svg>
        )}
        {journey && box.w > 0 && box.h > 0 && (
          <MazeJourney
            key={`${journey.kind}-${journey.to}`}
            {...journey}
            stars={s.stars}
            box={box}
            motion={motion}
            onReveal={onReveal}
            onDone={journeyDone}
            onLand={() => play('drop')}
            onRestart={journey.kind === 'resume' ? restartFromMap : undefined}
          />
        )}
        {bubble && <SceneBubble key={`${bubble.kind}-${s.m}-${s.i}-${s.wrong}`} region={region} box={box} mood={bubble.mood} kind={bubble.kind} text={bubble.text} />}
        {demo && (
          <div className="kg-maze__demo" data-demo={mission.id}>
            <div className="kg-maze__demo-card" role="dialog" aria-label={`Мисия ${s.m + 1}: ${MISSION_TITLE[mission.id]}`}>
              <p className="kg-maze__demo-title">
                Мисия {s.m + 1}: {MISSION_TITLE[mission.id]}
              </p>
              <DemoArt mission={mission.id} />
              <div className="kg-maze__demo-side">
                <p className="kg-maze__demo-text">
                  <Mascot mood="happy" size={70} />
                  <span>
                    {s.m === 0 && <span className="kg-maze__demo-story">{mazeText('maze.intro')} </span>}
                    {mazeText(`maze.demo.${mission.id}`)}
                  </span>
                </p>
                <BigGo onGo={startMission} icon="play" label={mazeText('maze.demo.go')} variant="check" data={{ 'data-demo-go': '1' }} className="kg-maze__go" />
              </div>
            </div>
          </div>
        )}
      </div>

      {s.phase === 'mission' && !journey ? (
        <div className="kg-maze__next is-mission">
          <div className="kg-maze__reward" role="status" data-reward={mission.id}>
            <MissionJoy />
            <div className="kg-maze__reward-side">
              <p className="kg-maze__reward-title">{mazeText(`maze.done.${mission.id}`)}</p>
              <p className="kg-maze__reward-text">
                <Mascot mood="cheer" size={72} />
                <span>{mazeText(groupMode ? 'maze.star.group' : 'maze.star')}</span>
              </p>
              <BigGo onGo={advance} icon="next" label="Продължи" variant="next" data={{ 'data-next': '1' }} />
            </div>
          </div>
        </div>
      ) : s.phase === 'success' && groupMode && !journey ? (
        <div className="kg-maze__next">
          <BigGo onGo={advance} icon="next" label="Продължи" variant="next" data={{ 'data-next': '1' }} />
        </div>
      ) : null}
    </div>
  )
}

/** Голям кръгъл бутон („Да опитаме!“, „Продължи“); получава фокуса за работа с клавиатура. */
function BigGo({ onGo, icon, label, variant, data, className = '' }: { onGo: () => void; icon: 'play' | 'next'; label: string; variant: 'check' | 'next'; data: Record<string, string>; className?: string }) {
  const ref = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    ref.current?.focus({ preventScroll: true })
  }, [])
  return (
    <button ref={ref} type="button" className={`kg-round-btn kg-round-btn--${variant} ${className}`} onClick={onGo} {...data}>
      <span className="kg-round-btn__face">
        <Icon name={icon} size={icon === 'play' ? 72 : 84} />
      </span>
      <span className="kg-round-btn__label">{label}</span>
    </button>
  )
}

/** Радостта при завършена мисия: зайчето подскача, звездичката долита, наоколо цъфтят цветя. */
function MissionJoy() {
  return (
    <svg className="kg-maze__joy" viewBox="-180 -300 360 330" aria-hidden="true">
      <MazeDefs />
      <g className="mz-rays">
        {Array.from({ length: 12 }, (_, i) => (
          <path key={i} d="M-14 -130 L 0 -290 L 14 -130 Z" fill={i % 2 ? '#fff3a8' : '#ffe0ef'} transform={`rotate(${i * 30} 0 -130)`} />
        ))}
      </g>
      <ellipse cx="0" cy="8" rx="150" ry="20" fill="#a9e0a6" stroke="#4a3560" strokeWidth="5" />
      {[-130, -84, 84, 130].map((x, i) => (
        <g key={x} transform={`translate(${x} ${8 - (i % 2) * 6})`}>
          <g className="mz-bloom" style={{ animationDelay: `${0.25 + i * 0.12}s` } as CSSProperties}>
            <Flower color={['#ff7aa8', '#ffd25e', '#9b8cff', '#ff9f43'][i]} s={1.15} />
          </g>
        </g>
      ))}
      <g className="mz-joy">
        <Bunny mood="happy" />
      </g>
      <g transform="translate(112 -222)">
        <g className="mz-joy-star">
          <GiftArt id="star" />
        </g>
      </g>
    </svg>
  )
}

/**
 * Балончето на Звездичка в сцената. Не заема място над сцената: застава в ъгъла,
 * който е най-далече от местата за докосване, и не пречи на докосването (pointer-events: none).
 */
function SceneBubble({ region, box, mood, kind, text }: { region: RefObject<HTMLDivElement | null>; box: { w: number; h: number }; mood: 'cheer' | 'encourage'; kind: string; text: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  const [corner, setCorner] = useState<'tl' | 'tr' | 'bl' | 'br'>('tl')
  useLayoutEffect(() => {
    const r = region.current?.getBoundingClientRect()
    const b = ref.current?.getBoundingClientRect()
    if (!r || !b) return
    const zones = [...(region.current?.querySelectorAll('[data-zone] .mz-hit') ?? [])].map((z) => {
      const q = z.getBoundingClientRect()
      return { x: q.left + q.width / 2 - r.left, y: q.top + q.height / 2 - r.top, rad: q.width / 2 }
    })
    const cand = { tl: [b.width / 2, b.height / 2], tr: [r.width - b.width / 2, b.height / 2], bl: [b.width / 2, r.height - b.height / 2], br: [r.width - b.width / 2, r.height - b.height / 2] } as const
    let best: keyof typeof cand = 'tl'
    let bestScore = -Infinity
    for (const k of Object.keys(cand) as (keyof typeof cand)[]) {
      const [cx, cy] = cand[k]
      // най-малкото разстояние от ръба на балончето до ръба на зона (по-голямо е по-добре)
      const score = zones.length ? Math.min(...zones.map((z) => Math.hypot(Math.max(0, Math.abs(z.x - cx) - b.width / 2), Math.max(0, Math.abs(z.y - cy) - b.height / 2)) - z.rad)) : 0
      if (score > bestScore + 1) {
        bestScore = score
        best = k
      }
    }
    setCorner(best)
  }, [box.w, box.h, kind]) // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div ref={ref} className={`kg-maze__bubble is-${corner} is-${kind}`} role="status" data-bubble={kind}>
      <Mascot mood={mood} size={64} />
      <span className="kg-maze__bubble-text">{text}</span>
    </div>
  )
}

// ───────────── общи елементи на сцените ─────────────

/**
 * Подредба на проектното поле DW×DH в наличното място: рисунките се мащабират равномерно (k),
 * а на висок (вертикален) екран местата се разпределят и по височината (ky ≥ k), за да няма празно поле.
 */
function layout(box: { w: number; h: number }) {
  const tall = box.h > box.w * 0.9
  // на тесен екран — цялата ширина на полето; иначе краищата (само декорация) може леко да се отрежат
  const k = Math.min(box.w / (DW * (tall ? 1 : 0.9)), box.h / DH)
  const ky = tall ? Math.min(box.h / DH, k * 1.9) : k
  const ox = (box.w - DW * k) / 2
  const oy = box.h - DH * ky
  const X = (x: number) => ox + x * k
  const Y = (y: number) => oy + y * ky
  return { k, ky, X, Y, at: (x: number, y: number, sc = 1) => `translate(${X(x)} ${Y(y)}) scale(${k * sc})` }
}
/** Зона за докосване: достъпна с клавиатура, с подсказка (светлина) и трептене при грешка. */
function Zone({
  id,
  label,
  cx,
  cy,
  r,
  hint,
  shake,
  tap,
  disabled,
  children,
}: {
  id: string
  label: string
  cx: number
  cy: number
  r: number
  hint: string | null
  shake: SceneProps['shake']
  tap: (t: string) => void
  disabled: boolean
  children?: ReactNode
}) {
  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      if (!disabled) tap(id)
    }
  }
  const wrong = shake?.target === id
  return (
    <g
      key={wrong ? `${id}-${shake!.n}` : id}
      className={`mz-zone ${hint === id ? 'is-hint' : ''} ${wrong ? 'is-wrong' : ''}`}
      data-zone={id}
      role="button"
      aria-label={label}
      aria-disabled={disabled}
      tabIndex={disabled ? -1 : 0}
      onClick={() => !disabled && tap(id)}
      onKeyDown={onKey}
    >
      {hint === id && <circle className="mz-ring" cx={cx} cy={cy} r={r * 0.95} />}
      <g className="mz-zone__art">{children}</g>
      <circle className="mz-hit" cx={cx} cy={cy} r={r} />
    </g>
  )
}

/** Зайчето се придвижва плавно (подскок) до новото място. */
function Mover({ x, y, k = 1, motion, children, className = '' }: { x: number; y: number; k?: number; motion: boolean; children: ReactNode; className?: string }) {
  const [hop, setHop] = useState(0)
  const prev = useRef({ x, y })
  useEffect(() => {
    if (prev.current.x !== x || prev.current.y !== y) setHop((n) => n + 1)
    prev.current = { x, y }
  }, [x, y])
  return (
    <g className={`mz-mover ${motion ? '' : 'is-still'} ${className}`} style={{ transform: `translate(${x}px, ${y}px) scale(${k})` } as CSSProperties}>
      <g key={hop} className={motion && hop > 0 ? 'mz-hop' : ''}>
        {children}
      </g>
    </g>
  )
}

// ───────────── 1. Разклонът (горе / долу) ─────────────

const FORK = {
  start: { x: 90, y: 400 },
  join: { x: 330, y: 380 },
  ends: { up: { x: 860, y: 175 }, down: { x: 860, y: 600 } } as Record<Vertical, { x: number; y: number }>,
}

function ForkScene({ s, step, hint, shake, tap, motion, box }: SceneProps & { box: { w: number; h: number } }) {
  const st = step as Extract<Step, { kind: 'fork' }>
  const L = layout(box)
  const { X, Y, k, at } = L
  const done = s.phase !== 'play'
  const pos = done ? FORK.ends[st.target] : FORK.start
  const variant = st.scene % 3
  const J = FORK.join
  const trunk = `M${X(FORK.start.x - 80)} ${Y(FORK.start.y)} C ${X(200)} ${Y(FORK.start.y)} ${X(260)} ${Y(J.y)} ${X(J.x)} ${Y(J.y)}`
  const branch = (v: Vertical) => {
    const e = FORK.ends[v]
    return `M${X(J.x)} ${Y(J.y)} C ${X(520)} ${Y(J.y)} ${X(560)} ${Y(e.y)} ${X(e.x)} ${Y(e.y)}`
  }
  // зона по втората половина на пътечката (двете не се застъпват при разклона)
  const branchHit = (v: Vertical) => {
    const e = FORK.ends[v]
    return `M${X(560)} ${Y((J.y + e.y) / 2)} L ${X(e.x)} ${Y(e.y)}`
  }
  const paths = [trunk, branch('up'), branch('down')]
  const hedge = (x: number, y: number, w: number, h: number) => <Hedge x={X(x)} y={Y(y)} w={w * k} h={h * k} />
  return (
    <g>
      {/* първо всички контури, после пясъкът — така разклонът е без шевове */}
      {paths.map((d, i) => (
        <path key={`o${i}`} d={d} fill="none" stroke="#4a3560" strokeWidth={112 * k} strokeLinecap="round" />
      ))}
      {paths.map((d, i) => (
        <path key={`f${i}`} d={d} fill="none" stroke="url(#mz-path)" strokeWidth={100 * k} strokeLinecap="round" />
      ))}
      {paths.map((d, i) => (
        <path key={`d${i}`} d={d} fill="none" stroke="#e9c27a" strokeWidth={5 * k} strokeDasharray={`${6 * k} ${22 * k}`} strokeLinecap="round" />
      ))}
      {/* живият плет между пътечките */}
      {hedge(600, 330, 420, 110)}
      {hedge(-20, 170, 300, 100)}
      {hedge(-20, 560, 260, 100)}
      {/* горе — хълм със слънце; долу — езерце */}
      <g transform={at([760, 700, 820][variant], [40, 60, 30][variant])}>
        <Sun r={44} />
      </g>
      <Zone id="up" label="Горната пътечка" cx={X(FORK.ends.up.x - 40)} cy={Y(FORK.ends.up.y - 30)} r={150 * k} hint={hint} shake={shake} tap={tap} disabled={done}>
        <path d={branchHit('up')} className="mz-branch-hit" strokeWidth={150 * k} />
        <g transform={at(FORK.ends.up.x + 90, FORK.ends.up.y + 20, 0.62)}>
          <HillTree />
        </g>
      </Zone>
      <Zone id="down" label="Долната пътечка" cx={X(FORK.ends.down.x - 40)} cy={Y(FORK.ends.down.y)} r={150 * k} hint={hint} shake={shake} tap={tap} disabled={done}>
        <path d={branchHit('down')} className="mz-branch-hit" strokeWidth={150 * k} />
        <g transform={at(FORK.ends.down.x + 70, FORK.ends.down.y + 70, 0.62)}>
          <Pond />
        </g>
      </Zone>
      <g transform={at(140, 690, 0.8)}>
        <Bush />
      </g>
      <Mover key={`${s.i}`} x={X(pos.x)} y={Y(pos.y) + 40 * k} k={0.95 * k} motion={motion}>
        <Bunny mood={done ? 'happy' : 'look'} />
      </Mover>
    </g>
  )
}

// ───────────── 2. Съкровищата на катеричката (в / на / под) ─────────────

/** Гъбата и кошничката стоят на земята (y = 660); местата са спрямо тях (без разтягане по височина). */
const GROUND = 660
const HIDE_AT: Record<Place, { x: number; y: number; zx: number; zy: number }> = {
  on: { x: 470, y: 298, zx: 470, zy: 270 },
  under: { x: 380, y: 610, zx: 400, zy: 585 },
  in: { x: 820, y: 520, zx: 820, zy: 515 },
}
const PLACE_LABEL: Record<Place, string> = { on: 'На гъбката', under: 'Под гъбката', in: 'В кошничката' }

function HideScene({ s, step, hint, shake, tap, box }: SceneProps & { box: { w: number; h: number } }) {
  const st = step as Extract<Step, { kind: 'hide' }>
  const { X, Y, k, at } = layout(box)
  // спрямо земята: предметите не се разтягат по височина
  const G = (y: number) => Y(GROUND) + (y - GROUND) * k
  const steps = s.missions[s.m].steps as Extract<Step, { kind: 'hide' }>[]
  const placed = steps.filter((_, i) => i < s.i || (i === s.i && s.phase !== 'play'))
  const done = s.phase !== 'play'
  const treasureAt = (p: Place) =>
    placed
      .filter((x) => x.target === p)
      .map((x) => (
        <g key={x.item} className="mz-placed" transform={`translate(${X(HIDE_AT[p].x)} ${G(HIDE_AT[p].y)}) scale(${0.9 * k})`}>
          <TreasureArt id={x.item} />
        </g>
      ))
  return (
    <g>
      <Hedge x={X(-10)} y={Y(330)} w={180 * k} h={90 * k} />
      <g transform={at(470, GROUND, 1.15)}>
        <BigMushroom />
      </g>
      <g transform={at(820, GROUND, 1.15)}>
        <Basket front={false} />
      </g>
      {treasureAt('in')}
      <g transform={at(820, GROUND, 1.15)}>
        <Basket back={false} />
      </g>
      {treasureAt('on')}
      {treasureAt('under')}
      {(['on', 'under', 'in'] as Place[]).map((p) => (
        <Zone key={p} id={p} label={PLACE_LABEL[p]} cx={X(HIDE_AT[p].zx)} cy={G(HIDE_AT[p].zy)} r={112 * k} hint={hint} shake={shake} tap={tap} disabled={done}>
          {/* меко „местенце“ — показва къде може да се сложи съкровището */}
          {!done && !placed.some((x) => x.target === p) && <ellipse className="mz-spot" cx={X(HIDE_AT[p].x)} cy={G(HIDE_AT[p].y + 18)} rx={58 * k} ry={22 * k} />}
        </Zone>
      ))}
      <g transform={at(130, 680)}>
        <Squirrel>
          {!done && (
            <g className="mz-held">
              <TreasureArt id={st.item} />
            </g>
          )}
        </Squirrel>
      </g>
    </g>
  )
}

// ───────────── 3. Пиленцата у дома (вътре / вън) ─────────────

const PEN = { x: 560, y: 470, rx: 290, ry: 140 }
const CHICK_OUT: Record<ChickId, { x: number; y: number }> = { c1: { x: 110, y: 640 }, c2: { x: 150, y: 300 }, c3: { x: 930, y: 660 } }
const CHICK_IN: Record<ChickId, { x: number; y: number }> = { c1: { x: 360, y: 470 }, c2: { x: 560, y: 520 }, c3: { x: 760, y: 460 } }

function ChicksScene({ s, step, hint, shake, tap, motion, box }: SceneProps & { box: { w: number; h: number } }) {
  const { X, Y, k, at } = layout(box)
  // вътре в оградката — спрямо центъра ѝ (оградката не се разтяга по височина)
  const P = (p: { x: number; y: number }, isIn: boolean) => ({ x: X(p.x), y: isIn ? Y(PEN.y) + (p.y - PEN.y) * k : Y(p.y) })
  const inside = chicksInside(s)
  const done = s.phase !== 'play'
  const outsideHint = hint === 'outside'
  // всички пиленца са в един слой (между задната и предната ограда) — така прескачането е плавно;
  // местата отвън са встрани от оградата и предната ограда не ги закрива
  const chick = (c: ChickId) => {
    const isIn = inside.includes(c)
    const p = P(isIn ? CHICK_IN[c] : CHICK_OUT[c], isIn)
    const label = isIn ? 'Пиленце вътре в оградката' : 'Пиленце вън от оградката'
    return (
      <Zone key={c} id={c} label={label} cx={p.x} cy={p.y - 45 * k} r={98 * k} hint={outsideHint && !isIn ? c : hint} shake={shake} tap={tap} disabled={done}>
        <Mover x={p.x} y={p.y} k={1.05 * k} motion={motion}>
          <Chick happy={isIn && done} />
        </Mover>
      </Zone>
    )
  }
  return (
    <g data-inside={inside.join(',')} data-kind={step.kind}>
      <g transform={`translate(${X(830)} ${Y(PEN.y) - 140 * k}) scale(${0.85 * k})`}>
        <Coop />
      </g>
      <g transform={at(PEN.x, PEN.y)}>
        <Fence rx={PEN.rx} ry={PEN.ry} part="ground" />
        <Fence rx={PEN.rx} ry={PEN.ry} part="back" />
      </g>
      {CHICKS.map(chick)}
      <g transform={at(PEN.x, PEN.y)} pointerEvents="none">
        <Fence rx={PEN.rx} ry={PEN.ry} part="front" />
      </g>
    </g>
  )
}

// ───────────── 4. Камъчетата в поточето (близо / далече) ─────────────

function StonesScene({ s, step, hint, shake, tap, motion, box }: SceneProps & { box: { w: number; h: number } }) {
  const { X, Y, k, at } = layout(box)
  const steps = s.missions[s.m].steps as Extract<Step, { kind: 'stone' }>[]
  const lay = stonesLayout(steps)
  const L = lay[s.i]
  const done = s.phase !== 'play'
  const st = step as Extract<Step, { kind: 'stone' }>
  const pos = done ? L.after : L.bunny
  const used = lay.slice(1, s.i + 1).map((l) => l.bunny)
  const finalStep = st.target === 'far'
  return (
    <g>
      {/* поточето е през цялата ширина */}
      <Stream x={-60} y={Y(95)} w={box.w + 120} h={Y(610) - Y(95)} />
      <g transform={at(70, 690, 0.8)}>
        <Bush />
      </g>
      <g transform={at(930, 80, 0.7)}>
        <Bush />
      </g>
      {used.map((p, i) => (
        <g key={i} transform={at(p.x, p.y)}>
          <Stone />
        </g>
      ))}
      {(['near', 'far'] as const).map((z) => {
        const p = L[z]
        return (
          <Zone key={z} id={z} label={z === 'near' ? 'Близкото камъче' : 'Далечното камъче'} cx={X(p.x)} cy={Y(p.y) - 20 * k} r={118 * k} hint={hint} shake={shake} tap={tap} disabled={done}>
            <g transform={at(p.x, p.y)}>
              <Stone lit={hint === z} />
            </g>
            {finalStep && z === 'far' && (
              <g transform={`translate(${X(p.x)} ${Y(p.y) - 30 * k}) scale(${0.9 * k})`}>
                <Frog happy={done} />
              </g>
            )}
          </Zone>
        )
      })}
      {!finalStep && (
        <g transform={at(900, 680, 0.7)} aria-hidden="true">
          <Frog />
        </g>
      )}
      <Mover x={X(pos.x)} y={Y(pos.y) - 26 * k} k={0.72 * k} motion={motion}>
        <Bunny mood={done ? 'happy' : 'look'} flip={(finalStep ? L.far.x : L.near.x) < pos.x} />
      </Mover>
    </g>
  )
}

// ───────────── 5. Вълшебната врата (горе / долу, двустъпково указание) ─────────────

const DOOR = { x: 560, y: 680 }
const SOCKET: Record<Vertical, { x: number; y: number }> = { up: { x: 560, y: 110 }, down: { x: 560, y: 560 } }

function DoorScene({ s, step, hint, shake, tap, box }: SceneProps & { box: { w: number; h: number } }) {
  // вратата и гнездата са едно цяло — не се разтягат; стъпват на земята долу
  const { X, Y, k } = layout(box)
  const t = `translate(${X(0)} ${Y(DH) - DH * k}) scale(${k})`
  const st = step as Extract<Step, { kind: 'door' }>
  const steps = s.missions[s.m].steps as Extract<Step, { kind: 'door' }>[]
  // подаръците по местата: последният поставен горе и долу
  const placed: Partial<Record<Vertical, Gift>> = {}
  steps.forEach((d, i) => {
    const parts = i < s.i ? d.seq.length : i === s.i ? (s.phase === 'play' ? s.part : d.seq.length) : 0
    d.seq.slice(0, parts).forEach((g) => (placed[g.target] = g.item))
  })
  const done = s.phase !== 'play'
  const holding = !done ? st.seq[s.part].item : null
  const open = s.phase === 'mission'
  return (
    <g transform={t}>
      <Hedge x={-200} y={250} w={520} h={130} />
      <Hedge x={800} y={250} w={520} h={130} />
      <Hedge x={-200} y={420} w={480} h={130} />
      <Hedge x={840} y={420} w={480} h={130} />
      <g transform={`translate(${DOOR.x} ${DOOR.y}) scale(1)`}>
        <MagicDoor open={open} stars={s.stars} />
      </g>
      {(['up', 'down'] as Vertical[]).map((v) => (
        <Zone key={v} id={v} label={v === 'up' ? 'Горе, над вратата' : 'Долу, на вратата'} cx={SOCKET[v].x} cy={SOCKET[v].y} r={112} hint={hint} shake={shake} tap={tap} disabled={done}>
          <g transform={`translate(${SOCKET[v].x} ${SOCKET[v].y})`}>
            <Socket lit={hint === v}>
              {placed[v] && (
                <g className="mz-placed" key={placed[v]}>
                  <GiftArt id={placed[v]!} />
                </g>
              )}
            </Socket>
          </g>
        </Zone>
      ))}
      <g transform="translate(180 690) scale(0.9)">
        <Bunny mood={done ? 'happy' : 'idle'} />
      </g>
      {holding && (
        <g className="mz-bubble" transform="translate(180 395)">
          <circle r="66" fill="#fffdf6" stroke="#4a3560" strokeWidth="5" />
          <path d="M-14 60 L 0 92 L 14 60" fill="#fffdf6" stroke="#4a3560" strokeWidth="5" strokeLinejoin="round" />
          <g key={holding}>
            <GiftArt id={holding} />
          </g>
        </g>
      )}
      <g transform="translate(900 690) scale(0.75)">
        <Frog happy={open} />
      </g>
      <g transform="translate(990 690) scale(0.8)">
        <Chick happy={open} />
      </g>
    </g>
  )
}

// ───────────── фон и финал ─────────────

/** Приказен фон: небе, далечен лабиринт от жив плет, поляна. */
function MazeBackdrop({ w, h, portrait }: { w: number; h: number; portrait: boolean }) {
  const horizon = h * (portrait ? 0.26 : 0.36)
  const rows = [horizon - 40, horizon - 6]
  return (
    <svg className="kg-scene" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" aria-hidden="true">
      <MazeDefs />
      <defs>
        <linearGradient id="mz-sky" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#c9ecff" />
          <stop offset="1" stopColor="#fff3df" />
        </linearGradient>
        <linearGradient id="mz-meadow" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#c4f0b6" />
          <stop offset="1" stopColor="#97d993" />
        </linearGradient>
      </defs>
      <rect width={w} height={h} fill="url(#mz-sky)" />
      <path d={`M0 ${horizon} C ${w * 0.25} ${horizon - 60} ${w * 0.5} ${horizon + 20} ${w * 0.75} ${horizon - 40} S ${w} ${horizon - 10} ${w} ${horizon} V ${h} H 0 Z`} fill="#b3e0b8" />
      {rows.map((y, r) =>
        Array.from({ length: Math.ceil(w / 260) + 1 }, (_, i) => {
          const x = i * 260 - (r ? 130 : 40)
          return (
            <g key={`${r}-${i}`} opacity={r ? 0.95 : 0.7}>
              <Hedge x={x} y={y} w={200 + (i % 2) * 30} h={r ? 70 : 54} flowers={r === 1} />
            </g>
          )
        }),
      )}
      <rect x="0" y={horizon + 60} width={w} height={h - horizon - 60} fill="url(#mz-meadow)" />
      {Array.from({ length: Math.ceil(w / 140) }, (_, i) => (
        <circle key={i} cx={i * 140 + 50} cy={h - 30 - ((i * 47) % 80)} r="7" fill={['#fff', '#ffd1e3', '#e6dcff', '#fff3a8'][i % 4]} stroke="#4a3560" strokeWidth="2" />
      ))}
    </svg>
  )
}

function Finale({ seed, motion, groupMode, onRestart, onExit, onMap, w, h, portrait }: { seed: number; motion: boolean; groupMode: boolean; onRestart: () => void; onExit: () => void; onMap: () => void; w: number; h: number; portrait: boolean }) {
  const mood: BunnyMood = 'happy'
  return (
    <div className={`screen kg-screen kg-maze is-done ${motion ? '' : 'is-still'}`} data-phase="done">
      <MazeBackdrop w={w} h={h} portrait={portrait} />
      <Confetti seed={seed + 31} />
      <KgTopBar onBack={onExit} backLabel="Към атракцията" />
      <div className="kg-done">
        <h1 className="kg-done__title">{groupMode ? 'Браво, деца!' : 'Ура!'} Зайчето е у дома!</h1>
        {/* градината оживява постепенно: домът, лехата с морковчета, цветята, приятелите, Златното морковче */}
        <svg className="kg-maze__garden" viewBox="0 0 1200 560" aria-label="Домът на зайчето в Морковената градина: празник със Златното морковче" role="img" data-garden="1">
          <MazeDefs />
          <ellipse cx="600" cy="520" rx="590" ry="66" fill="#a9e0a6" stroke="#4a3560" strokeWidth="5" />
          <g transform="translate(205 515) scale(0.95)">
            <g className="mz-fin-rise">
              <BunnyHome lit />
            </g>
          </g>
          <ellipse cx="960" cy="452" rx="210" ry="34" fill="#b98656" stroke="#4a3560" strokeWidth="5" />
          {[790, 850, 910, 970, 1030, 1090, 1140].map((x, i) => (
            <g key={x} transform={`translate(${x} ${470 - (i % 2) * 14})`}>
              <g className="mz-grow" style={{ animationDelay: `${0.35 + i * 0.1}s` } as CSSProperties}>
                <Carrot s={0.62} />
              </g>
            </g>
          ))}
          {[40, 395, 575, 735, 1170].map((x, i) => (
            <g key={x} transform={`translate(${x} ${545 - (i % 2) * 8})`}>
              <g className="mz-grow" style={{ animationDelay: `${0.9 + i * 0.12}s` } as CSSProperties}>
                <Flower color={['#ff7aa8', '#ffd25e', '#9b8cff', '#ff9f43', '#5ec8f0'][i]} s={1.3} />
              </g>
            </g>
          ))}
          <g transform="translate(660 505)">
            <g className="mz-fin-pop" style={{ animationDelay: '1.2s' } as CSSProperties}>
              <Cake />
            </g>
          </g>
          <g transform="translate(470 522) scale(0.62)">
            <g className="mz-fin-pop" style={{ animationDelay: '1.4s' } as CSSProperties}>
              <Chick happy />
            </g>
          </g>
          <g transform="translate(860 530) scale(0.8)">
            <g className="mz-fin-pop" style={{ animationDelay: '1.55s' } as CSSProperties}>
              <Squirrel />
            </g>
          </g>
          <g transform="translate(1035 538) scale(0.7)">
            <g className="mz-fin-pop" style={{ animationDelay: '1.7s' } as CSSProperties}>
              <Frog happy />
            </g>
          </g>
          <g transform="translate(345 530)">
            <g className="mz-joy is-loop">
              <Bunny mood={mood} />
            </g>
          </g>
          <g transform="translate(640 165) scale(0.8)">
            <g className="mz-fin-drop" style={{ animationDelay: '1.9s' } as CSSProperties}>
              <GoldenCarrotBadge />
            </g>
          </g>
          {Array.from({ length: 5 }, (_, i) => (
            <g key={i} transform={`translate(${430 + i * 105} ${i % 2 ? 322 : 296}) scale(0.5)`}>
              <g className="mz-fin-star" style={{ animationDelay: `${2.2 + i * 0.12}s` } as CSSProperties}>
                <GiftArt id="star" />
              </g>
            </g>
          ))}
        </svg>
        <p className="kg-done__text">{mazeText(groupMode ? 'maze.end.group' : 'maze.end')}</p>
        <div className="kg-done__buttons">
          <GameButton color="green" size="lg" icon="refresh" onClick={onRestart}>
            Играй пак
          </GameButton>
          <GameButton color="turquoise" size="lg" icon="back" onClick={onExit}>
            Към лабиринта
          </GameButton>
          <GameButton color="yellow" size="lg" icon="map" onClick={onMap}>
            Към картата
          </GameButton>
        </div>
      </div>
    </div>
  )
}
