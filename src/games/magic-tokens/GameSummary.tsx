import { Mascot } from '../../components/art/Mascot'
import { Confetti, StarRow } from '../../components/ui/Effects'
import { GameButton } from '../../components/ui/GameButton'
import { SoundControl } from '../../components/ui/SoundControl'
import { GradeTicket } from '../../components/ui/GradeTicket'
import { BoothBackdrop } from './BoothBackdrop'
import { DIFFICULTY_LABELS, type Difficulty, type Grade } from './logic'
import type { TaskOutcome } from './PlayBoard'

function formatDuration(sec: number): string {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return m > 0 ? `${m} мин. ${s} сек.` : `${s} сек.`
}

export function GameSummary({
  grade,
  difficulty,
  modeName,
  outcomes,
  durationSec,
  onAgain,
  onChooseLevel,
  onChooseMode,
  onExit,
}: {
  grade: Grade
  difficulty: Difficulty
  modeName?: string
  outcomes: TaskOutcome[]
  durationSec: number
  onAgain: () => void
  onChooseLevel: () => void
  onChooseMode?: () => void
  onExit: () => void
}) {
  const stars = outcomes.reduce((a, o) => a + o.stars, 0)
  const max = outcomes.length * 3
  const solved = outcomes.filter((o) => o.solved).length
  const firstTry = outcomes.filter((o) => o.firstTry).length
  const overall = Math.round((stars / max) * 3)
  const title = overall === 3 ? 'Ти си истински майстор!' : overall === 2 ? 'Чудесна игра!' : overall === 1 ? 'Добро начало!' : 'Опитай пак — ще успееш!'

  return (
    <div className="screen game-summary">
      <BoothBackdrop />
      {overall >= 2 && <Confetti count={80} seed={7} />}
      <div className="top-bar">
        <GradeTicket grade={grade} />
        <div className="top-bar__spacer" />
        <SoundControl />
      </div>
      <div className="summary-card">
        <Mascot mood={overall >= 2 ? 'cheer' : 'happy'} size={160} className="summary-card__mascot" />
        <div className="summary-card__title">{title}</div>
        <div className="summary-card__level">
          {grade}. клас · {modeName ? `${modeName} · ` : ''}
          {DIFFICULTY_LABELS[difficulty]}
        </div>
        <StarRow stars={overall} size={96} animate />
        <div className="summary-stats">
          <div className="summary-stat summary-stat--yellow">
            <span className="summary-stat__value">
              {stars}/{max}
            </span>
            <span className="summary-stat__label">звезди</span>
          </div>
          <div className="summary-stat summary-stat--green">
            <span className="summary-stat__value">
              {solved}/{outcomes.length}
            </span>
            <span className="summary-stat__label">решени задачи</span>
          </div>
          <div className="summary-stat summary-stat--pink">
            <span className="summary-stat__value">{firstTry}</span>
            <span className="summary-stat__label">от първия опит</span>
          </div>
          <div className="summary-stat summary-stat--turquoise">
            <span className="summary-stat__value summary-stat__value--small">{formatDuration(durationSec)}</span>
            <span className="summary-stat__label">време</span>
          </div>
        </div>
        <div className="summary-card__buttons">
          <GameButton color="green" size="lg" icon="refresh" onClick={onAgain}>
            Играй отново
          </GameButton>
          <GameButton color="turquoise" size="lg" icon="star" onClick={onChooseLevel}>
            Друго ниво
          </GameButton>
          {onChooseMode && (
            <GameButton color="purple" size="lg" icon="play" onClick={onChooseMode}>
              Друга игра
            </GameButton>
          )}
          <GameButton color="yellow" size="lg" icon="map" onClick={onExit}>
            Към парка
          </GameButton>
        </div>
      </div>
    </div>
  )
}
