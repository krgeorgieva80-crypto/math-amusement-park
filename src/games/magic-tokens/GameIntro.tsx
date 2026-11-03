import { useState } from 'react'
import { useApp } from '../../core/AppContext'
import { bestStars } from '../../core/storage'
import { MagicTokensArt } from '../../components/art/Attractions'
import { MascotSays } from '../../components/art/Mascot'
import { TokenCoin } from '../../components/art/TokenCoin'
import { StarRow } from '../../components/ui/Effects'
import { GameButton } from '../../components/ui/GameButton'
import { SoundControl } from '../../components/ui/SoundControl'
import { BoothBackdrop } from './BoothBackdrop'
import { DENOMINATIONS, DIFFICULTIES, DIFFICULTY_DESCRIPTIONS, DIFFICULTY_LABELS, formatNumber, getLevelConfig, type Difficulty, type Grade } from './logic'

const LEVEL_COLORS: Record<Difficulty, string> = { explorer: 'green', researcher: 'turquoise', master: 'pink' }

export function GameIntro({ grade, initial, onStart, onExit }: { grade: Grade; initial: Difficulty; onStart: (d: Difficulty) => void; onExit: () => void }) {
  const { settings, results, play } = useApp()
  const [selected, setSelected] = useState<Difficulty>(initial)
  const choices = settings.studentCanChoose ? DIFFICULTIES : [settings.difficulty]

  return (
    <div className="screen game-intro">
      <BoothBackdrop />
      <div className="top-bar">
        <GameButton color="yellow" size="md" icon="map" onClick={onExit}>
          Към парка
        </GameButton>
        <div className="top-bar__spacer" />
        <SoundControl />
      </div>

      <div className="game-intro__body">
        <div className="game-intro__hero">
          <MagicTokensArt size={250} />
          <h2 className="game-intro__title">Вълшебните жетони</h2>
          <div className="game-intro__coins">
            {DENOMINATIONS[grade].map((d) => (
              <TokenCoin key={d} value={d} size={66} />
            ))}
          </div>
        </div>

        <div className="game-intro__right">
          <MascotSays mood="happy" size={130}>
            Състави числото от таблото с вълшебни жетони! <b>Влачи</b> ги или просто ги <b>докосни</b>, за да ги сложиш в зоната.
          </MascotSays>
          <div className="level-cards">
            {choices.map((d) => {
              const cfg = getLevelConfig(grade, d)
              const best = bestStars(results, 'magic-tokens', grade, d)
              return (
                <button
                  key={d}
                  type="button"
                  className={`level-card level-card--${LEVEL_COLORS[d]} ${selected === d ? 'is-selected' : ''}`}
                  onClick={() => {
                    play('pick')
                    setSelected(d)
                  }}
                >
                  <span className="level-card__name">{DIFFICULTY_LABELS[d]}</span>
                  <span className="level-card__desc">{DIFFICULTY_DESCRIPTIONS[d]}</span>
                  <span className="level-card__range">
                    {formatNumber(cfg.min)} – {formatNumber(cfg.max)}
                  </span>
                  <StarRow stars={best ?? 0} size={30} />
                </button>
              )
            })}
          </div>
          <GameButton color="green" size="xl" icon="play" onClick={() => onStart(selected)} className="game-intro__start">
            Започни
          </GameButton>
          <div className="game-intro__meta">
            {settings.taskCount} задачи · {settings.hintsOn ? 'с подсказки' : 'без подсказки'}
          </div>
        </div>
      </div>
    </div>
  )
}
