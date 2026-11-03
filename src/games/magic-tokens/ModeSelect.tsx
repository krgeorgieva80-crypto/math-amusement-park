import { useApp } from '../../core/AppContext'
import { MascotSays } from '../../components/art/Mascot'
import { TokenCoin } from '../../components/art/TokenCoin'
import { GameButton } from '../../components/ui/GameButton'
import { SoundControl } from '../../components/ui/SoundControl'
import { BoothBackdrop } from './BoothBackdrop'
import type { Grade } from './logic'
import { MODE_DESCRIPTIONS, MODE_LABELS, type ModeId } from './tasks'

const MODES: { id: ModeId; color: string }[] = [
  { id: 'compose', color: 'turquoise' },
  { id: 'add', color: 'green' },
  { id: 'subtract', color: 'pink' },
  { id: 'challenge', color: 'purple' },
]

/** Малка илюстрация от жетони за всеки режим. */
function ModeArt({ mode }: { mode: ModeId }) {
  const coin = (v: number, x: number, y: number, s = 56) => (
    <span className="mode-art__coin" style={{ left: x, top: y }}>
      <TokenCoin value={v} size={s} />
    </span>
  )
  switch (mode) {
    case 'compose':
      return (
        <span className="mode-art">
          {[0, 1].map((i) => coin(100, 22, 70 - i * 14))}
          {[0, 1, 2, 3].map((i) => coin(10, 87, 70 - i * 14))}
          {[0, 1, 2].map((i) => coin(1, 152, 70 - i * 14))}
          <span className="mode-art__labels">
            <span>С</span>
            <span>Д</span>
            <span>Е</span>
          </span>
        </span>
      )
    case 'add':
      return (
        <span className="mode-art">
          {coin(10, 10, 40)}
          {coin(1, 40, 60)}
          <span className="mode-art__sign">+</span>
          {coin(10, 150, 40)}
          {coin(1, 180, 60)}
        </span>
      )
    case 'subtract':
      return (
        <span className="mode-art">
          {coin(10, 30, 60)}
          {coin(10, 30, 44)}
          {coin(10, 30, 28)}
          <span className="mode-art__sign">−</span>
          <span className="mode-art__flying">{coin(1, 150, 30)}</span>
          {coin(1, 170, 70)}
        </span>
      )
    case 'challenge':
      return (
        <span className="mode-art">
          {coin(100, 0, 64)}
          <span className="mode-art__q">?</span>
          {coin(10, 174, 64)}
        </span>
      )
  }
}

export function ModeSelect({ grade, onChoose, onExit }: { grade: Grade; onChoose: (m: ModeId) => void; onExit: () => void }) {
  const { play } = useApp()
  return (
    <div className="screen mode-select">
      <BoothBackdrop />
      <div className="top-bar">
        <GameButton color="yellow" size="md" icon="map" onClick={onExit}>
          Към парка
        </GameButton>
        <div className="level-chip">{grade}. клас</div>
        <div className="top-bar__spacer" />
        <SoundControl />
      </div>
      <div className="mode-select__body">
        <div className="mode-select__head">
          <h2 className="game-intro__title">Вълшебните жетони</h2>
          <MascotSays mood="wave" size={120}>
            Как ще играем днес? <b>Избери игра!</b>
          </MascotSays>
        </div>
        <div className="mode-cards">
          {MODES.map((m, i) => (
            <button
              key={m.id}
              type="button"
              className={`mode-card mode-card--${m.color}`}
              style={{ animationDelay: `${i * 0.08}s` }}
              onClick={() => {
                play('drop')
                onChoose(m.id)
              }}
            >
              <span className="mode-card__num">{i + 1}</span>
              <ModeArt mode={m.id} />
              <span className="mode-card__name">{MODE_LABELS[m.id]}</span>
              <span className="mode-card__desc">{MODE_DESCRIPTIONS[m.id]}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
