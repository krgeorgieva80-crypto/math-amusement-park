import type { CSSProperties } from 'react'
import { FerrisWheelArt, NumberTowerArt } from '../components/art/Attractions'
import { Mascot } from '../components/art/Mascot'
import { SoundControl } from '../components/ui/SoundControl'
import { Icon } from '../components/ui/Icon'
import { useApp } from '../core/AppContext'
import { PARKS, type ParkId } from '../core/audiences'
import { useStage } from '../core/Stage'
import { Bear } from '../kindergarten/art/Bears'
import { CarouselArt } from '../kindergarten/art/KgAttractions'
import { ChooserScene } from '../kindergarten/art/KgScenery'

/** Начален екран: избор между приказния парк (детска градина) и увеселителния парк (начално училище). */
export function ParkChooser({ onChoose }: { onChoose: (p: ParkId) => void }) {
  const { width: w, height: h, portrait, scale } = useStage()
  const { play } = useApp()
  const choose = (p: ParkId) => {
    play('click')
    onChoose(p)
  }
  return (
    <div className={`screen park-chooser ${portrait ? 'is-portrait' : ''}`} style={{ '--kg-s': scale } as CSSProperties}>
      <ChooserScene w={w} h={h} />
      <div className="park-chooser__top-right">
        <SoundControl />
      </div>
      <header className="park-chooser__head">
        <Mascot mood="wave" size={portrait ? 150 : 130} className="park-chooser__mascot" />
        <h1 className="park-chooser__title">Добре дошли! Къде ще играем днес?</h1>
      </header>
      <div className="park-chooser__cards">
        {PARKS.map((p) => (
          <button key={p.id} type="button" className={`park-card park-card--${p.id}`} onClick={() => choose(p.id)} data-park={p.id}>
            <span className="park-card__art" aria-hidden="true">
              {p.id === 'kindergarten' ? (
                <svg viewBox="0 0 420 260" className="park-card__svg">
                  <CarouselArt x={20} y={0} size={250} />
                  <g transform="translate(262 92)">
                    <Bear id="small" mood="happy" size={150} />
                  </g>
                </svg>
              ) : (
                <svg viewBox="0 0 420 260" className="park-card__svg">
                  <FerrisWheelArt x={30} y={10} size={240} />
                  <NumberTowerArt x={250} y={50} size={200} />
                </svg>
              )}
            </span>
            <span className="park-card__title">{p.title}</span>
            <span className="park-card__audience">{p.audience}</span>
            <span className="park-card__go">
              <Icon name="play" size={34} /> Влез
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
