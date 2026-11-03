import { useStage } from '../core/Stage'
import { Mascot } from '../components/art/Mascot'
import { TokenCoin } from '../components/art/TokenCoin'
import { Bunting, SkyAndHills, SkyDefs } from '../components/scenery/Scenery'
import { GameButton, RoundButton } from '../components/ui/GameButton'
import { SoundControl } from '../components/ui/SoundControl'
import { useApp } from '../core/AppContext'
import { DENOMINATIONS, type Grade } from '../games/magic-tokens/logic'

const GRADE_INFO: Record<Grade, { color: string; range: string }> = {
  2: { color: 'pink', range: 'Числа до 100' },
  3: { color: 'turquoise', range: 'Числа до 1000' },
  4: { color: 'purple', range: 'Числа до 100 000' },
}

/** Избор на клас — три големи билета за парка. */
export function GradeScreen({ selected, lastGrade, onSelect, onBack }: { selected: Grade; lastGrade?: Grade | null; onSelect: (g: Grade) => void; onBack: () => void }) {
  const { width: w, height: h } = useStage()
  const { play } = useApp()
  return (
    <div className={`screen grade-screen ${lastGrade ? 'has-continue' : ''}`}>
      <svg className="scene" width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
        <SkyDefs />
        <SkyAndHills w={w} h={h} horizon={h * 0.7} />
        <Bunting x1={-20} x2={w + 20} y={0} sag={40} count={18} />
      </svg>
      <div className="top-bar">
        <RoundButton icon="back" label="Назад" color="yellow" onClick={onBack} />
        <div className="top-bar__spacer" />
        <SoundControl />
      </div>
      <h2 className="screen-title">{lastGrade ? 'Добре дошъл отново!' : 'Избери своя клас'}</h2>
      <div className="tickets">
        {([2, 3, 4] as Grade[]).map((g, i) => (
          <button
            key={g}
            type="button"
            className={`ticket ticket--${GRADE_INFO[g].color} ${selected === g ? 'is-selected' : ''}`}
            style={{ animationDelay: `${i * 0.12}s` }}
            onClick={() => {
              play('drop')
              onSelect(g)
            }}
          >
            <span className="ticket__head">БИЛЕТ</span>
            <span className="ticket__grade">
              {g}
              <small>. клас</small>
            </span>
            <span className="ticket__range">{GRADE_INFO[g].range}</span>
            <span className="ticket__coins">
              {DENOMINATIONS[g].map((d) => (
                <TokenCoin key={d} value={d} size={g === 4 ? 50 : 46} />
              ))}
            </span>
          </button>
        ))}
      </div>
      {lastGrade && (
        <div className="grade-continue">
          <GameButton color="green" size="xl" icon="play" onClick={() => onSelect(lastGrade)} className="grade-continue__btn">
            Продължи с {lastGrade}. клас
          </GameButton>
          <span className="grade-continue__or">или докосни друг билет, за да смениш класа</span>
        </div>
      )}
      <div className="grade-screen__mascot">
        <Mascot mood="happy" size={150} />
      </div>
    </div>
  )
}
