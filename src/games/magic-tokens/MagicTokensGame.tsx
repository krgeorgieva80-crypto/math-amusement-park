import { useState } from 'react'
import { useApp } from '../../core/AppContext'
import { GameSetup } from './GameSetup'
import { GameSummary } from './GameSummary'
import { getLevelConfig, generateSession, type Grade, type Task } from './logic'
import { ModeSelect } from './ModeSelect'
import { PlayBoard, type TaskOutcome } from './PlayBoard'
import { GRADE_RANGES, generateTokenTasks, modeLabel, type ModeId, type TokenTask, type TokensConfig } from './tasks'
import { TokenBoard } from './TokenBoard'

const GAME_ID = 'magic-tokens'

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
export function MagicTokensGame({ grade, onGradeChange, onExit }: { grade: Grade; onGradeChange: (g: Grade) => void; onExit: () => void }) {
  const { settings, saveResult } = useApp()
  const locked = !settings.studentCanChoose
  const effectiveGrade = locked ? settings.grade : grade
  const [config, setConfig] = useState<TokensConfig>(() => ({
    grade: effectiveGrade,
    mode: 'compose',
    range: GRADE_RANGES[effectiveGrade][settings.tokensRange === 'small' ? 0 : 1],
    regrouping: settings.tokensRegrouping,
    difficulty: settings.difficulty,
    count: settings.taskCount,
    composeTopic: 'place',
    challenge: 'mixed',
  }))
  const [phase, setPhase] = useState<Phase>({ name: 'modes' })

  const changeConfig = (c: TokensConfig) => {
    if (c.grade !== config.grade) onGradeChange(c.grade)
    setConfig(c)
  }

  const start = (c: TokensConfig = config) => {
    if (c.mode === 'compose' && c.composeTopic === 'free') {
      const tasks = generateSession(getLevelConfig(c.grade, c.difficulty), c.count)
      setPhase({ name: 'play', kind: 'free', tasks, startedAt: Date.now() })
    } else {
      setPhase({ name: 'play', kind: 'tokens', tasks: generateTokenTasks(c), startedAt: Date.now() })
    }
  }

  const finish = (outcomes: TaskOutcome[], startedAt: number) => {
    const durationSec = Math.round((Date.now() - startedAt) / 1000)
    saveResult({
      game: GAME_ID,
      mode: modeLabel(config),
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
        <TokenBoard key={phase.startedAt} grade={config.grade} difficulty={config.difficulty} mode={config.mode} tasks={phase.tasks} onFinish={(o) => finish(o, phase.startedAt)} onExit={onExit} />
      )
    case 'summary':
      return (
        <GameSummary
          grade={config.grade}
          difficulty={config.difficulty}
          modeName={modeLabel(config)}
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
