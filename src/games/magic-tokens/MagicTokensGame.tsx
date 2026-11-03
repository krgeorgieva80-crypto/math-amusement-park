import { useState } from 'react'
import { useApp } from '../../core/AppContext'
import { getLevelConfig, generateSession, type Difficulty, type Grade, type Task } from './logic'
import { GameIntro } from './GameIntro'
import { PlayBoard, type TaskOutcome } from './PlayBoard'
import { GameSummary } from './GameSummary'

export const GAME_ID = 'magic-tokens'

type Phase = { name: 'intro' } | { name: 'play'; tasks: Task[]; startedAt: number } | { name: 'summary'; outcomes: TaskOutcome[]; durationSec: number }

/** Игра „Вълшебните жетони“: въведение → задачи → обобщение. */
export function MagicTokensGame({ grade, onExit }: { grade: Grade; onExit: () => void }) {
  const { settings, saveResult } = useApp()
  const [difficulty, setDifficulty] = useState<Difficulty>(settings.difficulty)
  const [phase, setPhase] = useState<Phase>({ name: 'intro' })

  const start = (d: Difficulty) => {
    setDifficulty(d)
    const tasks = generateSession(getLevelConfig(grade, d), settings.taskCount)
    setPhase({ name: 'play', tasks, startedAt: Date.now() })
  }

  const finish = (outcomes: TaskOutcome[], startedAt: number) => {
    const durationSec = Math.round((Date.now() - startedAt) / 1000)
    saveResult({
      game: GAME_ID,
      grade,
      difficulty,
      total: outcomes.length,
      solved: outcomes.filter((o) => o.solved).length,
      firstTry: outcomes.filter((o) => o.firstTry).length,
      stars: outcomes.reduce((a, o) => a + o.stars, 0),
      maxStars: outcomes.length * 3,
      durationSec,
    })
    setPhase({ name: 'summary', outcomes, durationSec })
  }

  if (phase.name === 'intro') {
    return <GameIntro grade={grade} initial={difficulty} onStart={start} onExit={onExit} />
  }
  if (phase.name === 'play') {
    return (
      <PlayBoard
        key={phase.startedAt}
        grade={grade}
        difficulty={difficulty}
        tasks={phase.tasks}
        onFinish={(o) => finish(o, phase.startedAt)}
        onExit={onExit}
      />
    )
  }
  return (
    <GameSummary
      grade={grade}
      difficulty={difficulty}
      outcomes={phase.outcomes}
      durationSec={phase.durationSec}
      onAgain={() => start(difficulty)}
      onChooseLevel={() => setPhase({ name: 'intro' })}
      onExit={onExit}
    />
  )
}
