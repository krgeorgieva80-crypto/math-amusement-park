import { useState } from 'react'
import { useApp } from '../../core/AppContext'
import type { TaskCount } from '../../core/storage'
import { GameSetup } from './GameSetup'
import { GameSummary } from './GameSummary'
import { getLevelConfig, generateSession, type Grade, type Task } from './logic'
import { ModeSelect } from './ModeSelect'
import { PlayBoard, type TaskOutcome } from './PlayBoard'
import { GRADE_RANGES, configForGrade, generateTokenTasks, modeLabel, rangePlaces, type ModeId, type TokenTask, type TokensConfig } from './tasks'
import { TokenBoard } from './TokenBoard'

const GAME_ID = 'magic-tokens'
/**
 * Само при разработка: ?testAdd=30+4,24+13 или ?testSub=100-71 задава точни
 * задачи за автоматизираните тестове. В production сборката този код липсва.
 */
function testAddTasks(c: TokensConfig): TokenTask[] | null {
  if (!import.meta.env.DEV || (c.mode !== 'add' && c.mode !== 'subtract')) return null
  const params = new URLSearchParams(window.location.search)
  const raw = c.mode === 'add' ? params.get('testAdd') : params.get('testSub')
  if (!raw) return null
  return raw.split(',').map((pair, i) => {
    const [a, b] = pair.split(c.mode === 'add' ? '+' : '-').map(Number)
    return { kind: c.mode as 'add' | 'subtract', id: i + 1, a, b, places: rangePlaces(c.range) }
  })
}

/** Текущо време (вика се само от обработчици на събития). */
const nowMs = () => Date.now()

type Phase =
  | { name: 'modes' }
  | { name: 'setup' }
  | { name: 'play'; startedAt: number; kind: 'free'; tasks: Task[] }
  | { name: 'play'; startedAt: number; kind: 'tokens'; tasks: TokenTask[] }
  | { name: 'summary'; outcomes: TaskOutcome[]; durationSec: number }

/**
 * „Вълшебните жетони“: избор на режим → настройки → задачи → обобщение.
 * Режимът „С различни жетони“ е досегашната игра за съставяне на числа.
 */
export function MagicTokensGame({ grade, onExit }: { grade: Grade; onExit: () => void }) {
  const { settings, updateSettings, saveResult } = useApp()
  // Класът идва само от общото състояние (избран веднъж с билетите).
  const [stored, setConfig] = useState<TokensConfig>(() => ({
    grade,
    mode: 'compose',
    range: GRADE_RANGES[grade][settings.tokensRange === 'small' ? 0 : 1],
    regrouping: settings.tokensRegrouping,
    difficulty: settings.difficulty,
    count: settings.taskCount,
    composeTopic: 'place',
    challenge: 'mixed',
  }))
  const [phase, setPhase] = useState<Phase>({ name: 'modes' })
  // Единствен източник: трудност, брой задачи, обхват и преминаване идват от общите
  // настройки (избират се в екрана на играта); режимът и видът задачи — от екрана.
  const config = configForGrade(
    {
      ...stored,
      difficulty: settings.difficulty,
      count: settings.taskCount,
      regrouping: settings.tokensRegrouping,
      range: GRADE_RANGES[grade][settings.tokensRange === 'small' ? 0 : 1],
    },
    grade,
    settings.tokensRange,
  )
  const changeConfig = (c: TokensConfig) => {
    setConfig(c)
    updateSettings({
      difficulty: c.difficulty,
      taskCount: (c.count === 5 || c.count === 15 ? c.count : 10) as TaskCount,
      tokensRegrouping: c.regrouping,
      tokensRange: GRADE_RANGES[grade].indexOf(c.range) === 0 ? 'small' : 'large',
    })
  }

  const start = (c: TokensConfig = config) => {
    if (c.mode === 'compose' && c.composeTopic === 'free') {
      const tasks = generateSession(getLevelConfig(c.grade, c.difficulty), c.count)
      setPhase({ name: 'play', kind: 'free', tasks, startedAt: nowMs() })
    } else {
      setPhase({ name: 'play', kind: 'tokens', tasks: testAddTasks(c) ?? generateTokenTasks(c), startedAt: nowMs() })
    }
  }

  const finish = (outcomes: TaskOutcome[], startedAt: number) => {
    const durationSec = Math.round((nowMs() - startedAt) / 1000)
    saveResult({
      game: GAME_ID,
      mode: modeLabel(config, settings.tokensWorkMode),
      grade: config.grade,
      difficulty: config.difficulty,
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
        <ModeSelect
          grade={config.grade}
          onChoose={(mode: ModeId) => {
            setConfig({ ...config, mode })
            setPhase({ name: 'setup' })
          }}
          onExit={onExit}
        />
      )
    case 'setup':
      return <GameSetup config={config} onChange={changeConfig} onStart={() => start()} onBack={() => setPhase({ name: 'modes' })} onExit={onExit} />
    case 'play':
      return phase.kind === 'free' ? (
        <PlayBoard key={phase.startedAt} grade={config.grade} difficulty={config.difficulty} tasks={phase.tasks} onFinish={(o) => finish(o, phase.startedAt)} onExit={onExit} />
      ) : (
        <TokenBoard key={phase.startedAt} grade={config.grade} difficulty={config.difficulty} mode={config.mode} tasks={phase.tasks} workMode={settings.tokensWorkMode} onFinish={(o) => finish(o, phase.startedAt)} onExit={onExit} />
      )
    case 'summary':
      return (
        <GameSummary
          grade={config.grade}
          difficulty={config.difficulty}
          modeName={modeLabel(config, settings.tokensWorkMode)}
          outcomes={phase.outcomes}
          durationSec={phase.durationSec}
          onAgain={() => start()}
          onChooseLevel={() => setPhase({ name: 'setup' })}
          onChooseMode={() => setPhase({ name: 'modes' })}
          onExit={onExit}
        />
      )
  }
}
