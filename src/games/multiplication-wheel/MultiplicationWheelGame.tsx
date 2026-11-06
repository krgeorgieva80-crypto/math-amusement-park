import { useState, type ReactNode } from 'react'
import { useApp } from '../../core/AppContext'
import { useStage } from '../../core/Stage'
import { bestStars, type TaskCount } from '../../core/storage'
import { FerrisWheelArt } from '../../components/art/Attractions'
import { MascotSays } from '../../components/art/Mascot'
import { StarRow } from '../../components/ui/Effects'
import { GameButton } from '../../components/ui/GameButton'
import { GradeTicket } from '../../components/ui/GradeTicket'
import { Icon } from '../../components/ui/Icon'
import { SoundControl } from '../../components/ui/SoundControl'
import { BoothBackdrop } from '../magic-tokens/BoothBackdrop'
import { GameSummary } from '../magic-tokens/GameSummary'
import { DIFFICULTIES, DIFFICULTY_DESCRIPTIONS, DIFFICULTY_LABELS, type Difficulty, type Grade } from '../magic-tokens/logic'
import type { TaskOutcome } from '../magic-tokens/PlayBoard'
import { EqualGroupsBoard } from './EqualGroupsBoard'
import { WHEEL_MODES, generateGroupsTasks, groupsLevel, type GroupsTask, type WheelModeId } from './logic'
import { generateSpinTasks, type SpinTask } from './spin/logic'
import { SpinBoard } from './spin/SpinBoard'
import { SpinModeArt } from './spin/SpinModeArt'
import { SPIN_RESULT_MODE, SpinSetup } from './spin/SpinSetup'
import { ACTIVITIES, generateTableTasks, type ActivityId, type TableTask } from './table/logic'
import { TableModeArt } from './table/TableModeArt'
import { TablePlay } from './table/TablePlay'
import { TABLE_RESULT_MODE, TableSetup } from './table/TableSetup'

const GAME_ID = 'multiplication-wheel'
const nowMs = () => Date.now()
const MODE_COLORS: Record<WheelModeId, string> = { equalGroups: 'turquoise', spin: 'pink', table: 'green', challenge: 'purple' }

/** Само при разработка: ?testWheel=4x3,2x5 (кабинки × деца) за автоматизираните тестове. */
function testTasks(): GroupsTask[] | null {
  if (!import.meta.env.DEV) return null
  const raw = new URLSearchParams(window.location.search).get('testWheel')
  if (!raw) return null
  return raw.split(',').map((p, i) => {
    const [groups, size] = p.split('x').map(Number)
    return { id: i + 1, groups, size, kind: 'fill' as const, start: new Array(groups).fill(0) }
  })
}

const GROUPS_RESULT_MODE = 'Колелото: Открий равните групи'

/** Само при разработка: ?testSpin=3x7,2x5m,4x6s (таблица × множител; s — разменени, m — липсващ). */
function testSpinTasks(): SpinTask[] | null {
  if (!import.meta.env.DEV) return null
  const raw = new URLSearchParams(window.location.search).get('testSpin')
  if (!raw) return null
  return raw.split(',').map((q, i) => {
    const kind = q.endsWith('s') ? ('swapped' as const) : q.endsWith('m') ? ('missing' as const) : ('normal' as const)
    const [table, multiplier] = q.replace(/[sm]$/, '').split('x').map(Number)
    return { id: i + 1, table, multiplier, kind }
  })
}

type PlayMode = 'equalGroups' | 'spin' | 'table'

type Phase =
  | { name: 'modes' }
  | { name: 'setup' }
  | { name: 'play'; tasks: GroupsTask[]; startedAt: number }
  | { name: 'spin'; tasks: SpinTask[]; startedAt: number }
  | { name: 'table'; tasks: TableTask[]; startedAt: number }
  | { name: 'summary'; outcomes: TaskOutcome[]; durationSec: number }

/** „Колелото на умножението“: режими → настройки → задачи → обобщение. */
export function MultiplicationWheelGame({ grade, onExit }: { grade: Grade; onExit: () => void }) {
  const { settings, updateSettings, saveResult } = useApp()
  const locked = !settings.studentCanChoose
  // Единствен източник: изборът в екрана на играта се запазва в общите настройки.
  const setDifficulty = (difficulty: Difficulty) => updateSettings({ difficulty })
  const setCount = (n: number) => updateSettings({ taskCount: (n === 5 || n === 15 ? n : 10) as TaskCount })
  const [phase, setPhase] = useState<Phase>({ name: 'modes' })
  const [mode, setMode] = useState<PlayMode>('equalGroups')
  const spinTables = settings.spinTables[grade]
  const [spinTable, setSpinTable] = useState<number>(spinTables[spinTables.length - 1])
  const table = spinTables.includes(spinTable) ? spinTable : spinTables[spinTables.length - 1]
  const d = settings.difficulty
  const n = settings.taskCount
  // карта 3: маршрут по подразбиране или отделна дейност
  const [activity, setActivity] = useState<ActivityId | 'route'>('route')
  const tableModeName = activity === 'route' ? 'Попълни таблицата' : `Попълни таблицата: ${ACTIVITIES.find((a) => a.id === activity)!.short}`

  const start = () =>
    mode === 'table'
      ? setPhase({ name: 'table', tasks: generateTableTasks(d, { tables: spinTables, zero: settings.spinZero }, table, activity, n), startedAt: nowMs() })
      : mode === 'spin'
      ? setPhase({ name: 'spin', tasks: testSpinTasks() ?? generateSpinTasks(d, { tables: spinTables, zero: settings.spinZero, missing: settings.spinMissing }, table, n), startedAt: nowMs() })
      : setPhase({ name: 'play', tasks: testTasks() ?? generateGroupsTasks(grade, d, n), startedAt: nowMs() })

  const finish = (outcomes: TaskOutcome[], startedAt: number) => {
    const durationSec = Math.round((nowMs() - startedAt) / 1000)
    saveResult({
      game: GAME_ID,
      mode: mode === 'table' ? (activity === 'route' ? TABLE_RESULT_MODE : `${TABLE_RESULT_MODE} — ${ACTIVITIES.find((a) => a.id === activity)!.short}`) : mode === 'spin' ? SPIN_RESULT_MODE : GROUPS_RESULT_MODE,
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
        <WheelModes
          grade={grade}
          onChoose={(m) => {
            setMode(m === 'spin' ? 'spin' : m === 'table' ? 'table' : 'equalGroups')
            setPhase({ name: 'setup' })
          }}
          onExit={onExit}
        />
      )
    case 'setup':
      if (mode === 'table')
        return (
          <TableSetup
            grade={grade}
            gameId={GAME_ID}
            difficulty={d}
            count={n}
            locked={locked}
            tables={spinTables}
            table={table}
            activity={activity}
            onDifficulty={setDifficulty}
            onCount={setCount}
            onTable={setSpinTable}
            onActivity={setActivity}
            onStart={start}
            onBack={() => setPhase({ name: 'modes' })}
            onExit={onExit}
          />
        )
      if (mode === 'spin')
        return (
          <SpinSetup
            grade={grade}
            gameId={GAME_ID}
            difficulty={d}
            count={n}
            locked={locked}
            tables={spinTables}
            table={table}
            onDifficulty={setDifficulty}
            onCount={setCount}
            onTable={setSpinTable}
            onStart={start}
            onBack={() => setPhase({ name: 'modes' })}
            onExit={onExit}
          />
        )
      return (
        <WheelSetup
          grade={grade}
          difficulty={d}
          count={n}
          locked={locked}
          onDifficulty={setDifficulty}
          onCount={setCount}
          onStart={start}
          onBack={() => setPhase({ name: 'modes' })}
          onExit={onExit}
        />
      )
    case 'play':
      return <EqualGroupsBoard key={phase.startedAt} grade={grade} difficulty={d} tasks={phase.tasks} onFinish={(o) => finish(o, phase.startedAt)} onExit={onExit} />
    case 'spin':
      return <SpinBoard key={phase.startedAt} grade={grade} difficulty={d} tasks={phase.tasks} zero={settings.spinZero} onFinish={(o) => finish(o, phase.startedAt)} onExit={onExit} />
    case 'table':
      return <TablePlay key={phase.startedAt} grade={grade} difficulty={d} tasks={phase.tasks} onFinish={(o) => finish(o, phase.startedAt)} onExit={onExit} />
    case 'summary':
      return (
        <GameSummary
          grade={grade}
          difficulty={d}
          modeName={mode === 'table' ? tableModeName : mode === 'spin' ? 'Завърти колелото' : 'Открий равните групи'}
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

/** Малки илюстрации за картите на режимите. */
function ModeArt({ mode }: { mode: WheelModeId }): ReactNode {
  switch (mode) {
    case 'equalGroups':
      return (
        <svg viewBox="0 0 200 120" width="210" height="126" aria-hidden="true">
          {/* 3 кабинки по 2 деца: 2 + 2 + 2 = 2 · 3 (събираемо · брой повторения) */}
          {[0, 1, 2].map((g) => (
            <g key={g} transform={`translate(${20 + g * 62} 20)`}>
              <path d="M-4 10 Q26 -2 56 10 Z" fill={['#ff5fa2', '#ffd23f', '#2ed1c4'][g]} stroke="#3b2a5a" strokeWidth="3" />
              <rect x="0" y="9" width="52" height="56" rx="12" fill="#fffaf0" stroke="#3b2a5a" strokeWidth="3.5" />
              {[0, 1].map((k) => (
                <circle key={k} cx={14 + k * 24} cy={38} r="9" fill="#ffcf9e" stroke="#3b2a5a" strokeWidth="2" />
              ))}
            </g>
          ))}
          <text x="100" y="112" textAnchor="middle" className="art-text" fontSize="22" fill="#5e2fb0">
            2 + 2 + 2 = 2 · 3
          </text>
        </svg>
      )
    case 'spin':
      return <SpinModeArt />
    case 'table':
      return <TableModeArt />
    case 'challenge':
      return (
        <svg viewBox="0 0 160 120" width="170" height="128" aria-hidden="true">
          <circle cx="80" cy="58" r="46" fill="#ffd23f" stroke="#3b2a5a" strokeWidth="5" />
          <text x="80" y="80" textAnchor="middle" className="art-text" fontSize="62" fill="#9b5de5">
            ?
          </text>
        </svg>
      )
  }
}

function WheelModes({ grade, onChoose, onExit }: { grade: Grade; onChoose: (m: WheelModeId) => void; onExit: () => void }) {
  const { play } = useApp()
  const { width, portrait } = useStage()
  const [soon, setSoon] = useState<string | null>(null)
  const cardW = portrait ? (width - 60 - 26) / 2 : (width - 120 - 78) / 4
  const nameSize = (name: string) => Math.max(18, Math.min(30, Math.floor((cardW - 40) / (Math.min(name.length, 16) * 0.64))))
  return (
    <div className="screen mode-select wheel-modes">
      <BoothBackdrop />
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
          <h2 className="game-intro__title">Колелото на умножението</h2>
          <MascotSays mood={soon ? 'think' : 'wave'} size={120}>
            {soon ?? (
              <>
                Качи децата в кабинките! <b>Избери игра.</b>
              </>
            )}
          </MascotSays>
        </div>
        <div className="mode-cards">
          {WHEEL_MODES.map((m, i) => (
            <button
              key={m.id}
              type="button"
              className={`mode-card mode-card--${MODE_COLORS[m.id]} ${m.ready ? '' : 'is-soon'}`}
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
              <span className="mode-art mode-art--wheel">
                <ModeArt mode={m.id} />
              </span>
              <span className="mode-card__name" style={{ fontSize: nameSize(m.label) }}>
                {m.label}
              </span>
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

function WheelSetup(p: {
  grade: Grade
  difficulty: Difficulty
  count: number
  locked: boolean
  onDifficulty: (d: Difficulty) => void
  onCount: (n: number) => void
  onStart: () => void
  onBack: () => void
  onExit: () => void
}) {
  const { results, settings, play } = useApp()
  const lv = groupsLevel(p.grade, p.difficulty)
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
  const kindText = { fill: 'Празни кабинки — сложи по равно', fix: 'Неравни кабинки — изравни ги', match: 'Направи всички като първата' }[lv.kind]
  return (
    <div className="screen game-setup">
      <BoothBackdrop />
      <div className="top-bar">
        <GameButton color="yellow" size="md" icon="back" onClick={p.onBack}>
          Игри
        </GameButton>
        <GradeTicket grade={p.grade} />
        <div className="level-chip">Открий равните групи</div>
        <div className="top-bar__spacer" />
        <GameButton color="yellow" size="md" icon="map" onClick={p.onExit}>
          Към парка
        </GameButton>
        <SoundControl />
      </div>
      <div className="setup-card">
        <div className="setup-card__title">
          <FerrisWheelArt size={84} />
          <span>Открий равните групи</span>
        </div>
        <div className="setup-grid">
          {pills(
            'Трудност',
            p.difficulty,
            DIFFICULTIES.map((x) => ({ value: x, label: DIFFICULTY_LABELS[x], hint: DIFFICULTY_DESCRIPTIONS[x] })),
            p.onDifficulty,
          )}
          {pills('Брой задачи', p.count, [5, 10, 15].map((x) => ({ value: x, label: String(x) })), p.onCount)}
          <div className="setup-row is-wide">
            <span className="setup-row__label">Какво те чака</span>
            <div className="wheel-setup-info">
              <span>
                {lv.groups[0]}–{lv.groups[1]} кабинки
              </span>
              <span>
                по {lv.size[0]}–{lv.size[1]} деца
              </span>
              <span>{kindText}</span>
            </div>
          </div>
        </div>
        <div className="setup-card__footer">
          <span className="setup-card__best">
            Най-добър резултат: <StarRow stars={bestStars(results.filter((r) => (r.mode ?? GROUPS_RESULT_MODE) === GROUPS_RESULT_MODE), GAME_ID, p.grade, p.difficulty) ?? 0} size={28} />
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
