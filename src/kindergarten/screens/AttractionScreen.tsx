import { useEffect } from 'react'
import { Icon } from '../../components/ui/Icon'
import { useStage } from '../../core/Stage'
import { Bear } from '../art/Bears'
import { Giant } from '../art/GiantsArt'
import { KG_ATTRACTION_ART } from '../art/KgAttractions'
import { ChooserScene } from '../art/KgScenery'
import { ACTIVITIES } from '../curriculum/activities'
import { attractionById, coreById } from '../curriculum/structure'
import type { KgAttractionId } from '../curriculum/types'
import { useKg } from '../KgContext'
import { KgTopBar } from './KgTopBar'

/** Вход на атракция: илюстрация, кратко представяне и игрите за текущата група. */
export function AttractionScreen({
  id,
  onBack,
  onPlay,
  onTeacher,
  onGroup,
}: {
  id: KgAttractionId
  onBack: () => void
  onPlay: (activityId: string) => void
  onTeacher: () => void
  onGroup: () => void
}) {
  const { width: w, height: h } = useStage()
  const { group, play, say, hasVoice } = useKg()
  const a = attractionById(id)
  const Art = KG_ATTRACTION_ART[id]
  const games = ACTIVITIES.filter((x) => x.attraction === id && x.group === group)
  const intro = `kg.attr.${id}`
  useEffect(() => {
    say(intro)
  }, [intro]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="screen kg-screen kg-attraction" data-attraction={id}>
      <ChooserScene w={w} h={h} />
      <KgTopBar onBack={onBack} backLabel="Към картата" onGroup={onGroup} onTeacher={onTeacher} />
      <div className="kg-attraction__body">
        <div className="kg-attraction__hero">
          <svg viewBox="0 0 240 240" className="kg-attraction__art" aria-hidden="true">
            <Art size={240} />
          </svg>
        </div>
        <div className="kg-attraction__info">
          <h1 className="kg-attraction__name" style={{ borderColor: a.color }}>
            {a.name}
          </h1>
          <p className="kg-attraction__intro">
            {a.intro}
            {hasVoice(intro) && (
              <button type="button" className="kg-listen" onClick={() => say(intro)} aria-label="Чуй отново" title="Чуй отново">
                <Icon name="sound" size={34} />
              </button>
            )}
          </p>
          <p className="kg-attraction__core">{coreById(a.core).name}</p>
          <div className="kg-games">
            {games.map((g) =>
              g.status === 'ready' ? (
                <button
                  key={g.id}
                  type="button"
                  className="kg-game-card is-ready"
                  data-activity={g.id}
                  onClick={() => {
                    play('click')
                    onPlay(g.id)
                  }}
                >
                  <span className="kg-game-card__art" aria-hidden="true">
                    {g.id === 'giant-boots' ? <Giant mood="hopeful" size={104} /> : <Bear id="mid" mood="hungry" size={130} />}
                  </span>
                  <span className="kg-game-card__title">{g.title}</span>
                  <span className="kg-game-card__go">
                    <Icon name="play" size={36} /> Играй
                  </span>
                </button>
              ) : (
                <div key={g.id} className="kg-game-card is-planned" data-activity={g.id} aria-disabled="true">
                  <span className="kg-game-card__lock" aria-hidden="true">
                    <Icon name="lock" size={48} />
                  </span>
                  <span className="kg-game-card__title">{g.title}</span>
                  <span className="kg-game-card__soon">Подготвя се</span>
                </div>
              ),
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
