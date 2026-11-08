import { useRef, useState, type ReactNode } from 'react'
import { useApp } from '../../core/AppContext'
import { useStage } from '../../core/Stage'
import { bestStars, type TaskCount } from '../../core/storage'
import { NumberTowerArt } from '../../components/art/Attractions'
import { MascotSays } from '../../components/art/Mascot'
import { StarRow } from '../../components/ui/Effects'
import { GameButton } from '../../components/ui/GameButton'
import { GradeTicket } from '../../components/ui/GradeTicket'
import { Icon } from '../../components/ui/Icon'
import { SoundControl } from '../../components/ui/SoundControl'
import { GameSummary } from '../magic-tokens/GameSummary'
import { DIFFICULTIES, DIFFICULTY_DESCRIPTIONS, DIFFICULTY_LABELS, type Difficulty, type Grade } from '../magic-tokens/logic'
import type { TaskOutcome } from '../magic-tokens/PlayBoard'
import { FitName } from '../multiplication-wheel/MultiplicationWheelGame'
import { FLOOR_COLORS, TowerBackdrop } from './TowerScene'
import { BuildBoard } from './build/BuildBoard'
import { SecretBoard } from './secret/SecretBoard'
import { SECRET_FLOORS, SECRET_HIDDEN, STEPS, generateSecretTasks, type SecretTask } from './secret/logic'
import { FLOORS, RANGE_MAX, fmt, generateBuildTasks, type BuildTask } from './build/logic'

const GAME_ID = 'number-tower'
const nowMs = () => Date.now()

export type TowerModeId = 'build' | 'secret' | 'lift' | 'top'

export const TOWER_MODES: { id: TowerModeId; label: string; description: string; color: string; ready: boolean; result: string }[] = [
  { id: 'build', label: 'Построй кулата', description: 'Подреди етажите', color: 'pink', ready: true, result: 'Кулата: Построй кулата' },
  { id: 'secret', label: 'Тайните етажи', description: 'Открий липсващото число', color: 'purple', ready: true, result: 'Кулата: Тайните етажи' },
  { id: 'lift', label: 'Числовият асансьор', description: 'Сравни и намери етажа', color: 'turquoise', ready: false, result: 'Кулата: Числовият асансьор' },
  { id: 'top', label: 'Върхът на кулата', description: 'Приключение в три етапа', color: 'orange', ready: false, result: 'Кулата: Върхът на кулата' },
]
const BUILD_RESULT_MODE = TOWER_MODES[0].result
const SECRET_RESULT_MODE = TOWER_MODES[1].result

/** Само при разработка: ?testBuild=12.35.81.7a,470.407.704.740d (числата в тавата; a — възходящо, d — низходящо). */
function testBuildTasks(): BuildTask[] | null {
  if (!import.meta.env.DEV) return null
  const raw = new URLSearchParams(window.location.search).get('testBuild')
  if (!raw) return null
  return raw.split(',').map((q, i) => ({ id: i + 1, order: q.endsWith('d') ? ('desc' as const) : ('asc' as const), numbers: q.replace(/[ad]$/, '').split('.').map(Number) }))
}

/** Само при разработка: ?testSecret=20.30.40.50.60:2,100.90.80.70.60.50:1-4 (етажите отдолу нагоре : тайните прозорци). */
function testSecretTasks(): SecretTask[] | null {
  if (!import.meta.env.DEV) return null
  const raw = new URLSearchParams(window.location.search).get('testSecret')
  if (!raw) return null
  return raw.split(',').map((q, i) => {
    const [vs, hs] = q.split(':')
    const values = vs.split('.').map(Number)
    return { id: i + 1, values, hidden: hs.split('-').map(Number), step: Math.abs(values[1] - values[0]), direction: values[1] > values[0] ? ('up' as const) : ('down' as const) }
  })
}

type Phase =
  | { name: 'modes' }
  | { name: 'setup' }
  | { name: 'build'; tasks: BuildTask[]; startedAt: number }
  | { name: 'secret'; tasks: SecretTask[]; startedAt: number }
  | { name: 'summary'; outcomes: TaskOutcome[]; durationSec: number }

type PlayMode = 'build' | 'secret'

/** „Кулата на числата“: игри → настройки → задачи → обобщение. */
export function NumberTowerGame({ grade, onExit }: { grade: Grade; onExit: () => void }) {
  const { settings, updateSettings, saveResult } = useApp()
  const locked = !settings.studentCanChoose
  const setDifficulty = (difficulty: Difficulty) => updateSettings({ difficulty })
  const setCount = (n: number) => updateSettings({ taskCount: (n === 5 || n === 15 ? n : 10) as TaskCount })
  const [phase, setPhase] = useState<Phase>({ name: 'modes' })
  const [mode, setMode] = useState<PlayMode>('build')
  const savedGames = useRef(new Set<number>())
  const d = settings.difficulty
  const n = settings.taskCount

  const start = () =>
    mode === 'secret'
      ? setPhase({ name: 'secret', tasks: testSecretTasks() ?? generateSecretTasks(grade, d, n), startedAt: nowMs() })
      : setPhase({ name: 'build', tasks: testBuildTasks() ?? generateBuildTasks(grade, d, n), startedAt: nowMs() })

  const finish = (outcomes: TaskOutcome[], startedAt: number) => {
    // всяка игра се записва само веднъж — и при двойно докосване на „Резултат“
    if (savedGames.current.has(startedAt)) return
    savedGames.current.add(startedAt)
    const durationSec = Math.round((nowMs() - startedAt) / 1000)
    saveResult({
      game: GAME_ID,
      mode: mode === 'secret' ? SECRET_RESULT_MODE : BUILD_RESULT_MODE,
      grade,
      difficulty: d,
      total: outcomes.length,
      solved: outcomes.filter((o) => o.solved).length,
      firstTry: outcomes.filter((o) => o.firstTry).length,
      stars: outcomes.reduce((a, o) => a + o.stars, 0),
      maxStars: outcomes.length * 3,
      durationSec,
    })
    setPhase({ name: 'summary', outcomes, durationSec })
  }

  switch (phase.name) {
    case 'modes':
      return (
        <TowerModes
          grade={grade}
          onChoose={(m) => {
            setMode(m === 'secret' ? 'secret' : 'build')
            setPhase({ name: 'setup' })
          }}
          onExit={onExit}
        />
      )
    case 'setup':
      return (
        <TowerSetup
          grade={grade}
          difficulty={d}
          count={n}
          locked={locked}
          title={mode === 'secret' ? 'Тайните етажи' : 'Построй кулата'}
          resultMode={mode === 'secret' ? SECRET_RESULT_MODE : BUILD_RESULT_MODE}
          info={
            mode === 'secret' ? (
              <>
                <span>
                  {SECRET_FLOORS[d]} етажа · {SECRET_HIDDEN[d] === 2 ? '2 тайни прозореца' : '1 таен прозорец'}
                </span>
                <span>Стъпки: {STEPS[grade][d].map(fmt).join(', ')}</span>
                <span>{SECRET_ORDER_TEXT[d]}</span>
                <span>{SECRET_ANSWER_TEXT[d]}</span>
              </>
            ) : (
              <>
                <span>
                  {FLOORS[d]} етажа · 0 – {fmt(RANGE_MAX[grade])}
                </span>
                <span>{NUMBERS_TEXT[d]}</span>
                <span>{ORDER_TEXT[d]}</span>
                <span>{HELP_TEXT[d]}</span>
              </>
            )
          }
          onDifficulty={setDifficulty}
          onCount={setCount}
          onStart={start}
          onBack={() => setPhase({ name: 'modes' })}
          onExit={onExit}
        />
      )
    case 'build':
      return <BuildBoard key={phase.startedAt} grade={grade} difficulty={d} tasks={phase.tasks} onFinish={(o) => finish(o, phase.startedAt)} onExit={onExit} />
    case 'secret':
      return <SecretBoard key={phase.startedAt} grade={grade} difficulty={d} tasks={phase.tasks} onFinish={(o) => finish(o, phase.startedAt)} onExit={onExit} />
    case 'summary':
      return (
        <GameSummary
          grade={grade}
          difficulty={d}
          modeName={mode === 'secret' ? 'Тайните етажи' : 'Построй кулата'}
          outcomes={phase.outcomes}
          durationSec={phase.durationSec}
          onAgain={start}
          onChooseLevel={() => setPhase({ name: 'setup' })}
          onChooseMode={() => setPhase({ name: 'modes' })}
          onExit={onExit}
        />
      )
  }
}

/** Мини-кула за картите на игрите. */
function MiniFloors({ labels, ghost = -1, hidden = -1, lift = -1 }: { labels: string[]; ghost?: number; hidden?: number; lift?: number }) {
  return (
    <svg viewBox="0 0 160 130" width="170" height="138" aria-hidden="true">
      {labels.map((l, i) => {
        const [c] = FLOOR_COLORS[i % FLOOR_COLORS.length]
        const y = 100 - i * 30
        return (
          <g key={i} transform={`translate(30 ${y})`}>
            <rect width="100" height="26" rx="8" fill={i === ghost ? 'none' : c} stroke="#3b2a5a" strokeWidth="3" strokeDasharray={i === ghost ? '6 5' : undefined} />
            <rect x="28" y="4" width="44" height="18" rx="5" fill={i === hidden ? '#2a1660' : '#fffaf0'} stroke="#3b2a5a" strokeWidth="2" />
            <text x="50" y="18" textAnchor="middle" className="art-text" fontSize="13" fill={i === hidden ? '#fff6a8' : '#3b2a5a'}>
              {i === hidden ? '?' : i === ghost ? '' : l}
            </text>
            {i === lift && <rect x="104" y="1" width="20" height="24" rx="4" fill="#ffd23f" stroke="#3b2a5a" strokeWidth="2.5" />}
          </g>
        )
      })}
      <path d="M80 2 l5 10 11 1.6 -8 7.8 1.9 11 -9.9 -5.2 -9.9 5.2 1.9 -11 -8 -7.8 11 -1.6z" fill="#ffd23f" stroke="#3b2a5a" strokeWidth="2.5" />
    </svg>
  )
}

const MODE_ART: Record<TowerModeId, ReactNode> = {
  build: <MiniFloors labels={['12', '35', '', '81']} ghost={2} />,
  secret: <MiniFloors labels={['20', '30', '40', '50']} hidden={2} />,
  lift: <MiniFloors labels={['100', '200', '300', '400']} lift={1} />,
  top: <MiniFloors labels={['1', '2', '3', '★']} />,
}

function TowerModes({ grade, onChoose, onExit }: { grade: Grade; onChoose: (m: TowerModeId) => void; onExit: () => void }) {
  const { play } = useApp()
  const { width, portrait } = useStage()
  const [soon, setSoon] = useState<string | null>(null)
  const cardW = portrait ? (width - 60 - 26) / 2 : (width - 120 - 78) / 4
  const nameSize = (name: string) => {
    const word = Math.max(...name.split(/\s+/).map((x) => x.length))
    return Math.max(16, Math.min(30, Math.floor((cardW - 40) / Math.max(Math.min(name.length, 16) * 0.64, word * 0.7))))
  }
  return (
    <div className="screen mode-select nt-modes">
      <TowerBackdrop />
      <div className="top-bar">
        <GameButton color="yellow" size="md" icon="map" onClick={onExit}>
          Към парка
        </GameButton>
        <GradeTicket grade={grade} />
        <div className="top-bar__spacer" />
        <SoundControl />
      </div>
      <div className="mode-select__body">
        <div className="mode-select__head">
          <h2 className="game-intro__title">Кулата на числата</h2>
          <MascotSays mood={soon ? 'think' : 'wave'} size={120}>
            {soon ?? (
              <>
                Числата от 0 до {fmt(RANGE_MAX[grade])} строят кула! <b>Избери игра.</b>
              </>
            )}
          </MascotSays>
        </div>
        <div className="mode-cards nt-mode-cards">
          {TOWER_MODES.map((m, i) => (
            <button
              key={m.id}
              type="button"
              className={`mode-card mode-card--${m.color} ${m.ready ? '' : 'is-soon'}`}
              style={{ animationDelay: `${i * 0.08}s` }}
              aria-label={m.ready ? m.label : `${m.label} — очаквай скоро`}
              onClick={() => {
                if (!m.ready) {
                  play('locked')
                  return setSoon(`„${m.label}“ идва скоро!`)
                }
                play('drop')
                onChoose(m.id)
              }}
            >
              <span className="mode-card__num">{i + 1}</span>
              <span className="mode-art">{MODE_ART[m.id]}</span>
              <FitName text={m.label} size={nameSize(m.label)} />
              <span className="mode-card__desc">{m.description}</span>
              {!m.ready && (
                <span className="mode-card__soon">
                  <Icon name="lock" size={16} /> Очаквай скоро
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

const ORDER_TEXT: Record<Difficulty, string> = {
  explorer: 'Винаги от най-малкото към най-голямото',
  researcher: 'Ту възходящо, ту низходящо',
  master: 'Редът се сменя — прочети заданието',
}
const NUMBERS_TEXT: Record<Difficulty, string> = {
  explorer: 'Числа, далеч едно от друго',
  researcher: 'Близки числа',
  master: 'Числа с едни и същи цифри',
}
const HELP_TEXT: Record<Difficulty, string> = {
  explorer: 'Подсказка: сравни две числа',
  researcher: 'Една подсказка за разрядите',
  master: 'Без подсказки',
}

const SECRET_ORDER_TEXT: Record<Difficulty, string> = {
  explorer: 'Етажите растат нагоре',
  researcher: 'Растат или намаляват',
  master: 'Растат или намаляват',
}
const SECRET_ANSWER_TEXT: Record<Difficulty, string> = {
  explorer: 'Избор от 3 числа · подсказка',
  researcher: 'Клавиатура · 1 подсказка',
  master: 'Клавиатура · без подсказки',
}

function TowerSetup(p: {
  grade: Grade
  difficulty: Difficulty
  count: number
  locked: boolean
  title: string
  resultMode: string
  info: ReactNode
  onDifficulty: (d: Difficulty) => void
  onCount: (n: number) => void
  onStart: () => void
  onBack: () => void
  onExit: () => void
}) {
  const { results, settings, play } = useApp()
  const pills = <T extends string | number>(label: string, value: T, options: { value: T; label: string; hint?: string }[], on: (v: T) => void) => (
    <div className="setup-row is-wide">
      <span className="setup-row__label">
        {label}
        {p.locked && <small> · избрано от учителя</small>}
      </span>
      <div className="setup-pills" role="radiogroup" aria-label={label}>
        {options.map((o) => (
          <button
            key={String(o.value)}
            type="button"
            role="radio"
            aria-checked={o.value === value}
            disabled={p.locked && o.value !== value}
            className={`setup-pill ${o.value === value ? 'is-on' : ''}`}
            title={o.hint}
            onClick={() => {
              if (p.locked) return
              play('pick')
              on(o.value)
            }}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  )
  return (
    <div className="screen game-setup nt-setup">
      <TowerBackdrop />
      <div className="top-bar">
        <GameButton color="yellow" size="md" icon="back" onClick={p.onBack}>
          Игри
        </GameButton>
        <GradeTicket grade={p.grade} />
        <div className="level-chip">{p.title}</div>
        <div className="top-bar__spacer" />
        <GameButton color="yellow" size="md" icon="map" onClick={p.onExit}>
          Към парка
        </GameButton>
        <SoundControl />
      </div>
      <div className="setup-card">
        <div className="setup-card__title">
          <NumberTowerArt size={84} />
          <span>{p.title}</span>
        </div>
        <div className="setup-grid">
          {pills(
            'Трудност',
            p.difficulty,
            DIFFICULTIES.map((x) => ({ value: x, label: DIFFICULTY_LABELS[x], hint: DIFFICULTY_DESCRIPTIONS[x] })),
            p.onDifficulty,
          )}
          {pills(
            'Брой задачи',
            p.count,
            [5, 10, 15].map((x) => ({ value: x, label: String(x) })),
            p.onCount,
          )}
          <div className="setup-row is-wide">
            <span className="setup-row__label">Какво те чака</span>
            <div className="wheel-setup-info">{p.info}</div>
          </div>
        </div>
        <div className="setup-card__footer">
          <span className="setup-card__best">
            Най-добър резултат:{' '}
            <StarRow
              stars={
                bestStars(
                  results.filter((r) => r.mode === p.resultMode),
                  GAME_ID,
                  p.grade,
                  p.difficulty,
                ) ?? 0
              }
              size={28}
            />
          </span>
          <span className="setup-card__meta">{settings.hintsOn ? 'С подсказки' : 'Подсказките са изключени'}</span>
          <GameButton color="green" size="xl" icon="play" onClick={p.onStart} className="game-intro__start">
            Започни
          </GameButton>
        </div>
      </div>
    </div>
  )
}
