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
import { ArtProvider, useArt } from '../../art/sprites/Sprite'
import { ART_GAME } from './art'
import { PH, PW, isPhonePortrait, stonePortrait } from './portrait'
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
  return (
    <ArtProvider game={ART_GAME}>
      <MazeRound key={round} seed={round} onExit={onExit} onMap={onMap} onRestart={restart} />
    </ArtProvider>
  )
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
  const hasArt = useArt().has('bg-garden')
  const step = currentStep(s)
  const demo = !journey && s.phase === 'play' && s.i === 0 && s.part === 0 && s.wrong === 0 && demoSeen < s.m
  const nudgeKey = `${s.m}.${s.i}.${s.part}.${taps}`
  const nudge = !journey && s.phase === 'play' && nudgedKey === nudgeKey
  const demoIds = [...(s.m === 0 ? ['maze.intro'] : []), `maze.intro.${mission.id}`, `maze.demo.${mission.id}`]

  // мястото за сцената (логически px) — сцената се подрежда според него
  const region = useRef<HTMLDivElement>(null)
  const isDone = s.phase === 'done'
  const [box, setBox] = useState({ w: 0, h: 0 })
  // телефон вертикално — по формата на целия екран, не на мястото за сцената (то се мени с дължината на указанието)
  const sceneBox = { ...box, phone: isPhonePortrait({ w, h }) }
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
      className={`screen kg-screen kg-maze kg-maze--${mission.id} ${compact ? 'is-compact' : ''} ${motion ? '' : 'is-still'} ${hasArt ? 'has-art' : ''}`}
      data-mission={mission.id}
      data-step={JSON.stringify(step)}
      data-index={`${s.m}.${s.i}`}
      data-phase={s.phase}
      data-part={s.part}
      data-demo-open={demo ? '1' : '0'}
    >
      <MazeBackdrop w={w} h={h} portrait={portrait} light={s.m} />
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
            <Scene key={mission.id} {...sceneProps} box={sceneBox} />
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
    // зоните за докосване и героите, които не бива да се закриват (катеричката, зайчето)
    const zones = [...(region.current?.querySelectorAll('[data-zone] .mz-hit, [data-bubble-avoid]') ?? [])].map((z) => {
      const q = z.getBoundingClientRect()
      return { x: q.left + q.width / 2 - r.left, y: q.top + q.height / 2 - r.top, rad: Math.max(q.width, q.height) / 2 }
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
 * Подредба на проектното поле DW×DH (на телефон вертикално — PW×PH, вж. portrait.ts) в наличното място: рисунките се мащабират равномерно (k),
 * а на висок (вертикален) екран местата се разпределят и по височината (ky ≥ k), за да няма празно поле.
 */
/** Мястото за сцената; phone — телефон във вертикално положение (решава се по целия екран, вж. portrait.ts). */
type SceneBox = { w: number; h: number; phone?: boolean }

function layout(box: SceneBox) {
  if (box.phone) {
    // телефон вертикално: поле 600×1000 по цялата ширина; местата се разпределят и по височината (до ×1,2)
    const k = Math.min(box.w / PW, box.h / PH)
    const ky = Math.min(box.h / PH, k * 1.2)
    const ox = (box.w - PW * k) / 2
    const oy = box.h - PH * ky
    const X = (x: number) => ox + x * k
    const Y = (y: number) => oy + y * ky
    return { k, ky, X, Y, P: true, at: (x: number, y: number, sc = 1) => `translate(${X(x)} ${Y(y)}) scale(${k * sc})` }
  }
  const tall = box.h > box.w * 0.9
  // на тесен екран — цялата ширина на полето; иначе краищата (само декорация) може леко да се отрежат
  const k = Math.min(box.w / (DW * (tall ? 1 : 0.9)), box.h / DH)
  const ky = tall ? Math.min(box.h / DH, k * 1.9) : k
  const ox = (box.w - DW * k) / 2
  const oy = box.h - DH * ky
  const X = (x: number) => ox + x * k
  const Y = (y: number) => oy + y * ky
  return { k, ky, X, Y, P: false, at: (x: number, y: number, sc = 1) => `translate(${X(x)} ${Y(y)}) scale(${k * sc})` }
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

type Pt = { x: number; y: number }
type Place3 = [number, number, number]
/** Разклонът: хоризонтално поле и вертикален телефон. */
const FORK_GEO = {
  land: {
    start: { x: 90, y: 400 },
    join: { x: 330, y: 380 },
    ends: { up: { x: 860, y: 175 }, down: { x: 860, y: 600 } } as Record<Vertical, Pt>,
    trunk: [200, 260],
    branch: [520, 560],
    hedges: [
      [600, 330, 420, 110],
      [-20, 170, 300, 100],
      [-20, 560, 260, 100],
    ],
    tree: [950, 195, 0.62] as Place3,
    pond: [930, 670, 0.62] as Place3,
    bush: [140, 690, 0.8] as Place3,
    suns: [
      [760, 40],
      [700, 60],
      [820, 30],
    ],
  },
  portrait: {
    start: { x: 80, y: 600 },
    join: { x: 170, y: 600 },
    ends: { up: { x: 470, y: 260 }, down: { x: 470, y: 870 } } as Record<Vertical, Pt>,
    trunk: [110, 140],
    branch: [300, 330],
    hedges: [
      [330, 500, 290, 110],
      [-20, 330, 200, 90],
      [-20, 760, 180, 90],
    ],
    tree: [480, 280, 0.75] as Place3,
    pond: [440, 920, 0.8] as Place3,
    bush: [95, 985, 0.7] as Place3,
    suns: [
      [480, 60],
      [440, 70],
      [520, 50],
    ],
  },
}

function ForkScene({ s, step, hint, shake, tap, motion, box }: SceneProps & { box: SceneBox }) {
  const st = step as Extract<Step, { kind: 'fork' }>
  const L = layout(box)
  const { X, Y, k, at } = L
  const FORK = L.P ? FORK_GEO.portrait : FORK_GEO.land
  const done = s.phase !== 'play'
  const pos = done ? FORK.ends[st.target] : FORK.start
  const variant = st.scene % 3
  // рисуваният фон има свое слънце
  const paintedSky = useArt().has('bg-garden')
  const J = FORK.join
  const trunk = `M${X(FORK.start.x - 80)} ${Y(FORK.start.y)} C ${X(FORK.trunk[0])} ${Y(FORK.start.y)} ${X(FORK.trunk[1])} ${Y(J.y)} ${X(J.x)} ${Y(J.y)}`
  const branch = (v: Vertical) => {
    const e = FORK.ends[v]
    return `M${X(J.x)} ${Y(J.y)} C ${X(FORK.branch[0])} ${Y(J.y)} ${X(FORK.branch[1])} ${Y(e.y)} ${X(e.x)} ${Y(e.y)}`
  }
  // зона по втората половина на пътечката (двете не се застъпват при разклона)
  const branchHit = (v: Vertical) => {
    const e = FORK.ends[v]
    return `M${X(FORK.branch[1])} ${Y((J.y + e.y) / 2)} L ${X(e.x)} ${Y(e.y)}`
  }
  const paths = [trunk, branch('up'), branch('down')]
  return (
    <g>
      {/* първо всички контури, после пясъкът — така разклонът е без шевове */}
      {paths.map((d, i) => (
        <path key={`o${i}`} d={d} className="mz-path-edge" fill="none" stroke="#4a3560" strokeWidth={112 * k} strokeLinecap="round" />
      ))}
      {paths.map((d, i) => (
        <path key={`f${i}`} d={d} fill="none" stroke="url(#mz-path)" strokeWidth={100 * k} strokeLinecap="round" />
      ))}
      {paths.map((d, i) => (
        <path key={`d${i}`} d={d} fill="none" stroke="#e9c27a" strokeWidth={5 * k} strokeDasharray={`${6 * k} ${22 * k}`} strokeLinecap="round" />
      ))}
      {/* живият плет между пътечките */}
      {FORK.hedges.map(([x, y, w, h], i) => (
        <Hedge key={i} x={X(x)} y={Y(y)} w={w * k} h={h * k} />
      ))}
      {/* горе — хълм със слънце; долу — езерце */}
      {!paintedSky && (
        <g transform={at(FORK.suns[variant][0], FORK.suns[variant][1])}>
          <Sun r={44} />
        </g>
      )}
      <Zone id="up" label="Горната пътечка" cx={X(FORK.ends.up.x - 40)} cy={Y(FORK.ends.up.y - 30)} r={150 * k} hint={hint} shake={shake} tap={tap} disabled={done}>
        <path d={branchHit('up')} className="mz-branch-hit" strokeWidth={150 * k} />
        <g transform={at(...FORK.tree)}>
          <HillTree />
        </g>
      </Zone>
      <Zone id="down" label="Долната пътечка" cx={X(FORK.ends.down.x - 40)} cy={Y(FORK.ends.down.y)} r={150 * k} hint={hint} shake={shake} tap={tap} disabled={done}>
        <path d={branchHit('down')} className="mz-branch-hit" strokeWidth={150 * k} />
        <g transform={at(...FORK.pond)}>
          <Pond />
        </g>
      </Zone>
      <g transform={at(...FORK.bush)}>
        <Bush />
      </g>
      <Mover key={`${s.i}`} x={X(pos.x)} y={Y(pos.y) + 40 * k} k={0.95 * k} motion={motion}>
        <Bunny mood={done ? 'happy' : 'look'} />
      </Mover>
    </g>
  )
}

// ───────────── 2. Съкровищата на катеричката (в / на / под) ─────────────

/**
 * Гъбата и кошничката стоят на земята; местата са спрямо земята на своя предмет (без разтягане по височина).
 * Хоризонтално двете са на една линия (y = 660); на вертикален телефон кошничката е отпред, долу.
 */
const HIDE_GEO = {
  land: {
    mush: { x: 470, g: 660 },
    basket: { x: 820, g: 660 },
    at: {
      on: { x: 470, y: 298, zx: 470, zy: 270 },
      under: { x: 380, y: 610, zx: 400, zy: 585 },
      in: { x: 820, y: 520, zx: 820, zy: 515 },
    } as Record<Place, { x: number; y: number; zx: number; zy: number }>,
    hedge: [-10, 330, 180, 90],
    squirrel: [130, 680],
  },
  portrait: {
    mush: { x: 300, g: 570 },
    basket: { x: 445, g: 930 },
    at: {
      on: { x: 300, y: 208, zx: 300, zy: 180 },
      under: { x: 210, y: 520, zx: 230, zy: 495 },
      in: { x: 445, y: 790, zx: 445, zy: 785 },
    } as Record<Place, { x: number; y: number; zx: number; zy: number }>,
    hedge: [-10, 300, 150, 80],
    // рисуваната катеричка е по-широка (опашката) — малко навътре, за да не се отрязва
    squirrel: [130, 950],
  },
}
const PLACE_LABEL: Record<Place, string> = { on: 'На гъбката', under: 'Под гъбката', in: 'В кошничката' }

function HideScene({ s, step, hint, shake, tap, box }: SceneProps & { box: SceneBox }) {
  const st = step as Extract<Step, { kind: 'hide' }>
  const L = layout(box)
  const { X, Y, k, at } = L
  const H = L.P ? HIDE_GEO.portrait : HIDE_GEO.land
  const HIDE_AT = H.at
  // спрямо земята на предмета: предметите не се разтягат по височина
  const G = (p: Place, y: number) => {
    const g = p === 'in' ? H.basket.g : H.mush.g
    return Y(g) + (y - g) * k
  }
  const steps = s.missions[s.m].steps as Extract<Step, { kind: 'hide' }>[]
  const placed = steps.filter((_, i) => i < s.i || (i === s.i && s.phase !== 'play'))
  const done = s.phase !== 'play'
  const treasureAt = (p: Place) =>
    placed
      .filter((x) => x.target === p)
      .map((x) => (
        <g key={x.item} className="mz-placed" transform={`translate(${X(HIDE_AT[p].x)} ${G(p, HIDE_AT[p].y)}) scale(${0.9 * k})`}>
          <TreasureArt id={x.item} />
        </g>
      ))
  return (
    <g>
      <Hedge x={X(H.hedge[0])} y={Y(H.hedge[1])} w={H.hedge[2] * k} h={H.hedge[3] * k} />
      <g transform={at(H.mush.x, H.mush.g, 1.15)}>
        <BigMushroom />
      </g>
      <g transform={at(H.basket.x, H.basket.g, 1.15)}>
        <Basket front={false} />
      </g>
      {treasureAt('in')}
      <g transform={at(H.basket.x, H.basket.g, 1.15)}>
        <Basket back={false} />
      </g>
      {treasureAt('on')}
      {treasureAt('under')}
      {(['on', 'under', 'in'] as Place[]).map((p) => (
        <Zone key={p} id={p} label={PLACE_LABEL[p]} cx={X(HIDE_AT[p].zx)} cy={G(p, HIDE_AT[p].zy)} r={112 * k} hint={hint} shake={shake} tap={tap} disabled={done}>
          {/* меко „местенце“ — показва къде може да се сложи съкровището */}
          {!done && !placed.some((x) => x.target === p) && <ellipse className="mz-spot" cx={X(HIDE_AT[p].x)} cy={G(p, HIDE_AT[p].y + 18)} rx={58 * k} ry={22 * k} />}
        </Zone>
      ))}
      <g transform={at(H.squirrel[0], H.squirrel[1])} data-bubble-avoid={L.P || undefined}>
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

const CHICKS_GEO = {
  land: {
    pen: { x: 560, y: 470, rx: 290, ry: 140 },
    out: { c1: { x: 110, y: 640 }, c2: { x: 150, y: 300 }, c3: { x: 930, y: 660 } } as Record<ChickId, Pt>,
    in: { c1: { x: 360, y: 470 }, c2: { x: 560, y: 520 }, c3: { x: 760, y: 460 } } as Record<ChickId, Pt>,
    coop: 830,
  },
  portrait: {
    pen: { x: 300, y: 640, rx: 270, ry: 140 },
    out: { c1: { x: 95, y: 950 }, c2: { x: 110, y: 360 }, c3: { x: 505, y: 955 } } as Record<ChickId, Pt>,
    in: { c1: { x: 110, y: 625 }, c2: { x: 300, y: 695 }, c3: { x: 490, y: 615 } } as Record<ChickId, Pt>,
    coop: 455,
  },
}

function ChicksScene({ s, step, hint, shake, tap, motion, box }: SceneProps & { box: SceneBox }) {
  const L = layout(box)
  const { X, Y, k, at } = L
  const C = L.P ? CHICKS_GEO.portrait : CHICKS_GEO.land
  const PEN = C.pen
  // вътре в оградката — спрямо центъра ѝ (оградката не се разтяга по височина)
  const P = (p: { x: number; y: number }, isIn: boolean) => ({ x: X(p.x), y: isIn ? Y(PEN.y) + (p.y - PEN.y) * k : Y(p.y) })
  const inside = chicksInside(s)
  const done = s.phase !== 'play'
  const outsideHint = hint === 'outside'
  // всички пиленца са в един слой (между задната и предната ограда) — така прескачането е плавно;
  // местата отвън са встрани от оградата и предната ограда не ги закрива
  const chick = (c: ChickId) => {
    const isIn = inside.includes(c)
    const p = P(isIn ? C.in[c] : C.out[c], isIn)
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
      <g transform={`translate(${X(C.coop)} ${Y(PEN.y) - PEN.ry * k}) scale(${0.85 * k})`}>
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

const STONES_GEO = {
  land: { stream: [95, 610], bushes: [[70, 690, 0.8], [930, 80, 0.7]] as Place3[], frog: [900, 680, 0.7] as Place3 },
  portrait: { stream: [95, 610].map((y) => stonePortrait({ x: 0, y }).y), bushes: [[60, 985, 0.7], [540, 200, 0.6]] as Place3[], frog: [540, 985, 0.7] as Place3 },
}

function StonesScene({ s, step, hint, shake, tap, motion, box }: SceneProps & { box: SceneBox }) {
  const L0 = layout(box)
  const { X, Y, k, at } = L0
  const SG = L0.P ? STONES_GEO.portrait : STONES_GEO.land
  const steps = s.missions[s.m].steps as Extract<Step, { kind: 'stone' }>[]
  // на вертикален телефон местата се пренасят в полето 600×1000 (подредбата е същата)
  const map = (p: Pt) => (L0.P ? stonePortrait(p) : p)
  const lay = stonesLayout(steps).map((l) => ({ bunny: map(l.bunny), near: map(l.near), far: map(l.far), after: map(l.after) }))
  const L = lay[s.i]
  const done = s.phase !== 'play'
  const st = step as Extract<Step, { kind: 'stone' }>
  const pos = done ? L.after : L.bunny
  const used = lay.slice(1, s.i + 1).map((l) => l.bunny)
  const finalStep = st.target === 'far'
  return (
    <g>
      {/* поточето е през цялата ширина */}
      <Stream x={-60} y={Y(SG.stream[0])} w={box.w + 120} h={Y(SG.stream[1]) - Y(SG.stream[0])} />
      {SG.bushes.map((b, i) => (
        <g key={i} transform={at(...b)}>
          <Bush />
        </g>
      ))}
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
        <g transform={at(...SG.frog)} aria-hidden="true">
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

/**
 * На вертикален телефон (поле 600×1000): вратата с гнездата е вдясно, умалена 0,9 (вътре — същите координати);
 * зайчето с балончето е вляво долу, жабчето и пиленцето — над тях.
 */
const DOOR_GEO = {
  land: {
    door: undefined as string | undefined,
    hedges: [
      [-200, 250, 520, 130],
      [800, 250, 520, 130],
      [-200, 420, 480, 130],
      [840, 420, 480, 130],
    ],
    bunny: 'translate(180 690) scale(0.9)',
    bubble: 'translate(180 395)',
    frog: 'translate(900 690) scale(0.75)',
    chick: 'translate(990 690) scale(0.8)',
  },
  portrait: {
    door: 'translate(375 935) scale(0.9) translate(-560 -680)' as string | undefined,
    hedges: [[-150, 330, 320, 120]],
    bunny: 'translate(85 975) scale(0.9)',
    bubble: 'translate(85 680)',
    frog: 'translate(55 590) scale(0.75)',
    chick: 'translate(125 470) scale(0.8)',
  },
}

function DoorScene({ s, step, hint, shake, tap, box }: SceneProps & { box: SceneBox }) {
  // вратата и гнездата са едно цяло — не се разтягат; стъпват на земята долу
  const L = layout(box)
  const { X, Y, k } = L
  const D = L.P ? DOOR_GEO.portrait : DOOR_GEO.land
  const t = L.P ? `translate(${X(0)} ${box.h - PH * k}) scale(${k})` : `translate(${X(0)} ${Y(DH) - DH * k}) scale(${k})`
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
      {D.hedges.map(([x, y, w, h], i) => (
        <Hedge key={i} x={x} y={y} w={w} h={h} />
      ))}
      <g transform={D.door}>
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
      </g>
      <g transform={D.bunny} data-bubble-avoid={L.P || undefined}>
        <Bunny mood={done ? 'happy' : 'idle'} />
      </g>
      {holding && (
        <g className="mz-bubble" transform={D.bubble}>
          <circle r="66" fill="#fffdf6" stroke="#4a3560" strokeWidth="5" />
          <path d="M-14 60 L 0 92 L 14 60" fill="#fffdf6" stroke="#4a3560" strokeWidth="5" strokeLinejoin="round" />
          <g key={holding}>
            <GiftArt id={holding} />
          </g>
        </g>
      )}
      <g transform={D.frog}>
        <Frog happy={open} />
      </g>
      <g transform={D.chick}>
        <Chick happy={open} />
      </g>
    </g>
  )
}

// ───────────── фон и финал ─────────────

/** Светлината по пътя: свежа сутрин → предобед → пладне → златист следобед → вълшебно злато → залез (финал). */
const LIGHT: [string, string][] = [
  ['rgba(185,222,255,0.22)', 'rgba(255,255,255,0)'],
  ['rgba(255,250,215,0.12)', 'rgba(255,255,255,0)'],
  ['rgba(255,238,175,0.18)', 'rgba(255,240,190,0.05)'],
  ['rgba(255,205,125,0.24)', 'rgba(255,214,150,0.09)'],
  ['rgba(255,178,120,0.30)', 'rgba(255,196,150,0.13)'],
  ['rgba(255,150,170,0.32)', 'rgba(255,190,140,0.16)'],
]
/** Изрязването на квадратния фон за всяка мисия: леко изместване, сякаш градината се сменя, докато зайчето върви. */
const PAN = [0.3, 0.42, 0.54, 0.66, 0.5, 0.5]
/** Хоризонтът на рисувания фон (дял от височината му) и къде да е на екрана. */
const BG_HORIZON = 0.275

/** Приказен фон: рисуваната поляна (ако я има) + светлината на мисията; иначе — векторният фон. */
function MazeBackdrop({ w, h, portrait, light }: { w: number; h: number; portrait: boolean; light: number }) {
  const bg = useArt().url('bg-garden')
  if (bg) {
    const S = Math.max(w, h) * 1.06
    const target = h * (portrait ? 0.25 : 0.32)
    const y = Math.min(0, Math.max(h - S, target - BG_HORIZON * S))
    const x = -(S - w) * PAN[Math.min(light, PAN.length - 1)]
    return (
      <div className="kg-scene kg-maze__bg" aria-hidden="true" data-light={light}>
        <img src={bg} alt="" draggable={false} decoding="async" className="kg-maze__bg-img" data-sprite="bg-garden" style={{ width: S, height: S, transform: `translate(${x}px, ${y}px)` }} />
        {LIGHT.map(([top, bottom], i) => (
          <div key={i} className={`kg-maze__light ${i === light ? 'is-on' : ''}`} style={{ background: `linear-gradient(180deg, ${top}, ${bottom} 70%)` }} />
        ))}
      </div>
    )
  }
  return <VectorBackdrop w={w} h={h} portrait={portrait} />
}

function VectorBackdrop({ w, h, portrait }: { w: number; h: number; portrait: boolean }) {
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
  const hasArt = useArt().has('bg-garden')
  // телефон във вертикално положение: отделна, по-висока композиция на градината (зайчето е главният герой)
  const tall = isPhonePortrait({ w, h })
  return (
    <div className={`screen kg-screen kg-maze is-done ${motion ? '' : 'is-still'} ${hasArt ? 'has-art' : ''} ${tall ? 'is-tall' : ''}`} data-phase="done">
      <MazeBackdrop w={w} h={h} portrait={portrait} light={5} />
      <Confetti seed={seed + 31} />
      <KgTopBar onBack={onExit} backLabel="Към атракцията" />
      <div className="kg-done">
        <h1 className="kg-done__title">{groupMode ? 'Браво, деца!' : 'Ура!'} Зайчето е у дома!</h1>
        {/* градината оживява постепенно: домът, лехата с морковчета, цветята, приятелите, Златното морковче */}
        <FinaleGarden tall={tall} mood={mood} />
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

/**
 * Градината на финала: домът, лехата, цветята, тортата, приятелите, зайчето, Златното морковче и петте звездички.
 * Широк екран — досегашната композиция 1200×560. Телефон вертикално — 600×620: зайчето отпред в средата,
 * приятелите около него, домът отзад, наградата и звездичките отгоре. Последователността на появяване е една и съща.
 */
const FINALE_GEO = {
  wide: {
    viewBox: '0 0 1200 560',
    ground: [600, 520, 590, 66],
    home: 'translate(205 515) scale(0.95)',
    bed: [960, 452, 210, 34],
    carrots: { xs: [790, 850, 910, 970, 1030, 1090, 1140], y: 470, dy: 14, s: 0.62 },
    flowers: { at: [40, 395, 575, 735, 1170].map((x, i) => [x, 545 - (i % 2) * 8]), s: 1.3 },
    cake: 'translate(660 505)',
    chick: 'translate(470 522) scale(0.62)',
    squirrel: 'translate(860 530) scale(0.8)',
    frog: 'translate(1035 538) scale(0.7)',
    bunny: 'translate(345 530)',
    badge: 'translate(640 165) scale(0.8)',
    stars: { at: Array.from({ length: 5 }, (_, i) => [430 + i * 105, i % 2 ? 322 : 296]), s: 0.5 },
  },
  tall: {
    viewBox: '0 8 600 604',
    ground: [300, 568, 296, 42],
    home: 'translate(190 400) scale(0.62)',
    bed: [445, 405, 125, 22],
    carrots: { xs: [345, 385, 425, 465, 505, 545], y: 418, dy: 10, s: 0.5 },
    flowers: { at: [[30, 596], [205, 602], [395, 600], [575, 596]], s: 1.1 },
    cake: 'translate(125 595) scale(0.58)',
    chick: 'translate(75 465) scale(0.95)',
    squirrel: 'translate(455 598) scale(0.9)',
    frog: 'translate(548 470) scale(0.85)',
    bunny: 'translate(300 600) scale(1.1)',
    badge: 'translate(300 92) scale(0.72)',
    stars: { at: [[105, 214], [200, 200], [300, 236], [400, 200], [495, 214]], s: 0.55 },
  },
}

function FinaleGarden({ tall, mood }: { tall: boolean; mood: BunnyMood }) {
  const G = tall ? FINALE_GEO.tall : FINALE_GEO.wide
  const [gx, gy, grx, gry] = G.ground
  const [bx, by, brx, bry] = G.bed
  return (
    <svg className="kg-maze__garden" viewBox={G.viewBox} aria-label="Домът на зайчето в Морковената градина: празник със Златното морковче" role="img" data-garden="1" data-layout={tall ? 'tall' : 'wide'}>
      <MazeDefs />
      <ellipse cx={gx} cy={gy} rx={grx} ry={gry} fill="#a9e0a6" stroke="#4a3560" strokeWidth="5" />
      <g transform={G.home}>
        <g className="mz-fin-rise">
          <BunnyHome lit />
        </g>
      </g>
      <ellipse cx={bx} cy={by} rx={brx} ry={bry} fill="#b98656" stroke="#4a3560" strokeWidth="5" />
      {G.carrots.xs.map((x, i) => (
        <g key={x} transform={`translate(${x} ${G.carrots.y - (i % 2) * G.carrots.dy})`}>
          <g className="mz-grow" style={{ animationDelay: `${0.35 + i * 0.1}s` } as CSSProperties}>
            <Carrot s={G.carrots.s} />
          </g>
        </g>
      ))}
      {G.flowers.at.map(([x, y], i) => (
        <g key={x} transform={`translate(${x} ${y})`}>
          <g className="mz-grow" style={{ animationDelay: `${0.9 + i * 0.12}s` } as CSSProperties}>
            <Flower color={['#ff7aa8', '#ffd25e', '#9b8cff', '#ff9f43', '#5ec8f0'][i]} s={G.flowers.s} />
          </g>
        </g>
      ))}
      <g transform={G.cake}>
        <g className="mz-fin-pop" style={{ animationDelay: '1.2s' } as CSSProperties}>
          <Cake />
        </g>
      </g>
      <g transform={G.chick}>
        <g className="mz-fin-pop" style={{ animationDelay: '1.4s' } as CSSProperties}>
          <Chick happy />
        </g>
      </g>
      <g transform={G.squirrel}>
        <g className="mz-fin-pop" style={{ animationDelay: '1.55s' } as CSSProperties}>
          <Squirrel />
        </g>
      </g>
      <g transform={G.frog}>
        <g className="mz-fin-pop" style={{ animationDelay: '1.7s' } as CSSProperties}>
          <Frog happy />
        </g>
      </g>
      <g transform={G.bunny}>
        <g className="mz-joy is-loop">
          <Bunny mood={mood} />
        </g>
      </g>
      <g transform={G.badge}>
        <g className="mz-fin-drop" style={{ animationDelay: '1.9s' } as CSSProperties}>
          <GoldenCarrotBadge />
        </g>
      </g>
      {G.stars.at.map(([x, y], i) => (
        <g key={i} transform={`translate(${x} ${y}) scale(${G.stars.s})`}>
          <g className="mz-fin-star" style={{ animationDelay: `${2.2 + i * 0.12}s` } as CSSProperties}>
            <GiftArt id="star" />
          </g>
        </g>
      ))}
    </svg>
  )
}
